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
- `payment_orders` table for the EzMath source of truth
- `payment_webhook_events` table with provider-event uniqueness for idempotency
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
6. Final EzMath plan codes, prices, and entitlement rules
7. Whether plans are one-time purchases or recurring subscriptions
8. Business verification and settlement bank account before Live mode

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
