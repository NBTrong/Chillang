## Supabase Setup Guide

This folder contains everything you need to turn Supabase into the managed backend for the Tube Study App. Follow the checklist below to provision the schema, apply security policies, and wire the frontend/Edge Functions to the REST API.

---

### 1. Project metadata

- **Project ID:** `prxsyvwhysitbpdfbigh`
- **API URL:** `https://prxsyvwhysitbpdfbigh.supabase.co`
- **Service role key:** `fake_service_role_key` (never ship this to the frontend; store it in secret managers or server-only `.env` files).
- **Anon/public key:** generate from the Supabase dashboard (`Settings → API`). Paste it into your local `.env`/CI later.

---

### 2. Apply the schema

1. Open Supabase Dashboard → **SQL Editor**.
2. Paste the content from `supabase/schema.sql` and run it once.
3. Alternatively, install the CLI and run:
   ```bash
   cd /Users/nbtrong/Documents/self-learn
   supabase db push --project-ref prxsyvwhysitbpdfbigh --db-url "postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.prxsyvwhysitbpdfbigh.supabase.co:6543/postgres"
   ```
   Replace `<SUPABASE_DB_PASSWORD>` with the password shown in Project Settings → Database.

What you get:
- Tables for `videos`, `study_sessions`, `reading_segments`, `listening_quizzes`, `dictation_prompts`, `vocabulary_items`, `flashcard_reviews`.
- All tables enforce Row Level Security so each user only reads/writes their data.
- A `recent_study_sessions` view to power the sidebar/recents UI.

---

### 3. REST & RPC usage

Supabase automatically exposes each table via PostgREST:

| Resource | Endpoint | Example |
| --- | --- | --- |
| Videos | `GET/POST /rest/v1/videos` | `GET https://prxsyvwhysitbpdfbigh.supabase.co/rest/v1/videos?select=*` |
| Study sessions | `/rest/v1/study_sessions` | `POST ... { "video_id": "...", "status": "ready" }` |
| Reading segments | `/rest/v1/reading_segments` | `GET ...?video_id=eq.<video_uuid>&order=segment_index` |
| Listening quizzes | `/rest/v1/listening_quizzes` | `GET ...?session_id=eq.<session_uuid>` |
| Dictation prompts | `/rest/v1/dictation_prompts` | `GET ...?session_id=eq.<session_uuid>&order=prompt_index` |
| Vocabulary items | `/rest/v1/vocabulary_items` | `PATCH ...?id=eq.<uuid>` |
| Flashcard reviews | `/rest/v1/flashcard_reviews` | `POST ... { "vocabulary_id": "...", "rating": "good" }` |
| Recents view | `/rest/v1/recent_study_sessions` | `GET ...?owner_id=eq.<auth.uid>` |

Headers to include in every request:
```
apikey: <anon or service key>
Authorization: Bearer <anon key or user session JWT>
Content-Type: application/json
Prefer: return=representation
```

For admin/batching tasks (sync transcripts, generate quizzes), create Supabase **Edge Functions** or background scripts that use the **service role key**. The frontend must continue to use the anon key.

---

### 4. Environment variables

Copy `frontend/env.example` to `.env` or `.env.local`:
```
cp frontend/env.example frontend/.env.local
```
Fill in the missing values:
- `VITE_SUPABASE_URL=https://prxsyvwhysitbpdfbigh.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<anon_public_key_from_dashboard>`
- `SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_dashboard>` (only for server-side tooling, *not* for Vite).
- `SUPABASE_DB_PASSWORD=<database_password_if_running supabase db push>`

---

### 5. Suggested automation flow

1. **Frontend** uses `@supabase/supabase-js` via `src/lib/supabaseClient.ts`.
2. **Edge Function / Worker** receives a YouTube URL, generates:
   - Video metadata (title, difficulty).
   - Transcript paragraphs → insert into `reading_segments`.
   - Listening quiz rows.
   - Dictation prompts.
   - Vocabulary candidates.
3. Frontend screens call the PostgREST endpoints to display/update each mode’s data.
4. Use `recent_study_sessions` to show history inside the sidebar drawer.

---

### 6. Using Supabase MCP (optional)

If you want to orchestrate Supabase directly from Cursor/Claude:
1. Generate a **Personal Access Token** in Supabase Dashboard → Account Settings.
2. Configure your MCP-enabled client with:
   ```
   supabase --access-token <PAT> --project-id prxsyvwhysitbpdfbigh
   ```
3. From there you can run `list_projects`, `execute_sql`, create migrations, deploy Edge Functions, etc., without leaving the IDE.

---

You now have a fully managed REST backend with Supabase. Continue building UI flows, or add AI pipelines on top of these tables as needed.

