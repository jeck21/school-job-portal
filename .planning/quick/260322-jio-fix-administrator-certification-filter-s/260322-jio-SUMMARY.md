# Quick Task 260322-jio: Summary

**Task:** Fix Administrator certification filter showing no jobs + fix job popup navigation loop between tabs
**Date:** 2026-03-22
**Status:** Complete

## Changes Made

### Bug 1: Administrator Certification Filter (and all cert type filters)

**Root cause:** The certification filter UI sends category values like `"administrative"` to the RPC, but the database stores canonical PDE cert names like `"Principal"`, `"Superintendent"`. The SQL array overlap operator (`&&`) never matched because the strings are completely different.

**Fix:** Added `CERT_TYPE_TO_NAMES` mapping in `src/lib/filter-options.ts` that maps each cert type category to its canonical PDE names. The `searchJobs` function in `src/lib/queries/search-jobs.ts` now expands filter selections to canonical names before passing to the RPC.

**Files:**
- `src/lib/filter-options.ts` — Added cert type to canonical name mapping
- `src/lib/queries/search-jobs.ts` — Added expansion logic before RPC call
- `tests/queries/search-jobs.test.ts` — Updated tests for cert expansion

### Bug 2: Job Modal Close Navigation

**Root cause:** The modal used `router.back()` which navigates to the previous history entry. After tab-switching (Jobs → open modal → About → Jobs), `router.back()` goes to `/about` instead of closing the modal.

**Fix:** Kept `router.back()` as primary close (it's the only way to properly clear Next.js parallel route state). Added a `useEffect` fallback that detects stale modal state (pathname is `/jobs` but modal still mounted) and forces a hard navigation to clear it. Used custom close button instead of base-ui Dialog.Close which wasn't triggering navigation with controlled dialogs.

**Files:**
- `src/components/jobs/job-detail-modal.tsx` — New close logic with stale-state fallback

## Commits

- `ceabb70` — Map certification type filters to canonical PDE cert names
- `c5a89a1` — Replace router.back() with router.push(/jobs) in modal close
- `4ddcbbf` — Add missing Special Ed/ESL/Gifted to instructional mapping + update tests
- `60339ed` — Use custom close button to bypass base-ui dialog close issues
- `0b87f85` — Use router.back() with stale-state fallback for reliable close
