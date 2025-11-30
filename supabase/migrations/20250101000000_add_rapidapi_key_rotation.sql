-- RapidAPI Key Rotation System
-- This migration adds support for storing and rotating multiple RapidAPI keys

-- Table to store RapidAPI keys
create table if not exists public.rapidapi_keys (
  id uuid primary key default gen_random_uuid(),
  key_value text not null, -- Encrypted key value
  name text, -- Optional label for the key
  is_active boolean default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Table to track usage statistics for each key
create table if not exists public.rapidapi_key_usage (
  id uuid primary key default gen_random_uuid(),
  key_id uuid not null references public.rapidapi_keys (id) on delete cascade,
  request_count integer default 0,
  error_count integer default 0,
  last_used_at timestamptz,
  last_error_at timestamptz,
  last_error_type text, -- e.g., 'rate_limit', 'auth_error', 'server_error'
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (key_id)
);

-- Trigger to update updated_at for rapidapi_keys
create trigger set_rapidapi_keys_updated_at
before update on public.rapidapi_keys
for each row execute procedure public.set_updated_at();

-- Trigger to update updated_at for rapidapi_key_usage
create trigger set_rapidapi_key_usage_updated_at
before update on public.rapidapi_key_usage
for each row execute procedure public.set_updated_at();

-- Function to get the least-used active RapidAPI key
-- Returns the key with the lowest request_count, or oldest last_used_at if counts are equal
create or replace function public.get_least_used_rapidapi_key()
returns table (
  key_id uuid,
  key_value text,
  name text,
  request_count integer,
  error_count integer
) as $$
begin
  return query
  select 
    k.id as key_id,
    k.key_value,
    k.name,
    coalesce(u.request_count, 0) as request_count,
    coalesce(u.error_count, 0) as error_count
  from public.rapidapi_keys k
  left join public.rapidapi_key_usage u on u.key_id = k.id
  where k.is_active = true
  order by 
    coalesce(u.request_count, 0) asc, -- Least used first
    coalesce(u.last_used_at, '1970-01-01'::timestamptz) asc -- Oldest last used first
  limit 1;
end;
$$ language plpgsql security definer;

-- Function to track RapidAPI key usage
create or replace function public.track_rapidapi_key_usage(
  p_key_id uuid,
  p_success boolean,
  p_error_type text default null
)
returns void as $$
begin
  -- Insert or update usage record
  insert into public.rapidapi_key_usage (key_id, request_count, error_count, last_used_at, last_error_at, last_error_type)
  values (
    p_key_id,
    1,
    case when not p_success then 1 else 0 end,
    timezone('utc', now()),
    case when not p_success then timezone('utc', now()) else null end,
    p_error_type
  )
  on conflict (key_id) do update
  set
    request_count = rapidapi_key_usage.request_count + 1,
    error_count = rapidapi_key_usage.error_count + case when not p_success then 1 else 0 end,
    last_used_at = timezone('utc', now()),
    last_error_at = case 
      when not p_success then timezone('utc', now())
      else rapidapi_key_usage.last_error_at
    end,
    last_error_type = case 
      when not p_success then p_error_type
      else rapidapi_key_usage.last_error_type
    end,
    updated_at = timezone('utc', now());
end;
$$ language plpgsql security definer;

-- Initialize usage record for existing keys (if any)
insert into public.rapidapi_key_usage (key_id, request_count, error_count)
select id, 0, 0
from public.rapidapi_keys
where not exists (
  select 1 from public.rapidapi_key_usage u where u.key_id = rapidapi_keys.id
)
on conflict (key_id) do nothing;

-- Note: These tables should NOT have RLS enabled
-- Only service role should access them for security
-- Keys are sensitive data and should be managed by admins only

