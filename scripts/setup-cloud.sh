#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/ua-conneckit"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "ua-conneckit/package.json not found. Run from repository root."
  exit 1
fi

echo "Installing ua-conneckit dependencies..."
npm --prefix "$APP_DIR" install --no-package-lock
echo "ua-conneckit dependencies installed."
