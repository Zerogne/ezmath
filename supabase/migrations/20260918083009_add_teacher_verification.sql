do $$
begin
  create type public.teacher_verification_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists teacher_status public.teacher_verification_status;

-- Teachers who were already using the product predate verification and remain active.
update public.profiles
set teacher_status = 'approved'
where role = 'teacher'::public.profile_role
  and teacher_status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_teacher_status_matches_role'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_teacher_status_matches_role
      check (
        (role = 'teacher'::public.profile_role and teacher_status is not null)
        or (role <> 'teacher'::public.profile_role and teacher_status is null)
      );
  end if;
end
$$;

create index if not exists profiles_pending_teachers_school_idx
  on public.profiles (school_id, created_at)
  where role = 'teacher'::public.profile_role
    and teacher_status = 'pending'::public.teacher_verification_status;

create or replace function private.is_approved_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'teacher'::public.profile_role
      and p.teacher_status = 'approved'
  )
$$;

revoke execute on function private.is_approved_teacher() from public;
grant execute on function private.is_approved_teacher() to authenticated;

-- All legacy classroom/student RLS helpers must enforce the same approval gate.
-- These helpers are used by policies on classroom_students, profiles,
-- test_attempts, attempt_answers, and student_lesson_progress.
create or replace function private.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
$$;

create or replace function private.teacher_owns_class(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
      select 1
      from public.classrooms c
      where c.id = p_classroom_id
        and c.teacher_id = (select auth.uid())
    )
$$;

create or replace function private.teacher_has_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
      select 1
      from public.classroom_students cs
      join public.classrooms c on c.id = cs.classroom_id
      join public.profiles teacher on teacher.id = c.teacher_id
      join public.profiles student on student.id = cs.student_id
      where cs.student_id = p_student_id
        and c.teacher_id = (select auth.uid())
        and c.school_id = teacher.school_id
        and student.school_id = teacher.school_id
    )
$$;

create or replace function private.teacher_can_read_attempt(p_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
      select 1
      from public.test_attempts a
      where a.id = p_attempt_id
        and (select private.teacher_has_student(a.user_id))
    )
$$;

revoke execute on function private.is_teacher() from public;
revoke execute on function private.teacher_owns_class(uuid) from public;
revoke execute on function private.teacher_has_student(uuid) from public;
revoke execute on function private.teacher_can_read_attempt(uuid) from public;
grant execute on function private.is_teacher() to authenticated;
grant execute on function private.teacher_owns_class(uuid) to authenticated;
grant execute on function private.teacher_has_student(uuid) to authenticated;
grant execute on function private.teacher_can_read_attempt(uuid) to authenticated;

drop policy if exists "Teachers manage own classrooms" on public.classrooms;
drop policy if exists "Approved teachers manage own classrooms" on public.classrooms;
create policy "Approved teachers manage own classrooms"
on public.classrooms
for all
to authenticated
using (
  teacher_id = (select auth.uid())
  and (select private.is_approved_teacher())
)
with check (
  teacher_id = (select auth.uid())
  and (select private.is_approved_teacher())
  and school_id = (
    select p.school_id
    from public.profiles p
    where p.id = (select auth.uid())
  )
);
