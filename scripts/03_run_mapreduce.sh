#!/usr/bin/env bash
# Step 3: Run Hadoop Streaming MapReduce job (country-wise aggregation)
set -e

echo "==> Removing old MapReduce output (if any)..."
docker exec namenode hdfs dfs -rm -r -f /covid19/output/mapreduce/ || true

echo "==> Submitting Hadoop Streaming MapReduce job..."
docker exec namenode hadoop jar \
  /opt/hadoop-3.2.1/share/hadoop/tools/lib/hadoop-streaming-3.2.1.jar \
  -files /mapreduce/mapper.py,/mapreduce/reducer.py \
  -mapper  "python3 mapper.py" \
  -reducer "python3 reducer.py" \
  -input   /covid19/input/owid-covid-data.csv \
  -output  /covid19/output/mapreduce/

echo "==> MapReduce job complete. Fetching results..."
docker exec namenode hdfs dfs -cat /covid19/output/mapreduce/part-00000 | head -20

echo "==> Copying results to local /results/ ..."
docker exec namenode hdfs dfs -getmerge /covid19/output/mapreduce/ /results/mapreduce_output.csv
echo "Done. Results at results/mapreduce_output.csv"
