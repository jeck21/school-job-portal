# Phase 6: Data Enrichment - Research

**Researched:** 2026-03-11
**Domain:** Job data enrichment (salary detection, cert extraction, freshness validation, AI content analysis)
**Confidence:** HIGH

## Summary

Phase 6 adds four enrichment capabilities to the existing scraper pipeline: salary detection via regex, certification extraction from job descriptions, URL health checking for stale postings, and AI-based content analysis for ambiguous cases. The salary and cert enrichment hooks directly into `processBatch()` in `ingest-pipeline.ts` during ingestion. Freshness validation is a separate script running as a weekly GitHub Actions cron job that performs HTTP HEAD checks followed by full-page content analysis, with Claude Haiku API calls for ambiguous cases.

The existing codebase is well-structured for these additions. The `jobs` table already has `salary_mentioned`, `salary_raw`, `certifications`, and `is_active` columns. The `search_jobs` RPC already filters on these fields. No database schema changes are needed. The PAeducator adapter already extracts structured certifications from its API -- the new cert extraction only parses descriptions when no structured data exists.

The only new dependency is `@anthropic-ai/sdk` for Claude Haiku API calls in the freshness checker. All other functionality uses native regex/string matching with zero external dependencies.

**Primary recommendation:** Implement salary detection and cert extraction as pure functions called inline during `processBatch()`, and build the freshness checker as a standalone script with its own GitHub Actions workflow and scrape_logs-style logging.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Salary detection: match **any dollar amount** in posting text; vague terms do NOT count
- Store matched salary snippet in `salary_raw`, set `salary_mentioned = true`
- Run salary/cert detection **inline during ingestion** (not as separate pass)
- No backfill script -- delete all data and re-scrape after code is complete
- Certification extraction uses **PDE official certification areas** as taxonomy
- **Structured certs from adapters take priority** -- only parse descriptions when no structured cert data
- Freshness: two-step process (HEAD check first, then full page fetch for survivors)
- Check ALL active jobs, no day-based staleness threshold
- **Weekly schedule** via GitHub Actions cron
- **Soft-delete only** (`is_active = false`), never hard-delete
- Log freshness results to DB reusing scrape_logs pattern
- AI: hybrid approach -- keyword/regex heuristics first, Claude Haiku for ambiguous cases
- When Haiku is called, also extract salary/cert data if missing
- Model: Claude Haiku (~$0.001/job)
- Cap at 100 AI calls per freshness run (temporary, may be removed later)

### Claude's Discretion
- Specific salary regex patterns and edge case handling
- PDE cert taxonomy granularity (after research)
- Heuristic keyword list for closed posting detection
- Haiku prompt design for classification + extraction
- Freshness check concurrency and polite delay between requests
- GitHub Actions cron day/time for weekly freshness run

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-08 | System detects whether a posting mentions salary info (boolean flag) | Salary regex patterns documented below; hooks into processBatch() before upsert |
| DATA-09 | System extracts certification requirements from posting text when available | PDE cert taxonomy compiled; regex matcher with adapter-priority fallback |
| DATA-11 | System validates job freshness via URL health checks and AI content analysis | Two-step HEAD+content checker with heuristic+Haiku hybrid approach |
| DATA-12 | System auto-removes jobs with dead URLs or that are no longer accepting applications | Soft-delete via `is_active = false`; weekly cron; freshness logging |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | latest | Claude Haiku API calls for ambiguous freshness checks | Official Anthropic TypeScript SDK; direct API access |
| Native `fetch` | built-in | HTTP HEAD checks and page fetching for freshness validation | Already used throughout the scraper codebase |
| TypeScript regex | built-in | Salary detection and cert extraction | Zero-dependency, testable pure functions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cheerio` | ^1.2.0 | Parse HTML from fetched pages during freshness content analysis | Already a project dependency; extract text from HTML pages |
| `tsx` | ^4.21.0 | Run freshness checker script | Already used for all scraper scripts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @anthropic-ai/sdk | Vercel AI SDK (@ai-sdk/anthropic) | AI SDK adds abstraction layer; direct SDK is simpler for single-provider use |
| cheerio for content extraction | regex on raw HTML | cheerio is already in deps and handles malformed HTML properly |

**Installation:**
```bash
npm install @anthropic-ai/sdk
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/scrapers/
  lib/
    enrichment/
      salary-detector.ts    # Pure function: text -> { mentioned: boolean, raw: string | null }
      cert-extractor.ts     # Pure function: text -> string[] (PDE cert areas found)
      pde-cert-taxonomy.ts  # Static array of PDE certification area names + aliases
    ingest-pipeline.ts      # Modified: calls enrichment before upsert
  freshness/
    check-freshness.ts      # Main script: HEAD check -> content analysis -> AI fallback
    heuristics.ts           # Keyword/regex patterns for closed posting detection
    ai-analyzer.ts          # Claude Haiku integration for ambiguous cases
    run.ts                  # CLI entrypoint (like scrapers/run.ts)
