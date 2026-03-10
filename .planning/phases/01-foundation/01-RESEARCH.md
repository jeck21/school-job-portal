# Phase 1: Foundation - Research

**Researched:** 2026-03-10
**Domain:** Next.js + Supabase project setup, deployment, database schema, UI shell
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire technical foundation: a Next.js 15 App Router project with Supabase (PostgreSQL + PostGIS), deployed to Vercel, with a branded landing page and UI skeleton. The visual identity targets a Linear.app-inspired dark slate + electric blue palette using shadcn/ui components with Tailwind CSS variables.

The database schema must support all future phases (jobs, sources, schools, districts) while remaining simple enough that Phase 1 only needs the tables, not the data. The UI shell establishes the design system, navigation structure, and page layout pattern that every subsequent phase builds upon.

**Primary recommendation:** Use `create-next-app` with TypeScript + Tailwind + App Router + src directory, add shadcn/ui for components, Supabase CLI for schema migrations, and deploy to Vercel's Hobby tier. Keep the dark theme as default since the target Linear.app aesthetic is dark-first.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Bold and distinctive but credible visual identity -- dark slate + electric blue color palette
- Linear.app as the primary style reference -- dark, crisp, premium feel with subtle polish
- Geometric sans-serif typography (Inter, Outfit, or Plus Jakarta Sans family)
- Lucide icons throughout
- Modern rounded corners (8-12px radius) on cards and buttons
- Presentable MVP polish level -- clean and professional, pixel-perfection saved for Phase 8
- Value proposition hero with matchmaking framing for BOTH audiences (educators and districts/schools)
- Dual-audience layout below hero: parallel "For Educators" and "For Schools/Districts" sections
- Stats section with placeholders (hidden or show zeros gracefully until data exists)
- Full nav skeleton: Home, Jobs, About, For Schools
- Unbuilt pages show styled "Coming Soon" pages
- Jobs page exists as a shell ready for Phase 3
- Working title "PA Educator Jobs" everywhere
- Site name, tagline, meta info centralized in a single config file
- Header shows icon (simple geometric mark) + styled text "PA Educator Jobs"

### Claude's Discretion
- Color mode default (dark vs light vs system preference)
- Header layout (logo left + nav center + CTA right, or simpler arrangement)
- Footer design (substantial multi-column vs minimal)
- Exact color values for the dark slate + electric blue palette
- Loading skeleton and transition designs
- Database schema structure (tables, columns, relationships, multi-state-ready architecture)
- Deployment configuration and Supabase setup
- Specific geometric sans-serif font choice within the family

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Portal is deployed and publicly accessible on a custom domain | Vercel Hobby tier deployment, environment variables for Supabase, git-push deploy workflow |
| UI-01 | Portal has a professional, polished, trustworthy visual design | shadcn/ui + Tailwind CSS variables, dark slate/electric blue theme, Plus Jakarta Sans font, Lucide icons, Linear.app-inspired design system |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (latest 15) | React framework with App Router | Locked decision from roadmap; stable, Vercel-native |
| React | 19.x | UI library | Ships with Next.js 15 |
| TypeScript | 5.x | Type safety | Default with create-next-app |
| Tailwind CSS | 4.x | Utility-first CSS | Ships with create-next-app, powers shadcn/ui theming |
| @supabase/supabase-js | 2.x | Supabase client | Official JS client for database queries |
| @supabase/ssr | latest | Server-side Supabase client | Required for Next.js App Router SSR cookie handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | Component library (copy-paste, not dependency) | All UI components -- buttons, cards, nav, etc. |
| lucide-react | 0.577+ | Icon library | All icons throughout the portal (locked decision) |
| next-themes | 0.4+ | Theme management (dark/light) | Dark mode toggle, system preference detection |
| Plus Jakarta Sans | Google Fonts | Primary typeface | Geometric sans-serif -- more distinctive than Inter while remaining highly readable |
| Supabase CLI | latest | Local dev, migrations, type generation | Schema migrations, local Supabase stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plus Jakarta Sans | Inter | Inter is more ubiquitous/safe but less distinctive; Plus Jakarta has more geometric character that fits the "bold and distinctive" brief |
| Plus Jakarta Sans | Outfit | Outfit is more rounded/playful; Plus Jakarta feels more authoritative for a professional job portal |
| shadcn/ui | Radix UI raw | shadcn provides pre-styled components; Radix alone requires more custom styling work |

