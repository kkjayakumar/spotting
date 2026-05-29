# Extension browser support (clean-room spec)

## Scope

This spec defines browser support requirements for the Spotting extension with a strict clean-room implementation:

- Chrome (baseline)
- Firefox (WebExtension package)
- Safari (WebExtension bundle + Apple conversion/signing path)

No code from Crikket/Jam.dev/Marker.io or any closed third-party implementation may be used while implementing this spec.

## Feature parity matrix

| Capability | Chrome | Firefox | Safari |
|------------|--------|---------|--------|
| Popup configuration (API URL, dashboard URL, public key) | Yes | Yes | Yes |
| Project list and selected project persistence | Yes | Yes | Yes |
| Screenshot capture | Yes | Yes | Yes |
| Recording via extension tab-capture API | Yes (`tabCapture`) | No (fallback recorder) | No (fallback recorder) |
| Report submission (title + pending media) | Yes | Yes | Yes |
| Background API fetch proxy | Yes | Yes | Yes |

## Runtime requirements

1. One shared TS runtime in `apps/extension/src`.
2. Browser-specific APIs must go through a compatibility wrapper layer.
3. Missing APIs (for example `tabCapture`) must fail gracefully and fallback to SDK capture behavior.
4. The extension must not rely on browser-specific pages (`chrome://...`) in user-facing errors.

## Manifest requirements

1. A target-specific manifest is generated for `chrome`, `firefox`, `safari`.
2. Chrome target includes:
   - `tabCapture` permission
   - `content_scripts[0].world = "MAIN"`
3. Firefox and Safari targets exclude `tabCapture`.
4. Firefox target includes `browser_specific_settings.gecko`.

## Packaging requirements

1. Build commands:
   - `npm run build:chrome -w @spotting/extension`
   - `npm run build:firefox -w @spotting/extension`
   - `npm run build:safari -w @spotting/extension`
2. Package commands:
   - `npm run package:chrome -w @spotting/extension` -> `.zip`
   - `npm run package:firefox -w @spotting/extension` -> `.xpi`
   - `npm run package:safari -w @spotting/extension` -> `.zip`
3. CI release must publish all package artifacts.

## Safari distribution requirements

1. Safari WebExtension conversion is performed on macOS with Xcode via `xcrun safari-web-extension-converter`.
2. App ID, bundle ID, signing team, and provisioning are mandatory before App Store/TestFlight submission.
3. Linux/Windows CI provides unsigned Safari WebExtension artifacts only.

## Verification requirements

1. `npm run check-types -w @spotting/extension`
2. Build + package all browser targets.
3. Run clean-room compliance gate: `npm run check:lineage`.
