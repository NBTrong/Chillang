import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

type RapidApiTranscriptItem = {
  title?: string
  description?: string
  availableLangs?: string[]
  lengthInSeconds?: string
  thumbnails?: Array<{ url: string; width: number; height: number }>
  transcription?: Array<{
    subtitle: string
    start: number
    dur: number
  }>
  transcriptionAsText?: string
}

type YoutubeV2Response = {
  lang: string
  is_available: boolean
  subtitles: Array<{
    id: number
    start: number
    duration: number
    text: string
  }>
}

type YtApiResponse = {
  id: string
  transcript: Array<{
    startMs: string
    endMs: string
    startTime: string
    text: string
  }>
  selected: {
    title: string
    params: string
  }
  languageMenu: Array<{
    title: string
    params: string
  }>
}

type NormalizedTranscript = {
  transcript: string
  language: string | null
  segments: Array<{
    subtitle: string
    start: number
    dur: number
  }>
  metadata: {
    provider: 'youtube-transcriptor' | 'youtube-v2' | 'yt-api' | 'python-yt-dlp'
    [key: string]: unknown
  }
}

const NO_CAPTION_ERROR = 'Video này không có caption, vui lòng chọn video khác'
const NO_CAPTION_ERROR_CODE = 'NO_CAPTION'
const FETCH_ERROR_CODE = 'FETCH_TRANSCRIPT_ERROR'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
})

const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    '&#39;': "'",
    '&quot;': '"',
    '&gt;': '>',
    '&lt;': '<',
    '&amp;': '&',
  }
  return text.replace(/&#?\w+;/g, (match) => entities[match] || match)
}

type RapidApiKeyInfo = {
  key_id: string
  key_value: string
  name: string | null
  request_count: number
  error_count: number
}

/**
 * Get the least-used active RapidAPI key from the database
 * Falls back to environment variable if no keys are found in database
 */
const getLeastUsedRapidApiKey = async (): Promise<{
  key: string
  keyId: string | null
}> => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_least_used_rapidapi_key')

    if (error) {
      console.warn('[Key Rotation] Failed to get key from database:', error.message)
      // Fallback to env variable
      const envKey = Deno.env.get('RAPIDAPI_KEY')
      if (envKey) {
        return { key: envKey, keyId: null }
      }
      throw new Error('No RapidAPI key available')
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const keyInfo = data[0] as RapidApiKeyInfo
      console.log(
        `[Key Rotation] Using key "${keyInfo.name || keyInfo.key_id}" (requests: ${keyInfo.request_count}, errors: ${keyInfo.error_count})`,
      )
      return { key: keyInfo.key_value, keyId: keyInfo.key_id }
    }

    // No keys in database, fallback to env variable
    console.log('[Key Rotation] No keys in database, using env variable')
    const envKey = Deno.env.get('RAPIDAPI_KEY')
    if (envKey) {
      return { key: envKey, keyId: null }
    }

    throw new Error('No RapidAPI key available')
  } catch (error) {
    console.error('[Key Rotation] Error getting key:', error)
    // Fallback to env variable
    const envKey = Deno.env.get('RAPIDAPI_KEY')
    if (envKey) {
      return { key: envKey, keyId: null }
    }
    throw error
  }
}

/**
 * Track RapidAPI key usage and errors
 */
const trackRapidApiKeyUsage = async (
  keyId: string | null,
  success: boolean,
  errorType: string | null = null,
): Promise<void> => {
  if (!keyId) {
    // Can't track usage for env variable keys
    return
  }

  try {
    const { error } = await supabaseAdmin.rpc('track_rapidapi_key_usage', {
      p_key_id: keyId,
      p_success: success,
      p_error_type: errorType,
    })

    if (error) {
      console.warn('[Key Rotation] Failed to track usage:', error.message)
    }
  } catch (error) {
    console.warn('[Key Rotation] Error tracking usage:', error)
    // Don't throw - tracking is non-critical
  }
}

/**
 * Detect error type from HTTP response status
 */
const detectErrorType = (status: number): string | null => {
  if (status === 401 || status === 403) {
    return 'auth_error'
  }
  if (status === 429) {
    return 'rate_limit'
  }
  if (status >= 500) {
    return 'server_error'
  }
  return 'client_error'
}

/**
 * Get next RapidAPI key to try, excluding already tried keys
 */
