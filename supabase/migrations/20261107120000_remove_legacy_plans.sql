-- Retire the old Стандарт / Ментор+ monthly plans. Only the 7-day, 1-month and 3-month passes exist now.
-- Existing rows are test data; they are relabelled as the 1-month pass so nothing references the old codes.
update public.student_subscriptions set plan_code = 'monthly' where plan_code in ('standard_monthly', 'mentor_monthly');
update public.payment_orders set plan_code = 'monthly' where plan_code in ('standard_monthly', 'mentor_monthly');

alter table public.student_subscriptions drop constraint if exists student_subscriptions_plan_code_check;
alter table public.student_subscriptions add constraint student_subscriptions_plan_code_check
  check (plan_code in ('weekly', 'monthly', 'quarterly'));

-- Orders can only be created for plans that are on sale.
alter table public.payment_orders add constraint payment_orders_plan_code_check
  check (plan_code in ('weekly', 'monthly', 'quarterly'));
