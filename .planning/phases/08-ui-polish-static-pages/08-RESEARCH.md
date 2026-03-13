# Phase 8: UI Polish & Static Pages - Research

**Researched:** 2026-03-13
**Domain:** Responsive UI, static pages, email integration (Next.js 15 / Tailwind v4 / shadcn)
**Confidence:** HIGH

## Summary

Phase 8 covers four workstreams: (1) mobile-responsive filter drawer for the jobs page, (2) About page with mission-driven copy, (3) career coaching request form with email via Resend, and (4) visual polish pass across all pages for warmth and micro-interactions. The existing codebase already has all the UI primitives needed -- shadcn Dialog (Base UI), Popover, Card, Form inputs, and a well-structured Forest & Ember oklch color system with `--cta` / `--cta-foreground` variables.

The mobile filter drawer should reuse the existing `Dialog` component (which wraps `@base-ui/react` Dialog) with bottom-sheet positioning via CSS. The `useJobFilters` hook and existing `searchJobs` RPC already return a `total_count` field, so the "Show X Results" live count is available without additional backend work. Resend is the decided email provider -- installation is a single npm package, and it integrates cleanly with Next.js server actions.

**Primary recommendation:** Structure as 3 plans: (1) Mobile responsive + filter drawer, (2) About page + coaching form + Resend integration, (3) Visual polish pass across all pages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Filter drawer pattern: slide-up drawer/sheet with all filters stacked vertically
- Search bar stays always visible on mobile; filter complexity behind one tap
- Drawer shows live result count ("Show 47 Results") that updates as filters change
- Search bar is sticky at the top on mobile; auto-hide header on scroll-down
- Job results display as compact list rows on mobile (title + school on one line, location on another)
- About page: personal & mission-driven tone, "Built by an educator who saw the problem firsthand"
- About page sections: Mission/Origin story, Value for both sides, Contact/Get involved CTA
- No photo on About page, no "How it works" section
- Career coaching form on dedicated /coaching page with brief intro
- Required fields: name, email; Optional: current role, years of experience, position sought, free-text message/goals, phone number
- Email delivery via Resend API (free tier: 100 emails/day)
- After submit: inline success message replaces form
- Linked from nav and About page
- Visual polish: warm accent pops via background accents, hover/active states, micro-interactions
- Polish all pages equally in both light and dark modes
- Core direction: make site feel more alive and responsive, reduce "AI-generated" feel

### Claude's Discretion
- About page layout and visual design (match Forest & Ember theme)
- Specific micro-interactions and transitions for the "alive" feel
- Mobile breakpoints and responsive behavior details
- Filter drawer component choice (Dialog, custom sheet, etc.)
- Exact warm gradient values and accent placement
- Coaching page intro copy and layout

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-02 | Portal is fully responsive and usable on mobile devices | Mobile filter drawer pattern, sticky search, compact job rows, auto-hide header -- all achievable with existing Tailwind responsive utilities and Dialog component |
| UI-04 | Filter panel is intuitive and works well on both desktop and mobile | Desktop keeps current inline layout; mobile gets slide-up drawer with vertically stacked filters and live count CTA |
| UI-05 | Portal has an About page explaining its mission and value | Replace existing ComingSoon placeholder at /about with mission-driven content page |
| UI-06 | Portal has a career coaching request form that sends an email to the operator | New /coaching route with form, server action using Resend API for email delivery |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.12 | Framework | Already in use |
| Tailwind CSS | v4 | Styling + responsive utilities | Already in use, oklch theme configured |
| @base-ui/react | 1.2.0 | Dialog primitive for drawer | Already wraps shadcn Dialog component |
| nuqs | 2.8.9 | URL-synced filter state | Already powers `useJobFilters` hook |
| lucide-react | 0.577.0 | Icons | Already in use |
| tw-animate-css | 1.4.0 | CSS animations | Already in use for Dialog transitions |

### New Addition
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | latest | Email delivery API | Coaching form submissions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Nodemailer + SMTP | Resend is simpler, no SMTP config, locked decision |
| Custom sheet component | Vaul (drawer library) | Extra dependency; Dialog with bottom positioning achieves same result with existing code |

**Installation:**
```bash
npm install resend
```

## Architecture Patterns

### New Routes
```
src/app/
├── about/page.tsx          # Replace ComingSoon with real content (server component)
├── coaching/
│   ├── page.tsx            # Coaching page with form (server component shell)
│   └── coaching-form.tsx   # Client component for form interactivity
```

### New Server Action
```
src/lib/actions/
└── coaching-action.ts      # Server action: validate form, send email via Resend
```

### Modified Files
```
src/components/
├── jobs/
│   ├── search-filter-bar.tsx       # Add mobile detection, render drawer trigger on mobile
│   ├── mobile-filter-drawer.tsx    # New: slide-up drawer with all filters + live count
│   └── job-row.tsx                 # Adjust layout for compact mobile rows
├── layout/
│   ├── header.tsx                  # Auto-hide on scroll-down behavior for mobile
│   └── nav.tsx                     # Add "Coaching" link
├── landing/
│   ├── hero.tsx                    # Visual polish
│   ├── audience-cards.tsx          # Visual polish
│   └── stats-bar.tsx               # Visual polish
└── ui/                             # No new primitives needed
src/lib/
└── site-config.ts                  # Add coaching nav item
src/app/
└── globals.css                     # Add warm gradient utility classes, transitions
```

