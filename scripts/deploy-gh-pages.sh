#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMIT_MSG="${1:-chore: rebuild gh-pages}"

cd "$ROOT_DIR"

# Ensure we're on gh-pages
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "gh-pages" ]]; then
  echo "Switching to gh-pages..."
  git fetch origin gh-pages
  git checkout gh-pages
  git pull origin gh-pages
fi

# Build
echo "Building..."
npm run build:gh-pages

# Commit and push
if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git commit -m "$COMMIT_MSG"
  git push origin gh-pages
  echo "Deployed to gh-pages."
else
  echo "No changes to deploy."
fi