**Installation:**
```bash
# Create project
npx create-next-app@15 school-job-portal --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Add Supabase
npm install @supabase/supabase-js @supabase/ssr

# Add icons and theming
npm install lucide-react next-themes

# Initialize shadcn/ui
npx shadcn@latest init

# Initialize Supabase (requires Docker for local dev)
npx supabase init
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (font, theme provider, metadata)
│   ├── page.tsx            # Landing page (hero, dual-audience, stats)
│   ├── jobs/
│   │   └── page.tsx        # Jobs shell (empty, ready for Phase 3)
│   ├── about/
│   │   └── page.tsx        # Coming Soon page
│   └── for-schools/
│       └── page.tsx        # Coming Soon page
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── header.tsx      # Site header with nav
│   │   ├── footer.tsx      # Site footer
│   │   └── nav.tsx         # Navigation component
│   ├── landing/
│   │   ├── hero.tsx        # Hero section
│   │   ├── audience-cards.tsx  # Dual-audience section
│   │   └── stats-bar.tsx   # Stats placeholders
│   └── coming-soon.tsx     # Reusable "Coming Soon" page component
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   └── server.ts       # Server Supabase client
│   ├── site-config.ts      # Centralized site name, tagline, meta (single config file)
│   └── utils.ts            # cn() helper from shadcn/ui
├── styles/
│   └── globals.css         # Tailwind imports + CSS variable theme
└── types/
    └── database.ts         # Supabase generated types (future)
supabase/
├── config.toml             # Supabase local config
├── migrations/
│   └── 00001_initial_schema.sql  # Initial database schema
└── seed.sql                # Optional seed data
```

### Pattern 1: Centralized Site Config
**What:** All branding (site name, tagline, description, social links) in one importable file
**When to use:** Everywhere -- header, footer, metadata, landing page
**Example:**
```typescript
// src/lib/site-config.ts
export const siteConfig = {
  name: "PA Educator Jobs",
  tagline: "Connecting the right educators with the right jobs",
  description: "Find every relevant PA educator job opening in one place with filters that actually work.",
  url: "https://paeducatorjobs.com", // Update when domain chosen
  nav: [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: "About", href: "/about" },
    { label: "For Schools", href: "/for-schools" },
  ],
} as const;
```

### Pattern 2: CSS Variable Theme System
**What:** Dark slate + electric blue palette defined as CSS variables, consumed by Tailwind and shadcn/ui
**When to use:** All styling -- components automatically inherit the palette
**Example:**
```css
/* globals.css - Dark-first theme */
@layer base {
  :root {
    /* Light mode fallback */
    --background: 210 20% 98%;
    --foreground: 215 25% 12%;
    --primary: 217 91% 55%;        /* Electric blue */
    --primary-foreground: 0 0% 100%;
    --card: 210 18% 95%;
    --card-foreground: 215 25% 12%;
    --muted: 210 15% 90%;
    --muted-foreground: 215 15% 45%;
    --border: 214 15% 85%;
    --radius: 0.625rem;            /* 10px - middle of 8-12px range */
  }

  .dark {
    --background: 220 20% 8%;      /* Dark slate */
    --foreground: 210 15% 90%;
    --primary: 217 91% 55%;        /* Electric blue */
    --primary-foreground: 0 0% 100%;
    --card: 220 18% 12%;
    --card-foreground: 210 15% 90%;
    --muted: 220 15% 18%;
    --muted-foreground: 215 15% 55%;
    --border: 220 15% 20%;
  }
}
```

