---
phase: 09-operations-launch
plan: 01
subsystem: infra
tags: [monitoring, recharts, resend, email-alerts, admin-dashboard]

requires:
  - phase: 02-first-source-pipeline
    provides: scrape_logs table and logger functions
  - phase: 08-ui-polish
    provides: Resend integration pattern from coaching-action.ts

provides:
  - Admin monitoring dashboard at /admin/monitoring
  - Scrape failure email alerting via Resend
  - Monitoring data query layer (getRecentScrapeRuns, getJobCountTrends, getSourceSummaries)

affects: [operations, scraper-pipeline]

tech-stack:
  added: [recharts]
  patterns: [admin-auth-gate-via-operator-email, server-component-data-fetching-for-dashboard]

key-files:
  created:
    - src/app/admin/monitoring/page.tsx
    - src/lib/queries/get-monitoring-data.ts
    - src/components/admin/scrape-timeline.tsx
    - src/components/admin/job-count-chart.tsx
    - src/components/admin/error-log-viewer.tsx
    - src/components/admin/source-summary.tsx
    - scripts/scrapers/lib/alert.ts
  modified:
    - scripts/scrapers/run.ts
    - .github/workflows/scrape.yml

key-decisions:
  - "Recharts for line chart visualization (widely used, good Next.js SSR compat)"
  - "HTML details/summary for error log expand/collapse (zero JS overhead)"
  - "Status dots grid using plain divs (simpler than charting library for status matrix)"
  - "Per-call Resend instantiation for alert function (consistent with coaching-action pattern)"
  - "Admin gate via OPERATOR_EMAIL env var check (same pattern as existing admin pages)"

patterns-established:
  - "Admin monitoring page pattern: server component with OPERATOR_EMAIL auth gate"
  - "Scrape alert pattern: post-run alerting with silent skip when env vars missing"

requirements-completed: [INFRA-02, INFRA-03]

duration: 4min
completed: 2026-03-14
---

# Phase 09 Plan 01: Admin Monitoring Dashboard & Scrape Alerts Summary

**Admin monitoring dashboard with scrape timeline, job count trends, error log viewer, and email alerting via Resend for pipeline failures**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T22:01:21Z
- **Completed:** 2026-03-14T22:05:19Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Admin-only monitoring dashboard at /admin/monitoring with four data views
- Scrape failure email alerting integrated into pipeline via Resend
- Server-side monitoring queries with admin client for RLS bypass
- GitHub Actions workflow updated with Resend credentials for CI alerts

## Task Commits

Each task was committed atomically:

1. **Task 1: Monitoring data queries and alert function** - `41fb960` (feat)
2. **Task 2: Admin monitoring dashboard page with four views** - `1fc691c` (feat)
3. **Task 3: Wire scrape failure alerts into pipeline** - `c346bae` (feat)

## Files Created/Modified
- `src/lib/queries/get-monitoring-data.ts` - Three server query functions for monitoring data
- `scripts/scrapers/lib/alert.ts` - Resend email alert on scrape failures
- `src/app/admin/monitoring/page.tsx` - Admin dashboard page with auth gate
- `src/components/admin/source-summary.tsx` - Per-source summary cards
- `src/components/admin/scrape-timeline.tsx` - Status dots grid (14 days)
- `src/components/admin/job-count-chart.tsx` - Recharts line chart for trends
- `src/components/admin/error-log-viewer.tsx` - Expandable error details
- `scripts/scrapers/run.ts` - Added sendScrapeAlert calls after adapter runs
- `.github/workflows/scrape.yml` - Added RESEND_API_KEY and OPERATOR_EMAIL env vars
- `package.json` - Added recharts dependency

## Decisions Made
- Used Recharts for line chart (widely used, good Next.js compatibility)
- HTML details/summary for error expand/collapse (zero JS overhead)
- Status dot grid with plain divs (simpler than a charting library for a status matrix)
- Per-call Resend instantiation matches existing coaching-action pattern
- Admin auth gate checks user.email === OPERATOR_EMAIL (consistent pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build cache corruption (`pages-manifest.json` missing) required clearing `.next` directory before rebuild. Resolved by `rm -rf .next`.

## User Setup Required

User must add RESEND_API_KEY and OPERATOR_EMAIL to GitHub repository secrets for CI email alerts to function. These env vars are already configured in Vercel from Phase 8.

## Next Phase Readiness
- Monitoring dashboard live and accessible to operator
- Scrape alerts wired into pipeline for immediate failure notification
- Ready for subsequent operations plans (scheduling optimization, health checks)

## Self-Check: PASSED

All 7 created files verified present. All 3 task commits verified in git log.

---
*Phase: 09-operations-launch*
*Completed: 2026-03-14*
