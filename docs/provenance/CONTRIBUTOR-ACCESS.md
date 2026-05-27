# Contributor access — Crikket freeze (Phase 0)

**Effective:** 2026-05-25  
**Applies to:** All Spotting contributors (employees, contractors, agents)

## Policy

While Spotting independence work (Phases 0–7) is in progress:

1. **Do not open the Crikket repository** when implementing or modifying Spotting product code (`apps/`, `packages/`, `scripts/` except compliance tooling).
2. **Do not side-by-side diff** Spotting against Crikket (IDE compare, `git diff`, copy-paste from Crikket).
3. **Do not copy** files, snippets, or UI markup from Crikket into Spotting.
4. **Implement from Spotting specs only** — see `docs/specs/` and product requirements in `docs/provenance/SEPARATION-PLAN.md`.

## Allowed exceptions

| Activity | Allowed? |
|----------|----------|
| Compliance tooling (`scripts/compliance/check-lineage.mjs`) on CI runners with `CRIKKET_MIRROR_PATH` | Yes — automated only, no manual copying |
| Updating `docs/provenance/phase0-baseline.json` status after a rewrite | Yes |
| Reading Crikket **license text** for counsel (not source code) | Yes — legal team only |
| shadcn/ui components via **official CLI** in Spotting | Yes — breaks copy chain per clean-room policy |

## Attestation

Each provenance entry in [LEDGER.md](./LEDGER.md) must include:

> **No Crikket source was used** during this module's implementation.

Contributors who violate this policy must disclose the exposure to engineering lead and counsel before merge.

## Enforcement

- CI: `npm run check:lineage` (baseline hash tracking + branding ban)
- Optional private job: mirror byte-match + similarity threshold (see [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md))
- Code review: reject PRs that reference Crikket file paths or paste external AGPL code

## Questions

Escalate to engineering lead and legal counsel before any exception to this freeze.