.github/workflows/
  freshness.yml             # Weekly cron workflow
```

### Pattern 1: Pure Enrichment Functions
**What:** Salary detection and cert extraction as pure, testable functions with no side effects
**When to use:** During ingestion pipeline processing
**Example:**
```typescript
// scripts/scrapers/lib/enrichment/salary-detector.ts
interface SalaryResult {
  mentioned: boolean;
  raw: string | null;
}

/**
 * Detect dollar amounts in job posting text.
 * Matches: $45,000  $25/hr  $50k-$70k  $45,000-$65,000
 * Does NOT match: "competitive salary", "commensurate with experience"
 */
export function detectSalary(text: string | undefined | null): SalaryResult {
  if (!text) return { mentioned: false, raw: null };

  // Match dollar amounts: $N, $N,NNN, $Nk, $N/hr, $N-$N ranges
  const pattern = /\$\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?\s*(?:[-–—\/]\s*(?:hr|hour|year|yr|annual|month|mo|wk|week|day|per\s+\w+))?\s*(?:[-–—to]+\s*\$\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?)?/g;

  const matches = text.match(pattern);
  if (!matches || matches.length === 0) {
    return { mentioned: false, raw: null };
  }

  // Return the first (or most complete) match as salary_raw
  return { mentioned: true, raw: matches[0].trim() };
}
```

### Pattern 2: Adapter-Priority Cert Extraction
**What:** Only parse descriptions for certs when the adapter did not provide structured cert data
**When to use:** In processBatch() during ingestion
**Example:**
```typescript
// In processBatch() before building jobRecord:
const enrichedCerts = job.certificates && job.certificates.length > 0
  ? job.certificates  // Adapter already provided structured certs
  : extractCertifications(job.description);  // Parse from description

const salaryResult = detectSalary(job.description);

const jobRecord = {
  ...existingFields,
  certifications: enrichedCerts.length > 0 ? enrichedCerts : null,
  salary_mentioned: salaryResult.mentioned,
  salary_raw: salaryResult.raw,
};
```

### Pattern 3: Two-Step Freshness Validation
**What:** Fast HEAD check eliminates dead URLs before expensive content analysis
**When to use:** Weekly freshness cron job
**Example:**
```typescript
// Step 1: HEAD check (fast, cheap)
async function checkUrlHealth(url: string): Promise<'alive' | 'dead' | 'error'> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    if (response.status === 404 || response.status === 410) return 'dead';
    if (response.ok || response.status === 301 || response.status === 302) return 'alive';
    return 'error'; // 5xx etc -- don't deactivate, could be transient
  } catch {
    return 'dead'; // timeout or network error
  }
}

