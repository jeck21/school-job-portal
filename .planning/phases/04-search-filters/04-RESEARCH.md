# Phase 4: Search & Filters - Research

**Researched:** 2026-03-10
**Domain:** Search, filtering, geospatial queries, URL state management
**Confidence:** HIGH

## Summary

Phase 4 adds keyword search, multi-faceted filtering (school type, grade band, subject, salary, certification), radius-based location search, and URL-synced filter state to the existing job browsing UI. The existing Supabase schema already has all necessary columns (school_type, grade_band, subject_area, salary_mentioned, certifications, location GEOGRAPHY) and PostGIS is enabled with GIST indexes in place. The main work is: (1) building a Postgres RPC function that combines text search with spatial and categorical filters, (2) a geocoding migration to populate location data for existing jobs/schools, (3) client-side filter UI with URL state management via nuqs, and (4) hardcoded filter option lists based on PA PDE certification categories.

The approach uses a single Supabase RPC function for the combined query (text + spatial + categorical filters), nuqs for type-safe URL search param state, and a static PA zip code lookup table for geocoding. No external geocoding API is needed at runtime -- zip-to-coordinates lookup uses a static dataset bundled in the migration.

**Primary recommendation:** Build one Postgres RPC function `search_jobs` that accepts all filter params and returns filtered results; use nuqs on the client for URL state; geocode via static zip code CSV seeded into a lookup table.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Collapsible top bar with horizontal dropdown row -- not sidebar or drawer
- Search bar sits above filter dropdowns (full width, prominent)
- Filter dropdowns in row: Type, Grade, Zip+Radius, Subject, Salary, Cert
- Filters apply instantly on selection (no "Apply" button)
- "Clear all" link to reset all filters at once
- Filter state syncs to URL query params (shareable, bookmarkable, browser back/forward)
- Debounced live search (~300ms) -- searches title, school name, location text (NOT full description)
- No autocomplete dropdown
- Zip code text input (5-digit PA zip) -- no browser geolocation
- Custom radius slider (5-150 miles)
- When radius filter active, jobs without geocoded locations are hidden
- Remote/Cyber option that bypasses radius filtering
- School type: hardcoded Public, Charter, Private, IU, Cyber (multi-select)
- Grade band: hardcoded PreK, Elementary, Middle, High (multi-select)
- Subject/position: tied to PDE certification subject areas (multi-select)
- Salary: "Salary Info Included" boolean toggle (not range slider)
- Certification: filter by PA cert type (multi-select)
- Global "Include unspecified postings" toggle (ON by default)

### Claude's Discretion
- Active filter chips/tags display (whether to show removable chips below filter bar)
- Exact slider component design and range increments
- Filter dropdown component styling and interaction patterns
- Loading/transition states when filters change
- How "Clear all" interacts with search text
- Exact debounce timing
- Mobile layout adaptation for the filter bar

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-02 | User can search jobs by keyword (title, school name, description) | Postgres `ILIKE` on title, school name, location_raw via RPC function; CONTEXT narrows to title+school+location (not description) |
| SRCH-03 | User can filter by distance radius from location | PostGIS `ST_DWithin` in RPC function; static zip code lookup table for zip-to-coordinates; CONTEXT: zip only, no geolocation |
| SRCH-04 | User can filter by school type | SQL `= ANY()` on school_type column; hardcoded list: Public, Charter, Private, IU, Cyber |
| SRCH-05 | User can filter by grade band | SQL `&&` array overlap on grade_band column; hardcoded: PreK, Elementary, Middle, High |
| SRCH-06 | User can filter by subject/position category | SQL `&&` array overlap on subject_area column; PDE certification categories as options |
| SRCH-07 | User can filter by "Salary Info Included" toggle | SQL `salary_mentioned = true` boolean filter |
| SRCH-08 | User can filter by PA certification type | SQL `&&` array overlap on certifications column; PDE cert types as options |
| SRCH-12 | User can combine multiple filters simultaneously | Single RPC function with all params; each filter adds WHERE clause with AND |
| DATA-06 | System geocodes school/job locations for radius search | Migration script: seed zip_coordinates table from Census CSV, then UPDATE jobs/schools SET location from zip lookup |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | latest (npm) | Type-safe URL search param state | De facto standard for Next.js App Router URL state; replaces manual searchParams parsing |
| PostGIS (ST_DWithin) | Already enabled | Radius/distance queries | Already in schema; GIST indexes already created |
| Supabase RPC | @supabase/supabase-js 2.99+ | Call Postgres functions from client | Established pattern in project for complex queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | latest | Debounce search input | Lightweight; for the 300ms debounce on keyword search |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nuqs | Manual useSearchParams + router.push | nuqs handles serialization, types, history, shallow updates automatically; manual approach is boilerplate-heavy and error-prone |
| use-debounce | Custom setTimeout | use-debounce handles cleanup, leading/trailing edge; trivial to implement manually but library is 1KB |
| Static zip CSV | External geocoding API | Static CSV has zero runtime cost, no API key, works offline; sufficient for PA zip codes (~2000 entries) |

