# Spotting independence & delivery checklist

**Goal:** 100% feature parity · 0% Crikket code lineage · counsel-ready provenance.

**Policy:** [docs/clean-room-policy.md](docs/clean-room-policy.md)  
**Detailed plan:** [docs/provenance/SEPARATION-PLAN.md](docs/provenance/SEPARATION-PLAN.md)  
**Feature parity spec:** [docs/specs/FEATURE-PARITY.md](docs/specs/FEATURE-PARITY.md)  
**Last updated:** 2026-05-25

Status: `[x]` done in codebase · `[ ]` not done · `[~]` partial

---

## Pre-separation — Spotting-owned architecture (done before Phase 0)

- [x] AGPL-3.0 License (KK Jayakumar)
- [x] Remove oRPC; native REST client (`apps/web/src/lib/api/*`)
- [x] Custom Hono + Prisma auth (no better-auth library)
- [x] `spk_` capture keys + migration script (`migrate:capture-keys`)
- [x] Reauthored shared constants (`packages/shared/src/constants/*`)
- [x] Real billing API + `OrganizationSubscription` model
- [x] Real password reset API + `PasswordResetToken` model
- [x] Org PATCH/DELETE/membership routes + RBAC
- [x] S3 cleanup on report/org delete
- [x] npm migration (Node 22, Vitest, `@hono/node-server`)
- [x] CI branding ban (`crikket` / open-source strings)
- [x] `npm run verify` passes

---

## Phase 0 — Compliance baseline ✅

- [x] Contributor Crikket access freeze → [docs/provenance/CONTRIBUTOR-ACCESS.md](docs/provenance/CONTRIBUTOR-ACCESS.md)
- [x] Provenance ledger → [docs/provenance/LEDGER.md](docs/provenance/LEDGER.md)
- [x] Phase 0 audit baseline (37 identical + 9 high-similarity files) → [docs/provenance/phase0-baseline.json](docs/provenance/phase0-baseline.json)
- [x] Lineage checker → [scripts/compliance/check-lineage.mjs](scripts/compliance/check-lineage.mjs)
- [x] Path mappings for optional mirror CI → [scripts/compliance/path-mappings.json](scripts/compliance/path-mappings.json)
- [x] Optional private mirror workflow example → [.github/workflows/lineage-mirror.yml.example](.github/workflows/lineage-mirror.yml.example)
- [x] Counsel review checklist → [docs/provenance/COUNSEL-REVIEW.md](docs/provenance/COUNSEL-REVIEW.md)
- [x] Feature parity stub → [docs/specs/FEATURE-PARITY.md](docs/specs/FEATURE-PARITY.md)
- [x] CI runs `npm run check:lineage` (baseline + branding)
- [ ] Counsel review session completed (external)

---

## Phase 1 — Eliminate byte-identical files ✅

**Acceptance:** 0 pending entries in `phase0-baseline.json` → `identical_files`. **Met.**

### P0 — Shared utilities (6 files)

- [x] `packages/shared/src/lib/errors.ts`
- [x] `packages/shared/src/lib/posthog.ts`
- [x] `packages/shared/src/lib/server/pagination.ts`
- [x] `packages/shared/src/lib/server/retry-on-unique-violation.ts`
- [x] `packages/shared/src/config/pagination.ts`
- [x] `packages/shared/src/config/placeholders.ts`
- [x] Spec → [docs/specs/shared-utilities.md](docs/specs/shared-utilities.md)

### P0 — Web lib (4 files)

- [x] `apps/web/src/lib/auth.ts`
- [x] `apps/web/src/lib/organization.ts`
- [x] `apps/web/src/lib/schema/auth.ts`
- [x] `apps/web/src/lib/schema/organization.ts`

### P0 — UI package (18 files)

- [x] `packages/ui/src/components/icons.tsx`
- [x] `packages/ui/src/components/loader.tsx`
- [x] `packages/ui/src/components/pricing-plans.tsx`
- [x] `packages/ui/src/components/theme-provider.tsx`
- [x] `packages/ui/src/components/magicui/highlighter.tsx`
- [x] `packages/ui/src/components/ui/collapsible.tsx`
- [x] `packages/ui/src/components/ui/sonner.tsx`
- [x] `packages/ui/src/config/data-table.ts`
- [x] `packages/ui/src/hooks/use-callback-ref.ts`
- [x] `packages/ui/src/hooks/use-debounce.ts`
- [x] `packages/ui/src/hooks/use-local-storage.ts`
- [x] `packages/ui/src/hooks/use-mobile.ts`
- [x] `packages/ui/src/lib/compose-refs.ts`
- [x] `packages/ui/src/lib/data-table.ts`
- [x] `packages/ui/src/lib/format.ts`
- [x] `packages/ui/src/lib/id.ts`
- [x] `packages/ui/src/lib/parsers.ts`
- [x] `packages/ui/src/lib/utils.ts`
- [x] `packages/ui/src/styles/globals.css`
- [x] `packages/ui/src/types/data-table.ts`

