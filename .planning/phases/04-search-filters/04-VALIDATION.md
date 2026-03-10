---
phase: 4
slug: search-filters
status: draft
nyquist_compliant: false
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
| 04-01-01 | 01 | 0 | SRCH-02 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "keyword"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | SRCH-03 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "radius"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 0 | SRCH-04 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "school type"` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 0 | SRCH-05 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "grade"` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 0 | SRCH-06 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "subject"` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 0 | SRCH-07 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "salary"` | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 0 | SRCH-08 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "cert"` | ❌ W0 | ⬜ pending |
| 04-01-08 | 01 | 0 | SRCH-12 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "combined"` | ❌ W0 | ⬜ pending |
| 04-xx-xx | xx | x | DATA-06 | manual-only | Verify via SQL after migration runs | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/queries/search-jobs.test.ts` — stubs for SRCH-02 through SRCH-12 (Supabase test setup or mock)
- [ ] shadcn/ui components: `npx shadcn@latest add slider popover command` — if not already installed

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Geocoding populates location data for existing jobs/schools | DATA-06 | One-time migration, not repeatable in test suite | Run migration SQL, then verify via `SELECT count(*) FROM jobs WHERE location IS NOT NULL` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
