# Phase 10: Verified Filter Count Fix - Research

**Researched:** 2026-03-14
**Domain:** Supabase RPC / PostgreSQL server-side filtering / Next.js server action
**Confidence:** HIGH

## Summary

The verified-only filter has a well-documented bug: it applies client-side post-RPC filtering on the paginated result slice (max 25 rows), then reports `results.length` as the total count instead of the true total of verified jobs in the database. This causes two failures: (1) the count header shows at most 25 even when more verified jobs exist, and (2) load-more pagination breaks because the client thinks all results are loaded.

The fix is straightforward: add a `verified_only BOOLEAN DEFAULT FALSE` parameter to the `search_jobs` PostgreSQL RPC function, filter by `claimed_by_district_id IS NOT NULL` server-side, and remove the client-side post-filter in `search-jobs.ts`. This ensures `COUNT(*) OVER()` returns the true total and pagination offsets work correctly.

**Primary recommendation:** Add verified filter to the SQL RPC function so filtering, counting, and pagination all happen server-side in one query.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-12 | User can combine multiple filters simultaneously | Verified filter must participate in server-side RPC like all other filters, not as a client-side post-filter that breaks count/pagination |
| DIST-03 | Claimed listings display a "Verified" badge on the portal | The verified badge display works; the gap is that filtering to show ONLY verified listings returns wrong counts |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (PostgreSQL) | Latest | RPC function for search_jobs | All filtering already happens here |
| Next.js 15 | 15.x | Server actions for search | Existing pattern |
| nuqs | Latest | URL-synced filter state | Already manages `verified` param |
| Vitest | Latest | Unit tests | Existing test infrastructure |

No new libraries needed. This is a bug fix within existing infrastructure.

## Architecture Patterns

### Current Architecture (buggy)
```
[Browser] --nuqs--> [JobList.buildFilters()] --server action--> [searchJobs()]
  |                      |                                          |
  |                      +-- MISSING: doesn't include verified      |
  |                                                                 |
  |   [search_jobs RPC] -- returns 25 rows with total_count        |
  |        |                                                        |
  |   [Client-side filter: row.claimed_by_district_id != null]     |
  |        |                                                        |
  |   [count = filtered.length] <-- BUG: max 25, not true total    |
```

### Target Architecture (fixed)
```
[Browser] --nuqs--> [JobList.buildFilters()] --server action--> [searchJobs()]
  |                      |                                          |
  |                      +-- includes verified: true                |
  |                                                                 |
  |   [search_jobs RPC] -- WHERE claimed_by_district_id IS NOT NULL
  |        |                                                        |
  |   [COUNT(*) OVER() = true total of verified jobs]              |
  |   [OFFSET/LIMIT pagination works correctly]                    |
```

### Pattern: Adding a parameter to search_jobs RPC

The existing RPC follows a consistent pattern for boolean filters. The `salary_only` parameter is the exact model:

```sql
-- In function signature:
verified_only BOOLEAN DEFAULT FALSE,

-- In WHERE clause:
AND (NOT verified_only OR j.claimed_by_district_id IS NOT NULL)
```

This pattern means: when `verified_only` is FALSE, the clause is TRUE (no filtering). When TRUE, only rows with a non-null `claimed_by_district_id` pass.

### Files to modify (3 files + 1 migration)

1. **New migration SQL** -- Add `verified_only` param to `search_jobs` RPC
2. **`src/lib/queries/search-jobs.ts`** -- Pass `verified_only` to RPC, remove client-side filter
3. **`src/components/jobs/job-list.tsx`** -- Add `verified` to `buildFilters()`
4. **`tests/queries/search-jobs.test.ts`** -- Add verified filter test cases

### Anti-Patterns to Avoid
- **Client-side post-filtering paginated data:** This is the root cause of the bug. Never filter after pagination -- the database must filter before counting and slicing.
- **Separate count query:** Don't add a second RPC call to get verified count. The existing `COUNT(*) OVER()` window function handles this correctly once filtering moves server-side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verified count | Separate count query or client-side counting | `COUNT(*) OVER()` in existing RPC | Already works for all other filters; just needs the WHERE clause |
| Pagination with filters | Client-side slice/filter | SQL OFFSET/LIMIT after WHERE | Database handles this correctly and efficiently |

**Key insight:** The entire fix is about moving the verified filter from client-side to server-side, matching the pattern every other filter already uses.

## Common Pitfalls

### Pitfall 1: Forgetting to DROP the old function signature
**What goes wrong:** PostgreSQL function overloading -- if parameter list changes, the old function remains alongside the new one.
**Why it happens:** `CREATE OR REPLACE` only replaces if the signature matches exactly.
**How to avoid:** Use `DROP FUNCTION IF EXISTS search_jobs` before `CREATE OR REPLACE`, exactly as migration 00008 did.
**Warning signs:** RPC calls fail or use wrong function version.

