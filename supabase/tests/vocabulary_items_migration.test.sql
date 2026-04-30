-- Manual smoke check for the vocabulary_items review-fields migration
-- (supabase/migrations/20260430000000_vocabulary_items_review_fields.sql).
--
-- This file is NOT part of an automated test runner. psql is not available
-- locally; run it manually against a Supabase project after applying the
-- migration:
--
--   psql "$DATABASE_URL" -f supabase/tests/vocabulary_items_migration.test.sql
--
-- The DO block raises an assertion failure if any expected schema state is
-- missing. A clean run prints no output.
do $$
begin
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'vocabulary_items'
            and column_name in ('is_deleted','deleted_at','review_count','last_reviewed_at','source_text')) = 5,
         'vocabulary_items missing required new columns';
  assert (select relrowsecurity from pg_class where relname = 'vocabulary_items') = true,
         'RLS not enabled on vocabulary_items';
end $$;
