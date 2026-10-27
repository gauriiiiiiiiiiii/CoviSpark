"""Flask API server for COVID-19 Analysis Dashboard."""
import json
import os
from flask import Flask, jsonify, render_template

app = Flask(__name__)

RESULTS_DIR = os.environ.get("COVID_RESULTS", os.path.join(os.path.dirname(__file__), "..", "results"))

def load_json(filename):
    path = os.path.join(RESULTS_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/top10")
def top10():
    return jsonify(load_json("top10_countries.json"))

@app.route("/api/continents")
def continents():
    return jsonify(load_json("continent_totals.json"))

@app.route("/api/wave")
def wave():
    data = load_json("global_wave.json")
    # Sample every 7th point to keep chart fast
    return jsonify(data[::7])

@app.route("/api/cfr")
def cfr():
    return jsonify(load_json("cfr_by_country.json"))

@app.route("/api/vaccination")
def vaccination():
    return jsonify(load_json("vaccination_progress.json"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
