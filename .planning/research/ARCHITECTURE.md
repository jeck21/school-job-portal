# Architecture Research: PA Educator Jobs Portal

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC WEB APP                        │
│              (Next.js on Vercel)                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │  Search   │  │   Job    │  │  District │             │
│  │  & Filter │  │  Detail  │  │  Portal   │             │
│  └─────┬────┘  └────┬─────┘  └─────┬─────┘             │
│        │            │              │                    │
│  ┌─────┴────────────┴──────────────┴─────┐              │
│  │          Next.js API Routes            │              │
│  └─────────────────┬─────────────────────┘              │
└────────────────────┼────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────┐
│                    │     DATABASE LAYER                   │
│            ┌───────┴───────┐                             │
│            │   Supabase    │                             │
│            │  (PostgreSQL  │                             │
│            │  + PostGIS)   │                             │
│            └───────┬───────┘                             │
│                    │                                     │
│   ┌────────────────┼────────────────────┐                │
│   │ Tables:        │                    │                │
│   │ - jobs         │ - districts        │                │
│   │ - schools      │ - scrape_runs      │                │
│   │ - sources      │ - coaching_requests│                │
│   └────────────────┴────────────────────┘                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                 INGESTION PIPELINE                        │
│            (Scheduled Workers)                            │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  Source   │   │  Source   │   │  Source   │            │
│  │ Adapter: │   │ Adapter:  │   │ Adapter:  │            │
│  │  PAREAP  │   │ Frontline │   │   PDE     │            │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘             │
│       │              │              │                    │
│  ┌────┴──────────────┴──────────────┴────┐               │
│  │           Normalizer                   │               │
│  │  - Standardize fields                 │               │
│  │  - Geocode addresses                  │               │
│  │  - Extract salary/cert/grade          │               │
│  │  - Deduplicate                        │               │
│  └──────────────────┬───────────────────┘               │
│                     │                                    │
│              ┌──────┴──────┐                             │
│              │   Write to  │                             │
│              │   Database  │                             │
│              └─────────────┘                             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              FRESHNESS VALIDATOR                          │
│           (Scheduled, less frequent)                      │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │  URL     │   │  Content │   │  Mark    │              │
│  │  Health  │──▶│  Analysis│──▶│  Expired │              │
│  │  Check   │   │  (AI)    │   │  or Keep │              │
│  └──────────┘   └──────────┘   └──────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Public Web App (Next.js)
**Responsibility:** Serve the user-facing portal, handle search/filter queries, render job listings.

- **Search page:** Main landing, filter sidebar, results grid/list
- **Job detail page:** Full posting info, link to apply, school info, verified badge
- **District portal:** Login, manage listings, update/close jobs
- **Coaching form:** Simple contact form with email delivery
- **Static pages:** About, FAQ, contact

### 2. Database Layer (Supabase/PostgreSQL)

**Core tables:**

```
jobs
├── id (uuid)
├── title (text)
├── description (text)
├── school_id (fk → schools)
├── source_id (fk → sources)
├── source_url (text) — original posting URL
├── salary_min (numeric, nullable)
├── salary_max (numeric, nullable)
├── salary_type (enum: annual, hourly, daily, not_listed)
├── school_type (enum: public, private, charter, iu, pattan, pde)
├── grade_band (text[]) — array: prek, elementary, middle, high
├── certifications (text[]) — PA cert types required
├── location (geography) — PostGIS point
├── is_verified (boolean) — claimed by district
├── status (enum: active, expired, removed)
├── first_seen_at (timestamp)
├── last_verified_at (timestamp)
├── expires_at (timestamp, nullable)
├── created_at, updated_at
└── source_hash (text) — for deduplication

schools
├── id, name, district_id
├── address, city, state, zip
├── location (geography)
├── school_type
└── website

districts
├── id, name
├── account_id (fk → auth.users, nullable)
├── is_claimed (boolean)
├── logo_url, website
└── iu_number (integer)

sources
├── id, name (e.g., "PAREAP", "Frontline-NPSD")
├── base_url
├── adapter_type (enum: pareap, frontline, pde, custom)
├── scrape_frequency (interval)
└── last_scraped_at

scrape_runs
├── id, source_id
├── status (enum: success, partial, failed)
├── jobs_found, jobs_new, jobs_updated
├── errors (jsonb)
└── started_at, completed_at
```

### 3. Ingestion Pipeline

**Architecture pattern:** Adapter per source type

Each source gets an adapter that knows how to:
1. Fetch pages (Playwright for JS-rendered, HTTP for static)
2. Parse job data from HTML
3. Return normalized `JobCandidate` objects

The normalizer then:
1. Standardizes fields (title casing, salary parsing, grade band mapping)
2. Geocodes addresses → PostGIS points
3. Extracts certifications from description text
4. Deduplicates via source_hash (hash of title + school + source)
5. Upserts into database

**Source adapters needed for v1:**
1. PAREAP (pareap.net) — main PA educator job board
2. PAeducator.net — 200+ districts/IUs
3. Teach in PA / PDE — state job listings
4. PAIU Jobs — 29 IU listings
5. Frontline/Applitrack — many PA districts use this (scrape public pages)
6. Individual district websites — prioritize largest districts first

### 4. Freshness Validator

Runs on a separate schedule (less frequent than ingestion):
1. **URL health check:** HTTP HEAD request to source_url → detect 404, redirects to homepage
2. **Content analysis:** For ambiguous cases, fetch page and use AI to classify: "Is this job posting still accepting applications?"
3. **Action:** Mark jobs as `expired` if dead/closed; update `last_verified_at` if still active

## Data Flow

```
Sources → Adapters → Normalizer → Database → API → Frontend
                                      ↑
                        Freshness Validator (periodic)
                                      ↑
                        District Portal (manual updates)
```

## Build Order (suggested phases)

1. **Foundation:** Next.js app, Supabase setup, database schema, basic UI shell
2. **Ingestion v1:** PAREAP adapter + normalizer + one source working end-to-end
3. **Search & Filter:** Location radius, school type, grade band filters
4. **More sources:** PAeducator, PDE, Frontline adapters
5. **Data quality:** Salary extraction, cert parsing, deduplication
6. **District accounts:** Auth, claim listings, verified badge
7. **Freshness:** URL checker, AI validation
8. **Polish:** Coaching form, SEO, performance, error handling

### Key Architectural Principles

- **Separation of concerns:** Ingestion pipeline is independent of the web app — they share only the database
- **Adapter pattern:** New sources are added by writing a new adapter, not modifying core logic
- **Graceful degradation:** Failed scrapes don't affect the live site — old data stays until refreshed
- **Multi-tenant ready:** District accounts use Supabase RLS for data isolation
- **State-expandable:** Sources table and adapter pattern make adding new states straightforward

---
*Researched: 2026-03-10*
