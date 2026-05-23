# Phase 5 Profiling Guide

This guide starts Phase 5 by capturing baseline performance for API and worker.

## Prerequisites

1. Ensure infra and schema are ready:
   - `bun run demo:setup`
2. Start services in a separate terminal:
   - `bun run demo:start`
3. For realistic API profiling, set these environment variables:
   - `PROFILE_AUTH_TOKEN` (valid bearer token)
   - `PROFILE_ORG_ID` (organization id for scoped endpoints)

## API Profiling

Default target:
- `http://localhost:3000/v1/reports`

Run:
- `bun run profile:api`

Optional tuning:
- `PROFILE_API_URL` (endpoint URL)
- `PROFILE_CONNECTIONS` (default `25`)
- `PROFILE_DURATION_SECONDS` (default `30`)

The script prints a JSON summary with request rate, latency percentiles, throughput, and error counters.

## Worker Profiling

The worker baseline measures execution time for repeated maintenance ticks.

Run:
- `bun run profile:worker`

Optional tuning:
- `PROFILE_WORKER_ITERATIONS` (default `10`)

The script prints average, p95, min, and max duration in milliseconds.

## Baseline Record Template

Use this template in your next profiling pass:

- API:
  - requests/sec avg:
  - latency p50/p95/p99:
  - non-2xx/errors/timeouts:
- Worker:
  - avg duration (ms):
  - p95 duration (ms):
  - min/max duration (ms):

## Baseline Results (2026-05-06)

- API (`bun run profile:api` with default target `/v1/reports`):
  - requests/sec avg: `15956.4`
  - latency p50/p97.5/p99 (ms): `1 / 3 / 4`
  - throughput bytes/sec: `4196522.67`
  - non-2xx/errors/timeouts: `478672 / 0 / 0`
  - note: no auth token was set for this run, so requests were rejected but still useful for transport-level baseline.
- Worker (`bun run profile:worker`, 10 iterations):
  - avg duration (ms): `7.93`
  - p95 duration (ms): `62.07`
  - min/max duration (ms): `1.44 / 62.07`

## Next Phase 5 Step

After collecting baseline numbers, proceed to:
- Capture SLO targets and resource budgets based on measured results.

## SLO and Resource Budgets (Initial)

These are initial targets derived from the current baseline and should be tightened after authenticated load tests.

- API availability SLO:
  - target: `99.9%` successful responses for production traffic over 30-day window
  - error budget: `0.1%` failed requests
- API latency SLO (read-heavy endpoints):
  - p95 latency target: `<= 120ms`
  - p99 latency target: `<= 250ms`
  - note: current unauthenticated synthetic baseline is much lower (`p99=4ms`) but not representative of full business logic paths.
- API throughput budget:
  - sustain budget: `>= 1000 req/s` for key list/read endpoints in staging load tests
  - saturation alert threshold: sustained drop below budget for 5 minutes
- Worker throughput and latency SLO:
  - maintenance tick p95 target: `<= 150ms`
  - maintenance tick average target: `<= 40ms`
  - schedule adherence: `>= 99.5%` of ticks start within 2x configured interval
- Runtime resource budgets (starting guardrails):
  - API CPU: alert when sustained `> 70%` for 10 minutes
  - API memory: alert when sustained `> 75%` limit for 10 minutes
  - Worker CPU: alert when sustained `> 70%` for 10 minutes
  - Worker memory: alert when sustained `> 75%` limit for 10 minutes

### Validation Plan for Next Pass

- Re-run `bun run profile:api` with authenticated requests (`PROFILE_AUTH_TOKEN`, `PROFILE_ORG_ID`).
- Capture per-endpoint p95/p99 on representative endpoints (`/v1/reports`, detail, create/update flows).
- Confirm SLOs against realistic traffic mix, then tighten targets before Phase 6 go-live.
