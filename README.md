# CoviSpark

Distributed COVID-19 data analysis using **Apache Hadoop MapReduce** and **Apache Spark**, with a **Flask** web dashboard.

**Course:** CSBB 422 — Big Data Analytics

---

## What it does

- **MapReduce** (Hadoop Streaming on YARN) — country-wise total cases & deaths aggregation
- **Spark Job 1** — Top 10 countries by total cases
- **Spark Job 2** — Continent-wise case distribution
- **Spark Job 3** — Global infection wave (7-day rolling average)
- **Spark Job 4** — Case-fatality rate (CFR) by country
- **Spark Job 5** — Vaccination progress by country

---

## Stack

| Layer | Technology |
|-------|-----------|
| Storage | HDFS (Hadoop 3.2.1), replication factor 2 |
| Processing | Hadoop MapReduce on YARN + Apache Spark 3.5 |
| Cluster | Docker Compose — NameNode + 2 DataNodes, ResourceManager + 2 NodeManagers, Spark master + 2 workers, dashboard |
| Dashboard | Flask API + HTML/CSS/JS, Chart.js (bundled) |
| Dataset | Our World in Data COVID-19 CSV format (sample generated if missing) |

---

## Run (Local — No Docker)

Needs Python 3 and Java 17 or 21.

```bash
pip3 install pyspark flask pandas
bash scripts/05_run_local.sh
# Open http://localhost:5000
```

## Run (Docker Cluster)

```bash
bash run_all.sh            # starts the cluster, uploads data, runs MapReduce and Spark
# Open http://localhost:5000
```

`run_all.sh` starts all 10 containers with `docker-compose up -d`, generates the sample
dataset if `data/owid-covid-data.csv` is missing, and runs `scripts/01` to `04` in order.
Give Docker at least 4 GB of memory.

## Dashboard

Six views: **Overview** (KPIs, infection wave, top 10, continents), **Countries**
(searchable, sortable MapReduce output), **Infection wave** (daily series with year filters),
**Case fatality**, **Vaccination**, and **Pipeline** (status of every job output and links to
the cluster UIs). Light and dark themes; works on narrow screens.

---

## Web UIs

| UI | URL |
|----|-----|
| HDFS NameNode | http://localhost:9870 |
| YARN ResourceManager | http://localhost:8088 |
| Spark Master | http://localhost:8080 |
| Dashboard | http://localhost:5000 |

---

## Project Structure

```
CoviSpark/
├── config/          # Hadoop XML configs (HDFS, YARN, MapReduce)
├── hadoop/          # NodeManager image with python3 for Hadoop Streaming
├── mapreduce/       # mapper.py + reducer.py
├── spark/           # covid_analysis.py (5 PySpark jobs)
├── dashboard/       # Flask API + templates/ + static/ (CSS, JS, Chart.js)
├── data/            # Dataset + sample generator
├── scripts/         # Step-by-step run scripts
├── documentation/   # Project report (PDF) and presentation (PPTX)
└── run_all.sh       # One-command runner
```
