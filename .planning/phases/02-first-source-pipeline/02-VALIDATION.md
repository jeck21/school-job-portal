---
phase: 2
slug: first-source-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | DATA-01 | unit | `npx vitest run tests/scrapers/pareap.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | DATA-05 | unit | `npx vitest run tests/scrapers/normalizer.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | DATA-13 | unit | `npx vitest run tests/scrapers/upsert-safety.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 0 | DATA-05 | unit | `npx vitest run tests/scrapers/school-matcher.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DATA-01 | integration | `npx vitest run tests/scrapers/pareap.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DATA-05 | unit | `npx vitest run tests/scrapers/normalizer.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | DATA-13 | unit | `npx vitest run tests/scrapers/upsert-safety.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | DATA-10 | smoke | Manual: verify GitHub Actions YAML | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/scrapers/pareap.test.ts` — stubs for DATA-01 (HTML parsing, pagination, job extraction)
- [ ] `tests/scrapers/normalizer.test.ts` — stubs for DATA-05 (location parsing, school name normalization)
- [ ] `tests/scrapers/upsert-safety.test.ts` — stubs for DATA-13 (upsert idempotency, error handling)
- [ ] `tests/scrapers/school-matcher.test.ts` — stubs for fuzzy matching logic
- [ ] `tests/scrapers/fixtures/` — sample HTML from PAREAP listing and detail pages
- [ ] `npm install -D tsx` — for running TypeScript scripts in CI

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Actions cron schedule runs daily | DATA-10 | Requires deployed workflow + time passage | Verify `scrape.yml` has valid cron syntax; trigger `workflow_dispatch` manually |
| GitHub Actions failure notifications | DATA-10 | Requires actual failure in CI | Force a failure scenario and check notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
