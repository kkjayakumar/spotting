# Counsel review checklist — Spotting independence

**Not legal advice.** Use this checklist with qualified counsel before SaaS launch, fundraising, or fintech diligence.

**Review date:** _______________  
**Counsel / firm:** _______________  
**Reviewer:** _______________

---

## 1. Background

| Item | Status | Notes |
|------|--------|-------|
| Spotting is open-source under GNU AGPL-3.0 (KK Jayakumar) | ☑ Confirmed | Adopted AGPL-3.0 on 2026-05-27 |
| Crikket reference product is AGPL-3.0 (redpangilinan) | ☐ Confirmed | |
| Phase 0 baseline documents 37 byte-identical files | ☐ Reviewed | See `phase0-baseline.json` |
| Phase 0 baseline documents 9 high-similarity viewer/dashboard files | ☐ Reviewed | Jaccard > 85% |
| Spotting architecture diverged (custom REST auth, no oRPC/better-auth) | ☐ Reviewed | |

---

## 2. AGPL exposure

| Question | Counsel answer | Remediation |
|----------|----------------|-------------|
| Does Spotting contain verbatim AGPL code? | | Phase 1: rewrite 37 files |
| Are viewer/dashboard modules derivative works? | | Phase 2–3: clean-room reauthor |
| Does Spotting SaaS/network deployment trigger AGPL §13? | | |
| AGPL-3.0 adopted (no longer proprietary) | ☑ Yes | Adopted AGPL-3.0 on 2026-05-27, resolving license incompatibility |
| Is clean-room remediation (spec-only reimplementation) sufficient? | | |

---

## 3. Copyright and trade secret

| Question | Counsel answer | Remediation |
|----------|----------------|-------------|
| Risk of copyright infringement claim from Crikket author? | | |
| Adequacy of Spotting provenance ledger (`docs/provenance/`) | | |
| Contributor attestation process (`CONTRIBUTOR-ACCESS.md`) | | |
| Employee/contractor IP assignment covers Spotting rewrites | | |

---

## 4. Technical remediation status

| Phase | Deliverable | Complete? |
|-------|-------------|-----------|
| 0 | Provenance ledger, CI guardrails, contributor freeze | ☑ |
| 1 | 0 byte-identical files vs baseline | ☑ |
| 2 | Viewer token similarity < 70% | ☑ |
| 3 | Dashboard token similarity < 70% | ☑ |
| 4 | API attestation, env rename, OpenAPI spec | ☑ |
| 5 | SDK/extension attestation, `crk_` sunset | ☑ |
| 6 | Ops cleanup (BETTER_AUTH_*, Bun removal) | ☑ |
| 7 | Full verification gate + E2E | ☑ (engineering) |

---

## 5. Launch gate

| Check | Target | Engineering | Counsel |
|-------|--------|-------------|---------|
| Byte-identical files (baseline) | 0 pending | ☑ | ☐ |
| High-similarity baseline entries | 0 pending | ☑ | ☐ |
| Mirror watch-path (>85%) | 0 when mirror set | ☐ see [mirror-scan-status.md](./mirror-scan-status.md) | ☐ |
| `crikket` / `@crikket` in product source | 0 | ☑ CI | ☐ |
| Legacy `crk_` keys in DB | 0 post-migration | ☑ `npm run prelaunch` | ☐ |
| `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` | After migration | ☑ local via prelaunch | ☐ prod |
| `npm run verify` + `npm run check:gate` | Pass | ☑ | ☐ |
| E2E capture → viewer → dashboard | Pass | ☑ CI + `npm run prelaunch` | ☐ |
| Feature parity (Spotting specs) | Pass | ☑ [FEATURE-PARITY.md](../specs/FEATURE-PARITY.md) | ☐ |

**Engineering evidence:** [ENGINEERING-ATTESTATION.md](./ENGINEERING-ATTESTATION.md) · **Run locally:** `npm run prelaunch`

---

## 6. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering lead | | | |
| Legal counsel | | | |
| Executive sponsor | | | |

**Conditions / follow-ups:**

_______________________________________________

_______________________________________________
