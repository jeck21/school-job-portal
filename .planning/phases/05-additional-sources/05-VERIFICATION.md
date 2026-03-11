---
phase: 05-additional-sources
verified: 2026-03-11T13:56:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 5: Additional Sources Verification Report

**Phase Goal:** Add PAeducator.net, SchoolSpring, and TeachingJobsInPA as additional job sources with shared ingestion pipeline and cross-source deduplication.
**Verified:** 2026-03-11T13:56:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

The portal now aggregates jobs from 4 PA sources (PAREAP + PAeducator.net + SchoolSpring + TeachingJobsInPA) with a shared ingestion pipeline and cross-source deduplication. All three plans executed without deviations.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PAeducator.net jobs scraped via REST API and stored with normalized data | VERIFIED | `PAeducatorAdapter` POSTs to `/api/search/jobs`, GETs `/api/job/{id}`, maps to `ScrapedJob`; 9 passing unit tests |
| 2 | Cross-source duplicate jobs detected using fuzzy title+school matching and linked via job_sources | VERIFIED | `findDuplicate()` in `job-dedup.ts`; `ingest-pipeline.ts` calls `findDuplicate` before upsert and links via `job_sources` on score >= 0.8 |
| 3 | Borderline dedup matches (0.7-0.85) logged for manual review | VERIFIED | `job-dedup.ts:97-101` and `ingest-pipeline.ts:172-181` both emit `console.warn` for borderline range |
| 4 | Shared ingestion pipeline reduces boilerplate for all adapters | VERIFIED | All 4 adapters (pareap, paeducator, schoolspring, teachingjobsinpa) are thin wrappers calling `runIngestion()` |
| 5 | SchoolSpring PA listing page jobs parsed from server-rendered HTML and stored | VERIFIED | `parseSchoolSpringListing()` with cheerio; POST pagination up to 50 pages; 12 passing unit tests |
| 6 | TeachingJobsInPA jobs parsed from single-page HTML table and stored | VERIFIED | `parseTeachingJobsInPAListing()` with cheerio; `#myTable` parsing; 11 passing unit tests |
| 7 | Both HTML adapters produce ScrapedJob[] compatible with shared pipeline | VERIFIED | Both `ingest.ts` files call `runIngestion(new Adapter(), sourceConfig)` |
| 8 | SchoolSpring pagination fetches all available pages (up to 50 page safety cap) | VERIFIED | `index.ts:83` — `for (let page = 0; page < MAX_PAGES; page++)` with MAX_PAGES = 50 |
| 9 | TeachingJobsInPA apply links point to employer direct application URLs | VERIFIED | `applyUrl` from `anchor.attr("href")` (employer direct); confirmed in 2 test assertions |
| 10 | All 4 adapters run via CLI and produce jobs | VERIFIED | `run.ts` ADAPTERS map has all 4; `npm run scrape:*` scripts exist for each plus `scrape:all` |
| 11 | Unified GitHub Actions workflow runs each adapter on a staggered daily schedule | VERIFIED | `scrape.yml` has 4 cron entries: 0 6, 0 10, 0 14, 0 18 UTC; workflow_dispatch with adapter choice |
| 12 | PAREAP uses shared ingestion pipeline; NODE_TLS scoped to PAREAP only | VERIFIED | `pareap/ingest.ts` calls `runIngestion()`; `scrape.yml` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` only in PAREAP-specific steps |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/scrapers/lib/job-dedup.ts` | Cross-source dedup (normalizeForDedup, computeDedupScore, findDuplicate) | VERIFIED | Exports all 3 functions + 3 threshold constants; 104 lines, substantive implementation |
| `scripts/scrapers/lib/ingest-pipeline.ts` | Shared ingestion orchestrator (runIngestion) | VERIFIED | 372 lines; full pipeline: ensureSource, scrape, processBatch with dedup, updateScrapeLog |
| `scripts/scrapers/adapters/paeducator/index.ts` | PAeducatorAdapter implementing SourceAdapter | VERIFIED | Class with sourceSlug="paeducator", POST search + GET detail loop, 1.5s delay, HTML stripping |
| `scripts/scrapers/adapters/paeducator/ingest.ts` | Thin wrapper calling runIngestion | VERIFIED | 15 lines, calls runIngestion with scraperType="api" |
| `scripts/scrapers/adapters/schoolspring/index.ts` | SchoolSpringAdapter implementing SourceAdapter | VERIFIED | Class with sourceSlug="schoolspring", POST pagination, 50-page cap |
| `scripts/scrapers/adapters/schoolspring/parser.ts` | HTML table row parser | VERIFIED | Exports parseSchoolSpringListing; cheerio; filters rows with < 4 cellData TDs |
| `scripts/scrapers/adapters/teachingjobsinpa/index.ts` | TeachingJobsInPAAdapter implementing SourceAdapter | VERIFIED | Class with sourceSlug="teachingjobsinpa", single-page GET |
| `scripts/scrapers/adapters/teachingjobsinpa/parser.ts` | HTML table parser | VERIFIED | Exports parseTeachingJobsInPAListing; cheerio; #myTable, skips first tr |
| `scripts/scrapers/adapters/pareap/ingest.ts` | Refactored PAREAP using shared pipeline | VERIFIED | 15 lines (refactored from 285-line custom pipeline) |
| `.github/workflows/scrape.yml` | Unified workflow with 4 staggered crons | VERIFIED | 4 cron schedules, workflow_dispatch with 5-option choice, PAREAP-scoped TLS bypass |
| `tests/scrapers/job-dedup.test.ts` | Dedup unit tests | VERIFIED | 14 tests covering normalizeForDedup, computeDedupScore, threshold constants |
| `tests/scrapers/paeducator.test.ts` | PAeducator unit tests | VERIFIED | 9 tests covering API mapping, URL fallback, cert mapping, HTML stripping, error handling |
| `tests/scrapers/schoolspring.test.ts` | SchoolSpring unit tests | VERIFIED | 12 tests covering parser, row skipping, date/URL extraction |
| `tests/scrapers/teachingjobsinpa.test.ts` | TeachingJobsInPA unit tests | VERIFIED | 11 tests covering parser, header skip, employer URL extraction, externalId uniqueness |
| `tests/scrapers/fixtures/paeducator-job.json` | PAeducator API fixture | VERIFIED | Exists; used by 9 paeducator tests |
| `tests/scrapers/fixtures/schoolspring-listing.html` | SchoolSpring HTML fixture | VERIFIED | Exists; 4 job rows confirmed by parser tests |
| `tests/scrapers/fixtures/teachingjobsinpa-listing.html` | TeachingJobsInPA HTML fixture | VERIFIED | Exists; 4 job rows confirmed by parser tests |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `adapters/paeducator/index.ts` | `https://www.paeducator.net/api/search/jobs` | REST API fetch | WIRED | POST + GET loop at line 51/78; URL constant `SEARCH_URL` |
| `lib/ingest-pipeline.ts` | `lib/job-dedup.ts` | findDuplicate called during processBatch | WIRED | `processBatch()` calls `findDuplicate()` at line 113 before every upsert |
| `scripts/scrapers/run.ts` | `adapters/paeducator/ingest.ts` | ADAPTERS map registration | WIRED | `paeducator: ingestPaeducator` at line 17 |
| `adapters/schoolspring/ingest.ts` | `lib/ingest-pipeline.ts` | runIngestion call | WIRED | `import { runIngestion }` + direct call at line 9 |
| `adapters/teachingjobsinpa/ingest.ts` | `lib/ingest-pipeline.ts` | runIngestion call | WIRED | `import { runIngestion }` + direct call at line 9 |
| `scripts/scrapers/run.ts` | `adapters/schoolspring/ingest.ts` | ADAPTERS map registration | WIRED | `schoolspring: ingestSchoolSpring` at line 18 |
| `.github/workflows/scrape.yml` | `scripts/scrapers/run.ts` | npx tsx scripts/scrapers/run.ts {adapter} | WIRED | Used in both "Run adapter" step and "all" mode |
| `adapters/pareap/ingest.ts` | `lib/ingest-pipeline.ts` | runIngestion call | WIRED | Refactored from 285-line custom to thin wrapper |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DATA-02 | 05-01, 05-03 | System aggregates jobs from PAeducator.net | SATISFIED | PAeducatorAdapter + ingest pipeline + registered in run.ts |
| DATA-03 | 05-02, 05-03 | System aggregates jobs from PDE / Teach in PA | SATISFIED* | TeachingJobsInPA used as practical substitute; PDE is a district directory with no job listings (verified in RESEARCH.md). DATA-03 is satisfied by the spirit of the requirement: a PA-specific education job source beyond PAREAP |
| DATA-04 | 05-02, 05-03 | System aggregates jobs from at least 2 additional PA sources | SATISFIED | SchoolSpring + TeachingJobsInPA = 2 additional sources beyond PAREAP and PAeducator |
| DATA-07 | 05-01, 05-03 | System deduplicates jobs across multiple sources | SATISFIED | `findDuplicate()` + `job_sources` linking in `processBatch()` with 0.8 Dice threshold |

