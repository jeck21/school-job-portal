---
phase: 03-job-browsing-core
verified: 2026-03-10T18:50:00Z
status: human_needed
score: 9/9 must-haves verified
human_verification:
  - test: "Open /jobs and confirm list renders with count header and compact two-line rows"
    expected: "Page shows 'X open positions' header and rows with Title · School · Location on line 1, badge + 'Posted X ago' on line 2"
    why_human: "Cannot render Next.js server components programmatically; visual layout needs confirmation"
  - test: "Click a job row from /jobs and confirm modal opens with URL changing to /jobs/[id]"
    expected: "Shadcn Dialog opens overlaying the list page; browser URL updates to /jobs/[id]; X button or outside-click returns to /jobs"
    why_human: "Next.js parallel-route interception behavior requires a running browser to verify"
  - test: "Navigate directly to /jobs/[id] (copy URL into new tab)"
    expected: "Full-page detail renders with all fields, no modal chrome, with SEO title in browser tab"
    why_human: "SSR fallback path only exercisable in a live browser session"
  - test: "Click 'View Original Posting' on a job detail"
    expected: "Original PAREAP posting opens in a new browser tab"
    why_human: "target='_blank' behavior requires browser; link target confirmed in code but actual navigation needs visual check"
  - test: "Click 'Report an issue' dropdown and select a reason"
    expected: "Dropdown shows three options; after selection button briefly shows 'Reported' with check icon then resets"
    why_human: "Server action invocation and UI state transition requires live interaction"
---

# Phase 3: Job Browsing Core Verification Report

**Phase Goal:** Educators can browse all ingested jobs and view details without any filters
**Verified:** 2026-03-10T18:50:00Z
**Status:** human_needed (all automated checks passed; live browser interaction needed for UI behavior)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                       | Status     | Evidence                                                                                           |
|----|---------------------------------------------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------|
| 1  | User sees a list of all aggregated job postings on the main search page                     | VERIFIED   | `src/app/jobs/page.tsx` calls `getJobs(0, 25)`, renders `<JobList>` or empty state                |
| 2  | User can click a job to see its detail page with title, school, location, salary, description, and source info | VERIFIED   | `job-detail.tsx` renders title, school name, location, salary_raw, description, school_type badge |
| 3  | User can click through from the detail page to the original posting to apply               | VERIFIED   | `job-detail.tsx` line 120–128: `<a href={job.url} target="_blank" rel="noopener noreferrer">View Original Posting</a>` |
| 4  | Each job displays when it was first posted and when it was last verified                    | VERIFIED   | `job-detail.tsx` lines 92–97 render `formatDateDisplay(job.first_seen_at)` and `formatDateDisplay(job.last_verified_at)` |

**Score:** 4/4 phase-goal truths verified

---

### Plan 02 Must-Haves (Full Truth Set)

| #  | Truth                                                              | Status   | Evidence                                                                                          |
|----|--------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------|
| 1  | User sees a list of all active job postings sorted newest first    | VERIFIED | `getJobs` orders by `first_seen_at DESC`; `jobs/page.tsx` server-renders initial batch           |
| 2  | User sees total count header showing number of open positions      | VERIFIED | `job-list.tsx` line 43: `{totalCount} open position{totalCount !== 1 ? "s" : ""}`               |
| 3  | User can load more jobs in batches of 25                           | VERIFIED | `job-list.tsx` `loadMore()` calls `getJobs(jobs.length, 25)` and appends; hidden when exhausted |
| 4  | User can click a job row to open a modal with full details         | VERIFIED | `job-row.tsx` wraps in `<Link href={/jobs/${job.id}}>` triggering intercepting route             |
| 5  | Modal URL is shareable at /jobs/[id] and works on direct navigation | VERIFIED | `@modal/(.)jobs/[id]/page.tsx` intercepts; `jobs/[id]/page.tsx` is the SSR fallback              |
| 6  | User can click 'View Original Posting' to open original in new tab | VERIFIED | `job-detail.tsx`: `<a href={job.url} target="_blank" rel="noopener noreferrer">`                 |
| 7  | User sees posted date on list rows and both dates in modal         | VERIFIED | `job-row.tsx` uses `formatRelativeDate`; `job-detail.tsx` uses `formatDateDisplay` for both      |
| 8  | User can report an issue with a job via dropdown                   | VERIFIED | `report-button.tsx` has DropdownMenu with 3 items calling `reportJob` server action              |
| 9  | Empty state shows friendly message when no jobs exist              | VERIFIED | `jobs/page.tsx` lines 15–26 render Briefcase icon + "No job listings yet" copy                   |

