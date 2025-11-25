-- Phase 1 schema describing main learning entities

create table if not exists public.users (
  id uuid primary key references auth.users not null,
  display_name text,
  interface_language text default 'en',
  learning_languages text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  youtube_id text not null,
  title text not null,
  thumbnail_url text,
  duration integer,
  language text not null,
  difficulty integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.videos(id) on delete cascade not null,
  language text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.script_segments (
  id uuid primary key default gen_random_uuid(),
  script_id uuid references public.scripts(id) on delete cascade not null,
  sentence text not null,
  start_time numeric not null,
  end_time numeric not null,
  order_index integer not null
);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  word text not null,
  phrase text,
  definition text,
  translation text,
  notes text,
  source_video_id uuid references public.videos(id),
  source_script_segment_id uuid references public.script_segments(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  vocabulary_id uuid references public.vocabulary(id) on delete cascade not null,
  front_text text not null,
  back_text text not null,
  image_url text,
  difficulty integer,
  last_reviewed timestamp with time zone,
  next_review timestamp with time zone,
  review_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  script_segment_id uuid references public.script_segments(id) on delete cascade not null,
  user_input text not null,
  accuracy numeric not null,
  completed_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  progress jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

comment on table public.users is 'Extends auth.users with learning preferences';

-- RLS policies (enable but actual policies should be customized per project)
alter table public.users enable row level security;
alter table public.videos enable row level security;
alter table public.scripts enable row level security;
alter table public.script_segments enable row level security;
alter table public.vocabulary enable row level security;
alter table public.flashcards enable row level security;
alter table public.dictation_sessions enable row level security;
alter table public.learning_progress enable row level security;

-- Placeholder policies for future customization
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'videos' and policyname = 'Users can manage their videos'
  ) then
    create policy "Users can manage their videos" on public.videos
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

