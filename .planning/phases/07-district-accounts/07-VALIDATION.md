---
phase: 7
slug: district-accounts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DIST-01 | unit | `npx vitest run tests/auth/auth-actions.test.ts -t "signup"` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | DIST-01 | unit | `npx vitest run tests/auth/domain-validation.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | DIST-02 | unit | `npx vitest run tests/district/claim-matching.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | DIST-03 | unit | `npx vitest run tests/components/verified-badge.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | DIST-04 | unit | `npx vitest run tests/district/listing-actions.test.ts -t "scraped"` | ❌ W0 | ⬜ pending |
| 07-02-04 | 02 | 2 | DIST-05 | unit | `npx vitest run tests/district/listing-actions.test.ts -t "delist"` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | DIST-06 | unit | `npx vitest run tests/queries/district-profile.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/auth/auth-actions.test.ts` — stubs for DIST-01 signup/login actions
- [ ] `tests/auth/domain-validation.test.ts` — stubs for DIST-01 domain auto-verify logic
- [ ] `tests/district/claim-matching.test.ts` — stubs for DIST-02 auto-match algorithm
- [ ] `tests/district/listing-actions.test.ts` — stubs for DIST-04, DIST-05 delist/edit logic
- [ ] `tests/queries/district-profile.test.ts` — stubs for DIST-06 profile query
- [ ] `tests/components/verified-badge.test.ts` — stubs for DIST-03 badge rendering

*Existing infrastructure covers test framework (vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase email confirmation flow | DIST-01 | Requires real email delivery + Supabase dashboard template config | 1. Sign up with real email 2. Check inbox for confirmation 3. Click link 4. Verify redirect to dashboard |
| Verified badge visual appearance | DIST-03 | Visual styling check (warm amber color, checkmark alignment) | 1. View job card with claimed listing 2. Verify badge shows checkmark + "Verified" in warm amber |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
