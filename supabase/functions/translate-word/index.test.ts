import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { createHandler, type GetUserFn, type FetcherFn } from './index.ts'

const fakeUser = { id: 'user-123', email: 'test@example.com' }

const okGetUser: GetUserFn = async (_token: string) =>
  ({ data: { user: fakeUser }, error: null })

const errorGetUser: GetUserFn = async (_token: string) =>
  ({ data: { user: null }, error: { message: 'Invalid JWT' } })

const buildGeminiOk = (overrides: Partial<Record<string, string>> = {}): FetcherFn => {
  return async (_url: string | URL, _init?: RequestInit) => {
    const body = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  word: overrides.word ?? 'run',
                  translation: overrides.translation ?? 'chạy',
                  ipa: overrides.ipa ?? '/rʌn/',
                  partOfSpeech: overrides.partOfSpeech ?? 'verb',
                  meaningInContext:
                    overrides.meaningInContext ?? 'di chuyển nhanh bằng chân',
                  exampleSentence:
                    overrides.exampleSentence ?? 'Tôi chạy mỗi sáng.',
                }),
              },
            ],
          },
        },
      ],
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const geminiFailing: FetcherFn = async (_url, _init) =>
  new Response('upstream error', { status: 500 })

const buildRequest = (
  body: unknown,
  opts: { auth?: string | null } = {},
): Request => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.auth !== null) {
    headers['Authorization'] = opts.auth ?? 'Bearer test-jwt'
  }
  return new Request('http://localhost/translate-word', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

Deno.test('200 happy path returns expected body shape', async () => {
  const handler = createHandler({ fetcher: buildGeminiOk(), getUser: okGetUser })
  const res = await handler(
    buildRequest({ word: 'run', context: 'I run every day.' }),
  )
  assertEquals(res.status, 200)
  const body = await res.json()
  assertEquals(body.word, 'run')
  assertEquals(body.translation, 'chạy')
  assertEquals(body.ipa, '/rʌn/')
  assertEquals(body.partOfSpeech, 'verb')
  assertExists(body.meaningInContext)
  assertExists(body.exampleSentence)
})

Deno.test('400 when word missing', async () => {
  const handler = createHandler({ fetcher: buildGeminiOk(), getUser: okGetUser })
  const res = await handler(buildRequest({ context: 'no word here' }))
  assertEquals(res.status, 400)
  const body = await res.json()
  assertExists(body.error)
})

Deno.test('400 when word too long', async () => {
  const handler = createHandler({ fetcher: buildGeminiOk(), getUser: okGetUser })
  const longWord = 'a'.repeat(101)
  const res = await handler(buildRequest({ word: longWord }))
  assertEquals(res.status, 400)
})

Deno.test('400 when word is empty string', async () => {
  const handler = createHandler({ fetcher: buildGeminiOk(), getUser: okGetUser })
  const res = await handler(buildRequest({ word: '   ' }))
  assertEquals(res.status, 400)
})

Deno.test('401 when no Authorization header', async () => {
  const handler = createHandler({ fetcher: buildGeminiOk(), getUser: okGetUser })
  const res = await handler(buildRequest({ word: 'run' }, { auth: null }))
  assertEquals(res.status, 401)
})

Deno.test('401 when getUser returns error', async () => {
  const handler = createHandler({
    fetcher: buildGeminiOk(),
    getUser: errorGetUser,
  })
  const res = await handler(buildRequest({ word: 'run' }))
  assertEquals(res.status, 401)
})

Deno.test('502 when Gemini returns non-200', async () => {
  const handler = createHandler({ fetcher: geminiFailing, getUser: okGetUser })
  const res = await handler(buildRequest({ word: 'run' }))
  assertEquals(res.status, 502)
  const body = await res.json()
  assertExists(body.error)
})

Deno.test('Cache HIT on second identical call', async () => {
  let callCount = 0
  const counting: FetcherFn = async (url, init) => {
    callCount += 1
    return buildGeminiOk()(url, init)
  }
  const handler = createHandler({ fetcher: counting, getUser: okGetUser })
  const r1 = await handler(buildRequest({ word: 'cache-test', context: 'ctx' }))
  assertEquals(r1.status, 200)
  assertEquals(r1.headers.get('X-Cache'), 'MISS')
  await r1.text()

  const r2 = await handler(buildRequest({ word: 'cache-test', context: 'ctx' }))
  assertEquals(r2.status, 200)
  assertEquals(r2.headers.get('X-Cache'), 'HIT')
  assertEquals(callCount, 1)
})

Deno.test('Cache MISS when targetLanguage differs', async () => {
  let callCount = 0
  const counting: FetcherFn = async (url, init) => {
    callCount += 1
    return buildGeminiOk()(url, init)
  }
  const handler = createHandler({ fetcher: counting, getUser: okGetUser })
  const r1 = await handler(
    buildRequest({ word: 'lang-test', context: 'ctx', targetLanguage: 'vi' }),
  )
  assertEquals(r1.status, 200)
  await r1.text()

  const r2 = await handler(
    buildRequest({ word: 'lang-test', context: 'ctx', targetLanguage: 'en' }),
  )
  assertEquals(r2.status, 200)
  assertEquals(r2.headers.get('X-Cache'), 'MISS')
  assertEquals(callCount, 2)
})
