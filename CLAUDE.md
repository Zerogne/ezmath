# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

EzMath is a Mongolian SAT and ЭЕШ (EYESH, the national university entrance exam) math prep platform. It runs on Next.js 16 App Router, React 19, TypeScript, Tailwind 3 with shadcn-style Radix components in `components/ui`, and Supabase (Auth, Postgres, RLS). Most UI copy is in Mongolian Cyrillic. Math is rendered with KaTeX, and TikZ figures are rendered server-side with `node-tikzjax`.

## Commands

```bash
npm run dev        # dev server (http://localhost:3000)
npm run build      # production build (uses --webpack, not Turbopack)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm test           # vitest unit tests (tests/unit)
npm run test:e2e   # playwright: builds in mock mode (no Supabase) and runs tests/e2e
npx supabase db push   # apply supabase/migrations
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > lib/supabase/database.types.ts
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and the Playwright suite on every push and PR. The e2e suite runs against the mock dataset; in mock mode the `e2e-monitored=1` cookie forces the school/class exam-monitoring path. Errors go to Rollbar (`lib/monitoring/`, `instrumentation.ts`) through the Marketplace integration's `ROLLBAR_EZMATH_SERVER_TOKEN_1794145568` / `NEXT_PUBLIC_ROLLBAR_EZMATH_CLIENT_TOKEN_1794145568` (plain `ROLLBAR_SERVER_TOKEN` / `NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN` also work); use `reportServerError()` for handled server failures and never send answers or tokens.

The repo lives in iCloud-synced `~/Documents`. Evicted ("dataless") files in `node_modules` can make `next dev`, `next build` or git hang. If that happens, build from a copy outside iCloud.

## Architecture

**Next.js 16 conventions.** Request interception lives in `proxy.ts` (the Next 16 replacement for `middleware.ts`). It refreshes the Supabase session with `getClaims()` and enforces a 24h idle sign-out cookie. Page loaders use `getSessionUser()` (`lib/supabase/session.ts`: cached, local JWT check, no Auth round trip); auth flows, payments and account changes call `getUser()`. Vercel functions run in `syd1` (`vercel.json`) next to the Supabase database in `ap-southeast-2`; keep them co-located. Mutations are mostly Server Actions in `actions.ts` files next to routes (`app/tests/actions.ts`, `app/dashboard/actions.ts`, `app/teacher/actions.ts`, …). Route handlers under `app/api/` cover checkpoints/integrity events, payments webhooks, and admin uploads/imports.

**Supabase clients (`lib/supabase/`)**: pick the right one.
- `server.ts` `createClient()`: cookie-bound user client for RLS-scoped reads and auth checks.
- `public.ts` `createPublicClient()`: anon, sessionless. Used for cacheable published content (`unstable_cache` with tag `tests`).
- `admin.ts` `createAdminClient()`: service role, `server-only`. Used for scoring, attempts and admin writes. Never import it into client components.
- `config.ts` `isSupabaseConfigured()`: when Supabase env vars are missing, data loaders fall back to the bundled mock dataset in `lib/data/mock-tests.ts`. Keep this fallback working.

**Answer-key separation.** Students read questions through the `student_questions` / `student_answer_choices` views, which have no correctness data. Grading happens only on the server in `app/tests/actions.ts` (`submitTestAttempt`), using the admin client against `answer_choices.is_correct`. Written/multi-blank answers go through `lib/exam/grade-question.ts`. Never send correct answers to the client before submission.

**Exam session flow.** `/tests/[testId]` (intro) → `/take` → `/result` and `/report`. In-progress state persists to localStorage (`lib/exam/session-storage.ts`, `test-storage.ts`) and syncs to the server via `/api/test-attempts/checkpoint` (`lib/exam/test-sync.ts`). Non-practice tests need a subscription; `startTestAttempt` enforces this.

**Roles and portals.** `profiles.role` drives access: student (`/dashboard`), teacher (`/teacher`), school admin (`/school`), admin (`/admin`). Admin identity comes from `lib/admin/auth.ts` `getAdminIdentity()`. `ADMIN_DEMO_MODE=true` fakes an admin locally and throws in production. Data loaders per portal live in `lib/data/`.

**Content states.** Tests and materials are `draft` / `published` / `archived`. Only `published` is visible to students. The admin material editor writes through a security-definer RPC (see the `*admin_material_writer*` migrations).

**SAT taxonomy.** `lib/sat/taxonomy.ts` holds the official College Board domains and skills. SAT question topics must resolve to one of these (`resolveSatSkill`).

## Content import pipelines

1. **Admin PDF import** (`app/api/admin/materials/import-pdf/route.ts`): the PDF goes to the Python Vercel function `api/pdf_extract.py` (FastAPI + PyMuPDF4LLM, deps in `requirements.txt`, 300s in `vercel.json`) for layout JSON. That JSON is converted to exam JSON by an LLM (Claude Haiku 4.5 by default; OpenAI/Gemini/NVIDIA are optional fallbacks). The prompt forbids solving or inferring answers. EYESH Part II has exactly four parent problems with `multi-blank` sub-answers. The canonical import format is structured JSON, not Aiken (see `pdftoaiken.md`).
2. **ЭЕШ archive scripts** (`imports/eyesh/`): run by hand with Node and service-role env. Transcribed variants go in `json/<year>-<variant>.json`, answer keys in `keys.json`, figures in `figures.json`. Run `node imports/eyesh/import.mjs [--dry] [2024-A …]` to insert them as Draft tests. `verify.mjs` and `check-latex.mjs` validate them. Per-question `ans` overrides of the official key must be explained in the file's `notes`.

## Database

The schema is versioned in `supabase/migrations/` (timestamped). `supabase/schema.sql` is a reference snapshot. Every new table needs RLS with ownership predicates. Commit every migration and regenerate `database.types.ts` after schema changes.

## Other references

- `docs/BYL_INTEGRATION.md`: BYL.mn payment integration. Payments stay inactive until merchant env vars are set.
- `CODEBASE_AUDIT.md`: original audit (tests/CI and error tracking have since been added).
- `.env.example`: full env var list. `next.config.ts` sets a strict CSP. Add new external origins there (e.g. `connect-src`, `img-src`).
