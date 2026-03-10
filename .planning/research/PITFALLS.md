# Pitfalls Research: PA Educator Jobs Portal

## Critical Pitfalls

### 1. Scraper Fragility — Sites Change Without Notice
**Severity: High | Likelihood: Very High**

PAREAP, Applitrack, and district sites can change their HTML structure at any time. A single CSS class rename breaks the entire parser.

**Warning signs:**
- Scrape runs return 0 jobs from a previously-working source
- Job count drops dramatically between runs
- Parse errors spike in logs

**Prevention:**
- Monitor scrape runs with success/failure counts per source
- Alert when a source returns <50% of its previous job count
- Design adapters to fail gracefully — log errors, don't corrupt DB
- Store raw HTML snapshots for debugging broken parsers
- Keep adapters simple — minimal assumptions about page structure

**Phase:** Ingestion pipeline (early — build monitoring from day one)

### 2. Terms of Service Violations
**Severity: High | Likelihood: Medium**

Scraping job boards may violate their ToS. PAREAP and Frontline/Applitrack likely prohibit automated access. Legal risk includes cease-and-desist letters.

**Warning signs:**
- IP blocks or CAPTCHAs appearing
- Cease-and-desist communication
- Rate limiting responses (429 status codes)

**Prevention:**
- Check robots.txt for each source before building adapter
- Respect rate limits — add delays between requests (2-5 seconds)
- Identify your scraper with a clear User-Agent string
- Focus on publicly accessible pages (not behind logins)
- Consider reaching out to sources proactively (PAREAP, PDE) to discuss data sharing
- Keep scraping frequency reasonable (daily or every few hours, not every minute)
- Be prepared to switch to manual curation or partnerships if a source demands it
- Republish job metadata (title, school, link) — don't copy full descriptions verbatim

**Phase:** Before building any adapters — research ToS first

### 3. Stale/Duplicate Data Pollution
**Severity: High | Likelihood: High**

The same job appears on PAREAP, PAeducator, the district website, AND Frontline. Without deduplication, users see the same job 4 times.

**Warning signs:**
- Users complain about duplicate listings
- Job count seems inflated relative to actual openings
- Same school/title appears multiple times in search results

**Prevention:**
- Deduplicate on: normalized(school_name) + normalized(title) + location proximity
- Fuzzy matching needed — "North Penn SD" vs "North Penn School District"
- Designate a "primary source" hierarchy (district site > PAREAP > aggregator)
- When duplicates found, merge metadata (take the richest data from each)
- Hash-based dedup for exact matches, fuzzy matching for near-duplicates

**Phase:** Data normalization (critical — build before going multi-source)

### 4. Salary Data is Messy or Missing
**Severity: Medium | Likelihood: Very High**

Most education job postings don't include salary, or express it inconsistently: "$45,000-$65,000", "Per district salary schedule", "Step 1: $42,500", "Competitive".

**Warning signs:**
- Salary filter returns very few results
- Salary values are wildly inconsistent (mixing hourly/annual)
- Users report incorrect salary information

**Prevention:**
- Allow "Not listed" as a valid salary state — don't force extraction
- Normalize salary type (annual, hourly, daily)
- Parse salary ranges when present, store min/max
- Use PA public salary schedules as supplementary data source
- Filter UI should handle "Include jobs without salary listed" toggle

**Phase:** Data normalization and search/filter

### 5. Geocoding Inaccuracy for PA Schools
**Severity: Medium | Likelihood: Medium**

Free geocoding services may place rural PA schools incorrectly. An error of even a few miles matters for radius search.

**Warning signs:**
- Schools appearing in wrong locations on map
- Radius search missing nearby schools or including distant ones
- Users reporting "this school isn't near me"

**Prevention:**
- Use PA school directory data (PDE publishes school addresses) as ground truth
- Geocode at ingestion time, not query time
- Cache geocoded locations — don't re-geocode known addresses
- Validate geocoded results against county/district boundaries
- Allow manual corrections via district accounts

**Phase:** Ingestion pipeline and geolocation setup

### 6. Copyright on Job Descriptions
**Severity: Medium | Likelihood: Medium**

Job descriptions are copyrightable. Republishing them verbatim from PAREAP or district sites could invite legal issues.

**Warning signs:**
- Cease-and-desist specifically citing description copying
- Source sites adding "do not reproduce" notices

**Prevention:**
- Display job metadata (title, school, salary, location) on your site
- Link to the original posting for full description
- Show a brief excerpt/summary, not the full description
- If showing descriptions, clearly attribute the source
- Consider AI-generated summaries as an alternative to copying

**Phase:** Job detail page design

### 7. Building Too Much Before Validating Demand
**Severity: Medium | Likelihood: Medium**

Side project risk: spending months building all 6+ source adapters, AI freshness validation, district portals — before anyone uses the site.

**Warning signs:**
- Months of development with no public site
- Building features nobody asked for
- Perfectionism on data coverage before launch

**Prevention:**
- Launch with 1-2 sources (PAREAP + one other) — validate the concept
- Get the search/filter UX right before expanding sources
- Share with PA educator communities early for feedback
- Track: are people actually using the filters? Which ones?
- District accounts can wait until a district actually reaches out

**Phase:** All phases — resist scope creep throughout

### 8. Ignoring Mobile Experience
**Severity: Medium | Likelihood: Low (if using Tailwind)**

Teachers browse job listings on their phones. A desktop-only experience loses a significant portion of users.

**Warning signs:**
- Analytics showing high mobile bounce rate
- Filter sidebar unusable on small screens

**Prevention:**
- Mobile-first responsive design from day one
- Filter panel: collapsible sheet/drawer on mobile
- Test on actual phone sizes throughout development
- Tailwind + shadcn/ui handles most responsive patterns

**Phase:** UI/frontend

### 9. Overcomplicating the Ingestion Schedule
**Severity: Low | Likelihood: Medium**

Running scrapers too frequently wastes resources, risks IP blocks, and adds complexity. Running too infrequently means stale data.

**Warning signs:**
- High hosting costs from frequent scraping
- Source sites blocking your IP
- Jobs appearing hours/days after posting

**Prevention:**
- Start with daily scraping for each source
- Monitor actual posting velocity per source — adjust frequency accordingly
- PAREAP likely updates daily; individual district sites may update weekly
- Freshness validator runs separately, less often (weekly)

**Phase:** Ingestion pipeline scheduling

---
*Researched: 2026-03-10*
