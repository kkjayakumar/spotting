#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist-targets/safari"
OUTPUT_DIR="${ROOT_DIR}/dist-safari"
APP_NAME="${APP_NAME:-SpottingExtension}"
BUNDLE_ID="${BUNDLE_ID:-dev.spotting.extension}"

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun is required (macOS + Xcode)."
  exit 1
fi

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Missing ${DIST_DIR}. Run: npm run build:safari -w @spotting/extension"
  exit 1
fi

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

xcrun safari-web-extension-converter \
  "${DIST_DIR}" \
  --project-location "${OUTPUT_DIR}" \
  --app-name "${APP_NAME}" \
  --bundle-identifier "${BUNDLE_ID}" \
  --copy-resources \
  --force

echo "Safari project created at ${OUTPUT_DIR}/${APP_NAME}"
echo "Open the Xcode project, set signing, then archive for App Store/TestFlight."
