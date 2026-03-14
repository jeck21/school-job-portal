---
phase: 09-operations-launch
plan: 03
subsystem: ui, infra
tags: [error-pages, favicon, pwa, security-headers, csp, next.js]

requires:
  - phase: 01-foundation
    provides: Forest & Ember theme CSS variables (--primary, --cta, --cta-foreground)
  - phase: 09-operations-launch/02
    provides: Vercel Analytics integration (CSP must allow its domains)
provides:
  - Custom branded 404 page with navigation to /jobs
  - Custom error boundary with retry functionality
  - Dynamic favicon and apple touch icon via ImageResponse
  - PWA manifest with app metadata
  - Security headers (CSP, HSTS, X-Frame-Options) on all routes
affects: [deployment, all-routes]

tech-stack:
  added: []
  patterns:
    - "next/og ImageResponse for dynamic icon generation"
    - "Security headers via next.config.ts headers() function"
    - "Link + buttonVariants pattern for button-styled links (no asChild)"

key-files:
  created:
    - src/app/not-found.tsx
    - src/app/error.tsx
    - src/app/icon.tsx
    - src/app/apple-icon.tsx
    - src/app/manifest.ts
  modified:
    - next.config.ts

key-decisions:
  - "Link + buttonVariants for button-styled links (Base UI Button lacks asChild)"
  - "CSP unsafe-inline for scripts required by Next.js hydration"
  - "Geolocation=(self) in Permissions-Policy for radius filter feature"

patterns-established:
  - "ImageResponse icon generation: forest green bg with white PA text"
  - "Error pages use buttonVariants with Link instead of Button with asChild"

requirements-completed: [UI-03]

duration: 4min
completed: 2026-03-14
---

# Phase 9 Plan 3: Launch Polish Summary

**Custom 404/error pages with Forest & Ember branding, dynamic favicons via ImageResponse, and security headers (CSP, HSTS, X-Frame-Options) on all routes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T22:09:29Z
- **Completed:** 2026-03-14T22:13:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Branded 404 page with "Browse Jobs" CTA and Home link matching Forest & Ember theme
- Error boundary with retry button and console error logging for debugging
- Dynamic 32x32 favicon and 180x180 apple touch icon with forest green "PA" design
- PWA manifest serving app metadata at /manifest.webmanifest
- Security headers on all routes: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## Task Commits

Each task was committed atomically:

1. **Task 1: Custom error pages and favicon/icons** - `52b78ab` (feat)
2. **Task 2: Security headers in next.config.ts** - `7e39ac9` (feat)

## Files Created/Modified
- `src/app/not-found.tsx` - Branded 404 page with navigation to /jobs and home
- `src/app/error.tsx` - Client error boundary with retry and home navigation
- `src/app/icon.tsx` - Dynamic 32x32 favicon via ImageResponse
- `src/app/apple-icon.tsx` - Dynamic 180x180 apple touch icon via ImageResponse
- `src/app/manifest.ts` - PWA manifest with app name, icons, and theme color
- `next.config.ts` - Security headers configuration for all routes

## Decisions Made
- Used Link + buttonVariants pattern instead of Button with asChild (Base UI Button primitive doesn't support asChild prop)
- CSP includes unsafe-inline for script-src (required by Next.js for hydration inline scripts)
- Permissions-Policy allows geolocation for self (needed for radius filter feature)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Button asChild usage in error pages**
- **Found during:** Task 1 (Custom error pages)
- **Issue:** Plan specified `<Button asChild>` wrapping `<Link>` but Base UI Button primitive doesn't support asChild prop
- **Fix:** Used `Link` with `cn(buttonVariants())` pattern matching existing codebase convention (header.tsx, hero.tsx)
- **Files modified:** src/app/not-found.tsx, src/app/error.tsx
- **Verification:** Build passes without type errors
- **Committed in:** 52b78ab (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Followed existing codebase pattern for button-styled links. No scope creep.

## Issues Encountered
None beyond the asChild deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All launch polish complete: error pages, icons, manifest, security headers
- Application is production-hardened with security headers
- Ready for final plan 09-04

---
*Phase: 09-operations-launch*
*Completed: 2026-03-14*
