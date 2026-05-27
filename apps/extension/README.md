# Spotting Capture — Chrome Extension

Inject the Spotting bug-reporter widget into **any** site without touching that site's code. Useful for QA testers and third-party testing.

## Architecture

| File | Role |
|---|---|
| `src/background.ts` | MV3 service-worker (placeholder for future badge / context-menu logic) |
| `src/content.ts` | Injected into every page; listens for `SPOTTING_MOUNT` / `SPOTTING_UNMOUNT` messages from the popup and calls `init()` / `destroy()` from `@spotting/sdk-js` |
| `src/popup/popup.ts` + `popup.html` | Extension popup: save API base URL + public key to `chrome.storage.sync`, inject or remove the widget |

## Build

From the monorepo root:

```bash
npm run build:extension
# Builds @spotting/sdk-js first, then the extension → apps/extension/dist/
```

Or from this directory:

```bash
npm run build       # one-off build
npm run dev         # watch mode (re-builds on file change)
```

## Load in Chrome (Developer Mode)

1. Run `npm run build:extension` from the repo root.
2. Open **`chrome://extensions`**.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** → select `apps/extension/dist/`.
5. Pin the **Spotting Capture** extension from the puzzle-piece toolbar menu.

## Usage

1. Open any HTTP/HTTPS tab.
2. Click the **Spotting Capture** icon.
3. Enter your **API base URL** (e.g. `http://localhost:3000`) and **Public key** (starts with `spk_live_`).
4. Click **Save settings** to persist across sessions.
5. Click **Inject widget on this tab** — the floating Spotting button will appear on the page.
6. Click **Remove widget** to tear it down.

> **Note:** The content script is injected at `document_idle` on all pages but stays idle until it receives a message from the popup.

## Public key prefix

Keys are issued by the API as `spk_live_<uuid>`. Copy them from **Dashboard → Settings → Capture Keys**.

**New setups must use `spk_` keys only.** Legacy `crk_*` keys are not accepted in the extension UI. If you migrated from an older deployment, run the [capture key migration](../../docs/ops/capture-key-migration.md) and paste the updated `spk_*` token.

See also [Capture pipeline spec](../../docs/specs/capture-pipeline.md).
