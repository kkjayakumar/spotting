# Spotting provenance ledger

This directory records **clean-room provenance** for Spotting modules. It supports fintech diligence and counsel review by showing which code was authored from Spotting specs—not copied from third-party codebases.

## Structure

| File | Purpose |
|------|---------|
| [LEDGER.md](./LEDGER.md) | Human-readable module provenance entries |
| [phase0-baseline.json](./phase0-baseline.json) | Machine-readable audit baseline (37 byte-identical files, 9 high-similarity files) |
| [CONTRIBUTOR-ACCESS.md](./CONTRIBUTOR-ACCESS.md) | Crikket access freeze and contributor rules |
| [COUNSEL-REVIEW.md](./COUNSEL-REVIEW.md) | Legal review checklist (AGPL exposure, SaaS use) |
| [SEPARATION-PLAN.md](./SEPARATION-PLAN.md) | Phased independence plan (Phase 0–7) |
| [PHASE7-VERIFICATION.md](./PHASE7-VERIFICATION.md) | Launch gate runbook (verify, gate, E2E) |
| [ENGINEERING-ATTESTATION.md](./ENGINEERING-ATTESTATION.md) | Engineering evidence bundle for counsel |
| [mirror-scan-status.md](./mirror-scan-status.md) | Latest optional Crikket mirror scan result |

## How to add a provenance entry

When you complete a clean-room rewrite (Phase 1+):

1. Update [LEDGER.md](./LEDGER.md) with author, date, spec reference, and attestation.
2. If the file was listed in [phase0-baseline.json](./phase0-baseline.json), set `"status": "rewritten"` and add `"rewritten_sha256"`.
3. Run `npm run check:lineage` — baseline violations should decrease.

### Ledger entry template

```markdown
### `path/to/module`

| Field | Value |
|-------|-------|
| **Author** | Name / team |
| **Date** | YYYY-MM-DD |
| **Phase** | 1 / 2 / 3 / … |
| **Spec** | `docs/specs/….md` |
| **Attestation** | No Crikket source was opened or diffed during implementation. |
| **Notes** | Optional: behavior parity notes, test refs |
```

## Automated checks

```bash
# Full launch gate (infra + migrate + verify + gate + e2e)
npm run prelaunch

# Public CI (no Crikket mirror): baseline + branding
npm run check:lineage

# Phase 7 launch gate (+ mirror watch-path scan when CRIKKET_MIRROR_PATH set)
npm run check:gate

# Report violations without failing (local dev during Phase 1)
npm run check:lineage:report

# Private CI with local Crikket mirror checkout
CRIKKET_MIRROR_PATH=/path/to/crikket npm run check:lineage:mirror
```

See [../clean-room-policy.md](../clean-room-policy.md) for contributor rules.
