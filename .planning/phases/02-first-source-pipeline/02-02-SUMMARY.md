---
phase: 02-first-source-pipeline
plan: 02
subsystem: scraping
tags: [pareap, ingestion-pipeline, cli, github-actions, cron, upsert, supabase-admin]

# Dependency graph
requires:
  - phase: 02-first-source-pipeline
    plan: 01
    provides: "PareapAdapter, shared scraper libs (types, normalizer, school-matcher, batch-upsert, logger, http-client, supabase-admin)"
  - phase: 01-foundation
    provides: "Supabase schema (sources, jobs, schools, job_sources tables)"
provides:
  - "ingestPareap() orchestrator: source seeding -> scrape -> school match -> upsert -> log"
  - "CLI entrypoint via `npm run scrape:pareap`"
  - "GitHub Actions daily cron workflow for automated scraping"
  - "PAREAP source auto-seeded in sources table"
affects: [03-job-browsing, 05-additional-sources, 09-operations]

# Tech tracking
tech-stack:
  added: [dotenv]
  patterns: [cli-entrypoint, cron-scheduling, source-seeding, ingestion-orchestrator]

key-files:
  created:
    - scripts/scrapers/adapters/pareap/ingest.ts
    - scripts/scrapers/run.ts
    - .github/workflows/scrape.yml
  modified:
    - package.json
    - package-lock.json
    - .env.example

key-decisions:
  - "Batch size of 25 for job upserts (smaller than Plan 01's 50 for finer partial-failure granularity)"
  - "Source seeding done inline in ingestPareap rather than a separate migration"
  - "Daily cron at 6 AM UTC (off-peak for PAREAP servers)"

patterns-established:
  - "Ingestion orchestrator pattern: seed source -> create log -> scrape -> match schools -> upsert -> update log"
  - "CLI entrypoint with adapter name routing (extensible for future sources)"
  - "GitHub Actions workflow per source with secrets for Supabase credentials"

requirements-completed: [DATA-01, DATA-10, DATA-13]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 2 Plan 02: PAREAP Ingestion Pipeline Summary

**End-to-end PAREAP ingestion with CLI entrypoint (`npm run scrape:pareap`), database upsert orchestration, source auto-seeding, and GitHub Actions daily cron scheduling -- verified with 646 live jobs scraped into Supabase**

## Performance

- **Duration:** ~8 min (across sessions with checkpoint)
- **Started:** 2026-03-10T17:00:00Z
- **Completed:** 2026-03-10T17:08:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- Complete PAREAP ingestion orchestrator wiring: source seeding, scraping, school matching, batch upsert, and run logging
- CLI entrypoint (`npm run scrape:pareap`) with adapter routing for future sources
- GitHub Actions workflow with daily 6 AM UTC cron and manual dispatch trigger
- End-to-end verification: 646 real PAREAP jobs scraped and confirmed in Supabase production database

## Task Commits

Each task was committed atomically:

1. **Task 1: Ingestion pipeline, CLI entrypoint, and source seeding** - `606afea` (feat)
2. **Task 2: GitHub Actions workflow for scheduled scraping** - `5aaf188` (chore)
3. **Task 3: Verify end-to-end PAREAP scraping pipeline** - Human-verify checkpoint (approved, no code commit)

## Files Created/Modified
- `scripts/scrapers/adapters/pareap/ingest.ts` - Full PAREAP ingestion orchestrator: source seeding, scrape, school match, upsert, logging
- `scripts/scrapers/run.ts` - CLI entrypoint with adapter name routing and dotenv loading
- `.github/workflows/scrape.yml` - Daily cron at 6 AM UTC with manual dispatch, 15-min timeout, Supabase secrets
- `package.json` - Added `scrape:pareap` npm script
- `package-lock.json` - Updated lockfile
- `.env.example` - Added SUPABASE_SERVICE_ROLE_KEY documentation

## Decisions Made
- **Batch size of 25:** Smaller than Plan 01's batch-upsert default of 50 for finer-grained partial failure handling during real database writes
- **Inline source seeding:** PAREAP source record upserted at start of each ingestion run rather than a separate migration, ensuring the source always exists
- **6 AM UTC cron:** Off-peak hours for PAREAP servers (1-2 AM Eastern), respectful scraping schedule

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**External services require manual configuration:**
- **Supabase:** SUPABASE_SERVICE_ROLE_KEY must be set in `.env` for local scraper runs
- **GitHub Actions:** Repository secrets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be added in GitHub repo Settings -> Secrets and variables -> Actions

## Next Phase Readiness
- PAREAP data pipeline is fully operational with 646+ jobs in Supabase
- Daily automated scraping ready once GitHub secrets are configured
- Adapter pattern and CLI routing ready for additional sources (Phase 5)
- Job data available for browse/search UI (Phase 3)

## Self-Check: PASSED

- All 4 key files verified present
- Both task commits verified in git log (606afea, 5aaf188)
- Human-verify checkpoint approved (646 jobs confirmed in Supabase)

---
*Phase: 02-first-source-pipeline*
*Completed: 2026-03-10*
