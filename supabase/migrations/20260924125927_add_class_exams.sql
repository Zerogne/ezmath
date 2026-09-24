do $$
begin
  create type public.class_exam_status as enum ('draft', 'scheduled', 'active', 'closed');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.class_exam_submission_status as enum ('in_progress', 'submitted', 'graded');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.class_exams (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  instructions text not null default '' check (char_length(instructions) <= 5000),
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  starts_at timestamptz,
  closes_at timestamptz,
  status public.class_exam_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_exams_schedule_check check (
    (status = 'draft' and (closes_at is null or starts_at is not null))
    or (status in ('scheduled', 'active', 'closed') and starts_at is not null)
  ),
  constraint class_exams_window_check check (closes_at is null or (starts_at is not null and closes_at > starts_at))
);

create table if not exists public.class_exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.class_exams(id) on delete cascade,
  source_material_id uuid references public.school_library_materials(id) on delete set null,
  position integer not null check (position > 0),
  title text not null check (char_length(trim(title)) between 2 and 160),
  topic text not null check (char_length(trim(topic)) between 1 and 80),
  question_latex text not null check (char_length(trim(question_latex)) between 1 and 12000),
  answer_type public.school_library_answer_type not null,
  answer_key text not null check (char_length(trim(answer_key)) between 1 and 2000),
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  max_points numeric(8,2) not null default 1 check (max_points > 0 and max_points <= 1000),
  created_at timestamptz not null default now(),
  unique (exam_id, position),
  constraint class_exam_questions_answer_type_choices_check check (
    (answer_type = 'multiple_choice' and jsonb_array_length(choices) between 2 and 8)
    or (answer_type <> 'multiple_choice' and choices = '[]'::jsonb)
  )
);

create table if not exists public.class_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.class_exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.class_exam_submission_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  auto_score numeric(10,2) not null default 0 check (auto_score >= 0),
  manual_score numeric(10,2) not null default 0 check (manual_score >= 0),
  total_score numeric(10,2) not null default 0 check (total_score >= 0),
  max_score numeric(10,2) not null check (max_score > 0),
  needs_manual_grading boolean not null default false,
  teacher_feedback text not null default '' check (char_length(teacher_feedback) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id),
  constraint class_exam_submissions_dates_check check (
    (status = 'in_progress' and submitted_at is null)
    or (status in ('submitted', 'graded') and submitted_at is not null)
  ),
  constraint class_exam_submissions_scores_check check (total_score <= max_score and auto_score + manual_score = total_score)
);

create table if not exists public.class_exam_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.class_exam_submissions(id) on delete cascade,
  question_id uuid not null references public.class_exam_questions(id) on delete cascade,
  selected_choice text,
  response_text text,
  is_correct boolean,
  auto_score numeric(8,2) not null default 0 check (auto_score >= 0),
  manual_score numeric(8,2) check (manual_score >= 0),
  teacher_feedback text not null default '' check (char_length(teacher_feedback) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists class_exams_classroom_created_idx on public.class_exams (classroom_id, created_at desc);
create index if not exists class_exams_teacher_status_idx on public.class_exams (teacher_id, status, starts_at desc);
create index if not exists class_exams_school_idx on public.class_exams (school_id);
create index if not exists class_exam_questions_exam_idx on public.class_exam_questions (exam_id, position);
create index if not exists class_exam_questions_material_idx on public.class_exam_questions (source_material_id) where source_material_id is not null;
create index if not exists class_exam_submissions_exam_status_idx on public.class_exam_submissions (exam_id, status, submitted_at desc);
create index if not exists class_exam_submissions_student_idx on public.class_exam_submissions (student_id, created_at desc);
create index if not exists class_exam_answers_submission_idx on public.class_exam_answers (submission_id);
create index if not exists class_exam_answers_question_idx on public.class_exam_answers (question_id);

drop trigger if exists class_exams_set_updated_at on public.class_exams;
create trigger class_exams_set_updated_at
before update on public.class_exams
for each row execute procedure public.set_updated_at();
drop trigger if exists class_exam_submissions_set_updated_at on public.class_exam_submissions;
create trigger class_exam_submissions_set_updated_at
before update on public.class_exam_submissions
for each row execute procedure public.set_updated_at();
drop trigger if exists class_exam_answers_set_updated_at on public.class_exam_answers;
create trigger class_exam_answers_set_updated_at
before update on public.class_exam_answers
for each row execute procedure public.set_updated_at();

create or replace function private.validate_class_exam_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.classrooms c
    join public.profiles p on p.id = new.teacher_id
    where c.id = new.classroom_id
      and c.teacher_id = new.teacher_id
      and c.school_id = new.school_id
      and p.school_id = new.school_id
      and p.role = 'teacher'::public.profile_role
      and p.teacher_status = 'approved'::public.teacher_verification_status
  ) then
    raise exception 'invalid class exam scope' using errcode = '23514';
  end if;
  return new;
