---
phase: 02-first-source-pipeline
plan: 01
subsystem: scraping
tags: [cheerio, string-similarity, pareap, scraper, adapter-pattern, upsert, html-parsing]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Supabase schema (sources, schools, jobs tables), supabase-js client"
provides:
  - "SourceAdapter interface and ScrapedJob shared types"
  - "PAREAP HTML parser (listing + detail pages)"
  - "PareapAdapter implementing SourceAdapter"
  - "Location normalizer (city/state/zip extraction)"
  - "School fuzzy matcher (Dice coefficient, 0.8 threshold)"
  - "Batch upsert utility with partial failure resilience"
  - "Scrape logger (scrape_logs table + helpers)"
  - "HTTP client with retry and exponential backoff"
  - "scrape_logs migration"
affects: [02-02-cli-scheduling, 03-additional-sources, 05-dedup, 09-monitoring]

# Tech tracking
tech-stack:
  added: [cheerio, string-similarity, tsx]
  patterns: [adapter-pattern, tdd, batch-upsert, fuzzy-matching, exponential-backoff]

key-files:
  created:
    - scripts/scrapers/lib/types.ts
    - scripts/scrapers/lib/normalizer.ts
    - scripts/scrapers/lib/school-matcher.ts
    - scripts/scrapers/lib/batch-upsert.ts
    - scripts/scrapers/lib/http-client.ts
    - scripts/scrapers/lib/logger.ts
    - scripts/scrapers/lib/supabase-admin.ts
    - scripts/scrapers/adapters/pareap/index.ts
    - scripts/scrapers/adapters/pareap/parser.ts
    - scripts/scrapers/adapters/pareap/types.ts
    - supabase/migrations/00002_scrape_logs.sql
    - tests/scrapers/normalizer.test.ts
    - tests/scrapers/school-matcher.test.ts
    - tests/scrapers/upsert-safety.test.ts
    - tests/scrapers/pareap.test.ts
    - tests/scrapers/fixtures/pareap-listing.html
    - tests/scrapers/fixtures/pareap-detail.html
  modified:
    - package.json

key-decisions:
  - "cheerio over Playwright for PAREAP (static HTML, no JS rendering needed)"
  - "string-similarity Dice coefficient with 0.8 threshold for school matching"
  - "Batch upsert in groups of 50 with independent batch failure handling"
  - "Expired-page detection at 90 days stops category scraping early"
  - "Location regex excludes street address prefixes via character class restriction"

patterns-established:
  - "SourceAdapter interface: all source scrapers implement scrape() -> ScrapedJob[]"
  - "TDD workflow: RED (failing tests) -> GREEN (implementation) -> verify"
  - "Batch processing: partial failure in one batch does not roll back others"
  - "School name normalization: lowercase, strip SD/School District, remove hyphens"

requirements-completed: [DATA-01, DATA-05, DATA-13]

# Metrics
duration: 6min
completed: 2026-03-10
---

# Phase 2 Plan 01: PAREAP Scraper Infrastructure Summary

**PAREAP adapter with cheerio HTML parsing, fuzzy school matching via Dice coefficient, batch upsert with partial failure resilience, and 44 unit tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-10T16:46:05Z
- **Completed:** 2026-03-10T16:52:08Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Complete PAREAP HTML parser for listing pages (5 fields per row) and detail pages (10+ structured fields)
- Shared scraper infrastructure: types, normalizer, school matcher, batch upsert, HTTP client, logger
- 44 new unit tests covering normalizer, school matcher, upsert safety, and PAREAP parser
- scrape_logs migration for tracking scrape runs with stats and error logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Scraper types, shared libraries, migration, and test infrastructure**
   - `2ac223f` (test: TDD RED - failing tests)
   - `ef39f7f` (feat: TDD GREEN - implementation passing all 20 tests)
2. **Task 2: PAREAP adapter with HTML parser, fixtures, and integration tests**
   - `975d853` (test: TDD RED - failing parser tests)
   - `94722c2` (feat: TDD GREEN - parser and adapter passing all 24 tests)

_TDD workflow: each task had separate RED and GREEN commits._