const getNextRapidApiKey = async (
  triedKeyIds: Set<string | null>,
): Promise<{ key: string; keyId: string | null } | null> => {
  try {
    // First, try to get a key from database that we haven't tried
    if (triedKeyIds.size > 0) {
      const triedIdsArray = Array.from(triedKeyIds).filter((id) => id !== null) as string[]
      if (triedIdsArray.length > 0) {
        // Get all active keys and filter out tried ones
        const { data: allKeys } = await supabaseAdmin
          .from('rapidapi_keys')
          .select('id, key_value, name')
          .eq('is_active', true)

        if (allKeys) {
          const untriedKey = allKeys.find((k) => !triedIdsArray.includes(k.id))
          if (untriedKey) {
            return { key: untriedKey.key_value, keyId: untriedKey.id }
          }
        }
      }
    }

    // If no tried keys or all tried, get least used
    const keyInfo = await getLeastUsedRapidApiKey()
    if (keyInfo && !triedKeyIds.has(keyInfo.keyId)) {
      return keyInfo
    }

    // Fallback to env variable if not tried
    const envKey = Deno.env.get('RAPIDAPI_KEY')
    if (envKey && !triedKeyIds.has(null)) {
      return { key: envKey, keyId: null }
    }

    return null
  } catch (error) {
    console.error('[Key Rotation] Error getting next key:', error)
    // Fallback to env variable
    const envKey = Deno.env.get('RAPIDAPI_KEY')
    if (envKey && !triedKeyIds.has(null)) {
      return { key: envKey, keyId: null }
    }
    return null
  }
}

const fetchTranscriptFromProvider1 = async (
  videoId: string,
  apiKey: string,
): Promise<NormalizedTranscript> => {
  const url = `https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${encodeURIComponent(videoId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'youtube-transcriptor.p.rapidapi.com',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(NO_CAPTION_ERROR)
    }
    throw new Error(`Provider 1 request failed (${response.status})`)
  }

  const payload = (await response.json()) as RapidApiTranscriptItem[]
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const firstItem = payload[0]
  if (!firstItem.transcriptionAsText || !firstItem.transcriptionAsText.trim()) {
    throw new Error(NO_CAPTION_ERROR)
  }

  return {
    transcript: firstItem.transcriptionAsText,
    language: firstItem.availableLangs?.[0] ?? null,
    segments: (firstItem.transcription ?? []).map((seg) => ({
      subtitle: decodeHtmlEntities(seg.subtitle),
      start: seg.start,
      dur: seg.dur,
    })),
    metadata: {
      provider: 'youtube-transcriptor',
      title: firstItem.title,
      description: firstItem.description,
      lengthInSeconds: firstItem.lengthInSeconds,
      thumbnails: firstItem.thumbnails,
      availableLangs: firstItem.availableLangs,
    },
  }
}

const fetchTranscriptFromProvider2 = async (
  videoId: string,
  apiKey: string,
): Promise<NormalizedTranscript> => {
  const url = `https://youtube-v2.p.rapidapi.com/video/subtitles?video_id=${encodeURIComponent(videoId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'youtube-v2.p.rapidapi.com',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(NO_CAPTION_ERROR)
    }
    throw new Error(`Provider 2 request failed (${response.status})`)
  }

  const payload = (await response.json()) as YoutubeV2Response
  if (!payload.is_available || !payload.subtitles || payload.subtitles.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const decodedSegments = payload.subtitles.map((sub) => ({
    subtitle: decodeHtmlEntities(sub.text),
    start: sub.start,
    dur: sub.duration,
  }))

  const transcript = decodedSegments.map((seg) => seg.subtitle).join(' ')

  if (!transcript.trim()) {
    throw new Error(NO_CAPTION_ERROR)
  }

  return {
    transcript,
    language: payload.lang ?? null,
    segments: decodedSegments,
    metadata: {
      provider: 'youtube-v2',
      is_available: payload.is_available,
    },
  }
}