### Pattern 3: Supabase Client Utilities
**What:** Separate browser and server Supabase clients following official @supabase/ssr pattern
**When to use:** Any database access -- browser client for client components, server client for server components/actions
**Example:**
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Anti-Patterns to Avoid
- **Putting all code in app/ directory:** Keep components, lib, types separate from route files
- **Hardcoding "PA Educator Jobs" in components:** Always import from site-config.ts
- **Using Supabase client directly in components:** Wrap in lib/supabase utilities for consistency
- **Inline color values instead of CSS variables:** Breaks theming; always use the variable system
- **Creating a `utils.ts` dumping ground:** Keep utility functions organized by domain in lib/

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI components | Custom buttons, cards, inputs | shadcn/ui | Accessible, themeable, consistent; copy-paste ownership |
| Dark mode | Custom theme toggle + localStorage | next-themes | Handles SSR hydration, system preference, class strategy |
| Database migrations | Raw SQL scripts run manually | Supabase CLI migrations | Versioned, repeatable, works with local + remote |
| Icons | Custom SVGs or icon fonts | lucide-react | Tree-shakable, consistent sizing, locked decision |
| Font loading | Manual @font-face or external links | next/font/google | Automatic optimization, zero layout shift, self-hosted |
| Deployment | Manual server setup | Vercel (git push deploy) | Zero config for Next.js, free Hobby tier, automatic HTTPS |
| CSS framework | Custom CSS or CSS modules | Tailwind CSS via shadcn/ui variables | Consistent with component library, rapid development |

**Key insight:** Phase 1 establishes patterns. Every library choice here propagates through 8 more phases. Using established, well-integrated tools (shadcn + Tailwind + next-themes) means zero integration surprises later.

## Common Pitfalls

### Pitfall 1: Forgetting Middleware for Supabase SSR
**What goes wrong:** Auth tokens don't refresh, session state inconsistent between server and client
**Why it happens:** @supabase/ssr requires a Next.js middleware to proxy cookie updates
**How to avoid:** Create middleware.ts even though Phase 1 doesn't use auth -- it's needed by Phase 7 and easier to set up now
**Warning signs:** Hydration mismatches, stale session data

### Pitfall 2: CSS Variable Naming Conflicts with shadcn/ui
**What goes wrong:** Custom theme variables don't apply to shadcn components
**Why it happens:** shadcn/ui expects specific variable names (--background, --foreground, --primary, etc.)
**How to avoid:** Follow shadcn/ui's exact variable naming convention in globals.css; customize values, not names
**Warning signs:** Components render with wrong colors or fall back to defaults

### Pitfall 3: Font Flash / Layout Shift
**What goes wrong:** Page flashes with fallback font before custom font loads
**Why it happens:** Not using next/font, or importing Google Fonts via <link> tag
**How to avoid:** Use `next/font/google` in layout.tsx with `display: 'swap'` and apply to body via className
**Warning signs:** Visible text reflow on page load

### Pitfall 4: Dark Mode Hydration Mismatch
**What goes wrong:** React hydration error, flash of wrong theme
**Why it happens:** Server renders one theme, client detects different system preference
**How to avoid:** Add `suppressHydrationWarning` to <html> tag, use next-themes ThemeProvider with `attribute="class"`
**Warning signs:** Console hydration warnings, brief flash of light theme

### Pitfall 5: Supabase Environment Variables Missing in Production
**What goes wrong:** App crashes on Vercel with undefined Supabase URL
**Why it happens:** .env.local not committed (correctly), but Vercel env vars not configured
**How to avoid:** Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings before first deploy
**Warning signs:** Runtime errors mentioning undefined URL or key

### Pitfall 6: PostGIS Extension Not Enabled
**What goes wrong:** Phase 4 radius search fails because geography columns aren't available
**Why it happens:** PostGIS must be explicitly enabled in Supabase
**How to avoid:** Enable PostGIS in the initial migration: `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;`
**Warning signs:** Error on geography/geometry column types

## Code Examples