**Score:** 9/9 must-haves verified

---

### Required Artifacts

| Artifact                                        | Provides                                       | Exists | Substantive | Wired   | Status      |
|-------------------------------------------------|------------------------------------------------|--------|-------------|---------|-------------|
| `src/lib/queries/get-jobs.ts`                   | Paginated active jobs query with school join   | Yes    | Yes (33 lines, real Supabase query) | Yes (imported by jobs/page.tsx and job-list.tsx) | VERIFIED |
| `src/lib/queries/get-job-detail.ts`             | Single job detail query                        | Yes    | Yes (29 lines, real Supabase query) | Yes (imported by both route pages) | VERIFIED |
| `src/lib/format-date.ts`                        | Relative + absolute date formatting            | Yes    | Yes (35 lines, 3 exported functions) | Yes (used in job-row.tsx and job-detail.tsx) | VERIFIED |
| `src/lib/actions/report-job.ts`                 | Server action to submit a report flag          | Yes    | Yes (20 lines, real Supabase insert) | Yes (imported by report-button.tsx) | VERIFIED |
| `supabase/migrations/00003_report_flags.sql`    | report_flags table schema                      | Yes    | Yes (`CREATE TABLE report_flags` with constraints) | N/A (migration) | VERIFIED |
| `src/app/layout.tsx`                            | Root layout with modal slot                    | Yes    | Yes (modal prop + `{modal}` rendered) | Yes | VERIFIED |
| `src/app/@modal/default.tsx`                    | Default null for modal slot                    | Yes    | Yes (returns null) | Yes | VERIFIED |
| `src/app/@modal/(.)jobs/[id]/page.tsx`          | Intercepting route for job detail modal        | Yes    | Yes (calls getJobDetail, renders JobDetailModal) | Yes | VERIFIED |
| `src/app/jobs/page.tsx`                         | Job list page with server-rendered initial batch | Yes  | Yes (calls getJobs, renders JobList or empty state) | Yes | VERIFIED |
| `src/app/jobs/[id]/page.tsx`                    | Full job detail page for direct navigation/SEO | Yes    | Yes (calls getJobDetail, renders JobDetail, generateMetadata) | Yes | VERIFIED |
| `src/components/jobs/job-list.tsx`              | Client component with load-more state          | Yes    | Yes (useState, loadMore with getJobs call, count header) | Yes | VERIFIED |
| `src/components/jobs/job-row.tsx`               | Compact two-line job row component             | Yes    | Yes (Link, two-line layout, badge + date) | Yes | VERIFIED |
| `src/components/jobs/job-detail.tsx`            | Shared job detail content                      | Yes    | Yes (title, school, location, dates, salary, description, apply CTA, report) | Yes | VERIFIED |
| `src/components/jobs/job-detail-modal.tsx`      | Dialog wrapper for job detail                  | Yes    | Yes (Dialog open, onOpenChange router.back(), JobDetail asModal) | Yes | VERIFIED |
| `src/components/jobs/report-button.tsx`         | Report issue dropdown button                   | Yes    | Yes (DropdownMenu, 3 items, reportJob call, reported state) | Yes | VERIFIED |
| `vitest.config.ts`                              | Vitest configuration with path aliases         | Yes    | Existed pre-phase (no changes needed) | Yes | VERIFIED |

---

### Key Link Verification

| From                                         | To                              | Via                          | Status   | Evidence                                                           |
|----------------------------------------------|---------------------------------|------------------------------|----------|--------------------------------------------------------------------|
| `src/lib/queries/get-jobs.ts`                | supabase server client          | `createClient` import        | WIRED    | Line 3: `import { createClient } from "@/lib/supabase/server"`    |
| `src/lib/queries/get-job-detail.ts`          | supabase server client          | `createClient` import        | WIRED    | Line 3: `import { createClient } from "@/lib/supabase/server"`    |
| `src/app/jobs/page.tsx`                      | `src/lib/queries/get-jobs.ts`   | server component import      | WIRED    | Line 2: `import { getJobs } from "@/lib/queries/get-jobs"`        |
| `src/components/jobs/job-list.tsx`           | `src/lib/queries/get-jobs.ts`   | load more call               | WIRED    | Line 7 + line 34: imports and calls `getJobs(jobs.length, 25)`    |
| `src/app/@modal/(.)jobs/[id]/page.tsx`       | `src/lib/queries/get-job-detail.ts` | server component import  | WIRED    | Line 2: `import { getJobDetail } from "@/lib/queries/get-job-detail"` |
| `src/app/jobs/[id]/page.tsx`                 | `src/lib/queries/get-job-detail.ts` | server component import  | WIRED    | Line 2: `import { getJobDetail } from "@/lib/queries/get-job-detail"` |
| `src/components/jobs/job-detail.tsx`         | `job.url`                       | Apply CTA anchor tag         | WIRED    | Lines 120–128: `<a href={job.url} target="_blank" ...>`            |
| `src/components/jobs/report-button.tsx`      | `src/lib/actions/report-job.ts` | server action invocation     | WIRED    | Line 12 import + line 21: `await reportJob(jobId, reason)`         |

