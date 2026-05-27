# Capture key migration (`crk_*` → `spk_*`)

Operational runbook for retiring legacy capture key prefixes in production.

---

## Pre-flight

1. New integrations use **`spk_` only** ([docs/clean-room-policy.md](../clean-room-policy.md)).
2. Back up the production database.
3. Dry run:

```bash
npm run migrate:capture-keys -w @spotting/api -- --dry-run
```

---

## Production migration

```bash
npm run migrate:capture-keys -w @spotting/api
```

Inside Docker:

```bash
docker compose exec api npm run migrate:capture-keys -w @spotting/api
```

Rewrites each `capture_public_keys.token` from `crk_…` → `spk_…`.

---

## Post-migration

1. Update embeds/extensions with migrated keys from Dashboard → Capture Keys.
2. Set `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=false` on API containers and redeploy.
3. Smoke test extension → capture → dashboard.

Rollback: restore DB backup; set `SPOTTING_ACCEPT_LEGACY_CRK_KEYS=true`.
