import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

export type TargetLanguage = 'vi' | 'en'

export type TranslationBody = {
  word: string
  translation: string
  ipa: string
  partOfSpeech: string
  meaningInContext: string
  exampleSentence: string
}

export type GetUserResult = {
  data: { user: { id: string; email?: string } | null }
  error: { message: string } | null
}

export type GetUserFn = (token: string) => Promise<GetUserResult>

export type FetcherFn = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>

export type HandlerDeps = {
  fetcher: FetcherFn
  getUser: GetUserFn
  geminiApiKey?: string
  now?: () => number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

type CacheEntry = {
  body: TranslationBody
  expiresAt: number
}

// Module-scoped: persists across requests within the same Deno isolate.
const translationCache = new Map<string, CacheEntry>()

const jsonResponse = (
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  })

const cacheKey = (
  word: string,
  context: string | undefined,
  targetLanguage: TargetLanguage,
) => `${word}|${context ?? ''}|${targetLanguage}`

const buildPrompt = (
  word: string,
  context: string | undefined,
  targetLanguage: TargetLanguage,
) => {
  const langName = targetLanguage === 'vi' ? 'Vietnamese' : 'English'
  return `You are a bilingual dictionary. Translate the word "${word}" into ${langName}.${
    context
      ? `\nThe word appears in this sentence: "${context}". Use it to disambiguate the intended sense.`
      : ''
  }
Return:
- "word": the original word as given.
- "translation": a concise ${langName} translation (just the word/phrase).
- "ipa": IPA pronunciation of the original word, or empty string if unknown.
- "partOfSpeech": the part of speech (noun, verb, adjective, etc.), or empty if not applicable.
- "meaningInContext": a brief explanation in ${langName} of what the word means in the given context.
- "exampleSentence": one short example sentence in ${langName} that uses the translated word naturally.`
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    word: { type: 'STRING' },
    translation: { type: 'STRING' },
    ipa: { type: 'STRING' },
    partOfSpeech: { type: 'STRING' },
    meaningInContext: { type: 'STRING' },
    exampleSentence: { type: 'STRING' },
  },
  required: [
    'word',
    'translation',
    'ipa',
    'partOfSpeech',
    'meaningInContext',
    'exampleSentence',
  ],
}

class GeminiError extends Error {}

const callGemini = async (
  fetcher: FetcherFn,
  apiKey: string,
  word: string,
  context: string | undefined,
  targetLanguage: TargetLanguage,
): Promise<TranslationBody> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: buildPrompt(word, context, targetLanguage) }] },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new GeminiError(
      `Gemini upstream error (${response.status}): ${detail.slice(0, 200)}`,
    )
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new GeminiError('Gemini returned empty content')
  }

  let parsed: Partial<TranslationBody>
  try {
    parsed = JSON.parse(text) as Partial<TranslationBody>
  } catch {
    throw new GeminiError('Gemini returned non-JSON content')
  }

  return {
    word: typeof parsed.word === 'string' ? parsed.word : word,
    translation: parsed.translation ?? '',
    ipa: parsed.ipa ?? '',
    partOfSpeech: parsed.partOfSpeech ?? '',
    meaningInContext: parsed.meaningInContext ?? '',
    exampleSentence: parsed.exampleSentence ?? '',
  }
}

export const createHandler = (deps: HandlerDeps) => {
  const now = deps.now ?? (() => Date.now())
  const apiKey = deps.geminiApiKey ?? Deno.env.get('GEMINI_API_KEY') ?? ''

  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' })
    }

    try {
      const authHeader = request.headers.get('Authorization') ?? ''
      const token = authHeader.replace(/^Bearer\s+/i, '').trim()
      if (!token) {
        return jsonResponse(401, { error: 'Missing Authorization header' })
      }

      const { data, error } = await deps.getUser(token)
      if (error || !data?.user) {
        return jsonResponse(401, { error: 'Invalid or expired token' })
      }

      let body: { word?: unknown; context?: unknown; targetLanguage?: unknown }
      try {
        body = (await request.json()) as typeof body
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON body' })
      }

      const wordRaw = body.word
      if (typeof wordRaw !== 'string') {
        return jsonResponse(400, {
          error: 'word is required and must be a string',
        })
      }
      const word = wordRaw.trim()
      if (word.length === 0) {
        return jsonResponse(400, { error: 'word must be a non-empty string' })
      }
      if (word.length > 100) {
        return jsonResponse(400, {
          error: 'word must be 100 characters or fewer',
        })
      }

      const context =
        typeof body.context === 'string' && body.context.trim().length > 0
          ? body.context.trim()
          : undefined

      const targetLanguage: TargetLanguage =
        body.targetLanguage === 'en' ? 'en' : 'vi'

      const key = cacheKey(word, context, targetLanguage)
      const cached = translationCache.get(key)
      if (cached && cached.expiresAt > now()) {
        return jsonResponse(200, cached.body, { 'X-Cache': 'HIT' })
      }
      if (cached) {
        translationCache.delete(key)
      }

      let translation: TranslationBody
      try {
        translation = await callGemini(
          deps.fetcher,
          apiKey,
          word,
          context,
          targetLanguage,
        )
      } catch (err) {
        if (err instanceof GeminiError) {
          console.error('translate-word gemini error:', err.message)
          return jsonResponse(502, { error: 'Translation service unavailable' })
        }
        throw err
      }

      translationCache.set(key, {
        body: translation,
        expiresAt: now() + CACHE_TTL_MS,
      })

      return jsonResponse(200, translation, { 'X-Cache': 'MISS' })
    } catch (err) {
      console.error('translate-word unexpected error:', err)
      const message = err instanceof Error ? err.message : 'Unexpected error'
      return jsonResponse(500, { error: message })
    }
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const boundHandler = createHandler({
    fetcher: (url, init) => fetch(url, init),
    getUser: async (token: string) => {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      return {
        data: {
          user: data?.user
            ? { id: data.user.id, email: data.user.email }
            : null,
        },
        error: error ? { message: error.message } : null,
      }
    },
  })

  serve(boundHandler)
}
