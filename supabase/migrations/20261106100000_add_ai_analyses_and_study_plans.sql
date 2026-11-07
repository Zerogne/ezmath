-- AI (Claude Haiku) feedback: one analysis per submitted mock attempt, one study plan per student per week.
-- Rows are written only by the server (service role); students can read their own.

create table public.ai_attempt_analyses (
  attempt_id uuid primary key references public.test_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending', 'ready', 'failed')),
  content jsonb,
  model text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_attempt_analyses_user_idx on public.ai_attempt_analyses (user_id, created_at desc);

create table public.ai_study_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Monday of the plan's week, in Asia/Ulaanbaatar.
  week_start date not null,
  status text not null check (status in ('pending', 'ready', 'failed')),
  content jsonb,
  model text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.ai_attempt_analyses enable row level security;
alter table public.ai_study_plans enable row level security;
revoke insert, update, delete on public.ai_attempt_analyses from anon, authenticated;
revoke insert, update, delete on public.ai_study_plans from anon, authenticated;
revoke select on public.ai_attempt_analyses from anon;
revoke select on public.ai_study_plans from anon;

create policy "Students read own attempt analyses" on public.ai_attempt_analyses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read own study plans" on public.ai_study_plans
  for select to authenticated using ((select auth.uid()) = user_id);
