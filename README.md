# CoviSpark

COVID-19 big data analysis with Hadoop MapReduce, Spark, and a Flask dashboard. Course project for CSBB 422 — Big Data Analytics.

Runs five Spark jobs plus a MapReduce job over COVID-19 data and serves the results through a web dashboard.

## What it does

- MapReduce on Hadoop Streaming: aggregates total cases and deaths per country
- Spark job 1: top 10 countries by total cases
- Spark job 2: continent-wise totals
- Spark job 3: global daily wave with 7-day rolling average
- Spark job 4: case-fatality rate by country
- Spark job 5: vaccination progress by country
- Flask dashboard with six views

## Stack

Hadoop 3.2.1 (HDFS + YARN), Spark 3.5, Flask, Chart.js. Dataset is in Our World in Data format; if `data/owid-covid-data.csv` is missing, a sample is generated locally so you don't need internet.

## Run locally (no Docker)

You need Python 3 and Java (tested with Java 21).

```bash
pip3 install pyspark flask pandas
bash scripts/05_run_local.sh
# Open http://localhost:5000
```

The script generates the sample dataset if needed, runs the Spark jobs, runs MapReduce through pipes, then starts the dashboard. It writes everything to `results/`.

## Run with Docker

```bash
bash run_all.sh
# Open http://localhost:5000
```

This starts the whole cluster (NameNode, 2 DataNodes, ResourceManager, 2 NodeManagers, Spark master + 2 workers, dashboard), uploads the data to HDFS, runs MapReduce and Spark, and serves the dashboard. Give Docker at least 4 GB of memory.

## What I actually got when running it

Ran the local pipeline on a generated sample of 25 countries from 2020-01-22 to 2023-12-31 (36,000 rows):

- MapReduce → `results/mapreduce_output.csv`: 25 countries
- Spark job 1 → `results/top10_countries.json`: 10 countries
- Spark job 2 → `results/continent_totals.json`: 6 continents
- Spark job 3 → `results/global_wave.json`: 1,440 daily points
- Spark job 4 → `results/cfr_by_country.json`: 15 countries
- Spark job 5 → `results/vaccination_progress.json`: 15 countries

All dashboard API endpoints return 200: `/api/status`, `/api/summary`, `/api/countries`, `/api/top10`, `/api/continents`, `/api/wave`, `/api/cfr`, `/api/vaccination`.

## Project layout

```
config/       Hadoop XML configs (core, hdfs, mapred, yarn)
dashboard/    Flask app + templates + static (CSS, JS, Chart.js)
data/         dataset + sample generator
hadoop/       NodeManager Docker image (needs python3 for streaming)
mapreduce/    mapper.py + reducer.py
scripts/      01-05 run steps
spark/        covid_analysis.py (5 PySpark jobs)
documentation/ project report (PDF) and slides (PPTX)
run_all.sh    one-command Docker runner
```

## Cluster web UIs (Docker mode)

| UI | URL |
|----|-----|
| HDFS NameNode | http://localhost:9870 |
| YARN ResourceManager | http://localhost:8088 |
| Spark Master | http://localhost:8080 |
| Dashboard | http://localhost:5000 |

## Notes

- `data/owid-covid-data.csv` and `results/*` are gitignored; they're generated when you run the project.
- On macOS, port 5000 is sometimes taken by AirPlay Receiver. If the dashboard won't start, disable that or run on another port.
- The NodeManager image installs python3 from archive.debian.org because its base image is Debian 9.
- Spark prints a bunch of WARN logs about window partitioning and native hadoop; that's normal, the jobs still finish.
