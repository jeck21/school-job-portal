# Phase 5: Additional Sources - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The portal aggregates jobs from 4+ PA educator job sources with cross-source deduplication. This phase adds adapters for PAeducator.net, PDE/Teach in PA, PAIU job boards, Frontline/Applitrack, SchoolSpring, and K12JobSpot — building on the existing PAREAP adapter pattern. Deduplication ensures the same job from multiple sources appears only once. No data enrichment, no UI changes beyond apply link behavior, no freshness validation.

</domain>

<decisions>
## Implementation Decisions

### Source Selection
- Target 6 sources total: PAREAP (existing) + PAeducator.net, PDE/Teach in PA, PAIU job boards, Frontline/Applitrack, SchoolSpring, K12JobSpot
- Prioritization order is Claude's discretion — weigh source value (job count, uniqueness) and implementation ease
- Strict ToS compliance: if a source's ToS prohibits scraping, skip it entirely — do not attempt workarounds
- Check for API/RSS alternatives before scraping, but skip the source if no legitimate access method exists
- Target 500+ quality active jobs across 4+ sources — do not pad with low-quality or irrelevant postings
- Playwright is acceptable for JS-rendered sources if needed, but flag if it adds significant cost (GitHub Actions minutes, infrastructure)

### Cross-Source Deduplication
- Fuzzy title + school name matching using similarity scoring (Dice coefficient, consistent with existing school matching approach)
- Balanced matching threshold (~0.8) — accept some risk of duplicates over false merges
- Borderline dedup decisions (score between ~0.7-0.85) should be logged for manual review by the operator
- When a job exists on multiple sources, use the most complete version (longest description, most metadata) as canonical
- Fall back to first-seen source if completeness is equal
- Dedup timing (ingestion-time vs batch) is Claude's discretion based on pipeline architecture

### Scheduling & Rollout
- Roll out one adapter at a time — build and verify each before starting the next
- Stagger scrape schedules across the day (e.g., 2AM, 6AM, 10AM, etc.) to reduce peak load on GitHub Actions and source servers
- One unified GitHub Actions workflow file for all sources — single place to configure secrets and manage
- On scraper failure: alert via GitHub Actions notification, keep existing jobs from that source visible until fixed (no auto-disable)

### Source Attribution & Apply Links
- No source attribution shown to users — the portal presents jobs as its own aggregated content
- No multi-source trust badges or "found on X sources" indicators
- "Apply" button and "View Original Posting" should link to the employer's direct application page (school/district site) when available, not the aggregator source URL
- Source attribution data still tracked internally in job_sources table for operational purposes
- If a source's ToS requires attribution, comply on a per-source basis (expected to be rare)

### Claude's Discretion
- Adapter implementation order/priority
- Cheerio vs Playwright per source (based on actual site rendering)
- Dedup timing strategy (ingestion-time vs batch)
- Exact similarity thresholds per source
- Scrape schedule timing for each source
- How to detect/extract employer direct application URLs from different source formats

</decisions>

<specifics>
## Specific Ideas

- Long-term goal is districts posting directly to the portal — scraping coverage gaps are acceptable in the short term for legal compliance
- Operator wants a method to manually review borderline dedup decisions (log with scores, not just auto-merge)
- Quality over quantity: 500+ is a target but only with relevant, quality educator job postings

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/scrapers/lib/types.ts`: `SourceAdapter` interface — new adapters implement this
- `scripts/scrapers/lib/normalizer.ts`: `parseLocation()`, `normalizeSchoolType()` — reuse for all sources
- `scripts/scrapers/lib/school-matcher.ts`: Dice coefficient fuzzy matching (0.8 threshold) — extend for cross-source job dedup
- `scripts/scrapers/lib/http-client.ts`: `fetchWithRetry()` with exponential backoff — reuse for all HTTP scraping
- `scripts/scrapers/lib/logger.ts`, `supabase-admin.ts`: Shared infrastructure
- `scripts/scrapers/adapters/pareap/`: Reference implementation for new adapters

### Established Patterns
- Adapter pattern: `adapters/[source-slug]/` with index.ts, parser.ts, types.ts, ingest.ts
- Batch upsert in groups of 25 with per-batch error isolation
- School fuzzy matching with Dice coefficient (MATCH=0.8, NEAR_MISS=0.6)
- Scrape logs stored in `scrape_logs` table (run stats, errors, duration)
- CLI entrypoint via `scripts/scrapers/run.ts` with ADAPTERS map

### Integration Points
- `sources` table: seed new source entries (name, slug, base_url, scraper_type)
- `jobs` table: UNIQUE(source_id, external_id) constraint for within-source dedup
- `job_sources` table: UNIQUE(job_id, source_id) for cross-source attribution
- `scripts/scrapers/run.ts`: register new adapters in ADAPTERS map
- `.github/workflows/`: unified workflow file with staggered cron schedules

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-additional-sources*
*Context gathered: 2026-03-11*
