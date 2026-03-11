# Phase 5: Additional Sources - Research

**Researched:** 2026-03-11
**Domain:** Multi-source web scraping, cross-source deduplication, adapter pattern extension
**Confidence:** HIGH

## Summary

Phase 5 extends the existing PAREAP scraper pipeline to aggregate jobs from 5+ additional PA educator job sources. Research reveals that **PAeducator.net has a REST API** that returns structured JSON (no scraping needed), **SchoolSpring has server-rendered HTML** scrapable with cheerio (1000+ PA jobs), and **TeachingJobsInPA.com has a simple HTML table** (507 jobs, all on one page). The PDE/Teach in PA site is a directory of links to district employment pages (not individual job listings), and PAIU has very few administrative-level postings (~20). K12JobSpot and SchoolSpring detail pages are SPAs requiring Playwright for full data.

The existing adapter pattern (`SourceAdapter` interface, batch upsert, school matching) is well-structured for extension. Cross-source deduplication is the novel challenge -- it requires fuzzy matching on title + school name, building on the existing Dice coefficient infrastructure in `school-matcher.ts`. The `job_sources` table already exists for multi-source attribution.

**Primary recommendation:** Implement adapters in order of value and ease: PAeducator.net (API, ~383 jobs) first, then SchoolSpring (cheerio, 1000+ jobs), then TeachingJobsInPA.com (cheerio, 507 jobs). These three plus existing PAREAP satisfy the 4+ sources requirement. Add deduplication as a cross-cutting concern after the first two new adapters are working. Skip PAIU (too few jobs), K12JobSpot (Vue SPA, complex), and PDE (directory, not listings).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Target 6 sources total: PAREAP (existing) + PAeducator.net, PDE/Teach in PA, PAIU job boards, Frontline/Applitrack, SchoolSpring, K12JobSpot
- Prioritization order is Claude's discretion -- weigh source value (job count, uniqueness) and implementation ease
- Strict ToS compliance: if a source's ToS prohibits scraping, skip it entirely -- do not attempt workarounds
- Check for API/RSS alternatives before scraping, but skip the source if no legitimate access method exists
- Target 500+ quality active jobs across 4+ sources -- do not pad with low-quality or irrelevant postings
- Playwright is acceptable for JS-rendered sources if needed, but flag if it adds significant cost
- Fuzzy title + school name matching using similarity scoring (Dice coefficient)
- Balanced matching threshold (~0.8) -- accept some risk of duplicates over false merges
- Borderline dedup decisions (score between ~0.7-0.85) should be logged for manual review
- When a job exists on multiple sources, use the most complete version as canonical
- Roll out one adapter at a time -- build and verify each before starting the next
- Stagger scrape schedules across the day
- One unified GitHub Actions workflow file for all sources
- On scraper failure: alert via GitHub Actions notification, keep existing jobs visible
- No source attribution shown to users -- portal presents jobs as its own aggregated content
- "Apply" button should link to employer's direct application page when available
- Source attribution data tracked internally in job_sources table

### Claude's Discretion
- Adapter implementation order/priority
- Cheerio vs Playwright per source (based on actual site rendering)
- Dedup timing strategy (ingestion-time vs batch)
- Exact similarity thresholds per source
- Scrape schedule timing for each source
- How to detect/extract employer direct application URLs from different source formats

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-02 | System aggregates jobs from PAeducator.net | PAeducator.net has a REST API at `/api/search/jobs` and `/api/job/{id}` returning rich JSON with title, org, county, description, certifications. Cheerio not needed -- direct HTTP calls. |
| DATA-03 | System aggregates jobs from PDE / Teach in PA | PDE Career Opportunities page is a county-organized directory of links to district employment pages, NOT individual job listings. TeachingJobsInPA.com (507 jobs, server-rendered HTML table) is the viable PA-specific alternative. |
| DATA-04 | System aggregates jobs from at least 2 additional PA sources | SchoolSpring (1000+ PA jobs, server-rendered listing page), TeachingJobsInPA.com (507 jobs), and optionally Frontline/Applitrack (per-district portals). Three sources + PAREAP + PAeducator = 5+ sources. |
| DATA-07 | System deduplicates jobs across multiple sources | Extend existing Dice coefficient matching from `school-matcher.ts` to compare job title + school name. `job_sources` table with UNIQUE(job_id, source_id) already supports multi-source attribution. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | ^1.2.0 | HTML parsing for SchoolSpring, TeachingJobsInPA | Already in project, used by PAREAP adapter |
| string-similarity | ^4.0.4 | Dice coefficient for dedup fuzzy matching | Already in project, used by school-matcher |
| tsx | ^4.21.0 | TypeScript execution for scraper scripts | Already in project |
| dotenv | ^17.3.1 | Environment variable loading | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright | ^1.58.2 | JS-rendered page scraping | Only if K12JobSpot or SchoolSpring detail pages needed (not recommended for initial adapters) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct fetch for PAeducator | Playwright | Unnecessary -- API works with plain HTTP |
| cheerio for SchoolSpring | Playwright | Listing page is server-rendered; detail pages are SPA but not needed for basic listing data |
| Scraping PDE | TeachingJobsInPA.com | PDE is a directory not listings; TeachingJobsInPA has actual job records |

