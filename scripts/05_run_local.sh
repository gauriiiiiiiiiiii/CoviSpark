#!/usr/bin/env bash
# Run everything locally (no Docker needed) — for quick demo / testing
# Requires: python3, pyspark, flask installed
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== COVID-19 Analysis — Local Mode ==="

# 1. Generate sample data if not present
if [ ! -f data/owid-covid-data.csv ]; then
  echo "[1/3] Generating sample dataset..."
  python3 data/generate_sample.py
else
  echo "[1/3] Dataset exists ($(wc -l < data/owid-covid-data.csv) rows)"
fi

# 2. Run Spark analysis
echo "[2/3] Running PySpark analysis jobs..."
export COVID_DATA="$SCRIPT_DIR/data/owid-covid-data.csv"
export COVID_RESULTS="$SCRIPT_DIR/results"
python3 spark/covid_analysis.py

# 3. Test MapReduce locally (using Unix pipes)
echo "[3/3] Testing MapReduce locally (pipe mode)..."
python3 mapreduce/mapper.py < data/owid-covid-data.csv | sort | python3 mapreduce/reducer.py > results/mapreduce_output.csv
echo "    MapReduce output: $(wc -l < results/mapreduce_output.csv) rows"

echo ""
echo "=== All done! Starting dashboard at http://localhost:5000 ==="
export COVID_RESULTS="$SCRIPT_DIR/results"
python3 dashboard/app.py
