# Stack Research: PA Educator Jobs Portal

## Recommended Stack

### Frontend: Next.js 15 (App Router)
**Confidence: High**

- Server-side rendering for SEO (critical for job boards — Google must index listings)
- App Router with React Server Components for fast initial loads
- Built-in API routes for backend logic
- Vercel deployment for zero-config hosting on free/hobby tier
- Tailwind CSS + shadcn/ui for polished, professional UI without custom design work

**Why not:** Remix (smaller ecosystem), plain React (no SSR), Astro (not ideal for dynamic filtering)

### Backend/API: Next.js API Routes + tRPC (optional)
**Confidence: High**

- API routes co-located with frontend — simpler deployment, one repo
- tRPC optional for type-safe API calls if complexity grows
- Server Actions for form submissions (coaching form, district login)

**Why not:** Separate Express/Fastify backend (unnecessary complexity for v1), Django (different ecosystem)

### Database: Supabase (PostgreSQL + PostGIS)
**Confidence: High**

- PostgreSQL with PostGIS extension for geolocation radius queries
- Supabase provides: auth (for district accounts), storage, realtime, REST API
- Free tier generous (500MB database, 1GB storage, 50K monthly active users)
- Row-level security for multi-tenant district data
- Full-text search built into Postgres (no need for Elasticsearch in v1)

**Why not:** PlanetScale (no PostGIS), MongoDB (poor geospatial compared to PostGIS), Firebase (vendor lock-in, no SQL)

### Geolocation: PostGIS + Geocoding API
**Confidence: High**

- PostGIS `ST_DWithin` for radius search — highly optimized with spatial indexes
- Geocode school/district addresses at ingestion time, store as PostGIS geometry
- User location: browser geolocation API or zip code entry → geocode
- Geocoding API: Nominatim (free, OSM-based) or Google Maps Geocoding (paid but accurate)

### Job Ingestion Pipeline: Node.js Workers + Cron
**Confidence: Medium-High**

- Playwright for JavaScript-rendered pages (PAREAP, Applitrack/Frontline sites)
- Cheerio for static HTML parsing (simpler district pages)
- Scheduled via Vercel Cron Jobs or GitHub Actions (free tier)
- Pipeline stages: Fetch → Parse → Normalize → Deduplicate → Store
- Separate ingestion from serving — pipeline runs on schedule, writes to DB

**Why not:** Python/Scrapy (adds a second language), Puppeteer (Playwright is more robust), third-party scraping services (cost)

### AI Job Freshness Validation: Claude API or OpenAI
**Confidence: Medium**

- Periodic URL health checks (HTTP status, redirect detection)
- For ambiguous cases: use LLM to analyze page content and determine if job is still active
- Claude Haiku or GPT-4o-mini for cost-effective classification
- Run as scheduled background job (weekly or bi-weekly)

### Authentication: Supabase Auth
**Confidence: High**

- Built into Supabase — email/password for district accounts
- No user auth needed for v1 public site
- Row-level security ties district accounts to their listings
- Easy to add OAuth, magic links for v2 user accounts

### Hosting & Deployment
**Confidence: High**

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Frontend + API (Hobby plan) | Free |
| Supabase | Database + Auth + Storage | Free tier |
| GitHub Actions | Scraping pipeline cron | Free (2000 min/mo) |
| Cloudflare | CDN + DNS | Free |

Estimated monthly cost at launch: **$0** (free tiers)
At scale (10K+ users): ~$25-50/mo (Vercel Pro + Supabase Pro)

### ORM: Drizzle ORM
**Confidence: High**

- TypeScript-first, lightweight, excellent DX
- Great PostGIS support via custom column types
- Migrations built-in
- Better performance than Prisma for edge deployments

**Why not:** Prisma (heavier, slower cold starts on serverless), raw SQL (maintenance burden)

## What NOT to Use

| Technology | Why Not |
|-----------|---------|
| Elasticsearch | Overkill for v1 — Postgres full-text search + PostGIS handles all filtering needs |
| Redis | Not needed until caching becomes a bottleneck |
| Docker/K8s | Side project — serverless is simpler and cheaper |
| Separate backend service | Adds deployment complexity; Next.js API routes sufficient |
| WordPress/CMS | Not flexible enough for custom filtering/ingestion pipeline |
| Third-party scraping SaaS | Expensive, less control over PA-specific sources |
| React Native/Mobile | Web-first; responsive design covers mobile |

## Key Technical Risks

1. **Scraper fragility**: PAREAP and district sites may change layout without notice → mitigate with monitoring/alerts
2. **Geocoding accuracy**: PA school addresses need reliable geocoding → test with real PA addresses early
3. **Frontline/Applitrack**: Many PA districts use this — no public API found; will need to scrape their public-facing pages
4. **Rate limiting**: Scraping multiple sources needs respectful rate limiting and User-Agent identification

---
*Researched: 2026-03-10*
