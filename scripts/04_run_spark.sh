#!/usr/bin/env bash
# Step 4: Run PySpark analysis jobs (5 analyses)
set -e

echo "==> Submitting PySpark job to Spark cluster..."
docker exec \
  -e "COVID_DATA=/data/owid-covid-data.csv" \
  -e "COVID_RESULTS=/results" \
  spark-master spark-submit \
  --master spark://spark-master:7077 \
  --deploy-mode client \
  --executor-memory 1G \
  --executor-cores 2 \
  --conf "spark.sql.shuffle.partitions=4" \
  --conf "spark.jars.ivy=/tmp/.ivy2" \
  /spark/covid_analysis.py

echo ""
echo "==> Spark jobs complete. Results:"
ls -lh /results/*.json 2>/dev/null || docker exec spark-master ls -lh /results/
