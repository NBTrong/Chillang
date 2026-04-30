# translate-word

Supabase Edge Function that translates a single word (with optional surrounding context) using Google Gemini 2.5 Flash. Returns translation, IPA, part of speech, contextual meaning, and an example sentence. Results are cached in-memory for 6 hours per `(word, context, targetLanguage)` key, scoped to the running isolate.

## Required environment variables

- `GEMINI_API_KEY` — Google Generative Language API key.
- `SUPABASE_URL` — Project URL (auto-injected by the Supabase runtime).
- `SUPABASE_SERVICE_ROLE_KEY` — Service-role key for verifying caller JWTs (auto-injected).

## Set secrets

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

## Deploy

```bash
supabase functions deploy translate-word
```

## Request shape

```
POST /functions/v1/translate-word
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

```json
{
  "word": "run",
  "context": "I run every morning before work.",
  "targetLanguage": "vi"
}
```

`context` is optional. `targetLanguage` defaults to `vi` (accepts `vi` or `en`). `word` must be a non-empty string of at most 100 characters.

## Response shape

```json
{
  "word": "run",
  "translation": "chạy",
  "ipa": "/rʌn/",
  "partOfSpeech": "verb",
  "meaningInContext": "...",
  "exampleSentence": "..."
}
```

Responses include `X-Cache: HIT` or `X-Cache: MISS`.

## Error codes

- `400` — `word` missing, empty, or longer than 100 characters; malformed JSON body.
- `401` — Missing or invalid `Authorization: Bearer <jwt>` header.
- `502` — Gemini upstream failure.
- `500` — Unexpected error or missing `GEMINI_API_KEY`.

## Tests

```bash
deno test --allow-env --allow-net supabase/functions/translate-word/index.test.ts
```
