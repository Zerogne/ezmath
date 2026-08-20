# EzMath Codebase Audit

Audit date: 2026-08-21

## Executive summary

The application builds successfully and has a sound baseline for a production-oriented Next.js and Supabase application. Authentication is verified server-side, student records use ownership-based RLS, published exam data is separated from answer-key data, service-role access remains in server-only modules, and the dependency audit currently reports no known vulnerabilities.

Production readiness is limited mainly by missing automated tests and CI, missing request rate limits, a dangerous local-only admin demo switch, and the need for a clean-project integration test of the admin material writer RPC.

## Checks performed

| Check | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | Pass |
| ESLint (`npm run lint`) | Pass |
| Next.js production build (`npm run build`) | Pass |
| npm vulnerability audit | Pass — 0 known vulnerabilities |
| Supabase database lint | Pass — no schema errors |
| Local/remote migration parity | Pass — 5 migrations synchronized |
| Secret file ignore rules | Pass — `.env*.local` ignored |
| RLS enabled on exposed application tables | Pass |
| Student ownership predicates | Pass |
| Student-safe question/choice views | Pass |
| Service-role imports in client components | Pass — none found |

## Findings

### High: production must reject admin demo mode

`ADMIN_DEMO_MODE=true` returns a synthetic administrator without a Supabase session. This is useful for local UI review but would bypass normal admin identity checks if accidentally enabled in production, including the protected PDF-import endpoint.

Recommendation: enforce a production guard that throws during startup when `ADMIN_DEMO_MODE=true`, and keep the variable unset in every hosted environment.

### Medium: no automated application tests or CI

The repository has no unit, integration, browser, or RLS regression suite and no continuous-integration workflow. Type checking and builds catch compilation failures but do not validate authorization behavior or user workflows.

Recommendation: add Vitest for pure scoring logic, Playwright for login/exam/dashboard flows, SQL/RLS tests for cross-user isolation, and a GitHub Actions workflow running typecheck, lint, tests, and build.

### Medium: mutation and import endpoints have no rate limiting

The checkpoint endpoint, exam submission Server Action, authentication entry points, and AI-backed PDF import do not have application-level throttling. Authentication and admin checks reduce exposure, but abusive clients can still create avoidable database or provider load.

Recommendation: add per-user and per-IP limits, request-size controls where appropriate, and provider timeouts for external AI calls.

### Medium: admin material RPC needs a clean-project integration test

The final migration changes `save_admin_material` to `security invoker`. This is safer than a broadly callable definer function, but successful writes now depend on the authenticated admin role having every required table privilege in addition to RLS permission.

Recommendation: provision a fresh project from migrations and test create, edit, reorder, publish, and delete behavior as both an admin and a student. If privileges are missing, grant only the required DML privileges to `authenticated` and continue relying on admin-only RLS policies.

### Low: operational observability is minimal

The health endpoint reports configuration state, but the app has no structured error reporting, audit events, or performance monitoring.

Recommendation: add sanitized structured logs, error tracking, and alerts for failed submissions, checkpoint failures, and PDF imports. Never log access tokens, service keys, answer payloads, or provider API keys.

### Low: repository policy files are absent

The project does not currently include a license, contribution guide, security policy, or ownership metadata.

Recommendation: add these when the repository’s intended visibility and collaboration model are decided.

## Positive security observations

- Server components and actions use `auth.getUser()` for trusted identity checks.
- Student attempts and answers are constrained to the authenticated owner.
- Profile updates grant only `full_name` and `avatar_url` columns.
- Public question views exclude correct-answer and explanation fields.
- Views use `security_invoker = true`.
- Admin mutations check the database-backed profile role rather than user-editable metadata.
- The service-role key has no public prefix and is confined to server-side modules.
- PDF imports validate admin identity, MIME type, file signature, and a 15 MB size limit.
- Dependency versions are captured in `package-lock.json`.

## Recommended release gate

Do not treat the application as fully production-ready until the high-severity demo-mode risk is guarded in code and the critical student/admin flows have automated integration coverage. Continue requiring successful typecheck, lint, build, dependency audit, database lint, and migration parity before each release.
