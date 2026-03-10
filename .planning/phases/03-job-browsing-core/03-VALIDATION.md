---
phase: 3
slug: job-browsing-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + Playwright 1.58.2 |
| **Config file** | none — Wave 0 installs |
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
| 03-01-01 | 01 | 0 | SRCH-01 | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | SRCH-09 | unit | `npx vitest run src/lib/__tests__/get-job-detail.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | SRCH-11 | unit | `npx vitest run src/lib/__tests__/format-date.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 0 | SRCH-10 | e2e | `npx playwright test tests/e2e/job-detail.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | SRCH-01 | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "returns active jobs"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | SRCH-01 | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "load more offset"` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | SRCH-01 | unit | `npx vitest run src/lib/__tests__/get-jobs.test.ts -t "returns count"` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | SRCH-09 | unit | `npx vitest run src/lib/__tests__/get-job-detail.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 2 | SRCH-10 | e2e | `npx playwright test tests/e2e/job-detail.spec.ts -g "apply link"` | ❌ W0 | ⬜ pending |
| 03-02-06 | 02 | 2 | SRCH-11 | unit | `npx vitest run src/lib/__tests__/format-date.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-07 | 02 | 2 | SRCH-11 | e2e | `npx playwright test tests/e2e/job-detail.spec.ts -g "dates"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest config with path aliases matching tsconfig
- [ ] `playwright.config.ts` — Playwright config targeting localhost:3003
- [ ] `src/lib/__tests__/format-date.test.ts` — date formatting utility tests
- [ ] `src/lib/__tests__/get-jobs.test.ts` — job list query tests (Supabase mock)
- [ ] `src/lib/__tests__/get-job-detail.test.ts` — single job query tests
- [ ] `tests/e2e/job-detail.spec.ts` — e2e tests for job detail modal, apply link, dates

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Forest & Ember theme consistency | Design | Visual | Verify card colors, CTA buttons match theme variables |
| Modal UX on mobile | SRCH-09 | Viewport-dependent | Test on mobile viewport, verify full-page fallback |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