**Installation:**
```bash
# No new dependencies needed -- all libraries already in project
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/scrapers/
├── adapters/
│   ├── pareap/              # Existing reference implementation
│   ├── paeducator/          # NEW: API-based adapter
│   │   ├── index.ts         # PAeducatorAdapter implements SourceAdapter
│   │   ├── types.ts         # API response types
│   │   └── ingest.ts        # Ingestion pipeline
│   ├── schoolspring/        # NEW: cheerio HTML scraper
│   │   ├── index.ts         # SchoolSpringAdapter
│   │   ├── parser.ts        # HTML table parser
│   │   ├── types.ts         # Listing row types
│   │   └── ingest.ts        # Ingestion pipeline
│   └── teachingjobsinpa/    # NEW: cheerio HTML scraper
│       ├── index.ts         # TeachingJobsInPAAdapter
│       ├── parser.ts        # HTML table parser
│       ├── types.ts         # Types
│       └── ingest.ts        # Ingestion pipeline
├── lib/
│   ├── types.ts             # SourceAdapter interface (unchanged)
│   ├── http-client.ts       # fetchWithRetry (unchanged)
│   ├── normalizer.ts        # parseLocation, normalizeSchoolType (unchanged)
│   ├── school-matcher.ts    # Existing school matching (unchanged)
│   ├── job-dedup.ts         # NEW: cross-source job deduplication
│   └── ...
└── run.ts                   # Register new adapters in ADAPTERS map
```

### Pattern 1: API-Based Adapter (PAeducator.net)
**What:** Direct REST API calls returning JSON -- no HTML parsing needed
**When to use:** PAeducator.net (the only source with a public API)
**Example:**
```typescript
// PAeducator.net API endpoints (verified working with curl):
// POST /api/search/jobs?allowAnonymous=true  body: {} -> returns array of job IDs
// GET  /api/job/{id}?allowAnonymous=true     -> returns full job detail JSON
// GET  /api/general-data/location-hierarchy   -> returns regions/counties/IUs

interface PAeducatorJob {
  id: number;
  jobTitle: string;
  county: string;
  employmentType: string;
  description: string;
  postedDttm: string;
  applicationDeadlineDate: string;
  organization: {
    name: string;      // e.g. "East Pennsboro Area School District"
    city: string;
    zip: string;
    url: string;       // District website -- USE AS apply link
    intermediateUnit_Id: string;
  };
  certifications: Array<{ name: string; certificationType: string }>;
}
```

### Pattern 2: Cheerio HTML Table Scraper (SchoolSpring, TeachingJobsInPA)
**What:** Parse server-rendered HTML tables using cheerio
**When to use:** SchoolSpring listing page, TeachingJobsInPA.com
**Example:**
```typescript
// SchoolSpring listing page structure:
// POST https://employer.schoolspring.com/find/pennsylvania_teaching_jobs_in_pennsylvania.cfm
// Form data: pageNumber=N&ssPageNumber=N (0-indexed, 20 per page)
// HTML: <tr> rows with <TD class="cellData"> cells:
//   [0] Date (e.g. "Mar 11")
//   [1] Title with link to detail (href contains jobId)
//   [2] School/employer name
//   [3] Location (city, state)

// TeachingJobsInPA structure:
// GET https://www.teachingjobsinpa.com/jobsList
// HTML: <table id="myTable"> with all 507 jobs on one page
// Each <tr>: [0] School, [1] Subject, [2] Title with external URL link
```

