-- Each module, submodule and topic (lesson) can carry one worked example and one test problem with its answer.
-- Text supports KaTeX ($...$). `test_answer` may list several accepted answers separated by ";".
alter table public.course_modules
  add column example text check (char_length(example) <= 4000),
  add column test_problem text check (char_length(test_problem) <= 4000),
  add column test_answer text check (char_length(test_answer) <= 300);

alter table public.course_lessons
  add column example text check (char_length(example) <= 4000),
  add column test_problem text check (char_length(test_problem) <= 4000),
  add column test_answer text check (char_length(test_answer) <= 300);
