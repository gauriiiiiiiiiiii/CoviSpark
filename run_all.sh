#!/usr/bin/env bash
# One-command runner for the complete project (Docker cluster mode)
set -e
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════════════╗"
echo "║   COVID-19 Big Data Analysis — CSBB 422          ║"
echo "╚══════════════════════════════════════════════════╝"

bash scripts/01_start_cluster.sh
bash scripts/02_upload_data.sh
bash scripts/03_run_mapreduce.sh
bash scripts/04_run_spark.sh

echo ""
echo "All steps complete."
echo "Open dashboard: http://localhost:5000"
