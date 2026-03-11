---
phase: 06-data-enrichment
plan: 02
subsystem: scraper
tags: [freshness, heuristics, claude-haiku, soft-delete, github-actions, cheerio]

requires:
  - phase: 02-first-source-pipeline
    provides: scraper infrastructure (logger, supabase-admin, http-client)
  - phase: 05-additional-sources
    provides: multi-source job URLs to validate
provides:
  - Freshness validation pipeline (HEAD check + content heuristics + AI fallback)
  - Heuristic closed/active/ambiguous classification for job posting pages
  - Claude Haiku AI analyzer for ambiguous freshness cases
  - Weekly GitHub Actions cron workflow for automated freshness checks
  - CLI entrypoint for manual freshness runs
affects: [monitoring, data-quality]

tech-stack:
  added: ["@anthropic-ai/sdk"]
  patterns: ["two-step URL validation (HEAD + content)", "heuristic-first AI-fallback", "soft-delete only"]

key-files:
  created:
    - scripts/scrapers/freshness/heuristics.ts
    - scripts/scrapers/freshness/ai-analyzer.ts
    - scripts/scrapers/freshness/check-freshness.ts
    - scripts/scrapers/freshness/run.ts
    - .github/workflows/freshness.yml
    - tests/scrapers/heuristics.test.ts
    - tests/scrapers/check-freshness.test.ts
  modified:
    - package.json

key-decisions:
  - "Sequential job processing with domain-based polite delays (1.5s) instead of high concurrency"
  - "Ambiguous jobs without AI confirmation are kept active (conservative approach)"
  - "AI client instantiated per-call to avoid module-level errors when key missing"
  - "PAREAP TLS override scoped per-request with cleanup in finally block"

patterns-established:
  - "Two-step freshness: HEAD check eliminates dead URLs before expensive content fetch"
  - "Heuristic-first AI-fallback: regex patterns handle 90%+ cases, Haiku for ambiguous"
  - "processJobs() exported separately from runFreshnessCheck() for testability with mocked deps"

requirements-completed: [DATA-11, DATA-12]

duration: 3min
completed: 2026-03-11
---

# Phase 6 Plan 2: Freshness Validation Summary

**Two-step URL freshness checker with regex heuristics and Claude Haiku AI fallback, running weekly via GitHub Actions cron**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T20:03:18Z
- **Completed:** 2026-03-11T20:07:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Heuristic detection classifies closed/active/ambiguous job postings via 12 closed + 5 active regex patterns
- Freshness orchestrator implements HEAD check -> content analysis -> AI fallback pipeline with soft-delete only
- Claude Haiku AI analyzer with 100-call cap and graceful degradation when API key missing
- AI backfills salary and certification data for active jobs when missing
- Weekly GitHub Actions workflow (Sundays 8 AM UTC) with 60-min timeout
- 19 new tests covering heuristics classification and freshness pipeline with mocked fetch/Supabase

## Task Commits

Each task was committed atomically:

1. **Task 1: Build heuristics module and freshness checker with tests** - `d0998b9` (feat)
2. **Task 2: Create GitHub Actions weekly freshness workflow** - `eefeb71` (chore)

## Files Created/Modified
- `scripts/scrapers/freshness/heuristics.ts` - Regex-based closed/active/ambiguous classification
- `scripts/scrapers/freshness/ai-analyzer.ts` - Claude Haiku integration with isAIAvailable() guard
- `scripts/scrapers/freshness/check-freshness.ts` - Main orchestrator: HEAD + content + AI pipeline
- `scripts/scrapers/freshness/run.ts` - CLI entrypoint
- `.github/workflows/freshness.yml` - Weekly cron workflow (Sundays 8 AM UTC)
- `tests/scrapers/heuristics.test.ts` - 12 tests for heuristic pattern classification
- `tests/scrapers/check-freshness.test.ts` - 7 tests for freshness pipeline with mocked deps
- `package.json` - Added @anthropic-ai/sdk dependency

## Decisions Made
- Sequential processing with domain-based polite delays rather than parallel concurrency to avoid rate limiting
- Ambiguous jobs without AI confirmation are kept active (conservative -- avoids false soft-deletes)
- AI client instantiated per-call inside analyzeWithHaiku() to prevent module-level errors when ANTHROPIC_API_KEY is missing
- PAREAP TLS override (NODE_TLS_REJECT_UNAUTHORIZED=0) scoped per-request with cleanup in finally block

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration:**
- **ANTHROPIC_API_KEY**: Add to GitHub repository secrets (Settings -> Secrets and variables -> Actions -> New repository secret). Get key from https://console.anthropic.com/settings/keys. Optional -- if missing, AI calls are skipped gracefully.

## Next Phase Readiness
- Freshness validation system complete and tested
- Ready for production use once ANTHROPIC_API_KEY is added to GitHub secrets (optional)
- All 135 scraper tests passing

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (d0998b9, eefeb71) found in git log.

---
*Phase: 06-data-enrichment*
*Completed: 2026-03-11*
