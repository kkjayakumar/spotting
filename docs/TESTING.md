# Testing Guide

## Test Commands

- Run all quality gates: `bun run verify`
- Run all tests only: `bun run test`
- Run API tests only: `bun run --filter=@spotting/api test`
- Run worker tests only: `bun run --filter=@spotting/worker test`
- Run web tests only: `bun run --filter=@spotting/web test`

## Deterministic Test Data Strategy

- Keep fixed IDs and timestamps in shared fixture modules (for example `apps/api/src/test/fixtures.ts`).
- Use explicit constants instead of random values in tests to avoid flaky snapshots/assertions.
- Keep route/integration tests isolated by mocking only the dependency surface needed by the scenario.
- Prefer stable UTC timestamp strings in fixtures for predictable date-related behavior in CI.

## Troubleshooting

- `DATABASE_URL missing`:
  - API runtime requires `DATABASE_URL`; tests use module mocks and do not need a live DB.
- `Bun.password` issues:
  - Ensure Bun is installed and use the repository package manager version (`bun@1.3.5`).
- Type/lint errors after editing tests:
  - Run `bun run lint` and `bun run check-types` to catch strict TypeScript issues before `bun run test`.
- Turbo cache confusion:
  - Re-run the same command; turbo prints cache hit/miss per package to confirm what executed.