const fetchTranscriptFromProvider3 = async (
  videoId: string,
  apiKey: string,
): Promise<NormalizedTranscript> => {
  const url = `https://yt-api.p.rapidapi.com/get_transcript?id=${encodeURIComponent(videoId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'yt-api.p.rapidapi.com',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(NO_CAPTION_ERROR)
    }
    throw new Error(`Provider 3 request failed (${response.status})`)
  }

  const payload = (await response.json()) as YtApiResponse
  if (!payload.transcript || !Array.isArray(payload.transcript) || payload.transcript.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const decodedSegments = payload.transcript
    .filter((item) => item.text && item.text.trim())
    .map((item) => {
      const startMs = parseInt(item.startMs, 10)
      const endMs = parseInt(item.endMs, 10)
      const start = isNaN(startMs) ? 0 : startMs / 1000 // Convert ms to seconds
      const dur = isNaN(startMs) || isNaN(endMs) ? 0 : (endMs - startMs) / 1000 // Convert ms to seconds

      return {
        subtitle: decodeHtmlEntities(item.text.trim()),
        start,
        dur,
      }
    })

  if (decodedSegments.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const transcript = decodedSegments.map((seg) => seg.subtitle).join(' ')

  if (!transcript.trim()) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const availableLangs = payload.languageMenu?.map((lang) => lang.title) ?? []

  return {
    transcript,
    language: payload.selected?.title ?? null,
    segments: decodedSegments,
    metadata: {
      provider: 'yt-api',
      selected_language: payload.selected?.title,
      available_langs: availableLangs,
    },
  }
}

type PythonProviderResponse = {
  transcript: string
  language: string | null
  segments: Array<{
    subtitle: string
    start: number
    dur: number
  }>
  metadata: {
    provider: 'python-yt-dlp'
    title?: string
    description?: string
    lengthInSeconds?: string
    thumbnails?: Array<{ url: string; width: number; height: number }>
    availableLangs?: string[]
    [key: string]: unknown
  }
}

const fetchTranscriptFromProvider4 = async (
  videoId: string,
  apiKey: string,
): Promise<NormalizedTranscript> => {
  const pythonApiUrl = Deno.env.get('PYTHON_TRANSCRIPT_API_URL')
  const pythonApiKey = Deno.env.get('PYTHON_TRANSCRIPT_API_KEY')

  if (!pythonApiUrl) {
    throw new Error('PYTHON_TRANSCRIPT_API_URL not configured')
  }

  if (!pythonApiKey) {
    throw new Error('PYTHON_TRANSCRIPT_API_KEY not configured')
  }

  const url = `${pythonApiUrl}/transcript`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_id: videoId,
      api_key: pythonApiKey,
    }),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(NO_CAPTION_ERROR)
    }
    if (response.status === 401) {
      throw new Error('Python provider authentication failed')
    }
    if (response.status === 503) {
      // Service unavailable (e.g., bot detection) - should fallback to other providers
      const errorText = await response.text().catch(() => 'Service unavailable')
      console.warn(`[Transcript] Python provider unavailable (bot detection?): ${errorText}`)
      throw new Error(`Python provider temporarily unavailable: ${errorText}`)
    }
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Provider 4 (Python) request failed (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as PythonProviderResponse

  if (!payload.transcript || !payload.transcript.trim()) {
    throw new Error(NO_CAPTION_ERROR)
  }

  if (!payload.segments || payload.segments.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const decodedSegments = payload.segments.map((seg) => ({
    subtitle: decodeHtmlEntities(seg.subtitle),
    start: seg.start,
    dur: seg.dur,
  }))

  return {
    transcript: payload.transcript,
    language: payload.language ?? null,
    segments: decodedSegments,
    metadata: {
      provider: 'python-yt-dlp',
      title: payload.metadata.title,
      description: payload.metadata.description,
      lengthInSeconds: payload.metadata.lengthInSeconds,
      thumbnails: payload.metadata.thumbnails,
      availableLangs: payload.metadata.availableLangs,
    },
  }
}

const fetchTranscriptFromProvider5 = async (
  videoId: string,
  apiKey: string,
): Promise<NormalizedTranscript> => {
  const pythonApiUrl = Deno.env.get('PYTHON_TRANSCRIPT_API_URL')
  const pythonApiKey = Deno.env.get('PYTHON_TRANSCRIPT_API_KEY')

  if (!pythonApiUrl) {
    throw new Error('PYTHON_TRANSCRIPT_API_URL not configured')
  }

  if (!pythonApiKey) {
    throw new Error('PYTHON_TRANSCRIPT_API_KEY not configured')
  }

  const url = `${pythonApiUrl}/transcript`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_id: videoId,
      api_key: pythonApiKey,
    }),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(NO_CAPTION_ERROR)
    }
    if (response.status === 401) {
      throw new Error('Python provider 5 authentication failed')
    }
    if (response.status === 503) {
      // Service unavailable (e.g., bot detection) - should fallback to other providers
      const errorText = await response.text().catch(() => 'Service unavailable')
      console.warn(`[Transcript] Python provider 5 unavailable (bot detection?): ${errorText}`)
      throw new Error(`Python provider 5 temporarily unavailable: ${errorText}`)
    }
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Provider 5 (Python) request failed (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as PythonProviderResponse

  if (!payload.transcript || !payload.transcript.trim()) {
    throw new Error(NO_CAPTION_ERROR)
  }

  if (!payload.segments || payload.segments.length === 0) {
    throw new Error(NO_CAPTION_ERROR)
  }

  const decodedSegments = payload.segments.map((seg) => ({
    subtitle: decodeHtmlEntities(seg.subtitle),
    start: seg.start,
    dur: seg.dur,
  }))

  return {
    transcript: payload.transcript,
    language: payload.language ?? null,
    segments: decodedSegments,
    metadata: {
      provider: 'python-yt-dlp',
      title: payload.metadata.title,
      description: payload.metadata.description,
      lengthInSeconds: payload.metadata.lengthInSeconds,
      thumbnails: payload.metadata.thumbnails,
      availableLangs: payload.metadata.availableLangs,
    },
  }
}

const fetchTranscriptWithFallback = async (
  videoId: string,
): Promise<NormalizedTranscript & { providerUsed: string }> => {
  const providers: Array<{
    name: string
    fetch: (videoId: string, apiKey: string) => Promise<NormalizedTranscript>
  }> = [
    // { name: 'youtube-transcriptor', fetch: fetchTranscriptFromProvider1 },
    { name: 'youtube-v2', fetch: fetchTranscriptFromProvider2 },
    // { name: 'yt-api', fetch: fetchTranscriptFromProvider3 },
    // { name: 'python-yt-dlp', fetch: fetchTranscriptFromProvider4 },
    // { name: 'python-yt-dlp-2', fetch: fetchTranscriptFromProvider5 },
  ]

  // // Add provider 5 only if environment variables are configured
  // const pythonApiUrl2 = Deno.env.get('PYTHON_TRANSCRIPT_API_URL')
  // const pythonApiKey2 = Deno.env.get('PYTHON_TRANSCRIPT_API_KEY')
  // if (pythonApiUrl2 && pythonApiKey2) {
  //   providers.push({ name: 'python-yt-dlp-2', fetch: fetchTranscriptFromProvider5 })
  // }

  const randomIndex = Math.floor(Math.random() * providers.length)
  const primaryProvider = providers[randomIndex]
  const remainingProviders = providers.filter((_, idx) => idx !== randomIndex)

  console.log(`[Transcript] Random selected provider: ${primaryProvider.name}`)

  // Maximum number of keys to try per provider (prevent infinite loops)
  const maxKeyAttempts = 5
  const triedKeyIds = new Set<string | null>()

  // Helper function to try fetching with a key
  const tryFetchWithKey = async (
    provider: { name: string; fetch: (videoId: string, apiKey: string) => Promise<NormalizedTranscript> },
    keyInfo: { key: string; keyId: string | null },
  ): Promise<{ result: NormalizedTranscript | null; shouldRetry: boolean; errorType: string | null }> => {
    try {
      const result = await provider.fetch(videoId, keyInfo.key)
      // Success - track usage
      await trackRapidApiKeyUsage(keyInfo.keyId, true, null)
      return { result, shouldRetry: false, errorType: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const statusMatch = errorMessage.match(/\((\d+)\)/)
      const status = statusMatch ? parseInt(statusMatch[1], 10) : null
      const errorType = status ? detectErrorType(status) : 'unknown_error'

      // Track error
      await trackRapidApiKeyUsage(keyInfo.keyId, false, errorType)

      // Determine if we should retry with another key (rate limit or auth errors)
      const shouldRetry = status === 429 || status === 401 || status === 403

      return {
        result: null,
        shouldRetry,
        errorType,
      }
    }
  }

  // Try all providers with key rotation
  const allProviders = [primaryProvider, ...remainingProviders]

  for (const provider of allProviders) {
    console.log(`[Transcript] Trying provider: ${provider.name}`)

    // Try multiple keys for this provider
    let keyAttempts = 0
    const providerTriedKeyIds = new Set<string | null>()

    while (keyAttempts < maxKeyAttempts) {
      keyAttempts++

      // Get next key to try (excluding already tried keys for this provider)
      const keyInfo = await getNextRapidApiKey(providerTriedKeyIds)

      if (!keyInfo) {
        // No more keys available
        console.warn(`[Transcript] No more keys available for provider ${provider.name}`)
        break
      }

      providerTriedKeyIds.add(keyInfo.keyId)
      triedKeyIds.add(keyInfo.keyId)

      console.log(
        `[Transcript] Provider ${provider.name}, attempt ${keyAttempts}/${maxKeyAttempts} with key ${keyInfo.keyId || 'env'}`,
      )

      const fetchResult = await tryFetchWithKey(provider, keyInfo)

      if (fetchResult.result) {
        // Success!
        return { ...fetchResult.result, providerUsed: provider.name }
      }

      if (!fetchResult.shouldRetry) {
        // Non-retryable error (e.g., 404 - no caption), try next provider
        console.warn(
          `[Transcript] Provider ${provider.name} failed with non-retryable error: ${fetchResult.errorType}`,
        )
        break
      }

      // Retryable error (rate limit or auth), try next key
      console.warn(
        `[Transcript] Key ${keyInfo.keyId || 'env'} failed with ${fetchResult.errorType}, trying next key`,
      )
    }
  }

  // All providers and keys failed
  console.error(`[Transcript] All providers and keys failed for video ${videoId}`)
  throw new Error('All providers failed to fetch transcript')
}

const extractVocabularyWithGemini = async (
  transcript: string,
  apiKey: string,
): Promise<Array<{ word: string; definition: string | null; context_sentence: string | null }>> => {
  if (!transcript || transcript.trim().length === 0) {
    return []
  }

  const transcriptSample = transcript.slice(0, 8000)

  const prompt = `Extract important vocabulary words from the following English transcript. Focus on:
- Words that are likely unfamiliar to language learners
- Technical terms or domain-specific vocabulary
- Idiomatic expressions
- Advanced vocabulary (B2-C2 level)

Transcript:
${transcriptSample}

Return a JSON array of objects, each with:
- "word": the vocabulary word (lowercase, base form)
- "definition": a brief English definition (1 sentence)
- "context_sentence": one example sentence from the transcript where this word appears

Limit to 30-50 most important words. Return ONLY valid JSON array, no other text.

Example format:
[
  {"word": "articulate", "definition": "To express ideas clearly and effectively", "context_sentence": "If you can't articulate those ideas with clarity, people will doubt your ability."},
  {"word": "credibility", "definition": "The quality of being trusted and believed in", "context_sentence": "which can cost you your credibility."}
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini API error for vocabulary extraction:', response.status, await response.text())
      return []
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    // Try to extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const vocab = JSON.parse(jsonMatch[0]) as Array<{
          word: string
          definition?: string
          context_sentence?: string
        }>
        return vocab.map((v) => ({
          word: v.word.toLowerCase().trim(),
          definition: v.definition || null,
          context_sentence: v.context_sentence || null,
        }))
      } catch (parseError) {
        console.warn('Failed to parse vocabulary JSON:', parseError)
      }
    }

    return []
  } catch (error) {
    console.error('Failed to extract vocabulary with Gemini:', error)
    return []
  }
}