### Pattern 3: Cross-Source Deduplication
**What:** Identify and merge duplicate jobs found across multiple sources
**When to use:** During ingestion of each new source
**Example:**
```typescript
// job-dedup.ts -- ingestion-time dedup
import { compareTwoStrings } from "string-similarity";

const DEDUP_MATCH_THRESHOLD = 0.8;
const DEDUP_REVIEW_LOW = 0.7;
const DEDUP_REVIEW_HIGH = 0.85;

interface DedupCandidate {
  jobId: string;
  title: string;
  schoolName: string;
  descriptionLength: number;
  sourceId: string;
}

function normalizeForDedup(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function computeDedupScore(a: DedupCandidate, b: DedupCandidate): number {
  const titleScore = compareTwoStrings(
    normalizeForDedup(a.title),
    normalizeForDedup(b.title)
  );
  const schoolScore = compareTwoStrings(
    normalizeForDedup(a.schoolName),
    normalizeForDedup(b.schoolName)
  );
  // Weight title more heavily (0.6) than school (0.4)
  return titleScore * 0.6 + schoolScore * 0.4;
}
```

### Pattern 4: Shared Ingestion Pipeline (Extract from PAREAP)
**What:** Refactor common ingestion logic into a reusable function
**When to use:** All adapters share the same pattern: ensure source -> create log -> scrape -> batch upsert -> update log
**Example:**
```typescript
// lib/ingest-pipeline.ts -- generic pipeline wrapping adapter-specific scrape()
async function runIngestion(
  adapter: SourceAdapter,
  sourceConfig: { name: string; slug: string; baseUrl: string; scraperType: string }
): Promise<ScrapeResult> {
  const supabase = createAdminClient();
  const sourceId = await ensureSource(supabase, sourceConfig);
  const logId = await createScrapeLog(supabase, sourceId);
  // ... same pattern as current ingestPareap but generalized
}
```

### Anti-Patterns to Avoid
- **Scraping JS-rendered pages with cheerio:** Will get empty/skeleton HTML. Use Playwright or find an API.
- **Creating separate workflow files per source:** User decision mandates one unified workflow.
- **Running all scrapers at the same time:** Stagger cron schedules to reduce peak load.
- **Auto-merging borderline dedup matches:** Log scores 0.7-0.85 for manual review instead.
- **Linking apply button to aggregator source URL:** Extract the employer's direct application URL when available.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String similarity | Custom fuzzy matching | `string-similarity` (Dice coefficient) | Already in project, well-tested, handles edge cases |
| HTTP retry logic | Custom retry loops | `fetchWithRetry` from existing http-client.ts | Already handles exponential backoff, 429/5xx detection |
| School matching | Custom name comparison | `findOrCreateSchool` from school-matcher.ts | Already handles normalization, near-miss logging |
| HTML parsing | Regex on HTML | cheerio | Regex on HTML is fragile; cheerio handles real DOM |
| Cron scheduling | Custom scheduler | GitHub Actions cron | Already in use, reliable, free for public repos |

**Key insight:** The existing scraper infrastructure is well-designed. New adapters should plug into it, not reinvent it. The main new code is per-source parsing and the cross-source dedup logic.

## Common Pitfalls

### Pitfall 1: PAeducator.net API Rate Limiting
**What goes wrong:** Hitting the API too fast (383+ job detail requests) could trigger rate limiting or IP blocks.
**Why it happens:** The API has no documented rate limits but is designed for web app use, not bulk scraping.
**How to avoid:** Add polite delays (1-2s) between individual job detail requests. Batch the ID list into chunks. Use the existing `delay()` helper.
**Warning signs:** HTTP 429 responses, connection resets, empty responses.

### Pitfall 2: SchoolSpring Pagination Complexity
**What goes wrong:** SchoolSpring shows "1000+" jobs but pagination is form-POST based with hidden fields. Missing the pagination pattern means only getting page 1 (20 jobs).
**Why it happens:** The listing page uses JavaScript `IncrementPage()` / `deincrementPage()` functions that manipulate hidden form fields and submit the form.
**How to avoid:** POST to the search URL with `pageNumber` and `ssPageNumber` incrementing from 0. Parse until no more results appear. Cap at 50 pages (1000 jobs) as a safety limit.
**Warning signs:** Getting only 20 jobs when 1000+ are claimed.

