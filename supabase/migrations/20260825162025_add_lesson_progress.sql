create table public.student_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 2 and 80),
  completed_at timestamptz,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_lesson_progress_user_lesson_key unique (user_id, lesson_id)
);

create index student_lesson_progress_user_last_opened_idx
  on public.student_lesson_progress (user_id, last_opened_at desc);

create trigger student_lesson_progress_set_updated_at
  before update on public.student_lesson_progress
  for each row execute procedure public.set_updated_at();

alter table public.student_lesson_progress enable row level security;

revoke all on table public.student_lesson_progress from anon, authenticated;
grant select, insert, update on table public.student_lesson_progress to authenticated;

create policy "Students read own lesson progress"
  on public.student_lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students create own lesson progress"
  on public.student_lesson_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students update own lesson progress"
  on public.student_lesson_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