**Installation:**
```bash
npm install nuqs use-debounce
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/jobs/
    page.tsx                    # Server component: reads searchParams, passes to filter bar + job list
  components/jobs/
    search-filter-bar.tsx       # Client component: search input + filter dropdowns + clear all
    filter-dropdown.tsx         # Reusable multi-select dropdown component
    radius-filter.tsx           # Zip input + radius slider combination
    salary-toggle.tsx           # Simple boolean toggle for salary filter
    include-unspecified-toggle.tsx  # Global toggle for unspecified data
    active-filters.tsx          # (Discretion) Removable filter chips display
    job-list.tsx                # Updated: accepts filter state, resets on filter change
  lib/
    queries/
      search-jobs.ts            # Server action calling Supabase RPC
    filter-options.ts           # Hardcoded filter option lists (PDE categories, school types, etc.)
    hooks/
      use-job-filters.ts        # nuqs hook combining all filter params
supabase/
  migrations/
    00004_zip_coordinates.sql   # Seed zip-to-lat/lng lookup table
    00005_geocode_jobs.sql      # Populate location on jobs/schools from zip lookup
    00006_search_jobs_rpc.sql   # The search_jobs RPC function
scripts/
  data/
    pa-zip-codes.csv            # Static PA zip code coordinates (from Census data)
```

### Pattern 1: Single RPC Function for Combined Search
**What:** One Postgres function `search_jobs` that accepts all filter parameters and returns filtered, paginated results. Each filter is optional -- when NULL, that filter is skipped.
**When to use:** Always -- this is the only query path for the jobs page.
**Example:**
```sql
-- Source: Supabase PostGIS docs + standard Postgres patterns
CREATE OR REPLACE FUNCTION search_jobs(
  search_term TEXT DEFAULT NULL,
  school_types TEXT[] DEFAULT NULL,
  grade_bands TEXT[] DEFAULT NULL,
  subject_areas TEXT[] DEFAULT NULL,
  cert_types TEXT[] DEFAULT NULL,
  salary_only BOOLEAN DEFAULT FALSE,
  zip_lat FLOAT DEFAULT NULL,
  zip_lng FLOAT DEFAULT NULL,
  radius_miles FLOAT DEFAULT NULL,
  include_unspecified BOOLEAN DEFAULT TRUE,
  include_remote BOOLEAN DEFAULT FALSE,
  result_offset INT DEFAULT 0,
  result_limit INT DEFAULT 25
)
RETURNS TABLE (
  id UUID, title TEXT, location_raw TEXT, city TEXT,
  school_type TEXT, first_seen_at TIMESTAMPTZ, url TEXT,
  school_name TEXT, district_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.location_raw, j.city,
    j.school_type, j.first_seen_at, j.url,
    s.name AS school_name, s.district_name,
    COUNT(*) OVER() AS total_count
  FROM public.jobs j
  LEFT JOIN public.schools s ON j.school_id = s.id
  WHERE j.is_active = true
    -- Keyword search: title, school name, location
    AND (search_term IS NULL OR (
      j.title ILIKE '%' || search_term || '%'
      OR j.location_raw ILIKE '%' || search_term || '%'
      OR s.name ILIKE '%' || search_term || '%'
    ))
    -- School type filter
    AND (school_types IS NULL OR (
      j.school_type = ANY(school_types)
      OR (include_unspecified AND j.school_type IS NULL)
    ))
    -- Grade band filter (array overlap)
    AND (grade_bands IS NULL OR (
      j.grade_band && grade_bands
      OR (include_unspecified AND (j.grade_band IS NULL OR j.grade_band = '{}'))
    ))
    -- Subject area filter (array overlap)
    AND (subject_areas IS NULL OR (
      j.subject_area && subject_areas
      OR (include_unspecified AND (j.subject_area IS NULL OR j.subject_area = '{}'))
    ))
    -- Certification filter (array overlap)
    AND (cert_types IS NULL OR (
      j.certifications && cert_types
      OR (include_unspecified AND (j.certifications IS NULL OR j.certifications = '{}'))
    ))
    -- Salary toggle
    AND (NOT salary_only OR j.salary_mentioned = true)
    -- Radius filter
    AND (zip_lat IS NULL OR zip_lng IS NULL OR radius_miles IS NULL OR (
      (j.location IS NOT NULL AND extensions.st_dwithin(
        j.location,
        extensions.st_point(zip_lng, zip_lat)::extensions.geography,
        radius_miles * 1609.34  -- convert miles to meters
      ))
      OR (include_remote AND j.school_type = 'cyber')
    ))
  ORDER BY j.first_seen_at DESC
  OFFSET result_offset
  LIMIT result_limit;
END;
$$;
```

