# Phase 7: District Accounts - Research

**Researched:** 2026-03-11
**Domain:** Supabase Auth + RLS + Next.js 15 App Router (district account management)
**Confidence:** HIGH

## Summary

Phase 7 adds district accounts with email/password auth, listing claim/management, and public profile pages. The existing stack (Next.js 15 + Supabase + @supabase/ssr) already provides all the primitives needed. The `@supabase/ssr` package handles cookie-based auth with SSR, and Supabase Auth provides email+password signup with email confirmation out of the box. The `districts` table already exists but needs auth-related columns (slug, verified status, auth user linkage).

The primary complexity is in three areas: (1) middleware for session refresh and route protection, (2) RLS policies to ensure districts can only manage their own data, and (3) the domain-based auto-verification flow (`.k12.pa.us` auto-verify, others require manual approval with a growing domain whitelist).

**Primary recommendation:** Use Supabase Auth email+password with a `district_accounts` join table linking `auth.users` to `districts`, a Postgres `before-user-created` hook or application-level domain validation for auto-verification, and RLS policies on all district-writable tables.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Email domain validation as primary method: `.k12.pa.us` domains auto-verified on signup
- Non-.k12.pa.us emails (charters, IUs, private schools) can sign up but require manual approval
- Once manually verified, that domain is added to a whitelist for future auto-verification
- Multiple users per district allowed -- anyone with a matching domain can create an account
- Signup flow: email + password with email confirmation link (Supabase Auth handles this)
- Auto-match on signup: when a district account is verified, system matches existing jobs by district_name/school_name
- Show matches for one-click "Claim All" confirmation (district reviews before claiming)
- Going forward, new scraped listings matching a verified district are auto-claimed and badged
- "Verified" badge shown on both job cards and detail pages (subtle checkmark + text, warm amber)
- Districts CANNOT edit scraped posts -- scraped data stays untouched
- Districts CAN soft-delete (delist) any claimed listing -- scraped or manual
- Delisted listings hidden from portal but data kept; scraper won't re-add them
- Districts can re-list delisted posts (toggle, not permanent action)
- Districts CAN create new manual posts via structured form: title, description, school, grade band, subject area, salary info, application URL, deadline
- Manual posts are auto-verified (district-owned, no scraper involved)
- Districts CAN fully edit their own manually-created posts after publishing
- Simple tab-based layout: Active Listings, Delisted, Create New
- Each listing has Delist/Edit/View action buttons
- Shows district name, website link, and all open positions (verified badge on each)
- URL format: /districts/[slug-from-name] (SEO-friendly, auto-generated)
- Discoverable via: link from verified job listings + a /districts directory page listing all verified districts
- "Delist" label instead of "Mark as Filled" -- more generic
- Delist is a toggle (can re-list), not a permanent action
- District accounts are free initially

### Claude's Discretion
- Exact domain matching/whitelisting implementation
- Auto-match algorithm for linking jobs to districts
- Dashboard UI layout and styling details
- Form validation patterns for manual post creation
- Profile page layout and card styling

### Deferred Ideas (OUT OF SCOPE)
- Payment/billing for district accounts -- free trial period, then paid plan. Needs Stripe integration.
- Dashboard analytics -- listing views, click-through rates, applicant stats. Behind paywall.
- District search filter -- filter job search results by specific district.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-01 | District hiring team can create an account with email and password | Supabase Auth email+password flow with middleware, server actions, email confirmation callback |
| DIST-02 | District can claim existing scraped listings as belonging to their school/district | Auto-match algorithm using district_name fuzzy matching on jobs/schools tables, one-click claim UI |
| DIST-03 | Claimed listings display a "Verified" badge on the portal | Add `claimed_by_district_id` to jobs table, badge component in job-row and job-detail |
| DIST-04 | District can update details on their claimed listings | Server actions with RLS -- only manual posts editable; scraped posts immutable per user decision |
| DIST-05 | District can mark listings as filled/closed | Delist toggle via `delisted_at` column, scraper suppression check |
| DIST-06 | District has a profile page showing all their open positions | /districts/[slug] route with public query for verified district jobs |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | ^0.9.0 | Cookie-based SSR auth | Already installed; official Supabase package for Next.js App Router |
| @supabase/supabase-js | ^2.99.0 | Supabase client (auth, DB, RLS) | Already installed; provides `auth.signUp`, `auth.signInWithPassword`, `auth.getUser` |
| next | 15.5.12 | App Router, Server Actions, middleware | Already installed; provides route protection and server-side mutations |
| lucide-react | ^0.577.0 | Icons (CheckCircle for verified badge, etc.) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| string-similarity | ^4.0.4 | Fuzzy matching for auto-claim | Already installed; used by school-matcher and job-dedup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | NextAuth/Auth.js | Unnecessary -- Supabase Auth is already wired, adds no value to add another auth layer |
| Application-level domain validation | Supabase `before-user-created` hook | Hook is more elegant but harder to debug; application-level is simpler and more visible |

