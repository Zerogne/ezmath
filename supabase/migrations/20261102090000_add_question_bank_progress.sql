-- Per-student progress in the SAT question bank: how often a question was answered, whether the last answer
-- was right, and whether the student marked it for review. Written only by server actions (service role).
create table public.question_bank_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= attempts),
  last_correct boolean,
  marked boolean not null default false,
  last_answered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.question_bank_progress enable row level security;

create policy "Students read own question bank progress"
  on public.question_bank_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins manage question bank progress"
  on public.question_bank_progress for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.question_bank_progress to authenticated;
