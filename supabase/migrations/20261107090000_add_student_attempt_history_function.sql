-- One round trip for the student's attempt history with per-topic totals.
-- Replaces three sequential REST queries, which also silently stopped at PostgREST's 1000-row limit
-- once a student had more than ~25 attempts' worth of answers.
-- Security definer so it can read question topics (students cannot select public.questions);
-- it only ever returns the caller's own attempts and topic names, never answer keys.
create or replace function public.student_attempt_history(p_limit integer default 100)
returns table (
  attempt_id uuid,
  test_id uuid,
  title text,
  exam_type text,
  subject text,
  score numeric,
  duration_seconds integer,
  completed_at timestamptz,
  correct integer,
  total integer,
  topics jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select a.id, a.test_id, a.score, a.duration_seconds, a.completed_at
    from public.test_attempts a
    where a.user_id = (select auth.uid())
      and a.status = 'submitted'
      and a.completed_at is not null
      and a.score is not null
    order by a.completed_at desc
    limit least(greatest(p_limit, 1), 200)
  ),
  per_topic as (
    select aa.attempt_id,
           coalesce(nullif(btrim(q.topic), ''), 'Бусад') as topic,
           count(*) filter (where aa.is_correct)::integer as correct,
           count(*)::integer as total
    from public.attempt_answers aa
    join recent r on r.id = aa.attempt_id
    left join public.questions q on q.id = aa.question_id
    group by 1, 2
  )
  select r.id, r.test_id, t.title, t.exam_type::text, t.subject, r.score, r.duration_seconds, r.completed_at,
         coalesce(sum(pt.correct), 0)::integer,
         coalesce(sum(pt.total), 0)::integer,
         coalesce(jsonb_agg(jsonb_build_object('topic', pt.topic, 'correct', pt.correct, 'total', pt.total)) filter (where pt.topic is not null), '[]'::jsonb)
  from recent r
  join public.tests t on t.id = r.test_id
  left join per_topic pt on pt.attempt_id = r.id
  group by r.id, r.test_id, t.title, t.exam_type, t.subject, r.score, r.duration_seconds, r.completed_at
  order by r.completed_at asc;
$$;

revoke execute on function public.student_attempt_history(integer) from public, anon;
grant execute on function public.student_attempt_history(integer) to authenticated;
