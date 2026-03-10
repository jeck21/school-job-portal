---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + Vitest (unit) |
| **Config file** | None — Wave 0 installs |
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
| 01-01-01 | 01 | 0 | INFRA-01 | unit | `npx vitest run tests/unit/schema.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | UI-01 | E2E | `npx playwright test tests/e2e/landing.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFRA-01 | E2E | `npx playwright test tests/e2e/landing.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | UI-01 | E2E | `npx playwright test tests/e2e/navigation.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `playwright.config.ts` — Playwright configuration
- [ ] `tests/e2e/landing.spec.ts` — Landing page renders, shows site name, has nav links
- [ ] `tests/e2e/navigation.spec.ts` — Nav links route to correct pages, Coming Soon pages render
- [ ] `tests/unit/schema.test.ts` — Verify migration SQL is valid / tables exist
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react playwright @playwright/test`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual design matches Linear.app-inspired brief | UI-01 | Subjective design quality | Review deployed landing page against CONTEXT.md design decisions |
| Dark slate + electric blue palette looks professional | UI-01 | Visual assessment | Compare rendered colors to design intent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
