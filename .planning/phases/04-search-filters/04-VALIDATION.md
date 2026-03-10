---
phase: 4
slug: search-filters
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-10
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-00 | 01 | 0 | SRCH-* | scaffold | `npx vitest run tests/queries/search-jobs.test.ts --reporter=verbose` | Created by Task 0 | ⬜ pending |
| 04-01-01 | 01 | 1 | DATA-06 | manual-only | Verify via SQL after migration runs | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | SRCH-02 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "keyword"` | ✅ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | SRCH-03 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "radius"` | ✅ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | SRCH-04 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "school type"` | ✅ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | SRCH-05 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "grade"` | ✅ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | SRCH-06 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "subject"` | ✅ W0 | ⬜ pending |
| 04-01-07 | 01 | 1 | SRCH-07 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "salary"` | ✅ W0 | ⬜ pending |
| 04-01-08 | 01 | 1 | SRCH-08 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "cert"` | ✅ W0 | ⬜ pending |
| 04-01-09 | 01 | 1 | SRCH-12 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "combined"` | ✅ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SRCH-* | typecheck | `npx tsc --noEmit src/lib/hooks/use-job-filters.ts` | N/A | ⬜ pending |
| 04-02-02 | 02 | 2 | SRCH-* | typecheck | `npx tsc --noEmit src/components/jobs/search-filter-bar.tsx` | N/A | ⬜ pending |
| 04-02-03 | 02 | 2 | SRCH-* | typecheck | `npx tsc --noEmit src/components/jobs/job-list.tsx src/app/jobs/page.tsx` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/queries/search-jobs.test.ts` — created by Plan 04-01, Task 0 with stubs for SRCH-02 through SRCH-12
- [ ] shadcn/ui components: `npx shadcn@latest add slider popover command` — installed in Plan 04-02, Task 1

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Geocoding populates location data for existing jobs/schools | DATA-06 | One-time migration, not repeatable in test suite | Run migration SQL, then verify via `SELECT count(*) FROM jobs WHERE location IS NOT NULL` |

---

## Wave-Level Checks

| Wave | Check | Command | When |
|------|-------|---------|------|
| 1 (Plan 01) | All unit tests pass | `npx vitest run tests/queries/search-jobs.test.ts --reporter=verbose` | After Plan 01 completes |
| 2 (Plan 02) | Full build succeeds | `npx next build` | After Plan 02 completes (45-120s, wave-level only) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Task 0 in Plan 01 creates test file)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (per-task checks use tsc/vitest, next build moved to wave-level)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
