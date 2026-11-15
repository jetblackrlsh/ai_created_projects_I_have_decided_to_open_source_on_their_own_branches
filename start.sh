#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "Starting Mechanized Magic Card Maker on http://localhost:$PORT"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
