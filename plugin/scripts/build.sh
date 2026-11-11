#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"

rm -rf "$dist_root"
mkdir -p "$dist_root/server" "$dist_root/.openai"
"$project_root/node_modules/esbuild/bin/esbuild" "$project_root/worker/index.js" --bundle --format=esm --platform=browser --outfile="$dist_root/server/index.js"
cp "$project_root/.openai/hosting.json" "$dist_root/.openai/hosting.json"

echo "Built $dist_root"
