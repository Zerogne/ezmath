-- Student onboarding goals, verified phone numbers (Verify.MN), placement tests and request rate limits.

-- 1. Goals collected on /onboarding. Students may edit these columns on their own row only.
alter table public.profiles
  add column target_exam text check (target_exam in ('EYESH', 'SAT', 'BOTH')),
  add column eyesh_goal smallint check (eyesh_goal between 0 and 800),
  add column sat_goal smallint check (sat_goal between 200 and 800),
  add column eyesh_exam_year smallint check (eyesh_exam_year between 2020 and 2040),
  add column sat_exam_month date,
  add column grade text check (grade in ('9', '10', '11', '12', 'graduated')),
  add column weekly_study_hours smallint check (weekly_study_hours between 1 and 60),
  add column target_university text check (char_length(target_university) <= 120),
  add column onboarded_at timestamptz,
  -- Set only by the server after Verify.MN confirms an SMS from this number. Used for password reset.
  add column phone text unique check (phone ~ '^[0-9]{8}$'),
  add column phone_verified_at timestamptz;

grant update (target_exam, eyesh_goal, sat_goal, eyesh_exam_year, sat_exam_month, grade, weekly_study_hours, target_university, onboarded_at)
  on public.profiles to authenticated;

-- 2. Verify.MN sessions. Service role only: no RLS policies, no grants to client roles.
create table public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  provider_session_id text not null unique,
  purpose text not null check (purpose in ('link_phone', 'reset_password')),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null check (phone ~ '^[0-9]{8}$'),
  code text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index phone_verifications_user_idx on public.phone_verifications (user_id, created_at desc);
alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon, authenticated;

-- 3. One placement test per exam type, shown at the end of onboarding.
alter table public.tests add column is_placement boolean not null default false;
create unique index tests_one_placement_per_exam on public.tests (exam_type) where is_placement;

-- 4. Fixed-window rate limiter, called from server code with the service role.
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;

  -- Occasionally prune expired windows so the table stays small.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
