# Go-Live Deployment Checklist

Use this checklist for production launch approval and execution.

## Release Metadata

- Release version:
- Release date/time (UTC):
- Release manager:
- Incident commander:
- On-call engineer:
- Rollback owner:

## 1) Pre-Go-Live Validation

- [ ] Main branch is green in CI (`lint`, `check-types`, `test`, `build`).
- [ ] No unresolved Sev-1/Sev-2 defects in launch scope.
- [ ] Production environment variables are set and validated.
- [ ] Database migration plan reviewed (forward and rollback path documented).
- [ ] Backup snapshot completed immediately before deployment.
- [ ] API health and readiness checks pass in current prod.
- [ ] Monitoring dashboards and alert channels are live.
- [ ] On-call rotation and escalation contacts are confirmed.

## 2) Go/No-Go Decision Gate

All items below must be true for **GO**:

- [ ] SLO risk accepted by engineering lead.
- [ ] Product owner approves launch scope.
- [ ] Support/operations aware of release window.
- [ ] Rollback command/path tested in staging-like environment.
- [ ] Communication template prepared for launch status updates.

Decision:
- [ ] GO
- [ ] NO-GO
- Decision timestamp (UTC):
- Decision approvers:

## 3) Deployment Execution Steps

1. [ ] Announce deployment start in ops channel.
2. [ ] Enable maintenance/release mode if required.
3. [ ] Deploy API service artifacts.
4. [ ] Apply DB migrations (if any).
5. [ ] Deploy worker artifacts.
6. [ ] Deploy web artifacts.
7. [ ] Run post-deploy smoke checks:
   - [ ] `GET /healthz` returns OK
   - [ ] `GET /readyz` returns READY
   - [ ] Auth flow (sign-in/sign-out) works
   - [ ] Org/report critical flow works
8. [ ] Announce deployment completion.

## 4) Rollback Triggers and Procedure

Rollback immediately if any condition occurs:

- [ ] Sustained 5xx rate above threshold for 10+ minutes.
- [ ] Core flow failure (auth/report create/report read) persists.
- [ ] Migration-related data integrity issue detected.
- [ ] Sev-1 incident declared by incident commander.

Rollback steps:

1. [ ] Announce rollback start.
2. [ ] Roll back app services to previous known-good release.
3. [ ] Execute DB rollback or mitigation plan.
4. [ ] Validate health/readiness and core user flows.
5. [ ] Announce rollback completion and incident status.

## 5) Post-Launch Validation (First 60 Minutes)

- [ ] Error budget burn rate within acceptable range.
- [ ] API latency (p95/p99) within defined SLO thresholds.
- [ ] Worker processing latency within threshold.
- [ ] No alert storms or paging loops.
- [ ] Customer-facing smoke checks still pass.

## 6) Sign-Off

- [ ] Engineering sign-off
- [ ] Product sign-off
- [ ] Operations sign-off
- [ ] Security sign-off (if applicable)

Final status:
- [ ] Launch successful
- [ ] Launch partial (follow-up required)
- [ ] Launch rolled back

Notes / follow-up actions:
- 
