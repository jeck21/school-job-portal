# Phase 3: Job Browsing Core - Research

**Researched:** 2026-03-10
**Domain:** Next.js 15 App Router (parallel/intercepting routes), Supabase data fetching, job listing UI
**Confidence:** HIGH

## Summary

Phase 3 delivers a browsable job list with a detail modal that updates the URL. The core technical challenge is implementing Next.js parallel routes + intercepting routes so that clicking a job row opens a modal at `/jobs/[id]` while preserving the list underneath, and direct navigation to `/jobs/[id]` renders a full page. This is a well-documented Next.js pattern with official examples.

Data fetching is straightforward: server-side Supabase queries with `.range()` for the "load more" pattern, joining `jobs` and `schools` tables. The report flag feature requires a small new DB table and a lightweight server action.

**Primary recommendation:** Use Next.js parallel routes (`@modal` slot) + intercepting routes (`(.)jobs/[id]`) for the modal-with-URL pattern. Use Supabase `.range(from, to)` with `.order('first_seen_at', { ascending: false })` for cursor-free "load more" pagination. Add the shadcn Dialog component via `npx shadcn@latest add dialog` for the modal shell.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Compact list rows (single column, stacked) -- not cards or grid
- Two-line rows: Line 1 = Title . School . Location; Line 2 = School type badge + "Posted X ago"
- Total count header: "147 open positions"
- Default sort: newest first (by first_seen_at descending)
- Dialog/modal overlay -- not a separate page navigation
- URL updates to /jobs/[id] when modal opens (shareable, bookmarkable)
- Visiting /jobs/[id] directly opens the modal on top of the list
- Close with X button or clicking outside the modal
- CTA label: "Apply at [District Name]" -- dynamic, opens in new tab
- Links to district application page, not scrape source
- "Load more" button at bottom -- not pagination or infinite scroll
- 25 jobs per batch
- Both relative AND absolute dates: "Posted 2 days ago (Mar 5, 2026)"
- List rows: posted date only (relative); Detail modal: both posted + last verified (relative + absolute)
- No source attribution displayed
- Quick "Report an issue" link with dropdown: "Link is broken" / "Job is filled/expired" / "Other"
- No login required to report
- Empty state: "No job listings yet -- we're actively collecting PA educator positions. Check back soon!"

### Claude's Discretion
- Loading skeleton/spinner design while jobs fetch
- Exact row hover/active states
- Modal sizing and scroll behavior for long descriptions
- Report flag DB schema and review workflow details
- Exact school type badge styling (colors per type)
- Mobile responsiveness of list rows and modal (basic usability expected)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can browse all aggregated PA educator job listings in a searchable list/grid | Job list page with server-side Supabase query, "load more" pagination via `.range()`, total count via `{ count: 'exact' }` |
| SRCH-09 | User can view a job detail page with title, school, location, salary, description, and source info | Parallel route modal at `/jobs/[id]` with intercepting route; joins `jobs` + `schools` tables |
| SRCH-10 | User can click through to the original posting to apply | "Apply at [District Name]" CTA button using `job.url` with `target="_blank"` and `rel="noopener noreferrer"` |
| SRCH-11 | User can see when a job was first posted and when it was last verified | Display `first_seen_at` and `last_verified_at` from jobs table; relative + absolute date formatting |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.12 | App Router, parallel/intercepting routes | Already in project; built-in modal routing pattern |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client | Already in project; server component data fetching |
| @supabase/supabase-js | ^2.99.0 | Supabase JS client | Already in project; `.range()` for pagination |
| @base-ui/react | ^1.2.0 | Primitives (Dialog) | Already in project; shadcn base-nova style uses Base UI |
| lucide-react | ^0.577.0 | Icons | Already in project |

### To Add
| Library | Version | Purpose | How to Add |
|---------|---------|---------|------------|
| shadcn Dialog | (base-nova) | Modal component for job detail | `npx shadcn@latest add dialog` |
| shadcn Badge | (base-nova) | School type badges | `npx shadcn@latest add badge` |
| shadcn Skeleton | (base-nova) | Loading placeholder | `npx shadcn@latest add skeleton` |
| shadcn DropdownMenu | (base-nova) | Report issue dropdown | `npx shadcn@latest add dropdown-menu` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Parallel/intercepting routes | Client-side modal with `window.history.pushState` | Loses SSR for direct `/jobs/[id]` visits; more manual work |
| Supabase `.range()` | Cursor-based pagination | Unnecessary complexity for "load more" with no random page access |