### Pitfall 3: False Positive Dedup Merges
**What goes wrong:** "Math Teacher" at "Springfield School District" is incorrectly merged across sources when they're actually different positions.
**Why it happens:** Common job titles + common district names produce high similarity scores despite being different jobs.
**How to avoid:** Use the 0.8 threshold as decided. When title+school score is in the borderline range (0.7-0.85), log it for manual review. Consider additional signals: location/city match, posted date proximity.
**Warning signs:** Job count drops unexpectedly after dedup, user reports missing listings.

### Pitfall 4: PAREAP SSL Certificate Issues
**What goes wrong:** Existing PAREAP scraper uses `NODE_TLS_REJECT_UNAUTHORIZED=0` -- new adapters should NOT inherit this unless they also have SSL issues.
**Why it happens:** PAREAP has known SSL certificate problems. Other sources (PAeducator.net, SchoolSpring) have valid certs.
**How to avoid:** Only set `NODE_TLS_REJECT_UNAUTHORIZED=0` for the PAREAP adapter run, not globally in the workflow.
**Warning signs:** Other scrapers silently accept bad certificates.

### Pitfall 5: PDE "Teach in PA" Is Not What It Seems
**What goes wrong:** Attempting to scrape PDE Career Opportunities page yields zero job listings.
**Why it happens:** The PDE page is a directory linking to district employment pages by county, not a job listing aggregator. Each linked district uses a different system (Applitrack, PAeducator, their own site).
**How to avoid:** Use TeachingJobsInPA.com instead -- it has 507 actual job records in a simple HTML table. If the requirement strictly requires "PDE / Teach in PA," document that PDE redirects to `pa.gov` and contains only a directory.
**Warning signs:** Scraper returns 0 jobs from PDE URL.

### Pitfall 6: TeachingJobsInPA External URLs
**What goes wrong:** Job links on TeachingJobsInPA point to various Applitrack portals, district websites, etc. These URLs may change or break.
**Why it happens:** TeachingJobsInPA aggregates from many sources itself; links are to the original posting systems.
**How to avoid:** Store the external URL but verify it resolves. The linked URL IS the employer's direct application page (which is what the user decision requires for the Apply button).
**Warning signs:** High percentage of dead URLs, 404s.

## Code Examples

### PAeducator.net API Integration
```typescript
// Source: Verified with curl against live API on 2026-03-11

// Step 1: Get all job IDs
const idsResponse = await fetch(
  "https://www.paeducator.net/api/search/jobs?allowAnonymous=true",
  { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
);
const jobIds: number[] = await idsResponse.json(); // Returns ~383 IDs

// Step 2: Fetch individual job details
const jobResponse = await fetch(
  `https://www.paeducator.net/api/job/${jobId}?allowAnonymous=true`
);
const job = await jobResponse.json();
// job.organization.url = district website (apply link)
// job.organization.city + zip = location data
// job.certifications = structured cert data
```

### SchoolSpring Listing Page Parsing
```typescript
// Source: Verified with curl against live page on 2026-03-11

// POST with page number (0-indexed)
const html = await fetchWithRetry(
  "https://employer.schoolspring.com/find/pennsylvania_teaching_jobs_in_pennsylvania.cfm",
  // Note: need to POST with form data for pagination
);
const $ = cheerio.load(html);

// Each job is a <tr> with <TD class="cellData"> cells
$("tr").each((_, row) => {
  const cells = $(row).find("td.cellData");
  if (cells.length >= 4) {
    const date = $(cells[0]).text().trim();       // "Mar 11"
    const titleLink = $(cells[1]).find("a");
    const title = titleLink.text().trim();         // "Kitchen Manager, UDHS"
    const url = titleLink.attr("href");            // SchoolSpring detail URL
    const school = $(cells[2]).text().trim();       // "Upper Dublin High School"
    const location = $(cells[3]).text().trim();     // "New Hope, Pennsylvania"
  }
});
```

### TeachingJobsInPA Single-Page Parsing
```typescript
// Source: Verified with WebFetch on 2026-03-11

const html = await fetchWithRetry("https://www.teachingjobsinpa.com/jobsList");
const $ = cheerio.load(html);

// All 507 jobs in <table id="myTable">
$("#myTable tr").each((i, row) => {
  if (i === 0) return; // Skip header
  const cells = $(row).find("td");
  const school = $(cells[0]).text().trim();    // "Abington Heights SD"
  const subject = $(cells[1]).text().trim();   // "ELEMENTARY (PK-4)"
  const titleLink = $(cells[2]).find("a");
  const title = titleLink.text().trim();       // "Elementary 1st Grade LTS"
  const applyUrl = titleLink.attr("href");     // Direct application URL
});
```

### Cross-Source Dedup During Ingestion
```typescript
// Dedup at ingestion time: before inserting a new job, check existing jobs
// for fuzzy match on title + school name