### Pattern 1: Mobile Filter Drawer (Bottom Sheet via Dialog)
**What:** Reuse existing `Dialog` component with CSS overrides to position as bottom sheet on mobile
**When to use:** Mobile viewport (< md breakpoint, 768px)
**Example:**
```typescript
// Position Dialog as bottom sheet by overriding DialogContent classes
<DialogContent className="fixed bottom-0 left-0 right-0 top-auto w-full max-w-full translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none max-h-[85vh] overflow-y-auto">
  {/* All filters stacked vertically */}
  {/* Sticky footer with "Show X Results" button */}
</DialogContent>
```

### Pattern 2: Auto-Hide Header on Scroll
**What:** Header hides on scroll-down, reappears on scroll-up (mobile only)
**When to use:** Mobile viewport to maximize visible content
**Example:**
```typescript
// useScrollDirection hook
function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 60); // hide when scrolling down past 60px
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}
```

### Pattern 3: Server Action for Email (Resend)
**What:** Form submission via server action, Resend API call
**When to use:** Coaching form submission
**Example:**
```typescript
// src/lib/actions/coaching-action.ts
"use server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitCoachingRequest(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  // ... extract optional fields

  const { error } = await resend.emails.send({
    from: "PA Educator Jobs <noreply@yourdomain.com>",
    to: [process.env.OPERATOR_EMAIL!],
    subject: `Coaching Request from ${name}`,
    html: `...`, // Simple HTML email with form data
    replyTo: email,
  });

  if (error) return { success: false, message: "Failed to send" };
  return { success: true, message: "Thanks! I'll be in touch within 48 hours." };
}
```

### Pattern 4: Responsive Conditional Rendering
**What:** Show different filter UI based on viewport
**When to use:** SearchFilterBar desktop vs mobile
**Example:**
```typescript
// Use Tailwind responsive classes + a media query hook for conditional rendering
// Desktop: existing inline filter bar (hidden on mobile)
// Mobile: "Filters" button that opens drawer (hidden on desktop)
<div className="hidden md:block">
  <InlineFilters /> {/* existing SearchFilterBar internals */}
</div>
<div className="md:hidden">
  <MobileFilterDrawer />
</div>
```

### Anti-Patterns to Avoid
- **window.innerWidth checks in React:** Use CSS responsive classes or `matchMedia` hook, not manual width checking
- **Separate mobile/desktop filter state:** Both must use the same `useJobFilters` hook and URL state -- changing filters in drawer must reflect in URL params
- **Heavy JS for scroll behavior:** Use CSS `position: sticky` where possible, JS only for auto-hide logic
- **Inline styles for warm accents:** Use CSS custom properties and Tailwind utility classes, not inline `style` props

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet / drawer | Custom touch gesture handling | Dialog with CSS bottom positioning | Touch dismiss, focus trap, backdrop all handled by Base UI Dialog |
| Email sending | SMTP client / raw fetch to mail API | Resend SDK | Error handling, retries, type safety built in |
| URL filter state sync | Custom useState + pushState | nuqs (already in use) | Already working, handles serialization/deserialization |
| Form validation | Custom validation logic | HTML5 required + server-side checks | Keep it simple; only name + email are required |
| Scroll direction detection | Full IntersectionObserver setup | Simple scroll event listener | Only need up/down direction, not element visibility |

**Key insight:** This phase is primarily CSS/layout work and one API integration. The component library and state management are already built -- the work is responsive adaptation and visual enhancement.

## Common Pitfalls

### Pitfall 1: Filter Drawer State Desync
**What goes wrong:** Mobile drawer filters don't update URL params, or closing drawer loses filter changes
**Why it happens:** Building separate state for drawer instead of using existing `useJobFilters` hook
**How to avoid:** The drawer MUST use the same `useJobFilters()` hook. Filter changes apply immediately to URL state (nuqs handles this). No "Apply" button needed for individual filters -- only a "Show X Results" button to close the drawer.
**Warning signs:** Filters show different values on desktop vs mobile after switching viewport size