**Installation:**
No new packages needed. All dependencies are already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── for-schools/
│   │   ├── page.tsx              # Login/signup entry (replaces coming-soon)
│   │   ├── login/page.tsx        # Login form
│   │   ├── signup/page.tsx       # Signup form
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Dashboard with tabs (Active, Delisted, Create)
│   │   │   └── layout.tsx        # Auth-protected layout
│   │   └── auth/
│   │       └── callback/route.ts # Email confirmation callback
│   ├── districts/
│   │   ├── page.tsx              # Directory of all verified districts
│   │   └── [slug]/page.tsx       # Public district profile
│   └── auth/
│       └── confirm/route.ts      # Email confirmation token exchange
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # (exists) Browser client
│   │   ├── server.ts             # (exists) Server client
│   │   └── middleware.ts         # NEW: updateSession helper
│   ├── queries/
│   │   ├── get-district.ts       # Public district profile query
│   │   ├── get-district-jobs.ts  # Jobs for a district
│   │   └── get-claim-matches.ts  # Auto-match candidates
│   └── actions/
│       ├── auth-actions.ts       # signup, login, logout server actions
│       ├── claim-actions.ts      # claim-all, unclaim
│       ├── listing-actions.ts    # delist, relist, create, update manual posts
│       └── district-actions.ts   # update district profile
├── middleware.ts                  # NEW: Root middleware for session refresh
└── components/
    ├── district/
    │   ├── dashboard-tabs.tsx     # Tab navigation
    │   ├── listing-card.tsx       # Dashboard listing with actions
    │   ├── create-listing-form.tsx
    │   ├── claim-review.tsx       # Claim matches review UI
    │   └── verified-badge.tsx     # Reusable verified badge
    └── jobs/
        ├── job-row.tsx            # (modify) Add verified badge
        └── job-detail.tsx         # (modify) Add verified badge
```

### Pattern 1: Supabase Auth Middleware (Session Refresh)
**What:** Middleware that refreshes auth tokens on every request via `getUser()`
**When to use:** Required for all authenticated routes; place at project root
**Example:**
```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() not getSession() -- getUser() revalidates with Supabase server
  const { data: { user } } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith("/for-schools/dashboard")) {
    return NextResponse.redirect(new URL("/for-schools/login", request.url));
  }

  return response;
}

// src/middleware.ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Pattern 2: Server Actions for Auth
**What:** Server actions for signup/login/logout following existing `report-job.ts` pattern
**When to use:** All auth mutations
**Example:**
```typescript
// src/lib/actions/auth-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) throw new Error(error.message);
  // Redirect to check-email page
  redirect("/for-schools/signup?check-email=true");
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) throw new Error(error.message);
  redirect("/for-schools/dashboard");
}
```

### Pattern 3: Email Confirmation Callback Route
**What:** Route handler to exchange confirmation token for session
**When to use:** Required for email confirmation flow
**Example:**
```typescript
// src/app/auth/confirm/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      // After email confirmed, run domain validation + district linking
      return NextResponse.redirect(new URL("/for-schools/dashboard", request.url));
    }
  }

  return NextResponse.redirect(new URL("/for-schools/login?error=confirmation", request.url));
}
```

### Pattern 4: RLS Policies for District Data
**What:** Row-level security ensuring districts can only manage their own listings
**When to use:** All district-writable tables
**Example:**
```sql
-- Enable RLS on district-related tables
ALTER TABLE district_accounts ENABLE ROW LEVEL SECURITY;

-- District users can read their own account
CREATE POLICY "Users can read own district account"
  ON district_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- District users can manage their own jobs (claimed or manual)
CREATE POLICY "Districts can update own jobs"
  ON jobs FOR UPDATE
  USING (
    claimed_by_district_id IN (
      SELECT district_id FROM district_accounts WHERE user_id = auth.uid()
    )
  );
```

