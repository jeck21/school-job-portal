---
phase: quick-fix
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/filter-options.ts
  - src/lib/queries/search-jobs.ts
  - supabase/migrations/00009_verified_filter.sql
  - src/components/jobs/job-detail-modal.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Selecting 'Administrative' certification filter returns jobs with Principal/Superintendent/Supervisor certifications"
    - "Selecting any certification type filter returns matching jobs instead of zero results"
    - "Closing the job detail modal navigates to /jobs even when opened directly or from external link"
    - "No navigation loop occurs when opening and closing job modals"
  artifacts:
    - path: "src/lib/filter-options.ts"
      provides: "Certification type to canonical cert name mapping"
    - path: "src/lib/queries/search-jobs.ts"
      provides: "Expanded cert_types before passing to RPC"
    - path: "src/components/jobs/job-detail-modal.tsx"
      provides: "Reliable modal close navigation"
  key_links:
    - from: "src/lib/filter-options.ts"
      to: "src/lib/queries/search-jobs.ts"
      via: "CERT_TYPE_TO_NAMES mapping import"
      pattern: "CERT_TYPE_TO_NAMES"
    - from: "src/components/jobs/job-detail-modal.tsx"
      to: "/jobs"
      via: "router.push fallback"
      pattern: "router\\.push.*jobs"
---

<objective>
Fix two bugs: (1) Certification type filters (Administrative, Supervisory, etc.) return zero results because filter values don't match the canonical cert names stored in the database. (2) Job detail modal close navigation uses router.back() which causes a navigation loop when there's no app history (e.g., direct link opened in new tab).

Purpose: Users can actually filter jobs by certification type, and the modal close behavior is always predictable.
Output: Updated filter-options, search-jobs query, and modal component.
</objective>

<execution_context>
@/Users/cciu/.claude/get-shit-done/workflows/execute-plan.md
@/Users/cciu/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/filter-options.ts
@src/lib/queries/search-jobs.ts
@scripts/scrapers/lib/enrichment/pde-cert-taxonomy.ts
@supabase/migrations/00009_verified_filter.sql
@src/components/jobs/job-detail-modal.tsx

<interfaces>
<!-- The certification filter sends values from CERTIFICATION_TYPES (e.g., "administrative", "supervisory")
     but the database stores canonical PDE cert names from pde-cert-taxonomy.ts (e.g., "Principal", "Superintendent").
     The RPC does array overlap (&&) so these never match. -->

From src/lib/filter-options.ts:
```typescript
export const CERTIFICATION_TYPES = [
  { value: "instructional", label: "Instructional (Type 61)" },
  { value: "educational-specialist", label: "Educational Specialist (Type 31)" },
  { value: "administrative", label: "Administrative" },
  { value: "supervisory", label: "Supervisory" },
  { value: "career-technical", label: "Career & Technical" },
  { value: "emergency-permit", label: "Emergency Permit" },
  { value: "intern", label: "Intern Certificate" },
  { value: "not-required", label: "No Certification Required" },
] as const;
```

From scripts/scrapers/lib/enrichment/pde-cert-taxonomy.ts (canonical names stored in DB):
```typescript
// Administrative certs: "Principal", "Superintendent", "Supervisor"
// Teaching certs: "Mathematics", "English", "Biology", etc.
// Specialist certs: "School Counselor", "School Psychologist", etc.
```

From src/lib/queries/search-jobs.ts:
```typescript
cert_types: filters.cert?.length ? filters.cert : null,
// This passes ["administrative"] to the RPC which does j.certifications && cert_types
// But DB has ["Principal"] -- no overlap, zero results
```

From src/components/jobs/job-detail-modal.tsx:
```typescript
// Uses router.back() which fails when no app history exists
onOpenChange={(open) => {
  if (!open) { router.back(); }
}}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix certification type filter to map to canonical cert names</name>
  <files>src/lib/filter-options.ts, src/lib/queries/search-jobs.ts</files>
  <action>
In `src/lib/filter-options.ts`, add a mapping from certification TYPE values to arrays of canonical PDE cert names that belong to each type. The mapping must align with the categories in `pde-cert-taxonomy.ts`:

```typescript
export const CERT_TYPE_TO_NAMES: Record<string, string[]> = {
  "instructional": [
    "Mathematics", "English", "Biology", "Chemistry", "Physics",
    "General Science", "Earth and Space Science", "Social Studies",
    "Spanish", "French", "German", "Chinese", "Latin", "American Sign Language",
    "Elementary Education K-6", "Early Childhood Education PK-4",
    "Middle Level Education 4-8", "Art Education", "Music Education",
    "Theatre", "Dance", "Technology Education",
    "Health and Physical Education", "Health Education",
    "Environmental Education", "Citizenship Education",
    "Agriculture", "Family and Consumer Science",
  ],
  "educational-specialist": [
    "School Counselor", "School Nurse", "School Psychologist",
    "School Social Worker", "Speech-Language Pathologist",
    "Reading Specialist", "Library Science",
  ],
  "administrative": [
    "Principal", "Superintendent",
  ],
  "supervisory": [
    "Supervisor", "Special Education Supervisor", "Instructional Coach",
  ],
  "career-technical": [
    "Career and Technical Education", "Business, Computer, Information Technology",
  ],
  "emergency-permit": [],
  "intern": [],
  "not-required": [],
};
```

In `src/lib/queries/search-jobs.ts`, before passing `cert_types` to the RPC, expand the filter type values into canonical cert names using the mapping:

1. Import `CERT_TYPE_TO_NAMES` from `@/lib/filter-options`
2. Before the `supabase.rpc("search_jobs", ...)` call, if `filters.cert` has values, expand them:
   ```typescript
   // Expand cert type filter values to canonical PDE cert names
   let expandedCerts: string[] | null = null;
   if (filters.cert?.length) {
     const names = new Set<string>();
     for (const certType of filters.cert) {
       const mapped = CERT_TYPE_TO_NAMES[certType];
       if (mapped) {
         for (const name of mapped) names.add(name);
       }
     }
     expandedCerts = names.size > 0 ? Array.from(names) : null;
   }
   ```
3. Pass `expandedCerts` instead of the raw filter values: `cert_types: expandedCerts,`

Note: "emergency-permit", "intern", and "not-required" map to empty arrays because the PDE taxonomy doesn't have canonical names for these -- they represent certificate types that aren't extracted from job descriptions. When selected alone with "Include unspecified" on (the default), they will still show jobs with no certifications. When selected alone with "Include unspecified" off, they correctly show zero results (expected behavior -- no jobs are tagged with these).
  </action>
  <verify>
    <automated>cd /Users/cciu/Documents/Claude Code Repository/school-job-portal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Selecting "Administrative" in the certification filter passes ["Principal", "Superintendent"] to the RPC cert_types parameter instead of ["administrative"]. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Fix job detail modal close navigation loop</name>
  <files>src/components/jobs/job-detail-modal.tsx</files>
  <action>
Replace `router.back()` with a more reliable approach that avoids navigation loops when the modal is opened directly (no app history).

Update `job-detail-modal.tsx`:

1. Import `usePathname` from `next/navigation` (already using `useRouter`)
2. Change the `onOpenChange` handler to use `router.push('/jobs')` instead of `router.back()`:

```typescript
onOpenChange={(open) => {
  if (!open) {
    router.push("/jobs");
  }
}}
```

This is the correct fix because:
- The job detail modal is ONLY shown via the intercepting route `@modal/(.)jobs/[id]` which intercepts navigation from `/jobs` (the job list page).
- Using `router.push("/jobs")` always navigates to the correct destination regardless of history state.
- `router.back()` is fragile: if user opened `/jobs/[id]` directly in a new tab, `router.back()` navigates away from the app entirely or loops. If user navigated from the landing page to `/jobs` and clicks a job, `router.back()` works but `router.push("/jobs")` also works.
- With Next.js App Router, `router.push("/jobs")` from an intercepted modal correctly dismisses the modal and shows the jobs list.

Do NOT use `window.history.length` checks -- they're unreliable across browsers and include external page history.
  </action>
  <verify>
    <automated>cd /Users/cciu/Documents/Claude Code Repository/school-job-portal && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Modal close always navigates to /jobs. No navigation loop regardless of how the user arrived at the job detail modal.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed certification type filter mapping and job modal navigation</what-built>
  <how-to-verify>
    1. Start dev server: `npm run dev` (port 3003)
    2. Go to http://localhost:3003/jobs
    3. Open the "Certification" filter dropdown
    4. Select "Administrative" -- verify that results appear (jobs with Principal/Superintendent certifications) instead of "0 jobs found"
    5. Clear filter, select "Supervisory" -- verify results appear
    6. Clear all filters
    7. Click on any job to open the modal popup
    8. Close the modal (click X or click outside) -- verify it returns to /jobs cleanly
    9. Open a job modal, copy the URL (e.g., /jobs/some-uuid), open it in a NEW browser tab -- verify the full job page loads (not the modal)
    10. Go back to the original tab and verify no navigation loop occurred
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- Dev server starts without errors: `npm run dev`
- Certification type filters return matching jobs
- Modal close always navigates to /jobs
</verification>

<success_criteria>
- Administrative certification filter returns jobs (not zero results)
- All certification type filters correctly map to canonical PDE cert names
- Job modal close never causes navigation loops regardless of entry path
</success_criteria>

<output>
After completion, create `.planning/quick/260322-jio-fix-administrator-certification-filter-s/260322-jio-SUMMARY.md`
</output>
