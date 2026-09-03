-- PostgreSQL implements GREATEST as an expression, not as a schema-qualified
-- function. Keep the security-definer function's empty search_path while using
-- explicit CASE expressions for the three lower-bound calculations. Avoid the
-- reserved CURRENT_TIME expression as a PL/pgSQL variable name as well.
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
  request_now timestamptz := pg_catalog.clock_timestamp();
  current_count integer;
  current_reset timestamptz;
  safe_limit integer := case when p_limit > 1 then p_limit else 1 end;
  safe_window_seconds integer := case
    when p_window_seconds > 1 then p_window_seconds
    else 1
  end;
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
    request_now,
    1,
    request_now + pg_catalog.make_interval(secs => safe_window_seconds)
  )
  on conflict (bucket_key_hash) do update
  set
    window_started_at = case
      when security_rate_limits.expires_at <= request_now then request_now
      else security_rate_limits.window_started_at
    end,
    attempt_count = case
      when security_rate_limits.expires_at <= request_now then 1
      else security_rate_limits.attempt_count + 1
    end,
    expires_at = case
      when security_rate_limits.expires_at <= request_now
        then request_now + pg_catalog.make_interval(secs => safe_window_seconds)
      else security_rate_limits.expires_at
    end
  returning security_rate_limits.attempt_count, security_rate_limits.expires_at
  into current_count, current_reset;

  allowed := current_count <= safe_limit;
  remaining := case
    when safe_limit - current_count > 0 then safe_limit - current_count
    else 0
  end;
  reset_at := current_reset;
  return next;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer)
  to service_role;
