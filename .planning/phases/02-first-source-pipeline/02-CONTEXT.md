# Phase 2: First Source Pipeline - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Jobs from PAREAP flow automatically into the database on a schedule without corrupting existing data. This phase delivers the PAREAP scraper, data normalizer, scheduled ingestion via GitHub Actions, and failure handling with logging. No other sources, no search/filter UI, no data enrichment.

</domain>

<decisions>
## Implementation Decisions

### Scraping Approach
- Standalone script in `scripts/scrapers/` — not coupled to the Next.js web app
- Claude's discretion on headless browser (Playwright) vs HTTP + cheerio based on what PAREAP actually requires
- Scrape all listing pages per run, but detect when pages contain only expired postings and stop early (skip remaining pages)
- Polite 1-3 second delay between page requests to avoid being blocked
- Adapter pattern: PAREAP is the first adapter; new sources get new adapters (per roadmap decision)

### Data Normalization
- Store raw job titles as-is — title cleanup and categorization deferred to Phase 6 (Data Enrichment)
- Extract city, state, and zip code from location text where available; store raw location text alongside structured fields
- Geocoding (lat/lng for PostGIS geography column) deferred to Phase 4 (Search & Filters)
- Fuzzy-match scraped school names to existing entries in the `schools` table; create new entries for unmatched schools
- Extract school_type (public, private, charter, IU, etc.) if PAREAP provides it directly or it's inferrable from the listing

### Scheduling & Runtime
- GitHub Actions for scheduled runs — free tier, no timeout pressure, supports headless browsers
- Claude's discretion on exact frequency (daily is the minimum per DATA-10)
- CLI entrypoint (`npm run scrape:pareap`) for local testing and on-demand runs
- Supabase service role key stored as GitHub Actions secret for direct DB writes (bypasses RLS)

### Failure Handling & Logging
- Partial failures: keep successfully scraped jobs, log the failure, continue trying remaining pages
- Retry failed page requests 2-3 times with backoff before marking as failed
- Scrape run logs stored in a Supabase `scrape_logs` table (run timestamp, source, jobs added/updated/skipped, errors, duration) — queryable for future monitoring dashboard (Phase 9)
- GitHub Actions failure notifications for total failures (0 jobs scraped) — no custom alerting in Phase 2

### Claude's Discretion
- Headless browser vs HTTP parsing (based on PAREAP's actual rendering requirements)
- Scrape frequency (daily minimum, could be more)
- Exact retry backoff strategy
- Expired-page detection heuristic (how to determine a page is all expired postings)
- Scraping library choices

</decisions>

<specifics>
## Specific Ideas

- PAREAP's later pages likely contain only expired postings — scraper should detect this pattern and stop early rather than scraping hundreds of stale pages
- Script should be fully runnable locally for development and debugging, not just in CI

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts` and `server.ts`: Supabase client helpers for browser and server contexts
- Database schema (`00001_initial_schema.sql`): `sources`, `jobs`, `schools`, `job_sources` tables ready with proper indexes
- `jobs` table has `UNIQUE(source_id, external_id)` constraint — natural upsert key for dedup

### Established Patterns
- Supabase JS client (`@supabase/supabase-js` v2.99) for all database operations
- Next.js 15 with App Router (but scraper is standalone, not a route)

### Integration Points
- `sources` table: PAREAP entry needs to be seeded (name, slug, base_url, scraper_type)
- `jobs` table: scraper writes here with source_id, external_id, title, url, location fields
- `schools` table: scraper creates/links school records via fuzzy matching
- `job_sources` table: records source attribution for future multi-source dedup (Phase 5)
- GitHub Actions workflow file in `.github/workflows/`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-first-source-pipeline*
*Context gathered: 2026-03-10*
