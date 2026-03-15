---
phase: 10
slug: verified-filter-count-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/queries/search-jobs.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/queries/search-jobs.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SRCH-12 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "verified"` | Partially (needs new tests) | ⬜ pending |
| 10-01-02 | 01 | 1 | SRCH-12 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "verified"` | Partially (needs new tests) | ⬜ pending |
| 10-01-03 | 01 | 1 | DIST-03 | unit | `npx vitest run tests/queries/search-jobs.test.ts -t "combined"` | Partially (existing test needs update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add verified filter test cases to `tests/queries/search-jobs.test.ts` — covers SRCH-12
- [ ] Update existing combined filter test to include verified param — covers SRCH-12

*Existing infrastructure covers all phase requirements. No new test files or framework config needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Verified count header shows true total | SRCH-12 | Requires live DB with >25 verified jobs | Toggle verified filter, check count matches DB query |
| Load-more works past 25 verified jobs | SRCH-12 | Requires live DB with >25 verified jobs | Toggle verified, scroll/click Load More, verify additional jobs appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
