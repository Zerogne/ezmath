do $$
begin
  create type public.school_library_answer_type as enum ('multiple_choice', 'numeric', 'free_response');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.school_library_materials (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  topic text not null check (char_length(trim(topic)) between 1 and 80),
  question_latex text not null check (char_length(trim(question_latex)) between 1 and 12000),
  answer_type public.school_library_answer_type not null,
  answer_key text not null check (char_length(trim(answer_key)) between 1 and 2000),
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_library_materials_answer_type_choices_check check (
    (answer_type = 'multiple_choice' and jsonb_array_length(choices) between 2 and 8)
    or (answer_type <> 'multiple_choice' and choices = '[]'::jsonb)
  )
);

create index if not exists school_library_materials_school_updated_idx
  on public.school_library_materials (school_id, updated_at desc);
create index if not exists school_library_materials_created_by_idx
  on public.school_library_materials (created_by)
  where created_by is not null;

drop trigger if exists school_library_materials_set_updated_at on public.school_library_materials;
create trigger school_library_materials_set_updated_at
before update on public.school_library_materials
for each row execute procedure public.set_updated_at();

create or replace function private.school_library_actor_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.school_id is not null
    and (
      p.role = 'school_admin'::public.profile_role
      or (
        p.role = 'teacher'::public.profile_role
        and p.teacher_status = 'approved'::public.teacher_verification_status
      )
    )
$$;

create or replace function private.can_manage_school_library_material(p_school_id uuid, p_created_by uuid)
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
      and p.school_id = p_school_id
      and (
        p.role = 'school_admin'::public.profile_role
        or (
          p.role = 'teacher'::public.profile_role
          and p.teacher_status = 'approved'::public.teacher_verification_status
          and p_created_by = p.id
        )
      )
  )
$$;

revoke execute on function private.school_library_actor_school_id() from public, anon, authenticated, service_role;
revoke execute on function private.can_manage_school_library_material(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function private.school_library_actor_school_id() to authenticated;
grant execute on function private.can_manage_school_library_material(uuid, uuid) to authenticated;

alter table public.school_library_materials enable row level security;
revoke all on public.school_library_materials from anon, authenticated;
grant select, delete on public.school_library_materials to authenticated;
grant insert (school_id, created_by, title, topic, question_latex, answer_type, answer_key, choices)
  on public.school_library_materials to authenticated;
grant update (title, topic, question_latex, answer_type, answer_key, choices)
  on public.school_library_materials to authenticated;

drop policy if exists "School library members read materials" on public.school_library_materials;
create policy "School library members read materials"
on public.school_library_materials for select to authenticated
using (school_id = (select private.school_library_actor_school_id()));

drop policy if exists "School library members create materials" on public.school_library_materials;
create policy "School library members create materials"
on public.school_library_materials for insert to authenticated
with check (
  school_id = (select private.school_library_actor_school_id())
  and created_by = (select auth.uid())
);

drop policy if exists "School library owners update materials" on public.school_library_materials;
create policy "School library owners update materials"
on public.school_library_materials for update to authenticated
using ((select private.can_manage_school_library_material(school_id, created_by)))
with check ((select private.can_manage_school_library_material(school_id, created_by)));

drop policy if exists "School library owners delete materials" on public.school_library_materials;
create policy "School library owners delete materials"
on public.school_library_materials for delete to authenticated
using ((select private.can_manage_school_library_material(school_id, created_by)));

notify pgrst, 'reload schema';
