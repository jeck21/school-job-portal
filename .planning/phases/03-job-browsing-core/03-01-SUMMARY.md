---
phase: 03-job-browsing-core
plan: 01
subsystem: api, database, ui
tags: [supabase, vitest, shadcn, server-actions, date-formatting]

requires:
  - phase: 01-foundation
    provides: shadcn/ui setup, Supabase client, project structure
  - phase: 02-first-source-pipeline
    provides: jobs and schools tables with data
provides:
  - getJobs paginated query with school join and count
  - getJobDetail single job query with full fields
  - Date formatting utilities (relative, absolute, combined)
  - reportJob server action with report_flags table
  - shadcn dialog, badge, skeleton, dropdown-menu components
affects: [03-job-browsing-core plan 02, future job detail pages, admin moderation]

tech-stack:
  added: []
  patterns: [server-side Supabase queries in src/lib/queries/, server actions in src/lib/actions/]

key-files:
  created:
    - src/lib/format-date.ts
    - src/lib/__tests__/format-date.test.ts
    - src/lib/queries/get-jobs.ts
    - src/lib/queries/get-job-detail.ts
    - src/lib/actions/report-job.ts
    - supabase/migrations/00003_report_flags.sql
    - src/components/ui/dialog.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/dropdown-menu.tsx
  modified:
    - src/components/ui/button.tsx

key-decisions:
  - "Query pattern: server-side queries in src/lib/queries/ with 'use server' directive"
  - "Left join for schools since school_id is nullable on jobs"
  - "report_flags uses CHECK constraint for reason enum rather than Postgres ENUM type"

patterns-established:
  - "Query module pattern: one function per file in src/lib/queries/"
  - "Server action pattern: action files in src/lib/actions/ with 'use server'"
  - "Date utility uses UTC methods for consistent formatting"

requirements-completed: [SRCH-01, SRCH-11]

duration: 2min
completed: 2026-03-10
---

# Phase 3 Plan 1: Data Layer and UI Dependencies Summary

**Supabase queries for job list/detail, date formatting with 13 tests, report_flags table, and four shadcn components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T22:13:32Z
- **Completed:** 2026-03-10T22:15:33Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Date formatting utilities with 13 passing tests (relative, absolute, combined formats)
- getJobs query with offset pagination, school join, and exact count
- getJobDetail query with full job fields and school data
- report_flags table migration created and applied to remote Supabase
- reportJob server action for crowdsourced issue flagging
- Four shadcn UI components installed (dialog, badge, skeleton, dropdown-menu)

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Date formatter tests** - `65d8dcd` (test)
2. **Task 1 (GREEN): Date formatter + query functions** - `fbec5f7` (feat)
3. **Task 2: Report flags + shadcn components** - `f611ec6` (feat)

_TDD task had separate RED and GREEN commits._

## Files Created/Modified
- `vitest.config.ts` - Already existed with correct path aliases (no changes needed)
- `src/lib/format-date.ts` - Relative, absolute, and combined date formatting
- `src/lib/__tests__/format-date.test.ts` - 13 tests covering all formatting cases
- `src/lib/queries/get-jobs.ts` - Paginated active jobs query with school join
- `src/lib/queries/get-job-detail.ts` - Single job detail query
- `src/lib/actions/report-job.ts` - Server action to submit report flags
- `supabase/migrations/00003_report_flags.sql` - report_flags table with indexes
- `src/components/ui/dialog.tsx` - shadcn dialog component
- `src/components/ui/badge.tsx` - shadcn badge component
- `src/components/ui/skeleton.tsx` - shadcn skeleton component
- `src/components/ui/dropdown-menu.tsx` - shadcn dropdown-menu component

## Decisions Made
- Used CHECK constraint for report reason enum (simpler than Postgres ENUM, easier to extend)
- Left join for schools in queries since school_id is nullable
- Server-side queries use "use server" directive for Next.js server component compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All data layer functions ready for Plan 02 page composition
- shadcn UI components installed for job listing and detail pages
- report_flags migration applied to production database

## Self-Check: PASSED

- All 10 created files verified present
- All 3 task commits verified (65d8dcd, fbec5f7, f611ec6)
- All 66 tests passing (13 new format-date + 53 existing)
- Build passes cleanly

---
*Phase: 03-job-browsing-core*
*Completed: 2026-03-10*
