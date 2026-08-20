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

create table public.student_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'byl' check (provider = 'byl'),
  plan_code text not null check (plan_code in ('standard_monthly', 'mentor_monthly')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider_customer_id bigint,
  provider_subscription_id bigint not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  provider_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id),
  check (current_period_end is null or current_period_start is null or current_period_end > current_period_start)
);

create index idx_payment_orders_user_created on public.payment_orders(user_id, created_at desc);
create index idx_payment_orders_status_created on public.payment_orders(status, created_at desc);
create index idx_payment_webhook_events_status_received on public.payment_webhook_events(processing_status, received_at);
create index idx_student_subscriptions_user_status on public.student_subscriptions(user_id, status);
create index idx_student_subscriptions_customer on public.student_subscriptions(provider, provider_customer_id) where provider_customer_id is not null;

create trigger payment_orders_set_updated_at before update on public.payment_orders
for each row execute procedure public.set_updated_at();
create trigger student_subscriptions_set_updated_at before update on public.student_subscriptions
for each row execute procedure public.set_updated_at();

alter table public.payment_orders enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.student_subscriptions enable row level security;

create policy "Students read own payment orders" on public.payment_orders
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read payment orders" on public.payment_orders
for select to authenticated using (public.is_admin());

grant select on public.payment_orders to authenticated;

create policy "Students read own subscriptions" on public.student_subscriptions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read subscriptions" on public.student_subscriptions
for select to authenticated using (public.is_admin());

grant select on public.student_subscriptions to authenticated;

-- Webhook events intentionally have no Data API grants or RLS policies.
-- Only trusted server-side service-role code may insert or process them.
