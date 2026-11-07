# BYL.mn integration preparation

Status: prepared but intentionally inactive.

## Confirmed provider contract

- API base: `https://byl.mn/api/v1`
- Authentication: `Authorization: Bearer <token>`
- Checkout creation: `POST /projects/:project_id/checkouts`
- Hosted checkout returns `data.id` and `data.url`
- EzMath UUID order IDs fit BYL's 48-character `client_reference_id` limit
- Successful payment is confirmed by `checkout.completed`, not the browser redirect
- Webhooks use raw-body HMAC-SHA256 in the `Byl-Signature` header
- Delivery expects a 2xx response within five seconds and may retry up to eight times
- Events can be duplicated and arrive out of order

Official references: [quickstart](https://byl.mn/docs/quickstart.html), [checkouts](https://byl.mn/docs/api/checkouts.html), [webhooks](https://byl.mn/docs/webhook.html).

## Prepared components

- Server-only BYL client and webhook signature verifier in `lib/byl/`
- Webhook endpoint at `POST /api/payments/byl/webhook`
- Authenticated server checkout action that upserts a BYL customer and creates a recurring hosted checkout
- `payment_orders` table for the EzMath source of truth
- `payment_webhook_events` table with provider-event uniqueness for idempotency
- `student_subscriptions` table for BYL subscription state and student entitlements
- Student ownership RLS for reading payment orders
- No student insert/update grants; prices and statuses remain server-controlled
- Environment-variable placeholders with no credentials committed

The migration is local only until the live integration begins. Do not deploy it before product access rules and plan mapping are approved.

## Merchant information needed

1. BYL team and Test-mode project
2. Replacement `BYL_API_TOKEN` after rotating the exposed token
3. `BYL_PROJECT_ID`
4. Webhook signing secret
5. BYL product price lookup keys
7. Business verification and settlement bank account before Live mode

Plans are fixed-length passes sold as one-time BYL prices: `BYL_WEEKLY_PRICE_ID`, `BYL_MONTHLY_PRICE_ID` and `BYL_QUARTERLY_PRICE_ID` hold the numeric price IDs for the 7-day, 1-month and 3-month plans (`lib/payments/plans.ts`). Each BYL price must charge exactly the plan's `priceMnt`, or the webhook rejects the payment. A pass bought while another is active starts when the current one ends.

Set `BYL_TEST_MODE=true` only for a BYL Test project. Checkout orders and webhook amount validation then use BYL's documented fixed ₮50 test transaction amount while the landing page continues to show the intended Live prices. Set it to `false` before switching the BYL project to Live mode.

## Approved access model

| Plan | Price | Access |
| --- | ---: | --- |
| No plan | — | One full mock or ЭЕШ attempt, 10 question-bank answers a day, first lesson of each section, no report or AI |
| 7 хоног (`weekly`) | ₮8,900 one-time | Everything: all mocks, lessons, unlimited exercises, detailed reports, AI mock analysis and weekly AI plan, for 7 days |
| 1 сар (`monthly`) | ₮14,900 one-time | Same, for 1 month |
| 3 сар (`quarterly`) | ₮29,900 one-time | Same, for 3 months |

Payments are one-time and never renew automatically. Access lasts until `current_period_end`; a pass bought while another is active starts when the current one ends. Payments are non-refundable (see `/terms`).

## Planned flow

1. An authenticated student chooses a server-defined plan.
2. EzMath creates a pending order using an authoritative server price.
3. EzMath creates a hosted checkout using the order UUID as `client_reference_id`.
4. BYL receives the student payment.
5. The webhook verifies the raw-body signature and stores the unique event.
6. A database transaction marks the order paid and grants its entitlement once.
7. The success page only displays database state; it never grants access.

## Security checklist

- Keep the API token and signing secret server-only.
- Reject unknown project IDs, event types, plan codes, amounts, and checkout IDs.
- Use constant-time signature comparison against the untouched raw body.
- Process each provider event once using the database unique constraint.
- Never trust redirect query parameters, client-submitted prices, or email as payment proof.
- Return quickly from webhooks and keep downstream processing retry-safe.
- Rate-limit checkout creation.
- Complete a ₮50 Test-mode payment before enabling Live mode.
