---
status: complete
phase: 05-additional-sources
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-03-11T18:10:00Z
updated: 2026-03-11T19:15:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. PAeducator Adapter Scrape
expected: Run `npm run scrape:paeducator`. Adapter fetches jobs from PAeducator.net REST API. Console shows progress with job counts, polite 1.5s delays between requests. Completes without errors, reports total jobs fetched and upserted to Supabase.
result: issue
reported: "11 jobs failed with null organization/schoolName causing toLowerCase crash. Fixed with null guards in normalizeForDedup, normalizeSchoolName, and mapToScrapedJob. 359/383 jobs ingested successfully, 13 correctly deduplicated."
severity: minor

### 2. SchoolSpring Adapter Scrape
expected: Run `npm run scrape:schoolspring`. Adapter fetches PA education jobs from SchoolSpring via POST-based pagination. Console shows pages being scraped. Completes without errors, reports total jobs parsed and ingested.
result: pass

### 3. TeachingJobsInPA Adapter Scrape
expected: Run `npm run scrape:teachingjobsinpa`. Adapter fetches jobs from TeachingJobsInPA single-page table. Completes without errors, reports jobs parsed with employer direct apply URLs.
result: pass

### 4. Run All Scrapers
expected: Run `npm run scrape:all`. All 4 adapters run sequentially with ~30s delays between them. If one adapter fails, remaining adapters still execute (error isolation). Final summary shows results per adapter.
result: skipped
reason: Individual adapters already tested in tests 1-3

### 5. Cross-Source Dedup
expected: After running multiple adapters, jobs that appear on multiple sites are linked via `job_sources` rather than creating duplicate entries. Check Supabase `jobs` table — no duplicate rows for same position at same school. Borderline matches (0.7-0.85 score) are logged for review.
result: pass

### 6. PAREAP Still Works After Refactor
expected: Run `npm run scrape:pareap`. Despite refactoring from 285 lines to shared pipeline wrapper, PAREAP scraper still fetches and ingests jobs correctly. NODE_TLS bypass applies only to PAREAP, not other adapters.
result: pass

### 7. GitHub Actions Workflow Config
expected: Check `.github/workflows/scrape.yml`. Shows 4 staggered cron schedules (6/10/14/18 UTC), workflow_dispatch with adapter dropdown, and NODE_TLS scoped to PAREAP steps only.
result: pass

## Summary

total: 7
passed: 5
issues: 1
pending: 0
skipped: 1
skipped: 0

## Gaps

- truth: "PAeducator adapter completes without errors for all 383 jobs"
  status: failed
  reason: "User reported: 11 jobs failed with null organization causing toLowerCase crash. Fixed inline with null guards."
  severity: minor
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
