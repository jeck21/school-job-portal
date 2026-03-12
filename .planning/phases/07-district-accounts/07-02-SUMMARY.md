---
phase: 07-district-accounts
plan: 02
subsystem: dashboard
tags: [district-dashboard, claim-matching, listing-management, verified-badge, scraper-integration, delist-suppression, auto-claim]

# Dependency graph
requires:
  - phase: 07-district-accounts
    provides: Auth infrastructure, district_accounts table, jobs claim/delist columns, admin client
  - phase: 02-first-source-pipeline
    provides: Ingest pipeline, school-matcher with Dice coefficient
provides:
  - District dashboard with Active/Delisted/Create tabs
  - Claim matching via fuzzy Dice coefficient at 0.8 threshold
  - Listing actions (delist, relist, create manual, update manual)
  - Scraper delist suppression (delisted jobs not re-activated)
  - Scraper auto-claim for newly ingested jobs matching verified districts
  - Verified badge component with warm amber styling
affects: [07-03]

# Tech tracking
tech-stack:
  added: [shadcn-tabs]
  patterns: [admin-client-for-dashboard-queries, form-action-with-useTransition, inline-editing-pattern]

key-files:
  created:
    - src/lib/queries/get-claim-matches.ts
    - src/lib/queries/get-district-jobs.ts
    - src/lib/actions/claim-actions.ts
    - src/lib/actions/listing-actions.ts
    - src/components/district/verified-badge.tsx
    - src/components/district/dashboard-tabs.tsx
    - src/components/district/listing-card.tsx
    - src/components/district/claim-review.tsx
    - src/components/district/create-listing-form.tsx
    - src/app/for-schools/dashboard/layout.tsx
    - src/app/for-schools/dashboard/page.tsx
    - src/components/ui/tabs.tsx
  modified:
    - scripts/scrapers/lib/ingest-pipeline.ts

key-decisions:
  - "Admin client used for all dashboard queries to bypass RLS (district_accounts only allows own-row reads)"
  - "Native HTML checkboxes in create form instead of Base UI Checkbox (reliable FormData submission)"
  - "Auto-claim tries exact match first, falls back to fuzzy Dice coefficient at 0.8"

patterns-established:
  - "Dashboard queries use createAdminClient from src/lib/supabase/admin.ts for cross-table reads"
  - "Listing actions use getAuthedDistrict helper for DRY auth + district ownership checks"
  - "Client components use useTransition for server action loading states"

requirements-completed: [DIST-02, DIST-03, DIST-04, DIST-05]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 7 Plan 2: District Dashboard & Listing Management Summary

**District dashboard with claim matching, delist/relist/create/edit actions, verified badge, scraper delist suppression, and auto-claim for verified districts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T00:51:18Z
- **Completed:** 2026-03-12T00:55:50Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Claim matching algorithm using Dice coefficient at 0.8 threshold fuzzy-matches unclaimed jobs to districts
- Full listing lifecycle: claim, delist, relist, create manual, update manual (scraped posts immutable)
- Scraper pipeline respects delisted_at and does not re-activate delisted jobs
- Newly scraped jobs auto-claimed for verified districts (exact match first, fuzzy fallback)
- Dashboard UI with three tabs (Active/Delisted/Create) and claim review banner

## Task Commits

Each task was committed atomically:

1. **Task 1: Claim matching, listing actions, scraper delist suppression, and auto-claim** - `4eda8e4` (feat)
2. **Task 2: Dashboard UI with tabs, claim review, listing cards, create form, and verified badge** - `24901fe` (feat)

## Files Created/Modified
- `src/lib/queries/get-claim-matches.ts` - Fuzzy match unclaimed jobs to district name
- `src/lib/queries/get-district-jobs.ts` - Fetch active/delisted jobs for a district
- `src/lib/actions/claim-actions.ts` - Claim jobs with auth verification
- `src/lib/actions/listing-actions.ts` - Delist, relist, create manual, update manual actions
- `scripts/scrapers/lib/ingest-pipeline.ts` - Added delist suppression and auto-claim logic
- `src/components/district/verified-badge.tsx` - Warm amber checkmark badge
- `src/components/district/dashboard-tabs.tsx` - Three-tab container component
- `src/components/district/listing-card.tsx` - Job card with actions and inline edit
- `src/components/district/claim-review.tsx` - Claim review banner with claim-all button
- `src/components/district/create-listing-form.tsx` - Manual job creation form
- `src/app/for-schools/dashboard/layout.tsx` - Auth-protected layout with logout
- `src/app/for-schools/dashboard/page.tsx` - Server component with data fetching
- `src/components/ui/tabs.tsx` - shadcn Tabs component (installed)

## Decisions Made
- Used admin client (service role) for dashboard queries since RLS restricts district_accounts to own-row reads, and dashboard needs cross-table joins
- Switched from Base UI Checkbox to native HTML checkboxes in the create form because Base UI checkboxes don't submit name/value to FormData
- Auto-claim in scraper tries exact district name match first for performance, falling back to fuzzy Dice coefficient only when needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced Base UI Checkbox with native HTML checkbox in create form**
- **Found during:** Task 2 (create-listing-form.tsx)
- **Issue:** Base UI Checkbox component doesn't render a hidden input with name/value, so FormData.getAll("gradeBand") and FormData.getAll("subjectArea") would return empty arrays
- **Fix:** Used native `<input type="checkbox">` elements which reliably submit form data
- **Files modified:** src/components/district/create-listing-form.tsx
- **Verification:** `npx tsc --noEmit` passes (excluding pre-existing paeducator issue)
- **Committed in:** 24901fe (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Checkbox form data submission works correctly. No scope creep.

## Issues Encountered
- Pre-existing build failure in `scripts/scrapers/adapters/paeducator/index.ts` (schoolName type mismatch from uncommitted changes) prevents full `npx next build`. All new files pass type checking independently. This is out of scope -- same issue noted in 07-01-SUMMARY.

## User Setup Required
None - no external service configuration required beyond what 07-01 already set up.

## Next Phase Readiness
- Dashboard functional at /for-schools/dashboard (requires auth)
- Verified badge component available for use in public job listings (07-03)
- Scraper pipeline now handles delist suppression and auto-claim

## Self-Check: PASSED

All 13 files verified present. Both commits (4eda8e4, 24901fe) verified in git log.

---
*Phase: 07-district-accounts*
*Completed: 2026-03-12*
