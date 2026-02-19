#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/wube/factorio-data.git"
TARGET_DIR="factorio-data"

if [ -d "$TARGET_DIR" ]; then
  echo "factorio-data/ already exists, skipping clone."
  echo "Delete it and re-run to refresh."
  exit 0
fi

echo "Shallow-cloning wube/factorio-data..."
git clone --depth 1 "$REPO_URL" "$TARGET_DIR"
echo "Done. Data available at $TARGET_DIR/"
