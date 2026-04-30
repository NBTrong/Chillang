-- Vocabulary items: review tracking + soft delete + source context
-- Slice 1 of the word-translation popup + vocabulary collection feature.
--
-- Adds: is_deleted, deleted_at, review_count, last_reviewed_at, source_text
-- Ensures RLS is enabled with granular per-action policies.
-- Adds a partial index for owner_id + due_at lookups (excludes soft-deleted rows).
-- Wires the set_updated_at trigger if it has not been wired yet.

-- 1. New columns (idempotent)
alter table public.vocabulary_items
  add column if not exists is_deleted boolean not null default false;

alter table public.vocabulary_items
  add column if not exists deleted_at timestamptz;

alter table public.vocabulary_items
  add column if not exists review_count integer not null default 0;

alter table public.vocabulary_items
  add column if not exists last_reviewed_at timestamptz;

-- source_text holds the surrounding context/sentence the word was captured from
-- (kept separate from context_sentence which stores the AI-generated example).
alter table public.vocabulary_items
  add column if not exists source_text text;

-- 2. Ensure RLS is enabled
alter table public.vocabulary_items enable row level security;

-- 3. Granular RLS policies (drop-if-exists then create for idempotency)
-- Replace the previous broad "for all" policy with per-action policies so that
-- SELECT can filter out soft-deleted rows.
drop policy if exists "Users manage their vocabulary" on public.vocabulary_items;
drop policy if exists "Users select their vocabulary" on public.vocabulary_items;
drop policy if exists "Users insert their vocabulary" on public.vocabulary_items;
drop policy if exists "Users update their vocabulary" on public.vocabulary_items;
drop policy if exists "Users delete their vocabulary" on public.vocabulary_items;

create policy "Users select their vocabulary" on public.vocabulary_items
  for select
  using (owner_id = auth.uid() and is_deleted = false);

create policy "Users insert their vocabulary" on public.vocabulary_items
  for insert
  with check (owner_id = auth.uid());

create policy "Users update their vocabulary" on public.vocabulary_items
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users delete their vocabulary" on public.vocabulary_items
  for delete
  using (owner_id = auth.uid());

-- 4. Useful index for due-card queries (partial: skip soft-deleted)
create index if not exists vocabulary_items_owner_due_idx
  on public.vocabulary_items (owner_id, due_at)
  where is_deleted = false;

-- 5. Wire the set_updated_at trigger (idempotent)
drop trigger if exists set_vocab_updated_at on public.vocabulary_items;
create trigger set_vocab_updated_at
  before update on public.vocabulary_items
  for each row execute procedure public.set_updated_at();
