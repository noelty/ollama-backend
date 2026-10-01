#!/usr/bin/env bash
set -euo pipefail

export TYPESENSE_API_KEY="${TYPESENSE_API_KEY:-xyz}"
DATA_DIR="$(pwd)/typesense-data"

mkdir -p "$DATA_DIR"

docker run -p 8108:8108 \
  -v "$DATA_DIR":/data typesense/typesense:30.2 \
  --data-dir /data \
  --api-key="$TYPESENSE_API_KEY" \
  --enable-cors