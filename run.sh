#!/usr/bin/env bash
# Run the tweb-login-clone dev server on a chosen port.
# Usage: ./run.sh [port]   (default: 5173)
# Ctrl-C to stop. No daemons, no systemctl.

set -euo pipefail

PORT="${1:-5173}"

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo "error: port must be an integer between 1 and 65535 (got: $PORT)" >&2
  exit 1
fi

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "node_modules missing — installing…"
  npm install
fi

if [ ! -f data/geoip-country.mmdb ]; then
  echo "GeoIP database missing — downloading DB-IP Country Lite…"
  node scripts/download-geoip.mjs
fi

echo "Starting dev server on http://localhost:$PORT"
exec npm run dev -- --port "$PORT" --strictPort
