alter table public.course_modules add column if not exists parent_id text;
create index if not exists course_modules_parent_idx on public.course_modules (parent_id);
