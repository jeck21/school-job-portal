# Phase 6: Data Enrichment - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Enrich scraped job data with salary detection and certification extraction during ingestion. Validate job freshness via URL health checks and AI content analysis, soft-deleting stale or closed postings on a weekly schedule. No new UI — this phase populates existing schema fields (`salary_mentioned`, `salary_raw`, `certifications`, `is_active`) that the search RPC already filters on.

</domain>

<decisions>
## Implementation Decisions

### Salary detection
- Detect salary by matching **any dollar amount** in posting text ($45,000, $25/hr, $50k-$70k)
- Vague terms like "competitive salary" or "commensurate with experience" do NOT count
- Store the matched salary snippet in `salary_raw` (e.g., "$45,000 - $65,000")
- Set `salary_mentioned = true` when a dollar amount is found
- Run **inline during ingestion** — salary regex runs as each job is processed in the pipeline
- No backfill script — plan is to **delete all existing data and re-scrape** after enrichment code is complete (may revisit)

### Certification extraction
- Parse free-text descriptions for cert mentions using **PDE official certification areas** as the taxonomy
- Research phase should compile the PDE cert area list
- Run **inline during ingestion** alongside salary detection
- **Structured certs from adapters take priority** — only parse descriptions when no structured cert data exists from the adapter
- Certs stored in existing `certifications` text array column

### Freshness validation & removal
- **Two-step process:**
  1. HTTP HEAD check on all active job URLs — dead URLs (404/410/timeout) → soft-delete immediately (`is_active = false`)
  2. Full page fetch for surviving URLs — check content for closed/filled signals
- No day-based staleness threshold — check ALL active jobs on schedule
- **Weekly schedule** via GitHub Actions cron
- **Soft-delete only** — set `is_active = false`, never hard-delete. Jobs stay in DB for analytics/recovery
- **Log freshness results to DB** — reuse scrape_logs pattern: jobs checked, deactivated (broken URL vs content-closed), still active

### AI content analysis
- **Hybrid approach:** keyword/regex heuristics first, Claude Haiku API for ambiguous cases
- Heuristics match patterns like "position has been filled", "no longer accepting", "posting closed", "expired"
- When Haiku is called for ambiguous pages, **also extract salary/cert data if missing** from that job
- Model: **Claude Haiku** (~$0.001/job)
- **Cap at 100 AI calls per freshness run** (may remove cap later after cost review)
- User will review AI costs after several weeks and may switch to heuristics-only

### Claude's Discretion
- Specific salary regex patterns and edge case handling
- PDE cert taxonomy granularity (after research)
- Heuristic keyword list for closed posting detection
- Haiku prompt design for classification + extraction
- Freshness check concurrency and polite delay between requests
- GitHub Actions cron day/time for weekly freshness run

</decisions>

<specifics>
## Specific Ideas

- Plan to delete all existing scraped data and re-scrape from scratch after enrichment code is built, so all jobs get enriched from the start
- Cost safeguard on AI calls is temporary — user wants flexibility to remove the 100/run cap later
- Freshness check should be efficient: HEAD check is a fast first pass that eliminates clearly dead URLs before the more expensive full-fetch + AI analysis

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ingest-pipeline.ts`: Shared `runIngestion()` with `processBatch()` — salary/cert detection hooks into the job processing loop
- `scrape_logs` table + `logger.ts`: Reusable logging pattern for freshness check results
- `search_jobs` RPC: Already filters on `salary_mentioned` and `certifications` — no RPC changes needed
- `ScrapedJob` type: Already has `certificates` field for structured cert data from adapters

### Established Patterns
- Batch processing with BATCH_SIZE = 25 and independent failure handling
- Source adapter pattern (`SourceAdapter` interface) — freshness checker could follow similar pattern
- GitHub Actions cron with staggered schedules (6AM, 10AM, 2PM, 6PM UTC for scrapers)

### Integration Points
- `processBatch()` in `ingest-pipeline.ts`: Add salary detection + cert extraction before job upsert
- `jobs` table: `salary_mentioned`, `salary_raw`, `certifications`, `is_active` columns already exist
- GitHub Actions: New workflow file for weekly freshness checks
- Anthropic API: New dependency for Claude Haiku calls in freshness checker

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-data-enrichment*
*Context gathered: 2026-03-11*
