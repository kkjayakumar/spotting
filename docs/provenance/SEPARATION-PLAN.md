# Spotting independence — separation plan

Phased plan to achieve **100% feature parity** with **0% Crikket code lineage**.  
Aligned with [clean-room-policy.md](../clean-room-policy.md).

**Tracking checklist:** [PROJECT_PLAN_CHECKLIST.md](../../PROJECT_PLAN_CHECKLIST.md)

---

## Phase 0 — Compliance baseline ✅ (2026-05-25)

- [x] Contributor Crikket access freeze → [CONTRIBUTOR-ACCESS.md](./CONTRIBUTOR-ACCESS.md)
- [x] Provenance ledger → [LEDGER.md](./LEDGER.md), [README.md](./README.md)
- [x] Phase 0 audit baseline → [phase0-baseline.json](./phase0-baseline.json)
- [x] CI guardrails → `scripts/compliance/check-lineage.mjs`
- [x] Counsel checklist → [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md)
- [ ] Counsel review session scheduled

**Acceptance:** Infrastructure in place; baseline tracks 37 identical + 9 high-similarity files.

**Acceptance:** 0 baseline violations; all 37 files marked `rewritten` in baseline JSON.

**Follow-up:** Mirror scan still finds 8 additional byte-identical dashboard/settings files (not in Phase 0 baseline) — track for Phase 1.5 or Phase 3.

**CI note:** Switch public CI to `npm run check:lineage` (enforce) now that Phase 1 baseline is clear.

---

## Phase 1 — Eliminate byte-identical files (P0) ✅ (2026-05-25)

Rewrite all entries in `phase0-baseline.json` → `identical_files`.

| Priority | Scope | Action |
|----------|-------|--------|
| P0 | `packages/shared/src/lib/*` | Reimplement utilities |
| P0 | `apps/web/src/lib/auth.ts`, `organization.ts`, schemas | Merge into `lib/api/*` |
| P0 | `packages/ui` custom components | Rebuild from UX spec |
| P1 | Onboarding, invite, share page routes | Reauthor |
| P2 | shadcn-identical UI | Regenerate via shadcn CLI |

**Acceptance:** 0 baseline violations; ledger entries for each file.

---

## Phase 2 — Clean-room report viewer ✅ (2026-05-25)

- Spec: `docs/specs/report-viewer.md`
- Implementation: `apps/web/src/features/report-viewer/`
- Route wrappers: thin re-exports in `app/s/[id]/_components/`

**Acceptance:** Token similarity < 70% for all 5 viewer files. Playwright golden tests still pending.

---

## Phase 3 — Clean-room dashboard (P1)

- Migrate to `features/reports/dashboard/*`
- Settings: public keys, billing, org members

**Acceptance:** No file > 70% similarity; full feature checklist.

---

## Phase 4 — API & data attestation (P1)

- Remove dead routes in `reports.ts`
- Rename `BETTER_AUTH_*` → `SPOTTING_AUTH_*`
- OpenAPI spec: `docs/api/openapi.yaml`
- Prisma model headers

---

## Phase 5 — SDK & extension (P1)

- Capture pipeline attestation
- `spk_` only in new docs; sunset `crk_`
- Run `migrate:capture-keys` in prod

---

## Phase 6 — Identity & ops cleanup (P2)

- Remove all `BETTER_AUTH_*`
- Worker Dockerfile → npm
- Docs bun → npm
- README AGPL-3.0 footer & license update

---

## Phase 7 — Verification gate

| Check | Target |
|-------|--------|
| Byte-identical files | 0 pending |
| High-similarity baseline | 0 pending |
| Mirror watch-path (>85%) | 0 (when mirror available) |
| `crikket` in product source | 0 |
| `npm run verify` + `check:gate` | Pass |
| E2E capture → viewer → dashboard | Pass |
| Counsel sign-off | Obtained |

Runbook: [PHASE7-VERIFICATION.md](./PHASE7-VERIFICATION.md)

---

## Feature parity checklist

Validated by Spotting specs + tests only (never by diffing Crikket):

- [ ] Embed SDK capture (screen, console, network, user actions)
- [ ] Public share viewer `/s/[id]`
- [ ] Dashboard list/filter/sort/bulk ops
- [ ] Org multi-tenancy + roles
- [ ] Capture public keys + origin allowlist
- [ ] Chrome extension
- [ ] Email verification + password reset
- [ ] Billing / subscriptions
- [ ] S3 upload lifecycle + delete cleanup
- [ ] Worker processing pipeline

See `docs/specs/FEATURE-PARITY.md` (stub — expand per phase).
