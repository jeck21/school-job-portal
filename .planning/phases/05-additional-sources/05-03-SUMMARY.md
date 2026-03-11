---
phase: 05-additional-sources
plan: 03
subsystem: infra
tags: [github-actions, cron, scraper, cli, workflow]

requires:
  - phase: 05-additional-sources (plans 01, 02)
    provides: shared ingestion pipeline, 4 source adapters, dedup logic
provides:
  - unified GitHub Actions workflow with staggered cron for all 4 sources
  - PAREAP refactored to shared pipeline (consistency across all adapters)
  - "all" CLI command with error isolation for sequential multi-adapter runs
  - npm scripts for each adapter and "all"
affects: [monitoring, future-sources]

tech-stack:
  added: []
  patterns: [unified-workflow-dispatch, staggered-cron, adapter-scoped-env-vars]

key-files:
  created: []
  modified:
    - .github/workflows/scrape.yml
    - scripts/scrapers/adapters/pareap/ingest.ts
    - scripts/scrapers/run.ts
    - package.json

key-decisions:
  - "NODE_TLS_REJECT_UNAUTHORIZED=0 scoped per-step to PAREAP only, not global env"
  - "Sequential 'all' execution with 30s inter-adapter delays and error isolation"
  - "Staggered cron: 6AM PAREAP, 10AM PAeducator, 2PM SchoolSpring, 6PM TeachingJobsInPA (all UTC)"

patterns-established:
  - "Adapter ingest files are thin wrappers around shared runIngestion pipeline"
  - "Workflow maps github.event.schedule to adapter name via case statement"

requirements-completed: [DATA-02, DATA-03, DATA-04, DATA-07]

duration: 1min
completed: 2026-03-11
---

# Phase 5 Plan 3: Unified Workflow & PAREAP Refactor Summary

**Unified GitHub Actions workflow with 4 staggered cron schedules, PAREAP refactored to shared ingestion pipeline, and "all" CLI command with error isolation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-11T17:51:19Z
- **Completed:** 2026-03-11T17:52:47Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Refactored PAREAP ingest.ts from 285 lines of custom pipeline to 15-line thin wrapper using shared runIngestion
- Replaced PAREAP-only GitHub Actions workflow with unified 4-source workflow featuring staggered daily cron schedules
- NODE_TLS_REJECT_UNAUTHORIZED=0 scoped to PAREAP steps only (not global), preventing SSL bypass for other adapters
- Added "all" command to run.ts with sequential execution, 30s delays, and error isolation (one failure does not block others)
- Added workflow_dispatch with adapter choice dropdown for manual runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor PAREAP to shared pipeline + unified workflow** - `4170422` (feat)

## Files Created/Modified
- `.github/workflows/scrape.yml` - Unified workflow with 4 staggered cron schedules and workflow_dispatch
- `scripts/scrapers/adapters/pareap/ingest.ts` - Refactored from custom pipeline to shared runIngestion call
- `scripts/scrapers/run.ts` - Added "all" command with sequential execution and error isolation
- `package.json` - Added scrape:all npm script

## Decisions Made
- NODE_TLS_REJECT_UNAUTHORIZED=0 set per-step (not global env) so only PAREAP bypasses SSL verification
- "all" mode in workflow runs each adapter separately (not via run.ts all) to scope NODE_TLS env correctly
- 30s delay between adapters in "all" mode to avoid overwhelming Supabase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 source adapters are production-ready with unified workflow
- Phase 5 (Additional Sources) is complete
- Ready for Phase 6 and beyond

---
*Phase: 05-additional-sources*
*Completed: 2026-03-11*
