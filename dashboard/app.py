"""Flask API server for COVID-19 Analysis Dashboard."""
import csv
import json
import os
from datetime import datetime, timezone

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

RESULTS_DIR = os.environ.get("COVID_RESULTS", os.path.join(os.path.dirname(__file__), "..", "results"))

# Output files written by the pipeline, in the order the jobs run.
OUTPUTS = [
    ("mapreduce_output.csv",      "MapReduce",  "Country-wise totals"),
    ("top10_countries.json",      "Spark Job 1", "Top 10 countries by cases"),
    ("continent_totals.json",     "Spark Job 2", "Continent-wise totals"),
    ("global_wave.json",          "Spark Job 3", "Global wave, 7-day average"),
    ("cfr_by_country.json",       "Spark Job 4", "Case-fatality rate"),
    ("vaccination_progress.json", "Spark Job 5", "Vaccination progress"),
]


def load_json(filename):
    path = os.path.join(RESULTS_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)


def load_mapreduce():
    path = os.path.join(RESULTS_DIR, "mapreduce_output.csv")
    if not os.path.exists(path):
        return []
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def count_records(filename):
    if filename.endswith(".csv"):
        return len(load_mapreduce())
    return len(load_json(filename))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    files = []
    for filename, stage, description in OUTPUTS:
        path = os.path.join(RESULTS_DIR, filename)
        exists = os.path.exists(path)
        files.append({
            "file": filename,
            "stage": stage,
            "description": description,
            "ready": exists,
            "records": count_records(filename) if exists else 0,
            "updated": datetime.fromtimestamp(os.path.getmtime(path), timezone.utc).isoformat()
                       if exists else None,
        })
    return jsonify({"ready": all(f["ready"] for f in files), "files": files})


@app.route("/api/summary")
def summary():
    # Country count comes from the MapReduce country-wise aggregation.
    return jsonify({"countries": len(load_mapreduce())})


@app.route("/api/countries")
def countries():
    rows = []
    for r in load_mapreduce():
        cases, deaths = int(r["total_cases"]), int(r["total_deaths"])
        rows.append({
            "country": r["country"],
            "continent": r["continent"],
            "total_cases": cases,
            "total_deaths": deaths,
            "cfr_pct": round(deaths / cases * 100, 3) if cases else 0.0,
        })
    return jsonify(rows)


@app.route("/api/top10")
def top10():
    return jsonify(load_json("top10_countries.json"))


@app.route("/api/continents")
def continents():
    return jsonify(load_json("continent_totals.json"))


@app.route("/api/wave")
def wave():
    data = load_json("global_wave.json")
    # Sample every 7th point by default to keep the chart fast; ?step=1 returns every day.
    step = max(1, request.args.get("step", default=7, type=int))
    return jsonify(data[::step])


@app.route("/api/cfr")
def cfr():
    return jsonify(load_json("cfr_by_country.json"))


@app.route("/api/vaccination")
def vaccination():
    return jsonify(load_json("vaccination_progress.json"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
