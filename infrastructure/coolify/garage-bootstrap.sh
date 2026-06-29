#!/usr/bin/env bash
# Run once after the first Garage deploy to create the access key and the four
# Planix buckets (ARCHITECTURE.md "Initial bucket setup").
set -euo pipefail

# Assign a layout zone/capacity to the single node, then apply (one-time).
NODE_ID="$(docker exec planix-garage garage node id -q | cut -d@ -f1)"
docker exec planix-garage garage layout assign -z dc1 -c 100G "${NODE_ID}"
docker exec planix-garage garage layout apply --version 1

docker exec planix-garage garage key create planix-key

for bucket in planix-attachments planix-reports planix-logos planix-photos; do
  docker exec planix-garage garage bucket create "${bucket}"
  docker exec planix-garage garage bucket allow "${bucket}" --read --write --key planix-key
done

echo "Garage bootstrap complete. Capture the planix-key access/secret with:"
echo "  docker exec planix-garage garage key info planix-key --show-secret"
