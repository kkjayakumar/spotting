# Spotting clean-room development policy

Spotting is licensed under the GNU Affero General Public License version 3 (AGPL-3.0) under KK Jayakumar. All contributors must follow these rules:

1. **Do not copy code** from Crikket, Jam.dev, Marker.io, or any other third-party codebase unless that code is explicitly MIT/Apache-licensed and installed via an official generator (e.g. shadcn CLI).
2. **Reimplement from specs** — use product requirements, API contracts, and UX goals; do not diff against external repos when writing new modules.
3. **No legacy prefixes** — use Spotting naming (`spk_` capture keys, `spotting-*` DOM IDs). Do not add new `crk_` or `crikket` identifiers.
4. **Document provenance** — new modules must be recorded in [docs/provenance/LEDGER.md](./provenance/LEDGER.md) with author, date, spec reference, and attestation.
5. **Legal review** — consult counsel before public SaaS launch or external distribution. Use [docs/provenance/COUNSEL-REVIEW.md](./provenance/COUNSEL-REVIEW.md).

## Contributor access (Phase 0+)

**Crikket source access is frozen** for Spotting product work. See [docs/provenance/CONTRIBUTOR-ACCESS.md](./provenance/CONTRIBUTOR-ACCESS.md).

## Independence program

Phased separation plan: [docs/provenance/SEPARATION-PLAN.md](./provenance/SEPARATION-PLAN.md).

## CI enforcement

| Check | Command |
|-------|---------|
| Baseline + branding (public CI) | `npm run check:lineage` |
| Report only (local dev) | `npm run check:lineage:report` |
| Mirror byte + similarity (private CI only) | `CRIKKET_MIRROR_PATH=… npm run check:lineage:mirror` |

Public CI runs baseline + branding only (no Crikket mirror). Phase 1 baseline is clear (0 pending byte-identical files).

Optional private mirror workflow: [.github/workflows/lineage-mirror.yml.example](../.github/workflows/lineage-mirror.yml.example).