### Pattern 5: Domain Validation for Auto-Verification
**What:** Application-level domain check on signup/confirmation to set verified status
**When to use:** During the post-signup flow (after email confirmation)
**Example:**
```typescript
// Domain validation logic
function validateDomain(email: string): { autoVerified: boolean; domain: string } {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  // .k12.pa.us domains are auto-verified
  if (domain.endsWith(".k12.pa.us")) {
    return { autoVerified: true, domain };
  }

  // Check against whitelist table for previously-approved domains
  // (done via DB query in the actual implementation)
  return { autoVerified: false, domain };
}
```

### Anti-Patterns to Avoid
- **Using `getSession()` in server code:** Always use `getUser()` which revalidates with Supabase Auth server. `getSession()` reads from cookies without revalidation and is insecure for authorization checks.
- **Skipping middleware:** Without middleware, auth tokens expire and server components can't refresh them (they can't write cookies). Middleware is mandatory.
- **RLS-free tables:** Every table that districts can write to MUST have RLS enabled. The default is RLS disabled, which means any authenticated user can read/write all rows.
- **Editing scraped posts:** Per user decision, scraped data is immutable. Districts can only delist scraped posts, not edit them. Manual posts are fully editable.
- **Trusting client-side auth checks alone:** Always enforce authorization server-side via RLS policies AND server action checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT/cookie handling | Supabase Auth + @supabase/ssr middleware | Cookie refresh, token rotation, secure httpOnly cookies all handled |
| Email confirmation | Custom email sending + token generation | Supabase Auth built-in email confirmation | Handles token generation, email sending, expiry, and rate limiting |
| Password hashing | bcrypt/argon2 implementation | Supabase Auth | Supabase uses bcrypt internally, handles salting and stretching |
| Route protection | Custom auth guards in every page | Next.js middleware + Supabase getUser() | Single middleware handles all protected routes |
| Slug generation | Complex slug library | Simple `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')` | District names are simple enough; no need for a library |
| Fuzzy name matching | Custom algorithm | string-similarity (already installed) | Dice coefficient already proven in school-matcher and job-dedup |

**Key insight:** Supabase Auth handles the entire auth lifecycle (signup, confirmation, login, session refresh, logout). The main work is database schema design, RLS policies, and the business logic for claiming/managing listings.

## Common Pitfalls

### Pitfall 1: Forgetting Middleware
**What goes wrong:** Auth tokens expire, server components can't refresh them, users get logged out unexpectedly
**Why it happens:** Middleware is not part of the obvious auth flow; easy to forget
**How to avoid:** Create `src/middleware.ts` as the FIRST task. Test by logging in and refreshing the page.
**Warning signs:** Users report being logged out after inactivity

### Pitfall 2: getSession() vs getUser() in Server Code
**What goes wrong:** Authorization checks pass for expired/tampered tokens
**Why it happens:** `getSession()` reads from cookies without server-side validation
**How to avoid:** ALWAYS use `supabase.auth.getUser()` in server components, server actions, and middleware
**Warning signs:** Security audit finds client-controllable auth state

### Pitfall 3: RLS Not Enabled
**What goes wrong:** Any authenticated user can read/write any district's data
**Why it happens:** Supabase creates tables with RLS disabled by default
**How to avoid:** Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the migration, immediately after `CREATE TABLE`
**Warning signs:** Cross-district data visible in dashboard

### Pitfall 4: Email Confirmation Template Not Updated
**What goes wrong:** Confirmation links redirect to Supabase's default page instead of your app
**Why it happens:** Default email template uses `{{ .ConfirmationURL }}` which goes to Supabase, not your app
**How to avoid:** Update Supabase email template to use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
**Warning signs:** Users click confirmation link and end up on a Supabase-branded page

### Pitfall 5: Scraper Re-Adding Delisted Jobs
**What goes wrong:** District delists a job, next scraper run re-activates it
**Why it happens:** Scraper upserts with `is_active: true` unconditionally
**How to avoid:** Add a `delisted_at` timestamp column. Scraper checks: if `delisted_at IS NOT NULL`, skip the `is_active` update. This is separate from `is_active` (which the freshness system controls).
**Warning signs:** Delisted jobs reappear after scraper runs

