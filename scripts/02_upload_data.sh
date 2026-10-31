#!/usr/bin/env bash
# Step 2: Upload COVID dataset to HDFS
set -e
cd "$(dirname "$0")/.."

if [ ! -f data/owid-covid-data.csv ]; then
  echo "==> data/owid-covid-data.csv not found, generating sample dataset..."
  python3 data/generate_sample.py
fi

echo "==> Creating HDFS directory /covid19/input ..."
docker exec namenode hdfs dfs -mkdir -p /covid19/input
docker exec namenode hdfs dfs -mkdir -p /covid19/output

echo "==> Uploading owid-covid-data.csv to HDFS..."
docker exec namenode hdfs dfs -put -f /data/owid-covid-data.csv /covid19/input/

echo "==> Verifying upload..."
docker exec namenode hdfs dfs -ls /covid19/input/

echo "Done."
