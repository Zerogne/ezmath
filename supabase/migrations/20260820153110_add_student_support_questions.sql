create table public.student_support_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_student_support_questions_user_created
  on public.student_support_questions(user_id, created_at desc);

alter table public.student_support_questions enable row level security;

create policy "Students read own support questions"
  on public.student_support_questions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students create own support questions"
  on public.student_support_questions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Admins manage support questions"
  on public.student_support_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert on public.student_support_questions to authenticated;