// Step 2: Content analysis (only for 'alive' URLs)
async function analyzeContent(url: string, jobId: string): Promise<'active' | 'closed' | 'ambiguous'> {
  const html = await fetchWithRetry(url);
  const text = cheerio.load(html).text();

  // Try heuristics first
  const heuristicResult = checkClosedHeuristics(text);
  if (heuristicResult !== 'ambiguous') return heuristicResult;

  // Fall back to AI for ambiguous cases (if under cap)
  return 'ambiguous'; // caller decides whether to use AI
}
```

### Pattern 4: Freshness Logging (Reuse scrape_logs Pattern)
**What:** Log freshness run results to scrape_logs table using existing logger
**When to use:** Each weekly freshness run creates a log entry
**Example:**
```typescript
// Create a "freshness-checker" source record, then use existing logger
const logId = await createScrapeLog(supabase, freshnessSourceId);
// ... run checks ...
await updateScrapeLog(supabase, logId, {
  status: 'success',
  jobs_added: 0,  // not applicable for freshness
  jobs_updated: stats.stillActive,
  jobs_skipped: 0,
  jobs_failed: stats.deactivatedBrokenUrl + stats.deactivatedClosed,
  errors: [],
  duration_ms: elapsed,
});
```

**Note:** The `metadata` JSONB column on scrape_logs is ideal for storing freshness-specific stats (e.g., `{ broken_url: 15, content_closed: 8, ai_calls: 42, still_active: 235 }`).

### Anti-Patterns to Avoid
- **Modifying adapter interfaces for enrichment:** Salary/cert detection belongs in the shared pipeline, not in individual adapters. Adapters produce raw data; the pipeline enriches it.
- **Hard-deleting jobs during freshness checks:** Always soft-delete. Jobs may come back or be needed for analytics.
- **Making AI calls for every job during freshness:** The HEAD check + heuristic layers should handle 90%+ of cases. AI is only for truly ambiguous content.
- **Running freshness checks with high concurrency:** Respect the same polite delay patterns used by scrapers. Many job sites will rate-limit or block aggressive crawlers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML text extraction | Custom regex HTML stripping | `cheerio` `.text()` | Already in deps; handles malformed HTML, entities, nested tags |
| AI content classification | Custom HTTP calls to Anthropic API | `@anthropic-ai/sdk` | Handles auth, retries, streaming, types out of the box |
| Salary regex from scratch | Trial-and-error patterns | Well-tested patterns below | Dollar amounts have many edge cases (ranges, hourly/annual, k suffix) |

**Key insight:** The enrichment logic itself is simple (regex + string matching). The complexity is in the integration points and the freshness workflow orchestration.

## Common Pitfalls

### Pitfall 1: Salary Regex False Positives
**What goes wrong:** Matching dollar amounts that are not salary (e.g., "$50 application fee", "$25 background check cost")
**Why it happens:** Dollar amounts appear in non-salary contexts within job postings
**How to avoid:** Accept this as a known limitation. The field is `salary_mentioned` (boolean), not `salary_extracted` (parsed value). Any dollar amount in a job posting is a useful signal for job seekers. The `salary_raw` field lets users see the actual text and judge for themselves.
**Warning signs:** Unusually high salary_mentioned rates (>80%) may indicate false positives from non-salary dollar amounts

### Pitfall 2: HEAD Request Behavior Varies Wildly
**What goes wrong:** Some servers don't support HEAD, return different status codes than GET, or always return 200 even for dead pages
**Why it happens:** Not all web servers implement HEAD correctly; some return soft 404s (200 with "page not found" content)
**How to avoid:** Treat HEAD as a fast filter only. If HEAD returns 404/410, the URL is dead. If HEAD returns 200/3xx, the URL needs content verification (step 2). Never trust HEAD alone for "alive" status.
**Warning signs:** If HEAD passes but content analysis shows "closed" for most jobs, HEAD is unreliable for that source

### Pitfall 3: Rate Limiting During Freshness Checks
**What goes wrong:** Checking hundreds of URLs from the same domain triggers rate limiting or IP bans
**Why it happens:** Freshness checks hit the same domains (PAREAP, PAeducator, etc.) many times in quick succession
**How to avoid:** Group jobs by domain, add polite delays (1-2s between requests to same domain), use concurrency limits (e.g., 3-5 concurrent requests max). Consider different delays per domain.
**Warning signs:** Increasing 429/503 responses, decreasing success rates over time

### Pitfall 4: Anthropic API Key Management in GitHub Actions
**What goes wrong:** AI calls fail because the API key isn't configured as a GitHub secret
**Why it happens:** New dependency requires a new secret that wasn't in the original scraper workflow
**How to avoid:** Add `ANTHROPIC_API_KEY` to GitHub repository secrets. Make the AI analysis gracefully degrade -- if no API key, skip AI calls and leave ambiguous cases as-is.
**Warning signs:** Freshness checks passing but with 0 AI calls when ambiguous cases exist

### Pitfall 5: Cert Extraction Matching Too Broadly
**What goes wrong:** Matching common words that happen to be cert area names (e.g., "Science" in "Computer Science program")
**Why it happens:** Short cert area names appear in many non-certification contexts
**How to avoid:** Use phrase boundaries. Match "Special Education" not just "Education". Prefer matching the certification pattern ("certification in X", "X certification required", "must hold X certificate") rather than bare subject names. When matching bare names, require them to be in a certification context.
**Warning signs:** Jobs with 5+ certifications extracted are likely false positives

## Code Examples

### Salary Detection (Comprehensive Regex)
```typescript
// scripts/scrapers/lib/enrichment/salary-detector.ts

