# @spotting/sdk-js

Browser capture SDK for Spotting embeds and the Chrome extension.

## Docs

- [Capture pipeline spec](../../docs/specs/capture-pipeline.md) — architecture + W3C/browser API provenance
- [Capture embed guide](../../docs/capture-embed.md) — integration snippet
- [Capture key migration](../../docs/ops/capture-key-migration.md) — production `crk_*` → `spk_*`

## Build

```bash
npm run build -w @spotting/sdk-js
```

## Usage

```ts
import { init } from "@spotting/sdk-js";

init({
  publicKey: "spk_live_…",
  apiBaseUrl: "https://api-spotting.example.com",
});
```

New integrations must use **`spk_` keys only**.