async function findDuplicate(
  supabase: SupabaseClient,
  newJob: ScrapedJob,
  excludeSourceId: string
): Promise<{ jobId: string; score: number } | null> {
  // Fetch recent active jobs (limit to last 90 days for performance)
  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("id, title, school_id, schools(name), description, source_id")
    .eq("is_active", true)
    .neq("source_id", excludeSourceId);

  if (!existingJobs) return null;

  let bestMatch: { jobId: string; score: number } | null = null;
  const normalizedNewTitle = normalizeForDedup(newJob.title);
  const normalizedNewSchool = normalizeForDedup(newJob.schoolName);

  for (const existing of existingJobs) {
    const titleScore = compareTwoStrings(
      normalizedNewTitle,
      normalizeForDedup(existing.title)
    );
    const schoolName = existing.schools?.name || "";
    const schoolScore = compareTwoStrings(
      normalizedNewSchool,
      normalizeForDedup(schoolName)
    );
    const combinedScore = titleScore * 0.6 + schoolScore * 0.4;

    if (combinedScore > (bestMatch?.score ?? 0)) {
      bestMatch = { jobId: existing.id, score: combinedScore };
    }
  }

  return bestMatch && bestMatch.score >= DEDUP_REVIEW_LOW ? bestMatch : null;
}
```

### Unified GitHub Actions Workflow
```yaml
# .github/workflows/scrape.yml -- staggered schedules, one file
name: Scrape Job Sources

on:
  schedule:
    - cron: '0 6 * * *'   # PAREAP: 6 AM UTC
    - cron: '0 10 * * *'  # PAeducator: 10 AM UTC
    - cron: '0 14 * * *'  # SchoolSpring: 2 PM UTC
    - cron: '0 18 * * *'  # TeachingJobsInPA: 6 PM UTC
  workflow_dispatch:
    inputs:
      adapter:
        description: 'Adapter to run (pareap, paeducator, schoolspring, teachingjobsinpa, all)'
        required: true
        default: 'all'

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Determine adapter from schedule
        id: adapter
        run: |
          # Map cron schedule to adapter name
          if [ "${{ github.event.schedule }}" = "0 6 * * *" ]; then
            echo "name=pareap" >> $GITHUB_OUTPUT
          elif [ "${{ github.event.schedule }}" = "0 10 * * *" ]; then
            echo "name=paeducator" >> $GITHUB_OUTPUT
          # ... etc
          fi
      - run: npx tsx scripts/scrapers/run.ts ${{ steps.adapter.outputs.name }}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual job aggregation | Automated scraping pipelines | Standard practice | Required for 4+ sources at scale |
| Exact-match dedup | Fuzzy similarity scoring | - | Catches duplicates with slightly different titles/spellings |
| Single source pipeline | Multi-source adapter pattern | Phase 2 established | Each source = new adapter directory |
| Per-source workflow files | Unified workflow with staggered cron | Phase 5 decision | Single file to manage |

**Source landscape findings:**
- PAeducator.net: REST API, ~383 active jobs, rich data (best source for data quality)
- SchoolSpring: Server-rendered listing page, 1000+ PA jobs (highest volume), detail pages are React SPA
- TeachingJobsInPA.com: Simple HTML table, 507 jobs, links to employer apply pages
- PAREAP: Existing adapter, HTML scraping (already working)
- PAIU: ~20 IU administrative postings (too few to be worthwhile)
- K12JobSpot: Vue SPA, requires Playwright (complex, not needed to hit targets)
- PDE/Teach in PA: Directory page only, no individual job listings

## Open Questions

1. **PDE Requirement Satisfaction**
   - What we know: PDE Career Opportunities page redirects to `pa.gov` and lists a directory of district employment pages by county, NOT individual jobs. No scrapable job data.
   - What's unclear: Whether DATA-03 ("System aggregates jobs from PDE / Teach in PA") can be satisfied by TeachingJobsInPA.com as an alternative PA-specific source, or if it strictly requires the PDE government site.
   - Recommendation: TeachingJobsInPA.com is the practical alternative. The PDE page provides zero scrapable jobs. Document this in the plan and move forward.

