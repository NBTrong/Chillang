-- Enable RLS for RapidAPI key tables and restrict access to service role only
-- These tables contain sensitive API keys and should only be accessible by service role

-- Enable RLS on rapidapi_keys table
alter table public.rapidapi_keys enable row level security;

-- Enable RLS on rapidapi_key_usage table
alter table public.rapidapi_key_usage enable row level security;

-- Policy: Only service role can access rapidapi_keys
-- Service role bypasses RLS by default, but we explicitly deny all other access
create policy "Service role only - rapidapi_keys"
on public.rapidapi_keys
for all
using (false)
with check (false);

-- Policy: Only service role can access rapidapi_key_usage
create policy "Service role only - rapidapi_key_usage"
on public.rapidapi_key_usage
for all
using (false)
with check (false);

-- Note: 
-- - Service role (used by Edge Functions) bypasses RLS by default, so it can still access these tables
-- - All other roles (authenticated, anon) will be denied access due to the policies above
-- - The functions get_least_used_rapidapi_key() and track_rapidapi_key_usage() use SECURITY DEFINER
--   which means they run with the privileges of the function owner (service role), so they will work correctly