const generateTitleFromSegments = async (
  segments: Array<{ subtitle: string; start: number; dur: number }>,
  apiKey: string,
): Promise<string | null> => {
  if (!segments || segments.length === 0) {
    return null
  }

  // Lấy khoảng 10 segment đầu tiên
  const firstSegments = segments.slice(0, 10)
  const segmentTexts = firstSegments.map((seg) => seg.subtitle).join(' ')

  if (!segmentTexts.trim()) {
    return null
  }

  const prompt = `Based on the following transcript segments from the beginning of a YouTube video, generate a short, concise title (maximum 100 characters) that accurately describes what the video is about.

Transcript segments:
${segmentTexts}

Return ONLY the title text, nothing else. The title should be:
- Short and descriptive (max 100 characters)
- In the same language as the transcript
- Clear and informative about the video's main topic

Title:`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini API error for title generation:', response.status, await response.text())
      return null
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }

    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null

    // Giới hạn độ dài title
    if (title && title.length > 200) {
      return title.slice(0, 197) + '...'
    }

    return title
  } catch (error) {
    console.error('Failed to generate title with Gemini:', error)
    return null
  }
}

const assessDifficultyWithGemini = async (
  transcript: string,
  apiKey: string,
): Promise<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'> => {
  if (!transcript || transcript.trim().length === 0) {
    return 'B1'
  }

  const transcriptSample = transcript.slice(0, 5000)

  const prompt = `Analyze the following English transcript from a YouTube video and assess its difficulty level according to the CEFR (Common European Framework of Reference for Languages) scale.

Transcript:
${transcriptSample}

Please respond with ONLY one of the following levels: A1, A2, B1, B2, C1, or C2.
Consider factors such as:
- Vocabulary complexity
- Sentence structure
- Grammar complexity
- Overall linguistic sophistication

Respond with just the level (e.g., "B1" or "C2"):`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text())
      return 'B1'
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || ''

    const levelMatch = text.match(/\b(A1|A2|B1|B2|C1|C2)\b/)
    if (levelMatch) {
      return levelMatch[1] as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    }

    console.warn('Gemini response did not contain valid CEFR level:', text)
    return 'B1'
  } catch (error) {
    console.error('Failed to assess difficulty with Gemini:', error)
    return 'B1'
  }
}

