# Safari extension release checklist

Use this checklist after generating Safari artifacts from CI or local build.

## Inputs

- Repo checkout at release tag
- Built Safari extension bundle (`npm run build:safari -w @spotting/extension`)
- macOS machine with Xcode installed
- Apple Developer account and signing credentials

## Steps

1. Build and package Safari target:
   - `npm run build:safari -w @spotting/extension`
   - `npm run package:safari -w @spotting/extension`
2. Convert WebExtension on macOS:
   - `BUNDLE_ID=dev.spotting.extension APP_NAME=SpottingExtension npm run safari:convert -w @spotting/extension`
3. Open generated Xcode project under `apps/extension/dist-safari/`.
4. Configure signing:
   - Team
   - Bundle Identifier
   - Provisioning profile
5. Validate extension permissions and host access.
6. Archive and export build via Xcode Organizer.
7. Upload to App Store Connect/TestFlight.
8. Smoke test:
   - Popup settings save
   - Screenshot capture
   - Recording fallback behavior
   - Report submit flow

## Notes

- Safari does not use Chrome `tabCapture`; recording uses fallback capture path.
- The CI Safari artifact is unsigned and not store-ready by itself.