---

### Requirements Coverage

| Requirement | Source Plan   | Description                                                           | Status    | Evidence                                                                                 |
|-------------|---------------|-----------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------|
| SRCH-01     | 03-01, 03-02  | User can browse all aggregated PA educator job listings               | SATISFIED | `jobs/page.tsx` fetches and displays all active jobs via `getJobs`                       |
| SRCH-09     | 03-02         | User can view job detail with title, school, location, salary, description, source info | SATISFIED | `job-detail.tsx` renders all fields; modal + full-page paths both exist |
| SRCH-10     | 03-02         | User can click through to original posting to apply                   | SATISFIED | `<a href={job.url} target="_blank">` in `job-detail.tsx` line 120                       |
| SRCH-11     | 03-01, 03-02  | User can see when a job was first posted and last verified             | SATISFIED | Both dates rendered via `formatDateDisplay` in `job-detail.tsx` lines 92–97             |

No orphaned requirements: REQUIREMENTS.md maps exactly SRCH-01, SRCH-09, SRCH-10, SRCH-11 to Phase 3.

---

### Anti-Patterns Found

| File                                    | Line | Pattern                              | Severity | Impact                                                                 |
|-----------------------------------------|------|--------------------------------------|----------|------------------------------------------------------------------------|
| `src/components/jobs/job-detail.tsx`    | 52   | `districtName` assigned but never used | Warning  | ESLint `@typescript-eslint/no-unused-vars` — CTA label changed to "View Original Posting" during verification; variable is dead code. Does not block goal. |

No blocker anti-patterns found. Build succeeds cleanly. The unused `districtName` variable is a leftover from the plan's original "Apply at [District Name]" label that was changed during the visual verification checkpoint. It is a warning-level item only.

---

### Human Verification Required

The following items cannot be verified programmatically and require a running browser:

#### 1. Job list renders with count header and compact rows

**Test:** Start dev server (`npm run dev -- -p 3003`) and visit http://localhost:3003/jobs
**Expected:** Page shows "X open positions" header; job rows render in compact two-line format (Title · School · Location on line 1, badge + "Posted X ago" on line 2); alternating row background colors visible
**Why human:** Next.js server components and CSS layout cannot be verified without rendering

#### 2. Modal interception on job row click

**Test:** From the /jobs list, click any job row
**Expected:** Shadcn Dialog opens as an overlay with job details; browser URL updates to /jobs/[id]; closing the dialog (X or outside click) returns to /jobs without full page reload
**Why human:** Next.js parallel-route and intercepting-route interception is a runtime browser behavior

#### 3. Direct navigation to /jobs/[id]

**Test:** Copy a /jobs/[id] URL and paste into a new browser tab
**Expected:** Full-page job detail renders (not a modal) with SEO title in the browser tab matching the job title; layout uses max-w-2xl centered container
**Why human:** SSR fallback only observable in live browser

#### 4. Apply CTA opens in new tab

**Test:** Inside the job detail (modal or full page), click "View Original Posting"
**Expected:** Original PAREAP posting URL opens in a new browser tab; current tab stays on /jobs/[id]
**Why human:** `target="_blank"` behavior requires a browser session

#### 5. Report dropdown interaction

**Test:** On a job detail, click "Report an issue" and select "Link is broken"
**Expected:** Dropdown shows three items; after selecting, button briefly shows "Reported" with a check icon, then resets to "Report an issue" after ~2 seconds
**Why human:** Server action invocation and UI state feedback requires live interaction

---

## Gaps Summary

No gaps found. All 9 must-haves are verified at all three levels (exists, substantive, wired). All 4 requirement IDs are satisfied. Build passes. 13 unit tests pass. The 5 human verification items above are standard UI/interaction checks that cannot be automated — all supporting code is correctly implemented.

---

_Verified: 2026-03-10T18:50:00Z_
_Verifier: Claude (gsd-verifier)_