### Pitfall 6: District-Job Matching False Positives
**What goes wrong:** Jobs from other districts get auto-claimed incorrectly
**Why it happens:** Fuzzy matching on district_name can match similar names (e.g., "Springfield SD" vs "Springfield Township SD")
**How to avoid:** Use the established Dice coefficient threshold (0.8) from school-matcher. Show matches for human review before claiming (one-click "Claim All" but user reviews the list first).
**Warning signs:** District dashboard shows jobs from unrelated schools

## Code Examples

### Database Schema Migration (key additions)
```sql
-- New columns on districts table
ALTER TABLE districts ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE districts ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE districts ADD COLUMN verified_at TIMESTAMPTZ;

-- District accounts: links auth.users to districts (many-to-one)
CREATE TABLE district_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id),
  email TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Domain whitelist for auto-verification
CREATE TABLE verified_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  added_by TEXT, -- 'auto' for .k12.pa.us, or admin email for manual
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed .k12.pa.us as auto-verified pattern
-- (Application code checks endsWith('.k12.pa.us') rather than exact match)

-- New columns on jobs table for claim/delist support
ALTER TABLE jobs ADD COLUMN claimed_by_district_id UUID REFERENCES districts(id);
ALTER TABLE jobs ADD COLUMN claimed_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN delisted_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;

-- Index for district profile queries
CREATE INDEX idx_jobs_claimed_district ON jobs(claimed_by_district_id) WHERE claimed_by_district_id IS NOT NULL;
CREATE INDEX idx_districts_slug ON districts(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_districts_verified ON districts(verified) WHERE verified = true;

-- RLS
ALTER TABLE district_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_domains ENABLE ROW LEVEL SECURITY;

-- Public can read verified districts (for profile pages)
CREATE POLICY "Public can read verified districts"
  ON districts FOR SELECT USING (true);

-- District account owners can read own record
CREATE POLICY "Users read own district account"
  ON district_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system (service role) can insert district_accounts
-- (signup flow uses service role client)

-- Jobs: public read (existing), district write for own claimed jobs
CREATE POLICY "Districts can update own claimed jobs"
  ON jobs FOR UPDATE
  USING (
    claimed_by_district_id IN (
      SELECT district_id FROM district_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Districts can insert manual jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    claimed_by_district_id IN (
      SELECT district_id FROM district_accounts WHERE user_id = auth.uid()
    )
    AND is_manual = true
  );
```

### Auto-Match Algorithm for Claiming
```typescript
// Uses existing string-similarity pattern from school-matcher
import { compareTwoStrings } from "string-similarity";

const CLAIM_MATCH_THRESHOLD = 0.8;

async function findClaimableJobs(
  supabase: SupabaseClient,
  districtName: string
): Promise<{ jobId: string; title: string; schoolName: string; score: number }[]> {
  // Query unclaimed active jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, schools!inner(name, district_name)")
    .is("claimed_by_district_id", null)
    .eq("is_active", true);

  if (!jobs) return [];

  const matches = [];
  for (const job of jobs) {
    const schoolDistrictName = job.schools?.district_name ?? "";
    const score = compareTwoStrings(
      districtName.toLowerCase(),
      schoolDistrictName.toLowerCase()
    );
    if (score >= CLAIM_MATCH_THRESHOLD) {
      matches.push({
        jobId: job.id,
        title: job.title,
        schoolName: job.schools?.name ?? "",
        score,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
```

### Verified Badge Component
```typescript
// src/components/district/verified-badge.tsx
import { CheckCircle } from "lucide-react";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-cta", className)}>
      <CheckCircle className="size-3.5" />
      Verified
    </span>
  );
}
```

