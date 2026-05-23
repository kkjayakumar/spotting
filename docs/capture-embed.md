# Embeddable capture (SDK + public API)

## Overview

- **`packages/sdk-js`**: browser SDK with screen recording, optional screenshot (via `getDisplayMedia`), `fetch` / `XHR` interception, `console` wrapping, shadow-DOM widget, and upload to the API using a **public capture key** (`crk_…`).
- **`apps/extension`**: Chrome MV3 extension that injects the same widget on any `http(s)` tab after you save API URL + key in the popup.
- **API**: `POST /v1/capture/*` routes authenticate with `Authorization: Bearer crk_…` and CORS `origin: *` for browser embeds.

## Database

After pulling schema changes, apply migrations:

```bash
bun run db:generate
bun run db:push
```

## Issue a capture key (authenticated)

As an **owner** or **admin** of an organization:

```http
POST /v1/orgs/:orgId/capture-keys
Authorization: Bearer <session token>
```

Response includes a full `token` (e.g. `crk_live_…`). Store it for the embed or extension. New keys default to **empty `allowedOrigins`** = allow any origin (tighten in DB / future admin UI by setting a JSON array of origins).

## Script tag (IIFE bundle)

Build the SDK:

```bash
bun run --filter=@spotting/sdk-js build
```

Host or reference `packages/sdk-js/dist/spotting-capture.global.js` and:

```html
<script src="https://your-cdn/spotting-capture.global.js"></script>
<script>
  SpottingCapture.init({
    publicKey: "crk_live_…",
    apiBaseUrl: "https://api.example.com",
    buttonLabel: "Report bug",
  });
</script>
```

## Module bundlers

```ts
import { init } from "@spotting/sdk-js";

init({ publicKey: "crk_live_…", apiBaseUrl: "http://localhost:3000" });
```

## Browser extension

```bash
bun run --filter=@spotting/sdk-js build
bun run --filter=@spotting/extension build
```

In Chrome: **Extensions → Developer mode → Load unpacked** → select `apps/extension/dist`.

Configure API base + public key in the popup, then **Inject widget on this tab**.

In local dev, **`http://localhost:3000`** (Hono) is the canonical API origin. If you point the popup at the **Next** URL instead (e.g. `http://localhost:3003`), `apps/web` rewrites **`/v1/*`** to Hono (`SPOTTING_API_INTERNAL_URL` or `NEXT_PUBLIC_API_URL`, default `127.0.0.1:3000`) so `POST /v1/capture/reports` still works after restarting `next dev`.

## Security notes

- Public keys are **secrets** for your org’s ingest; use HTTPS in production.
- Restrict `allowedOrigins` on keys once you have a stable host list.
- Embeds intercept global `fetch`, `XMLHttpRequest`, and `console`; load the SDK only on pages where that tradeoff is acceptable.
