---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Completed 09-00-PLAN.md
last_updated: "2026-03-14T22:02:30Z"
last_activity: 2026-03-14 -- Executed plan 09-00 (Wave 0 test stubs)
progress:
  total_phases: 9
  completed_phases: 7
  total_plans: 22
  completed_plans: 19
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Educators can find every relevant PA job opening in one place with filters that actually work -- without stale postings or clunky interfaces.
**Current focus:** Phase 9 - Operations & Launch

## Current Position

Phase: 9 of 9 (Operations & Launch) -- IN PROGRESS
Plan: 2 of 4 in current phase (09-01 complete)
Status: Executing Phase 9
Last activity: 2026-03-14 -- Executed plan 09-01 (Admin monitoring dashboard & scrape alerts)

Progress: [█████████░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: ~7 min
- Total execution time: ~1.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-Foundation | 2/2 | ~51 min | ~26 min |
| 2-First Source Pipeline | 2/2 | ~14 min | ~7 min |
| 3-Job Browsing Core | 2/2 | ~17 min | ~9 min |
| 4-Search & Filters | 2/2 | ~14 min | ~7 min |
| 5-Additional Sources | 3/3 | ~8 min | ~3 min |
| 6-Data Enrichment | 2/2 | ~6 min | ~3 min |
| 7-District Accounts | 2/3 | ~10 min | ~5 min |
| 8-UI Polish | 3/3 | ~12 min | ~4 min |

**Recent Trend:**
- Last 5 plans: 07-02 (5 min), 08-01 (4 min), 08-02 (4 min), 08-03 (4 min), 09-00 (1 min)
- Trend: Stable

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Stack is Next.js 15 + Supabase (PostGIS) + Vercel per research
- [Roadmap]: All PA sources require HTML scraping (no public APIs found)
- [Roadmap]: Adapter pattern for sources (new source = new adapter)
- [01-01]: oklch color format for CSS variables (matching shadcn/ui v4 default)
- [01-01]: Plus Jakarta Sans as primary font
- [01-01]: Dark mode as default theme with system override
- [01-02]: Forest & Ember theme (forest green + warm amber CTAs) replacing electric blue
- [01-02]: Dual-audience matchmaking messaging for landing page hero
- [01-02]: User wants more warm color pops in future design finalization
- [Phase 02]: cheerio for PAREAP parsing (static HTML, no JS rendering)
- [Phase 02]: Dice coefficient 0.8 threshold for school fuzzy matching
- [Phase 02]: Batch upsert in groups of 50 with independent failure handling
- [02-02]: Inline source seeding in ingestPareap (no separate migration)
- [02-02]: Daily cron at 6 AM UTC (off-peak for PAREAP servers)
- [02-02]: Batch size of 25 for ingestion upserts (finer partial-failure granularity)
- [03-01]: Query pattern: server-side queries in src/lib/queries/ with "use server"
- [03-01]: Left join for schools since school_id is nullable on jobs
- [03-01]: CHECK constraint for report reason enum (simpler than Postgres ENUM)
- [03-02]: Parallel route modal pattern (@modal slot + intercepting routes) for detail overlays
- [03-02]: "View Original Posting" label since scraped URLs point to PAREAP, not school sites
- [03-02]: Alternating row colors for visual scanability in job list
- [04-01]: Single RPC function for all search/filter logic (one round trip, PostGIS support)
- [04-01]: Static zip CSV for geocoding (zero runtime cost, no API key)
- [04-01]: include_remote flag for cyber schools to bypass radius filter
- [04-02]: nuqs for URL-synced filter state (shallow routing, no full page re-renders)
- [04-02]: Base UI popover trigger pattern (no asChild) for shadcn v5 compatibility
- [04-02]: Flat RPC results mapped to nested JobRow shape at consumption boundary
- [05-01]: Native fetch for PAeducator API (fetchWithRetry returns string, API needs JSON)
- [05-01]: Dedup weighted Dice: title 0.6 + school 0.4, match at 0.8, borderline 0.7-0.85
- [05-01]: Shared runIngestion pipeline replaces per-source boilerplate
- [05-01]: PAeducator 1.5s polite delay between job detail requests
- [05-02]: SchoolSpring POST pagination with pageNumber form data
- [05-02]: TeachingJobsInPA slugified school+title for stable external IDs
- [05-02]: TeachingJobsInPA apply URLs are employer direct links
- [05-03]: NODE_TLS_REJECT_UNAUTHORIZED=0 scoped per-step to PAREAP only in unified workflow
- [05-03]: Sequential "all" execution with 30s delays and error isolation between adapters
- [05-03]: Staggered cron: 6AM PAREAP, 10AM PAeducator, 2PM SchoolSpring, 6PM TeachingJobsInPA (UTC)
- [06-01]: Removed short aliases (PE, ASL, etc.) from cert taxonomy -- matched via longer alias forms only
- [06-01]: Dedup branch also enriches existing jobs when description updated or salary/cert data missing
- [06-02]: Sequential job processing with domain-based polite delays (1.5s) to avoid rate limiting
- [06-02]: Ambiguous jobs without AI confirmation kept active (conservative soft-delete approach)
- [06-02]: AI client instantiated per-call to avoid module-level errors when API key missing
- [06-02]: PAREAP TLS override scoped per-request with cleanup in finally block
- [07-01]: Redirect-based error handling in server actions for form action type compatibility
- [07-01]: Separate admin.ts client in src/lib/supabase/ for app-side service-role operations
- [07-01]: Domain auto-added to verified_domains whitelist on first k12.pa.us confirmation
- [Phase 07-02]: Admin client used for all dashboard queries to bypass RLS restrictions
- [Phase 07-02]: Native HTML checkboxes for form data submission reliability over Base UI Checkbox
- [Phase 07-02]: Auto-claim tries exact district name match first, fuzzy Dice fallback at 0.8
- [08-01]: Bottom-sheet dialog via base-ui Dialog.Root positioned fixed bottom-0 for mobile filter drawer
- [08-01]: Count state lifted to JobsPageClient wrapper via onCountChange callback from JobList
- [08-01]: useScrollDirection hook with 60px threshold for auto-hide header on mobile
- [08-01]: Responsive layout purely via Tailwind classes (hidden/md:flex) -- no JS media queries
- [08-02]: Resend client instantiated per-call inside server action (consistent with AI client pattern)
- [08-02]: useActionState (React 19) for coaching form submission state management
- [08-02]: HTML table format for coaching email body (reliable across email clients)
- [08-03]: ThemeToggle added to header for explicit light/dark switching (sun/moon icon)
- [08-03]: Stats bar made async server component with live counts from Supabase
- [08-03]: Warm utility classes in globals.css for consistent warm accent reuse
- [09-01]: Recharts for monitoring line charts (widely used, good Next.js SSR compat)
- [09-01]: HTML details/summary for error log expand/collapse (zero JS overhead)
- [09-01]: Admin gate via OPERATOR_EMAIL env var check (consistent with existing pattern)
- [09-01]: Per-call Resend instantiation for alert function (matches coaching-action pattern)
- [09-00]: Used test.fixme() for Playwright stubs (test.todo() not supported in Playwright API)

### Pending Todos

None yet.

### Blockers/Concerns

- PAeducator.net has a REST API (contrary to earlier "no public APIs" assumption) -- discovered during research
- Scraper fragility is a known risk; monitoring needed from early phases

## Session Continuity

Last session: 2026-03-14T22:05:19Z
Stopped at: Completed 09-01-PLAN.md
Resume file: .planning/phases/09-operations-launch/09-01-SUMMARY.md
