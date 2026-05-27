# Phase 7 — Verification gate

**Goal:** Confirm Spotting is counsel-ready: no pending lineage rewrites, branding clean, critical user journey covered by E2E, and (optionally) live mirror similarity below thresholds.

**Not legal advice.** External counsel sign-off is still required before launch.

---

## Automated checks (CI / local)

| Command | What it validates |
|---------|-------------------|
| `npm run verify` | Lint, types, unit tests, production build |
| `npm run check:lineage` | Phase 0 baseline (0 pending byte-identical) + branding ban |
| `npm run check:gate` | Launch gate: baseline pending rewrites = 0 + branding; mirror watch-path scan when `CRIKKET_MIRROR_PATH` is set |
| `npm run test:e2e` | Playwright: capture API → report viewer → dashboard list |

### Full local gate (recommended before release)

```bash
npm run prelaunch
```

Runs: Docker infra → capture-key migration → `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` → verify → check:gate → E2E.

Skip steps when infra is already up:

```bash
npm run prelaunch -- --skip-infra
```

Manual steps:

```bash
npm run verify
npm run check:gate
npm run test:e2e
```

### Optional mirror scan (private Crikket checkout only)

```bash
CRIKKET_MIRROR_PATH=/path/to/crikket npm run check:gate
```

Fails when any file under `similarity_watch_paths` in [path-mappings.json](../../scripts/compliance/path-mappings.json) exceeds **85%** token Jaccard vs the mapped Crikket path. Target for clean-room modules is **< 70%** (reported, not enforced unless counsel requests).

---

## E2E journey

**Spec:** `apps/web/e2e/capture-journey.spec.ts`

1. Seed deterministic user/org/capture key (`apps/api/scripts/e2e-seed.ts`) via Playwright `globalSetup`
2. `POST /v1/capture/reports` with `spk_live_e2e…` key
3. Sign in at `/login`
4. Open share viewer `/s/[id]` — report title visible
5. Open `/dashboard` — report appears in grid

**Requirements:** PostgreSQL reachable at `DATABASE_URL` (CI uses a service container; local default port `5433` from root `.env`).

Skip DB setup for smoke-only runs:

```bash
SKIP_E2E_DB=true npm run test:e2e -- e2e/smoke.spec.ts
```

---

## Launch gate checklist

| Check | Target | Owner |
|-------|--------|-------|
| Byte-identical files (baseline) | 0 pending | Engineering ✅ |
| High-similarity baseline entries | 0 pending | Engineering ✅ |
| Mirror watch-path similarity | 0 files > 85% | Engineering (when mirror available) |
| `crikket` / `@crikket` in product source | 0 | CI ✅ |
| `npm run verify` | Pass | CI ✅ |
| `npm run check:gate` | Pass | CI / release |
| E2E capture → viewer → dashboard | Pass | CI ✅ |
| Production `migrate:capture-keys` | Complete | Ops — `npm run prelaunch` (local) / runbook (prod) |
| `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` | After migration | Ops — set by `npm run prelaunch` locally |
| Counsel sign-off | Obtained | Legal ☐ — [ENGINEERING-ATTESTATION.md](./ENGINEERING-ATTESTATION.md) |

See [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md) for the legal checklist.

---

## Counsel session

Schedule counsel review using [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md). Attach:

- [phase0-baseline.json](./phase0-baseline.json) (all entries `rewritten`)
- [LEDGER.md](./LEDGER.md)
- [SEPARATION-PLAN.md](./SEPARATION-PLAN.md)
- This document + latest CI run URLs