type ListeningQuizQuestionInput = {
  prompt: string
  correct_option: string
  distractors: string[]
  hint: string | null
  reference_start_ms: number | null
  reference_end_ms: number | null
  explanation: string | null
}

const generateListeningQuizWithGemini = async (
  transcript: string,
  segments: Array<{ subtitle: string; start: number; dur: number }>,
  apiKey: string,
): Promise<ListeningQuizQuestionInput[]> => {
  if (!transcript || transcript.trim().length === 0 || segments.length === 0) {
    return []
  }

  const transcriptSample = transcript.slice(0, 10000)
  
  // Create a map of text to timestamps for reference
  const segmentMap = segments.map((seg) => ({
    text: seg.subtitle,
    startMs: Math.round(seg.start * 1000),
    endMs: Math.round((seg.start + seg.dur) * 1000),
  }))

  const prompt = `Generate listening comprehension quiz questions from the following English transcript. Create 8-12 multiple-choice questions that test understanding of:
- Main ideas and key points
- Specific details mentioned
- Inferences and implications
- Speaker's attitude or purpose

Transcript:
${transcriptSample}

Return a JSON array of objects, each with:
- "prompt": the question text
- "correct_option": the correct answer (exact text)
- "distractors": array of 3 incorrect but plausible answer options
- "hint": a brief hint that guides the listener (optional, can be null)
- "reference_text": a short quote from the transcript that contains the answer (for finding timestamp)
- "explanation": a brief explanation of why the correct answer is right (optional, can be null)

Important:
- Questions should be answerable by listening carefully to the content
- Distractors should be plausible but clearly wrong
- Reference text should be an exact quote from the transcript to help locate the timestamp
- Return ONLY valid JSON array, no other text

Example format:
[
  {
    "prompt": "What is the main topic discussed in the video?",
    "correct_option": "The importance of effective communication",
    "distractors": ["How to learn a new language", "Tips for public speaking", "The history of communication"],
    "hint": "Listen for the central theme mentioned at the beginning",
    "reference_text": "The importance of effective communication",
    "explanation": "The speaker emphasizes this as the main focus throughout the video"
  }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini API error for quiz generation:', response.status, await response.text())
      return []
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    // Try to extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]) as Array<{
          prompt?: string
          correct_option?: string
          distractors?: string[]
          hint?: string | null
          reference_text?: string
          explanation?: string | null
        }>

        // Process questions and find timestamps
        const processedQuestions: ListeningQuizQuestionInput[] = []

        for (const q of questions) {
          if (!q.prompt || !q.correct_option || !q.distractors || q.distractors.length < 3) {
            continue
          }

          // Find timestamp for reference text
          let referenceStartMs: number | null = null
          let referenceEndMs: number | null = null

          if (q.reference_text) {
            // Try to find the segment containing this text
            const referenceLower = q.reference_text.toLowerCase().trim()
            for (const seg of segmentMap) {
              if (seg.text.toLowerCase().includes(referenceLower) || referenceLower.includes(seg.text.toLowerCase())) {
                referenceStartMs = seg.startMs
                referenceEndMs = seg.endMs
                break
              }
            }
          }

          processedQuestions.push({
            prompt: q.prompt.trim(),
            correct_option: q.correct_option.trim(),
            distractors: q.distractors.slice(0, 3).map((d) => d.trim()),
            hint: q.hint?.trim() || null,
            reference_start_ms: referenceStartMs,
            reference_end_ms: referenceEndMs,
            explanation: q.explanation?.trim() || null,
          })
        }

        return processedQuestions
      } catch (parseError) {
        console.warn('Failed to parse quiz JSON:', parseError)
      }
    }

    return []
  } catch (error) {
    console.error('Failed to generate listening quiz with Gemini:', error)
    return []
  }
}

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })

serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' })
    }

    // Check if we have at least one key source (database or env variable)
    // The getLeastUsedRapidApiKey function will handle fallback to env variable
    const envRapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!envRapidApiKey) {
      // Check if we have any keys in database
      const { data: dbKeys } = await supabaseAdmin
        .from('rapidapi_keys')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (!dbKeys || dbKeys.length === 0) {
        console.error('Missing RAPIDAPI_KEY env and no active keys in database')
        return jsonResponse(500, { error: 'Server misconfiguration: No RapidAPI keys available' })
      }
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.warn('Missing GOOGLE_GEMINI_API_KEY, difficulty assessment will use fallback')
    }

    const authHeader = request.headers.get('Authorization') ?? ''
    const accessToken = authHeader.replace('Bearer ', '').trim()
    if (!accessToken) {
      return jsonResponse(401, { error: 'Unauthorized' })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !authData?.user) {
      console.error('Failed to verify user', authError)
      return jsonResponse(401, { error: 'Unauthorized' })
    }

    const ownerId = authData.user.id

    const { videoId } = (await request.json().catch(() => ({}))) as { videoId?: string }
    if (!videoId || !/^[\w-]{6,}$/.test(videoId)) {
      return jsonResponse(400, { error: 'Invalid videoId' })
    }

    const result = await fetchTranscriptWithFallback(videoId)

    // Lấy title từ metadata, nếu không có thì tạo từ segments bằng Gemini
    let videoTitle = (result.metadata.title as string | undefined) ?? null
    
    // Nếu không có title và có segments, dùng Gemini để tạo title từ 10 segment đầu
    if (!videoTitle && geminiApiKey && result.segments.length > 0) {
      console.log('[Title] Title missing, generating from first 10 segments using Gemini')
      const generatedTitle = await generateTitleFromSegments(result.segments, geminiApiKey)
      if (generatedTitle) {
        videoTitle = generatedTitle
        console.log('[Title] Generated title:', generatedTitle)
      } else {
        console.warn('[Title] Failed to generate title from segments')
      }
    }

    const [difficultyLevel, vocabularyList] = await Promise.all([
      geminiApiKey
        ? assessDifficultyWithGemini(result.transcript, geminiApiKey)
        : Promise.resolve('B1' as const),
      geminiApiKey
        ? extractVocabularyWithGemini(result.transcript, geminiApiKey)
        : Promise.resolve([]),
    ])

    const videoPayload = {
      owner_id: ownerId,
      youtube_video_id: videoId,
      title: videoTitle,
      channel_name: null as string | null,
      thumbnail_url: (() => {
        const thumbnails = result.metadata.thumbnails as Array<{ url: string }> | undefined
        return thumbnails && thumbnails.length > 0 ? thumbnails[thumbnails.length - 1]?.url ?? null : null
      })(),
      duration_seconds: result.metadata.lengthInSeconds
        ? Number(result.metadata.lengthInSeconds)
        : null,
      difficulty_level: difficultyLevel,
      transcript: {
        provider: result.providerUsed,
        provider_used: result.providerUsed,
        text: result.transcript,
        segments: result.segments,
        fetched_at: new Date().toISOString(),
      },
      ai_metadata: {
        provider: result.providerUsed,
        description: result.metadata.description,
        available_langs: result.metadata.availableLangs ?? [],
        language: result.language,
        difficulty_assessed_at: new Date().toISOString(),
      },
    }

    const { data: videoRecord, error: videoError } = await supabaseAdmin
      .from('videos')
      .upsert(videoPayload, { onConflict: 'owner_id,youtube_video_id' })
      .select('id, owner_id')
      .single()

    if (videoError || !videoRecord) {
      console.error('Failed to upsert video', videoError)
      throw new Error('Không thể lưu video vào hệ thống')
    }

    await supabaseAdmin.from('reading_segments').delete().eq('video_id', videoRecord.id)
    if (result.segments.length > 0) {
      const filteredSegments = result.segments.filter((segment) => segment.subtitle?.trim().length)
      
      const segmentsPayload = filteredSegments.map((segment, index) => {
        const startsAtMs =
          typeof segment.start === 'number' ? Math.round(segment.start * 1000) : null
        
        // ends_at_ms của segment N = starts_at_ms của segment N+1
        // Nếu không có segment tiếp theo, dùng start + duration làm fallback
        let endsAtMs: number | null = null
        if (index < filteredSegments.length - 1) {
          const nextSegment = filteredSegments[index + 1]
          if (typeof nextSegment.start === 'number') {
            endsAtMs = Math.round(nextSegment.start * 1000)
          }
        }
        
        // Fallback: nếu không có segment tiếp theo, dùng start + duration
        if (endsAtMs === null && typeof segment.start === 'number' && typeof segment.dur === 'number') {
          endsAtMs = Math.round((segment.start + segment.dur) * 1000)
        }

        return {
          video_id: videoRecord.id,
          segment_index: index,
          starts_at_ms: startsAtMs,
          ends_at_ms: endsAtMs,
          original_text: segment.subtitle,
          translated_text: null,
        }
      })

      for (const chunk of chunkArray(segmentsPayload, 500)) {
        if (chunk.length === 0) continue
        const { error: insertError } = await supabaseAdmin.from('reading_segments').insert(chunk)
        if (insertError) {
          console.error('Failed to insert reading segments chunk', insertError)
          throw new Error('Không thể lưu transcript vào hệ thống')
        }
      }
    }

    const { data: existingSession, error: sessionFetchError } = await supabaseAdmin
      .from('study_sessions')
      .select('id, status')
      .eq('owner_id', ownerId)
      .eq('video_id', videoRecord.id)
      .maybeSingle()

    if (sessionFetchError) {
      console.error('Failed to fetch study session', sessionFetchError)
      throw new Error('Không thể truy cập phiên học')
    }

    let sessionId: string

    if (existingSession) {
      const { error: sessionUpdateError } = await supabaseAdmin
        .from('study_sessions')
        .update({
          status: 'ready',
          last_opened_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id)

      if (sessionUpdateError) {
        console.error('Failed to update existing session', sessionUpdateError)
        throw new Error('Không thể cập nhật phiên học')
      }

      sessionId = existingSession.id
    } else {
      const { data: newSession, error: sessionInsertError } = await supabaseAdmin
        .from('study_sessions')
        .insert({
          owner_id: ownerId,
          video_id: videoRecord.id,
          status: 'ready',
          reading_progress: 0,
          dictation_completed: 0,
        })
        .select('id')
        .single()

      if (sessionInsertError || !newSession) {
        console.error('Failed to create study session', sessionInsertError)
        throw new Error('Không thể tạo phiên học mới')
      }

      sessionId = newSession.id
    }

    // Insert vocabulary items
    if (vocabularyList.length > 0 && geminiApiKey) {
      await supabaseAdmin.from('vocabulary_items').delete().eq('video_id', videoRecord.id)

      const vocabPayload = vocabularyList.map((vocab) => ({
        owner_id: ownerId,
        video_id: videoRecord.id,
        word: vocab.word,
        definition: vocab.definition,
        context_sentence: vocab.context_sentence,
        mastery_level: 'new' as const,
      }))

      for (const chunk of chunkArray(vocabPayload, 100)) {
        if (chunk.length === 0) continue
        const { error: vocabError } = await supabaseAdmin.from('vocabulary_items').insert(chunk)
        if (vocabError) {
          console.error('Failed to insert vocabulary chunk', vocabError)
          // Don't throw, just log - vocabulary extraction is optional
        }
      }
    }

    // Generate and insert listening quiz
    if (geminiApiKey && result.segments.length > 0) {
      try {
        const quizQuestions = await generateListeningQuizWithGemini(
          result.transcript,
          result.segments,
          geminiApiKey,
        )

        if (quizQuestions.length > 0) {
          // Delete existing quiz for this session
          const { data: existingQuiz } = await supabaseAdmin
            .from('listening_quizzes')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle()

          if (existingQuiz) {
            await supabaseAdmin
              .from('listening_quiz_questions')
              .delete()
              .eq('quiz_id', existingQuiz.id)
            await supabaseAdmin
              .from('listening_quizzes')
              .delete()
              .eq('id', existingQuiz.id)
          }

          // Create new quiz
          const { data: newQuiz, error: quizError } = await supabaseAdmin
            .from('listening_quizzes')
            .insert({
              session_id: sessionId,
              phase: 'quiz',
              question_count: quizQuestions.length,
              max_score: 100,
            })
            .select('id')
            .single()

          if (quizError || !newQuiz) {
            console.error('Failed to create listening quiz', quizError)
            // Don't throw, just log - quiz generation is optional
          } else {
            // Insert quiz questions
            const questionsPayload = quizQuestions.map((q) => ({
              quiz_id: newQuiz.id,
              prompt: q.prompt,
              correct_option: q.correct_option,
              distractors: q.distractors,
              hint: q.hint,
              reference_start_ms: q.reference_start_ms,
              reference_end_ms: q.reference_end_ms,
              explanation: q.explanation,
            }))

            for (const chunk of chunkArray(questionsPayload, 100)) {
              if (chunk.length === 0) continue
              const { error: questionsError } = await supabaseAdmin
                .from('listening_quiz_questions')
                .insert(chunk)
              if (questionsError) {
                console.error('Failed to insert quiz questions chunk', questionsError)
                // Don't throw, just log
              }
            }

            console.log(`Successfully generated ${quizQuestions.length} listening quiz questions`)
          }
        }
      } catch (quizGenError) {
        console.error('Failed to generate listening quiz:', quizGenError)
        // Don't throw, just log - quiz generation is optional
      }
    }

    // Dictation now uses reading_segments directly, no need to create separate dictation_prompts

    return jsonResponse(200, {
      transcript: result.transcript,
      language: result.language,
      isAutoGenerated: null,
      videoUuid: videoRecord.id,
      sessionId,
      youtubeVideoId: videoId,
      providerUsed: result.providerUsed,
    })
  } catch (error) {
    console.error('fetch-youtube-caption error', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const isNoCaption = message.includes(NO_CAPTION_ERROR) || message.includes('Video này không có caption')
    return jsonResponse(isNoCaption ? 404 : 500, {
      error: isNoCaption ? NO_CAPTION_ERROR : 'Không thể lấy transcript, vui lòng thử lại.',
      errorCode: isNoCaption ? NO_CAPTION_ERROR_CODE : FETCH_ERROR_CODE,
      details: message,
    })
  }
})

