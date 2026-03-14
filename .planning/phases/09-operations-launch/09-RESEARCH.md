# Phase 9: Operations & Launch - Research

**Researched:** 2026-03-14
**Domain:** Production readiness — monitoring, analytics, SEO, performance, security
**Confidence:** HIGH

## Summary

Phase 9 delivers production polish for a Next.js 15 + Supabase portal deployed on Vercel. The core domains are: (1) an admin monitoring dashboard reading from the existing `scrape_logs` table, (2) failure alerting via Resend email, (3) Vercel Analytics for page views with a critical caveat about custom events on Hobby plan, (4) SEO with sitemap, JSON-LD, and Open Graph, (5) performance profiling and static generation, and (6) launch polish (error pages, favicons, security headers).

The existing infrastructure is solid — `scrape_logs` already captures all needed monitoring data, Resend is integrated, admin client bypasses RLS, and middleware handles auth. The primary new code is the admin monitoring dashboard (charting library + queries), SEO metadata, and security headers in `next.config.ts`.

**Primary recommendation:** Use Recharts 3.x for monitoring charts, Vercel Analytics for page views only (custom events require Pro plan — track search/filter via simple console or skip), Next.js built-in sitemap.ts and generateMetadata for SEO, and `headers()` in next.config.ts for security headers.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Admin-only monitoring page at /admin/monitoring, protected via existing district auth with admin flag
- Dashboard shows four views: scrape timeline (status dots), job count trends (line chart), error log viewer, source summary cards
- Data source: existing `scrape_logs` table — no new DB tables for monitoring
- Email alerts via Resend on scrape failures (reuse existing Resend integration pattern)
- Alert sent to operator email on "failure" or "partial_failure" status
- No Slack/GitHub integration — email only
- Vercel Analytics (free tier) for page views and web vitals
- Custom events for: search queries and filter usage
- Job click-throughs and coaching submissions NOT tracked as custom events
- Use Vercel's built-in analytics dashboard only — no analytics UI on admin page
- Target: search results under 2 seconds
- Static generation with periodic revalidation for landing, about, coaching pages
- Profile query performance and add indexes as needed
- No aggressive sub-1s optimization or edge caching
- Meta tags and Open Graph images for social media sharing
- Auto-generated sitemap.xml
- JSON-LD JobPosting structured data on job detail pages
- Custom branded 404 and 500 error pages
- Favicon, Apple touch icon, and PWA manifest icons
- Security headers via next.config.ts (CSP, X-Frame-Options, etc.)
- Launching on school-job-portal.vercel.app — custom domain later

### Claude's Discretion
- Exact monitoring dashboard layout and charting library
- Revalidation intervals for static pages
- Specific database index choices based on query profiling
- OG image design approach (static vs dynamic)
- Specific CSP directives and security header values

### Deferred Ideas (OUT OF SCOPE)
- Data quality deep-dive — scraping accuracy, messy data cleanup, source reliability improvements (V2 priority)
- Comprehensive cybersecurity audit — protect sensitive user data and operator data across all surfaces (V2)
- Custom domain setup — purchase and connect domain when business name is decided
- Public status page — could add later if users want transparency on data freshness
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-02 | Scraping pipeline runs reliably on schedule without manual intervention | GitHub Actions workflows already exist (scrape.yml staggered daily). Add failure alerting via Resend post-scrape to surface issues. Pipeline is already running — this requirement confirms reliability + monitoring. |
| INFRA-03 | Scrape monitoring tracks success/failure counts per source | `scrape_logs` table has all fields. Build admin dashboard querying this table with Recharts charts for visualization. |
| INFRA-04 | Portal has basic analytics to track usage (page views, search queries) | Vercel Analytics for page views (free). Custom events for search/filter require Pro plan — implement with client-side track() but note it only works on Pro. |
| UI-03 | Search results load quickly (under 2 seconds) | Profile existing search_jobs RPC, add database indexes if needed, implement static generation for non-search pages. Measure with Vercel Web Vitals. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.x | Monitoring dashboard charts (line charts, status visualization) | Most popular React charting lib, 3.6M+ weekly downloads, React 19 compatible, SVG-based, declarative components |
| @vercel/analytics | latest | Page view tracking and web vitals | Native Vercel integration, one-line setup, privacy-friendly |
| resend | 6.9.x (existing) | Failure alert emails | Already integrated in project (coaching-action.ts pattern) |
| next (existing 15.5.x) | 15.5.12 | Built-in sitemap.ts, generateMetadata, OG images, security headers | Already in project — leverages native App Router features |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vercel/speed-insights | latest | Web Vitals measurement in production | Companion to Analytics, measures real-user performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js / react-chartjs-2 | Chart.js uses canvas (not SVG), less React-idiomatic; Recharts is declarative React components |
| Recharts | Tremor | Higher-level dashboard components but heavier dependency; Recharts is lighter for 2-3 charts |
| Static OG images | Dynamic next/og ImageResponse | Dynamic is more complex; static PNG is simpler for a site with one brand image |

