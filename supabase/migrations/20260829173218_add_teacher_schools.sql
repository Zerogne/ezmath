create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slug)
);

insert into public.schools (name, slug) values ('Amjilt Cyber', 'amjilt-cyber')
on conflict (slug) do update set name = excluded.name, is_active = true;

alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null;
create index if not exists profiles_school_id_idx on public.profiles (school_id) where school_id is not null;

alter table public.schools enable row level security;
revoke all on public.schools from anon, authenticated;
grant select on public.schools to authenticated;
drop policy if exists "Authenticated users read active schools" on public.schools;
create policy "Authenticated users read active schools" on public.schools for select to authenticated using (is_active);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_school text := new.raw_user_meta_data ->> 'school_slug';
  selected_school uuid;
begin
  if requested_role = 'teacher' then
    select s.id into selected_school
    from public.schools s
    where s.slug = requested_school and s.is_active;
  end if;

  insert into public.profiles (id, full_name, avatar_url, role, school_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    (case when requested_role = 'teacher' then 'teacher' else 'student' end)::public.profile_role,
    selected_school
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public;
