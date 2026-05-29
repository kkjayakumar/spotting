# Provenance ledger

Record of Spotting-owned modules. Update this file when completing each clean-room rewrite.

**Attestation standard:** *No Crikket source was opened or diffed during implementation.*

---

## Phase 0 — Compliance baseline (2026-05-25)

### `docs/provenance/*`, `scripts/compliance/*`

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05-25 |
| **Phase** | 0 |
| **Spec** | Separation plan Phase 0 |
| **Attestation** | No Crikket source was used. Baseline hashes generated once for audit tracking only. |
| **Notes** | Establishes provenance ledger, contributor freeze, CI guardrails |

### `apps/api/src/auth.ts`, `apps/api/src/billing.ts`, `apps/api/src/password-reset.ts`

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05 (sprint) |
| **Phase** | Pre-0 / 4 |
| **Spec** | `docs/api/mvp-endpoints.md` |
| **Attestation** | Custom Hono REST auth; not better-auth/oRPC copy |
| **Notes** | Bearer sessions, billing CRUD, password reset |

### `apps/web/src/lib/api/*`

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05 |
| **Phase** | Pre-0 / 3 |
| **Spec** | Native REST client contract |
| **Attestation** | Replaced oRPC client; no Crikket source during authoring |
| **Notes** | `spottingClient`, TanStack Query hooks |

### `packages/shared/src/constants/bug-report.ts`, `priorities.ts`, `billing.ts`, `plan-limits.ts`

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05 |
| **Phase** | Pre-0 / 4 |
| **Spec** | Spotting domain model |
| **Attestation** | Reauthored with Spotting copyright header |
| **Notes** | Renamed exports (`REPORT_*` vs legacy aliases) |

### `packages/sdk-js/src/*` (capture pipeline)

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05 |
| **Phase** | Pre-0 / 5 |
| **Spec** | Browser capture requirements, W3C media APIs |
| **Attestation** | Different file layout from Crikket SDK; Spotting-owned widget |
| **Notes** | Pending Phase 5 formal attestation review |

---

## Phase 1 complete (2026-05-25)

All 37 byte-identical files reauthored from Spotting specs. Spec: `docs/specs/shared-utilities.md`.

| Module group | Files | Attestation |
|--------------|-------|-------------|
| `@spotting/shared` lib/config | 6 | No Crikket source used |
| `apps/web/src/lib` auth/org/schemas | 4 | No Crikket source used |
| Web routes (onboarding, invite, share) | 5 | No Crikket source used |
| Reproduction steps | 4 (incl. submodules) | No Crikket source used |
| `@spotting/ui` components/hooks/lib | 18 | No Crikket source used |

---

## Pending rewrites (tracked in phase0-baseline.json)

### Phase 1 — 37 byte-identical files

**Status:** ✅ Complete — all entries `rewritten` in baseline JSON.

### Phase 2 — Report viewer ✅ (2026-05-25)

Implemented in `apps/web/src/features/report-viewer/`. Spec: `docs/specs/report-viewer.md`.

Mirror similarity: shell 25%, recording 65%, sidebar 42%, header 61%, timeline 68% (all < 70%).

### Phase 3 — Dashboard components ✅ (2026-05-25)

Dashboard bug-report components in baseline → `features/reports/dashboard/*`.

### Phase 7 — Verification gate ✅ (2026-05-25)

- `npm run check:gate` — baseline + branding + optional mirror watch-path scan
- Playwright E2E: `apps/web/e2e/capture-journey.spec.ts`
- Runbook: `docs/provenance/PHASE7-VERIFICATION.md`

---

## Entry log (append after each rewrite)

<!-- Example after Phase 1 rewrite:
### `packages/shared/src/lib/errors.ts`
| Field | Value |
| **Author** | … |
| **Date** | 2026-06-01 |
| **Phase** | 1 |
| **Spec** | docs/specs/shared-utilities.md |
| **Attestation** | No Crikket source was used. |
-->

### `apps/extension/src/*`, `apps/extension/scripts/*` (browser support split)

| Field | Value |
|-------|-------|
| **Author** | Spotting engineering |
| **Date** | 2026-05-28 |
| **Phase** | Extension parity / clean-room |
| **Spec** | `docs/specs/extension-browser-support.md` |
| **Attestation** | No Crikket source was opened or diffed during implementation. |
| **Notes** | Added browser API compatibility layer, per-target manifest generation, packaging scripts, and Safari conversion path docs. |
