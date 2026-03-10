# Research Summary: PA Educator Jobs Portal

## Key Findings

### Stack
**Next.js 15 + Supabase (PostgreSQL/PostGIS) + Vercel**

A modern, lean stack that can run on free tiers at launch and scale affordably. PostGIS provides geolocation radius search natively. Supabase handles auth (district accounts), database, and storage. Drizzle ORM for type-safe database access. Tailwind + shadcn/ui for polished UI without custom design work.

**Estimated launch cost: $0/mo** (free tiers). At scale: ~$25-50/mo.

### PA Job Sources Identified

| Source | Type | Estimated Coverage | Scraping Difficulty |
|--------|------|-------------------|-------------------|
| PAREAP | Primary PA ed job board | Broad but incomplete | Medium (HTML scraping) |
| PAeducator.net | Clearinghouse, 200+ districts | Moderate | Medium |
| Teach in PA / PDE | State-run, relaunched 2025 | Growing | Medium |
| PAIU Jobs (paiu.org) | 29 IUs aggregated | IU-specific jobs | Low-Medium |
| Frontline/Applitrack | Many PA districts | High (district-level) | Medium-High (per-district) |
| TeachingJobsInPA.com | ~500 public school jobs | Moderate | Low-Medium |
| Individual district sites | Varies | Fills gaps | High (many formats) |

**No public APIs found for any source.** All will require HTML scraping/crawling.

### Table Stakes Features
- Job search with filters (location, subject, grade band, school type)
- Mobile-responsive, clean UI
- Direct link to apply at original source
- Clear posting dates and freshness indicators

### Key Differentiators vs Competition
1. **Radius search** — no PA-specific competitor offers this
2. **Salary filtering** — rarely available on educator job boards
3. **Certification-based filtering** — PA cert types as a filter
4. **Verified status** — district-claimed listings with badge
5. **Active freshness validation** — AI-powered stale posting removal
6. **Comprehensive PA aggregation** — one place for ALL PA educator jobs

### Critical Risks

1. **ToS/legal:** No source has a public API; all require scraping. Must check robots.txt, respect rate limits, and focus on metadata rather than copying full descriptions.
2. **Scraper fragility:** HTML-based scrapers will break when sites change. Need monitoring, alerting, and graceful failure handling from day one.
3. **Deduplication:** Same job appears across multiple sources. Need fuzzy matching to avoid showing duplicates.
4. **Salary data gaps:** Most education postings don't include salary. The filter must handle "not listed" gracefully.
5. **Scope creep:** Resist building everything before launch. Start with 1-2 sources, validate demand.

### Architecture Recommendation

Separate the ingestion pipeline from the web app — they share only the database. Use an adapter pattern for sources (new source = new adapter, no core changes). This makes the system expandable to other states and resilient to individual source failures.

### Build Order Recommendation

1. Foundation (Next.js, Supabase, schema, UI shell)
2. First source adapter (PAREAP) + normalizer + end-to-end pipeline
3. Search & filter UI (location radius, school type, grade band)
4. Additional source adapters (PAeducator, PDE, Frontline)
5. Advanced data features (salary extraction, cert parsing, dedup)
6. District accounts (auth, claim, verify)
7. Freshness validation (URL checker, AI analysis)
8. Coaching form, SEO, polish
9. Job alerts (email notifications)
10. Launch prep (analytics, error tracking, performance)

---
*Synthesized: 2026-03-10*
*Sources: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