### Pattern 2: nuqs Filter State Hook
**What:** A custom hook using nuqs `useQueryStates` to manage all filter params as URL state.
**When to use:** In the search-filter-bar component.
**Example:**
```typescript
// Source: nuqs docs (https://nuqs.dev)
import { useQueryStates, parseAsArrayOf, parseAsString, parseAsBoolean, parseAsFloat, parseAsInteger } from 'nuqs';

export function useJobFilters() {
  return useQueryStates({
    q: parseAsString.withDefault(''),
    type: parseAsArrayOf(parseAsString).withDefault([]),
    grade: parseAsArrayOf(parseAsString).withDefault([]),
    subject: parseAsArrayOf(parseAsString).withDefault([]),
    cert: parseAsArrayOf(parseAsString).withDefault([]),
    salary: parseAsBoolean.withDefault(false),
    zip: parseAsString.withDefault(''),
    radius: parseAsInteger.withDefault(25),
    unspecified: parseAsBoolean.withDefault(true),
  });
}
```

### Pattern 3: Geocoding via Static Lookup
**What:** A `zip_coordinates` table seeded from US Census data, used to populate job/school locations and resolve user zip input to lat/lng at query time.
**When to use:** Migration (batch geocode existing data) + runtime (resolve user's zip code input).
**Example:**
```sql
-- Migration: create and seed zip lookup
CREATE TABLE zip_coordinates (
  zip_code TEXT PRIMARY KEY,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  city TEXT,
  state TEXT
);

-- After seeding from CSV:
-- Populate jobs.location from zip_code
UPDATE jobs SET location = extensions.st_point(
  zc.longitude, zc.latitude
)::extensions.geography
FROM zip_coordinates zc
WHERE jobs.zip_code = zc.zip_code
  AND jobs.location IS NULL;

-- Same for schools
UPDATE schools SET location = extensions.st_point(
  zc.longitude, zc.latitude
)::extensions.geography
FROM zip_coordinates zc
WHERE schools.zip_code = zc.zip_code
  AND schools.location IS NULL;
```

### Anti-Patterns to Avoid
- **Building the query string manually on the client:** Use nuqs to handle serialization, encoding, and history management. Manual approaches lead to bugs with special characters, back button, and type safety.
- **Multiple separate Supabase queries per filter:** One RPC call handles everything. Multiple queries mean multiple round trips and impossible-to-combine results.
- **Geocoding at runtime via external API:** For zip-to-coordinates, a static lookup table is faster, free, and has no rate limits. Only use an API if you need street-level geocoding (you don't).
- **Using Supabase JS .ilike() chains instead of RPC:** The Supabase JS client cannot express PostGIS spatial queries. RPC is required for ST_DWithin, and putting all logic in one function keeps it consistent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param state | Manual URLSearchParams parsing/setting | nuqs | Handles types, arrays, defaults, history, encoding, shallow updates |
| Debounce | Custom setTimeout with cleanup | use-debounce `useDebouncedCallback` | Handles cleanup, cancellation, leading/trailing edge |
| Zip-to-coordinates | External geocoding API calls | Static zip_coordinates table from Census data | Zero runtime cost, no API key, no rate limits, sufficient accuracy for zip-level |
| Multi-select dropdown | Custom dropdown from scratch | shadcn/ui Popover + Command (combobox) pattern | Accessible, keyboard navigable, searchable, already in the design system |
| Radius slider | Custom range input | shadcn/ui Slider component | Styled consistently with theme, accessible, handles touch |

**Key insight:** The project already has shadcn/ui installed. Every UI control needed (dropdowns, sliders, toggles, popovers) has a shadcn/ui primitive. The novel complexity is in the Postgres RPC function and the nuqs state management -- not in the UI components.

## Common Pitfalls

### Pitfall 1: PostGIS longitude/latitude ordering
**What goes wrong:** Coordinates passed in wrong order (lat, lng instead of lng, lat) causing queries to return wrong results or no results.
**Why it happens:** Convention conflict -- most APIs use (lat, lng) but PostGIS ST_Point takes (longitude, latitude) because x=lng, y=lat.
**How to avoid:** Always use `ST_Point(longitude, latitude)` -- longitude FIRST. Add comments at every usage point.
**Warning signs:** Radius queries returning zero results or wildly wrong results.

### Pitfall 2: Geography distance units
**What goes wrong:** Passing miles to ST_DWithin which expects meters for GEOGRAPHY type.
**Why it happens:** ST_DWithin uses meters for geography, degrees for geometry. Easy to forget conversion.
**How to avoid:** Always multiply miles by 1609.34 to convert to meters before passing to ST_DWithin.
**Warning signs:** Radius filter showing jobs thousands of miles away, or showing nothing within "50 miles."

### Pitfall 3: NULL array handling in Postgres
**What goes wrong:** `grade_band && ARRAY['Elementary']` returns NULL (not FALSE) when grade_band is NULL, causing rows to be excluded.
**Why it happens:** Postgres array overlap operator returns NULL when either operand is NULL.
**How to avoid:** Always add `OR (column IS NULL OR column = '{}')` for the "include unspecified" logic. The RPC function template above handles this.
**Warning signs:** Jobs with empty grade_band/subject_area disappearing when any filter is active.

### Pitfall 4: Search param hydration mismatch
**What goes wrong:** Server-rendered content doesn't match client-rendered content after nuqs hydrates from URL.
**Why it happens:** Server component renders without filter state, client component reads URL params on mount.
**How to avoid:** Pass searchParams from the server component page to the initial data fetch. Use nuqs `createSearchParamsCache` for server-side access.
**Warning signs:** Flash of unfiltered content, hydration warnings in console.

### Pitfall 5: Load-more pagination with filters
**What goes wrong:** User applies filter, but "load more" fetches the next page without the filter, appending unfiltered results.
**Why it happens:** The existing load-more pattern in job-list.tsx calls getJobs(offset, limit) without filter params.
**How to avoid:** Reset pagination when filters change. Pass all filter params to every paginated fetch. The RPC function accepts offset/limit alongside filters.
**Warning signs:** Scrolling down shows jobs that don't match active filters.

### Pitfall 6: Supabase schema prefix for PostGIS
**What goes wrong:** `st_dwithin` function not found errors.
**Why it happens:** PostGIS is installed in the `extensions` schema. Functions must be called as `extensions.st_dwithin()` not just `st_dwithin()`.
**How to avoid:** Always use `extensions.` prefix for PostGIS functions in RPC, or SET search_path at function level.
**Warning signs:** "function st_dwithin does not exist" errors.

## Code Examples

### Server Action Calling RPC
```typescript
// src/lib/queries/search-jobs.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type JobFilters = {
  q?: string;
  type?: string[];
  grade?: string[];
  subject?: string[];
  cert?: string[];
  salary?: boolean;
  zip?: string;
  radius?: number;
  unspecified?: boolean;
};

export async function searchJobs(filters: JobFilters, offset = 0, limit = 25) {
  const supabase = await createClient();

  // If zip is provided, look up coordinates
  let zipLat: number | null = null;
  let zipLng: number | null = null;

  if (filters.zip && filters.radius) {
    const { data: zipData } = await supabase
      .from("zip_coordinates")
      .select("latitude, longitude")
      .eq("zip_code", filters.zip)
      .single();

    if (zipData) {
      zipLat = zipData.latitude;
      zipLng = zipData.longitude;
    }
  }

  const { data, error } = await supabase.rpc("search_jobs", {
    search_term: filters.q || null,
    school_types: filters.type?.length ? filters.type : null,
    grade_bands: filters.grade?.length ? filters.grade : null,
    subject_areas: filters.subject?.length ? filters.subject : null,
    cert_types: filters.cert?.length ? filters.cert : null,
    salary_only: filters.salary ?? false,
    zip_lat: zipLat,
    zip_lng: zipLng,
    radius_miles: filters.zip ? (filters.radius ?? 25) : null,
    include_unspecified: filters.unspecified ?? true,
    include_remote: filters.type?.includes("cyber") ?? false,
    result_offset: offset,
    result_limit: limit,
  });

  if (error) throw error;

  const totalCount = data?.[0]?.total_count ?? 0;
  return {
    jobs: data ?? [],
    count: Number(totalCount),
  };
}
```

### NuqsAdapter Setup in Layout
```typescript
// src/app/layout.tsx -- add NuqsAdapter wrapper
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

### Filter Options Constants
```typescript
// src/lib/filter-options.ts
export const SCHOOL_TYPES = [
  { value: "public", label: "Public" },
  { value: "charter", label: "Charter" },
  { value: "private", label: "Private" },
  { value: "iu", label: "Intermediate Unit" },
  { value: "cyber", label: "Cyber/Remote" },
] as const;

export const GRADE_BANDS = [
  { value: "prek", label: "PreK" },
  { value: "elementary", label: "Elementary" },
  { value: "middle", label: "Middle School" },
  { value: "high", label: "High School" },
] as const;

// PDE Certification Subject Areas (grouped from official PDE list)
export const SUBJECT_AREAS = [
  { value: "early-childhood", label: "Early Childhood (N-3)" },
  { value: "elementary", label: "Elementary (K-6)" },
  { value: "math", label: "Mathematics (7-12)" },
  { value: "english", label: "English (7-12)" },
  { value: "science-biology", label: "Biology (7-12)" },
  { value: "science-chemistry", label: "Chemistry (7-12)" },
  { value: "science-physics", label: "Physics (7-12)" },
  { value: "science-general", label: "General Science (7-12)" },
  { value: "science-earth", label: "Earth & Space Science (7-12)" },
  { value: "social-studies", label: "Social Studies (7-12)" },
  { value: "special-education", label: "Special Education (PK-12)" },
  { value: "art", label: "Art Education (PK-12)" },
  { value: "music", label: "Music Education (PK-12)" },
  { value: "health-pe", label: "Health & Physical Ed (PK-12)" },
  { value: "world-languages", label: "World Languages (PK-12)" },
  { value: "computer-science", label: "Computer Science (7-12)" },
  { value: "business", label: "Business/Computer/IT (PK-12)" },
  { value: "library", label: "Library Science (PK-12)" },
  { value: "reading-specialist", label: "Reading Specialist (PK-12)" },
  { value: "technology-ed", label: "Technology Education (PK-12)" },
  { value: "career-technical", label: "Career & Technical (7-12)" },
  { value: "esl", label: "ESL Program Specialist" },
  { value: "agriculture", label: "Agriculture (PK-12)" },
  { value: "family-consumer", label: "Family & Consumer Science (PK-12)" },
  { value: "dance", label: "Dance (PK-12)" },
  { value: "environmental", label: "Environmental Education (PK-12)" },
  { value: "other", label: "Other" },
] as const;

// PDE Certificate Types
export const CERTIFICATION_TYPES = [
  { value: "instructional", label: "Instructional (Type 61)" },
  { value: "educational-specialist", label: "Educational Specialist (Type 31)" },
  { value: "administrative", label: "Administrative" },
  { value: "supervisory", label: "Supervisory" },
  { value: "career-technical", label: "Career & Technical" },
  { value: "emergency-permit", label: "Emergency Permit" },
  { value: "intern", label: "Intern Certificate" },
  { value: "not-required", label: "No Certification Required" },
] as const;

export const RADIUS_OPTIONS = {
  min: 5,
  max: 150,
  step: 5,
  default: 25,
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState + manual URL sync | nuqs useQueryStates | 2024 | Eliminates boilerplate, type-safe, handles edge cases |
| Multiple Supabase .filter() chains | Single RPC function | Always best practice | One round trip, PostGIS support, complex logic in SQL |
| External geocoding API at query time | Static zip lookup table | N/A (project-specific) | Zero latency, zero cost, sufficient for zip-level accuracy |
| useSearchParams + router.replace | nuqs with shallow mode | 2024 | No full page re-render on filter change |

**Deprecated/outdated:**
- `next-usequerystate`: Renamed to `nuqs` -- import from `nuqs` not the old package name
- Manual `URLSearchParams` manipulation in App Router: nuqs handles this better with type safety and history management

## Open Questions

1. **Subject area matching accuracy**
   - What we know: PDE has ~30 distinct instructional certificate subject areas
   - What's unclear: How well do PAREAP job titles/descriptions map to these categories? Most jobs currently have empty `subject_area` arrays
   - Recommendation: Show the filter options but rely on "Include unspecified" toggle (ON by default) to avoid hiding jobs. Phase 6 (Data Enrichment) will improve subject area extraction.

2. **How many jobs currently have zip_code populated?**
   - What we know: The `zip_code` column exists on jobs and schools tables. The normalizer extracts zip from location_raw
   - What's unclear: Percentage of jobs with extractable zip codes from PAREAP data
   - Recommendation: Run a quick query during implementation to assess coverage. If low, fall back to school zip codes via join.

3. **Slider component availability in shadcn/ui**
   - What we know: shadcn/ui v4 has a Slider component
   - What's unclear: Whether it's already added to this project
   - Recommendation: Add it via `npx shadcn@latest add slider` if not present. Also add `popover` and `command` for multi-select dropdowns.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-02 | Keyword search returns matching jobs | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "keyword"` | No -- Wave 0 |
| SRCH-03 | Radius filter returns nearby jobs only | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "radius"` | No -- Wave 0 |
| SRCH-04 | School type filter works | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "school type"` | No -- Wave 0 |
| SRCH-05 | Grade band filter works | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "grade"` | No -- Wave 0 |
| SRCH-06 | Subject filter works | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "subject"` | No -- Wave 0 |
| SRCH-07 | Salary toggle filters correctly | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "salary"` | No -- Wave 0 |
| SRCH-08 | Certification filter works | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "cert"` | No -- Wave 0 |
| SRCH-12 | Combined filters narrow results | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "combined"` | No -- Wave 0 |
| DATA-06 | Geocoding populates location data | manual-only | Verify via SQL after migration runs | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/queries/search-jobs.test.ts` -- covers SRCH-02 through SRCH-12 (will need Supabase test setup or mock)
- [ ] shadcn/ui components: `npx shadcn@latest add slider popover command` -- if not already installed

## Sources

### Primary (HIGH confidence)
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) -- RPC pattern, ST_DWithin usage, geography type
- [PostGIS ST_DWithin reference](https://postgis.net/docs/ST_DWithin.html) -- Distance units for geography (meters)
- [Next.js searchParams docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- App Router URL state
- [nuqs GitHub](https://github.com/47ng/nuqs) -- Built-in parsers, parseAsArrayOf, NuqsAdapter setup
- [PA PDE Certificates page](https://www.pa.gov/agencies/education/programs-and-services/educators/certification/certificates-in-pennsylvania) -- Official certification types and subject areas
- [US Census ZIP code gazetteer](https://gist.github.com/steinbring/c0cdb3c72ad58e63c95d9c9b6b2851cb) -- Free zip-to-coordinates CSV

### Secondary (MEDIUM confidence)
- [Supabase PostGIS blog post](https://blog.mansueli.com/leveraging-supabase-and-postgresql-for-distance-based-filtering-and-location-data-retrieval) -- Combined filter + distance patterns
- [Aurora Scharff: Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) -- Next.js filter state patterns

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- nuqs is well-documented, PostGIS is already set up, Supabase RPC is established pattern
- Architecture: HIGH -- single RPC function pattern is standard for combined search/filter; nuqs is the standard for URL state in Next.js
- Pitfalls: HIGH -- PostGIS coordinate ordering, geography units, NULL array handling are well-documented gotchas
- PDE categories: MEDIUM -- official PDE page lists categories but exact mapping to job data needs validation during implementation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain -- PostGIS, Next.js patterns, PDE categories rarely change)
