---
phase: 07-district-accounts
plan: 01
subsystem: auth
tags: [supabase-auth, ssr, middleware, rls, email-confirmation, district-accounts]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client setup, shadcn UI components, theme variables
  - phase: 04-search-filters
    provides: search_jobs RPC function
provides:
  - district_accounts and verified_domains tables with RLS
  - Auth middleware for session refresh and route protection
  - Signup/login/logout server actions
  - Email confirmation callback with domain auto-verification
  - Admin Supabase client for service-role operations
  - Login and signup UI pages
  - search_jobs RPC excludes delisted jobs and returns claimed_by_district_id
affects: [07-02, 07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-auth-middleware, server-action-auth, service-role-admin-client, domain-validation]

key-files:
  created:
    - supabase/migrations/00008_district_accounts.sql
    - src/lib/supabase/middleware.ts
    - src/lib/supabase/admin.ts
    - src/middleware.ts
    - src/lib/domain-validation.ts
    - src/lib/actions/auth-actions.ts
    - src/app/auth/confirm/route.ts
    - src/app/for-schools/login/page.tsx
    - src/app/for-schools/signup/page.tsx
  modified:
    - src/app/for-schools/page.tsx
    - .env.example

key-decisions:
  - "Redirect-based error handling in server actions (not return values) for form action type compatibility"
  - "Separate admin.ts client in src/lib/supabase/ for app-side service-role operations (distinct from scraper admin client)"
  - "Domain auto-added to verified_domains whitelist on first k12.pa.us confirmation"

patterns-established:
  - "Auth middleware: src/middleware.ts delegates to src/lib/supabase/middleware.ts updateSession"
  - "Server actions use redirect() for both success and error flows (never return values from form actions)"
  - "Service role client at src/lib/supabase/admin.ts for operations bypassing RLS"
  - "Email confirmation route at /auth/confirm handles OTP verification and district account creation"

requirements-completed: [DIST-01]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 7 Plan 1: District Auth Infrastructure Summary

**Supabase Auth signup/login with k12.pa.us auto-verification, session middleware, RLS-protected district_accounts table, and email confirmation callback**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T00:43:16Z
- **Completed:** 2026-03-12T00:48:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Database schema with district_accounts, verified_domains tables and jobs claim/delist columns with full RLS
- Auth middleware protecting /for-schools/dashboard with session refresh on every request
- Signup/login/logout server actions with email confirmation flow
- Email confirmation callback that creates district accounts and handles k12.pa.us auto-verification
- Updated search_jobs RPC to exclude delisted jobs and return claimed_by_district_id for verified badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for district accounts, domain whitelist, and job claim/delist columns** - `d9221cf` (feat)
2. **Task 2: Auth middleware, server actions, email confirmation, domain validation, and signup/login UI** - `f566a03` (feat)

## Files Created/Modified
- `supabase/migrations/00008_district_accounts.sql` - District accounts schema, RLS policies, search_jobs RPC update
- `src/lib/supabase/middleware.ts` - updateSession helper for cookie-based session refresh
- `src/lib/supabase/admin.ts` - Service role client for bypassing RLS in server routes
- `src/middleware.ts` - Root middleware delegating to updateSession
- `src/lib/domain-validation.ts` - k12.pa.us auto-verification logic and slug generation
- `src/lib/actions/auth-actions.ts` - signup, login, logout server actions
- `src/app/auth/confirm/route.ts` - Email confirmation callback with district account creation
- `src/app/for-schools/page.tsx` - Replaced coming-soon with district landing page
- `src/app/for-schools/login/page.tsx` - Login form with error states
- `src/app/for-schools/signup/page.tsx` - Signup form with check-email confirmation
- `.env.example` - Added NEXT_PUBLIC_SITE_URL documentation

## Decisions Made
- Used redirect-based error handling in server actions instead of return values, because Next.js form actions expect `void | Promise<void>` return type
- Created separate `src/lib/supabase/admin.ts` for app-side service role client (distinct from `scripts/scrapers/lib/supabase-admin.ts` which is scraper-only)
- Auto-add k12.pa.us domains to verified_domains whitelist on first confirmation (so future signups from that domain hit the whitelist)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed server action return type incompatibility with form actions**
- **Found during:** Task 2 (auth-actions.ts)
- **Issue:** Server actions returning `{ error: string }` caused TS2322 because form actions expect `void | Promise<void>`
- **Fix:** Changed error handling to use `redirect()` with error params instead of returning error objects
- **Files modified:** src/lib/actions/auth-actions.ts, src/app/for-schools/signup/page.tsx
- **Verification:** `npx tsc --noEmit` shows no errors in new files
- **Committed in:** f566a03 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-safe form actions. No scope creep.

## Issues Encountered
- Pre-existing build failure in `scripts/scrapers/adapters/paeducator/index.ts` (schoolName type mismatch) prevents full `next build`. This is an out-of-scope issue from uncommitted changes in the working tree, not caused by this plan's changes. All new files pass type checking independently.

## User Setup Required
- Set `NEXT_PUBLIC_SITE_URL` environment variable (e.g., `https://school-job-portal.vercel.app` for production, `http://localhost:3003` for local dev)
- Update Supabase email confirmation template to use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (Supabase Dashboard > Auth > Email Templates)

## Next Phase Readiness
- Auth infrastructure complete, ready for claim/management features (07-02)
- Dashboard route exists at /for-schools/dashboard (currently returns 404 until 07-02 creates it)
- search_jobs RPC returns claimed_by_district_id for verified badge rendering

---
*Phase: 07-district-accounts*
*Completed: 2026-03-12*
