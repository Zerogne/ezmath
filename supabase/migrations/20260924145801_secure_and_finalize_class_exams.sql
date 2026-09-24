-- Close the legacy Data API gap: every teacher helper used by an RLS policy
-- must stop authorizing the teacher immediately after approval is revoked.
create or replace function private.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
$$;

create or replace function private.teacher_owns_class(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
      select 1
      from public.classrooms c
      where c.id = p_classroom_id
        and c.teacher_id = (select auth.uid())
    )
$$;

create or replace function private.teacher_has_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
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
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_approved_teacher())
    and exists (
      select 1
      from public.test_attempts a
      where a.id = p_attempt_id
        and (select private.teacher_has_student(a.user_id))
    )
$$;

revoke execute on function private.is_teacher() from public;
revoke execute on function private.teacher_owns_class(uuid) from public;
revoke execute on function private.teacher_has_student(uuid) from public;
revoke execute on function private.teacher_can_read_attempt(uuid) from public;
grant execute on function private.is_teacher() to authenticated;
grant execute on function private.teacher_owns_class(uuid) to authenticated;
grant execute on function private.teacher_has_student(uuid) to authenticated;
grant execute on function private.teacher_can_read_attempt(uuid) to authenticated;

create or replace function private.class_exam_numeric_answer_matches(
  p_response text,
  p_answer_key text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_actual text := lower(regexp_replace(replace(trim(p_response), ',', '.'), '\s+', '', 'g'));
  v_expected text;
begin
  foreach v_expected in array string_to_array(p_answer_key, '|') loop
    v_expected := lower(regexp_replace(replace(trim(v_expected), ',', '.'), '\s+', '', 'g'));
    if v_actual ~ '^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$'
      and v_expected ~ '^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$' then
      begin
        if abs(v_actual::numeric - v_expected::numeric) <= 0.000000001 then
          return true;
        end if;
      exception
        when numeric_value_out_of_range then null;
      end;
    elsif v_actual = v_expected then
      return true;
    end if;
  end loop;
  return false;
end
$$;

revoke execute on function private.class_exam_numeric_answer_matches(text, text) from public, anon, authenticated;

-- One row lock makes answer persistence, automatic grading, and the submission
-- state transition a single transaction. A concurrent tab blocks on the lock
-- and receives the already-finalized result without overwriting any answers.
create or replace function public.submit_class_exam(
  p_exam_id uuid,
  p_answers jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_student_id uuid := (select auth.uid());
  v_submission public.class_exam_submissions%rowtype;
  v_duration_minutes integer;
  v_closes_at timestamptz;
  v_deadline timestamptz;
  v_answers jsonb := coalesce(p_answers, '[]'::jsonb);
  v_auto_score numeric(10,2) := 0;
  v_needs_manual_grading boolean := false;
  v_finished_at timestamptz := now();
begin
  if v_student_id is null or not exists (
    select 1
    from public.profiles p
    where p.id = v_student_id
      and p.role = 'student'::public.profile_role
  ) then
    raise exception 'student authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(v_answers) <> 'array' or jsonb_array_length(v_answers) > 100 then
    raise exception 'invalid exam answers' using errcode = '22023';
  end if;

  select s.*
  into v_submission
  from public.class_exam_submissions s
  where s.exam_id = p_exam_id
    and s.student_id = v_student_id
  for update;

  if not found then
    raise exception 'active submission not found' using errcode = 'P0002';
  end if;

  if v_submission.status <> 'in_progress'::public.class_exam_submission_status then
    return jsonb_build_object(
      'submissionId', v_submission.id,
      'status', v_submission.status,
      'alreadyFinalized', true
    );
  end if;

  select e.duration_minutes, e.closes_at
  into v_duration_minutes, v_closes_at
  from public.class_exams e
  join public.classroom_students cs
    on cs.classroom_id = e.classroom_id
   and cs.student_id = v_student_id
  where e.id = p_exam_id;

  if not found then
    raise exception 'exam membership not found' using errcode = '42501';
  end if;

  v_deadline := v_submission.started_at + make_interval(mins => v_duration_minutes);
  if v_closes_at is not null then
    v_deadline := least(v_deadline, v_closes_at);
  end if;

  -- After the two-minute delivery grace, finalize unanswered rather than
  -- leaving the unique attempt permanently in progress.
  if v_finished_at > v_deadline + interval '2 minutes' then
    v_answers := '[]'::jsonb;
  end if;

  with supplied as (
    select item
    from jsonb_array_elements(v_answers) as source(item)
    where jsonb_typeof(item) = 'object'
  ), normalized as (
    select
      q.id as question_id,
      q.answer_type,
      q.answer_key,
      q.max_points,
      case
        when q.answer_type = 'multiple_choice'::public.school_library_answer_type
          and exists (
            select 1
            from jsonb_array_elements(q.choices) as choice(item)
            where choice.item ->> 'label' = supplied.item ->> 'selectedChoice'
          )
        then supplied.item ->> 'selectedChoice'
        else null
      end as selected_choice,
      case
        when q.answer_type <> 'multiple_choice'::public.school_library_answer_type
        then nullif(left(trim(coalesce(supplied.item ->> 'responseText', '')), 12000), '')
        else null
      end as response_text
    from public.class_exam_questions q
    left join lateral (
      select candidate.item
      from supplied candidate
      where candidate.item ->> 'questionId' = q.id::text
      limit 1
    ) supplied on true
    where q.exam_id = p_exam_id
  ), scored as (
    select
      normalized.*,
      case
        when answer_type = 'multiple_choice'::public.school_library_answer_type and selected_choice is not null
          then selected_choice = answer_key
        when answer_type = 'numeric'::public.school_library_answer_type and response_text is not null
          then private.class_exam_numeric_answer_matches(response_text, answer_key)
        else null
      end as is_correct
    from normalized
  ), saved as (
    insert into public.class_exam_answers (
      submission_id,
      question_id,
      selected_choice,
      response_text,
      is_correct,
      auto_score,
      manual_score
    )
    select
      v_submission.id,
      question_id,
      selected_choice,
      response_text,
      is_correct,
      case when is_correct then max_points else 0 end,
      null
    from scored
    on conflict (submission_id, question_id) do update
    set selected_choice = excluded.selected_choice,
        response_text = excluded.response_text,
        is_correct = excluded.is_correct,
        auto_score = excluded.auto_score,
        manual_score = null,
        teacher_feedback = '',
        updated_at = now()
    returning auto_score
  )
  select coalesce(sum(saved.auto_score), 0)
  into v_auto_score
  from saved;

  select exists (
    select 1
    from public.class_exam_questions q
    where q.exam_id = p_exam_id
      and q.answer_type = 'free_response'::public.school_library_answer_type
  )
  into v_needs_manual_grading;

  update public.class_exam_submissions
  set status = case
        when v_needs_manual_grading then 'submitted'::public.class_exam_submission_status
        else 'graded'::public.class_exam_submission_status
      end,
      submitted_at = v_finished_at,
      graded_at = case when v_needs_manual_grading then null else v_finished_at end,
      auto_score = v_auto_score,
      manual_score = 0,
      total_score = v_auto_score,
      needs_manual_grading = v_needs_manual_grading
  where id = v_submission.id;

  return jsonb_build_object(
    'submissionId', v_submission.id,
    'status', case when v_needs_manual_grading then 'submitted' else 'graded' end,
    'alreadyFinalized', false
  );
end
$$;

revoke all on function public.submit_class_exam(uuid, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.submit_class_exam(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
