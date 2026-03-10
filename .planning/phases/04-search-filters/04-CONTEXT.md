# Phase 4: Search & Filters - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Educators can narrow jobs using keyword search and all filter types, individually or combined. This phase delivers a search bar, filter panel with dropdowns, radius search with geocoding, and URL-based filter state. No data enrichment (Phase 6 populates missing fields), no new sources, no user accounts.

</domain>

<decisions>
## Implementation Decisions

### Filter panel layout
- Collapsible top bar with horizontal dropdown row — not sidebar or drawer
- Search bar sits above filter dropdowns (full width, prominent)
- Filter dropdowns in a row below search: Type, Grade, Zip+Radius, Subject, Salary, Cert
- Filters apply instantly on selection (no "Apply" button)
- "Clear all" link to reset all filters at once
- Filter state syncs to URL query params (e.g., /jobs?type=public&grade=elementary&q=math) — shareable, bookmarkable, supports browser back/forward

### Keyword search
- Debounced live search (~300ms after typing stops) — results update in real-time
- Searches against: job title, school name, and location text — NOT full description
- No autocomplete dropdown — live-filtered results provide immediate feedback
- Search input has a search icon and clear button

### Location/radius search
- Zip code text input (5-digit PA zip) — no browser geolocation
- Custom radius slider (range ~5-150 miles) — user drags to desired distance
- Zip + slider sit inline in the filter dropdown row
- When radius filter is active, jobs without geocoded locations are hidden
- All jobs should have geocoded locations; geocoding happens in this phase (deferred from Phase 2)
- Remote/Cyber positions: add a "Remote/Cyber" option — these may not have a physical location and should be findable via filter regardless of radius

### School type filter
- Hardcoded list: Public, Charter, Private, IU, Cyber
- Multi-select (user can check multiple types)
- "Cyber" covers virtual/remote schools without physical locations

### Grade band filter
- Hardcoded list: PreK, Elementary, Middle, High
- Multi-select

### Subject/position filter
- Options tied to official PA teaching certification subject areas (PDE certification categories)
- Researcher should pull the PDE certification list and propose groupings
- Some categories may need collapsing (too granular) or expanding (too broad) — finalize during planning
- Multi-select

### Salary filter
- "Salary Info Included" toggle — shows only jobs where salary_mentioned is true
- Simple boolean toggle, not a range slider (salary extraction is Phase 6)

### Certification filter
- Filter by PA certification type required
- Hardcoded list based on PDE certification types
- Multi-select

### Handling missing data
- Global "Include unspecified postings" toggle
- When ON (default): jobs missing the filtered field still appear in results
- When OFF: only jobs with the specific field populated and matching are shown
- This applies across all filters (grade, subject, cert, school type)

### Claude's Discretion
- Active filter chips/tags display (whether to show removable chips below filter bar)
- Exact slider component design and range increments
- Filter dropdown component styling and interaction patterns
- Loading/transition states when filters change
- How "Clear all" interacts with search text
- Exact debounce timing
- Mobile layout adaptation for the filter bar (general mobile polish is Phase 8, but basic usability expected)

</decisions>

<specifics>
## Specific Ideas

- Subject areas should mirror PA teaching certifications from PDE — this ensures the filter categories are meaningful and recognizable to PA educators
- Remote/Cyber is both a school type AND a way to handle locationless positions — Cyber schools are a real PA category (like PA Cyber Charter School)
- The "Include unspecified postings" toggle is important because early on, many jobs won't have all fields populated — users shouldn't miss relevant postings due to data gaps
- Zip code only (no geolocation) keeps it simple and avoids invasive browser permission prompts

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/queries/get-jobs.ts`: Server-side query with offset/limit — needs filter parameters added
- `src/components/jobs/job-list.tsx`: Client component with load-more pattern — needs to pass filter state
- `src/app/jobs/page.tsx`: Jobs page shell — needs search bar and filter components added
- `src/components/ui/badge.tsx`, `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `skeleton.tsx`: shadcn/ui components available
- `src/lib/supabase/server.ts`: Server-side Supabase client for queries

### Established Patterns
- Server-side queries in `src/lib/queries/` with `"use server"` directive
- Supabase JS client for all database operations
- Tailwind CSS with oklch color format (shadcn/ui v4)
- Forest & Ember theme: `--primary` = forest green, `--cta` = warm amber
- Parallel route modal pattern for job details (`@modal` slot + intercepting routes)

### Integration Points
- `jobs` table already has: `school_type TEXT`, `grade_band TEXT[]`, `subject_area TEXT[]`, `salary_mentioned BOOLEAN`, `certifications TEXT[]`, `location GEOGRAPHY(POINT, 4326)` — schema is ready
- `schools` table has `location GEOGRAPHY(POINT, 4326)` — can join for geocoded school locations
- PostGIS extension already enabled — `ST_DWithin` queries ready to use for radius search
- URL query params need to integrate with Next.js App Router `searchParams`
- Geocoding migration needed: batch geocode existing jobs/schools using zip codes or addresses

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-search-filters*
*Context gathered: 2026-03-10*