**Installation:**
```bash
npx shadcn@latest add dialog badge skeleton dropdown-menu
```

## Architecture Patterns

### Recommended File Structure
```
src/app/
  jobs/
    page.tsx              # Job list page (server component, initial 25 jobs)
    [id]/
      page.tsx            # Full job detail page (direct navigation / SEO fallback)
  @modal/
    (.)jobs/[id]/
      page.tsx            # Intercepted route: renders job detail in Dialog modal
    default.tsx           # Returns null when no modal is active
  layout.tsx              # Updated: accepts `modal` slot prop, renders {modal} alongside {children}
```

### Pattern 1: Parallel + Intercepting Routes for Modal
**What:** A `@modal` slot at the app root intercepts `/jobs/[id]` navigation. When navigating client-side from the job list, the intercepting route renders the detail in a Dialog overlay. When navigating directly to `/jobs/[id]`, the full page at `src/app/jobs/[id]/page.tsx` renders instead.
**When to use:** Anytime you want a modal with a shareable URL that also works as a standalone page.

```typescript
// src/app/layout.tsx -- add modal slot
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <ThemeProvider ...>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            {modal}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```typescript
// src/app/@modal/default.tsx
export default function Default() {
  return null;
}
```

```typescript
// src/app/@modal/(.)jobs/[id]/page.tsx
import { JobDetailModal } from "@/components/jobs/job-detail-modal";

export default async function InterceptedJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailModal jobId={id} />;
}
```

**Key detail:** The `(..)` convention is based on route segments, not file-system levels. Since `@modal` is a slot (not a segment), `(.)jobs/[id]` matches the `jobs/[id]` route one segment level (same level from root). Use `(.)` not `(..)`.

### Pattern 2: Server Component Data Fetching with "Load More"
**What:** Initial page load fetches first 25 jobs server-side. Client component handles "Load More" by calling a server action or API route for next batch.
**When to use:** "Load more" pattern where initial render is SSR and subsequent batches are client-fetched.

```typescript
// Server action for loading more jobs
"use server";
import { createClient } from "@/lib/supabase/server";

