-- New display codes use the full random UUID payload. Existing codes are kept
-- so installed displays do not stop working; the API also rate-limits lookups.
alter table public.devices
  alter column device_code
  set default upper(replace(gen_random_uuid()::text, '-', ''));

-- A shared, atomic limiter works across serverless instances and deployments.
-- Only the service role can call it; bucket identifiers are hashed in the app.
create table if not exists public.security_rate_limits (
  bucket_key_hash text primary key,
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  expires_at timestamptz not null
);

create index if not exists security_rate_limits_expires_at_idx
  on public.security_rate_limits(expires_at);

alter table public.security_rate_limits enable row level security;
revoke all privileges on table public.security_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.security_rate_limits to service_role;

create or replace function public.consume_security_rate_limit(
  p_bucket_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := pg_catalog.clock_timestamp();
  current_count integer;
  current_reset timestamptz;
  safe_limit integer := pg_catalog.greatest(p_limit, 1);
  safe_window_seconds integer := pg_catalog.greatest(p_window_seconds, 1);
begin
  if p_bucket_key_hash is null or pg_catalog.length(p_bucket_key_hash) <> 64 then
    raise exception 'Invalid rate-limit bucket key';
  end if;

  insert into public.security_rate_limits (
    bucket_key_hash,
    window_started_at,
    attempt_count,
    expires_at
  )
  values (
    p_bucket_key_hash,
    current_time,
    1,
    current_time + pg_catalog.make_interval(secs => safe_window_seconds)
  )
  on conflict (bucket_key_hash) do update
  set
    window_started_at = case
      when security_rate_limits.expires_at <= current_time then current_time
      else security_rate_limits.window_started_at
    end,
    attempt_count = case
      when security_rate_limits.expires_at <= current_time then 1
      else security_rate_limits.attempt_count + 1
    end,
    expires_at = case
      when security_rate_limits.expires_at <= current_time
        then current_time + pg_catalog.make_interval(secs => safe_window_seconds)
      else security_rate_limits.expires_at
    end
  returning security_rate_limits.attempt_count, security_rate_limits.expires_at
  into current_count, current_reset;

  allowed := current_count <= safe_limit;
  remaining := pg_catalog.greatest(safe_limit - current_count, 0);
  reset_at := current_reset;
  return next;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer)
  to service_role;