### P1 — Web routes (5 files)

- [x] `apps/web/src/app/(protected)/onboarding/layout.tsx`
- [x] `apps/web/src/app/(protected)/onboarding/page.tsx`
- [x] `apps/web/src/app/invite/[invitationId]/page.tsx`
- [x] `apps/web/src/app/s/layout.tsx`
- [x] `apps/web/src/app/s/[id]/page.tsx`
- [x] `apps/web/src/app/s/[id]/_components/reproduction-steps.ts` (+ `reproduction-steps/*` modules)
- [x] `network-requests-panel/` — legacy route stub only; implementation in `features/report-viewer/components/network-inspector/`

### Follow-up (mirror scan — not in Phase 0 baseline)

- [x] `apps/web/src/app/(protected)/dashboard/page.tsx`
- [x] `apps/web/src/app/(protected)/dashboard/_components/bug-reports/utils.ts`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_lib/get-request-error-message.ts`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_components/public-keys/utils.ts`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_components/public-keys/forms/public-key-create-form.tsx`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_components/organization-billing/types.ts`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_components/org-members/role-labels.ts`
- [x] `apps/web/src/app/(protected)/dashboard/settings/_components/org-members/types.ts`

---

## Phase 2 — Clean-room report viewer ✅

- [x] Write spec → [docs/specs/report-viewer.md](docs/specs/report-viewer.md)
- [x] Types contract → `apps/web/src/features/report-viewer/types.ts`
- [x] Rebuild under `apps/web/src/features/report-viewer/` (new component tree)
- [x] Thin route wrappers in `app/s/[id]/_components/` (re-exports only)
- [ ] Playwright golden tests on Spotting fixtures
- [x] Token similarity < 70% vs Crikket (shell 25%, recording 65%, sidebar 42%, header 61%, timeline 68%)

### High-similarity files (Phase 2 targets)

- [x] `bug-report-view.tsx` → `spotting-report-viewer.tsx`
- [x] `bug-report-canvas.tsx` → `recording-stage.tsx`
- [x] `bug-report-sidebar.tsx` → `inspector-sidebar.tsx`
- [x] `bug-report-header.tsx` → `report-viewer-header.tsx`
- [x] `timeline-list.tsx` → `session-timeline-list.tsx`

---

## Phase 3 — Clean-room dashboard ✅

- [x] Write spec → [docs/specs/dashboard-reports.md](docs/specs/dashboard-reports.md)
- [x] Feature module → `apps/web/src/features/reports/dashboard/`
- [x] Reauthor `bug-report-card.tsx`, list, toolbar, bulk actions, delete dialogs
- [x] Reauthor settings: public keys, billing, org members (helpers relocated)
- [x] Legacy `dashboard/_components/bug-reports/*` and `_hooks/*` are thin re-exports
- [ ] Token similarity < 70% for all dashboard files (run `check:lineage:mirror` when mirror available)

### High-similarity files (Phase 3 targets)

- [x] `bug-report-card.tsx` (~97%) → `report-grid-card.tsx`
- [x] `bug-reports-list.tsx` (~98%) → `spotting-reports-list.tsx`
- [x] `bug-reports-toolbar.tsx` (~100%) → `reports-query-bar.tsx`
- [x] `bug-reports-bulk-actions.tsx` (~100%) → `reports-bulk-editor.tsx`

---

## Phase 4 — API & data layer attestation ✅

- [x] Custom REST API largely Spotting-owned (`apps/api/src/v1.ts`, auth, billing)
- [x] Remove dead legacy report routes (consolidated in `v1.ts`; removed `PATCH /reports/:id/status` + unused web client stubs)
- [x] Rename `BETTER_AUTH_*` → `SPOTTING_AUTH_*` (env, docker, README)
- [x] OpenAPI spec → [docs/api/openapi.yaml](docs/api/openapi.yaml)
- [x] Prisma model copyright headers in `schema.prisma`
- [~] Assignee field in schema — deferred (not in product parity spec; remove dead client stubs only)

---

## Phase 5 — SDK & extension attestation ✅

- [x] SDK structurally different from Crikket (`packages/sdk-js`)
- [x] Formal capture pipeline provenance → [docs/specs/capture-pipeline.md](docs/specs/capture-pipeline.md)
- [x] Extension docs: `spk_` only for new integrations ([apps/extension/README.md](apps/extension/README.md))
- [x] Migration runbook + `--dry-run` → [docs/ops/capture-key-migration.md](docs/ops/capture-key-migration.md)
- [~] Run `npm run migrate:capture-keys -w @spotting/api` in production (ops task — runbook ready)
- [x] Legacy `crk_` sunset gate → `SPOTTING_ACCEPT_LEGACY_CRK_KEYS` (default `true`; set `false` post-migration)

---

## Phase 6 — Identity & ops cleanup ✅

- [x] Remove all `BETTER_AUTH_*` references (use `SPOTTING_AUTH_*` only)
- [x] Worker Dockerfile: Bun → npm (`node:22-alpine`)
- [x] Stale docs: `bun` → `npm` (`docs/AI_QA_WORKFLOW.md`, profiling, staging report)
- [x] README: AGPL-3.0 footer + clean-room policy links

---

## Phase 7 — Verification gate (launch)

| Check | Target | Status |
|-------|--------|--------|
| Byte-identical files (baseline) | 0 pending | [x] |
| High-similarity baseline entries | 0 pending | [x] |
| Mirror watch-path similarity (>85%) | 0 | [x] `CRIKKET_MIRROR_PATH` + `npm run check:gate` (2026-05-25) |
| `crikket` / `@crikket` in product source | 0 | [x] |
| New `crk_` identifiers (post-migration) | 0 | [x] local · [~] prod |
| `npm run verify` | Pass | [x] |
| `npm run check:lineage` | Pass | [x] |
| `npm run check:gate` | Pass | [x] |
| E2E: capture → viewer → dashboard | Pass | [x] |
| Counsel sign-off | Obtained | [ ] |

**Runbook:** [docs/provenance/PHASE7-VERIFICATION.md](docs/provenance/PHASE7-VERIFICATION.md)

---

## Feature parity (nothing less in Spotting)

Validated by Spotting specs + tests only — never by diffing Crikket.

### Capture & embed

- [x] Screen recording
- [x] Console log capture
- [x] Network request capture
- [x] User action timeline
- [x] Embed widget mount
- [x] Public key auth (`spk_*`)
- [x] Origin allowlist

### Report viewer (`/s/[id]`)

- [x] Share link playback (functional)
- [x] Clean-room viewer rewrite (Phase 2)
- [x] Reproduction steps logic (Phase 1 rewrite)

### Dashboard

- [x] List / pagination
- [x] Filter / sort
- [x] Priority / visibility
- [x] Clean-room dashboard rewrite (Phase 3)
- [ ] Assignee (schema gap)

### Organization & auth

- [x] Multi-tenant orgs
- [x] Roles (owner / admin / member)
- [x] Invitations
- [x] Email verification
- [x] Password reset

### Billing & infrastructure

- [x] Subscription records (`OrganizationSubscription`)
- [x] Plan limits (internal — no pricing UI)
- [x] S3 presigned uploads
- [x] S3 delete cleanup
- [x] Worker maintenance
- [x] Chrome extension

---

## Commands

```bash
npm run prelaunch           # full launch gate (infra + migrate + verify + gate + e2e)
npm run verify              # lint + types + tests + build
npm run check:lineage       # baseline + branding (CI)
npm run check:gate          # Phase 7 launch gate (+ mirror when CRIKKET_MIRROR_PATH set)
npm run migrate:capture-keys:dry  # preview crk_ → spk_ migration
npm run test:e2e            # Playwright: smoke + capture journey
```

---

## Next sprint — path to 100/100

**Current score: ~98/100** (engineering complete locally). Remaining ~2 points (ops + legal):

| # | Task | Owner | Points | Status |
|---|------|-------|--------|--------|
| 1 | Counsel sign-off — [ENGINEERING-ATTESTATION.md](docs/provenance/ENGINEERING-ATTESTATION.md) + [COUNSEL-REVIEW.md](docs/provenance/COUNSEL-REVIEW.md) | Legal | 2 | [ ] |
| 2 | Production prelaunch — backup DB → `npm run migrate:capture-keys` → `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` → redeploy | Ops | 2 | [ ] |
| 3 | Mirror scan — `CRIKKET_MIRROR_PATH` in `.env` → `npm run check:gate` | Engineering | 1 | [x] 2026-05-25 |
| 4 | Optional: Playwright golden tests for report viewer | Engineering | 0.5 | deferred |
| 5 | Optional: assignee field (deferred — not in v1 scope) | Product | 0.5 | deferred |

**Run full gate locally:** `npm run prelaunch` (requires Docker for Postgres)
