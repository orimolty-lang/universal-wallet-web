#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/ua-conneckit"
OUT_DIR="$APP_DIR/out"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "ua-conneckit/package.json not found. Run from repository root."
  exit 1
fi

# Public Particle config defaults used by this app in production.
export NEXT_PUBLIC_PROJECT_ID="${NEXT_PUBLIC_PROJECT_ID:-c0cb9e74-192b-4bdc-ba62-852775c6e7fd}"
export NEXT_PUBLIC_CLIENT_KEY="${NEXT_PUBLIC_CLIENT_KEY:-caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK}"
export NEXT_PUBLIC_APP_ID="${NEXT_PUBLIC_APP_ID:-e5be9376-1d3a-4882-b4a5-c5c0ce1b5182}"

if [[ ! -d "$APP_DIR/node_modules" ]]; then
  echo "node_modules missing; installing dependencies first..."
  npm --prefix "$APP_DIR" install --no-package-lock
fi

echo "Building static export for gh-pages..."
npm --prefix "$APP_DIR" run build

if [[ ! -d "$OUT_DIR" ]]; then
  echo "Build output directory not found: $OUT_DIR"
  exit 1
fi

echo "Copying exported files to repository root..."
cp -r "$OUT_DIR"/. "$ROOT_DIR"/
echo "Done. Commit and push changes on gh-pages branch."
