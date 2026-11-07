-- Plans become fixed-length passes (7 days, 1 month, 3 months). The old monthly codes stay valid
-- so existing subscriptions and payment history keep working.
do $$
declare
  existing text;
begin
  -- The original check was declared inline, so look it up by definition rather than assuming its name.
  for existing in
    select conname from pg_constraint
    where conrelid = 'public.student_subscriptions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%plan_code%'
  loop
    execute format('alter table public.student_subscriptions drop constraint %I', existing);
  end loop;
end $$;

alter table public.student_subscriptions add constraint student_subscriptions_plan_code_check
  check (plan_code in ('weekly', 'monthly', 'quarterly', 'standard_monthly', 'mentor_monthly'));
