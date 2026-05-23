# MVP API List (v1)

## Auth
- POST /v1/auth/signup
- POST /v1/auth/signin
- POST /v1/auth/refresh
- POST /v1/auth/signout
- GET /v1/auth/me

## Organizations
- POST /v1/orgs
- GET /v1/orgs
- POST /v1/orgs/{orgId}/switch
- GET /v1/orgs/{orgId}/members
- POST /v1/orgs/{orgId}/invites
- GET /v1/orgs/{orgId}/invites
- POST /v1/orgs/invites/{inviteId}/accept
- POST /v1/orgs/invites/{inviteId}/reject
- DELETE /v1/orgs/invites/{inviteId}

## Reports
- POST /v1/reports/upload-sessions
- POST /v1/reports/upload-sessions/{sessionId}/finalize
- GET /v1/reports
- GET /v1/reports/{reportId}
- PATCH /v1/reports/{reportId}
- GET /v1/reports/{reportId}/share

## Health
- GET /healthz
- GET /readyz