*Note on DATA-03: REQUIREMENTS.md says "PDE / Teach in PA" but RESEARCH.md confirms PDE is a district directory (not job listings). TeachingJobsInPA.com is the practical implementation satisfying the intent. This substitution is documented in 05-02-PLAN.md and 05-RESEARCH.md.

**Orphaned requirements check:** REQUIREMENTS.md maps DATA-02, DATA-03, DATA-04, DATA-07 to Phase 5. All 4 appear in plan frontmatter. No orphaned requirements.

---

### Anti-Patterns Found

None. All `return null` and `return []` occurrences are legitimate guard clauses (error returns from DB queries, empty-input guards in parsers). No TODO/FIXME comments, no placeholder implementations, no stub handlers.

---

### Human Verification Required

The following items cannot be verified without live credentials or browser testing:

#### 1. Live scrape execution

**Test:** Run `npm run scrape:paeducator` with real Supabase credentials in `.env.local`
**Expected:** ~383 jobs inserted into the database with normalized fields; scrape log created with status "success"
**Why human:** Requires live Supabase credentials and network access to paeducator.net API

#### 2. Cross-source dedup in production

**Test:** After running both `scrape:pareap` and `scrape:paeducator`, check the `job_sources` table for rows where `job_id` is shared across sources
**Expected:** Jobs appearing on both PAREAP and PAeducator should have a single `jobs` row with two `job_sources` rows (one per source)
**Why human:** Requires live database state; cannot verify dedup linkage with unit tests alone

