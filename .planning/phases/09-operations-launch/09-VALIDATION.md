---
phase: 9
slug: operations-launch
status: draft
nyquist_compliant: true
wave_0_complete: false
wave_0_plan: "09-00-PLAN.md"
created: 2026-03-14
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit) + Playwright 1.58 (e2e) |
| **Config file** | vitest.config.ts, playwright.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-00-01 | 00 | 0 | INFRA-02/03, UI-03 | stubs | `npx vitest run tests/unit/alert.test.ts && npx playwright test --list` | created by 09-00 | ⬜ pending |
| 09-01-xx | 01 | 1 | INFRA-03 | e2e | `npx playwright test tests/e2e/monitoring.spec.ts` | ✅ W0 | ⬜ pending |
| 09-01-xx | 01 | 1 | INFRA-02 | unit | `npx vitest run tests/unit/alert.test.ts` | ✅ W0 | ⬜ pending |
| 09-02-xx | 02 | 1 | INFRA-04 | manual-only | Verify Analytics component renders in layout | N/A | ⬜ pending |
| 09-02-xx | 02 | 1 | UI-03 | e2e | `npx playwright test tests/e2e/performance.spec.ts` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/monitoring.spec.ts` — stubs for INFRA-03 (admin dashboard loads, shows scrape data) — **created by 09-00-PLAN.md**
- [ ] `tests/e2e/performance.spec.ts` — stubs for UI-03 (search page loads within timeout) — **created by 09-00-PLAN.md**
- [ ] `tests/unit/alert.test.ts` — covers alert email logic (Resend call with correct params) — **created by 09-00-PLAN.md**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scrape pipeline runs on schedule | INFRA-02 | Cron job — requires GitHub Actions history | Verify cron triggers in Actions tab, confirm recent runs succeeded |
| Analytics tracks page views | INFRA-04 | Third-party service — Vercel collects data | Verify Analytics component in layout, check Vercel Analytics dashboard after deploy |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
