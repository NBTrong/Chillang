-- Tube Study App - Supabase Schema
-- Run this script in the Supabase SQL editor or through supabase db push.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Helper to manage updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Videos that users import from YouTube
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  youtube_video_id text not null,
  title text,
  channel_name text,
  thumbnail_url text,
  duration_seconds integer,
  difficulty_level text check (difficulty_level in ('A1','A2','B1','B2','C1','C2','custom')),
  transcript jsonb,
  ai_metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, youtube_video_id)
);

create trigger set_videos_updated_at
before update on public.videos
for each row execute procedure public.set_updated_at();

-- Study sessions derived from a video
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  status text default 'pending' check (status in ('pending','ready','in_progress','completed')),
  reading_progress numeric default 0 check (reading_progress between 0 and 1),
  listening_high_score integer,
  dictation_completed integer default 0,
  ai_summary text,
  metadata jsonb,
  last_opened_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_study_sessions_updated_at
before update on public.study_sessions
for each row execute procedure public.set_updated_at();

-- Transcript paragraphs
create table if not exists public.reading_segments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  segment_index integer not null,
  starts_at_ms integer,
  ends_at_ms integer,
  original_text text not null,
  translated_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists reading_segments_unique_idx on public.reading_segments (video_id, segment_index);

-- Listening quiz metadata per study session
create table if not exists public.listening_quizzes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  phase text default 'quiz' check (phase in ('quiz','review')),
  question_count integer default 0,
  max_score integer default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Listening quiz questions
create table if not exists public.listening_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.listening_quizzes (id) on delete cascade,
  prompt text not null,
  correct_option text not null,
  distractors text[] not null,
  hint text,
  reference_start_ms integer,
  reference_end_ms integer,
  explanation text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Dictation prompts
create table if not exists public.dictation_prompts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  prompt_index integer not null,
  audio_url text,
  expected_text text not null,
  context jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists dictation_prompts_unique_idx on public.dictation_prompts (session_id, prompt_index);

-- Vocabulary items
create table if not exists public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid references public.videos (id) on delete set null,
  word text not null,
  ipa text,
  definition text,
  translation text,
  context_sentence text,
  mastery_level text default 'new' check (mastery_level in ('new','learning','hard','mastered')),
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_vocab_updated_at
before update on public.vocabulary_items
for each row execute procedure public.set_updated_at();

-- Flashcard review logs
create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references public.vocabulary_items (id) on delete cascade,
  rating text not null check (rating in ('again','hard','good','easy')),
  response_ms integer,
  reviewed_at timestamptz not null default timezone('utc', now())
);

-- Denormalized view for quick dashboard lookups
create or replace view public.recent_study_sessions as
select
  s.id as session_id,
  s.owner_id,
  s.status,
  s.reading_progress,
  s.listening_high_score,
  s.dictation_completed,
  s.last_opened_at,
  v.youtube_video_id,
  coalesce(v.title, 'Untitled video') as title,
  v.thumbnail_url,
  v.difficulty_level
from public.study_sessions s
join public.videos v on v.id = s.video_id;

-- Row level security
alter table public.videos enable row level security;
alter table public.study_sessions enable row level security;
alter table public.reading_segments enable row level security;
alter table public.listening_quizzes enable row level security;
alter table public.listening_quiz_questions enable row level security;
alter table public.dictation_prompts enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.flashcard_reviews enable row level security;

create policy "Users manage their videos" on public.videos
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users manage their sessions" on public.study_sessions
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Segments follow video ownership" on public.reading_segments
  for select using (
    exists (
      select 1 from public.videos v
      where v.id = reading_segments.video_id
      and v.owner_id = auth.uid()
    )
  );

create policy "Quiz metadata follows session ownership" on public.listening_quizzes
  for all using (
    exists (
      select 1 from public.study_sessions s
      where s.id = listening_quizzes.session_id
      and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.study_sessions s
      where s.id = listening_quizzes.session_id
      and s.owner_id = auth.uid()
    )
  );

create policy "Quiz questions follow quiz ownership" on public.listening_quiz_questions
  for all using (
    exists (
      select 1 from public.listening_quizzes q
      join public.study_sessions s on s.id = q.session_id
      where q.id = listening_quiz_questions.quiz_id
      and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listening_quizzes q
      join public.study_sessions s on s.id = q.session_id
      where q.id = listening_quiz_questions.quiz_id
      and s.owner_id = auth.uid()
    )
  );

create policy "Dictation prompts follow session ownership" on public.dictation_prompts
  for all using (
    exists (
      select 1 from public.study_sessions s
      where s.id = dictation_prompts.session_id
      and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.study_sessions s
      where s.id = dictation_prompts.session_id
      and s.owner_id = auth.uid()
    )
  );

create policy "Users manage their vocabulary" on public.vocabulary_items
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users read their flashcard reviews" on public.flashcard_reviews
  for select using (
    exists (
      select 1 from public.vocabulary_items v
      where v.id = flashcard_reviews.vocabulary_id
      and v.owner_id = auth.uid()
    )
  );

create policy "Users insert flashcard reviews" on public.flashcard_reviews
  for insert with check (
    exists (
      select 1 from public.vocabulary_items v
      where v.id = flashcard_reviews.vocabulary_id
      and v.owner_id = auth.uid()
    )
  );

create policy "Users delete flashcard reviews" on public.flashcard_reviews
  for delete using (
    exists (
      select 1 from public.vocabulary_items v
      where v.id = flashcard_reviews.vocabulary_id
      and v.owner_id = auth.uid()
    )
  );

-- Allow querying the view
alter view public.recent_study_sessions set (security_barrier = true);
grant select on public.recent_study_sessions to anon, authenticated, service_role;

