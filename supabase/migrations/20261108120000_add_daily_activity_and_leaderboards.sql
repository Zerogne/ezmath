-- Daily study activity per student (Mongolian calendar day), fed by triggers from every place a student
-- answers questions: mock tests, the question bank, class exams, and finished lessons.
-- It drives the dashboard streak and daily goal, and the class and school leaderboards.

create table public.student_daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  problems integer not null default 0 check (problems >= 0),
  correct integer not null default 0 check (correct >= 0),
  lessons integer not null default 0 check (lessons >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index student_daily_activity_day_idx on public.student_daily_activity (day, user_id);

alter table public.student_daily_activity enable row level security;
revoke all on public.student_daily_activity from anon, authenticated;
grant select on public.student_daily_activity to authenticated;
create policy "Students read own daily activity" on public.student_daily_activity
  for select to authenticated using (user_id = (select auth.uid()));

-- Ulaanbaatar is UTC+8 all year, so this is the student's own calendar day.
create function private.mn_day(p_at timestamptz) returns date
language sql immutable set search_path = ''
as $$ select (p_at at time zone 'Asia/Ulaanbaatar')::date $$;

create function private.bump_activity(p_user uuid, p_at timestamptz, p_problems integer, p_correct integer, p_lessons integer)
returns void language sql security definer set search_path = ''
as $$
  insert into public.student_daily_activity as a (user_id, day, problems, correct, lessons)
  values (p_user, private.mn_day(coalesce(p_at, now())), greatest(p_problems, 0), greatest(p_correct, 0), greatest(p_lessons, 0))
  on conflict (user_id, day) do update
    set problems = a.problems + excluded.problems,
        correct = a.correct + excluded.correct,
        lessons = a.lessons + excluded.lessons,
        updated_at = now();
$$;
revoke execute on function private.bump_activity(uuid, timestamptz, integer, integer, integer) from public;

-- 1. Mock tests: answers are saved before the attempt flips to submitted, so they can be counted here.
create function private.activity_from_test_attempt() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_problems integer; v_correct integer;
begin
  select count(*) filter (where is_correct is not null), count(*) filter (where is_correct)
  into v_problems, v_correct
  from public.attempt_answers where attempt_id = new.id;
  perform private.bump_activity(new.user_id, new.completed_at, v_problems, v_correct, 0);
  return new;
end $$;
create trigger test_attempts_daily_activity
  after update of status on public.test_attempts
  for each row when (old.status is distinct from 'submitted' and new.status = 'submitted')
  execute function private.activity_from_test_attempt();

-- 2. Question bank: every checked answer moves last_answered_at.
create function private.activity_from_question_bank() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.bump_activity(new.user_id, new.last_answered_at, 1, case when new.last_correct then 1 else 0 end, 0);
  return new;
end $$;
create trigger question_bank_progress_daily_activity
  after insert or update of last_answered_at on public.question_bank_progress
  for each row when (new.last_answered_at is not null)
  execute function private.activity_from_question_bank();

-- 3. Class exams: counted once, when the submission leaves in_progress.
create function private.activity_from_class_exam() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_problems integer; v_correct integer;
begin
  select count(*) filter (where selected_choice is not null or coalesce(response_text, '') <> ''), count(*) filter (where is_correct)
  into v_problems, v_correct
  from public.class_exam_answers where submission_id = new.id;
  perform private.bump_activity(new.student_id, new.submitted_at, v_problems, v_correct, 0);
  return new;
end $$;
create trigger class_exam_submissions_daily_activity
  after update of status on public.class_exam_submissions
  for each row when (old.status = 'in_progress' and new.status in ('submitted', 'graded'))
  execute function private.activity_from_class_exam();

-- 4. Lessons: finishing one keeps the streak alive even on a day without problems.
create function private.activity_from_lesson() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.bump_activity(new.user_id, new.completed_at, 0, 0, 1);
  return new;
end $$;
create trigger student_lesson_progress_daily_activity_insert
  after insert on public.student_lesson_progress
  for each row when (new.completed_at is not null)
  execute function private.activity_from_lesson();
create trigger student_lesson_progress_daily_activity_update
  after update of completed_at on public.student_lesson_progress
  for each row when (old.completed_at is null and new.completed_at is not null)
  execute function private.activity_from_lesson();

-- Backfill from existing history.
insert into public.student_daily_activity (user_id, day, problems, correct, lessons)
select user_id, day, sum(problems), sum(correct), sum(lessons) from (
  select a.user_id, private.mn_day(a.completed_at) as day,
    count(aa.*) filter (where aa.is_correct is not null)::integer as problems,
    count(aa.*) filter (where aa.is_correct)::integer as correct, 0 as lessons
  from public.test_attempts a left join public.attempt_answers aa on aa.attempt_id = a.id
  where a.status = 'submitted' and a.completed_at is not null
  group by a.user_id, a.id
  union all
  select s.student_id, private.mn_day(s.submitted_at),
    count(ca.*) filter (where ca.selected_choice is not null or coalesce(ca.response_text, '') <> '')::integer,
    count(ca.*) filter (where ca.is_correct)::integer, 0
  from public.class_exam_submissions s left join public.class_exam_answers ca on ca.submission_id = s.id
  where s.status in ('submitted', 'graded') and s.submitted_at is not null
  group by s.student_id, s.id
  union all
  -- The bank only keeps the latest answer per question, so older bank days count once per question.
  select user_id, private.mn_day(last_answered_at), 1, case when last_correct then 1 else 0 end, 0
  from public.question_bank_progress where last_answered_at is not null
  union all
  select user_id, private.mn_day(completed_at), 0, 0, 1
  from public.student_lesson_progress where completed_at is not null
) source
group by user_id, day;

-- Current streak per student: consecutive active days ending today or yesterday (Ulaanbaatar time).
create function private.current_streaks(p_users uuid[])
returns table (user_id uuid, streak integer)
language sql stable security definer set search_path = ''
as $$
  with days as (
    select a.user_id, a.day, a.day - (row_number() over (partition by a.user_id order by a.day))::integer as grp
    from public.student_daily_activity a
    where a.user_id = any(p_users) and (a.problems > 0 or a.lessons > 0) and a.day > private.mn_day(now()) - 400
  ), islands as (
    select d.user_id, max(d.day) as last_day, count(*)::integer as length from days d group by d.user_id, d.grp
  )
  select i.user_id, i.length from islands i where i.last_day >= private.mn_day(now()) - 1;
$$;
revoke execute on function private.current_streaks(uuid[]) from public;

/**
 * This week's leaderboard (Monday to today, Ulaanbaatar time), ranked by correct answers.
 * p_scope 'class': members of p_classroom_id; the caller must be a member or the class's teacher.
 * p_scope 'school': students of the caller's school (student, teacher or school admin).
 * Returns no rows when the caller has no access.
 */
create function public.weekly_leaderboard(p_scope text, p_classroom_id uuid default null)
returns table (student_id uuid, full_name text, avatar_url text, problems integer, correct integer, streak integer, rank integer, is_me boolean)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_me uuid := (select auth.uid());
  v_members uuid[];
  v_week_start date := date_trunc('week', private.mn_day(now()))::date;
begin
  if v_me is null then return; end if;
  if p_scope = 'class' then
    if not exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = v_me)
      and not exists (select 1 from public.classroom_students cs where cs.classroom_id = p_classroom_id and cs.student_id = v_me) then
      return;
    end if;
    select array_agg(cs.student_id) into v_members from public.classroom_students cs where cs.classroom_id = p_classroom_id;
  elsif p_scope = 'school' then
    select array_agg(p.id) into v_members
    from public.profiles p
    where p.role::text = 'student'
      and p.school_id is not null
      and p.school_id = (select me.school_id from public.profiles me where me.id = v_me);
  else
    return;
  end if;
  if v_members is null then return; end if;

  return query
  with totals as (
    select m.id as uid, coalesce(sum(a.problems), 0)::integer as problems, coalesce(sum(a.correct), 0)::integer as correct
    from unnest(v_members) as m(id)
    left join public.student_daily_activity a on a.user_id = m.id and a.day >= v_week_start
    group by m.id
  )
  select t.uid, coalesce(nullif(trim(p.full_name), ''), 'Сурагч'), p.avatar_url, t.problems, t.correct,
    coalesce(s.streak, 0),
    (rank() over (order by t.correct desc, t.problems desc))::integer,
    t.uid = v_me
  from totals t
  join public.profiles p on p.id = t.uid
  left join private.current_streaks(v_members) s on s.user_id = t.uid
  order by t.correct desc, t.problems desc, p.full_name;
end $$;
revoke execute on function public.weekly_leaderboard(text, uuid) from public;
grant execute on function public.weekly_leaderboard(text, uuid) to authenticated;