export async function getJobs(offset: number = 0, limit: number = 25) {
  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("jobs")
    .select("*, schools!inner(name, district_name)", { count: "exact" })
    .eq("is_active", true)
    .order("first_seen_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { jobs: data, count, error };
}
```

### Pattern 3: Date Formatting Utility
**What:** Shared utility for relative + absolute date display.
**When to use:** Every date rendered in list rows and detail modal.

```typescript
// src/lib/format-date.ts
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatDateDisplay(date: Date): string {
  return `${formatRelativeDate(date)} (${formatAbsoluteDate(date)})`;
}
```

### Anti-Patterns to Avoid
- **Client-side data fetching for initial load:** The first 25 jobs should be server-rendered for SEO and fast paint. Only "Load More" is client-side.
- **Using `router.push` instead of `<Link>` for job rows:** Use `<Link href={/jobs/${id}}>` so Next.js can intercept the route. `router.push` also works but `<Link>` enables prefetching.
- **Forgetting `default.tsx` in `@modal` slot:** Without it, a hard refresh on any non-modal page will 404 the modal slot.
- **Using `(..)` instead of `(.)`:** Since `@modal` is a slot not a segment, the jobs route is at the same segment level. Use `(.)jobs/[id]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal with URL sync | Custom dialog + pushState + popstate listeners | Next.js parallel + intercepting routes | Handles back/forward nav, SSR fallback, prefetching automatically |
| Dialog component | Custom overlay + focus trap + scroll lock | shadcn Dialog (Base UI) | Accessibility (focus trap, escape key, aria), scroll lock, backdrop click |
| Relative date formatting | Inline date math everywhere | Shared `formatRelativeDate` utility | Consistency, testability, single place to update |
| Loading skeletons | Custom animated divs | shadcn Skeleton component | Consistent pulse animation, theme-aware |

**Key insight:** The parallel + intercepting route pattern is the official Next.js solution for modal-with-URL. Building it manually misses back/forward navigation handling and SSR fallback.

## Common Pitfalls

### Pitfall 1: Wrong Intercepting Route Convention
**What goes wrong:** Using `(..)jobs/[id]` instead of `(.)jobs/[id]` inside `@modal` slot, causing the intercept to fail silently (navigates to full page instead of modal).
**Why it happens:** The `(..)` convention is based on route segments, not filesystem directories. `@modal` is a slot, not a segment, so it doesn't count.
**How to avoid:** Always use `(.)` for same-level interception from within a slot.
**Warning signs:** Clicking a job row navigates to a full page instead of opening a modal.

### Pitfall 2: Missing `default.tsx` Files
**What goes wrong:** Hard navigation (refresh, direct URL) to any page causes 404 because the `@modal` slot has no matching route.
**Why it happens:** On hard navigation, Next.js can't recover the active state of parallel route slots.
**How to avoid:** Always create `@modal/default.tsx` that returns `null`. Also consider a catch-all `@modal/[...catchAll]/page.tsx` returning null.
**Warning signs:** Pages work fine with client navigation but break on refresh.

### Pitfall 3: Supabase Range Off-by-One
**What goes wrong:** Getting 26 results instead of 25, or missing the last item.
**Why it happens:** `.range(from, to)` is inclusive on both ends. `.range(0, 24)` returns 25 rows.
**How to avoid:** Use `.range(offset, offset + limit - 1)` consistently.
**Warning signs:** "Load more" returns one extra or one fewer job than expected.

### Pitfall 4: Modal Not Closing on External Navigation
**What goes wrong:** Modal stays visible when navigating to `/about` or other non-job pages.
**Why it happens:** Parallel route slots maintain their last active state during client-side navigation.
**How to avoid:** Add a catch-all `@modal/[...catchAll]/page.tsx` returning null, so any non-intercepted route clears the modal slot.
**Warning signs:** Modal overlay persists when clicking header nav links.

### Pitfall 5: Count Query Performance
**What goes wrong:** Total count query becomes slow as jobs table grows.
**Why it happens:** `{ count: 'exact' }` runs a full count query.
**How to avoid:** Use `{ count: 'estimated' }` for large tables. For now with hundreds/low thousands of PA jobs, `exact` is fine. Switch to `estimated` if count query takes >100ms.
**Warning signs:** Slow initial page load.

## Code Examples

### Job List Query (Server Component)
```typescript
// Source: Supabase JS docs - select with joins, range, count
const supabase = await createClient();
const { data: jobs, count, error } = await supabase
  .from("jobs")
  .select(`
    id,
    title,
    location_raw,
    city,
    school_type,
    first_seen_at,
    last_verified_at,
    url,
    description,
    salary_raw,
    salary_mentioned,
    schools (
      name,
      district_name
    )
  `, { count: "exact" })
  .eq("is_active", true)
  .order("first_seen_at", { ascending: false })
  .range(0, 24);
```

### Modal Component Shell
```typescript
// Source: Next.js parallel routes docs + shadcn Dialog
"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function JobDetailModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### Report Flag Schema
```sql
-- New migration: report_flags table
CREATE TABLE report_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('broken_link', 'filled_expired', 'other')),
  details TEXT,
  ip_hash TEXT,  -- hashed IP to prevent spam, not to identify users
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_report_flags_job_id ON report_flags(job_id);
CREATE INDEX idx_report_flags_unresolved ON report_flags(resolved) WHERE resolved = false;
```

### Apply Button
```typescript
// Dynamic CTA with district name
<a
  href={job.url}
  target="_blank"
  rel="noopener noreferrer"
  className={cn(buttonVariants({ variant: "default", size: "lg" }))}
>
  Apply at {job.schools?.district_name || "District"}
