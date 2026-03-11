---
phase: 05-additional-sources
plan: 01
subsystem: scraping
tags: [paeducator, dedup, dice-coefficient, rest-api, string-similarity, adapter-pattern]

# Dependency graph
requires:
  - phase: 02-first-source-pipeline
    provides: SourceAdapter interface, school-matcher, http-client, scrape logging
provides:
  - PAeducatorAdapter implementing SourceAdapter via REST API
  - Cross-source job deduplication module (normalizeForDedup, computeDedupScore, findDuplicate)
  - Shared ingestion pipeline (runIngestion) generalizing ingestPareap pattern
  - PAeducator API type definitions
affects: [05-02-schoolspring, 05-03-teachingjobsinpa, github-actions-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-ingestion-pipeline, api-based-adapter, cross-source-dedup]

key-files:
  created:
    - scripts/scrapers/lib/job-dedup.ts
    - scripts/scrapers/lib/ingest-pipeline.ts
    - scripts/scrapers/adapters/paeducator/index.ts
    - scripts/scrapers/adapters/paeducator/types.ts
    - scripts/scrapers/adapters/paeducator/ingest.ts
    - tests/scrapers/job-dedup.test.ts
    - tests/scrapers/paeducator.test.ts
    - tests/scrapers/fixtures/paeducator-job.json
  modified:
    - scripts/scrapers/run.ts
    - package.json

key-decisions:
  - "Used native fetch instead of fetchWithRetry for PAeducator API (fetchWithRetry returns string, API needs JSON parsing)"
  - "Dedup uses weighted Dice coefficient: title 0.6 + school 0.4 with 0.8 match threshold"
  - "Shared ingest pipeline tracks deduplicated count separately from skipped"
  - "PAeducator adapter uses 1.5s polite delay between job detail requests"

patterns-established:
  - "API-based adapter: direct JSON fetch instead of HTML scraping when API available"
  - "Shared ingestion pipeline: runIngestion(adapter, sourceConfig) replaces per-source boilerplate"
  - "Cross-source dedup at ingestion time: findDuplicate before upsert, link via job_sources on match"

requirements-completed: [DATA-02, DATA-07]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 5 Plan 1: PAeducator Adapter + Dedup Summary

**PAeducator.net REST API adapter with cross-source dedup module (Dice 0.8 threshold) and shared ingestion pipeline**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T17:38:35Z
- **Completed:** 2026-03-11T17:42:41Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Cross-source dedup module with normalizeForDedup, computeDedupScore, findDuplicate -- 0.8 match threshold, borderline 0.7-0.85 logging
- PAeducatorAdapter fetching ~383 jobs via REST API with structured JSON mapping (title, org, certs, employer URL)
- Shared runIngestion pipeline extracting common pattern from ingestPareap for all future adapters
- 23 new unit tests (14 dedup + 9 PAeducator) all passing, 67 total scraper tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared ingestion pipeline + dedup module with tests** - `0b33371` (feat)
2. **Task 2: PAeducator.net adapter + registration** - `99dc552` (feat)

## Files Created/Modified
- `scripts/scrapers/lib/job-dedup.ts` - Cross-source dedup with Dice coefficient scoring
- `scripts/scrapers/lib/ingest-pipeline.ts` - Shared ingestion orchestrator for all adapters
- `scripts/scrapers/adapters/paeducator/index.ts` - PAeducatorAdapter implementing SourceAdapter
- `scripts/scrapers/adapters/paeducator/types.ts` - PAeducator API response type definitions
- `scripts/scrapers/adapters/paeducator/ingest.ts` - Thin wrapper calling runIngestion
- `scripts/scrapers/run.ts` - Added paeducator to ADAPTERS map
- `package.json` - Added scrape:paeducator npm script
- `tests/scrapers/job-dedup.test.ts` - 14 unit tests for dedup scoring and thresholds
- `tests/scrapers/paeducator.test.ts` - 9 unit tests for API mapping and error handling
- `tests/scrapers/fixtures/paeducator-job.json` - Sample API response fixture

## Decisions Made
- Used native `fetch` for PAeducator API instead of `fetchWithRetry` from http-client.ts, because fetchWithRetry returns string (for HTML) while the API needs JSON parsing via response.json()
- Dedup stats tracked separately (`stats.deduplicated`) distinct from skipped count for clearer reporting
- PAeducator adapter uses 1.5s delay between requests (polite scraping) with progress logging every 50 jobs
- Organization URL used as job apply link per user decision; falls back to `paeducator.net/Job/{id}` when empty

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- vitest v4 uses `--bail` instead of `-x` flag -- adjusted test commands accordingly

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shared ingestion pipeline ready for SchoolSpring (05-02) and TeachingJobsInPA (05-03) adapters
- Dedup module will automatically check new source jobs against existing PAREAP + PAeducator jobs
- `npm run scrape:paeducator` ready for live testing when Supabase credentials available

---
*Phase: 05-additional-sources*
*Completed: 2026-03-11*
