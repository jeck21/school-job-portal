---
phase: 5
slug: additional-sources
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/scrapers/ --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/scrapers/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | DATA-02 | unit stub | `npx vitest run tests/scrapers/paeducator.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | DATA-03 | unit stub | `npx vitest run tests/scrapers/teachingjobsinpa.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | DATA-04 | unit stub | `npx vitest run tests/scrapers/schoolspring.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 0 | DATA-07 | unit stub | `npx vitest run tests/scrapers/job-dedup.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-xx | 02 | 1 | DATA-02 | unit | `npx vitest run tests/scrapers/paeducator.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-xx | 02 | 1 | DATA-03 | unit | `npx vitest run tests/scrapers/teachingjobsinpa.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-xx | 02 | 1 | DATA-04 | unit | `npx vitest run tests/scrapers/schoolspring.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-03-xx | 03 | 2 | DATA-07 | unit | `npx vitest run tests/scrapers/job-dedup.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/scrapers/paeducator.test.ts` — stubs for DATA-02: API response parsing, ScrapedJob mapping
- [ ] `tests/scrapers/schoolspring.test.ts` — stubs for DATA-04: HTML table parsing, pagination
- [ ] `tests/scrapers/teachingjobsinpa.test.ts` — stubs for DATA-03: HTML table parsing
- [ ] `tests/scrapers/job-dedup.test.ts` — stubs for DATA-07: fuzzy matching, threshold logic, borderline logging
- [ ] `tests/scrapers/fixtures/paeducator-job.json` — sample API response fixture
- [ ] `tests/scrapers/fixtures/schoolspring-listing.html` — sample listing HTML fixture
- [ ] `tests/scrapers/fixtures/teachingjobsinpa-listing.html` — sample listing HTML fixture

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Jobs from PAeducator visible in portal UI | DATA-02 | Requires visual check of rendered page | Run scraper, open portal, verify PAeducator jobs appear with source badge |
| Jobs from TeachingJobsInPA visible in portal UI | DATA-03 | Requires visual check of rendered page | Run scraper, open portal, verify TeachingJobsInPA jobs appear with source badge |
| Duplicate job shows multiple source attributions | DATA-07 | Requires end-to-end visual verification | Ingest same job from 2+ sources, verify single listing with multiple source badges |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
