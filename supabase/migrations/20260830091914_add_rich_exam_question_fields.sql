alter table public.tests add column if not exists variant text;
alter table public.answer_choices add column if not exists image_url text;
alter table public.questions add column if not exists response_fields jsonb not null default '[]'::jsonb;
alter table public.attempt_answers add column if not exists written_response jsonb;

create table if not exists public.question_response_answers (
  question_id uuid not null references public.questions(id) on delete cascade,
  field_id uuid not null,
  accepted_answers text[] not null default '{}',
  primary key (question_id, field_id)
);
alter table public.question_response_answers enable row level security;
revoke all on public.question_response_answers from anon, authenticated;

-- Never leave accepted answers inside student-readable question metadata.
update public.questions q
set response_fields = coalesce((
  select jsonb_agg(jsonb_build_object('id', field ->> 'id', 'label', field ->> 'label'))
  from jsonb_array_elements(q.response_fields) field
), '[]'::jsonb)
where jsonb_array_length(q.response_fields) > 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tests_variant_check' and conrelid = 'public.tests'::regclass
  ) then
    alter table public.tests add constraint tests_variant_check
      check (variant is null or variant in ('A', 'B', 'C', 'D'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'questions_response_fields_array_check' and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions add constraint questions_response_fields_array_check
      check (jsonb_typeof(response_fields) = 'array');
  end if;
end $$;

drop view if exists public.student_answer_choices;
drop view if exists public.student_questions;

create view public.student_questions with (security_invoker = true) as
select q.id, q.test_id, q.question_number, q.question_text, q.question_type,
       q.response_fields, q.topic, q.image_url
from public.questions q
join public.tests t on t.id = q.test_id
where t.status = 'published';

create view public.student_answer_choices with (security_invoker = true) as
select c.id, c.question_id, c.label, c.text, c.image_url, c.sort_order
from public.answer_choices c
join public.questions q on q.id = c.question_id
join public.tests t on t.id = q.test_id
where t.status = 'published';

revoke all on public.student_questions, public.student_answer_choices from anon, authenticated;
grant select on public.student_questions, public.student_answer_choices to anon, authenticated;

grant select (id, test_id, question_number, question_text, question_type, response_fields, topic, image_url)
  on public.questions to anon, authenticated;
grant select (id, question_id, label, text, image_url, sort_order)
  on public.answer_choices to anon, authenticated;
