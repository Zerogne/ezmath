create table public.test_integrity_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('page_hidden', 'window_blur', 'fullscreen_exit')),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index test_integrity_events_attempt_created_idx
  on public.test_integrity_events (attempt_id, created_at desc);
create index test_integrity_events_user_created_idx
  on public.test_integrity_events (user_id, created_at desc);

alter table public.test_integrity_events enable row level security;
revoke all on public.test_integrity_events from anon, authenticated;
