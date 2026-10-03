create table public.course_modules (
  id text primary key,
  course_slug text not null check (char_length(course_slug) between 2 and 80),
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '' check (char_length(description) <= 500),
  sort_order integer not null default 100 check (sort_order between 0 and 10000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_modules_catalog_idx on public.course_modules (course_slug, sort_order, created_at);

create trigger course_modules_set_updated_at
  before update on public.course_modules
  for each row execute procedure public.set_updated_at();

alter table public.course_modules enable row level security;
revoke all on table public.course_modules from anon, authenticated;
grant select on table public.course_modules to anon, authenticated;
grant insert, update, delete on table public.course_modules to authenticated;

create policy "Course modules are readable"
  on public.course_modules for select to anon, authenticated
  using (true);

create policy "Admins create course modules"
  on public.course_modules for insert to authenticated
  with check (public.is_admin() and created_by = (select auth.uid()));

create policy "Admins update course modules"
  on public.course_modules for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete course modules"
  on public.course_modules for delete to authenticated
  using (public.is_admin());
