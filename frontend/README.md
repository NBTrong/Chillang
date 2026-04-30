# Tube Study Frontend

React + TypeScript + Tailwind UI for the Tube Study learning flows (Home, Video Dashboard, Reading, Listening, Dictation).

## Getting started

```bash
cd frontend
npm install
cp env.example .env.local   # add Supabase keys next
npm run dev
```

### Environment variables

| Key | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://vnizbfgyrknjhovkpipw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Only used for server-side scripts / Edge Functions |
| `SUPABASE_DB_PASSWORD` | Required if you push migrations via CLI |

Never expose the service-role key to browser clients.

## Supabase integration

- `src/lib/supabaseClient.ts` instantiates `@supabase/supabase-js` with the env vars above.
- `src/services/supabaseApi.ts` wraps common PostgREST calls (videos, study sessions, quizzes, dictation, vocabulary, flashcards).
- Schema + policies live in `../supabase/schema.sql`. Run it in the Supabase SQL editor or via `supabase db push` to provision the managed backend.

## Recommended next steps

1. Add auth (email magic link or OAuth) so `auth.uid()` is available for RLS policies.
2. Wire UI screens to the functions exported from `src/services/supabaseApi.ts`.
3. Implement an Edge Function that:
   - Accepts a YouTube URL
   - Generates transcripts/quizzes/vocabulary
   - Inserts rows into the Supabase tables defined in `supabase/schema.sql`.
4. Use PostgREST filters to hydrate the sidebar recents list from `recent_study_sessions`.