## Files Created/Modified
- `scripts/scrapers/lib/types.ts` - ScrapedJob, SourceAdapter, ScrapeResult, ScrapeError interfaces
- `scripts/scrapers/lib/normalizer.ts` - parseLocation and normalizeSchoolType
- `scripts/scrapers/lib/school-matcher.ts` - normalizeSchoolName and findOrCreateSchool with fuzzy matching
- `scripts/scrapers/lib/batch-upsert.ts` - batchUpsertJobs with partial failure handling
- `scripts/scrapers/lib/http-client.ts` - fetchWithRetry with exponential backoff and delay utility
- `scripts/scrapers/lib/logger.ts` - createScrapeLog and updateScrapeLog for run tracking
- `scripts/scrapers/lib/supabase-admin.ts` - Service role Supabase client for standalone scripts
- `scripts/scrapers/adapters/pareap/types.ts` - PareapListingRow, categories, base URL
- `scripts/scrapers/adapters/pareap/parser.ts` - parseListingPage, parseDetailPage, getTotalPages
- `scripts/scrapers/adapters/pareap/index.ts` - PareapAdapter with category scraping and expired-page detection
- `supabase/migrations/00002_scrape_logs.sql` - scrape_logs table with indexes
- `tests/scrapers/normalizer.test.ts` - 10 tests for location parsing and school type inference
- `tests/scrapers/school-matcher.test.ts` - 6 tests for name normalization and fuzzy matching
- `tests/scrapers/upsert-safety.test.ts` - 4 tests for batch upsert and error handling
- `tests/scrapers/pareap.test.ts` - 24 tests for HTML parsing, pagination, and constants
- `tests/scrapers/fixtures/pareap-listing.html` - Realistic 5-row listing page fixture
- `tests/scrapers/fixtures/pareap-detail.html` - Complete detail page fixture with multi-certificate
- `package.json` - Added cheerio, string-similarity, tsx dependencies

## Decisions Made
- **cheerio over Playwright:** PAREAP is fully server-rendered static HTML, no JS rendering needed. cheerio is 10x faster with zero browser overhead.
- **Dice coefficient at 0.8:** Balanced threshold -- catches "Spring-Ford Area School District" vs "Spring Ford Area SD" while avoiding false positives. Near-misses (0.6-0.8) are logged for manual review.
- **Batch size of 50:** Matches PAREAP's pagination (50 per page). Each batch is independent so partial DB failures don't roll back successful batches.
- **90-day expired-page threshold:** Conservative starting point. If all jobs on a page have dates older than 90 days, stop scraping that category to avoid fetching hundreds of stale pages.
- **Location regex character class:** Excludes periods and digits from city name match to correctly handle street address prefixes like "1600 Vine St."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed location parser regex for street addresses**
- **Found during:** Task 1 (normalizer implementation)
- **Issue:** Regex was too greedy -- "1600 Vine St. Philadelphia, PA 19102" matched city as "Vine St. Philadelphia"
- **Fix:** Restricted city name character class to exclude periods, so street address prefixes are skipped
- **Files modified:** scripts/scrapers/lib/normalizer.ts
- **Verification:** parseLocation test for street address prefix now passes
- **Committed in:** ef39f7f (Task 1 GREEN commit)

**2. [Rule 1 - Bug] Fixed school name extraction from multiline td.school**
- **Found during:** Task 2 (PAREAP parser implementation)
- **Issue:** cheerio's `.contents().filter(text).first()` included newlines and location text from the same text node
- **Fix:** Split full td.school text on newlines and take first line as school name
- **Files modified:** scripts/scrapers/adapters/pareap/parser.ts
- **Verification:** schoolName extraction test passes with clean "String Theory Schools"
- **Committed in:** 94722c2 (Task 2 GREEN commit)

**3. [Rule 2 - Missing Critical] Added batch-upsert.ts module**
- **Found during:** Task 1 (upsert-safety tests needed an import target)
- **Issue:** Plan specified upsert-safety tests but no explicit batch-upsert module was listed in files_modified
- **Fix:** Created scripts/scrapers/lib/batch-upsert.ts implementing batchUpsertJobs with partial failure handling
- **Files modified:** scripts/scrapers/lib/batch-upsert.ts
- **Verification:** All 4 upsert-safety tests pass
- **Committed in:** ef39f7f (Task 1 GREEN commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. Dependencies installed automatically.

## Next Phase Readiness
- PAREAP adapter and all shared libraries ready for CLI entrypoint (Plan 02)
- SourceAdapter interface established for future source adapters
- scrape_logs table ready for monitoring
- Need Plan 02 for: CLI entrypoint (`npm run scrape:pareap`), GitHub Actions workflow, and database writes integration

## Self-Check: PASSED

- All 17 created files verified present
- All 4 task commits verified in git log
- 53/53 tests passing (full suite)

---
*Phase: 02-first-source-pipeline*
*Completed: 2026-03-10*
