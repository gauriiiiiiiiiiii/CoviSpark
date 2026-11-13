# CoviSpark

CSBB 422 — Big Data Analytics course project. COVID-19 data analysis with Hadoop MapReduce, Apache Spark, and a Flask dashboard.

This was my final project for the big data class. It runs a MapReduce job plus five Spark analysis jobs over COVID-19 data, then shows everything in a web dashboard.

## What it does

- MapReduce (Hadoop Streaming): totals up cases and deaths per country
- Spark job 1: top 10 countries by total cases
- Spark job 2: cases and deaths by continent
- Spark job 3: global daily infection wave with a 7-day rolling average
- Spark job 4: case-fatality rate by country
- Spark job 5: vaccination progress by country
- Flask dashboard: six pages to look at all the results

## Stack

Hadoop 3.2.1 on Docker (HDFS + YARN), Spark 3.5, Flask, Chart.js. The dataset is in Our World in Data format. If `data/owid-covid-data.csv` isn't there, `data/generate_sample.py` makes a fake one so you can run everything offline.

## How to run

**Without Docker** (easiest way to try it):

```bash
pip3 install pyspark flask pandas
bash scripts/05_run_local.sh
```

Then go to `http://localhost:5000`.

The local script:
1. Makes the sample dataset if it's missing
2. Runs the five Spark jobs (writes JSON to `results/`)
3. Runs MapReduce through pipes (writes `results/mapreduce_output.csv`)
4. Starts the Flask dashboard

**With Docker:**

```bash
bash run_all.sh
```

This starts the whole cluster — NameNode, 2 DataNodes, ResourceManager, 2 NodeManagers, Spark master + 2 workers, and the dashboard. Uploads data to HDFS, runs MapReduce and Spark, then serves the dashboard. You'll want at least 4 GB of memory for Docker.

## What I got when I ran it

I tested the local pipeline on a generated sample of 25 countries from 2020-01-22 to 2023-12-31 (36,000 rows):

- MapReduce → 25 countries
- Spark job 1 → 10 countries
- Spark job 2 → 6 continents
- Spark job 3 → 1,440 daily points
- Spark job 4 → 15 countries
- Spark job 5 → 15 countries

All dashboard APIs return 200: `/api/status`, `/api/summary`, `/api/countries`, `/api/top10`, `/api/continents`, `/api/wave`, `/api/cfr`, `/api/vaccination`.

## Files

```
config/       Hadoop XML configs
dashboard/    Flask app, HTML templates, CSS, JS
data/         dataset + sample generator
hadoop/       NodeManager Docker image (installs python3 for streaming)
mapreduce/    mapper.py + reducer.py
scripts/      01_start_cluster.sh ... 05_run_local.sh
spark/        covid_analysis.py (5 PySpark jobs)
documentation/ project report PDF and slides
run_all.sh    one-command Docker runner
results/      generated outputs (gitignored)
```

## Cluster web UIs (Docker mode)

| UI | URL |
|----|-----|
| HDFS NameNode | http://localhost:9870 |
| YARN ResourceManager | http://localhost:8088 |
| Spark Master | http://localhost:8080 |
| Dashboard | http://localhost:5000 |

## Notes

- `data/owid-covid-data.csv` and `results/*` are gitignored, they get created when you run it.
- On my Mac, port 5000 was taken by AirPlay Receiver, so the dashboard wouldn't start until I turned that off.
- The NodeManager image installs python3 from archive.debian.org because its base image is Debian 9.
- Spark prints lots of WARN logs about window partitioning and native hadoop libraries. That's normal, the jobs still finish.

## Report

The full project report (PDF) and presentation slides (PPTX) are in `documentation/`.