**Installation:**
```bash
npm install recharts @vercel/analytics @vercel/speed-insights
```

**Note on react-is override:** Recharts 3.x with React 19 may need a `react-is` version override in package.json. If peer dependency warnings appear:
```json
"overrides": {
  "react-is": "^19.0.0"
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── admin/
│   │   └── monitoring/
│   │       └── page.tsx           # Admin monitoring dashboard
│   ├── not-found.tsx              # Custom 404 page
│   ├── error.tsx                  # Custom 500 error boundary
│   ├── sitemap.ts                 # Dynamic sitemap generation
│   ├── robots.ts                  # (optional — already have public/robots.txt)
│   ├── layout.tsx                 # Add <Analytics /> and <SpeedInsights />
│   └── jobs/
│       └── [id]/
│           └── page.tsx           # Add JSON-LD JobPosting structured data
├── lib/
│   ├── queries/
│   │   └── get-monitoring-data.ts # Admin dashboard queries
│   └── actions/
│       └── alert-action.ts        # Scrape failure alert email (server action)
├── components/
│   └── admin/
│       ├── scrape-timeline.tsx    # Status dots chart
│       ├── job-count-chart.tsx    # Line chart
│       ├── error-log-viewer.tsx   # Expandable error list
│       └── source-summary.tsx     # Per-source cards
└── scripts/
    └── scrapers/
        └── lib/
            └── alert.ts           # Post-scrape email alert function
```

