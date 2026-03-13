# Phase 8: UI Polish & Static Pages - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

The portal looks and works great on all devices and has all supporting pages. This includes: fully responsive mobile experience (especially the filter panel), a real About page replacing the placeholder, a career coaching request form with email delivery, and a visual polish pass across all pages to add warmth and reduce the "AI-generated" feel.

</domain>

<decisions>
## Implementation Decisions

### Mobile filter experience
- Filter drawer pattern: a "Filters" button opens a slide-up drawer/sheet showing all filters stacked vertically
- Search bar stays always visible on mobile; filter complexity is behind one tap
- Drawer shows live result count ("Show 47 Results") that updates as filters change — requires lightweight count query
- Search bar is sticky at the top on mobile — auto-hide header on scroll-down to save space
- Job results display as compact list rows on mobile — title + school on one line, location on another — maximizing jobs visible per screen

### About page
- Personal & mission-driven tone — "Built by an educator who saw the problem firsthand"
- Key differentiator to emphasize: quality of data and ease of finding relevant roles
- Sections: Mission/Origin story, Value for both sides (educators + districts), Contact/Get involved CTA
- No photo for now — text-focused, can add later
- No "How it works" section — keep it story-driven rather than feature-focused

### Career coaching form
- Dedicated /coaching page with brief intro about services, then the form
- Required fields: name, email
- Optional fields: current role, years of experience, position sought, free-text message/goals, phone number
- Email delivery via Resend API (free tier: 100 emails/day)
- After submit: inline success message replaces form — "Thanks! I'll be in touch within 48 hours."
- Linked from nav and About page

### Visual polish pass
- Add warm accent pops via: background accents (subtle warm gradient washes, warm-tinted card backgrounds) and hover/active states (warm amber glow on hover for cards, links, interactive elements)
- Polish all pages equally — landing, jobs, about, coaching, district pages
- Polish both light and dark modes for consistency and warmth
- Core direction: make the site feel more alive and responsive — reduce the "AI-generated" generic feel
- Add micro-interactions, transitions, and visual personality that make it feel handcrafted

### Claude's Discretion
- About page layout and visual design (match Forest & Ember theme)
- Specific micro-interactions and transitions for the "alive" feel
- Mobile breakpoints and responsive behavior details
- Filter drawer component choice (Dialog, custom sheet, etc.)
- Exact warm gradient values and accent placement
- Coaching page intro copy and layout

</decisions>

<specifics>
## Specific Ideas

- "I'd like the website to feel a little more alive and responsive. It feels a little generic right now, like it's pretty clear it was AI-generated." — This is the guiding principle for the visual polish pass
- The About page should emphasize data quality and ease of finding relevant roles as key differentiators — not just "another job board"
- Mobile filter drawer should show "Show X Results" with live count, like Airbnb/Zillow filter patterns
- Compact list rows for mobile job results — density over visual richness on small screens

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Dialog` component (ui/dialog.tsx): Can be adapted for mobile filter drawer
- `SearchFilterBar` (jobs/search-filter-bar.tsx): Desktop filter layout to wrap with mobile detection
- `useJobFilters` hook: URL-synced filter state via nuqs — reusable across desktop and mobile layouts
- `ComingSoon` component: Currently used by About page — will be replaced
- `Card`, `Button`, `Input`, `Textarea`, `Label` components: All available for coaching form
- `siteConfig` (lib/site-config.ts): Centralized branding for consistent copy

### Established Patterns
- Forest & Ember theme with oklch colors, `--cta` / `--cta-foreground` CSS variables for warm amber
- Plus Jakarta Sans font, Lucide icons, shadcn/ui component library
- Server components by default, "use client" only when needed
- Dark mode as default with system override via ThemeProvider
- Header already has mobile hamburger nav with slide-down menu

### Integration Points
- Nav component needs "Coaching" link added
- About page route exists at /about — replace ComingSoon content
- New /coaching route needed
- SearchFilterBar needs mobile-aware conditional rendering (desktop inline vs mobile drawer)
- Resend API key needed as environment variable for coaching form email

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-ui-polish-static-pages*
*Context gathered: 2026-03-13*
