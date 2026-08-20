-- Import the development mock catalog with deterministic UUIDs so this seed is
-- safe to re-run and can be updated without duplicating records.
do $$
declare
  test_record record;
  question_index integer;
  prompt_index integer;
  choice_index integer;
  test_uuid uuid;
  question_uuid uuid;
  choice_uuid uuid;
  prompt_texts text[] := array[
    'If f(x) = 3x + 7 and f(a) = 25, what is the value of a?',
    '2x + 5 = 17 тэгшитгэлийн x-ийн утгыг олно уу.',
    'Квадратын талын урт 4 бол талбай хэд вэ?',
    '12, 18 тоонуудын хамгийн их ерөнхий хуваагч хэд вэ?',
    'y = 2x + 1 шулууны налалт хэд вэ?',
    '5² − 3² илэрхийллийн утгыг олно уу.',
    'x/3 = 2 бол x хэд вэ?',
    'Гурвалжны дотоод өнцгүүдийн нийлбэр хэд вэ?'
  ];
  topics text[] := array[
    'Шугаман функц', 'Алгебр', 'Геометр', 'Тооны онол',
    'Шугаман функц', 'Зэрэг', 'Алгебр', 'Геометр'
  ];
  correct_labels text[] := array['B', 'B', 'D', 'B', 'A', 'D', 'B', 'C'];
  choice_labels text[] := array['A', 'B', 'C', 'D'];
  default_choice_texts text[] := array['4', '6', '8', '10'];
  function_choice_texts text[] := array['2', '6', '12', '16'];
  angle_choice_texts text[] := array['90°', '120°', '180°', '360°'];
  selected_choice_texts text[];
begin
  for test_record in
    select *
    from jsonb_to_recordset($tests$
      [
        {"slug":"sat-full-01","title":"SAT Full Practice Test 01","description":"Digital SAT-ийн бүтэн хэмжээний жишиг шалгалт.","exam_type":"SAT","subject":"Full Test","question_count":98,"duration_minutes":134,"difficulty":"Medium","test_type":"full"},
        {"slug":"sat-math-01","title":"SAT Math Practice Test 01","description":"Алгебр, функц болон өгөгдлийн бодлогууд.","exam_type":"SAT","subject":"Math","question_count":22,"duration_minutes":35,"difficulty":"Medium","test_type":"practice"},
        {"slug":"sat-rw-01","title":"SAT Reading & Writing 01","description":"Унших, найруулга болон хэлзүйн дасгал.","exam_type":"SAT","subject":"Reading & Writing","question_count":27,"duration_minutes":32,"difficulty":"Medium","test_type":"practice"},
        {"slug":"eyesh-math-2025","title":"ЭЕШ Математик 2025","description":"2025 оны бодит шалгалтын материал.","exam_type":"EYESH","subject":"Математик","year":2025,"question_count":36,"duration_minutes":80,"test_type":"previous-year"},
        {"slug":"eyesh-english-2025","title":"ЭЕШ Англи хэл 2025","description":"2025 оны англи хэлний бодит материал.","exam_type":"EYESH","subject":"Англи хэл","year":2025,"question_count":50,"duration_minutes":80,"test_type":"previous-year"},
        {"slug":"eyesh-physics-2024","title":"ЭЕШ Физик 2024","description":"2024 оны физикийн бодит материал.","exam_type":"EYESH","subject":"Физик","year":2024,"question_count":40,"duration_minutes":80,"difficulty":"Hard","test_type":"previous-year"},
        {"slug":"eyesh-math-practice","title":"ЭЕШ Математик — Алгебр","description":"Алгебрын сэдэвчилсэн дасгал.","exam_type":"EYESH","subject":"Математик","year":2026,"question_count":20,"duration_minutes":40,"difficulty":"Medium","test_type":"practice"}
      ]
    $tests$::jsonb) as test_data(
      slug text,
      title text,
      description text,
      exam_type public.exam_type,
      subject text,
      year smallint,
      question_count integer,
      duration_minutes integer,
      difficulty public.difficulty,
      test_type public.test_type
    )
  loop
    test_uuid := md5('alphamath:test:' || test_record.slug)::uuid;

    insert into public.tests (
      id, exam_type, title, subject, year, duration_minutes, difficulty,
      test_type, status, instructions
    ) values (
      test_uuid, test_record.exam_type, test_record.title, test_record.subject,
      test_record.year, test_record.duration_minutes, test_record.difficulty,
      test_record.test_type, 'published', test_record.description
    )
    on conflict (id) do update set
      exam_type = excluded.exam_type,
      title = excluded.title,
      subject = excluded.subject,
      year = excluded.year,
      duration_minutes = excluded.duration_minutes,
      difficulty = excluded.difficulty,
      test_type = excluded.test_type,
      status = excluded.status,
      instructions = excluded.instructions;

    for question_index in 1..test_record.question_count loop
      prompt_index := ((question_index - 1) % array_length(prompt_texts, 1)) + 1;
      question_uuid := md5(
        'alphamath:question:' || test_record.slug || ':' || question_index
      )::uuid;

      insert into public.questions (
        id, test_id, question_number, question_text, question_type, topic,
        difficulty, explanation
      ) values (
        question_uuid, test_uuid, question_index, prompt_texts[prompt_index],
        'multiple-choice', topics[prompt_index],
        coalesce(test_record.difficulty, 'Medium'::public.difficulty),
        'Тэгшитгэлийг алхам бүрээр хялбарчилж зөв утгыг олно.'
      )
      on conflict (id) do update set
        test_id = excluded.test_id,
        question_number = excluded.question_number,
        question_text = excluded.question_text,
        question_type = excluded.question_type,
        topic = excluded.topic,
        difficulty = excluded.difficulty,
        explanation = excluded.explanation;

      selected_choice_texts := case
        when prompt_index in (3, 8) then angle_choice_texts
        when prompt_index = 5 then function_choice_texts
        else default_choice_texts
      end;

      for choice_index in 1..array_length(choice_labels, 1) loop
        choice_uuid := md5(
          'alphamath:choice:' || test_record.slug || ':' || question_index || ':' || choice_labels[choice_index]
        )::uuid;

        insert into public.answer_choices (
          id, question_id, label, text, is_correct, sort_order
        ) values (
          choice_uuid, question_uuid, choice_labels[choice_index],
          selected_choice_texts[choice_index],
          choice_labels[choice_index] = correct_labels[prompt_index],
          choice_index - 1
        )
        on conflict (id) do update set
          question_id = excluded.question_id,
          label = excluded.label,
          text = excluded.text,
          is_correct = excluded.is_correct,
          sort_order = excluded.sort_order;
      end loop;
    end loop;
  end loop;
end
$$;
