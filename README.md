# Spotting

Clean-room implementation workspace for the new Spotting platform.

## Guardrails

- Reference behavior only from external AGPL systems.
- Do not copy source code, migration files, tests, or assets.
- Track architecture and provenance decisions in `/docs`.

## Repository Layout

- `apps/web` - dashboard frontend shell
- `apps/api` - API service shell
- `apps/worker` - async/background worker shell
- `apps/extension` - Chrome MV3 extension (inject capture widget on any site)
- `packages/ui` - shared UI primitives
- `packages/sdk-js` - embeddable browser capture SDK (widget + MediaRecorder + network/console hooks)
- `packages/config` - shared config/tooling
- `infra/docker` - local infrastructure compose

### Capture SDK & extension (Phase 1–2)

- See **[docs/capture-embed.md](./docs/capture-embed.md)** for public keys, CORS, build commands, and load-unpacked steps.
- API routes: `POST /v1/capture/reports`, `POST /v1/capture/upload-sessions`, `POST /v1/capture/upload-sessions/:id/finalize` (Bearer `crk_…`).
- Create keys: `POST /v1/orgs/:orgId/capture-keys` (owner/admin, session auth).

## Bootstrap

1. Install dependencies: `bun install`
2. Create local env file: copy `.env.example` to `.env`
3. Run first-time demo setup:
   - `bun run demo:setup`
4. Start all app services:
   - `bun run demo:start`

## Local Services

- Web shell: `http://localhost:3001`
- API root: `http://localhost:3000`
- API health: `http://localhost:3000/healthz`
- API ready: `http://localhost:3000/readyz`

## First Demo Walkthrough

1. Open `http://localhost:3001`.
2. Sign up with a new user.
3. Create an organization and click it in **My Organizations** to set active org.
4. Create a report, then refresh reports and open one report detail.
5. Confirm upload session details appear in report detail (presigned upload URL generated).
6. Use invites flow:
   - create invite via API or existing UI flow,
   - sign in as invited user,
   - accept/reject invite from **Pending Invites**.
7. Keep worker running and watch logs for periodic maintenance output:
   - expired pending invites are auto-cancelled,
   - expired non-finalized upload sessions are counted.

## Phase 2 API Contract Notes

- API errors now follow a standard envelope:
  - `{ "error": { "code": "...", "message": "...", "details": [] } }`
- Common error codes include:
  - `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `GONE`, `INTERNAL_ERROR`
- Invalid enum/query values return deterministic `400` validation errors (no silent fallback).
- Invite management endpoints (`/orgs/:orgId/invites`) now require owner/admin role.
- Report status mutation endpoint (`PATCH /v1/reports/:reportId/status`) requires owner/admin role.

## Phase 2 Web Notes

- Web client logic is now separated into modular client blocks (`api`, `state`, `render`, `actions`) to reduce coupling.
- Report detail loading and upload session creation are now explicit separate actions.
- UI uses action-scoped status areas and request dedupe guards for more predictable interactions.

## Useful Commands

- Start infra only: `bun run infra:up`
- Stop infra only: `bun run infra:down`
- Generate Prisma client: `bun run db:generate`
- Push Prisma schema: `bun run db:push`
- Run all quality gates: `bun run verify`
- Run all tests: `bun run test`
- API tests: `bun run --filter=@spotting/api test`
- Worker tests: `bun run --filter=@spotting/worker test`
- Web tests: `bun run --filter=@spotting/web test`

## Testing and Reliability (Phase 3)

- API auth/session unit tests are now wired in `apps/api/src/auth.test.ts`.
- API integration coverage for org/invite/report/upload flows is in `apps/api/src/v1.integration.test.ts`.
- Worker maintenance behavior coverage is in `apps/worker/src/maintenance.test.ts`.
- Web smoke coverage for client API helpers is in `apps/web/src/client/api.smoke.test.ts`.
- Deterministic fixtures are defined in `apps/api/src/test/fixtures.ts`.
- See `docs/TESTING.md` for local execution and troubleshooting guidance.




Proposed Completion Phases
Phase 1 — Demo Running End-to-End
Local setup works, core flows run (auth, orgs, reports, invites, upload sessions, basic worker task).

Phase 2 — Product-Ready MVP
Better UX structure, input validation consistency, role/permission cleanup, and stronger error handling.

Phase 3 — Quality & Reliability
Automated tests (API + integration), lint/type/test gates, and stable seed/migration workflow.

Phase 4 — Operations & Security Hardening
CI/CD, monitoring/logging, rate limiting, secret handling, backup/recovery, and production env strategy.

Phase 5 — Scale & Launch Readiness
Performance optimization, worker queue strategy, deployment playbooks, documentation, and release checklist.