### Next.js Root Layout with Theme + Font
```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/lib/site-config";
import "@/styles/globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Provider Component
```typescript
// src/components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Initial Database Migration
```sql
-- supabase/migrations/00001_initial_schema.sql

-- Enable PostGIS for future radius search (Phase 4)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Sources: where jobs come from (PAREAP, PAeducator.net, PDE, etc.)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- e.g. "PAREAP", "PAeducator.net"
  slug TEXT NOT NULL UNIQUE,          -- URL-safe identifier
  base_url TEXT,                      -- Source website URL
  scraper_type TEXT,                  -- Adapter identifier for scraper
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schools and districts
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_name TEXT,                 -- Parent district if applicable
  school_type TEXT,                   -- 'public', 'private', 'charter', 'iu', 'pattan', 'pde'
  address TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'PA',   -- PA-first, multi-state-ready
  zip_code TEXT,
  location GEOGRAPHY(POINT, 4326),   -- PostGIS point for radius search
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Districts (for district accounts in Phase 7)
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PA',
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs: the core entity
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id),
  school_id UUID REFERENCES schools(id),
  district_id UUID REFERENCES districts(id),
  external_id TEXT,                   -- ID from the source system
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,                  -- Original posting URL
  location_raw TEXT,                  -- Raw location string from source
  location GEOGRAPHY(POINT, 4326),   -- Geocoded point for radius search
  city TEXT,
  state TEXT NOT NULL DEFAULT 'PA',
  zip_code TEXT,
  school_type TEXT,                   -- Denormalized for fast filtering
  grade_band TEXT[],                  -- Array: 'prek', 'elementary', 'middle', 'high'
  subject_area TEXT[],                -- Array: 'math', 'science', 'sped', etc.
  salary_mentioned BOOLEAN DEFAULT false,
  salary_raw TEXT,                    -- Raw salary text from posting
  certifications TEXT[],             -- Extracted cert requirements
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Composite unique constraint to prevent duplicates from same source
  UNIQUE(source_id, external_id)
);

-- Job-source attribution (for dedup: same job from multiple sources)
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id),
  external_id TEXT,
  external_url TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, source_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_school_type ON jobs(school_type);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_source_id ON jobs(source_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_schools_location ON schools USING GIST(location);
CREATE INDEX idx_schools_state ON schools(state);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON districts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Coming Soon Page Component
```typescript
// src/components/coming-soon.tsx
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
    </div>
  );
}
```

## Database Schema Design Decisions

### Multi-State Ready
The `state` column defaults to `'PA'` but exists on schools, districts, and jobs. Future expansion requires no schema changes -- just new data with different state values.

### Deduplication Strategy
The `job_sources` table tracks which sources a job appears on. The primary `jobs` record is the canonical entry; `job_sources` records each source's URL for attribution. Phase 5 dedup logic will merge into this structure.

### Forward Compatibility
- `grade_band` and `subject_area` as arrays support Phase 4 filtering
- `salary_mentioned` boolean supports Phase 6 salary flag
- `certifications` array supports Phase 6 cert extraction
- `location` geography column supports Phase 4 radius search
- `district_id` on jobs supports Phase 7 district claims

## Discretion Recommendations

### Color Mode: Default to Dark
**Recommendation:** Default theme = "dark" with system override option available.
**Rationale:** The Linear.app reference is dark-first. The dark slate + electric blue palette is designed for dark backgrounds. Educators browsing jobs in the evening (common for employed teachers) benefit from dark mode. The distinctive dark aesthetic differentiates from light-blue-and-white job board competitors.

### Header Layout: Logo Left + Nav Center + CTA Right
**Recommendation:** Logo/site name left, main nav items centered, "Browse Jobs" CTA button right.
**Rationale:** Standard SaaS/professional layout. The CTA drives toward the primary user action. Linear.app uses a similar layout.

### Footer: Minimal Single-Row
**Recommendation:** Simple footer with copyright, site name, and a few links. Not a multi-column mega-footer.
**Rationale:** Presentable MVP level -- a substantial footer with multiple columns implies more content than exists in Phase 1. Scale up the footer as the site grows.

### Font: Plus Jakarta Sans
**Recommendation:** Plus Jakarta Sans over Inter or Outfit.
**Rationale:** More geometric character than Inter (which is everywhere), more authoritative than Outfit (which skews playful). Fits the "bold and distinctive but credible" brief. Available on Google Fonts, excellent screen readability.

### Color Palette Values
**Recommendation:** Dark slate background (~hsl(220, 20%, 8%)), electric blue primary (~hsl(217, 91%, 55%)), with desaturated slate variants for cards and surfaces.
**Rationale:** Matches the dark + electric blue brief. The blue at 55% lightness provides good contrast on dark backgrounds while being vibrant enough to feel "electric." Desaturated variants prevent visual fatigue.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next/font custom config | next/font/google built-in | Next.js 13+ | Zero-config font optimization |
| @supabase/auth-helpers | @supabase/ssr | 2024 | Unified SSR client creation, cookie-based sessions |
| pages/ router | app/ router | Next.js 13, stable in 15 | Server components default, layouts, loading states |
| Tailwind v3 config file | Tailwind v4 CSS-first | 2025 | Configuration in CSS, not JS; simpler setup |
| shadcn/ui CLI v0 | shadcn CLI (no /ui) | 2024 | Updated initialization command: `npx shadcn@latest init` |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr` -- do not use
- `pages/` directory: App Router is the standard for new projects
- `next.config.js`: Next.js 15 uses `next.config.ts` (TypeScript) by default

