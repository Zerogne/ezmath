alter table public.schools add column if not exists registration_code_hash text;
update public.schools
set registration_code_hash = '8620c5e0f9574f75dcc16b4d75090a5c816e887e1798516f779f0f148cc5dfc1'
where slug = 'amjilt-cyber';
alter table public.schools alter column registration_code_hash set not null;

revoke select on public.schools from authenticated;
grant select (id, name, slug, is_active, created_at) on public.schools to authenticated;

update public.profiles p
set school_id = s.id
from public.schools s
where p.role::text = 'teacher' and p.school_id is null and s.slug = 'amjilt-cyber';

alter table public.classrooms add column if not exists school_id uuid references public.schools(id) on delete restrict;
update public.classrooms c
set school_id = p.school_id
from public.profiles p
where p.id = c.teacher_id and c.school_id is null;
alter table public.classrooms alter column school_id set not null;
create index if not exists classrooms_school_id_idx on public.classrooms (school_id);

drop policy if exists "Teachers manage own classrooms" on public.classrooms;
create policy "Teachers manage own classrooms" on public.classrooms for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and (select private.is_teacher())
    and school_id = (select p.school_id from public.profiles p where p.id = (select auth.uid()))
  );

create or replace function private.teacher_has_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
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
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.test_attempts a
    where a.id = p_attempt_id and private.teacher_has_student(a.user_id)
  )
$$;

revoke execute on function private.teacher_has_student(uuid) from public;
revoke execute on function private.teacher_can_read_attempt(uuid) from public;
grant execute on function private.teacher_has_student(uuid) to authenticated;
grant execute on function private.teacher_can_read_attempt(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, school_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'student'::public.profile_role,
    null
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public;