</a>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal + pushState | Next.js parallel + intercepting routes | Next.js 13.3+ (stable 14+, improved 15) | Built-in SSR fallback, back/forward nav |
| `params` as plain object | `params` as Promise in Next.js 15 | Next.js 15 | Must `await params` in page components |
| Radix UI primitives | Base UI primitives (shadcn v4) | Jan 2026 | Project uses base-nova style; Dialog from Base UI |

**Deprecated/outdated:**
- Synchronous `params` access: Next.js 15 requires `await params` in server components
- `getServerSideProps` / `getStaticProps`: App Router uses server components + `fetch` / Supabase client directly

## Open Questions

1. **Dialog component compatibility with intercepting routes**
   - What we know: shadcn Dialog (Base UI) uses `Dialog` from `@base-ui/react`. The `defaultOpen` + `onOpenChange` pattern should work.
   - What's unclear: Whether Base UI's Dialog handles the `defaultOpen` prop identically to Radix. May need to verify during implementation.
   - Recommendation: Test early; if Base UI Dialog doesn't support `defaultOpen`, use a controlled `open={true}` state instead.

2. **School join nullability**
   - What we know: `school_id` on jobs is nullable (`REFERENCES schools(id)` without NOT NULL). Some jobs may not have a linked school.
   - What's unclear: Whether all PAREAP-ingested jobs have school associations.
   - Recommendation: Use left join (`.select('..., schools(name, district_name)')` without `!inner`) and handle null school gracefully in UI.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Playwright 1.58.2 |
| Config file | None -- needs Wave 0 setup |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Job list loads with active jobs, sorted newest first | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "returns active jobs"` | Wave 0 |
| SRCH-01 | Load more appends next batch | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "load more offset"` | Wave 0 |
| SRCH-01 | Total count returned correctly | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "returns count"` | Wave 0 |
| SRCH-09 | Job detail fetches full job data with school join | unit | `npx vitest run src/lib/__tests__/get-job-detail.test.ts` | Wave 0 |
| SRCH-10 | Apply link points to job.url, opens in new tab | e2e | `npx playwright test tests/e2e/job-detail.spec.ts -g "apply link"` | Wave 0 |
| SRCH-11 | Dates displayed in relative + absolute format | unit | `npx vitest run src/lib/__tests__/format-date.test.ts` | Wave 0 |
| SRCH-11 | Detail modal shows both posted and last verified dates | e2e | `npx playwright test tests/e2e/job-detail.spec.ts -g "dates"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest config with path aliases matching tsconfig
- [ ] `playwright.config.ts` -- Playwright config targeting localhost:3003
- [ ] `src/lib/__tests__/format-date.test.ts` -- date formatting utility tests
- [ ] `src/lib/__tests__/get-jobs.test.ts` -- job list query tests (may need Supabase mock)
- [ ] `src/lib/__tests__/get-job-detail.test.ts` -- single job query tests
- [ ] `tests/e2e/job-detail.spec.ts` -- e2e tests for job detail modal, apply link, dates

## Sources

### Primary (HIGH confidence)
- [Next.js Intercepting Routes docs](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes) -- convention syntax, modal pattern
- [Next.js Parallel Routes docs](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) -- slot convention, default.tsx, modal example with code
- [Supabase JS range() docs](https://supabase.com/docs/reference/javascript/range) -- pagination API, inclusive range semantics

### Secondary (MEDIUM confidence)
- [Supabase pagination discussion](https://github.com/orgs/supabase/discussions/1223) -- best practices for offset pagination with count
- [shadcn/ui Dialog (Radix)](https://ui.shadcn.com/docs/components/radix/dialog) -- Dialog component API (Base UI variant follows same interface)
- [shadcn/ui v4 changelog](https://ui.shadcn.com/docs/changelog/2026-01-base-ui) -- Base UI component availability

### Tertiary (LOW confidence)
- Base UI Dialog `defaultOpen` prop behavior -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project or via shadcn CLI
- Architecture: HIGH -- parallel + intercepting routes is official Next.js pattern with official docs and examples
- Pitfalls: HIGH -- documented in official docs and community discussions
- Date formatting: HIGH -- simple utility, no external dependencies needed
- Report flags schema: MEDIUM -- schema design is Claude's discretion, straightforward but untested

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable patterns, 30-day validity)
