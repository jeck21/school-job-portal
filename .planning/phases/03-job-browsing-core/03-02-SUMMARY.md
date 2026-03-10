---
phase: 03-job-browsing-core
plan: 02
subsystem: ui
tags: [next.js, parallel-routes, intercepting-routes, shadcn, dialog, server-components]

requires:
  - phase: 03-01
    provides: "Job queries (getJobs, getJobDetail), date formatting, report action, shadcn UI components"
provides:
  - "Job list page at /jobs with count header, compact rows, load more"
  - "Job detail modal via intercepting route at /jobs/[id]"
  - "Full page job detail for direct navigation / SEO"
  - "Report issue dropdown on job details"
  - "Apply CTA linking to original posting"
affects: [04-search-filters, 05-job-alerts]

tech-stack:
  added: []
  patterns:
    - "Next.js parallel routes (@modal slot) for modal overlays"
    - "Intercepting routes (.) for client-side modal interception"
    - "Server component data fetching with client component state for load-more"

key-files:
  created:
    - src/app/@modal/default.tsx
    - src/app/@modal/(.)jobs/[id]/page.tsx
    - src/app/jobs/[id]/page.tsx
    - src/components/jobs/job-detail.tsx
    - src/components/jobs/job-detail-modal.tsx
    - src/components/jobs/job-list.tsx
    - src/components/jobs/job-row.tsx
    - src/components/jobs/report-button.tsx
  modified:
    - src/app/layout.tsx
    - src/app/jobs/page.tsx
    - src/lib/queries/get-jobs.ts
    - src/lib/queries/get-job-detail.ts

key-decisions:
  - "Alternating row colors for visual scanability"
  - "'View Original Posting' label instead of 'Apply at [District]' since URLs point to PAREAP source"

patterns-established:
  - "Parallel route modal pattern: @modal slot + (.) intercepting route for detail overlays"
  - "Server-rendered initial batch + client load-more pattern for paginated lists"

requirements-completed: [SRCH-01, SRCH-09, SRCH-10, SRCH-11]

duration: 15min
completed: 2026-03-10
---

# Phase 3 Plan 02: Job Browsing UI Summary

**Complete job browsing experience with list page, intercepting route modal, load-more pagination, apply CTA, and report dropdown**

## Performance

- **Duration:** ~15 min (across checkpoint)
- **Started:** 2026-03-10T22:20:00Z
- **Completed:** 2026-03-10T22:43:42Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Job list page at /jobs with count header ("X open positions") and compact two-line rows
- Detail modal via Next.js parallel routes + intercepting routes -- shareable URLs at /jobs/[id]
- Full-page fallback for direct navigation with SEO metadata generation
- Report issue dropdown (broken link / filled / other) submitting to report_flags table
- Load more pagination in batches of 25
- Empty state for when no jobs exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Parallel route infrastructure and shared job components** - `73c47cc` (feat)
2. **Task 2: Job list page with load more, rows, empty state, and count header** - `e390a63` (feat)
3. **Task 3: Visual verification** - `686fb1b` (fix, by orchestrator: alternating row colors + apply button label)

## Files Created/Modified
- `src/app/@modal/default.tsx` - Default null for modal parallel route slot
- `src/app/@modal/(.)jobs/[id]/page.tsx` - Intercepting route for job detail modal
- `src/app/jobs/[id]/page.tsx` - Full page job detail for direct nav / SEO
- `src/app/jobs/page.tsx` - Job list page with server-rendered initial batch
- `src/app/layout.tsx` - Updated to accept modal slot
- `src/components/jobs/job-detail.tsx` - Shared job detail content (modal + full page)
- `src/components/jobs/job-detail-modal.tsx` - Dialog wrapper with router.back() on close
- `src/components/jobs/job-list.tsx` - Client component with load-more state management
- `src/components/jobs/job-row.tsx` - Compact two-line job row with Link for interception
- `src/components/jobs/report-button.tsx` - Report issue dropdown with server action
- `src/lib/queries/get-jobs.ts` - Minor adjustments for query compatibility
- `src/lib/queries/get-job-detail.ts` - Minor adjustments for query compatibility

## Decisions Made
- Alternating row colors (bg-muted/30 on even rows) for visual scanability -- added during verification
- "View Original Posting" button label instead of "Apply at [District]" since scraped URLs point to PAREAP source, not school websites directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Checkpoint Fix] Alternating row colors and apply button label**
- **Found during:** Task 3 (visual verification)
- **Issue:** Rows lacked visual distinction; "Apply at [District]" was misleading since URLs go to PAREAP
- **Fix:** Added alternating row background colors; changed CTA to "View Original Posting"
- **Files modified:** src/components/jobs/job-row.tsx, src/components/jobs/job-detail.tsx
- **Committed in:** 686fb1b (by orchestrator)

---

**Total deviations:** 1 fix during verification
**Impact on plan:** Minor UI polish and label accuracy. No scope creep.

### Deferred Items (Out of Scope)

The following were noted during verification but are out of scope for this plan:

- **No filter options** - Planned for Phase 4+ (search & filters)
- **Messy/inconsistent data** - Scraper/pipeline data quality concern, not UI
- **Non-educator jobs showing** - Data classification concern for pipeline improvements
- **Apply URL goes to PAREAP** - Scraper needs to extract direct school website URLs (future pipeline enhancement)

## Issues Encountered
None - plan executed as written with minor verification-driven polish.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Job browsing UI complete and functional
- Parallel route pattern established for future modal use cases
- Ready for search/filter features (Phase 4+)
- Data quality improvements deferred to pipeline phases

## Self-Check: PASSED

All 8 created files verified on disk. All 3 commits (73c47cc, e390a63, 686fb1b) verified in git log.

---
*Phase: 03-job-browsing-core*
*Completed: 2026-03-10*
