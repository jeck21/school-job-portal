# PA Educator Jobs Portal

## What This Is

A professional job aggregation platform for Pennsylvania educators and administrators. It pulls educator job listings from multiple sources (PAREAP, district websites, IU postings, PATTAN, PDE, and others identified through research), normalizes the data, and presents it through a polished, filterable interface that's significantly better than what exists today. Starting as a PA-focused side project designed to grow into a full-time business.

## Core Value

Educators can find every relevant PA job opening in one place with filters that actually work — location radius, salary, school type, grade band, certification, and verified status — without dealing with stale postings or clunky interfaces.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Aggregate educator jobs from multiple PA sources (PAREAP, district sites, IUs, PATTAN, PDE)
- [ ] Filter by mile radius from user's location
- [ ] Filter by salary range (include/exclude)
- [ ] Filter by school type (public, private, charter, IU, PATTAN, PDE)
- [ ] Filter by grade band(s)
- [ ] Filter by certification required
- [ ] Filter by verified status (district-claimed listings)
- [ ] Automated job freshness validation (check URLs and application status via AI)
- [ ] Auto-remove jobs that are expired or have dead links
- [ ] School/district accounts to claim, verify, update, and close postings
- [ ] Career coaching request form (simple contact form that emails the operator)
- [ ] Professional, polished UI that feels trustworthy
- [ ] Stable, reliable data ingestion that doesn't produce bad data from failed scrapes

### Out of Scope

- User accounts (v2 — needed for saved jobs, direct messaging, personalized recs)
- Job spotlights / promoted postings (v2 — revenue feature)
- Website sponsorships (v2 — revenue feature)
- Premium user features (v2 — saved jobs, resume upload, AI recommendations)
- Educator database for hiring teams (v2 — requires user accounts)
- Multi-state coverage (future — design for it, don't build it)
- Mobile app (web-first)

## Context

- PAREAP is the primary existing PA educator job board but has poor UX, stale postings, and incomplete coverage
- The portal must research and use the most stable, ToS-compliant methods for sourcing jobs (APIs preferred over scraping where available)
- School/district accounts are included in v1 to be ready if districts reach out wanting control over their listings
- Career coaching (provided by the operator at cost) is an early revenue touchpoint
- No project name yet — domain/business name TBD based on availability
- The operator is an educator with domain expertise, building this as a side project with ambitions to grow it into a full-time income source
- Architecture should be designed so other states can be added later without major rework

## Constraints

- **Budget**: Lean side-project budget — minimize infrastructure costs, use free tiers where possible
- **Data sourcing**: Must not violate terms of service of any job source; prefer APIs over scraping
- **Data quality**: Ingestion must be reliable — bad scrapes should fail gracefully, not pollute the portal
- **Design**: Must look and feel professional and polished despite being an MVP
- **Expandability**: Architecture should support adding new states/sources without major refactoring

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PA-only for v1, multi-state later | Deep coverage of one state is better than shallow coverage of many | — Pending |
| No user accounts in v1 | Reduces scope; not needed for core job browsing value | — Pending |
| School/district accounts in v1 | Be ready for district interest; enables verified badge | — Pending |
| AI-powered freshness checks | PAREAP's stale postings are a known pain point to solve | — Pending |
| Career coaching form in v1 | Early revenue touchpoint, low implementation cost | — Pending |
| Tech stack TBD | Will be determined through research phase | — Pending |

---
*Last updated: 2026-03-10 after initialization*