interface SalaryResult {
  mentioned: boolean;
  raw: string | null;
}

// Matches dollar amounts in various formats:
// $45,000  |  $25/hr  |  $50k  |  $45,000 - $65,000  |  $25.50/hour
// $50K-$70K  |  $45,000-65,000  |  $80,000/year
const SALARY_PATTERN = /\$\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?\s*(?:\/\s*(?:hr|hour|year|yr|annual|month|mo|wk|week|day))?\s*(?:[-–—]\s*\$?\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?(?:\s*\/\s*(?:hr|hour|year|yr|annual|month|mo|wk|week|day))?)?/g;

export function detectSalary(text: string | undefined | null): SalaryResult {
  if (!text) return { mentioned: false, raw: null };

  const matches = text.match(SALARY_PATTERN);
  if (!matches || matches.length === 0) {
    return { mentioned: false, raw: null };
  }

  // Take the longest match (most likely to be a complete salary range)
  const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
  return { mentioned: true, raw: best.trim() };
}
```

### PDE Certification Taxonomy
```typescript
// scripts/scrapers/lib/enrichment/pde-cert-taxonomy.ts

/**
 * Official PDE certification areas for Pennsylvania educators.
 * Source: https://www.pa.gov/agencies/education/programs-and-services/educators/certification/
 *
 * Each entry has a canonical name and optional aliases/variants found in job postings.
 */
export interface CertArea {
  name: string;       // Canonical PDE name
  aliases: string[];  // Common variations in job postings
}

