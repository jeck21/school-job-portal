# Phase 2: First Source Pipeline - Research

**Researched:** 2026-03-10
**Domain:** Web scraping, data ingestion, scheduled automation
**Confidence:** HIGH

## Summary

PAREAP (pareap.net) is a classic server-rendered PHP website using Bootstrap 5.3 with zero client-side rendering of job data. All job listings are delivered as static HTML in a `<table id="jobsrch">` element, paginated at 50 jobs per page using a `?page=N` query parameter. This means **cheerio (HTTP + HTML parsing) is the correct approach** -- no headless browser needed. The site has an SSL certificate issue (self-signed or expired), so HTTP requests need `rejectUnauthorized: false` or equivalent.

The site organizes jobs into 4 top-level categories (Teaching: ~395, Instructional Support: ~155, Admin: ~52, Support Services: ~85, totaling ~687 jobs). Each category uses a `?srch=` parameter (100/200/300/400). Individual job detail pages live at `/job_postings/{id}/{site}/{site}` and contain structured fields in a `<table class="jobpostingtable">` including position type, subject area, job title, location, deadline, certificate requirements, district name, city/state/zip, phone, and email. The existing database schema already has `UNIQUE(source_id, external_id)` on the `jobs` table, providing a natural upsert key.

**Primary recommendation:** Use cheerio + node-fetch (or undici) for scraping, Supabase JS client with service role key for database writes, string-similarity for school fuzzy matching, and GitHub Actions with cron schedule for daily automation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Standalone script in `scripts/scrapers/` -- not coupled to the Next.js web app
- Adapter pattern: PAREAP is the first adapter; new sources get new adapters
- Polite 1-3 second delay between page requests
- Scrape all listing pages per run, detect when pages contain only expired postings and stop early
- Store raw job titles as-is -- title cleanup/categorization deferred to Phase 6
- Extract city, state, zip from location text; store raw location text alongside structured fields
- Geocoding deferred to Phase 4
- Fuzzy-match scraped school names to existing `schools` table entries; create new for unmatched
- Extract school_type if PAREAP provides it directly or inferrable
- GitHub Actions for scheduled runs
- CLI entrypoint (`npm run scrape:pareap`) for local testing and on-demand runs
- Supabase service role key stored as GitHub Actions secret
- Partial failures: keep successfully scraped jobs, log failure, continue
- Retry failed page requests 2-3 times with backoff
- Scrape run logs stored in `scrape_logs` Supabase table (run timestamp, source, jobs added/updated/skipped, errors, duration)
- GitHub Actions failure notifications for total failures (0 jobs scraped)

