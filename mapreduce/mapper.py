#!/usr/bin/env python3
"""
MapReduce Mapper: COVID-19 Country-wise Aggregation
Input:  CSV rows from HDFS (owid-covid-data.csv)
Output: tab-separated  country\tcontinent\tnew_cases\tnew_deaths
"""
import sys
import csv

reader = csv.DictReader(sys.stdin)
for row in reader:
    try:
        location  = row.get("location", "").strip()
        continent = row.get("continent", "Unknown").strip() or "Unknown"
        new_cases  = int(float(row.get("new_cases", 0) or 0))
        new_deaths = int(float(row.get("new_deaths", 0) or 0))
        # skip aggregate rows (OWID uses OWID_ prefix for continents/world)
        iso = row.get("iso_code", "")
        if iso.startswith("OWID_") or not location:
            continue
        print(f"{location}\t{continent}\t{new_cases}\t{new_deaths}")
    except (ValueError, KeyError):
        pass