### Pitfall 2: Resend Domain Verification
**What goes wrong:** Emails fail to send or land in spam
**Why it happens:** Resend requires domain verification for sending from custom domains. Without it, you can only send from `onboarding@resend.dev`
**How to avoid:** For development/MVP, use `onboarding@resend.dev` as the `from` address (Resend's test domain). Set `replyTo` to the submitter's email so the operator can reply directly. Add domain verification later when a custom domain is ready.
**Warning signs:** 403 errors from Resend API, emails not arriving

### Pitfall 3: Sticky Search Bar + Auto-Hide Header Conflict
**What goes wrong:** Search bar jumps or content shifts when header hides/shows
**Why it happens:** Sticky positioning relative to viewport changes when header height changes
**How to avoid:** Use `transform: translateY()` with transition for smooth header hide/show instead of `display: none`. Keep search bar in a separate sticky container below the header, not inside it. Use `top` value that accounts for header state.
**Warning signs:** Content jumps, search bar flickers, or overlaps with header

### Pitfall 4: Popover Filters on Mobile
**What goes wrong:** Desktop popover filter dropdowns render off-screen or are hard to tap on mobile
**Why it happens:** Popovers aren't mobile-friendly -- they need precise positioning and can overflow viewport
**How to avoid:** On mobile, don't show individual filter popovers at all. All filter interactions happen inside the drawer where controls are stacked vertically with full-width touch targets.
**Warning signs:** Popovers clipped by viewport edge, tiny touch targets

### Pitfall 5: Visual Polish Inconsistency Between Modes
**What goes wrong:** Warm accents look great in dark mode but washed out in light mode (or vice versa)
**Why it happens:** oklch values that work well against dark backgrounds need different lightness/chroma for light backgrounds
**How to avoid:** Test every warm accent in both modes. Use CSS custom properties scoped to `.dark` vs `:root` (already established pattern in globals.css). Add new warm accent variables if needed.
**Warning signs:** Gradients invisible in one mode, text unreadable against warm backgrounds

## Code Examples

### Live Result Count in Filter Drawer
The existing `searchJobs` RPC already returns `total_count` in every result row. The `JobList` component already tracks `count` state. For the drawer, use the same mechanism:
```typescript
// The count is already available from the JobList's state
// Pass it down or lift it to a shared context
// In the drawer footer:
<Button onClick={() => setDrawerOpen(false)} className="w-full bg-cta text-cta-foreground">
  Show {count} Result{count !== 1 ? "s" : ""}
</Button>
```

### Warm Gradient Utility Pattern
```css
/* globals.css additions for warm accents */
.warm-glow {
  background: radial-gradient(
    ellipse at 50% 50%,
    oklch(0.76 0.08 70 / 0.06) 0%,
    transparent 70%
  );
}
.dark .warm-glow {
  background: radial-gradient(
    ellipse at 50% 50%,
    oklch(0.76 0.08 70 / 0.08) 0%,
    transparent 70%
  );
}
```

### Compact Mobile Job Row
```typescript
// Responsive job row: single line on desktop, stacked on mobile
<div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
  <span className="font-medium text-foreground truncate">{job.title}</span>
  <span className="hidden sm:inline text-muted-foreground/60">&middot;</span>
  <span className="text-xs sm:text-sm text-muted-foreground">{schoolName}</span>
  {location && (
    <span className="text-xs text-muted-foreground/70 sm:text-sm sm:text-muted-foreground">
      {location}
    </span>
  )}
</div>
```

### Resend Environment Variables
```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
OPERATOR_EMAIL=coaching@example.com
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate mobile sheet libraries (Vaul, react-modal-sheet) | Dialog with CSS positioning as bottom sheet | 2024+ | One fewer dependency; Base UI Dialog already handles accessibility |
| `window.matchMedia` for responsive rendering | Tailwind responsive classes + CSS-only | Ongoing | Less JS, better SSR compatibility |
| Custom email templates | Resend with plain HTML or react-email | 2023+ | Simpler setup, reliable delivery |

**Deprecated/outdated:**
- `next-seo` for meta tags: Next.js 15 has built-in `metadata` export (already used in this project)
- Separate animation libraries (framer-motion) for simple transitions: `tw-animate-css` + CSS transitions handle micro-interactions

## Open Questions

1. **Resend `from` address for MVP**
   - What we know: Resend requires domain verification for custom `from` addresses. Free tier allows 100 emails/day.
   - What's unclear: Whether the user has a custom domain ready for Resend verification
   - Recommendation: Use `onboarding@resend.dev` (Resend test sender) for now with `replyTo` set to the submitter's email. This works immediately without domain setup. Note in env comments that custom domain can be added later.

2. **Operator email destination**
   - What we know: Coaching form sends to "the operator"
   - What's unclear: Exact email address
   - Recommendation: Use `OPERATOR_EMAIL` env variable. The user sets this in Vercel env vars.

3. **Stats bar on landing page**
   - What we know: Currently shows "--" placeholder values
   - What's unclear: Whether this should be populated as part of polish or deferred
   - Recommendation: If easy to query (count of active jobs, count of sources, count of districts), populate as part of polish. Otherwise defer.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: globals.css, search-filter-bar.tsx, dialog.tsx, header.tsx, job-list.tsx, job-row.tsx, use-job-filters.ts, site-config.ts, package.json
- [Resend Next.js docs](https://resend.com/docs/send-with-nextjs) - Setup, API usage, free tier details

### Secondary (MEDIUM confidence)
- Base UI Dialog API behavior - inferred from existing dialog.tsx wrapper implementation
- Tailwind v4 responsive utilities - inferred from existing codebase usage patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - everything already installed except Resend (one npm install)
- Architecture: HIGH - clear patterns from existing codebase, straightforward responsive adaptation
- Pitfalls: HIGH - common mobile responsive issues well-documented, Resend gotchas verified via official docs

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable domain, no fast-moving dependencies)
