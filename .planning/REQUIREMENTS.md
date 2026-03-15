# Requirements: PA Educator Jobs Portal

**Defined:** 2026-03-10
**Core Value:** Educators can find every relevant PA job opening in one place with filters that actually work — without dealing with stale postings or clunky interfaces.

## v1 Requirements

### Job Search & Browsing

- [x] **SRCH-01**: User can browse all aggregated PA educator job listings in a searchable list/grid
- [x] **SRCH-02**: User can search jobs by keyword (title, school name, description)
- [x] **SRCH-03**: User can filter jobs by distance radius from a location (zip code or browser geolocation)
- [x] **SRCH-04**: User can filter jobs by school type (public, private, charter, IU, PATTAN, PDE)
- [x] **SRCH-05**: User can filter jobs by grade band (PreK, Elementary, Middle, High)
- [x] **SRCH-06**: User can filter jobs by subject/position category (Math, Science, SpEd, Admin, etc.)
- [x] **SRCH-07**: User can filter jobs by "Salary Info Included" toggle to show only postings that mention salary
- [x] **SRCH-08**: User can filter jobs by PA certification type required
- [x] **SRCH-09**: User can view a job detail page with title, school, location, salary, description excerpt, and source info
- [x] **SRCH-10**: User can click through to the original posting to apply
- [x] **SRCH-11**: User can see when a job was first posted and when it was last verified
- [x] **SRCH-12**: User can combine multiple filters simultaneously

### Data Ingestion & Quality

- [x] **DATA-01**: System aggregates jobs from PAREAP
- [x] **DATA-02**: System aggregates jobs from PAeducator.net
- [x] **DATA-03**: System aggregates jobs from PDE / Teach in PA
- [x] **DATA-04**: System aggregates jobs from at least 2 additional PA sources (PAIU, Frontline/Applitrack, TeachingJobsInPA, or district sites)
- [x] **DATA-05**: System normalizes job data across sources (titles, locations, school names, school types)
- [x] **DATA-06**: System geocodes school/job locations for radius search
- [x] **DATA-07**: System deduplicates jobs that appear across multiple sources
- [x] **DATA-08**: System detects whether a posting mentions salary info (boolean flag, not extraction)
- [x] **DATA-09**: System extracts certification requirements from posting text when available
- [x] **DATA-10**: System runs ingestion on a scheduled basis (at least daily)
- [x] **DATA-11**: System validates job freshness via URL health checks and AI content analysis
- [x] **DATA-12**: System auto-removes jobs with dead URLs or that are no longer accepting applications
- [x] **DATA-13**: Failed scrapes do not corrupt or remove existing valid job data

### School/District Accounts

- [x] **DIST-01**: District hiring team can create an account with email and password
- [x] **DIST-02**: District can claim existing scraped listings as belonging to their school/district
- [x] **DIST-03**: Claimed listings display a "Verified" badge on the portal
- [x] **DIST-04**: District can update details on their claimed listings
- [x] **DIST-05**: District can mark listings as filled/closed
- [ ] **DIST-06**: District has a profile page showing all their open positions

### User Interface & Experience

- [x] **UI-01**: Portal has a professional, polished, trustworthy visual design
- [x] **UI-02**: Portal is fully responsive and usable on mobile devices
- [x] **UI-03**: Search results load quickly (under 2 seconds)
- [x] **UI-04**: Filter panel is intuitive and works well on both desktop and mobile
- [x] **UI-05**: Portal has an About page explaining its mission and value
- [x] **UI-06**: Portal has a career coaching request form that sends an email to the operator

### Infrastructure & Operations

- [x] **INFRA-01**: Portal is deployed and publicly accessible on a custom domain
- [x] **INFRA-02**: Scraping pipeline runs reliably on a schedule without manual intervention
- [x] **INFRA-03**: Scrape monitoring tracks success/failure counts per source
- [x] **INFRA-04**: Portal has basic analytics to track usage (page views, search queries)

## v2 Requirements

### User Accounts & Personalization

