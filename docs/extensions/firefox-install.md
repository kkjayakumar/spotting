# Firefox extension — permanent install

## Download from Spotting

1. Sign in to the Spotting dashboard.
2. Go to **Settings → Browser extension**.
3. Click **Download Firefox extension (XPI)**.

Or build locally:

```bash
npm run build:firefox -w @spotting/extension
npm run package:firefox -w @spotting/extension
```

Artifact: `apps/extension/dist-packages/spotting-extension-firefox.xpi`

## Permanent install (production)

Firefox only keeps extensions permanently if they are **Mozilla-signed**.

### Option A — Firefox Add-ons (AMO) listing

Best for customers (one-click install, like Chrome Web Store):

1. Create a developer account at [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/).
2. Submit the XPI for review.
3. After approval, share the AMO link (set `NEXT_PUBLIC_FIREFOX_EXTENSION_STORE_URL` in web `.env`).

### Option B — Signed self-distribution (unlisted)

For private teams without a public listing:

1. Upload the XPI to the Developer Hub for **signing** (not public listing).
2. Download the signed XPI returned by Mozilla.
3. Host it on your server or distribute the file.
4. Users install: `about:addons` → ⚙ → **Install Add-on From File…** → select signed `.xpi`.

The install persists across Firefox restarts (unlike temporary debugging).

### Option C — Enterprise (managed devices)

Use [Firefox enterprise policies](https://mozilla.github.io/policy-templates/) with `ExtensionsInstallForcelist` and a signed extension ID (`extension@spotting.dev`).

## Temporary install (development / QA)

For local testing only (removed when Firefox restarts):

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Select `apps/extension/dist-targets/firefox/manifest.json`

Rebuild after code changes and reload the temporary add-on.

## AMO manifest notes

The Firefox package declares:

- `background.service_worker` **and** `background.scripts` (Mozilla requires both for MV3)
- `browser_specific_settings.gecko.data_collection_permissions` — `websiteActivity` and `websiteContent` are listed because console/network capture and report media are sent to **your** Spotting API when the user submits a report (not to Mozilla)

Rebuild after manifest changes:

```bash
npm run build:firefox -w @spotting/extension
npm run package:firefox -w @spotting/extension
```

## Configure the extension

In the Spotting popup on any `http://` or `https://` page:

- **API URL** — your Spotting API (e.g. `https://api-spotting.yourdomain.com`)
- **Dashboard URL** — web app URL
- **Public key** — `spk_…` from Settings → Public Keys

Reload the website tab after installing or updating the extension.
