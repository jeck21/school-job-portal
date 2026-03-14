# Roadmap: PA Educator Jobs Portal

## Overview

This roadmap delivers a PA educator job aggregation portal from zero to launch-ready. It starts with infrastructure and a single source pipeline to prove the data flow end-to-end, then layers on search/filter capabilities, additional sources, data enrichment, district accounts, UI polish, and operations tooling. Each phase delivers a coherent, testable capability that builds on the last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js + Supabase project with schema, deployment, and UI shell
- [x] **Phase 2: First Source Pipeline** - PAREAP scraper, normalizer, and scheduled ingestion with failure handling (completed 2026-03-10)
- [x] **Phase 3: Job Browsing Core** - Browsable job list and detail pages with click-through to original postings (completed 2026-03-10)
- [x] **Phase 4: Search & Filters** - Keyword search, radius, school type, grade band, subject, salary, cert, and combined filters (completed 2026-03-11)
- [x] **Phase 5: Additional Sources** - PAeducator.net, PDE/Teach in PA, and 2+ more adapters with deduplication (completed 2026-03-11)
- [x] **Phase 6: Data Enrichment** - Salary extraction, certification parsing, freshness validation, and auto-removal (completed 2026-03-11)
- [ ] **Phase 7: District Accounts** - District auth, listing claims, verified badges, updates, and profile pages
- [x] **Phase 8: UI Polish & Static Pages** - Responsive mobile experience, about page, career coaching form, and visual polish (completed 2026-03-14)
- [x] **Phase 9: Operations & Launch** - Scrape monitoring, analytics, performance optimization, and production readiness (completed 2026-03-14)

## Phase Details

### Phase 1: Foundation
**Goal**: A deployed, empty shell exists with database schema and UI skeleton ready for data
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, UI-01
**Success Criteria** (what must be TRUE):
  1. The portal is publicly accessible at a URL and renders a branded landing page
  2. The database schema exists with tables for jobs, sources, schools, and districts
  3. The UI shell has a header, navigation, and placeholder content area with professional styling
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, database schema, theme system, and test infrastructure
- [x] 01-02-PLAN.md — UI shell with landing page, navigation, page routes, and visual verification

### Phase 2: First Source Pipeline
**Goal**: Jobs from PAREAP flow automatically into the database on a schedule without corrupting existing data
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-05, DATA-10, DATA-13
**Success Criteria** (what must be TRUE):
  1. PAREAP jobs are scraped and stored in the database with normalized titles, locations, and school names
  2. The ingestion pipeline runs on a daily schedule without manual intervention
  3. A failed scrape leaves existing valid job data untouched (no data loss or corruption)
  4. Each scrape run produces a log showing jobs added, updated, and skipped
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Scraper infrastructure, PAREAP adapter, HTML parser, normalizer, school matcher, and unit tests
- [x] 02-02-PLAN.md — Ingestion pipeline wiring, CLI entrypoint, GitHub Actions scheduling, and end-to-end verification

### Phase 3: Job Browsing Core
**Goal**: Educators can browse all ingested jobs and view details without any filters
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-09, SRCH-10, SRCH-11
**Success Criteria** (what must be TRUE):
  1. User sees a list of all aggregated job postings on the main search page
  2. User can click a job to see its detail page with title, school, location, salary, description, and source info
  3. User can click through from the detail page to the original posting to apply
  4. Each job displays when it was first posted and when it was last verified
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Data layer: query functions, date formatting, report flags migration, shadcn UI components
- [x] 03-02-PLAN.md — Job list page, detail modal with intercepting routes, load more, apply CTA, report button

### Phase 4: Search & Filters
**Goal**: Educators can narrow jobs using keyword search and all filter types, individually or combined
**Depends on**: Phase 3
**Requirements**: SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08, SRCH-12, DATA-06
**Success Criteria** (what must be TRUE):
  1. User can search jobs by keyword and see relevant results matching title, school name, or description
  2. User can filter by distance radius from a zip code or browser geolocation and only see jobs within that radius
  3. User can filter by school type, grade band, subject/position category, salary range, and certification type
  4. User can combine multiple filters simultaneously and the result set reflects all active filters
  5. The filter panel is visible and usable alongside the results list
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Database layer: geocoding migrations, search_jobs RPC function, filter options, server action
- [ ] 04-02-PLAN.md — Filter UI: search bar, filter dropdowns, radius slider, toggles, URL state, job list wiring

