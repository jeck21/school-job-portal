# Features Research: PA Educator Jobs Portal

## Competitive Landscape

### Existing PA Educator Job Sources

| Source | Coverage | UX Quality | Filtering | Data Freshness | API Access |
|--------|----------|------------|-----------|----------------|------------|
| PAREAP | Broad but incomplete | Poor | Basic (subject, region) | Stale postings common | None found |
| PAeducator.net | 200+ districts/IUs | Moderate | Basic | Moderate | None found |
| TeachingJobsInPA.com | ~507 public school jobs | Moderate | By subject/category | Unknown | None found |
| Teach in PA (PDE) | State-run, broad | Good (relaunched 2025) | By location | Good | None found |
| PAIU Jobs | 29 IUs centralized | Poor | By IU type | Moderate | None found |
| Frontline/Applitrack | Many PA districts | Good per-district | Per-district only | Good | No public API |
| K12JobSpot | National | Good | Location, category, date | Good | None found |
| SchoolSpring | National, 500K+ jobs | Good | Multiple filters | Good | None found |
| Indeed/LinkedIn | National | Excellent | Comprehensive | Variable | Limited APIs |

**Key gap in market:** No single platform aggregates ALL PA educator jobs with modern filtering (radius, salary, cert type, school type, grade band) and actively removes stale postings.

## Feature Categories

### Table Stakes (must have or users leave)

| Feature | Complexity | Dependencies | Notes |
|---------|------------|-------------|-------|
| Job listing search | Medium | Database, ingestion pipeline | Core functionality |
| Filter by location/radius | Medium | PostGIS, geocoding | #1 differentiator vs PAREAP |
| Filter by school type | Low | Data normalization | Public, private, charter, IU, PATTAN, PDE |
| Filter by grade band | Low | Data normalization | PreK, Elementary, Middle, High |
| Filter by subject/position | Low | Data normalization | Standard education categories |
| Job detail page | Low | Database | Title, school, description, salary, link to apply |
| Mobile-responsive design | Medium | Frontend | Many teachers browse on phones |
| Fast page loads | Medium | SSR, caching | Users abandon slow sites |
| Direct link to apply | Low | Source URL tracking | Link to original posting |
| Clear posting dates | Low | Data model | When posted, when scraped |

### Differentiators (competitive advantage)

| Feature | Complexity | Dependencies | Notes |
|---------|------------|-------------|-------|
| Filter by salary range | Medium | Data extraction/normalization | Many postings don't include salary — show "Not listed" |
| Filter by certification required | Medium | Data extraction, PA cert taxonomy | Parse from job descriptions |
| Verified status badge | Medium | District accounts | Builds trust, differentiates from competitors |
| AI-powered freshness validation | High | AI API, URL checker | Auto-remove dead/expired listings |
| Stale posting detection | Medium | Scheduled checks | Check if URLs still resolve, if jobs still accepting apps |
| Aggregation across ALL PA sources | High | Multiple scrapers | No competitor does this comprehensively |
| School/district profiles | Medium | District accounts | Central hub for a district's open positions |
| Career coaching request form | Low | Email integration | Simple contact form — early revenue |
| Clean, modern UI | Medium | Design effort | PAREAP's biggest weakness |
| Job alerts (email) | Medium | Email service, saved searches | Users want to be notified of new matches |

### Anti-Features (deliberately NOT building)

| Feature | Reason | Risk if Built |
|---------|--------|---------------|
| User-created job postings (v1) | Jobs come from authoritative sources; user posts = spam risk | Data quality degrades |
| Resume builder | Scope creep; many free tools exist | Months of work, low differentiation |
| In-app messaging (v1) | Requires user accounts; premature for v1 | Complex, expensive infrastructure |
| Salary negotiation tools | Tangential to core value | Feature bloat |
| Social features (likes, comments) | This is a job board, not social media | Distraction from core |
| Auto-apply | Legal/ethical concerns; districts want intentional applicants | Reputation risk |
| National job coverage (v1) | Depth > breadth; PA expertise is the differentiator | Diluted value proposition |

## Feature Dependencies

```
Ingestion Pipeline
  └── Data Normalization
       ├── Search & Filtering (all filters depend on normalized data)
       ├── Job Detail Pages
       └── Deduplication

District Accounts (Auth)
  ├── Verified Badge
  ├── Claim/Update Listings
  └── District Profile Pages

AI Freshness Validation
  ├── URL Health Checker
  └── Content Analysis (is job still active?)

Career Coaching Form → Email delivery (standalone)
```

## Competitor Feature Matrix (what users expect)

Based on SchoolSpring, EDJOIN, K12JobSpot:

- **Expected:** Search, filter by location/subject, job details, apply link
- **Nice to have:** Job alerts, saved searches, profile/resume
- **Differentiating for us:** PA-specific depth, radius search, salary filter, freshness validation, verified status

---
*Researched: 2026-03-10*
