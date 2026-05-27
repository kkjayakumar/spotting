# Engineering attestation — Spotting launch readiness

**Date:** 2026-05-25  
**Prepared by:** Engineering (Spotting clean-room program)  
**Purpose:** Evidence bundle for counsel review ([COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md))

**Not legal advice.** This document attests to technical remediation only. Legal sign-off remains with qualified counsel.

---

## Executive summary

Spotting completed Phases 0–7 of the separation plan:

- **0 byte-identical** files pending in [phase0-baseline.json](./phase0-baseline.json)
- **0 high-similarity** baseline entries pending rewrite
- **Custom architecture:** Hono REST, Prisma auth, no oRPC / better-auth library
- **Clean-room UI:** report viewer + dashboard reimplemented under `apps/web/src/features/`
- **Capture keys:** `spk_*` standard; `crk_*` migration script + sunset env gate
- **CI:** `npm run verify`, `npm run check:lineage`, Playwright E2E

---

## Automated verification (reproducible)

```bash
npm run prelaunch
```

Or step-by-step:

| Step | Command | Expected |
|------|---------|----------|
| Build + tests | `npm run verify` | Exit 0 |
| Lineage gate | `npm run check:gate` | Exit 0 |
| Capture migration | `npm run migrate:capture-keys -w @spotting/api` | 0 keys (local DB already on `spk_*`) |
| E2E journey | `npm run test:e2e` | capture → viewer → dashboard pass |
| Mirror watch-path scan | `npm run check:gate` with `CRIKKET_MIRROR_PATH` in `.env` | 0 files > 85% — see [mirror-scan-status.md](./mirror-scan-status.md) |

Latest mirror status: [mirror-scan-status.md](./mirror-scan-status.md)

---

## Phase completion

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | Provenance ledger, CI guardrails, contributor freeze | ✅ |
| 1 | 37 byte-identical files rewritten | ✅ |
| 2 | Report viewer clean-room (`features/report-viewer/`) | ✅ |
| 3 | Dashboard clean-room (`features/reports/dashboard/`) | ✅ |
| 4 | API attestation, OpenAPI, env rename | ✅ |
| 5 | SDK/extension attestation, capture key policy | ✅ |
| 6 | Ops cleanup (BETTER_AUTH_*, Bun → npm) | ✅ |
| 7 | Verification gate + E2E | ✅ (engineering) |

Details: [SEPARATION-PLAN.md](./SEPARATION-PLAN.md), [PROJECT_PLAN_CHECKLIST.md](../../PROJECT_PLAN_CHECKLIST.md)

---

## Contributor access

[CONTRIBUTOR-ACCESS.md](./CONTRIBUTOR-ACCESS.md) — Crikket source access frozen

---

## Items requiring counsel / ops (outside engineering)

| Item | Owner | Notes |
|------|-------|-------|
| Legal sign-off | Counsel | Complete [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md) §6 |
| AGPL / derivative-work analysis | Counsel | §2–3 of counsel checklist |
| Production capture-key migration | Ops | Run same commands on **prod** DB; set `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` and redeploy |
| Mirror similarity scan | Engineering | ✅ Local pass 2026-05-25 — [mirror-scan-status.md](./mirror-scan-status.md) |

---

## Engineering sign-off (pending names)

| Role | Name | Date |
|------|------|------|
| Engineering lead | _______________ | _______________ |
| Technical reviewer | _______________ | _______________ |