### Pattern 1: Admin Route Protection via Middleware
**What:** Extend existing middleware to protect /admin/* routes, checking both auth and admin flag.
**When to use:** All admin-only pages.
**Example:**
```typescript
// In middleware.ts — extend the existing updateSession function
if (request.nextUrl.pathname.startsWith("/admin")) {
  if (!user) {
    return NextResponse.redirect(new URL("/for-schools/login", request.url));
  }
  // Admin check happens in page component (middleware can't query DB efficiently)
  // Page-level: check user email against OPERATOR_EMAIL env var
}
```

### Pattern 2: Admin Dashboard Queries (Server Component)
**What:** Query scrape_logs with admin client in server components, no client-side data fetching needed.
**When to use:** Monitoring dashboard data.
**Example:**
```typescript
// src/lib/queries/get-monitoring-data.ts
"use server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getRecentScrapeRuns(days: number = 30) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*, sources!inner(name, slug)")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

### Pattern 3: Recharts in Client Components
**What:** Recharts components must be client components ("use client"). Pass data from server component via props.
**When to use:** All chart rendering.
**Example:**
```typescript
// components/admin/job-count-chart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function JobCountChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="var(--cta)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 4: Post-Scrape Email Alert
**What:** After each scrape run completes, check scrape_logs for failure/partial_failure and send email.
**When to use:** In the scraper run.ts after each adapter finishes.
**Example:**
```typescript
// scripts/scrapers/lib/alert.ts
import { Resend } from "resend";

export async function sendScrapeAlert(
  sourceName: string,
  status: string,
  errors: Array<{ message: string }>
) {
  const apiKey = process.env.RESEND_API_KEY;
  const operatorEmail = process.env.OPERATOR_EMAIL;
  if (!apiKey || !operatorEmail) return; // Silently skip if not configured

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "PA Educator Jobs <onboarding@resend.dev>",
    to: [operatorEmail],
    subject: `[Alert] Scrape ${status}: ${sourceName}`,
    html: `<h2>Scrape ${status === "failure" ? "Failed" : "Partially Failed"}: ${sourceName}</h2>
           <p>Errors: ${errors.map(e => e.message).join(", ")}</p>`,
  });
}
```

### Pattern 5: Next.js Built-in Sitemap
**What:** Export a default function from `app/sitemap.ts` that returns MetadataRoute.Sitemap.
**When to use:** Dynamic sitemap generation querying jobs from DB.
**Example:**
```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, updated_at")
    .eq("is_active", true);

  const jobEntries = (jobs ?? []).map((job) => ({
    url: `https://school-job-portal.vercel.app/jobs/${job.id}`,
    lastModified: job.updated_at,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: "https://school-job-portal.vercel.app", changeFrequency: "daily", priority: 1 },
    { url: "https://school-job-portal.vercel.app/jobs", changeFrequency: "daily", priority: 0.9 },
    { url: "https://school-job-portal.vercel.app/about", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://school-job-portal.vercel.app/coaching", changeFrequency: "monthly", priority: 0.5 },
    ...jobEntries,
  ];
}
```

### Pattern 6: JSON-LD Structured Data
**What:** Render a `<script type="application/ld+json">` tag in job detail page with JobPosting schema.
**When to use:** Every job detail page, for Google Jobs rich results.
**Example:**
```typescript
// In job detail page component
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: job.title,
  description: job.description,
  datePosted: job.first_seen_at,
  hiringOrganization: {
    "@type": "Organization",
    name: job.school_name,
  },
  jobLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressRegion: "PA" },
  },
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
    {/* rest of page */}
  </>
);
```

### Anti-Patterns to Avoid
- **Querying scrape_logs from client components:** Always use server components/actions with admin client. Never expose service_role key to client.
- **Putting Recharts in server components:** Recharts uses browser APIs (SVG rendering). Must be "use client" with data passed as props.
- **Using nonce-based CSP without middleware:** For this project, static CSP in next.config.ts headers() is simpler and sufficient. Nonce-based CSP requires middleware and dynamic rendering, adding complexity.
- **Blocking layout render on analytics:** Load `<Analytics />` and `<SpeedInsights />` components — they're async and non-blocking by design.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page view analytics | Custom tracking solution | @vercel/analytics | One-line setup, privacy-compliant, built-in dashboard |
| Sitemap generation | Manual XML builder | Next.js app/sitemap.ts | Built into framework, typed, auto-served |
| OG image meta tags | Manual <meta> tags | Next.js generateMetadata | Framework handles deduplication, streaming |
| Web Vitals | Custom performance monitoring | @vercel/speed-insights | Automatic Core Web Vitals collection |
| Security headers | Custom middleware | next.config.ts headers() | Declarative, applies to all routes |
| Chart rendering | Custom SVG/Canvas | Recharts | Handles axes, tooltips, responsiveness, animation |

**Key insight:** Next.js 15 has built-in solutions for sitemap, metadata, OG images, and security headers. The only external additions needed are Recharts (charts) and @vercel/analytics (tracking).

## Common Pitfalls

### Pitfall 1: Vercel Analytics Custom Events Require Pro Plan
**What goes wrong:** Custom events (search queries, filter usage) are configured but silently don't record on Hobby plan.
**Why it happens:** Vercel limits custom events to Pro and Enterprise plans. Free tier only gets page views.
**How to avoid:** Implement the track() calls but document that they only activate on Pro. For Hobby, page views and web vitals still work. Consider upgrading to Pro ($20/mo) if custom event tracking is essential.
**Warning signs:** Events appear in code but not in Vercel Analytics dashboard.

### Pitfall 2: Recharts "use client" Requirement
**What goes wrong:** Import Recharts in a server component, get "window is not defined" or hydration errors.
**Why it happens:** Recharts uses browser DOM APIs for SVG rendering.
**How to avoid:** Always mark chart components with "use client". Fetch data in server component, pass as props.
**Warning signs:** Build errors mentioning window/document, hydration mismatches.

### Pitfall 3: CSP Blocking Vercel Analytics Script
**What goes wrong:** Analytics script blocked by Content-Security-Policy, no data collected.
**Why it happens:** CSP script-src too restrictive, doesn't allow Vercel's analytics domain.
**How to avoid:** Include `https://va.vercel-scripts.com` in script-src and connect-src CSP directives.
**Warning signs:** Browser console shows CSP violation errors.