end
$$;

revoke execute on function private.validate_class_exam_scope() from public;
drop trigger if exists class_exams_validate_scope on public.class_exams;
create trigger class_exams_validate_scope
before insert or update of classroom_id, school_id, teacher_id on public.class_exams
for each row execute procedure private.validate_class_exam_scope();

create or replace function private.teacher_owns_class_exam(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_exams e
    join public.profiles p on p.id = e.teacher_id
    where e.id = p_exam_id
      and e.teacher_id = (select auth.uid())
      and p.role = 'teacher'::public.profile_role
      and p.teacher_status = 'approved'::public.teacher_verification_status
  )
$$;

create or replace function private.student_is_class_exam_member(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_exams e
    join public.classroom_students cs on cs.classroom_id = e.classroom_id
    where e.id = p_exam_id
      and cs.student_id = (select auth.uid())
      and e.status <> 'draft'::public.class_exam_status
  )
$$;

create or replace function private.student_can_take_class_exam(p_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_exams e
    join public.classroom_students cs on cs.classroom_id = e.classroom_id
    where e.id = p_exam_id
      and cs.student_id = (select auth.uid())
      and e.status in ('scheduled'::public.class_exam_status, 'active'::public.class_exam_status)
      and e.starts_at <= now()
      and (e.closes_at is null or e.closes_at > now())
  )
$$;

create or replace function private.teacher_owns_class_exam_submission(p_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_exam_submissions s
    join public.class_exams e on e.id = s.exam_id
    where s.id = p_submission_id
      and e.teacher_id = (select auth.uid())
      and (select private.is_approved_teacher())
  )
$$;

create or replace function private.student_owns_class_exam_submission(p_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_exam_submissions s
    where s.id = p_submission_id
      and s.student_id = (select auth.uid())
  )
$$;

revoke execute on function private.teacher_owns_class_exam(uuid) from public;
revoke execute on function private.student_is_class_exam_member(uuid) from public;
revoke execute on function private.student_can_take_class_exam(uuid) from public;
revoke execute on function private.teacher_owns_class_exam_submission(uuid) from public;
revoke execute on function private.student_owns_class_exam_submission(uuid) from public;
grant execute on function private.teacher_owns_class_exam(uuid) to authenticated;
grant execute on function private.student_is_class_exam_member(uuid) to authenticated;
grant execute on function private.student_can_take_class_exam(uuid) to authenticated;
grant execute on function private.teacher_owns_class_exam_submission(uuid) to authenticated;
grant execute on function private.student_owns_class_exam_submission(uuid) to authenticated;

alter table public.class_exams enable row level security;
alter table public.class_exam_questions enable row level security;
alter table public.class_exam_submissions enable row level security;
alter table public.class_exam_answers enable row level security;

revoke all on public.class_exams, public.class_exam_questions, public.class_exam_submissions, public.class_exam_answers from anon, authenticated;
grant select on public.class_exams to authenticated;
grant select (id, exam_id, source_material_id, position, title, topic, question_latex, answer_type, choices, max_points, created_at)
  on public.class_exam_questions to authenticated;
grant select on public.class_exam_submissions, public.class_exam_answers to authenticated;

drop policy if exists "Teachers and class members read class exams" on public.class_exams;
create policy "Teachers and class members read class exams"
on public.class_exams for select to authenticated
using (
  (select private.teacher_owns_class_exam(id))
  or (select private.student_is_class_exam_member(id))
);

drop policy if exists "Teachers and active students read class exam questions" on public.class_exam_questions;
create policy "Teachers and active students read class exam questions"
on public.class_exam_questions for select to authenticated
using (
  (select private.teacher_owns_class_exam(exam_id))
  or (select private.student_can_take_class_exam(exam_id))
);

drop policy if exists "Students and teachers read class exam submissions" on public.class_exam_submissions;
create policy "Students and teachers read class exam submissions"
on public.class_exam_submissions for select to authenticated
using (
  student_id = (select auth.uid())
  or (select private.teacher_owns_class_exam(exam_id))
);

drop policy if exists "Students and teachers read class exam answers" on public.class_exam_answers;
create policy "Students and teachers read class exam answers"
on public.class_exam_answers for select to authenticated
using (
  (select private.student_owns_class_exam_submission(submission_id))
  or (select private.teacher_owns_class_exam_submission(submission_id))
);

notify pgrst, 'reload schema';
