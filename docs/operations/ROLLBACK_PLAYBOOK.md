# Rollback Playbook

Use this playbook when launch health gates fail or a Sev-1/Sev-2 incident is declared.

## Trigger Conditions

- Sustained API 5xx/error-rate breach over 10 minutes.
- Core flows fail (auth, report create/read, org flows).
- Data integrity issue after migration.
- Critical latency/SLO breach with customer impact.

## Owners

- Incident commander:
- Rollback executor:
- DB rollback owner:
- Communications owner:

## Rollback Procedure

1. Freeze deploys and announce rollback start.
2. Roll back API, worker, and web to previous known-good artifacts.
3. Apply DB rollback/mitigation plan (or restore point-in-time snapshot).
4. Validate health checks:
   - `/healthz`
   - `/readyz`
5. Validate critical user journeys:
   - sign in/sign out
   - org select
   - report list/detail
6. Re-enable traffic.
7. Announce rollback completion and impact summary.

## Exit Criteria

- All health/readiness checks pass.
- Error rate and p95 latency normalize.
- Core flows verified by QA/engineering.

## Post-Rollback Actions

- Open incident record and attach timeline.
- Capture root cause and remediation actions.
- Define re-release criteria and approval gate.
