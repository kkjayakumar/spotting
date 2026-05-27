# Spotting capture embed

Spotting ships a browser SDK and public capture API for third-party sites and the Chrome extension.

## Components

- **`packages/sdk-js`**: screen recording, screenshots, console/network capture, shadow-DOM widget, uploads via **public capture key** (`spk_live_…`).
- **`apps/extension`**: injects the SDK on any tab for QA workflows.
- **API**: `POST /v1/capture/*` routes authenticate with `Authorization: Bearer spk_…`. Legacy `crk_…` is accepted on the API only during migration ([migration runbook](./ops/capture-key-migration.md)).

## Issue a capture key

Dashboard → Settings → Public Keys → Create key.

Response includes a full token (e.g. `spk_live_…`). Store it for the embed or extension. Empty **allowed origins** = allow any origin.

## Embed on a site

```html
<script src="https://YOUR_CDN/spotting-capture.global.js"></script>
<script>
  SpottingCapture.init({
    publicKey: "spk_live_…",
    apiBaseUrl: "https://api-spotting.example.com",
    dashboardUrl: "https://spotting.example.com",
  });
</script>
```

## NPM / bundler

```ts
import { init } from "@spotting/sdk-js";

init({
  publicKey: "spk_live_…",
  apiBaseUrl: "https://api-spotting.example.com",
});
```

See [docs/clean-room-policy.md](./clean-room-policy.md) for contribution rules and [docs/specs/capture-pipeline.md](./specs/capture-pipeline.md) for capture provenance.
