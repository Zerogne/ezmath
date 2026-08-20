-- EzMath schema. Run in a Supabase project after auth is configured.
create extension if not exists "pgcrypto";

create type public.exam_type as enum ('SAT', 'EYESH');
create type public.test_type as enum ('full', 'practice', 'previous-year');
create type public.difficulty as enum ('Easy', 'Medium', 'Hard');
create type public.profile_role as enum ('student', 'admin');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.attempt_status as enum ('not_started', 'in_progress', 'submitted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.profile_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  exam_type public.exam_type not null,
  title text not null,
  subject text not null,
  year smallint,
  duration_minutes integer not null check (duration_minutes > 0),
  difficulty public.difficulty,
  test_type public.test_type not null,
  status public.content_status not null default 'draft',
  instructions text,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question_number integer not null check (question_number > 0),
  question_text text not null,
  question_type text not null default 'multiple-choice',
  topic text,
  difficulty public.difficulty,
  explanation text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, question_number)
);

create table public.answer_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  text text not null,
  is_correct boolean not null default false,
  sort_order smallint not null default 0,
  unique (question_id, label)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric,
  duration_seconds integer check (duration_seconds >= 0)
  ,status public.attempt_status not null default 'in_progress'
  ,session_snapshot jsonb
  ,session_version integer not null default 0
  ,last_saved_at timestamptz
  ,created_at timestamptz not null default now()
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_choice_id uuid references public.answer_choices(id),
  is_correct boolean,
  time_spent_seconds integer check (time_spent_seconds >= 0),
  marked_for_review boolean not null default false,
  unique (attempt_id, question_id)
);

create table public.student_support_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'byl' check (provider = 'byl'),
  plan_code text not null check (char_length(plan_code) between 1 and 64),
  amount_mnt bigint not null check (amount_mnt > 0),
  status text not null default 'pending' check (status in ('pending', 'checkout_created', 'paid', 'expired', 'canceled', 'failed', 'refunded')),
  provider_checkout_id bigint,
  checkout_url text,
  payment_method text,
  expires_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_checkout_id)
);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'byl' check (provider = 'byl'),
  provider_event_id bigint not null,
  event_type text not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

revoke execute on function public.handle_new_user() from public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger tests_set_updated_at before update on public.tests for each row execute procedure public.set_updated_at();
create trigger questions_set_updated_at before update on public.questions for each row execute procedure public.set_updated_at();
create trigger payment_orders_set_updated_at before update on public.payment_orders for each row execute procedure public.set_updated_at();

revoke execute on function public.set_updated_at() from public;

create index idx_questions_test_number on public.questions(test_id, question_number);
create index idx_tests_exam_subject_year on public.tests(exam_type, subject, year);
create index idx_attempts_user_created on public.test_attempts(user_id, created_at desc);
create index idx_attempts_test on public.test_attempts(test_id);
create index idx_attempt_answers_attempt on public.attempt_answers(attempt_id);
create index idx_student_support_questions_user_created on public.student_support_questions(user_id, created_at desc);
create index idx_payment_orders_user_created on public.payment_orders(user_id, created_at desc);
create index idx_payment_orders_status_created on public.payment_orders(status, created_at desc);
create index idx_payment_webhook_events_status_received on public.payment_webhook_events(processing_status, received_at);

alter table public.profiles enable row level security;
alter table public.test_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.answer_choices enable row level security;
alter table public.student_support_questions enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_webhook_events enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Minimal ownership policies. Public catalog policies can be added with publishing roles.
create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Admins read profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Users read own attempts" on public.test_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own attempts" on public.test_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own attempts" on public.test_attempts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage answers on own attempts" on public.attempt_answers for all to authenticated using (
  exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
);
create policy "Students read own support questions" on public.student_support_questions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own support questions" on public.student_support_questions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Admins manage support questions" on public.student_support_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.student_support_questions to authenticated;
create policy "Students read own payment orders" on public.payment_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read payment orders" on public.payment_orders for select to authenticated using (public.is_admin());
grant select on public.payment_orders to authenticated;

create policy "Published tests are readable" on public.tests for select to anon, authenticated using (status = 'published');
create policy "Published questions are readable" on public.questions for select to anon, authenticated using (
  exists (select 1 from public.tests t where t.id = test_id and t.status = 'published')
);
create policy "Published choices are readable" on public.answer_choices for select to anon, authenticated using (
  exists (select 1 from public.questions q join public.tests t on t.id = q.test_id where q.id = question_id and t.status = 'published')
);
create policy "Admins manage tests" on public.tests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage questions" on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage choices" on public.answer_choices for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Student payloads must use these views. They intentionally omit answers and explanations.
create view public.student_questions with (security_invoker = true) as
select q.id, q.test_id, q.question_number, q.question_text, q.topic, q.image_url
from public.questions q join public.tests t on t.id = q.test_id
where t.status = 'published';

create view public.student_answer_choices with (security_invoker = true) as
select c.id, c.question_id, c.label, c.text, c.sort_order
from public.answer_choices c
join public.questions q on q.id = c.question_id
join public.tests t on t.id = q.test_id
where t.status = 'published';

revoke all on public.questions, public.answer_choices from anon, authenticated;
grant select on public.tests to anon, authenticated;
grant select (id, test_id, question_number, question_text, topic, image_url)
  on public.questions to anon, authenticated;
grant select (id, question_id, label, text, sort_order)
  on public.answer_choices to anon, authenticated;
grant select on public.student_questions, public.student_answer_choices to anon, authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
