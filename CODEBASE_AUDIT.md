# EzMath Codebase Audit

Audit date: 2026-11-09 (replaces the 2026-08-21 audit)

## Summary

EzMath is in good shape for production. Since the first audit, the project has added:
- automated tests and CI;
- error tracking;
- request rate limits on login, registration, phone verification, avatar upload and the AI PDF import;
- a hard production guard on the admin demo switch.

All 30 application tables have row-level security. Students never receive answer keys before they submit. Service-role access stays in server-only modules.

The open items are smaller:
- rate limits are still missing on some write endpoints;
- one low-severity KaTeX advisory waits on a breaking upgrade;
- the admin material RPC has no integration test.

## Checks performed

| Check | Result |
| --- | --- |
| Lint (`npm run lint`) | Pass. Two warnings, both in the local, git-ignored `imports/` scripts. |
| TypeScript (`npm run typecheck`) | Pass |
| Unit tests (`npm test`, Vitest) | Pass, 20 tests: grading, SAT grid-in rules, streaks, Ulaanbaatar time, exam countdown |
| Browser tests (`npm run test:e2e`, Playwright) | Pass, 10 tests: exam start and finish, fullscreen monitoring and refusal, session restore, SEO routes, phone smoke tests |
| Production build | Pass |
| CI (GitHub Actions, `.github/workflows/ci.yml`) | Runs all of the above on every push and pull request |
| Dependency audit (`npm audit --omit=dev`) | 1 low (KaTeX). Next.js, sharp and source-map-js were patched on 2026-11-09. |
| Unused code (`npx knip`) | No unused files or dependencies |
| RLS on application tables | Pass, 30 of 30 tables |
| Student-safe question/choice views | Pass |
| Service-role imports in client components | Pass, none |

## Resolved since the 2026-08-21 audit

- **High: admin demo mode in production.** `lib/admin/auth.ts` now throws when `ADMIN_DEMO_MODE=true` and `NODE_ENV=production`.
- **Medium: no tests or CI.** Vitest unit tests, Playwright browser tests and a GitHub Actions workflow now exist.
  - The browser suite runs against the bundled mock dataset, so CI needs no secrets.
  - In mock mode, the `e2e-monitored=1` cookie exercises the exam path for school and class students.
- **Medium: no rate limits.** A fixed-window limiter exists: `lib/rate-limit.ts`, backed by `public.consume_rate_limit`.
  - It now covers login (per email), registration (per IP), phone linking and checks, password reset by phone, avatar upload and the AI PDF import.
  - Other write endpoints are still open; see below.
- **Low: minimal observability.** Rollbar is connected through the Vercel Marketplace.
  - Uncaught server errors go through `instrumentation.ts` `onRequestError`. Browser errors are captured too.
  - Handled failures go through `reportServerError()`: attempt start, submission and checkpoint.
  - Answers, tokens and phone numbers are scrubbed before sending.
- **Dependencies.** Next.js moved from 16.3.1 to 16.4.5, fixing a critical metadata-image disclosure advisory and a `use cache` leak advisory. sharp went to 0.35.5 and source-map-js to 1.2.2.
- **Dead code.** These were removed:
  - unused components and the `session-storage` shim;
  - the `pdf-parse` dependency;
  - the superseded v1 illustration sources;
  - copies of the Ulaanbaatar-time math, now consolidated in `lib/ulaanbaatar-time.ts`.

## Open findings

### Medium: rate limits missing on some write endpoints

Every one of these requires a signed-in user and an ownership check, so the risk is load or cost, not data access:
- **No limiter yet:** test attempt start and submit (`app/tests/actions.ts`), checkpoints and integrity events (`app/api/test-attempts/*`), class-exam submission, joining a class, and payment checkout creation.
- **Question-bank answers:** free students are capped at 10 a day by the plan check, but paid students have no limiter.
- **AI analysis and study plans:** generation is deduplicated per attempt and per week, but a failed generation can be retried on every poll with `retry`.

**Recommendation:** use `rateLimit()` per user on submit, checkpoint, joining a class and checkout, and cap AI retries per attempt per hour. Class codes have 6–10 characters, so a per-user limit on joining also makes code guessing impractical.

### Low: KaTeX prototype-pollution advisory

KaTeX 0.16.x is affected by an advisory where existing prototype pollution can bypass trust restrictions. The fix is the 0.19 line, which is a semver-major change. The app does not enable KaTeX `trust`, and the advisory needs a separate prototype-pollution bug to be exploitable.

**Recommendation:** upgrade to KaTeX 0.19, then check rendering with `imports/eyesh/check-latex.mjs` and the admin preview.

### Low: admin material RPC has no integration test

`save_admin_material` runs as `security invoker`, so admin writes depend on table grants as well as RLS. No automated test provisions a fresh project to check create, edit, reorder, publish and delete as an admin and as a student.

**Recommendation:** add a migration-level test against a Supabase branch or a local stack, run when migrations change.

### Low: browser tests run only in mock mode

The Playwright suite covers UI flows against the mock dataset. It does not cover Supabase-backed behavior: RLS, subscriptions, the free-plan limit, leaderboards or the activity triggers.

**Recommendation:** once a staging Supabase project exists, add a nightly suite with seeded test accounts (student, school student, teacher, admin).

### Low: repository policy files

There is no license, security policy or ownership file. Add them if the repository becomes public or gains collaborators.

## Security properties to preserve

- **Answer keys stay on the server.** Students read questions only through the `student_questions` and `student_answer_choices` views. Grading happens on the server with the service role. Never send correct answers, explanations or accepted answers before submission.
- **The service role stays server-only.** `lib/supabase/admin.ts` is `server-only` and must never be imported into a client component.
- **Every new table needs RLS** with ownership predicates. Security-definer functions must set `search_path = ''` and check the caller, like `weekly_leaderboard`, which gives students class rankings only and school rankings only to staff.
- **Roles come from `profiles.role` in the database,** never from user-editable metadata.
- **Exam monitoring applies only to school and class students.** A refused fullscreen request is logged, never blocking. Tab-leave and fullscreen events are recorded through `/api/test-attempts/integrity`.
- **Dates use Ulaanbaatar time.** Calendar logic (daily limits, streaks, weeks) goes through `lib/ulaanbaatar-time.ts` in TypeScript and `private.mn_day()` in SQL, because functions run in Sydney.
- **The CSP is strict** (`next.config.ts`). New external origins must be added explicitly. Rollbar's `api.rollbar.com` is allowed in `connect-src`.

## Release gate

Before each release: CI green (lint, typecheck, unit and browser tests, build), no new high or critical `npm audit` findings, and new migrations committed and applied, with `lib/supabase/database.types.ts` updated to match.