2. **SchoolSpring Detail Page Data**
   - What we know: The listing page has date, title, school, location. Detail pages are a React SPA requiring Playwright.
   - What's unclear: Whether the listing data alone is sufficient or if we need descriptions/certifications from detail pages.
   - Recommendation: Start with listing data only. Listing data provides enough for search/dedup. Add detail page scraping later if descriptions are needed for enrichment (Phase 6 territory).

3. **Dedup Performance at Scale**
   - What we know: Dedup requires comparing each new job against all existing active jobs.
   - What's unclear: With 500+ existing jobs and 383+ new jobs per source, how expensive is O(n*m) comparison?
   - Recommendation: Pre-filter candidates by state (all PA, so no help) and potentially by school name prefix or city. Cache existing jobs in memory during ingestion run. 500*400 = 200K comparisons is fast in-memory with string-similarity.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/scrapers/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-02 | PAeducator adapter returns ScrapedJob[] from API | unit | `npx vitest run tests/scrapers/paeducator.test.ts -x` | Wave 0 |
| DATA-03 | TeachingJobsInPA adapter parses HTML table | unit | `npx vitest run tests/scrapers/teachingjobsinpa.test.ts -x` | Wave 0 |
| DATA-04 | SchoolSpring adapter parses listing page HTML | unit | `npx vitest run tests/scrapers/schoolspring.test.ts -x` | Wave 0 |
| DATA-07 | Dedup identifies matching jobs across sources | unit | `npx vitest run tests/scrapers/job-dedup.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/scrapers/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/scrapers/paeducator.test.ts` -- covers DATA-02: API response parsing, ScrapedJob mapping
- [ ] `tests/scrapers/schoolspring.test.ts` -- covers DATA-04: HTML table parsing, pagination
- [ ] `tests/scrapers/teachingjobsinpa.test.ts` -- covers DATA-03: HTML table parsing
- [ ] `tests/scrapers/job-dedup.test.ts` -- covers DATA-07: fuzzy matching, threshold logic, borderline logging
- [ ] `tests/scrapers/fixtures/paeducator-job.json` -- sample API response fixture
- [ ] `tests/scrapers/fixtures/schoolspring-listing.html` -- sample listing HTML fixture
- [ ] `tests/scrapers/fixtures/teachingjobsinpa-listing.html` -- sample listing HTML fixture

## Sources

### Primary (HIGH confidence)
- PAeducator.net REST API -- verified with curl, returns structured JSON (job IDs via POST, full details via GET /api/job/{id})
- PAeducator.net robots.txt -- allows all paths except /admin, /login, /logout, /register
- SchoolSpring listing page -- verified with curl, server-rendered HTML table with date/title/school/location
- SchoolSpring robots.txt -- allows all (`Disallow:` empty)
- TeachingJobsInPA.com -- verified with WebFetch, server-rendered HTML table, 507 jobs, `<table id="myTable">`
- Applitrack robots.txt -- only disallows `*/onlineapp/admin`
- K12JobSpot robots.txt -- no disallow directives
- Existing codebase: `scripts/scrapers/` adapter pattern, `lib/types.ts`, `lib/school-matcher.ts`

### Secondary (MEDIUM confidence)
- PDE Career Opportunities page redirects to pa.gov, verified as directory (not job listings)
- PAIU job board (SSL expired) -- appears to have ~20 IU-level postings based on HTML inspection
- SchoolSpring claims 1000+ PA jobs based on listing page count
- SchoolSpring/K12JobSpot ToS pages are SPAs (could not verify ToS text)

### Tertiary (LOW confidence)
- SchoolSpring and K12JobSpot terms of service -- pages are React SPAs, could not read actual ToS text. robots.txt for both allows full access. Proceed with caution and monitor.
- PAeducator.net terms of service -- page is SPA, could not read. robots.txt allows access. API has `allowAnonymous=true` parameter suggesting public access is intended.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- extending well-established adapter pattern with verified API/HTML structures
- Pitfalls: HIGH -- based on direct testing of live sites
- Source accessibility: HIGH for PAeducator (API verified), HIGH for SchoolSpring/TeachingJobsInPA (HTML verified), MEDIUM for ToS compliance (could not read SPA-rendered ToS pages)

**Research date:** 2026-03-11
**Valid until:** 2026-03-25 (14 days -- source site structures could change)
