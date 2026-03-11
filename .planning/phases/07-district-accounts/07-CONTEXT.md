# Phase 7: District Accounts - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

School districts can create accounts, claim their scraped listings, manage postings (delist, create new, edit manual posts), and have public profile pages with verified status. This phase does NOT include payment/billing, analytics dashboards, or educator user accounts.

</domain>

<decisions>
## Implementation Decisions

### Account Verification
- Email domain validation as primary method: `.k12.pa.us` domains auto-verified on signup
- Non-.k12.pa.us emails (charters, IUs, private schools) can sign up but require manual approval
- Once manually verified, that domain is added to a whitelist for future auto-verification
- Multiple users per district allowed — anyone with a matching domain can create an account
- Signup flow: email + password with email confirmation link (Supabase Auth handles this)

### Listing Claim Process
- Auto-match on signup: when a district account is verified, system matches existing jobs by district_name/school_name
- Show matches for one-click "Claim All" confirmation (district reviews before claiming)
- Going forward, new scraped listings matching a verified district are auto-claimed and badged
- "Verified" badge shown on both job cards and detail pages (subtle checkmark + text, warm amber)

### Edit Permissions & Listing Management
- Districts CANNOT edit scraped posts — scraped data stays untouched
- Districts CAN soft-delete (delist) any claimed listing — scraped or manual
- Delisted listings hidden from portal but data kept; scraper won't re-add them
- Districts can re-list delisted posts (toggle, not permanent action)
- Districts CAN create new manual posts via structured form: title, description, school, grade band, subject area, salary info, application URL, deadline
- Manual posts are auto-verified (district-owned, no scraper involved)
- Districts CAN fully edit their own manually-created posts after publishing

### District Dashboard
- Simple tab-based layout: Active Listings, Delisted, Create New
- Each listing has Delist/Edit/View action buttons
- No analytics in Phase 7 — analytics behind paywall in future phase

### District Profile Page (Public)
- Shows district name, website link, and all open positions (verified badge on each)
- URL format: /districts/[slug-from-name] (SEO-friendly, auto-generated)
- Discoverable via: link from verified job listings + a /districts directory page listing all verified districts

### Claude's Discretion
- Exact domain matching/whitelisting implementation
- Auto-match algorithm for linking jobs to districts
- Dashboard UI layout and styling details
- Form validation patterns for manual post creation
- Profile page layout and card styling

</decisions>

<specifics>
## Specific Ideas

- "Delist" label instead of "Mark as Filled" — more generic, covers any reason a district wants to take a listing down
- Delist is a toggle (can re-list), not a permanent action
- District accounts are free initially — payment/billing comes in a later phase with a free trial period before paid plan begins

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts` + `server.ts`: SSR auth helpers already wired for Supabase Auth
- `src/components/ui/badge.tsx`: Badge component for "Verified" indicators
- `src/components/ui/card.tsx`: Card component for dashboard listing cards and profile page
- `src/components/ui/dialog.tsx`: Dialog for confirmation modals (claim, delist)
- `src/components/ui/input.tsx`, `textarea.tsx`, `label.tsx`: Form components for manual post creation
- `src/components/coming-soon.tsx`: Placeholder at `/for-schools` to be replaced with actual auth/dashboard

### Established Patterns
- Server-side queries in `src/lib/queries/` with "use server" pattern
- Server actions in `src/lib/actions/` for mutations
- Parallel route modal pattern for overlays
- Forest & Ember theme: `--primary` = forest green, `--cta` = warm amber

### Integration Points
- `districts` table exists (id, name, state, website) — needs auth columns + slug
- `jobs.district_id` FK ready for linking claimed listings
- `/for-schools` route exists as placeholder — becomes district auth entry point
- `/districts/[slug]` new public route for profiles
- Scraper pipeline needs suppression check for delisted listings

</code_context>

<deferred>
## Deferred Ideas

- **Payment/billing for district accounts** — free trial period, then paid plan. Needs Stripe integration, plan management, access gating. Separate phase.
- **Dashboard analytics** — listing views, click-through rates, applicant stats. Behind paywall as a premium district feature. Separate phase.
- **District search filter** — filter job search results by specific district. Could be added to Phase 8 or as its own enhancement.

</deferred>

---

*Phase: 07-district-accounts*
*Context gathered: 2026-03-11*
