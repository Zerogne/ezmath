alter type public.profile_role add value if not exists 'teacher';

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  code text not null check (code ~ '^[A-Z0-9]{6,10}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code)
);

create table public.classroom_students (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

create index classrooms_teacher_created_idx on public.classrooms (teacher_id, created_at desc);
create index classroom_students_student_idx on public.classroom_students (student_id, joined_at desc);
create trigger classrooms_set_updated_at before update on public.classrooms for each row execute procedure public.set_updated_at();

alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
revoke all on public.classrooms, public.classroom_students from anon, authenticated;
grant select, insert, update, delete on public.classrooms to authenticated;
grant select, insert, delete on public.classroom_students to authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_teacher()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role::text = 'teacher') $$;
create function private.teacher_owns_class(p_classroom_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = (select auth.uid())) $$;
create function private.student_joined_class(p_classroom_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.classroom_students cs where cs.classroom_id = p_classroom_id and cs.student_id = (select auth.uid())) $$;
create function private.teacher_has_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.classroom_students cs join public.classrooms c on c.id = cs.classroom_id where cs.student_id = p_student_id and c.teacher_id = (select auth.uid())) $$;
create function private.teacher_can_read_attempt(p_attempt_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.test_attempts a join public.classroom_students cs on cs.student_id = a.user_id join public.classrooms c on c.id = cs.classroom_id where a.id = p_attempt_id and c.teacher_id = (select auth.uid())) $$;

revoke execute on function private.is_teacher() from public;
revoke execute on function private.teacher_owns_class(uuid) from public;
revoke execute on function private.student_joined_class(uuid) from public;
revoke execute on function private.teacher_has_student(uuid) from public;
revoke execute on function private.teacher_can_read_attempt(uuid) from public;
grant execute on function private.is_teacher() to authenticated;
grant execute on function private.teacher_owns_class(uuid) to authenticated;
grant execute on function private.student_joined_class(uuid) to authenticated;
grant execute on function private.teacher_has_student(uuid) to authenticated;
grant execute on function private.teacher_can_read_attempt(uuid) to authenticated;

create policy "Teachers manage own classrooms" on public.classrooms for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()) and (select private.is_teacher()));
create policy "Students read joined classrooms" on public.classrooms for select to authenticated
  using ((select private.student_joined_class(id)));
create policy "Teachers read own classroom members" on public.classroom_students for select to authenticated
  using ((select private.teacher_owns_class(classroom_id)));
create policy "Students read own memberships" on public.classroom_students for select to authenticated using (student_id = (select auth.uid()));
create policy "Students leave own classrooms" on public.classroom_students for delete to authenticated using (student_id = (select auth.uid()));
create policy "Teachers remove own classroom members" on public.classroom_students for delete to authenticated
  using ((select private.teacher_owns_class(classroom_id)));

create policy "Teachers read their students profiles" on public.profiles for select to authenticated
  using ((select private.teacher_has_student(profiles.id)));
create policy "Teachers read their students attempts" on public.test_attempts for select to authenticated
  using ((select private.teacher_has_student(test_attempts.user_id)));
create policy "Teachers read their students answers" on public.attempt_answers for select to authenticated
  using ((select private.teacher_can_read_attempt(attempt_answers.attempt_id)));
create policy "Teachers read their students lesson progress" on public.student_lesson_progress for select to authenticated
  using ((select private.teacher_has_student(student_lesson_progress.user_id)));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url', (case when requested_role = 'teacher' then 'teacher' else 'student' end)::public.profile_role)
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public;
