create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  course_slug text not null check (char_length(course_slug) between 2 and 80),
  module_id text not null check (char_length(module_id) between 2 and 80),
  title text not null check (char_length(title) between 3 and 160),
  duration_minutes integer not null check (duration_minutes between 1 and 300),
  summary text not null check (char_length(summary) between 10 and 1000),
  objectives text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  status public.content_status not null default 'draft',
  sort_order integer not null default 100 check (sort_order between 0 and 10000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_lessons_catalog_idx
  on public.course_lessons (course_slug, module_id, sort_order, created_at);
create index course_lessons_created_by_idx on public.course_lessons (created_by);

create trigger course_lessons_set_updated_at
  before update on public.course_lessons
  for each row execute procedure public.set_updated_at();

alter table public.course_lessons enable row level security;
revoke all on table public.course_lessons from anon, authenticated;
grant select on table public.course_lessons to anon, authenticated;
grant insert, update, delete on table public.course_lessons to authenticated;

create policy "Published course lessons are readable"
  on public.course_lessons for select to anon, authenticated
  using (status = 'published');

create policy "Admins read all course lessons"
  on public.course_lessons for select to authenticated
  using (public.is_admin());

create policy "Admins create course lessons"
  on public.course_lessons for insert to authenticated
  with check (public.is_admin() and created_by = (select auth.uid()));

create policy "Admins update course lessons"
  on public.course_lessons for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete course lessons"
  on public.course_lessons for delete to authenticated
  using (public.is_admin());
