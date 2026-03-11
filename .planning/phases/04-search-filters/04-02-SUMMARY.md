---
phase: 04-search-filters
plan: 02
subsystem: ui
tags: [nuqs, search, filters, debounce, popover, slider, url-state]

requires:
  - phase: 04-01
    provides: search_jobs RPC, filter-options constants, zip_coordinates table
  - phase: 03-02
    provides: job-list, job-row components, jobs page
provides:
  - SearchFilterBar with keyword search, 6 filter controls, and toggles
  - FilterDropdown reusable multi-select popover component
  - RadiusFilter zip code + radius slider popover
  - ActiveFilters removable badge chips
  - useJobFilters nuqs hook for URL-synced filter state
  - NuqsAdapter integration in app layout
  - Updated JobList with searchJobs integration and filter-aware pagination
affects: [05-freshness, 08-mobile-polish]

tech-stack:
  added: [nuqs, use-debounce, shadcn-slider, shadcn-popover, shadcn-command, shadcn-checkbox, shadcn-switch]
  patterns: [nuqs URL state management, debounced search input, multi-select popover combobox]

key-files:
  created:
    - src/lib/hooks/use-job-filters.ts
    - src/components/jobs/search-filter-bar.tsx
    - src/components/jobs/filter-dropdown.tsx
    - src/components/jobs/radius-filter.tsx
    - src/components/jobs/active-filters.tsx
  modified:
    - src/app/layout.tsx
    - src/components/jobs/job-list.tsx
    - src/app/jobs/page.tsx

key-decisions:
  - "Base UI popover trigger pattern (no asChild) for shadcn v5 compatibility"
  - "Flat RPC results mapped to nested JobRow shape in both client and server"
  - "useEffect with serialized array deps for filter change detection"
  - "Null values passed to setFilters to remove URL params (nuqs convention)"

patterns-established:
  - "nuqs filter state: useJobFilters hook returns [filters, setFilters] with URL sync"
  - "FilterDropdown: reusable multi-select popover with Command search for >6 options"
  - "RPC result mapping: flat fields to nested object shape at consumption boundary"

requirements-completed: [SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08, SRCH-12]

duration: 5min
completed: 2026-03-11
---

# Phase 4 Plan 2: Filter UI & URL State Summary

**Full filter UI with keyword search, multi-select dropdowns, zip+radius slider, salary/unspecified toggles, active filter chips, and nuqs URL state management wired to searchJobs RPC**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T00:09:35Z
- **Completed:** 2026-03-11T00:14:47Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments
- Complete filter bar with 6 filter controls (type, grade, location, subject, certification, salary) plus include-unspecified toggle
- URL state management via nuqs so filters survive page refresh and are shareable
- Real-time filter application with debounced search and instant dropdown selection
- Active filter chips with individual remove and clear-all functionality
- Updated job list with filter-aware pagination and contextual empty states

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shadcn components, NuqsAdapter, and useJobFilters hook** - `7b5e756` (feat)
2. **Task 2: Build search-filter-bar with all filter controls** - `2bcb898` (feat)
3. **Task 3: Wire filters to job-list and update jobs page** - `1ead078` (feat)

## Files Created/Modified
- `src/lib/hooks/use-job-filters.ts` - nuqs-based filter state hook with parsers for all filter params
- `src/components/jobs/search-filter-bar.tsx` - Main filter bar with search input, dropdowns, toggles, clear-all
- `src/components/jobs/filter-dropdown.tsx` - Reusable multi-select popover with Command search
- `src/components/jobs/radius-filter.tsx` - Zip code input + radius slider in popover
- `src/components/jobs/active-filters.tsx` - Removable badge chips for active filters
- `src/app/layout.tsx` - Added NuqsAdapter wrapper inside ThemeProvider
- `src/components/jobs/job-list.tsx` - Replaced getJobs with searchJobs, added filter-aware pagination
- `src/app/jobs/page.tsx` - Added SearchFilterBar, SSR search param parsing, Suspense boundary
- `src/components/ui/slider.tsx` - shadcn slider component (Base UI)
- `src/components/ui/popover.tsx` - shadcn popover component (Base UI)
- `src/components/ui/command.tsx` - shadcn command component (cmdk)
- `src/components/ui/checkbox.tsx` - shadcn checkbox component (Base UI)
- `src/components/ui/switch.tsx` - shadcn switch component (Base UI)
- `src/components/ui/label.tsx` - shadcn label component
- `src/components/ui/separator.tsx` - shadcn separator component (Base UI)
- `src/components/ui/input.tsx` - shadcn input component

## Decisions Made
- Used Base UI popover trigger pattern (inline className styling) instead of Radix asChild pattern for shadcn v5 compatibility
- Map flat RPC results to nested JobRow shape at both server page level and client effect level for consistency
- Used serialized array dependencies (`.join(",")`) in useEffect for stable filter change detection
- Pass null to nuqs setFilters to remove params from URL (cleaner URLs when defaults)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to shadcn v5 Base UI API**
- **Found during:** Task 2 (filter components)
- **Issue:** Plan assumed Radix-based shadcn (asChild prop on PopoverTrigger, array destructuring on Slider onValueChange). Project uses shadcn v5 with Base UI primitives that have different APIs.
- **Fix:** Used inline className on PopoverTrigger instead of asChild+Button wrapper. Used `Array.isArray(value) ? value[0] : value` for Slider onValueChange.
- **Files modified:** src/components/jobs/filter-dropdown.tsx, src/components/jobs/radius-filter.tsx
- **Verification:** `npx tsc --noEmit` passes, `npx next build` succeeds
- **Committed in:** 2bcb898 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** API adaptation necessary for shadcn v5 compatibility. No scope creep.

## Issues Encountered
None beyond the shadcn v5 API differences noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Search & filter phase complete - all filter UI and backend wiring done
- Ready for Phase 5 (Freshness) - staleness indicators, verification checks
- Filter URL state enables deep linking and bookmark-friendly filter URLs

## Self-Check: PASSED

All 8 key files verified present. All 3 task commits verified in git log.

---
*Phase: 04-search-filters*
*Completed: 2026-03-11*
