# SLO Dashboards and Alert Routing

## SLO Targets

- API availability: `99.9%`
- API p95 latency: `<= 120ms`
- API p99 latency: `<= 250ms`
- Worker maintenance tick p95: `<= 150ms`
- Worker average tick: `<= 40ms`

## Dashboard Panels

1. API request rate, error rate, latency (p50/p95/p99)
2. Endpoint-level latency + status distribution
3. Worker throughput, success/failure, tick duration
4. DB health (connections, query latency, error count)
5. Background job and upload-session finalization success rates

## Alert Rules

- API error rate breach:
  - condition: `> 1%` for 10 minutes
  - severity: high
- API latency breach:
  - condition: p95 `> 120ms` for 10 minutes
  - severity: medium/high
- Worker latency breach:
  - condition: p95 tick `> 150ms` for 10 minutes
  - severity: medium
- Readiness failures:
  - condition: repeated `/readyz` failures for 5 minutes
  - severity: high

## Alert Routing

- Sev-1/Sev-2 -> pager/on-call + incident channel
- Sev-3 -> ops channel + ticket queue
- Daily SLO summary -> engineering + product stakeholders

## Ownership

- Dashboard owner:
- Alert policy owner:
- On-call rotation owner:
