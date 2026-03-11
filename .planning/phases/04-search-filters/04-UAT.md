---
status: complete
phase: 04-search-filters
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-03-11T00:20:00Z
updated: 2026-03-11T00:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Keyword Search
expected: On the Jobs page, type a keyword (e.g., "math") into the search input. After a brief debounce delay, the job list updates to show only jobs matching that keyword in title or description.
result: pass

### 2. School Type Filter
expected: Click the school type filter dropdown. A popover opens showing school type options (e.g., Public, Charter, Private). Select one or more types. The job list updates to show only jobs from those school types.
result: pass

### 3. Grade Band Filter
expected: Click the grade band filter dropdown. Select one or more grade bands (e.g., Elementary, Middle, High). The job list updates to show only jobs matching those grade levels.
result: pass

### 4. Subject Area Filter
expected: Click the subject area filter dropdown. Select one or more subjects. The job list updates to show only jobs in those subject areas.
result: pass

### 5. Certification Filter
expected: Click the certification filter dropdown. Select one or more certification types. The job list updates to show only jobs requiring those certifications.
result: pass

### 6. Radius / Location Filter
expected: Click the location/radius filter. Enter a PA zip code and adjust the radius slider. The job list updates to show only jobs within that radius of the zip code.
result: pass

### 7. Active Filter Chips
expected: After selecting filters, badge chips appear showing each active filter. Clicking the X on a chip removes that filter and updates results. A "Clear All" button removes all filters at once.
result: pass

### 8. URL State Persistence
expected: Apply several filters, then refresh the page (Cmd+R). The filters remain applied in the UI and the same filtered results are displayed. The URL contains query parameters reflecting the active filters.
result: pass

### 9. Empty State
expected: Apply a combination of very restrictive filters that matches no jobs. The page shows a contextual empty state message instead of a blank list.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
