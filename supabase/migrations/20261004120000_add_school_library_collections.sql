-- A collection is a whole material (e.g. an ЭЕШ variant) made of ordered problems.
-- Problems stay in school_library_materials; collection_id = null means a standalone problem.

-- (Re)define the library access helpers from 20260924124128_add_school_library.sql: the live
-- database was found without them, and everything below depends on them.
create schema if not exists private;

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
grant usage on schema private to authenticated;
grant execute on function private.school_library_actor_school_id() to authenticated;
grant execute on function private.can_manage_school_library_material(uuid, uuid) to authenticated;

create table if not exists public.school_library_collections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  subject text not null check (char_length(trim(subject)) between 1 and 80),
  year smallint check (year is null or year between 2000 and 2100),
  variant text check (variant is null or variant in ('A', 'B', 'C', 'D', 'E')),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_library_collections_school_updated_idx
  on public.school_library_collections (school_id, updated_at desc);
create index if not exists school_library_collections_created_by_idx
  on public.school_library_collections (created_by)
  where created_by is not null;

drop trigger if exists school_library_collections_set_updated_at on public.school_library_collections;
create trigger school_library_collections_set_updated_at
before update on public.school_library_collections
for each row execute procedure public.set_updated_at();

alter table public.school_library_materials
  add column if not exists collection_id uuid references public.school_library_collections(id) on delete cascade,
  add column if not exists position integer check (position is null or position > 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'school_library_materials_collection_position_check'
      and conrelid = 'public.school_library_materials'::regclass
  ) then
    alter table public.school_library_materials add constraint school_library_materials_collection_position_check
      check ((collection_id is null) = (position is null));
  end if;
end $$;

create index if not exists school_library_materials_collection_idx
  on public.school_library_materials (collection_id, position)
  where collection_id is not null;

-- Same ownership rule as single problems: school admins manage everything, approved teachers manage their own.
create or replace function private.can_manage_school_library_collection(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_library_collections c
    where c.id = p_collection_id
      and private.can_manage_school_library_material(c.school_id, c.created_by)
  )
$$;

revoke execute on function private.can_manage_school_library_collection(uuid) from public, anon, authenticated, service_role;
grant execute on function private.can_manage_school_library_collection(uuid) to authenticated;

alter table public.school_library_collections enable row level security;
revoke all on public.school_library_collections from anon, authenticated;
grant select, delete on public.school_library_collections to authenticated;
grant insert (school_id, created_by, title, subject, year, variant, description)
  on public.school_library_collections to authenticated;
grant update (title, subject, year, variant, description)
  on public.school_library_collections to authenticated;

drop policy if exists "School library members read collections" on public.school_library_collections;
create policy "School library members read collections"
on public.school_library_collections for select to authenticated
using (school_id = (select private.school_library_actor_school_id()));

drop policy if exists "School library members create collections" on public.school_library_collections;
create policy "School library members create collections"
on public.school_library_collections for insert to authenticated
with check (
  school_id = (select private.school_library_actor_school_id())
  and created_by = (select auth.uid())
);

drop policy if exists "School library owners update collections" on public.school_library_collections;
create policy "School library owners update collections"
on public.school_library_collections for update to authenticated
using ((select private.can_manage_school_library_material(school_id, created_by)))
with check ((select private.can_manage_school_library_material(school_id, created_by)));

drop policy if exists "School library owners delete collections" on public.school_library_collections;
create policy "School library owners delete collections"
on public.school_library_collections for delete to authenticated
using ((select private.can_manage_school_library_material(school_id, created_by)));

-- Problems: collection_id is set on insert only (problems never move between collections); position can change.
grant insert (collection_id, position) on public.school_library_materials to authenticated;
grant update (position) on public.school_library_materials to authenticated;

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
  and (collection_id is null or (select private.can_manage_school_library_collection(collection_id)))
);