### Pitfall 4: Sitemap Size with Many Jobs
**What goes wrong:** Single sitemap exceeds 50MB or 50,000 URL limit.
**Why it happens:** Large number of active job listings.
**How to avoid:** For this project, likely under 50K jobs, so single sitemap is fine. If it grows, use generateSitemaps() for pagination.
**Warning signs:** Sitemap file larger than 10MB, Google Search Console warnings.

### Pitfall 5: Admin Check in Middleware vs Page
**What goes wrong:** Middleware tries to query DB for admin status, causing latency on every request.
**Why it happens:** Middleware runs on every matching request and shouldn't do heavy DB queries.
**How to avoid:** Middleware only checks auth (is user logged in?). Admin check (is this the operator email?) happens in the page component server-side.
**Warning signs:** Slow page loads across entire site, unnecessary DB calls.

### Pitfall 6: JSON-LD XSS via Job Descriptions
**What goes wrong:** Malicious content in scraped job descriptions breaks out of JSON-LD script tag.
**Why it happens:** `</script>` in description text closes the script tag prematurely.
**How to avoid:** Replace `<` with `\u003c` in JSON.stringify output before setting dangerouslySetInnerHTML.
**Warning signs:** Broken page rendering on certain job detail pages.

## Code Examples

### Vercel Analytics Setup in Root Layout
```typescript
// app/layout.tsx — add these imports and components
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Inside the <body> tag, after all other content:
<Analytics />
<SpeedInsights />
```

### Custom Event Tracking (Client-Side)
```typescript
// In a client component, e.g., search input handler
import { track } from "@vercel/analytics";

function handleSearch(query: string) {
  track("search", { query: query.slice(0, 255) }); // 255 char limit
}

function handleFilterApply(filterType: string) {
  track("filter_applied", { type: filterType });
}
```

### Security Headers in next.config.ts
```typescript
// next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

### Static Generation with Revalidation
```typescript
// app/page.tsx (landing page)
export const revalidate = 3600; // Revalidate every hour

// app/about/page.tsx
export const revalidate = 86400; // Revalidate daily (content rarely changes)

// app/coaching/page.tsx
export const revalidate = 86400; // Revalidate daily
```

### Custom 404 Page
```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
      <Link href="/jobs" className="mt-8 rounded-lg bg-cta px-6 py-3 font-semibold text-cta-foreground">
        Browse Jobs
      </Link>
    </div>
  );
}
```

### Admin Identity Check (Simple Email-Based)
```typescript
// In monitoring page server component
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MonitoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.OPERATOR_EMAIL) {
    redirect("/");
  }

  // ... render dashboard
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-sitemap package | Built-in app/sitemap.ts | Next.js 13+ App Router | No external dependency needed |
| next-seo package | Built-in generateMetadata | Next.js 13+ App Router | Framework-native, typed metadata |
| helmet / custom middleware | next.config.ts headers() | Next.js 12+ | Declarative, no middleware needed for static headers |
| next/head for meta tags | Metadata API exports | Next.js 13+ App Router | Automatic deduplication, streaming support |
| Google Analytics | Vercel Analytics | 2023+ | Privacy-friendly, no cookie banner needed, built into Vercel |