#### 3. SchoolSpring live pagination

**Test:** Run `npm run scrape:schoolspring` and observe logs for page count and job total
**Expected:** Multiple pages fetched (pagination working), 200+ jobs collected, pagination stops when empty page returned
**Why human:** Live network required; SchoolSpring HTML structure may differ from fixture

#### 4. GitHub Actions workflow trigger

**Test:** Manually trigger the workflow via GitHub Actions UI with `adapter: paeducator`
**Expected:** Workflow runs without NODE_TLS error, scrape completes, logs show jobs added
**Why human:** Cannot verify CI execution without GitHub Actions environment

---

### Test Suite Summary

All 46 phase-05 scraper tests pass (confirmed by live test run):

- `job-dedup.test.ts`: 14 tests — normalizeForDedup, computeDedupScore, threshold constants
- `paeducator.test.ts`: 9 tests — API mapping, URL fallback, cert parsing, HTML stripping, error isolation
- `schoolspring.test.ts`: 12 tests — HTML parsing, row skipping, date extraction, externalId, empty cases
- `teachingjobsinpa.test.ts`: 11 tests — HTML parsing, header skip, employer URL, uniqueness, empty cases

Total scraper test suite: 90 tests passing (including pre-existing PAREAP/normalizer/school-matcher/upsert tests).

---

## Conclusion

Phase 5 goal is fully achieved. The portal now has:

- 4 working source adapters (PAREAP, PAeducator.net, SchoolSpring, TeachingJobsInPA)
- A shared ingestion pipeline that all adapters use — no per-source boilerplate
- Cross-source deduplication at ingestion time with 0.8 Dice coefficient threshold and borderline logging
- A unified GitHub Actions workflow with staggered daily cron schedules per source
- NODE_TLS_REJECT_UNAUTHORIZED=0 correctly scoped to PAREAP only
- 46 new unit tests, all passing

All 4 required requirements (DATA-02, DATA-03, DATA-04, DATA-07) are satisfied. No gaps found in automated verification.

---

_Verified: 2026-03-11T13:56:00Z_
_Verifier: Claude (gsd-verifier)_