## Open Questions

1. **Custom domain setup**
   - What we know: Vercel supports custom domains on Hobby tier
   - What's unclear: Whether the user has a domain purchased yet ("PA Educator Jobs" is a working title)
   - Recommendation: Deploy to default Vercel URL (*.vercel.app) first; add custom domain when available. INFRA-01 says "custom domain" but the context says domain is TBD -- deploy to a publicly accessible URL satisfies the requirement

2. **Supabase project: local-first or cloud-first?**
   - What we know: Supabase CLI supports full local development with Docker; cloud projects have free tier
   - What's unclear: Whether the developer has Docker installed for local Supabase
   - Recommendation: Create a Supabase cloud project (free tier) for the deployed app. Local development can use the cloud project directly or local Docker stack. Migrations go in `supabase/migrations/` either way.

3. **Tailwind v4 compatibility with shadcn/ui**
   - What we know: shadcn/ui has documented Tailwind v4 support
   - What's unclear: Edge cases with the new CSS-first config approach
   - Recommendation: Follow shadcn/ui's Tailwind v4 guide explicitly during initialization

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (unit) |
| Config file | None -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Portal accessible at URL, renders landing page | E2E/smoke | `npx playwright test tests/e2e/landing.spec.ts` | Wave 0 |
| UI-01 | Professional visual design renders correctly | E2E/smoke | `npx playwright test tests/e2e/landing.spec.ts` | Wave 0 |
| SCHEMA | Database tables exist with correct structure | unit | `npx vitest run tests/unit/schema.test.ts` | Wave 0 |
| NAV | All nav links render and route correctly | E2E | `npx playwright test tests/e2e/navigation.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration
- [ ] `playwright.config.ts` -- Playwright configuration
- [ ] `tests/e2e/landing.spec.ts` -- Landing page renders, shows site name, has nav links
- [ ] `tests/e2e/navigation.spec.ts` -- Nav links route to correct pages, Coming Soon pages render
- [ ] `tests/unit/schema.test.ts` -- Verify migration SQL is valid / tables exist
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react playwright @playwright/test`

## Sources

### Primary (HIGH confidence)
- [Next.js official docs](https://nextjs.org/docs/app/getting-started/installation) -- project setup, App Router, font loading
- [Supabase official docs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) -- Next.js quickstart, SSR client setup
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) -- PostGIS extension setup
- [Supabase migration docs](https://supabase.com/docs/guides/deployment/database-migrations) -- CLI migration workflow
- [shadcn/ui docs](https://ui.shadcn.com/docs/theming) -- theming with CSS variables, dark mode, Tailwind v4
- [Vercel pricing](https://vercel.com/pricing) -- Hobby tier capabilities

### Secondary (MEDIUM confidence)
- [shadcn/ui Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4) -- v4 specific setup
- [Lucide React docs](https://lucide.dev/guide/packages/lucide-react) -- installation and usage
- [Plus Jakarta Sans on Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans) -- font availability

### Tertiary (LOW confidence)
- Linear.app visual reference -- design inspiration only, no technical claims made

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries are well-documented, officially supported, and commonly used together
- Architecture: HIGH -- follows official Next.js + Supabase patterns from current docs
- Database schema: MEDIUM -- schema design is reasonable but untested; may need adjustments as scraper data reveals real-world patterns
- Pitfalls: HIGH -- all documented pitfalls are from official docs and known community issues

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack, 30-day validity)