**Deprecated/outdated:**
- `next-seo`: Replaced by built-in Metadata API in App Router
- `next-sitemap`: Replaced by built-in sitemap.ts convention
- Manual `<Head>` tags: Use generateMetadata or metadata export instead

## Open Questions

1. **Vercel Pro plan for custom events**
   - What we know: Custom events (search queries, filter usage) require Vercel Pro plan ($20/mo). Hobby tier only tracks page views.
   - What's unclear: Whether the operator wants to upgrade to Pro for this feature.
   - Recommendation: Implement the track() calls in code so they activate automatically if/when Pro is enabled. Page views work on free tier regardless. Document this limitation.

2. **Admin flag storage**
   - What we know: CONTEXT.md says "admin flag on the user account" — could be email check against OPERATOR_EMAIL env var, or a DB column.
   - What's unclear: Which approach is preferred.
   - Recommendation: Use OPERATOR_EMAIL env var comparison (simplest, no migration needed, single operator). Add DB column later if multiple admins needed.

3. **Recharts react-is peer dependency**
   - What we know: Recharts 3.x works with React 19 but may warn about react-is version.
   - What's unclear: Whether override is needed with current Recharts 3.8 release.
   - Recommendation: Install and test — add override only if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (unit) + Playwright 1.58 (e2e) |
| Config file | vitest.config.ts, playwright.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements - Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-02 | Scrape pipeline runs on schedule | manual-only | Verify via GitHub Actions run history | N/A — cron job, manual verification |
| INFRA-03 | Monitoring dashboard shows scrape data | e2e | `npx playwright test tests/e2e/monitoring.spec.ts` | No — Wave 0 |
| INFRA-04 | Analytics tracks page views | manual-only | Verify Analytics component renders in layout; actual tracking verified in Vercel dashboard | N/A — third-party service |
| UI-03 | Search results load under 2 seconds | e2e | `npx playwright test tests/e2e/performance.spec.ts` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/e2e/monitoring.spec.ts` — covers INFRA-03 (admin dashboard loads, shows scrape data)
- [ ] `tests/e2e/performance.spec.ts` — covers UI-03 (search page loads within timeout)
- [ ] `tests/unit/alert.test.ts` — covers alert email logic (Resend call with correct params)

## Sources

### Primary (HIGH confidence)
- Vercel Analytics docs (https://vercel.com/docs/analytics/quickstart) — setup, custom events, pricing
- Vercel Analytics pricing (https://vercel.com/docs/analytics/limits-and-pricing) — Hobby vs Pro custom events
- Next.js sitemap docs (https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — built-in sitemap.ts
- Next.js JSON-LD guide (https://nextjs.org/docs/app/guides/json-ld) — structured data pattern
- Next.js CSP guide (https://nextjs.org/docs/app/guides/content-security-policy) — security headers
- Next.js generateMetadata (https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — OG images

### Secondary (MEDIUM confidence)
- Recharts GitHub (https://github.com/recharts/recharts) — React 19 compatibility, version 3.8.0
- Recharts npm (https://www.npmjs.com/package/recharts) — latest version, weekly downloads
- Vercel custom events docs (https://vercel.com/docs/analytics/custom-events) — track function API

### Tertiary (LOW confidence)
- None — all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are well-documented, verified compatible with project stack
- Architecture: HIGH — patterns follow existing project conventions (admin client, server components, Resend)
- Pitfalls: HIGH — CSP + analytics interaction verified in official docs, Pro plan limitation confirmed
- SEO patterns: HIGH — all using Next.js built-in features with official documentation

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days — stable technologies, unlikely to change)
