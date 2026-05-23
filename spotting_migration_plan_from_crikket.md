# Spotting Migration Plan from Crikket

This checklist maps Crikket frontend patterns to exact Spotting files to change, in phased order.

Target outcome:
1. `Welcome (Sign In/Sign Up)` first screen  
2. `Organization setup/switch` second step  
3. `Dashboard + report workflows` third step  
with modern design consistency across all steps.

---

## Phase 0 - Baseline and Safety Net

Goal: lock current behavior before large refactors.

### Tasks

- [ ] Add/update route-flow tests for required sequence:
  - unauthenticated -> `/auth`
  - authenticated + no org -> `/organizations`
  - authenticated + org -> `/dashboard`
- [ ] Add smoke test for auth tab switcher + submit IDs.
- [ ] Capture before/after screenshots for `/auth`, `/organizations`, `/dashboard`.

### Spotting files to change

- `apps/web/src/client/routes.e2e.test.ts`
- `apps/web/src/hooks/use-route.test.ts`
- `apps/web/src/client/api.smoke.test.ts`
- `apps/web/src/index.ts` (only if adding test hooks/attributes)

### Crikket reference patterns

- Layout-level route gating (`(protected)` + `(dashboard)` + onboarding redirects)
- Auth-first flow guard discipline

---

## Phase 1 - Route and Shell Alignment (App Flow Backbone)

Goal: mirror Crikket route intent using Spotting hash-router.

### Tasks

- [ ] Normalize to canonical app flow routes:
  - `/auth`
  - `/organizations`
  - `/dashboard`
  - `/reports`
  - `/report-detail`
  - `/settings`
- [ ] Keep `/overview` as backward-compatible alias -> `/dashboard`.
- [ ] Harden guards:
  - protected routes require token
  - org-required routes require active organization
- [ ] Ensure boot-time redirect logic runs after `loadMe()` + `loadOrgs()`.

### Spotting files to change

- `apps/web/src/client/routes.ts`
- `apps/web/src/client/actions.ts`
- `apps/web/src/client/state.ts`
- `apps/web/src/client/render.ts`
- `apps/web/src/hooks/use-route.ts`
- `apps/web/src/hooks/use-route.test.ts`

### Crikket reference patterns

- `apps/web/src/app/(protected)/layout.tsx`
- `apps/web/src/app/(protected)/(dashboard)/layout.tsx`
- `apps/web/src/app/(protected)/onboarding/layout.tsx`

---

## Phase 2 - Auth Experience Parity (Welcome + Tabs + Premium Card)

Goal: make Spotting auth page feel like Crikket first-screen quality.

### Tasks

- [ ] Keep one premium auth card with Sign In / Sign Up tabs.
- [ ] Keep hero-left + auth-right split with responsive collapse.
- [ ] Replace placeholder icons with real reusable SVG icon helpers.
- [ ] Standardize field spacing, labels, feedback states, and button hierarchy.
- [ ] Add keyboard/ARIA quality:
  - tab semantics + panel linking
  - focus-visible styles
  - enter-submit behavior per active tab.

### Spotting files to change

- `apps/web/src/index.ts` (auth markup + CSS)
- `apps/web/src/client/actions.ts` (tab state, panel switch, submit behavior)
- `apps/web/src/client/render.ts` (status/toast visual consistency)
- `packages/ui/src/primitives.ts` (shared auth-card/button/input classes)
- `packages/ui/src/index.ts`

### Crikket reference patterns

- `apps/web/src/components/auth/auth-shell.tsx`
- `apps/web/src/components/auth/sign-in-form.tsx`
- `apps/web/src/components/auth/sign-up-form.tsx`

---

## Phase 3 - Organization Step Parity (Onboarding + Switch + Invites)

Goal: make org setup a clean second-step gate before dashboard.

### Tasks

- [ ] Add explicit empty-state onboarding card in `/organizations`:
  - create first org CTA
  - invite acceptance summary
