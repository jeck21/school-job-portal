---
phase: 08-ui-polish-static-pages
plan: 01
subsystem: ui
tags: [responsive, mobile, tailwind, base-ui, dialog, scroll]

# Dependency graph
requires:
  - phase: 04-search-filters
    provides: nuqs URL-synced filter state, FilterDropdown, RadiusFilter, ActiveFilters
  - phase: 03-job-browsing-core
    provides: JobList, JobRow, jobs page
provides:
  - Mobile filter drawer (bottom-sheet) with live result count
  - Responsive search-filter-bar (inline desktop, drawer trigger mobile)
  - Compact stacked job rows on mobile
  - Auto-hide header on scroll-down (mobile only)
  - JobsPageClient wrapper coordinating count state
affects: [08-ui-polish-static-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [bottom-sheet dialog via base-ui Dialog positioned fixed bottom-0, useScrollDirection hook for auto-hide header, responsive layout via Tailwind hidden/md:flex classes]

key-files:
  created:
    - src/components/jobs/mobile-filter-drawer.tsx
    - src/app/jobs/jobs-page-client.tsx
  modified:
    - src/components/jobs/search-filter-bar.tsx
    - src/components/jobs/job-list.tsx
    - src/components/jobs/job-row.tsx
    - src/components/layout/header.tsx
    - src/app/jobs/page.tsx

key-decisions:
  - "Bottom-sheet dialog via base-ui Dialog.Root positioned fixed bottom-0 with rounded-t-2xl"
  - "Count state lifted to JobsPageClient wrapper via onCountChange callback from JobList"
  - "useScrollDirection inline hook in header.tsx with 60px threshold"
  - "Responsive layout purely via Tailwind classes (hidden/md:flex, md:translate-y-0)"

patterns-established:
  - "Mobile drawer pattern: base-ui Dialog as bottom sheet with fixed inset-x-0 bottom-0"
  - "Scroll direction detection: useScrollDirection hook with passive scroll listener"
  - "Responsive filter pattern: same useJobFilters hook in both desktop inline and mobile drawer"

requirements-completed: [UI-02, UI-04]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 8 Plan 1: Mobile-Responsive Jobs Page Summary

**Mobile filter drawer with bottom-sheet UI, compact stacked job rows, and auto-hide header using shared nuqs filter state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T22:12:36Z
- **Completed:** 2026-03-13T22:16:39Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Mobile filter drawer renders all filters in a bottom-sheet with live result count CTA
- Search bar stays visible on mobile without opening the drawer
- Job rows show compact stacked layout on mobile (title+school, then location)
- Header auto-hides on scroll-down and reappears on scroll-up on mobile only
- Desktop layout completely unchanged for all components

## Task Commits

Each task was committed atomically:

1. **Task 1: Mobile filter drawer and responsive search-filter-bar** - `541e19e` (feat)
2. **Task 2: Compact mobile job rows and auto-hide header** - `d6bff72` (feat)

## Files Created/Modified
- `src/components/jobs/mobile-filter-drawer.tsx` - Bottom-sheet filter drawer with all filters stacked vertically, live count CTA
- `src/app/jobs/jobs-page-client.tsx` - Client wrapper coordinating count state between SearchFilterBar and JobList
- `src/components/jobs/search-filter-bar.tsx` - Responsive: inline filters on desktop, drawer trigger on mobile
- `src/components/jobs/job-list.tsx` - Added onCountChange callback for live count propagation
- `src/components/jobs/job-row.tsx` - Compact stacked layout on mobile, inline on desktop
- `src/components/layout/header.tsx` - Auto-hide on scroll-down with useScrollDirection hook
- `src/app/jobs/page.tsx` - Uses JobsPageClient wrapper instead of direct SearchFilterBar + JobList

## Decisions Made
- Used base-ui Dialog.Root directly (not the wrapped DialogContent) for bottom-sheet positioning -- the app's DialogContent centers content, but the drawer needs fixed bottom-0
- Lifted count state to a new JobsPageClient wrapper rather than using a ref/callback from JobList -- cleaner React data flow
- Inline useScrollDirection hook in header.tsx rather than separate file -- single use case, keeps it co-located
- Responsive layout done purely with Tailwind classes (hidden/md:flex, md:translate-y-0) -- no JS media queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Mobile-responsive jobs page complete, ready for remaining UI polish plans (static pages, footer)
- Desktop layout verified unchanged through build

## Self-Check: PASSED

All 7 files verified present. Both commits (541e19e, d6bff72) verified in git log.

---
*Phase: 08-ui-polish-static-pages*
*Completed: 2026-03-13*
