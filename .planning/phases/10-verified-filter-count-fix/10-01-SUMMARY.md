---
phase: 10-verified-filter-count-fix
plan: 01
subsystem: database, api
tags: [supabase, rpc, postgres, search, filters, pagination]

requires:
  - phase: 07-district-accounts
    provides: search_jobs RPC with claimed_by_district_id column
provides:
  - Server-side verified_only parameter in search_jobs RPC
  - Correct total count for verified-only filter results
  - Proper pagination for verified-only results
affects: [search, filters, job-list]

tech-stack:
  added: []
  patterns: [server-side RPC filtering over client-side post-filtering]

key-files:
  created:
    - supabase/migrations/00009_verified_filter.sql
  modified:
    - src/lib/queries/search-jobs.ts
    - src/components/jobs/job-list.tsx
    - tests/queries/search-jobs.test.ts

key-decisions:
  - "verified_only param positioned after salary_only in RPC signature (matching boolean filter pattern)"
  - "WHERE clause uses NOT verified_only OR claimed_by_district_id IS NOT NULL (same pattern as salary_only)"

patterns-established:
  - "Boolean RPC filters: AND (NOT flag OR condition) pattern for optional WHERE clauses"

requirements-completed: [SRCH-12, DIST-03]

duration: 3min
completed: 2026-03-14
---

# Phase 10 Plan 01: Verified Filter Count Fix Summary

**Server-side verified_only filter in search_jobs RPC replacing broken client-side post-filtering on paginated results**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T02:39:02Z
- **Completed:** 2026-03-15T02:42:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Moved verified filter from client-side post-filtering to server-side RPC WHERE clause
- COUNT(*) OVER() now returns true total of verified jobs (not capped at page size)
- Pagination (OFFSET/LIMIT) works correctly for verified-only results
- buildFilters() and useEffect in job-list.tsx properly include verified field

## Task Commits

Each task was committed atomically:

1. **Task 1: Add verified filter tests and create RPC migration** - `633465f` (test)
2. **Task 2: Fix searchJobs server action and job-list client component** - `c5ac8ca` (feat)

## Files Created/Modified
- `supabase/migrations/00009_verified_filter.sql` - New RPC with verified_only BOOLEAN param and WHERE clause
- `src/lib/queries/search-jobs.ts` - Pass verified_only to RPC, remove client-side filter and conditional count
- `src/components/jobs/job-list.tsx` - Add verified to buildFilters(), useEffect deps, and hasActiveFilters
- `tests/queries/search-jobs.test.ts` - 4 new verified filter tests, fix mock target

## Decisions Made
- verified_only param positioned after salary_only in RPC signature (consistent boolean filter pattern)
- WHERE clause uses `NOT verified_only OR claimed_by_district_id IS NOT NULL` (same pattern as salary_only toggle)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test mock targeting wrong module**
- **Found during:** Task 1 (writing tests)
- **Issue:** Existing tests mocked `@/lib/supabase/server` with `createClient`, but source code imports `createAdminClient` from `@/lib/supabase/admin`
- **Fix:** Changed mock to target `@/lib/supabase/admin` with `createAdminClient` (synchronous, not async)
- **Files modified:** tests/queries/search-jobs.test.ts
- **Verification:** All 20 existing tests pass again
- **Committed in:** 633465f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Mock fix was necessary to run any tests. No scope creep.

## Issues Encountered
None beyond the mock fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Verified filter now works correctly at any scale of verified jobs
- Ready for Phase 11 or further gap closure work

---
*Phase: 10-verified-filter-count-fix*
*Completed: 2026-03-14*