- [ ] Improve org switcher UX:
  - active badge
  - role badge
  - optimistic UI on switch
- [ ] Group org admin actions into clear sections:
  - create org
  - pending invites
  - sent invites (admin)
- [ ] Auto-route to `/dashboard` when first org is created/selected.

### Spotting files to change

- `apps/web/src/index.ts` (organizations view structure)
- `apps/web/src/client/render.ts` (`orgs`, `invites`, `orgInvitesAdmin`)
- `apps/web/src/client/actions.ts` (`createOrg`, `switchOrg`, invite actions)
- `apps/web/src/client/routes.ts` (post-org route behavior)
- `packages/ui/src/primitives.ts` (badges/cards/list rows)

### Crikket reference patterns

- `apps/web/src/components/team-switcher.tsx`
- `apps/web/src/components/create-organization-dialog.tsx`
- `apps/web/src/app/(protected)/onboarding/_components/create-organization-onboarding-form.tsx`
- `apps/web/src/app/(protected)/(dashboard)/settings/_components/org-members/*`

---

## Phase 4 - Dashboard IA and Report List Modernization

Goal: bring Spotting dashboard information architecture to Crikket-level clarity.

### Tasks

- [ ] Refactor dashboard top section:
  - KPI cards (total/open/critical)
  - recent activity timeline
  - fast actions
- [ ] Refactor reports list into structured rows/cards:
  - title, status, priority, assignee metadata
  - primary action = open detail
  - secondary inline status change by role
- [ ] Improve filter toolbar:
  - status, priority, sort, search, page size in one row
  - saved views as chips/buttons
- [ ] Keep infinite-scroll option as a future enhancement; maintain current paging now.

### Spotting files to change

- `apps/web/src/index.ts` (dashboard + reports markup)
- `apps/web/src/client/render.ts` (`dashboard`, `reports`, `savedViews`)
- `apps/web/src/client/actions.ts` (`loadReports`, selection, bulk update)
- `apps/web/src/client/state.ts` (view model additions if needed)
- `packages/ui/src/primitives.ts` (row, chip, toolbar classes)

### Crikket reference patterns

- `apps/web/src/app/(protected)/(dashboard)/page.tsx`
- `apps/web/src/app/(protected)/(dashboard)/_components/bug-reports/bug-reports-list.tsx`
- `apps/web/src/app/(protected)/(dashboard)/_components/bug-reports/bug-report-card.tsx`
- `apps/web/src/components/app-sidebar.tsx`

---

## Phase 5 - Report Detail Experience (Replay/Timeline/Console/Network)

Goal: reshape Spotting report-detail into tabbed investigative workspace.

### Tasks

- [ ] Convert report detail to tab model:
  - `Details`
  - `Steps/Timeline`
  - `Console`
  - `Network`
- [ ] Introduce main canvas/replay area with fallback states (image/none).
- [ ] Add synchronized selection model:
  - selecting timeline/log entry updates detail focus
- [ ] Network panel UX:
  - request list + request detail split pane
  - search filter
- [ ] Keep current backend contract and progressively enhance UI first.

### Spotting files to change

- `apps/web/src/index.ts` (report-detail layout/tabs/panes)
- `apps/web/src/client/render.ts` (`reportDetail`, `activity`, `comments`)
- `apps/web/src/client/actions.ts` (`loadReportDetail`, tab-specific loading hooks)
- `apps/web/src/client/state.ts` (selected tab, selected event/request ids)
- `packages/ui/src/primitives.ts` (tabs/split-pane/list-item styles)

### Crikket reference patterns

- `apps/web/src/app/s/[id]/_components/bug-report-view.tsx`
- `apps/web/src/app/s/[id]/_components/bug-report-canvas.tsx`
- `apps/web/src/app/s/[id]/_components/bug-report-sidebar.tsx`
- `apps/web/src/app/s/[id]/_components/reproduction-steps-list.tsx`
- `apps/web/src/app/s/[id]/_components/network-requests-panel/*`

---

## Phase 6 - Data Layer Evolution (Toward Crikket-style Query Patterns)

Goal: move Spotting from action-centric imperative fetches to query-driven modules incrementally.

### Tasks

- [ ] Create a thin API query layer in web app:
  - normalize endpoint calls
  - centralize request state + error mapping
- [ ] Add per-screen data modules:
  - auth session
  - organizations
  - reports list
  - report detail
- [ ] Support lazy fetching for heavy panels (future network/log tabs).
- [ ] Keep current `window.SpottingClient` runtime; avoid full rewrite in one phase.

### Spotting files to change

- `apps/web/src/lib/api/endpoints.ts` (extend)
- `apps/web/src/client/api.ts` (response normalization/error model)
- `apps/web/src/client/actions.ts` (delegate to data layer)
- `apps/web/src/client/state.ts` (derived request state fields)
- `apps/web/src/state/store.ts` (type contracts for view/data state)

### Crikket reference patterns

- `apps/web/src/utils/orpc.ts`
- React Query + ORPC usage across dashboard/report/settings components

---

## Phase 7 - Shared UI Package Hardening (`packages/ui`)

Goal: ensure Spotting shared UI package becomes true design-system source.

### Tasks

- [ ] Expand primitives beyond class helpers:
  - button/input/card/badge/tabs/dialog/dropdown shells
- [ ] Add a tokens module for colors/radius/shadows/motion durations.
- [ ] Add icon wrapper utilities and shared SVG map.
- [ ] Add small visual regression stories/tests (if Storybook later, optional).

### Spotting files to change

- `packages/ui/src/index.ts`
- `packages/ui/src/tokens.ts`
- `packages/ui/src/primitives.ts`
- `packages/ui/package.json`
- `apps/web/tailwind.config.ts` (token sync)

### Crikket reference patterns

- `packages/ui/src/components/ui/*`
- `packages/ui/src/styles/globals.css`
- `packages/ui/components.json`

---

## Phase 8 - Polish, Accessibility, and Motion

Goal: finish with production-grade fit and consistency.

### Tasks

- [ ] Accessibility pass:
  - landmarks, aria for tabs/dialogs/lists
  - keyboard flow for auth/org/report screens
- [ ] Motion pass:
  - subtle transitions only (no noisy motion)
  - consistent easing/duration tokens
- [ ] Visual pass:
  - contrast checks
  - spacing rhythm
  - empty/error/loading states alignment
- [ ] End-to-end happy-path verification.

### Spotting files to change

- `apps/web/src/index.ts`
- `apps/web/src/client/render.ts`
- `apps/web/src/client/actions.ts`
- `packages/ui/src/primitives.ts`
- `apps/web/src/client/routes.e2e.test.ts`
- `apps/web/src/client/api.smoke.test.ts`

### Crikket reference patterns

- Auth and dashboard polished interactions
- Consistent UI primitive usage across screens

---

## Execution Checklist (Milestone Tracking)

- [x] M1: Flow backbone complete (`/auth -> /organizations -> /dashboard`)
- [x] M2: Auth page parity complete (premium card + tabs + icon inputs)
- [x] M3: Organizations step parity complete (create/switch/invite UX)
- [x] M4: Dashboard + report list modernization complete
- [x] M5: Report detail tabbed workspace complete
- [x] M6: Data layer modularization complete
- [x] M7: Shared UI package hardened
- [x] M8: Accessibility, motion, and final QA complete

---

## Suggested Implementation Order (Fastest Value First)

1. Phase 1 -> 2 -> 3 (flow + auth + org step) - completed  
2. Phase 4 (dashboard/list polish)  
3. Phase 5 (report detail workspace)  
4. Phase 6 + 7 (architecture and design-system hardening)  
5. Phase 8 (final polish and release readiness) - completed

