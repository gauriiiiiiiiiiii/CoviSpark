# CoviSpark

Distributed COVID-19 data analysis using **Apache Hadoop MapReduce** and **Apache Spark**, with a **Flask + Chart.js** dashboard.

**Course:** CSBB 422 — Big Data Analytics

---

## What it does

- **MapReduce** — country-wise total cases & deaths aggregation
- **Spark Job 1** — Top 10 countries by total cases
- **Spark Job 2** — Continent-wise case distribution
- **Spark Job 3** — Global infection wave (7-day rolling average)
- **Spark Job 4** — Case-fatality rate (CFR) by country
- **Spark Job 5** — Vaccination progress by country

---

## Stack

| Layer | Technology |
|-------|-----------|
| Storage | HDFS (Hadoop 3.2) |
| Processing | Hadoop MapReduce + Apache Spark 3.5 |
| Cluster | Docker Compose — 1 Master + 2 Workers |
| Dashboard | Flask + Chart.js |
| Dataset | Our World in Data — COVID-19 CSV |

---

## Run (Local — No Docker)

```bash
pip3 install pyspark flask pandas
bash scripts/05_run_local.sh
# Open http://localhost:5000
```

## Run (Docker Cluster)

```bash
docker-compose up -d       # starts NameNode, 2 DataNodes, Spark Master, 2 Workers, Dashboard
bash run_all.sh
# Open http://localhost:5000
```

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
covid19-analysis/
├── config/          # Hadoop XML configs
├── mapreduce/       # mapper.py + reducer.py
├── spark/           # covid_analysis.py (5 PySpark jobs)
├── dashboard/       # Flask app + Chart.js frontend
├── data/            # Dataset + sample generator
├── scripts/         # Step-by-step run scripts
└── run_all.sh       # One-command runner
```