### Pitfall 2: Missing buildFilters() update in job-list.tsx
**What goes wrong:** The verified toggle works on initial SSR page load (via `parseSearchParams` in `page.tsx`) but stops working on client-side filter changes because `buildFilters()` doesn't include `verified`.
**Why it happens:** The `buildFilters()` function in `job-list.tsx` was never updated when the verified filter was added.
**How to avoid:** Add `verified: filters.verified || undefined` to `buildFilters()`.
**Warning signs:** Verified filter works on page refresh but not on toggle.

### Pitfall 3: Not adding verified to useEffect dependency array
**What goes wrong:** Toggling verified doesn't trigger a re-fetch.
**Why it happens:** The useEffect in job-list.tsx watches specific filter values.
**How to avoid:** Add `filters.verified` to the dependency array.
**Warning signs:** Toggle has no effect until another filter changes.

### Pitfall 4: Breaking the existing test mock
**What goes wrong:** Existing tests fail because mock doesn't expect new `verified_only` param.
**Why it happens:** The mock checks specific params passed to RPC.
**How to avoid:** Update mock expectations and add new test cases for verified filter.

## Code Examples

### Migration SQL (new file)
```sql
-- Source: Pattern from supabase/migrations/00008_district_accounts.sql
DROP FUNCTION IF EXISTS search_jobs;
CREATE OR REPLACE FUNCTION search_jobs(
  -- ... existing params ...
  verified_only BOOLEAN DEFAULT FALSE,
  result_offset INT DEFAULT 0,
  result_limit INT DEFAULT 25
)
-- ... existing RETURNS TABLE ...
AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM public.jobs j
  LEFT JOIN public.schools s ON j.school_id = s.id
  WHERE j.is_active = true
    AND j.delisted_at IS NULL
    -- ... existing filters ...
    -- Verified-only filter (matches salary_only pattern)
    AND (NOT verified_only OR j.claimed_by_district_id IS NOT NULL)
  ORDER BY j.first_seen_at DESC
  OFFSET result_offset
  LIMIT result_limit;
END;
$$;
```

### search-jobs.ts fix
```typescript
// Source: src/lib/queries/search-jobs.ts lines 49-83
const { data, error } = await supabase.rpc("search_jobs", {
  // ... existing params ...
  verified_only: filters.verified ?? false,  // NEW
  result_offset: offset,
  result_limit: limit,
});

if (error) throw error;

const results = data ?? [];

// REMOVED: client-side verified filter (lines 70-74)
// REMOVED: conditional count logic (lines 76-78)

return {
  jobs: results,
  count: Number(data?.[0]?.total_count ?? 0),  // Always use server count
};
```

### job-list.tsx buildFilters fix
```typescript
// Source: src/components/jobs/job-list.tsx lines 74-86
function buildFilters(): JobFilters {
  return {
    // ... existing params ...
    verified: filters.verified || undefined,  // NEW
  };
}
```

### job-list.tsx useEffect dependency fix
```typescript
// Add to the dependency array around line 119:
filters.verified,
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side post-filter on paginated data | Server-side WHERE clause in RPC | This phase | Correct counts, working pagination |

## Open Questions

None. The bug is well-understood, the fix pattern is established by existing filters (especially `salary_only`), and no external research is needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/queries/search-jobs.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-12 | Verified filter passes verified_only param to RPC | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "verified"` | Partially (file exists, needs new tests) |
| SRCH-12 | Verified filter returns correct total_count from RPC | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "verified"` | Partially (needs new tests) |
| DIST-03 | Verified filter combined with other filters | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "combined"` | Partially (existing combined test needs verified) |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/queries/search-jobs.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add verified filter test cases to `tests/queries/search-jobs.test.ts` -- covers SRCH-12
- [ ] Update existing combined filter test to include verified param -- covers SRCH-12

*(No new test files or framework config needed -- existing infrastructure covers this phase)*

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/00008_district_accounts.sql` -- Current search_jobs RPC definition with claimed_by_district_id
- `src/lib/queries/search-jobs.ts` -- Server action with client-side verified filter (the bug)
- `src/components/jobs/job-list.tsx` -- buildFilters() missing verified param (secondary bug)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- Bug documentation and gap identification
- `tests/queries/search-jobs.test.ts` -- Existing test infrastructure

### Secondary (MEDIUM confidence)
- `supabase/migrations/00006_search_jobs_rpc.sql` -- Original RPC pattern reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, existing patterns
- Architecture: HIGH -- direct inspection of buggy code and fix pattern
- Pitfalls: HIGH -- derived from actual codebase inspection

**Research date:** 2026-03-14
**Valid until:** Indefinite (bug fix, not library-dependent)
