#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/openapi"

mkdir -p "$OUT_DIR"

(
  cd "$ROOT_DIR/backend"
  python manage.py spectacular --format openapi-json --file "$OUT_DIR/openapi.json"
)

echo "OpenAPI schema exported to: $OUT_DIR/openapi.json"