### Claude's Discretion
- Headless browser vs HTTP parsing (based on PAREAP's actual rendering requirements)
- Scrape frequency (daily minimum, could be more)
- Exact retry backoff strategy
- Expired-page detection heuristic
- Scraping library choices

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | System aggregates jobs from PAREAP | PAREAP site fully analyzed: 4 categories, ~687 jobs, server-rendered HTML, pagination at 50/page, structured detail pages with fields mapping to DB schema |
| DATA-05 | System normalizes job data across sources (titles, locations, school names, school types) | PAREAP provides structured fields: position type, subject area, job title, location with city/state/zip, district name, certificate info. School type inferrable from category + district name patterns |
| DATA-10 | System runs ingestion on a scheduled basis (at least daily) | GitHub Actions cron schedule validated as approach; free tier supports daily runs with 6-hour max timeout |
| DATA-13 | Failed scrapes do not corrupt or remove existing valid job data | Upsert pattern with `onConflict` on `(source_id, external_id)` ensures existing data untouched; transaction-based writes with rollback on failure |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | 1.0.0 | HTML parsing & DOM traversal | Industry standard for static HTML scraping; jQuery-like API; no browser overhead |
| @supabase/supabase-js | 2.99.x (already installed) | Database client for upserts | Already in project; service role mode bypasses RLS |
| string-similarity | 4.0.4 | Fuzzy school name matching | Lightweight (~3KB); Dice coefficient; no dependencies; perfect for name dedup |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| undici (built-in) | Node.js built-in | HTTP requests | Node 18+ includes fetch globally; no extra dependency needed |
| dotenv | 16.x | Load .env for local development | Already likely available; needed for local CLI runs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cheerio | Playwright | PAREAP is fully server-rendered; Playwright would add ~200MB browser download + 10x slower scraping |
| string-similarity | fuse.js | Fuse.js is heavier (fuzzy search engine); we only need pairwise string comparison, not search |
| undici/fetch | axios/node-fetch | Built-in fetch works fine for simple GET requests; no extra dependency |

**Installation:**
```bash
npm install cheerio string-similarity
npm install -D @types/string-similarity
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  scrapers/
    lib/
      supabase-admin.ts      # Service role client (no cookies/SSR)
      http-client.ts          # Fetch wrapper with retry + delay
      school-matcher.ts       # Fuzzy matching against schools table
      normalizer.ts           # Location parsing, field extraction
      logger.ts               # Scrape run logging to scrape_logs table
    adapters/
      pareap/
        index.ts              # PAREAP adapter entrypoint
        parser.ts             # HTML parsing with cheerio
        types.ts              # PAREAP-specific types
    run.ts                    # CLI entrypoint (orchestrates adapters)
supabase/
  migrations/
    00002_scrape_logs.sql     # scrape_logs table migration
.github/
  workflows/
    scrape.yml                # GitHub Actions cron workflow
```

### Pattern 1: Adapter Pattern for Source Scrapers
**What:** Each data source implements a common interface (`SourceAdapter`) with `scrape()` returning normalized job records.
**When to use:** Every new source gets its own adapter.
**Example:**
```typescript
interface ScrapedJob {
  externalId: string;
  title: string;
  url: string;
  locationRaw: string;
  city?: string;
  state: string;
  zipCode?: string;
  schoolName: string;
  schoolType?: string;
  description?: string;
  subjectArea?: string;
  positionType?: string;
  certificates?: string[];
  deadline?: string;
  postedDate?: string;
}

interface ScrapeResult {
  jobs: ScrapedJob[];
  errors: ScrapeError[];
  stats: { added: number; updated: number; skipped: number; failed: number };
}

interface SourceAdapter {
  readonly sourceSlug: string;
  scrape(): Promise<ScrapedJob[]>;
}
```

### Pattern 2: Upsert with Conflict Resolution
**What:** Use Supabase upsert with `onConflict: 'source_id,external_id'` to handle both new inserts and updates idempotently.
**When to use:** Every job write operation.
**Example:**
```typescript
const { data, error } = await supabase
  .from('jobs')
  .upsert(
    jobRecords.map(job => ({
      source_id: sourceId,
      external_id: job.externalId,
      title: job.title,
      url: job.url,
      location_raw: job.locationRaw,
      city: job.city,
      state: job.state,
      zip_code: job.zipCode,
      school_id: job.schoolId,
      school_type: job.schoolType,
      description: job.description,
      is_active: true,
      last_verified_at: new Date().toISOString(),
    })),
    { onConflict: 'source_id,external_id' }
  );
```

### Pattern 3: Retry with Exponential Backoff
**What:** Wrap HTTP requests with retry logic for transient failures.
**When to use:** Every page fetch.
**Example:**
```typescript
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PAEdJobs-Bot/1.0 (+https://school-job-portal.vercel.app)' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### Anti-Patterns to Avoid
- **Coupling scraper to Next.js runtime:** The scraper must be a standalone Node.js script, not an API route or server action. It runs in GitHub Actions, not on Vercel.
- **Deleting jobs on failed scrapes:** Never remove existing active jobs during a scrape run. Only upsert or mark inactive.
- **Single transaction for all jobs:** Don't wrap the entire scrape in one transaction. Process in batches so partial success is preserved.
- **Hardcoded selectors without fallback:** PAREAP's HTML could change. Add validation that expected elements exist before parsing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Custom regex parsing | cheerio | HTML is not regular; regex will break on edge cases |
| Fuzzy string matching | Custom Levenshtein implementation | string-similarity | Well-tested algorithm, handles unicode, edge cases |
| HTTP retry logic | Ad-hoc try/catch loops | Structured retry utility function | Consistent backoff, logging, max attempts |
| Supabase admin client | Raw postgres connections | @supabase/supabase-js with service_role | Already in project; handles auth, types, connection pooling |

**Key insight:** The scraper's complexity is in orchestration and error handling, not in individual operations. Each piece (fetch, parse, match, write) is simple; the value is in robust composition.

## Common Pitfalls

### Pitfall 1: SSL Certificate Issues
**What goes wrong:** PAREAP has an SSL certificate issue (self-signed or expired chain). Standard fetch will fail with `unable to verify the first certificate`.
**Why it happens:** Many government/education sites have non-standard SSL configurations.
**How to avoid:** Set `NODE_TLS_REJECT_UNAUTHORIZED=0` in the scraper environment, OR use a custom HTTPS agent. Document this clearly and scope it only to PAREAP requests.
**Warning signs:** Fetch calls silently failing with certificate errors in CI but working locally.

### Pitfall 2: Rate Limiting / IP Blocking
**What goes wrong:** Scraping too fast gets the GitHub Actions IP blocked.
**Why it happens:** PAREAP may have rate limiting even though it's a small PHP site.
**How to avoid:** 1-3 second delay between page requests (already decided). Set a descriptive User-Agent header. Keep total request count reasonable (~30 pages total across all categories).
**Warning signs:** HTTP 429 or 403 responses, connection timeouts.

### Pitfall 3: HTML Structure Changes Breaking Parser
**What goes wrong:** PAREAP updates their site design and selectors stop matching.
**Why it happens:** Scraping is inherently fragile; the site owes us no API stability.
**How to avoid:** Add structural validation before parsing (check `#jobsrch` table exists, check expected column count). Log warnings when structure looks different. Use resilient selectors (table-based layout is relatively stable).
**Warning signs:** 0 jobs scraped from a category that previously had hundreds.

### Pitfall 4: School Name Deduplication Drift
**What goes wrong:** Same school appears multiple times with slightly different names (e.g., "Spring-Ford Area SD" vs "Spring Ford Area School District").
**Why it happens:** Different job postings from the same school use different name formats.
**How to avoid:** Normalize names before fuzzy matching (lowercase, strip "school district", "sd", common abbreviations). Use a similarity threshold (e.g., 0.8) and log near-misses for manual review.
**Warning signs:** Schools table growing faster than expected; duplicate-looking entries.

### Pitfall 5: Running TypeScript in GitHub Actions
**What goes wrong:** GitHub Actions doesn't run `.ts` files directly; `tsx` or `ts-node` needed.
**Why it happens:** Node.js doesn't natively execute TypeScript.
**How to avoid:** Use `tsx` as a dev dependency for running TypeScript scripts, or compile to JS first. Add the run command to package.json scripts.
**Warning signs:** GitHub Actions failing with "Unknown file extension .ts".

### Pitfall 6: Supabase Upsert Column Mismatch
**What goes wrong:** Upsert fails because the `onConflict` columns aren't correctly specified or the unique constraint doesn't match.
**Why it happens:** The unique constraint is `UNIQUE(source_id, external_id)` but `onConflict` parameter must exactly match column names.
**How to avoid:** Verify the constraint exists. Test upsert locally with duplicate data before deploying.
**Warning signs:** Duplicate key errors or silent data loss during upsert.

## Code Examples

### PAREAP HTML Parsing (from live site analysis)
```typescript
// Source: Direct analysis of https://www.pareap.net/jobsrch.php
import * as cheerio from 'cheerio';

interface PareapListingRow {
  externalId: string;
  positionType: string;  // "Classroom Teacher / Social Studies"
  jobTitle: string;      // "Social Studies Middle School Teacher (26-27 School Year)"
  certificate: string;   // "Middle School Social Studies 7-9"
  schoolName: string;    // "String Theory Schools"
  location: string;      // "Philadelphia, PA 19102"
  date: string;          // "Mar 10 26"
  detailUrl: string;     // "/job_postings/87845/PA01/PA01"
}

function parseListingPage(html: string): PareapListingRow[] {
  const $ = cheerio.load(html);
  const jobs: PareapListingRow[] = [];

  $('#jobsrch tbody tr.jobfirstrow').each((_, row) => {
    const $row = $(row);
    const link = $row.find('td:nth-child(2) a');
    const href = link.attr('href') || '';
    // External ID from URL: /job_postings/87845/PA01/PA01 -> "87845"
    const idMatch = href.match(/\/job_postings\/(\d+)\//);

    jobs.push({
      externalId: idMatch ? idMatch[1] : '',
      positionType: link.contents().first().text().trim(),
      jobTitle: link.find('div').text().trim(),
      certificate: $row.find('td:nth-child(2) span').text().replace('Certificate:', '').trim(),
      schoolName: $row.find('td.school').contents().first().text().trim(),
      location: $row.find('td.school').text().replace(/\s+/g, ' ').trim(),
      date: $row.find('td.dateTD').text().trim(),
      detailUrl: href,
    });
  });

  return jobs;
}
```

### PAREAP Category URLs
```typescript
// Source: Direct analysis of https://www.pareap.net/jobsrch.php
const PAREAP_CATEGORIES = [
  { name: 'Teaching', srch: '100' },
  { name: 'Instructional Support', srch: '200' },
  { name: 'School Administrative', srch: '300' },
  { name: 'Support Services', srch: '400' },
] as const;

// Listing URL: https://www.pareap.net/jobsrch.php?srch=100&position=&page=1
// Detail URL:  https://www.pareap.net/job_postings/{id}/PA01/PA01
// Pagination:  50 per page, pages via ?page=N, "Last" link shows total pages
```

### Job Detail Page Parsing
```typescript
// Source: Direct analysis of /job_postings/87845/PA01/PA01
function parseDetailPage(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};

  $('table.jobpostingtable tr').each((_, row) => {
    const label = $(row).find('td.td_label').text().trim().replace(':', '');
    const value = $(row).find('td:nth-child(2)').text().trim();
    if (label && value) {
      // Handle multiple certificates
      if (label === 'Certificate' && fields['Certificate']) {
        fields['Certificates'] = (fields['Certificates'] || fields['Certificate']) + '|' + value;
      } else {
        fields[label] = value;
      }
    }
  });

  // Parse job description
  fields['Description'] = $('div.jobdescription, #joblisting_div').find('p, div')
    .filter((_, el) => !$(el).closest('table').length)
    .text().trim();

  return fields;
  // Available fields: Position, Subject Area, Job Title, Job Location,
  // Deadline, Certificate(s), District, City/State/Zip, Telephone, Email
}
```

### Service Role Supabase Client (standalone script)
```typescript
// Source: Supabase docs - service role client
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
```

### GitHub Actions Workflow
```yaml
# Source: GitHub Actions docs + Supabase community patterns
name: Scrape PAREAP Jobs
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC (1-2 AM Eastern)
  workflow_dispatch: {}    # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      NODE_TLS_REJECT_UNAUTHORIZED: '0'  # PAREAP SSL cert issue
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run scrape:pareap
```

### scrape_logs Table Migration
```sql
-- Migration: 00002_scrape_logs.sql
CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'partial_failure', 'failure'
  jobs_added INTEGER NOT NULL DEFAULT 0,
  jobs_updated INTEGER NOT NULL DEFAULT 0,
  jobs_skipped INTEGER NOT NULL DEFAULT 0,
  jobs_failed INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scrape_logs_source_id ON scrape_logs(source_id);
CREATE INDEX idx_scrape_logs_started_at ON scrape_logs(started_at DESC);
```

### Location Parsing
```typescript
// Extract city, state, zip from PAREAP location strings
// Examples: "Philadelphia, PA 19102", "Pittsburgh, PA", "1600 Vine St. Philadelphia, PA 19102"
function parseLocation(raw: string): { city?: string; state?: string; zipCode?: string } {
  // Match patterns like "City, ST 12345" at end of string
  const match = raw.match(/([A-Za-z\s.'-]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/);
  if (!match) return {};
  return {
    city: match[1].trim(),
    state: match[2],
    zipCode: match[3] || undefined,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-fetch (npm package) | Built-in `fetch` (Node 18+) | Node 18+ (2023) | No extra HTTP dependency needed |
| puppeteer for all scraping | cheerio for static, Playwright for dynamic | 2022+ | 10x faster for static sites |
| Manual cron servers | GitHub Actions scheduled workflows | 2019+ | Free, maintained, no infrastructure |
| cheerio 0.x (jQuery-like) | cheerio 1.x (ESM, improved API) | 2024 | Better TypeScript support, ESM-first |

**Deprecated/outdated:**
- `request` npm package: Deprecated since 2020. Use built-in `fetch`.
- `node-fetch` for Node 18+: Built-in `fetch` covers all use cases.

## Open Questions

1. **PAREAP SSL Certificate Handling**
   - What we know: WebFetch fails with "unable to verify the first certificate"; Playwright (with Chromium) works fine
   - What's unclear: Whether `NODE_TLS_REJECT_UNAUTHORIZED=0` will work for built-in fetch, or if a custom HTTPS agent is needed
   - Recommendation: Set env var in GitHub Actions; test locally with both approaches. Scope the insecure setting narrowly.

2. **Expired Job Detection Heuristic**
   - What we know: User wants to stop early when pages contain only expired postings; PAREAP listings show dates and have "Deadline" fields
   - What's unclear: Exact pattern for expired vs active postings; whether PAREAP auto-removes expired listings
   - Recommendation: Check if jobs with dates older than 60-90 days dominate a page. Also check the "Deadline" field on detail pages. Start conservative (scrape all pages) and add early-stop after observing patterns.

3. **School Type Extraction**
   - What we know: PAREAP shows "District" name and categories but doesn't have an explicit "school_type" field
   - What's unclear: How reliably we can infer school_type (public/private/charter/IU) from district name patterns
   - Recommendation: Use simple keyword matching on district name ("Charter", "IU", "Intermediate Unit", etc.) and default to null when uncertain. Build a small lookup table of known PA IUs.

4. **TypeScript Execution in CI**
   - What we know: Node.js doesn't natively run .ts files; need tsx or ts-node
   - What's unclear: Whether to add tsx as dependency or pre-compile
   - Recommendation: Use `tsx` (already commonly paired with vitest ecosystem). Add to devDependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (exists, environment: node) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | PAREAP jobs scraped and stored | integration | `npx vitest run tests/scrapers/pareap.test.ts -x` | No - Wave 0 |
| DATA-05 | Location/school name normalization | unit | `npx vitest run tests/scrapers/normalizer.test.ts -x` | No - Wave 0 |
| DATA-10 | Scheduled ingestion runs | smoke | Manual: verify GitHub Actions workflow YAML is valid | N/A - manual |
| DATA-13 | Failed scrape preserves data | unit | `npx vitest run tests/scrapers/upsert-safety.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/scrapers/pareap.test.ts` -- covers DATA-01 (HTML parsing, pagination, job extraction)
- [ ] `tests/scrapers/normalizer.test.ts` -- covers DATA-05 (location parsing, school name normalization)
- [ ] `tests/scrapers/upsert-safety.test.ts` -- covers DATA-13 (upsert idempotency, error handling)
- [ ] `tests/scrapers/school-matcher.test.ts` -- covers fuzzy matching logic
- [ ] `tests/scrapers/fixtures/` -- sample HTML from PAREAP listing and detail pages
- [ ] Framework install: `npm install -D tsx` -- for running TypeScript scripts

## Sources

### Primary (HIGH confidence)
- Direct site analysis of https://www.pareap.net/jobsrch.php -- HTML structure, pagination, job data fields
- Direct site analysis of https://www.pareap.net/job_postings/87845/PA01/PA01 -- detail page structure
- Supabase official docs (upsert) -- https://supabase.com/docs/reference/javascript/upsert
- Project's existing database schema -- `supabase/migrations/00001_initial_schema.sql`
- Project's existing Supabase client setup -- `src/lib/supabase/client.ts`, `server.ts`

### Secondary (MEDIUM confidence)
- [cheerio npm page](https://www.npmjs.com/package/cheerio) -- version 1.0.0, API reference
- [Supabase service role discussion](https://github.com/orgs/supabase/discussions/1284) -- standalone client pattern
- [GitHub Actions scheduled workflows](https://www.marcveens.nl/posts/scheduled-web-scraping-made-easy-using-playwright-with-github-actions) -- cron + scraping patterns

### Tertiary (LOW confidence)
- string-similarity version/API -- verified npm exists but not tested against PAREAP school names specifically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- cheerio is clearly correct (static HTML verified); Supabase client already in project
- Architecture: HIGH -- adapter pattern decided by user; PAREAP HTML structure fully analyzed with live data
- Pitfalls: HIGH -- SSL issue confirmed firsthand; pagination structure verified; all pitfalls based on direct observation
- Validation: MEDIUM -- test file structure proposed but not yet verified against actual implementation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (PAREAP HTML structure is stable; site hasn't changed design since 2023 per meta tags)