export const PDE_CERT_AREAS: CertArea[] = [
  // Core Academic
  { name: "Mathematics", aliases: ["Math", "Mathematics 7-12"] },
  { name: "English", aliases: ["English/Language Arts", "ELA", "English 7-12"] },
  { name: "Biology", aliases: ["Biology 7-12"] },
  { name: "Chemistry", aliases: ["Chemistry 7-12"] },
  { name: "Physics", aliases: ["Physics 7-12"] },
  { name: "General Science", aliases: ["Science 7-12"] },
  { name: "Earth and Space Science", aliases: ["Earth Science"] },
  { name: "Social Studies", aliases: ["Social Studies 7-12"] },

  // World Languages
  { name: "Spanish", aliases: ["Spanish K-12", "Spanish 7-12"] },
  { name: "French", aliases: ["French K-12", "French 7-12"] },
  { name: "German", aliases: ["German K-12"] },
  { name: "Chinese", aliases: ["Mandarin", "Chinese K-12"] },
  { name: "Latin", aliases: [] },
  { name: "American Sign Language", aliases: ["ASL"] },

  // Special Education
  { name: "Special Education PK-8", aliases: ["Special Education", "SpEd PK-8"] },
  { name: "Special Education 7-12", aliases: ["SpEd 7-12", "Special Ed 7-12"] },
  { name: "Special Education Supervisor", aliases: [] },

  // Elementary & Early Childhood
  { name: "Elementary Education K-6", aliases: ["Elementary Education", "Elementary K-6", "Elementary Ed"] },
  { name: "Early Childhood Education PK-4", aliases: ["Early Childhood", "PreK-4", "PK-4", "ECE"] },
  { name: "Middle Level Education 4-8", aliases: ["Middle Level", "Middle School 4-8", "Grades 4-8"] },

  // Arts
  { name: "Art Education", aliases: ["Art K-12", "Visual Arts"] },
  { name: "Music Education", aliases: ["Music K-12", "Music"] },
  { name: "Theatre", aliases: ["Theater", "Drama"] },
  { name: "Dance", aliases: [] },

  // CTE & Technical
  { name: "Technology Education", aliases: ["Technology Ed", "Tech Ed"] },
  { name: "Business, Computer, Information Technology", aliases: ["BCIT", "Business Education", "Computer Science"] },
  { name: "Career and Technical Education", aliases: ["CTE", "Vocational Education"] },
  { name: "Agriculture", aliases: ["Agriculture Education", "Ag Education"] },
  { name: "Family and Consumer Science", aliases: ["FCS", "Family Consumer Science", "Home Economics"] },

  // Health & PE
  { name: "Health and Physical Education", aliases: ["Health & PE", "Physical Education", "PE", "HPE"] },
  { name: "Health Education", aliases: [] },

  // Specialized
  { name: "Reading Specialist", aliases: ["Reading", "Literacy Specialist", "Literacy Coach"] },
  { name: "Library Science", aliases: ["School Librarian", "Library Media"] },
  { name: "Environmental Education", aliases: [] },
  { name: "Citizenship Education", aliases: ["Civics"] },

  // Support Services
  { name: "School Counselor", aliases: ["Guidance Counselor", "Elementary School Counselor", "Secondary School Counselor"] },
  { name: "School Nurse", aliases: ["Certified School Nurse", "CSN"] },
  { name: "School Psychologist", aliases: [] },
  { name: "School Social Worker", aliases: [] },
  { name: "Speech-Language Pathologist", aliases: ["SLP", "Speech Therapist", "Speech Language"] },

  // Administrative
  { name: "Principal", aliases: ["Building Principal", "Assistant Principal", "Vice Principal"] },
  { name: "Superintendent", aliases: ["Assistant Superintendent"] },
  { name: "Supervisor", aliases: ["Curriculum Supervisor", "Instructional Supervisor"] },

  // Endorsements
  { name: "ESL Program Specialist", aliases: ["ESL", "English as a Second Language", "ELL", "ESOL"] },
  { name: "Gifted Education", aliases: ["Gifted", "Talented and Gifted", "TAG"] },
  { name: "Autism", aliases: ["Autism Endorsement", "ASD"] },
  { name: "Instructional Coach", aliases: ["Instructional Coaching"] },
];
```

### Cert Extraction from Descriptions
```typescript
// scripts/scrapers/lib/enrichment/cert-extractor.ts
import { PDE_CERT_AREAS, type CertArea } from "./pde-cert-taxonomy";

/**
 * Extract PDE certification areas mentioned in job posting text.
 * Uses context-aware matching: prefers matches near certification keywords,
 * but also matches standalone cert area names for longer/specific terms.
 */
