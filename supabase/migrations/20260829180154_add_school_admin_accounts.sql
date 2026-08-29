alter type public.profile_role add value if not exists 'school_admin';

create or replace function private.school_admin_school_id()
returns uuid language sql stable security definer set search_path = ''
as $$ select p.school_id from public.profiles p where p.id = (select auth.uid()) and p.role::text = 'school_admin' $$;
revoke execute on function private.school_admin_school_id() from public;
grant execute on function private.school_admin_school_id() to authenticated;

drop policy if exists "School admins read school profiles" on public.profiles;
create policy "School admins read school profiles" on public.profiles for select to authenticated
  using (school_id is not null and school_id = (select private.school_admin_school_id()));
drop policy if exists "School admins read school classrooms" on public.classrooms;
create policy "School admins read school classrooms" on public.classrooms for select to authenticated
  using (school_id = (select private.school_admin_school_id()));
drop policy if exists "School admins read school memberships" on public.classroom_students;
create policy "School admins read school memberships" on public.classroom_students for select to authenticated
  using (exists (select 1 from public.classrooms c where c.id = classroom_id and c.school_id = (select private.school_admin_school_id())));
drop policy if exists "School admins read school attempts" on public.test_attempts;
create policy "School admins read school attempts" on public.test_attempts for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = test_attempts.user_id and p.school_id = (select private.school_admin_school_id())));
drop policy if exists "School admins read school answers" on public.attempt_answers;
create policy "School admins read school answers" on public.attempt_answers for select to authenticated
  using (exists (select 1 from public.test_attempts a join public.profiles p on p.id = a.user_id where a.id = attempt_answers.attempt_id and p.school_id = (select private.school_admin_school_id())));
drop policy if exists "School admins read school lesson progress" on public.student_lesson_progress;
create policy "School admins read school lesson progress" on public.student_lesson_progress for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = student_lesson_progress.user_id and p.school_id = (select private.school_admin_school_id())));
