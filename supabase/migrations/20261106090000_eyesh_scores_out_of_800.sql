-- ЭЕШ attempt scores move from accuracy % (0–100) to the 0–800 scale used everywhere else.
-- Apply right before deploying the matching code. The `score <= 100` guard keeps a re-run from
-- multiplying already-converted scores, except genuinely low 0–100/800 results submitted after deploy.
update public.test_attempts a
set score = round(a.score * 8)
from public.tests t
where t.id = a.test_id
  and t.exam_type = 'EYESH'
  and a.score is not null
  and a.score <= 100;
