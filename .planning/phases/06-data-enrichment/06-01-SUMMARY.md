---
phase: 06-data-enrichment
plan: 01
subsystem: scrapers
tags: [regex, salary-detection, certification-extraction, pde, enrichment, ingest-pipeline]

# Dependency graph
requires:
  - phase: 02-first-source-pipeline
    provides: ingest-pipeline processBatch, ScrapedJob types
  - phase: 05-additional-sources
    provides: multi-source adapter pattern, job-dedup
provides:
  - detectSalary pure function for salary detection from job descriptions
  - extractCertifications pure function for PDE cert area matching
  - PDE certification taxonomy (40+ areas with aliases)
  - Enriched processBatch with salary_mentioned, salary_raw, certifications
affects: [06-data-enrichment, search-filters]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-enrichment-functions, adapter-priority-fallback, longest-match-regex]

key-files:
  created:
    - scripts/scrapers/lib/enrichment/salary-detector.ts
    - scripts/scrapers/lib/enrichment/cert-extractor.ts
    - scripts/scrapers/lib/enrichment/pde-cert-taxonomy.ts
    - tests/scrapers/salary-detector.test.ts
    - tests/scrapers/cert-extractor.test.ts
  modified:
    - scripts/scrapers/lib/ingest-pipeline.ts

key-decisions:
  - "Removed short aliases (PE, ASL, ECE, CTE, FCS, CSN, SLP, TAG, ASD, ELL, ELA) from taxonomy to avoid false positives -- matched via longer aliases only"
  - "Dedup branch also enriches existing jobs when description is updated or salary/cert data is missing"

patterns-established:
  - "Pure enrichment functions: stateless, no side effects, importable from enrichment/ directory"
  - "Adapter-priority pattern: structured data from adapters takes priority over text extraction"
  - "Longest-match selection: when multiple regex matches, take the longest for most complete data"

requirements-completed: [DATA-08, DATA-09]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 6 Plan 1: Salary Detection & Cert Extraction Summary

**Pure regex salary detector and PDE cert extractor integrated inline into ingestion pipeline, populating salary_mentioned/salary_raw/certifications on every job upsert**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T20:03:13Z
- **Completed:** 2026-03-11T20:06:20Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- detectSalary matches dollar amounts in all common formats ($45k, $25/hr, $50,000-$70,000/year) while rejecting vague terms
- extractCertifications finds 40+ PDE certification areas using word-boundary matching with canonical name normalization
- processBatch enriches every job with salary and cert data before upsert, including dedup'd jobs getting updated descriptions

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests** - `5fcc981` (test)
2. **Task 1 (GREEN): Implement enrichment functions** - `db8df35` (feat)
3. **Task 2: Integrate into ingest pipeline** - `db7e074` (feat)

_TDD flow: RED (26 failing tests) -> GREEN (26 passing) -> Pipeline integration (128 total tests passing)_

## Files Created/Modified
- `scripts/scrapers/lib/enrichment/salary-detector.ts` - Pure salary detection with SALARY_PATTERN regex, longest match selection
- `scripts/scrapers/lib/enrichment/cert-extractor.ts` - PDE cert area extraction with word boundary matching, short name filtering
- `scripts/scrapers/lib/enrichment/pde-cert-taxonomy.ts` - 40+ PDE certification areas with canonical names and common aliases
- `scripts/scrapers/lib/ingest-pipeline.ts` - Added enrichment calls in processBatch before jobRecord build + dedup branch
- `tests/scrapers/salary-detector.test.ts` - 13 test cases covering amounts, ranges, hourly, annual, vague terms, null/empty
- `tests/scrapers/cert-extractor.test.ts` - 13 test cases covering aliases, canonical names, short name skip, duplicates, word boundaries

## Decisions Made
- Removed short aliases (PE, ASL, ECE, etc.) from taxonomy to prevent false positive matches on 2-3 character abbreviations; these cert areas are still matchable via their longer alias forms (e.g., "Physical Education" matches Health and Physical Education)
- Added enrichment to the dedup branch so that when an existing job gets updated with a longer description, salary/cert data is also extracted and applied

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Salary and cert columns will be populated on next scrape run (user plans to delete all data and re-scrape)
- "Salary Info Included" filter (SRCH-07) and certification filter (SRCH-08) will return real results
- Ready for Plan 02 (freshness checker) which is independent of this work

## Self-Check: PASSED

All 5 created files verified on disk. All 3 commit hashes (5fcc981, db8df35, db7e074) verified in git log.

---
*Phase: 06-data-enrichment*
*Completed: 2026-03-11*
