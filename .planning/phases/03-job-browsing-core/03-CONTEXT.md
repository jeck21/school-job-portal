# Phase 3: Job Browsing Core - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Educators can browse all ingested jobs and view details without any filters. This phase delivers a browsable job list page, a detail modal with full job info, and click-through to the district application page. No search, no filters, no user accounts — just browsing and viewing.

</domain>

<decisions>
## Implementation Decisions

### Job list layout
- Compact list rows (single column, stacked) — not cards or grid
- Two-line rows: Line 1 = Title · School · Location; Line 2 = School type badge + "Posted X ago"
- Total count header at top: "147 open positions"
- Default sort: newest first (by first_seen_at descending)

### Job detail view
- Dialog/modal overlay — not a separate page navigation
- Clicking a row opens a centered modal with backdrop; list is preserved behind it
- URL updates to /jobs/[id] when modal opens (shareable, bookmarkable, SEO-friendly)
- Visiting /jobs/[id] directly opens the modal on top of the list
- Close with X button or clicking outside the modal

### Apply button
- CTA label: "Apply at [District Name]" — dynamic, shows where the user is going
- Links to the district's application page (not PAREAP or other scrape source)
- Opens in a new tab
- The district application URL is also used for freshness/verification checks

### Loading behavior
- "Load more" button at bottom of list — not pagination or infinite scroll
- 25 jobs per batch (initial load and each subsequent click)
- Keeps user's scroll position; appends new results below

### Date display
- Both relative AND absolute dates: "Posted 2 days ago (Mar 5, 2026)"
- List rows show posted date only (relative format for scannability)
- Detail modal shows both posted and last verified dates (both with relative + absolute)

### Source attribution
- No source attribution displayed — users don't need to know where we scraped from
- Only add attribution if legally required by a source's ToS
- Apply link goes to district page, not source page

### Report/feedback mechanism
- Quick "Report an issue" link in the detail modal
- One-click dropdown with options: "Link is broken" / "Job is filled/expired" / "Other"
- No login required to report
- Flags stored in DB to trigger review of the posting

### Empty state
- Friendly message with icon: "No job listings yet — we're actively collecting PA educator positions. Check back soon!"
- Honest and sets expectations, not marketing fluff

### Claude's Discretion
- Loading skeleton/spinner design while jobs fetch
- Exact row hover/active states
- Modal sizing and scroll behavior for long descriptions
- Report flag DB schema and review workflow details
- Exact school type badge styling (colors per type)
- Mobile responsiveness of list rows and modal (general responsiveness is Phase 8, but basic usability expected)

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants the apply link to go to the district application page, NOT the scrape source (PAREAP). The district URL is where applicants actually need to go.
- "Load more" chosen because once filters exist (Phase 4), result sets will be small enough that pagination feels overkill.
- No source attribution by design — it adds no value for the user since the apply link goes directly to the district.
- Report mechanism allows crowdsourced freshness feedback from actual job seekers — complements the automated freshness checks planned in Phase 6.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/card.tsx`: Card component with Header/Content/Footer/Action slots — won't be used for list rows (compact rows chosen) but may inform modal styling
- `src/components/ui/button.tsx`: Button component for CTA and Load More
- `src/lib/supabase/client.ts` and `server.ts`: Supabase client helpers for data fetching
- `src/lib/site-config.ts`: Centralized site config (nav includes Jobs link already)
- `src/app/jobs/page.tsx`: Existing shell page — ready to replace with real list

### Established Patterns
- Tailwind CSS with oklch color format (shadcn/ui v4)
- Forest & Ember theme: `--primary` = forest green, `--cta` = warm amber
- Lucide icons throughout
- Plus Jakarta Sans font
- Dark mode default with system override

### Integration Points
- `jobs` table: main data source — title, description, url, location_raw, city, state, school_type, first_seen_at, last_verified_at, is_active
- `schools` table: joined for school name and district_name
- `sources` table: not displayed but used internally
- `/jobs` route exists as shell — will be replaced with list + modal
- Need new `/jobs/[id]` intercepted route for modal URL support
- Need new DB table or column for user-submitted report flags

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-job-browsing-core*
*Context gathered: 2026-03-10*
