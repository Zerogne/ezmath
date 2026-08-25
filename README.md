# EzMath

EzMath is a Mongolian SAT and ЭЕШ mathematics preparation platform. It combines published mock exams, timed test sessions, detailed student progress analytics, course and exercise discovery, teacher questions, and an administration workspace for managing learning materials.

## Features

### Students

- Email/password and Google OAuth authentication
- Responsive student dashboard based on the EzMath Figma design
- Published SAT and ЭЕШ mock exams and practice sets
- Timed exam sessions with local persistence and server checkpoints
- Server-side scoring with answer and topic breakdowns
- Detailed progress dashboard with score history, accuracy, time spent, and improvement
- Courses, exercises, exams, teacher questions, and profile settings
- Route-specific loading skeletons matching the final dashboard layouts

### Administrators

- Role-protected admin workspace
- Student and payment views
- SAT and ЭЕШ material management
- Question and answer-choice editor
- PDF import through OpenAI, Anthropic, Gemini, or NVIDIA APIs
- Draft, published, and archived content states

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and SSR clients
- Lucide icons

Node.js 22 or newer is recommended. Current Supabase client releases dropped Node.js 20 support in June 2026.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase configuration, public exam pages use the bundled mock dataset. Authentication, persisted attempts, the student portal, and administration features require Supabase.

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase publishable/anon key |
| `SUPABASE_PROJECT_ID` | Server/tooling | Project reference used by CLI tooling |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Trusted scoring and administrative database access |
| `ADMIN_DEMO_MODE` | Local only | Enables the local admin preview identity |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical app origin used for payment redirects |
| `BYL_PROJECT_ID` | Server only | BYL merchant project identifier |
| `BYL_API_TOKEN` | Server only | BYL Bearer token used to create hosted checkouts |
| `BYL_WEBHOOK_SECRET` | Server only | BYL raw-body webhook signing secret |

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable or client component. Never enable `ADMIN_DEMO_MODE` in a deployed environment.

BYL payment preparation and the activation checklist are documented in [docs/BYL_INTEGRATION.md](./docs/BYL_INTEGRATION.md). Payment code remains inactive until the merchant credentials, product mapping, and database migration are approved.

## Supabase setup

1. Create a Supabase project and populate `.env.local` from `.env.example`.
2. Link the Supabase CLI or provide the project database credentials.
3. Apply the versioned migrations:

```bash
npx supabase db push
```

4. In Authentication → URL Configuration, set the production site URL and add `http://localhost:3000/auth/callback` for development.
5. For Google login, enable the Google provider and register the callback URL displayed by Supabase.
6. Promote the first trusted administrator in the SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = '<auth-user-uuid>';
```

The schema enables RLS on exposed tables, uses ownership checks for student records, exposes student-safe question views without correct answers, and limits administrative mutations to users whose profile role is `admin`.

To regenerate database types after a schema change:

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > lib/supabase/database.types.ts
```

## Commands

```bash
npm run dev        # Start the development server
npm run typecheck  # Validate TypeScript
npm run lint       # Run ESLint
npm run build      # Create a production build
npm run start      # Start the production server
npm audit          # Check dependency advisories
```

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/tests` | Published tests and practice material |
| `/dashboard` | Student dashboard |
| `/dashboard/progress` | Detailed student performance history |
| `/dashboard/courses` | Student courses |
| `/dashboard/exercises` | Practice exercises |
| `/dashboard/exams` | Mock exams |
| `/dashboard/ask` | Teacher questions |
| `/dashboard/settings` | Student profile settings |
| `/admin` | Role-protected administration workspace |
| `/api/health` | Non-secret runtime configuration status |

## Quality and security

Before deployment, run:

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```
pp
The current codebase audit is documented in [CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md). The most important remaining work is adding automated tests and CI, introducing rate limits for mutation/import endpoints, and validating the admin material RPC on a clean Supabase project.

## Repository hygiene

`.env.local`, build output, dependencies, TypeScript build metadata, and macOS metadata are ignored. Keep the lockfile and every Supabase migration committed so deployments are reproducible.
