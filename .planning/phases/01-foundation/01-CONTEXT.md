# Phase 1: Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployed, empty shell exists with database schema and UI skeleton ready for data. The portal is publicly accessible, has a branded landing page, professional styling, and database tables for jobs, sources, schools, and districts. No job data or functional features yet — just the foundation everything else builds on.

</domain>

<decisions>
## Implementation Decisions

### Visual identity
- Bold and distinctive but credible — stands out from typical job boards while feeling authoritative
- Dark slate + electric blue color palette — confident, modern, separates from light-blue-and-white job board sea
- Geometric sans-serif typography (Inter, Outfit, or Plus Jakarta Sans family)
- Lucide icons throughout
- Modern rounded corners (8-12px radius) on cards and buttons
- Linear.app as the primary style reference — dark, crisp, premium feel with subtle polish
- Presentable MVP polish level — clean and professional enough to show, but pixel-perfection saved for Phase 8

### Landing page
- Value proposition hero with matchmaking framing — "connecting the right educators with the right jobs" (or similar)
- Hero messaging highlights value for BOTH audiences: educators finding the right role AND districts/schools finding the right candidates
- Dual-audience layout below hero: parallel "For Educators" and "For Schools/Districts" sections explaining benefits to each
- Stats section with placeholders that will show real data once jobs are ingested (e.g., "X+ active listings", "X sources aggregated") — hidden or show zeros gracefully until data exists

### Navigation & site structure
- Full nav skeleton from Phase 1: Home, Jobs, About, For Schools
- Unbuilt pages (About, For Schools) show styled "Coming Soon" pages with brief description of what's planned
- Jobs page exists as a shell ready for Phase 3 to populate

### Temporary branding
- Working title: "PA Educator Jobs" used everywhere
- Site name, tagline, and meta info centralized in a single config file — one-line change when real brand name is chosen
- Header shows icon (simple geometric mark — briefcase, graduation cap, or abstract) + styled text "PA Educator Jobs"

### Claude's Discretion
- Color mode default (dark vs light vs system preference) — choose what fits the target audience best
- Header layout (logo left + nav center + CTA right, or simpler arrangement)
- Footer design (substantial multi-column vs minimal) — match the presentable MVP level
- Exact color values for the dark slate + electric blue palette
- Loading skeleton and transition designs
- Database schema structure (tables, columns, relationships, multi-state-ready architecture)
- Deployment configuration and Supabase setup
- Specific geometric sans-serif font choice within the family

</decisions>

<specifics>
## Specific Ideas

- "I like the Linear.app style" — dark backgrounds, crisp typography, subtle glows and gradients, premium feel
- Matchmaking positioning: "connecting the right educators with the right jobs" — not just another job aggregator, but a bridge between both sides
- The portal should highlight value for individual educators AND for schools/districts from the very first page
- Stats should feel real, not fake — use placeholders that populate with actual data, don't fabricate numbers

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the patterns all future phases follow

### Integration Points
- Database schema must support Phase 2 (PAREAP scraper writes jobs) and Phase 3 (UI reads jobs)
- Nav shell must accommodate pages added in Phases 3, 7, and 8
- Site config must be importable by all pages for consistent branding

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-10*
