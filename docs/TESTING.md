# Testing Guide

## Test Commands

- Run all quality gates: `npm run verify`
- Run all tests only: `npm run test`
- Run API tests only: `npm run test -w @spotting/api`
- Run worker tests only: `npm run test -w @spotting/worker`
- Run web tests only: `npm run test -w @spotting/web`

## Deterministic Test Data Strategy

- Keep fixed IDs and timestamps in shared fixture modules (for example `apps/api/src/test/fixtures.ts`).
- Use explicit constants instead of random values in tests to avoid flaky snapshots/assertions.
- Keep route/integration tests isolated by mocking only the dependency surface needed by the scenario.
- Prefer stable UTC timestamp strings in fixtures for predictable date-related behavior in CI.

## Troubleshooting

- `DATABASE_URL missing`:
  - API runtime requires `DATABASE_URL`; tests use module mocks and do not need a live DB.
- Password hashing:
  - API uses `bcryptjs` via `apps/api/src/password.ts`.
- Type/lint errors after editing tests:
  - Run `npm run lint` and `npm run check-types` before `npm run test`.
- Turbo cache confusion:
  - Re-run the same command; turbo prints cache hit/miss per package to confirm what executed.

## Playwright E2E

- Full journey (capture → viewer → dashboard): `npm run test:e2e`
- Requires infra Postgres on port **5433** (`npm run infra:up`) and E2E seed (`npm run e2e:seed -w @spotting/api`).
- If Docker API is bound to **:3000**, stop it first so Playwright starts a dev API on the same database as the seed:

  ```powershell
  docker compose --env-file .env stop api
  $env:PLAYWRIGHT_REUSE_SERVER = "false"
  npm run test:e2e
  ```

- Use **Node 22+** for E2E (matches CI). Node 20 works but AWS SDK logs a future deprecation warning.
- `EPERM` on `query_engine-windows.dll` during `db push`: another process (often a running API) holds the Prisma engine file. Stop the API or use `npm run db:push:schema-only -w @spotting/api` (E2E global setup tries this first).
