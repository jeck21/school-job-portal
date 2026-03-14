# Phase 9: Operations & Launch - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Production readiness for the PA Educator Jobs Portal. Deliver scrape monitoring with alerting, usage analytics, performance optimization to meet <2s search target, and launch essentials (SEO, error pages, icons, security headers). The scraping infrastructure and logging already exist — this phase surfaces that data and polishes for launch.

</domain>

<decisions>
## Implementation Decisions

### Monitoring dashboard
- Admin-only page at /admin/monitoring (not public)
- Protected via existing district auth (Phase 7) with admin flag on the user account
- Dashboard shows four views:
  - Scrape timeline: visual status dots (green/yellow/red) per source over last 7-30 days
  - Job count trends: line chart of total active jobs over time, broken down by source
  - Error log viewer: expandable error details from recent failed/partial runs
  - Source summary cards: per-source last run time, status, jobs added/updated, total active
- Data source: existing `scrape_logs` table (Phase 2) — no new DB tables needed for monitoring

### Failure alerting
- Email alerts via Resend on scrape failures (reuse existing Resend integration from coaching form)
- Alert sent to operator email when any scrape run ends in "failure" or "partial_failure" status
- No Slack/GitHub integration — email only

### Analytics
- Vercel Analytics (free tier) for page views and web vitals — one-line setup
- Custom events for: search queries (keywords typed) and filter usage (which filters applied)
- Job click-throughs and coaching submissions NOT tracked as custom events
- Use Vercel's built-in analytics dashboard only — no analytics UI on admin page

### Performance optimization
- Target: search results load under 2 seconds (requirement UI-03)
- Static generation with periodic revalidation for landing page, about page, coaching page
- Profile current query performance and add indexes/optimize as needed — pragmatic approach
- No aggressive sub-1s optimization or edge caching

### SEO
- Meta tags and Open Graph images for social media sharing
- Auto-generated sitemap.xml (robots.txt already references it)
- JSON-LD JobPosting structured data on job detail pages for Google job search rich results

### Launch polish
- Custom branded 404 and 500 error pages (replace Next.js defaults)
- Favicon, Apple touch icon, and PWA manifest icons
- Security headers via next.config.ts (CSP, X-Frame-Options, etc.)
- Launching on school-job-portal.vercel.app — custom domain to be added later

### Claude's Discretion
- Exact monitoring dashboard layout and charting library
- Revalidation intervals for static pages
- Specific database index choices based on query profiling
- OG image design approach (static vs dynamic)
- Specific CSP directives and security header values

</decisions>

<specifics>
## Specific Ideas

- Reuse Resend client pattern (instantiated per-call inside server action) for failure alert emails
- Reuse existing Supabase auth middleware for admin route protection
- scrape_logs table already has all needed fields: source_id, status, jobs_added/updated/skipped/failed, errors JSONB, duration_ms
- No new auth system — just flag existing account as admin (email check or DB column)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scrape_logs` table (migration 00002): Full scrape history with status, job counts, errors, duration
- `scripts/scrapers/lib/logger.ts`: createScrapeLog/updateScrapeLog utilities writing to scrape_logs
- Resend integration (Phase 8): coaching-action.ts pattern for per-call client instantiation
- Supabase admin client (`src/lib/supabase/admin.ts`): service-role operations for dashboard queries
- District auth middleware (`src/lib/supabase/middleware.ts`): route protection infrastructure

### Established Patterns
- Server-side queries in `src/lib/queries/` with "use server"
- Admin client used for dashboard queries bypassing RLS (Phase 7 pattern)
- GitHub Actions workflows: `scrape.yml` (staggered daily) + `freshness.yml` (weekly Sunday)
- Forest & Ember theme with warm utility classes in globals.css

### Integration Points
- Admin routes: new `/admin/monitoring` route group
- Scrape alerting: hook into existing logger or post-scrape step in GitHub Actions
- Analytics: Vercel Analytics package in root layout
- Static generation: update page components for landing, about, coaching
- SEO: metadata exports in layout.ts/page.ts files, new sitemap.ts route

</code_context>

<deferred>
## Deferred Ideas

- Data quality deep-dive — scraping accuracy, messy data cleanup, source reliability improvements (V2 priority)
- Comprehensive cybersecurity audit — protect sensitive user data and operator data across all surfaces (V2)
- Custom domain setup — purchase and connect domain when business name is decided
- Public status page — could add later if users want transparency on data freshness

</deferred>

---

*Phase: 09-operations-launch*
*Context gathered: 2026-03-14*