### Scraper Delist Suppression
```typescript
// In batch-upsert.ts or ingest-pipeline.ts, before setting is_active: true
// Check if the job has been delisted by a district
const { data: existingJob } = await supabase
  .from("jobs")
  .select("delisted_at")
  .eq("source_id", sourceId)
  .eq("external_id", job.externalId)
  .single();

// If delisted, don't override is_active
const jobRecord = {
  ...baseRecord,
  is_active: existingJob?.delisted_at ? undefined : true, // preserve current state if delisted
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | auth-helpers deprecated; ssr is the replacement |
| getSession() for auth checks | getUser() for server-side auth | 2024 | getUser() revalidates with server; getSession() is insecure in server code |
| API routes for auth | Server actions ("use server") | Next.js 14+ | Server actions are simpler and type-safe |
| Custom email confirmation | Supabase built-in PKCE flow | 2024 | Token hash approach replaces older magic link pattern |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr` -- do NOT use
- `supabase.auth.getSession()` in server code: Use `getUser()` instead

## Open Questions

1. **Manual approval workflow for non-.k12.pa.us domains**
   - What we know: Non-standard domains need manual approval; once approved, domain goes to whitelist
   - What's unclear: Who approves? Is there an admin UI, or is it a direct DB update for now?
   - Recommendation: For Phase 7, use direct Supabase dashboard / SQL to approve. Admin UI is a separate concern.

2. **District-to-existing-district matching on signup**
   - What we know: When a user signs up, they need to be linked to an existing `districts` row
   - What's unclear: What if the district doesn't exist in the DB yet (no scraped jobs from that district)?
   - Recommendation: Auto-create a new `districts` row from the email domain + user-provided district name during signup. For existing districts, fuzzy-match the user's provided name against `districts.name`.

3. **Supabase email template configuration**
   - What we know: Must update the confirmation email template in Supabase dashboard
   - What's unclear: Whether this can be done via migration or requires manual dashboard config
   - Recommendation: Document as a manual setup step. Include the template text in the plan for the implementer.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | Signup/login server actions validate input and call Supabase Auth | unit | `npx vitest run tests/auth/auth-actions.test.ts -t "signup"` | Wave 0 |
| DIST-01 | Domain validation logic (k12.pa.us auto-verify, whitelist check) | unit | `npx vitest run tests/auth/domain-validation.test.ts` | Wave 0 |
| DIST-02 | Auto-match algorithm finds correct jobs for district name | unit | `npx vitest run tests/district/claim-matching.test.ts` | Wave 0 |
| DIST-03 | Verified badge renders on claimed jobs | unit | `npx vitest run tests/components/verified-badge.test.ts` | Wave 0 |
| DIST-04 | Listing update actions enforce scraped-immutable rule | unit | `npx vitest run tests/district/listing-actions.test.ts -t "scraped"` | Wave 0 |
| DIST-05 | Delist/relist toggle sets delisted_at correctly | unit | `npx vitest run tests/district/listing-actions.test.ts -t "delist"` | Wave 0 |
| DIST-06 | District profile query returns verified jobs with slug | unit | `npx vitest run tests/queries/district-profile.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/auth/auth-actions.test.ts` -- covers DIST-01 signup/login actions
- [ ] `tests/auth/domain-validation.test.ts` -- covers DIST-01 domain auto-verify logic
- [ ] `tests/district/claim-matching.test.ts` -- covers DIST-02 auto-match algorithm
- [ ] `tests/district/listing-actions.test.ts` -- covers DIST-04, DIST-05 delist/edit logic
- [ ] `tests/queries/district-profile.test.ts` -- covers DIST-06 profile query

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - middleware setup, client creation, auth flow
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy patterns
- [Supabase Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) - domain validation hook option
- [Supabase Password-based Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) - signUp/signIn API
- Existing codebase: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` -- already have SSR client setup
- Existing codebase: `scripts/scrapers/lib/school-matcher.ts`, `scripts/scrapers/lib/job-dedup.ts` -- Dice coefficient fuzzy matching pattern

### Secondary (MEDIUM confidence)
- [Supabase Auth Middleware Gist](https://gist.github.com/joshcoolman-smc/be4de3c3896fe8d4a0e5559c82f915fb) - complete updateSession implementation verified against official docs
- [Supabase General Auth Configuration](https://supabase.com/docs/guides/auth/general-configuration) - domain whitelist settings

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - follows established project patterns (server actions, queries, App Router)
- Auth flow: HIGH - well-documented Supabase SSR pattern with official examples
- Domain validation: MEDIUM - application-level approach is straightforward; before-user-created hook is an alternative but adds complexity
- Pitfalls: HIGH - well-known issues documented extensively in Supabase docs

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- Supabase SSR and Next.js 15 are mature)