- **USER-01**: User can create a personal account
- **USER-02**: User can save jobs to a favorites list
- **USER-03**: User can set up job alert emails for saved search criteria
- **USER-04**: User can upload resume and credentials
- **USER-05**: User gets AI-powered personalized job recommendations
- **USER-06**: User gets AI recommendations for highlighting experience per job

### Revenue Features

- **REV-01**: Job spotlights — promoted job postings with district "pitch"
- **REV-02**: District database access — search educators who've submitted profiles
- **REV-03**: Website sponsorship placements (ed tech vendors, etc.)
- **REV-04**: Premium user accounts (saved jobs, direct messaging, AI recs)

### Communication

- **COMM-01**: User can message hiring managers through the platform
- **COMM-02**: Verified status filter (show only district-verified listings)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-state job coverage | PA-first strategy; architecture supports expansion later |
| Mobile app | Web-responsive covers mobile; native app is v3+ |
| Resume builder | Many free alternatives exist; tangential to core value |
| Auto-apply | Legal/ethical concerns; districts want intentional applicants |
| Social features (likes, comments) | Job board, not social media |
| Real-time chat | High complexity, not core to job search |
| User-generated job postings | Data comes from authoritative sources; user posts = spam risk |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRCH-01 | Phase 3: Job Browsing Core | Complete |
| SRCH-02 | Phase 4: Search & Filters | Complete |
| SRCH-03 | Phase 4: Search & Filters | Complete |
| SRCH-04 | Phase 4: Search & Filters | Complete |
| SRCH-05 | Phase 4: Search & Filters | Complete |
| SRCH-06 | Phase 4: Search & Filters | Complete |
| SRCH-07 | Phase 4: Search & Filters | Complete |
| SRCH-08 | Phase 4: Search & Filters | Complete |
| SRCH-09 | Phase 3: Job Browsing Core | Complete |
| SRCH-10 | Phase 3: Job Browsing Core | Complete |
| SRCH-11 | Phase 3: Job Browsing Core | Complete |
| SRCH-12 | Phase 4: Search & Filters | Complete |
| DATA-01 | Phase 2: First Source Pipeline | Complete |
| DATA-02 | Phase 5: Additional Sources | Complete |
| DATA-03 | Phase 5: Additional Sources | Complete |
| DATA-04 | Phase 5: Additional Sources | Complete |
| DATA-05 | Phase 2: First Source Pipeline | Complete |
| DATA-06 | Phase 4: Search & Filters | Complete |
| DATA-07 | Phase 5: Additional Sources | Complete |
| DATA-08 | Phase 6: Data Enrichment | Complete |
| DATA-09 | Phase 6: Data Enrichment | Complete |
| DATA-10 | Phase 2: First Source Pipeline | Complete |
| DATA-11 | Phase 6: Data Enrichment | Complete |
| DATA-12 | Phase 6: Data Enrichment | Complete |
| DATA-13 | Phase 2: First Source Pipeline | Complete |
| DIST-01 | Phase 7: District Accounts | Complete |
| DIST-02 | Phase 7: District Accounts | Complete |
| DIST-03 | Phase 7: District Accounts | Complete |
| DIST-04 | Phase 7: District Accounts | Complete |
| DIST-05 | Phase 7: District Accounts | Complete |
| DIST-06 | Phase 11: Phase 7 Completion & Tech Debt Cleanup | Pending |
| UI-01 | Phase 1: Foundation | Complete |
| UI-02 | Phase 8: UI Polish & Static Pages | Complete |
| UI-03 | Phase 9: Operations & Launch | Complete |
| UI-04 | Phase 8: UI Polish & Static Pages | Complete |
| UI-05 | Phase 8: UI Polish & Static Pages | Complete |
| UI-06 | Phase 8: UI Polish & Static Pages | Complete |
| INFRA-01 | Phase 1: Foundation | Complete |
| INFRA-02 | Phase 9: Operations & Launch | Complete |
| INFRA-03 | Phase 9: Operations & Launch | Complete |
| INFRA-04 | Phase 9: Operations & Launch | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
