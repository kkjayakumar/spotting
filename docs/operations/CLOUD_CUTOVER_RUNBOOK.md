# Cloud Go-Live Cutover Runbook

This runbook is executed only with production cloud access.

## Preconditions

- Go-live checklist approved.
- Rollback playbook reviewed.
- Dry-run and launch rehearsal signed off.
- SLO dashboards and alert routing live.

## Cutover Steps

1. Enable release window and freeze unrelated deploys.
2. Apply infra/app config updates for production.
3. Deploy API + worker + web artifacts.
4. Run migration plan.
5. Switch traffic to new release.
6. Run smoke checks and SLO validation.
7. Announce go-live completion.

## Abort / Rollback Conditions

- Any Sev-1 incident during cutover.
- Sustained error/latency breach.
- Data integrity risk detected.

## Evidence to Capture

- Deployment logs
- Health/readiness screenshots
- Alert dashboard snapshots
- Smoke-check results
