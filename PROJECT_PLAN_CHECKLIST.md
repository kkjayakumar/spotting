# Spotting Full Project Plan

This file tracks the full project completion plan in execution order.
We will work one checklist item at a time and update status as we progress.

## Overall Status

- Completed phases: Foundation complete (API + worker + local infra)
- In progress phase: Full App Plan - Phase A
- Next target phase: Full App Plan - Phase A

---

## Phase 1 - Demo Running End-to-End

### Completed
- [x] Monorepo setup, workspace scripts, and local infra wiring
- [x] API core endpoints for auth, orgs, reports, invites, uploads
- [x] Web demo flow for core happy path
- [x] Worker periodic domain task (maintenance tick)
- [x] Demo setup/run scripts and walkthrough docs

### Pending
- [ ] None

---

## Phase 2 - Product-Ready MVP

### Completed
- [x] Standardized API error envelope and global error handling
- [x] Shared request parsing/validation helpers
- [x] Shared membership/role permission guards
- [x] Consistent invite/report permission enforcement
- [x] Web modularization into `api`, `state`, `render`, `actions`
- [x] Action-scoped status feedback and request dedupe
- [x] Explicit upload-session action from report detail
- [x] README updates for Phase 2 behavior

### Pending
- [ ] None

---

## Phase 3 - Quality and Reliability

### Completed
- [x] Add API unit tests for auth/session flows
- [x] Add API integration tests for org/invite/report/upload endpoints
- [x] Add worker behavior tests for periodic maintenance logic
- [x] Add web smoke tests for critical user journeys
- [x] Wire workspace test commands to real test runners (replace placeholder scripts)
- [x] Enforce quality gates (`lint`, `check-types`, `test`, `build`) in one verification command
- [x] Add deterministic test data strategy (fixtures/seeds for local and CI-like runs)
- [x] Document how to run tests locally and troubleshoot failures

### Pending (execute in this order)
- [ ] None

---

## Phase 4 - Operations and Security Hardening

### Completed
- [x] Add CI pipeline for `lint`, `check-types`, `test`, and `build`
- [x] Introduce shared structured logger for API and worker (replace ad-hoc `console.*`)
- [x] Add request correlation IDs and include latency/status in API request logs
- [x] Expand health/readiness checks to cover critical dependencies and failure modes
- [x] Add baseline API request safeguards (body size limits, timeout budget, safer defaults)
- [x] Add per-route/org-aware rate limiting for sensitive endpoints
- [x] Harden environment handling with validated config schema and startup checks
- [x] Remove default/dev credentials from runtime docs and provide secure env templates
- [x] Write backup/recovery runbook for Postgres and object storage (RPO/RTO + restore drill steps)
- [x] Define deployment matrix for dev/staging/prod (infra, env vars, data policy, access model)
- [x] Write incident, rollback, and service restart runbooks in `docs/operations/`

### Pending (execute in this order)
- [ ] None

---

## Phase 5 - Scale and Launch Readiness

### Completed
- [x] Profile API and worker hotspots under representative load
- [x] Capture baseline SLOs and resource budgets (p95 latency, error rate, worker throughput)
- [x] Optimize DB query patterns and indexing strategy using measured bottlenecks
- [x] Replace interval-only worker flow with queue-backed model and retry/dead-letter policy
- [x] Add performance and resiliency tests for queue/backpressure scenarios
- [x] Finalize release checklist and explicit go/no-go criteria
- [x] Finalize user and developer documentation set
- [x] Dry-run deployment and rollback in a staging-like environment
- [x] Conduct full launch rehearsal with end-to-end verification and sign-off

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase A - Product UX Foundation (Current)

### Completed
- [x] Rebuild `apps/web` from single-page shell to multi-route app foundation
- [x] Add app layout system (top nav, sidebar, content shell, responsive breakpoints)
- [x] Define design tokens (colors, spacing, typography, radius, shadows) for Spotting branding
- [x] Create reusable component primitives (buttons, inputs, cards, tables, modal, toast, tabs)
- [x] Implement route-level loading/error/empty states and global notification system
- [x] Add frontend architecture boundaries (`features`, `components`, `lib/api`, `state`, `hooks`)
- [x] Add frontend lint/type/test baseline for new UI architecture

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase B - Authentication and Organization Workflows

### Completed
- [x] Build production-ready sign-in/sign-up/forgot-password flows
- [x] Add session persistence, protected routes, and auth guards
- [x] Build organization switcher and organization creation flows
- [x] Implement invites UX (list/accept/reject/send/cancel) with role-aware actions
- [x] Add user profile and account settings screens
- [x] Add authorization-aware navigation and action visibility

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase C - Core Reporting Experience

### Completed
- [x] Build dashboard home with key metrics and recent activity
- [x] Build production report list page (filters, sort, pagination, search)
- [x] Build report detail page with status timeline and metadata panels
- [x] Implement report create/edit/status transitions with robust form validation
- [x] Implement upload session UX with progress, retry, and failure handling
- [x] Add share/report visibility controls and detail deep links

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase D - Collaboration and Productivity Features

### Completed
- [x] Add comments/activity feed on reports
- [x] Add assignment, labels/tags, and priority workflows
- [x] Add saved filters/views for teams
- [x] Add keyboard shortcuts and bulk actions for report triage
- [x] Add in-app onboarding guides and empty-state education

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase E - Production Hardening (Frontend + API Integration)

### Completed
- [x] Add end-to-end tests for critical journeys (auth, org, report lifecycle, invites)
- [x] Add accessibility pass (focus order, ARIA labels, contrast, keyboard navigation)
- [x] Add frontend performance optimization (route/code splitting, caching, render budgets)
- [x] Add observability in UI (error tracking, client metrics, request tracing correlation)
- [x] Add security checks (XSS-safe rendering, CSRF/session safety, safe redirects)
- [x] Run full `verify` + web test matrix and fix all regressions

### Pending (execute in this order)
- [ ] None

---

## Full App Plan - Phase F - Release Readiness and Cloud Cutover

### Completed
- [x] Finalize production deployment checklist and rollback playbook
- [x] Dry-run full deployment in staging-like environment
- [x] Execute launch rehearsal with QA/UAT sign-off
- [x] Define SLO dashboards and alert routing for launch week

### Pending (execute in this order)
- [ ] Perform cloud go-live cutover *(current task)*
- [ ] Run hypercare window and publish post-launch report

---

## Working Rule (How We Execute)

- [ ] Pick exactly one pending item as current task
- [ ] Implement and verify the item
- [ ] Mark item complete immediately after verification
- [ ] Move to the next pending item

