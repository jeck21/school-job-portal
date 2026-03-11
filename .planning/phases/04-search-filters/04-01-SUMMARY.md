---
phase: 04-search-filters
plan: 01
subsystem: database, api
tags: [postgis, supabase-rpc, geocoding, search, filters, nuqs, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase schema with jobs/schools tables, PostGIS extension
  - phase: 03-job-browsing
    provides: Server query pattern in src/lib/queries/, "use server" convention
provides:
  - search_jobs Postgres RPC function with combined keyword + filter + radius search
  - zip_coordinates geocoding lookup table with 1799 PA zip codes
  - searchJobs server action wrapping RPC with zip-to-coordinate resolution
  - Filter option constants (SCHOOL_TYPES, GRADE_BANDS, SUBJECT_AREAS, CERTIFICATION_TYPES, RADIUS_OPTIONS)
  - Geocode migration for existing jobs/schools from zip lookup
affects: [04-02-search-filter-ui, 06-data-enrichment]

# Tech tracking
tech-stack:
  added: [nuqs@2.8.9, use-debounce@10.1.0]
  patterns: [supabase-rpc-for-complex-queries, zip-coordinate-geocoding, server-action-with-rpc]

key-files:
  created:
    - supabase/migrations/00004_zip_coordinates.sql
    - supabase/migrations/00005_geocode_existing.sql
    - supabase/migrations/00006_search_jobs_rpc.sql
    - scripts/data/pa-zip-codes.csv
    - scripts/seed-zip-coordinates.ts
    - src/lib/filter-options.ts
    - src/lib/queries/search-jobs.ts
    - tests/queries/search-jobs.test.ts
  modified:
    - package.json

key-decisions:
  - "Single RPC function for all search/filter logic -- one round trip, PostGIS support, all filtering in SQL"
  - "Static zip CSV for geocoding -- zero runtime cost, no API key, sufficient for PA zip-level accuracy"
  - "include_remote flag for cyber/remote schools to bypass radius filter when selected"

patterns-established:
  - "Supabase RPC pattern: complex queries use Postgres functions called via supabase.rpc()"
  - "Zip coordinate lookup: resolve zip -> lat/lng in server action before RPC call"
  - "Filter options as const arrays: single source of truth for UI dropdowns"

requirements-completed: [DATA-06, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08, SRCH-12]

# Metrics
duration: 9min
completed: 2026-03-10
---

# Phase 4 Plan 1: Search & Filter Backend Summary

**Combined search_jobs Postgres RPC with keyword, 5 filter types, PostGIS radius search, and zip-to-coordinate geocoding infrastructure**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-10T23:57:29Z
- **Completed:** 2026-03-11T00:06:35Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- search_jobs RPC function combining keyword search, school type, grade band, subject area, certification, salary toggle, and radius filters in a single Postgres function
- Geocoding infrastructure: zip_coordinates table, 1799 PA zip codes CSV, seed script, and migration to backfill existing job/school locations
- searchJobs server action resolving zip codes to coordinates and calling the RPC
- 21 passing unit tests covering all filter types, radius, combined filters, and pagination

## Task Commits

Each task was committed atomically:

1. **Task 0: Create Wave 0 test scaffold** - `545ade3` (test)
2. **Task 1: Create geocoding migrations and seed script** - `1a21c01` (feat)
3. **Task 2: Create search_jobs RPC, filter options, server action, and tests** - `6b131d5` (feat)

## Files Created/Modified
- `supabase/migrations/00004_zip_coordinates.sql` - Zip coordinate lookup table for geocoding
- `supabase/migrations/00005_geocode_existing.sql` - Backfill job/school locations from zip codes
- `supabase/migrations/00006_search_jobs_rpc.sql` - Combined search_jobs RPC function
- `scripts/data/pa-zip-codes.csv` - 1799 PA zip codes with lat/lng coordinates
- `scripts/seed-zip-coordinates.ts` - Batch upsert script for seeding zip coordinates
- `src/lib/filter-options.ts` - Constants for school types, grade bands, subjects, certs, radius
- `src/lib/queries/search-jobs.ts` - Server action wrapping RPC with zip lookup
- `tests/queries/search-jobs.test.ts` - 21 unit tests for searchJobs behavior
- `package.json` - Added nuqs, use-debounce deps and seed:zips script

## Decisions Made
- Single RPC function for all search/filter logic: one database round trip handles keyword + all categorical filters + spatial radius, keeping performance predictable
- Static zip CSV over runtime geocoding API: zero latency, no API keys, sufficient accuracy for zip-level search
- include_remote flag: when radius search is active and user selects "cyber" type, cyber/remote jobs bypass the distance filter
- PostGIS coordinate ordering: ST_Point(longitude, latitude) with explicit comments at every usage point

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vi.mock hoisting issue in tests**
- **Found during:** Task 2 (filling in test stubs)
- **Issue:** vi.mock factory cannot reference variables defined after it due to hoisting
- **Fix:** Restructured mock setup to define mock functions before vi.mock, then use them indirectly via wrapper functions in the factory
- **Files modified:** tests/queries/search-jobs.test.ts
- **Verification:** All 21 tests pass
- **Committed in:** 6b131d5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Standard test infrastructure fix. No scope creep.

## Issues Encountered
None beyond the mock hoisting issue documented above.

## User Setup Required
After deploying migrations, run `npm run seed:zips` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars to populate the zip_coordinates table. Migration 00005 (geocode existing) will be a no-op until zip data is seeded.

## Next Phase Readiness
- Backend search infrastructure complete and tested
- Plan 02 (Search & Filter UI) can build on searchJobs action and filter-options constants
- nuqs and use-debounce already installed for Plan 02's URL state management and debounced search

## Self-Check: PASSED

All 8 created files verified present. All 3 task commits (545ade3, 1a21c01, 6b131d5) verified in git log.

---
*Phase: 04-search-filters*
*Completed: 2026-03-10*
