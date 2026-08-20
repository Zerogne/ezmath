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

create index idx_payment_orders_user_created on public.payment_orders(user_id, created_at desc);
create index idx_payment_orders_status_created on public.payment_orders(status, created_at desc);
create index idx_payment_webhook_events_status_received on public.payment_webhook_events(processing_status, received_at);

create trigger payment_orders_set_updated_at before update on public.payment_orders
for each row execute procedure public.set_updated_at();

alter table public.payment_orders enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "Students read own payment orders" on public.payment_orders
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read payment orders" on public.payment_orders
for select to authenticated using (public.is_admin());

grant select on public.payment_orders to authenticated;

-- Webhook events intentionally have no Data API grants or RLS policies.
-- Only trusted server-side service-role code may insert or process them.
