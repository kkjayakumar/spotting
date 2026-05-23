#!/bin/sh
set -eu

echo "[spotting-api] applying database schema"
bun --cwd apps/api db:push

echo "[spotting-api] starting server"
exec bun run apps/api/src/index.ts