export function extractCertifications(text: string | undefined | null): string[] {
  if (!text) return [];

  const found = new Set<string>();
  const textLower = text.toLowerCase();

  for (const cert of PDE_CERT_AREAS) {
    const names = [cert.name, ...cert.aliases];
    for (const name of names) {
      if (name.length < 4) continue; // Skip very short names (PE, ASL matched via aliases)

      // Case-insensitive word boundary match
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');

      if (regex.test(text)) {
        found.add(cert.name); // Always store canonical name
        break; // Don't match multiple aliases for same cert
      }
    }
  }

  return Array.from(found);
}
```

### Freshness Heuristics
```typescript
// scripts/scrapers/freshness/heuristics.ts

/** Phrases that strongly indicate a posting is closed/filled */
const CLOSED_PATTERNS = [
  /position\s+(?:has\s+been\s+)?filled/i,
  /no\s+longer\s+accept(?:ing)?\s+applications/i,
  /posting\s+(?:has\s+been\s+)?closed/i,
  /this\s+(?:job|position)\s+(?:has\s+)?expired/i,
  /application\s+deadline\s+has\s+passed/i,
  /job\s+(?:has\s+been\s+)?removed/i,
  /this\s+listing\s+is\s+no\s+longer\s+available/i,
  /vacancy\s+(?:has\s+been\s+)?filled/i,
  /recruitment\s+(?:is\s+)?closed/i,
  /we\s+are\s+no\s+longer\s+hiring/i,
  /position\s+(?:is\s+)?unavailable/i,
  /job\s+posting\s+has\s+(?:been\s+)?archived/i,
];

/** Phrases that strongly indicate a posting is still active */
const ACTIVE_PATTERNS = [
  /apply\s+now/i,
  /submit\s+(?:your\s+)?application/i,
  /accepting\s+applications/i,
  /how\s+to\s+apply/i,
  /application\s+deadline\s*:\s*\d/i,
];

export function checkClosedHeuristics(
  text: string
): 'active' | 'closed' | 'ambiguous' {
  for (const pattern of CLOSED_PATTERNS) {
    if (pattern.test(text)) return 'closed';
  }

  for (const pattern of ACTIVE_PATTERNS) {
    if (pattern.test(text)) return 'active';
  }

  return 'ambiguous';
}
```

### Claude Haiku AI Analyzer
```typescript
// scripts/scrapers/freshness/ai-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

interface AIAnalysisResult {
  status: 'active' | 'closed';
  confidence: number;
  salary_raw?: string;
  certifications?: string[];
}

export async function analyzeWithHaiku(
  pageText: string,
  jobTitle: string
): Promise<AIAnalysisResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Analyze this job posting page for "${jobTitle}". Respond with JSON only.

1. Is this job posting still accepting applications? (active/closed)
2. If you see a salary amount (e.g., $45,000, $25/hr), extract it.
3. List any PA teaching certifications mentioned.

Page content (truncated):
${pageText.slice(0, 3000)}

Respond ONLY with JSON: {"status": "active"|"closed", "confidence": 0.0-1.0, "salary_raw": "string|null", "certifications": ["string"]}`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return JSON.parse(content.text);
}
```

