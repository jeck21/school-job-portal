---
phase: 09-operations-launch
plan: 02
subsystem: infra
tags: [vercel-analytics, speed-insights, sitemap, json-ld, seo, og-metadata, isr]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Next.js app structure and layout"
  - phase: 03-job-browsing
    provides: "Job detail page and getJobDetail query"
provides:
  - "Vercel Analytics and SpeedInsights tracking"
  - "Custom event tracking for search and filter usage"
  - "Dynamic sitemap.xml with all active job URLs"
  - "JSON-LD JobPosting structured data on job detail pages"
  - "OG metadata on all key pages for social sharing"
  - "ISR revalidation on content pages"
affects: []

# Tech tracking
tech-stack:
  added: ["@vercel/analytics", "@vercel/speed-insights"]
  patterns: ["ISR revalidation exports", "JSON-LD structured data with XSS protection", "Custom analytics event tracking"]

key-files:
  created:
    - "src/app/sitemap.ts"
  modified:
    - "src/app/layout.tsx"
    - "src/app/jobs/[id]/page.tsx"
    - "src/app/page.tsx"
    - "src/app/about/page.tsx"
    - "src/app/coaching/page.tsx"
    - "src/lib/site-config.ts"
    - "src/components/jobs/search-filter-bar.tsx"
    - "src/components/jobs/filter-dropdown.tsx"

key-decisions:
  - "Custom events use @vercel/analytics track() -- silently no-op on Hobby plan, activate on Pro"
  - "JSON-LD uses .replace(/</g, '\\u003c') for XSS protection in dangerouslySetInnerHTML"
  - "Used job.city instead of job.schools?.city for JSON-LD addressLocality (schools join lacks city)"
  - "ISR revalidation: 1 hour for landing, 24 hours for about/coaching"

patterns-established:
  - "JSON-LD structured data pattern: build object, JSON.stringify with XSS escape, render as script tag"
  - "OG metadata pattern: openGraph object in generateMetadata or static metadata export"

requirements-completed: [INFRA-04, UI-03]

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 09 Plan 02: Analytics, SEO & Performance Summary

**Vercel Analytics with custom event tracking, dynamic sitemap, JSON-LD JobPosting structured data, and ISR content pages with OG metadata**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T22:01:28Z
- **Completed:** 2026-03-14T22:06:28Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Analytics and SpeedInsights components in root layout with custom search/filter event tracking
- Dynamic sitemap.xml serving all active job URLs plus static pages
- JSON-LD JobPosting structured data on every job detail page for Google Jobs
- OG metadata on landing, about, coaching, and job detail pages for social sharing
- ISR revalidation on content pages (1hr landing, 24hr about/coaching)
- Site config URL corrected to school-job-portal.vercel.app

## Task Commits

Each task was committed atomically:

1. **Task 1: Vercel Analytics and custom event tracking** - `75f4174` (feat)
2. **Task 2: Sitemap, JSON-LD, and OG metadata** - `1598da1` (feat)
3. **Task 3: Static generation and revalidation for content pages** - `e440960` (feat)

## Files Created/Modified
- `src/app/layout.tsx` - Added Analytics and SpeedInsights components
- `src/app/sitemap.ts` - Dynamic sitemap with static pages + all active jobs
- `src/app/jobs/[id]/page.tsx` - JSON-LD JobPosting structured data and OG metadata
- `src/app/page.tsx` - ISR revalidation (1hr) and full OG metadata
- `src/app/about/page.tsx` - ISR revalidation (24hr) and OG metadata
- `src/app/coaching/page.tsx` - ISR revalidation (24hr) and OG metadata
- `src/lib/site-config.ts` - Updated URL to school-job-portal.vercel.app
- `src/components/jobs/search-filter-bar.tsx` - Custom search event tracking
- `src/components/jobs/filter-dropdown.tsx` - Custom filter event tracking
- `src/lib/queries/get-monitoring-data.ts` - Fixed pre-existing type error (Rule 3)

## Decisions Made
- Custom events use `track()` from `@vercel/analytics` -- silently no-op on Hobby plan, activate on Pro ($20/mo)
- JSON-LD uses `.replace(/</g, '\\u003c')` for XSS protection in dangerouslySetInnerHTML
- Used `job.city` instead of `job.schools?.city` for JSON-LD addressLocality since schools join lacks city field
- ISR revalidation intervals: 1 hour for landing page (live stats), 24 hours for about/coaching (static content)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing type error in get-monitoring-data.ts**
- **Found during:** Task 1 (build verification)
- **Issue:** TypeScript error on line 109: `sources` type cast was invalid (`{ name: any; }[]` to `{ name: string }`)
- **Fix:** Added `unknown` intermediate cast: `row.sources as unknown as { name: string }`
- **Files modified:** `src/lib/queries/get-monitoring-data.ts`
- **Verification:** Build succeeds
- **Committed in:** `75f4174` (Task 1 commit)

**2. [Rule 1 - Bug] Used job.city instead of job.schools?.city for JSON-LD**
- **Found during:** Task 2 (JSON-LD implementation)
- **Issue:** Plan referenced `job.schools?.city` but schools join only selects `name, district_name` -- no city field
- **Fix:** Used `job.city` which is directly on the jobs table
- **Files modified:** `src/app/jobs/[id]/page.tsx`
- **Verification:** Build succeeds, no TypeScript errors
- **Committed in:** `1598da1` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Stale `.next` build cache caused webpack runtime error on first clean build attempt -- resolved by deleting `.next` directory

## User Setup Required
None - no external service configuration required. Vercel Analytics activates automatically on Vercel deployment.

## Next Phase Readiness
- Analytics infrastructure ready -- will begin tracking on next deploy
- SEO infrastructure complete -- Google can discover jobs via sitemap and structured data
- Ready for remaining 09-operations-launch plans

---
*Phase: 09-operations-launch*
*Completed: 2026-03-14*
