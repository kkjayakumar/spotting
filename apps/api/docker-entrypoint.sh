#!/bin/sh
set -eu

echo "[spotting-api] applying database schema"
npm run db:push -w @spotting/api

echo "[spotting-api] starting server"
exec npm run start -w @spotting/api
