---
phase: 05-additional-sources
plan: 02
subsystem: scraping
tags: [cheerio, html-parsing, schoolspring, teachingjobsinpa, adapters]

requires:
  - phase: 05-01
    provides: shared ingestion pipeline, dedup, SourceAdapter interface, http-client
provides:
  - SchoolSpring adapter with pagination (POST-based, 50-page cap)
  - TeachingJobsInPA adapter with employer direct URLs
  - 4 total adapters registered in run.ts
affects: [05-03, cron-scheduling, monitoring]

tech-stack:
  added: []
  patterns: [cheerio HTML table parsing, POST pagination, slugified external IDs]

key-files:
  created:
    - scripts/scrapers/adapters/schoolspring/index.ts
    - scripts/scrapers/adapters/schoolspring/parser.ts
    - scripts/scrapers/adapters/schoolspring/types.ts
    - scripts/scrapers/adapters/schoolspring/ingest.ts
    - scripts/scrapers/adapters/teachingjobsinpa/index.ts
    - scripts/scrapers/adapters/teachingjobsinpa/parser.ts
    - scripts/scrapers/adapters/teachingjobsinpa/types.ts
    - scripts/scrapers/adapters/teachingjobsinpa/ingest.ts
    - tests/scrapers/schoolspring.test.ts
    - tests/scrapers/teachingjobsinpa.test.ts
    - tests/scrapers/fixtures/schoolspring-listing.html
    - tests/scrapers/fixtures/teachingjobsinpa-listing.html
  modified:
    - scripts/scrapers/run.ts
    - package.json

key-decisions:
  - "SchoolSpring uses POST with form-encoded pageNumber for pagination"
  - "TeachingJobsInPA uses slugified school+title for stable external IDs"
  - "TeachingJobsInPA apply URLs are employer direct links (not intermediary)"

patterns-established:
  - "Cheerio table parser pattern: load HTML, iterate rows, filter by cell count, extract fields"
  - "Single-page vs paginated adapter patterns established"

requirements-completed: [DATA-03, DATA-04]

duration: 3min
completed: 2026-03-11
---

# Phase 5 Plan 2: SchoolSpring and TeachingJobsInPA Adapters Summary

**Cheerio-based HTML parsers for SchoolSpring (paginated POST) and TeachingJobsInPA (single-page table) with 23 unit tests and employer direct URLs**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T17:45:38Z
- **Completed:** 2026-03-11T17:49:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- SchoolSpring adapter parses server-rendered HTML with POST-based pagination up to 50 pages
- TeachingJobsInPA adapter extracts jobs from single-page #myTable with employer direct apply URLs
- Both adapters produce ScrapedJob[] compatible with shared ingestion pipeline and dedup
- All 4 adapters (pareap, paeducator, schoolspring, teachingjobsinpa) registered in run.ts
- 23 new unit tests, 90 total scraper tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: SchoolSpring adapter with pagination** - `832d467` (feat)
2. **Task 2: TeachingJobsInPA adapter + register both in run.ts** - `268e6fc` (feat)

_Note: TDD tasks -- tests written first (RED), then implementation (GREEN), committed together._

## Files Created/Modified
- `scripts/scrapers/adapters/schoolspring/parser.ts` - Cheerio parser for cellData TD rows
- `scripts/scrapers/adapters/schoolspring/index.ts` - SchoolSpringAdapter with POST pagination
- `scripts/scrapers/adapters/schoolspring/types.ts` - SchoolSpringListingRow type
- `scripts/scrapers/adapters/schoolspring/ingest.ts` - runIngestion wrapper
- `scripts/scrapers/adapters/teachingjobsinpa/parser.ts` - Cheerio parser for #myTable rows
- `scripts/scrapers/adapters/teachingjobsinpa/index.ts` - TeachingJobsInPAAdapter single-page fetch
- `scripts/scrapers/adapters/teachingjobsinpa/types.ts` - TeachingJobsInPARow type
- `scripts/scrapers/adapters/teachingjobsinpa/ingest.ts` - runIngestion wrapper
- `scripts/scrapers/run.ts` - Registered schoolspring + teachingjobsinpa adapters
- `package.json` - Added scrape:schoolspring and scrape:teachingjobsinpa scripts
- `tests/scrapers/schoolspring.test.ts` - 12 unit tests for SchoolSpring parser
- `tests/scrapers/teachingjobsinpa.test.ts` - 11 unit tests for TeachingJobsInPA parser
- `tests/scrapers/fixtures/schoolspring-listing.html` - HTML fixture with 4 job rows
- `tests/scrapers/fixtures/teachingjobsinpa-listing.html` - HTML fixture with 4 job rows

## Decisions Made
- SchoolSpring uses POST with `pageNumber={N}&ssPageNumber={N}` form data for pagination (matches verified HTML structure)
- TeachingJobsInPA generates external IDs via slugified `school-title` (stable, deterministic, since apply URLs are employer direct links)
- TeachingJobsInPA apply URLs point to employer direct application pages, satisfying the user's preference for direct links
- Date parsing for SchoolSpring converts "Mar 11" format to ISO date for current year

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 adapters ready for production scraping
- Plan 05-03 (cron scheduling + multi-source orchestration) can proceed
- npm scripts available: `scrape:pareap`, `scrape:paeducator`, `scrape:schoolspring`, `scrape:teachingjobsinpa`

---
*Phase: 05-additional-sources*
*Completed: 2026-03-11*
