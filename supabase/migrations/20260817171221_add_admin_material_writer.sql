create or replace function public.save_admin_material(
  p_test_id uuid,
  p_exam_type public.exam_type,
  p_title text,
  p_subject text,
  p_year smallint,
  p_duration_minutes integer,
  p_test_type public.test_type,
  p_status public.content_status,
  p_instructions text,
  p_questions jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_test_id uuid;
  v_question jsonb;
  v_choice jsonb;
  v_question_id uuid;
  v_choice_id uuid;
  v_question_number integer := 0;
  v_choice_order integer;
begin
  if not public.is_admin() then
    raise exception 'Admin authorization is required.' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null or nullif(btrim(p_subject), '') is null then
    raise exception 'Title and subject are required.' using errcode = '22023';
  end if;
  if p_duration_minutes <= 0 then
    raise exception 'Duration must be positive.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'At least one question is required.' using errcode = '22023';
  end if;

  if p_test_id is null then
    insert into public.tests (
      exam_type, title, subject, year, duration_minutes, test_type,
      status, instructions, created_by
    ) values (
      p_exam_type, btrim(p_title), btrim(p_subject), p_year,
      p_duration_minutes, p_test_type, p_status, nullif(btrim(p_instructions), ''),
      (select auth.uid())
    ) returning id into v_test_id;
  else
    update public.tests set
      exam_type = p_exam_type,
      title = btrim(p_title),
      subject = btrim(p_subject),
      year = p_year,
      duration_minutes = p_duration_minutes,
      test_type = p_test_type,
      status = p_status,
      instructions = nullif(btrim(p_instructions), '')
    where id = p_test_id
    returning id into v_test_id;
    if v_test_id is null then
      raise exception 'Material not found.' using errcode = 'P0002';
    end if;
  end if;

  -- Free the per-test question numbers before applying a reordered payload.
  update public.questions
  set question_number = question_number + 100000
  where test_id = v_test_id;

  for v_question in select value from jsonb_array_elements(p_questions)
  loop
    v_question_number := v_question_number + 1;
    v_question_id := (v_question ->> 'id')::uuid;
    if nullif(btrim(v_question ->> 'text'), '') is null then
      raise exception 'Question % has no text.', v_question_number using errcode = '22023';
    end if;
    if exists (select 1 from public.questions where id = v_question_id and test_id <> v_test_id) then
      raise exception 'Question belongs to another material.' using errcode = '42501';
    end if;

    insert into public.questions (
      id, test_id, question_number, question_text, question_type, topic,
      difficulty, explanation
    ) values (
      v_question_id, v_test_id, v_question_number, btrim(v_question ->> 'text'),
      'multiple-choice', nullif(btrim(v_question ->> 'topic'), ''),
      (v_question ->> 'difficulty')::public.difficulty,
      nullif(btrim(v_question ->> 'explanation'), '')
    )
    on conflict (id) do update set
      question_number = excluded.question_number,
      question_text = excluded.question_text,
      question_type = excluded.question_type,
      topic = excluded.topic,
      difficulty = excluded.difficulty,
      explanation = excluded.explanation;

    v_choice_order := 0;
    for v_choice in select value from jsonb_array_elements(v_question -> 'choices')
    loop
      v_choice_id := (v_choice ->> 'id')::uuid;
      insert into public.answer_choices (
        id, question_id, label, text, is_correct, sort_order
      ) values (
        v_choice_id, v_question_id, v_choice ->> 'label',
        btrim(v_choice ->> 'text'),
        (v_choice ->> 'label') = (v_question ->> 'correctAnswer'),
        v_choice_order
      )
      on conflict (question_id, label) do update set
        text = excluded.text,
        is_correct = excluded.is_correct,
        sort_order = excluded.sort_order;
      v_choice_order := v_choice_order + 1;
    end loop;

    delete from public.answer_choices choice
    where choice.question_id = v_question_id
      and not exists (
        select 1 from jsonb_array_elements(v_question -> 'choices') incoming
        where incoming ->> 'label' = choice.label
      );
  end loop;

  delete from public.questions question
  where question.test_id = v_test_id
    and not exists (
      select 1 from jsonb_array_elements(p_questions) incoming
      where (incoming ->> 'id')::uuid = question.id
    );

  return v_test_id;
end
$$;

revoke all on function public.save_admin_material(
  uuid, public.exam_type, text, text, smallint, integer,
  public.test_type, public.content_status, text, jsonb
) from public;
grant execute on function public.save_admin_material(
  uuid, public.exam_type, text, text, smallint, integer,
  public.test_type, public.content_status, text, jsonb
) to authenticated;