-- Whoever manages a collection manages every problem in it, regardless of which account typed the problem.
drop policy if exists "School library owners update materials" on public.school_library_materials;
create policy "School library owners update materials"
on public.school_library_materials for update to authenticated
using (
  (select private.can_manage_school_library_material(school_id, created_by))
  or (collection_id is not null and (select private.can_manage_school_library_collection(collection_id)))
)
with check (
  (select private.can_manage_school_library_material(school_id, created_by))
  or (collection_id is not null and (select private.can_manage_school_library_collection(collection_id)))
);

drop policy if exists "School library owners delete materials" on public.school_library_materials;
create policy "School library owners delete materials"
on public.school_library_materials for delete to authenticated
using (
  (select private.can_manage_school_library_material(school_id, created_by))
  or (collection_id is not null and (select private.can_manage_school_library_collection(collection_id)))
);

-- Saves a collection and its full ordered problem list in one transaction. Runs as the caller, so RLS applies.
-- p_problems: [{ id?: uuid, title, topic, question_latex, answer_type, answer_key, choices }] in display order.
-- Existing problems missing from p_problems are deleted.
create or replace function public.save_school_library_collection(
  p_collection_id uuid,
  p_title text,
  p_subject text,
  p_year smallint,
  p_variant text,
  p_description text,
  p_problems jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_school_id uuid := private.school_library_actor_school_id();
  v_collection_id uuid;
  v_keep uuid[];
  v_problem jsonb;
  v_problem_id uuid;
  v_position integer := 0;
begin
  if v_school_id is null then
    raise exception 'not allowed to manage the school library' using errcode = '42501';
  end if;
  if jsonb_typeof(p_problems) <> 'array' or jsonb_array_length(p_problems) > 200 then
    raise exception 'invalid problem list' using errcode = '22023';
  end if;

  if p_collection_id is null then
    insert into public.school_library_collections (school_id, created_by, title, subject, year, variant, description)
    values (v_school_id, (select auth.uid()), p_title, p_subject, p_year, p_variant, coalesce(p_description, ''))
    returning id into v_collection_id;
  else
    update public.school_library_collections
    set title = p_title, subject = p_subject, year = p_year, variant = p_variant, description = coalesce(p_description, '')
    where id = p_collection_id
    returning id into v_collection_id;
    if v_collection_id is null then
      raise exception 'collection not found or not editable' using errcode = 'P0002';
    end if;
  end if;

  select coalesce(array_agg((item ->> 'id')::uuid), '{}')
  into v_keep
  from jsonb_array_elements(p_problems) item
  where nullif(item ->> 'id', '') is not null;

  delete from public.school_library_materials
  where collection_id = v_collection_id
    and not (id = any (v_keep));

  for v_problem in select * from jsonb_array_elements(p_problems)
  loop
    v_position := v_position + 1;
    if nullif(v_problem ->> 'id', '') is not null then
      update public.school_library_materials
      set title = v_problem ->> 'title',
          topic = v_problem ->> 'topic',
          question_latex = v_problem ->> 'question_latex',
          answer_type = (v_problem ->> 'answer_type')::public.school_library_answer_type,
          answer_key = v_problem ->> 'answer_key',
          choices = coalesce(v_problem -> 'choices', '[]'::jsonb),
          position = v_position
      where id = (v_problem ->> 'id')::uuid
        and collection_id = v_collection_id
      returning id into v_problem_id;
      if v_problem_id is null then
        raise exception 'problem not found in collection' using errcode = 'P0002';
      end if;
    else
      insert into public.school_library_materials (
        school_id, created_by, collection_id, position, title, topic, question_latex, answer_type, answer_key, choices
      ) values (
        v_school_id, (select auth.uid()), v_collection_id, v_position,
        v_problem ->> 'title', v_problem ->> 'topic', v_problem ->> 'question_latex',
        (v_problem ->> 'answer_type')::public.school_library_answer_type,
        v_problem ->> 'answer_key', coalesce(v_problem -> 'choices', '[]'::jsonb)
      );
    end if;
  end loop;

  return v_collection_id;
end
$$;

revoke execute on function public.save_school_library_collection(uuid, text, text, smallint, text, text, jsonb) from public, anon;
grant execute on function public.save_school_library_collection(uuid, text, text, smallint, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
