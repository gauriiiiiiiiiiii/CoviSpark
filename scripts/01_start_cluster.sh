#!/usr/bin/env bash
# Step 1: Start the Hadoop + Spark cluster via Docker Compose
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "==> Starting Hadoop + Spark cluster..."
docker-compose up -d

echo "==> Waiting for NameNode to be ready (up to 60s)..."
for i in $(seq 1 30); do
  if docker exec namenode hdfs dfsadmin -report &>/dev/null; then
    echo "    NameNode ready."
    break
  fi
  sleep 2
done

echo ""
echo "Cluster UIs:"
echo "  HDFS NameNode   : http://localhost:9870"
echo "  YARN            : http://localhost:8088"
echo "  Spark Master    : http://localhost:8080"
echo "  Dashboard       : http://localhost:5000  (after step 4)"