### Integration into processBatch()
```typescript
// In ingest-pipeline.ts processBatch(), before building jobRecord:

import { detectSalary } from './enrichment/salary-detector';
import { extractCertifications } from './enrichment/cert-extractor';

// ... inside the for loop, after dedup check ...

// Enrichment: salary detection
const salaryResult = detectSalary(job.description);

// Enrichment: cert extraction (adapter certs take priority)
const enrichedCerts = job.certificates && job.certificates.length > 0
  ? job.certificates
  : extractCertifications(job.description);

const jobRecord = {
  source_id: sourceId,
  external_id: job.externalId,
  // ... existing fields ...
  certifications: enrichedCerts.length > 0 ? enrichedCerts : null,
  salary_mentioned: salaryResult.mentioned,
  salary_raw: salaryResult.raw,
  is_active: true,
  last_verified_at: new Date().toISOString(),
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Claude 3 Haiku | Claude Haiku 4.5 (`claude-haiku-4-5`) | Oct 2025 | Claude 3 Haiku retiring April 2026; use Haiku 4.5 |
| `@anthropic-ai/sdk` older versions | Current SDK with TypeScript types | Ongoing | SDK handles auth, retries, streaming natively |
| Manual HTTP to Anthropic API | `@anthropic-ai/sdk` messages.create() | N/A | SDK is strongly typed, handles errors properly |

**Deprecated/outdated:**
- `claude-3-haiku-20240307`: Retiring April 19, 2026. Use `claude-haiku-4-5` instead.
- Pricing: Haiku 4.5 is $1/M input, $5/M output tokens. At ~500 tokens per job analysis, 100 calls/run = ~$0.05/run.

## Open Questions

1. **Freshness check on PAREAP URLs with SSL issues**
   - What we know: PAREAP requires `NODE_TLS_REJECT_UNAUTHORIZED=0` for scraping
   - What's unclear: Will HEAD/GET requests in the freshness checker also need this?
   - Recommendation: Apply the same TLS override for PAREAP domain URLs in the freshness checker

2. **Cert extraction accuracy without training data**
   - What we know: The PDE taxonomy is comprehensive, but matching against free text is inherently fuzzy
   - What's unclear: What false positive rate will we see in practice?
   - Recommendation: Start with strict matching (require word boundaries, skip short names without context), observe results after re-scrape, tune later

3. **Freshness check behavior for PAeducator API-sourced URLs**
   - What we know: PAeducator jobs may have employer direct URLs (not PAeducator pages)
   - What's unclear: Whether employer sites return meaningful content for freshness analysis
   - Recommendation: Check the `job_sources.external_url` (PAeducator link) as a fallback if employer URL is ambiguous

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-08 | Salary detection regex matches dollar amounts, rejects vague terms | unit | `npx vitest run tests/enrichment/salary-detector.test.ts -x` | No -- Wave 0 |
| DATA-09 | Cert extraction finds PDE cert areas in text, respects adapter priority | unit | `npx vitest run tests/enrichment/cert-extractor.test.ts -x` | No -- Wave 0 |
| DATA-11 | URL health check identifies dead links; heuristics detect closed postings | unit | `npx vitest run tests/freshness/heuristics.test.ts -x` | No -- Wave 0 |
| DATA-12 | Freshness checker soft-deletes dead/closed jobs, logs results | integration | `npx vitest run tests/freshness/check-freshness.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/enrichment/salary-detector.test.ts` -- covers DATA-08
- [ ] `tests/enrichment/cert-extractor.test.ts` -- covers DATA-09
- [ ] `tests/freshness/heuristics.test.ts` -- covers DATA-11
- [ ] `tests/freshness/check-freshness.test.ts` -- covers DATA-12

## Sources

### Primary (HIGH confidence)
- Existing codebase: `ingest-pipeline.ts`, `types.ts`, `logger.ts`, `search_jobs` RPC, `00001_initial_schema.sql`
- [PDE Certification Page](https://www.pa.gov/agencies/education/programs-and-services/educators/certification/new-educators/approved-certification-programs) -- official list of PA certification areas
- [Anthropic Claude Haiku 4.5](https://www.anthropic.com/claude/haiku) -- model capabilities and pricing
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) -- API usage patterns

### Secondary (MEDIUM confidence)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing) -- $1/M input, $5/M output for Haiku 4.5
- Model identifier `claude-haiku-4-5` confirmed across multiple sources

### Tertiary (LOW confidence)
- Salary regex patterns -- adapted from common community patterns; needs testing against real job posting data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only one new dependency (@anthropic-ai/sdk), everything else already in project
- Architecture: HIGH -- follows established patterns (adapter pattern, processBatch, scrape_logs)
- Pitfalls: MEDIUM -- freshness checking against diverse external sites has inherent unpredictability
- PDE cert taxonomy: MEDIUM -- compiled from official PDE page but may need refinement against real posting data

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain; cert taxonomy and model pricing may shift)