### Phase 5: Additional Sources
**Goal**: The portal aggregates jobs from 4+ PA sources with duplicates eliminated
**Depends on**: Phase 2
**Requirements**: DATA-02, DATA-03, DATA-04, DATA-07
**Success Criteria** (what must be TRUE):
  1. Jobs from PAeducator.net appear in the portal alongside PAREAP jobs
  2. Jobs from PDE / Teach in PA appear in the portal
  3. Jobs from at least 2 additional sources (PAIU, Frontline/Applitrack, TeachingJobsInPA, or district sites) appear in the portal
  4. The same job posted on multiple sources appears only once, with source attribution showing all origins
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Shared ingestion pipeline, dedup module, and PAeducator.net API adapter
- [ ] 05-02-PLAN.md — SchoolSpring and TeachingJobsInPA cheerio adapters
- [ ] 05-03-PLAN.md — Unified GitHub Actions workflow, PAREAP refactor, and end-to-end wiring

### Phase 6: Data Enrichment
**Goal**: Jobs are flagged for salary/cert presence, and stale or dead postings are automatically removed
**Depends on**: Phase 5
**Requirements**: DATA-08, DATA-09, DATA-11, DATA-12
**Success Criteria** (what must be TRUE):
  1. Jobs that mention salary in the posting text are flagged with a boolean, enabling the "Salary Info Included" filter
  2. Jobs with certification requirements mentioned in the posting text have those requirements extracted and available for filtering
  3. The system periodically checks job URLs and posting content, flagging or removing jobs that are expired or have dead links
  4. An AI-based content analysis identifies postings that are no longer accepting applications
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Salary detection and certification extraction pure functions with pipeline integration
- [x] 06-02-PLAN.md — Freshness validation with URL health checks, heuristics, AI fallback, and weekly cron

### Phase 7: District Accounts
**Goal**: School districts can create accounts, claim their listings, and manage their postings with verified status
**Depends on**: Phase 3
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, DIST-05, DIST-06
**Success Criteria** (what must be TRUE):
  1. A district hiring team member can create an account with email and password
  2. A district can claim existing scraped listings and those listings display a "Verified" badge
  3. A district can update details on their claimed listings and mark them as filled/closed
  4. A district has a profile page showing all their open positions
**Plans**: 3 plans

Plans:
- [ ] 07-01-PLAN.md — Database migration, auth middleware, signup/login/logout, email confirmation, domain validation
- [ ] 07-02-PLAN.md — Dashboard with claim review, listing management (delist/relist/create/edit), verified badge, scraper suppression
- [ ] 07-03-PLAN.md — Public district profiles, district directory, verified badge integration in job list/detail

### Phase 8: UI Polish & Static Pages
**Goal**: The portal looks and works great on all devices and has all supporting pages
**Depends on**: Phase 4
**Requirements**: UI-02, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. The portal is fully responsive and usable on mobile devices (phone and tablet)
  2. The filter panel works intuitively on both desktop and mobile layouts
  3. An About page explains the portal's mission and value
  4. A career coaching request form sends an email to the operator when submitted
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Mobile responsive layout: filter drawer, compact job rows, auto-hide header
- [ ] 08-02-PLAN.md — About page with mission content, coaching form with Resend email delivery
- [ ] 08-03-PLAN.md — Visual polish pass: warm accents, hover effects, micro-interactions across all pages

### Phase 9: Operations & Launch
**Goal**: The portal has monitoring, analytics, and performance needed for a production launch
**Depends on**: Phase 6, Phase 7, Phase 8
**Requirements**: INFRA-02, INFRA-03, INFRA-04, UI-03
**Success Criteria** (what must be TRUE):
  1. A monitoring dashboard shows scrape success/failure counts per source with alerting on failures
  2. The scraping pipeline runs reliably on schedule without manual intervention in a production environment
  3. Basic analytics track page views, search queries, and filter usage
  4. Search results load in under 2 seconds on typical connections
**Plans**: 4 plans

Plans:
- [x] 09-00-PLAN.md — Wave 0 test stubs for monitoring, performance, and alerting
- [ ] 09-01-PLAN.md — Admin monitoring dashboard with scrape timeline, job trends, error log, and failure email alerts
- [ ] 09-02-PLAN.md — Vercel Analytics, sitemap, JSON-LD structured data, OG metadata, and static generation
- [ ] 09-03-PLAN.md — Launch polish: custom error pages, favicons, PWA manifest, and security headers

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
Note: Phases 5 and 7 can begin after Phase 2 and 3 respectively (parallel tracks possible).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-10 |
| 2. First Source Pipeline | 2/2 | Complete   | 2026-03-10 |
| 3. Job Browsing Core | 2/2 | Complete   | 2026-03-10 |
| 4. Search & Filters | 2/2 | Complete   | 2026-03-11 |
| 5. Additional Sources | 3/3 | Complete   | 2026-03-11 |
| 6. Data Enrichment | 2/2 | Complete | 2026-03-11 |
| 7. District Accounts | 2/3 | In Progress|  |
| 8. UI Polish & Static Pages | 3/3 | Complete   | 2026-03-14 |
| 9. Operations & Launch | 4/4 | Complete   | 2026-03-14 |
