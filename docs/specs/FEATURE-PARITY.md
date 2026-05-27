# Spotting feature parity specification

Product capabilities Spotting must maintain through clean-room rewrites.  
**Validation:** Spotting specs + automated tests only — never by diffing Crikket.

Status legend: ✅ implemented · 🔄 rewrite pending · ☐ not started

---

## Capture & embed

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| Screen recording | ✅ | `packages/sdk-js`, E2E capture flow |
| Console log capture | ✅ | SDK console interceptor |
| Network request capture | ✅ | SDK network interceptor |
| User action timeline | ✅ | SDK user-actions |
| Embed widget mount | ✅ | `docs/capture-embed.md` |
| Public key auth (`spk_*`) | ✅ | API capture routes |
| Origin allowlist | ✅ | Capture key settings |

## Report viewer (`/s/[id]`)

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| Share link playback | ✅ | Playwright viewer tests |
| Timeline / events | ✅ | `session-timeline-list.tsx` |
| Network panel | ✅ | `network-inspector/` |
| Canvas / recording stage | ✅ | `recording-stage.tsx` |
| Sidebar metadata | ✅ | `inspector-sidebar.tsx` + `report-details-panel.tsx` |
| Reproduction steps | ✅ | Phase 1 rewrite — `reproduction-steps/*` |

## Dashboard

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| List / pagination | ✅ | Dashboard E2E |
| Filter / sort | ✅ | |
| Bulk delete / status | ✅ | Dashboard bulk editor |
| Priority / visibility | ✅ | |
| Assignee | ☐ | Schema gap — track in Phase 3 |

## Organization & auth

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| Multi-tenant orgs | ✅ | Single shared workspace + invites |
| Roles (owner/admin/member) | ✅ | RBAC middleware |
| Invitations | ✅ | |
| Email verification | ✅ | |
| Password reset | ✅ | |

## Billing

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| Subscription records | ✅ | `OrganizationSubscription` |
| Plan limits (internal) | ✅ | `plan-limits.ts` — no pricing/payment UI |

## Infrastructure

| Capability | Status | Spec / tests |
|------------|--------|--------------|
| S3 presigned uploads | ✅ | |
| Delete cleanup (S3) | ✅ | `report-cleanup.ts` |
| Worker maintenance | ✅ | |
| Chrome extension | ✅ | `apps/extension` |

---

Update this document as each phase completes. Link detailed behavior specs in `docs/specs/` subfiles.
