#!/usr/bin/env python3
"""
MapReduce Mapper: COVID-19 Country-wise Aggregation
Input:  CSV rows from HDFS (owid-covid-data.csv)
Output: tab-separated  country\tcontinent\tnew_cases\tnew_deaths
"""
import os
import sys
import csv

# Hadoop gives each mapper one input split, and only the first split holds the
# CSV header. The job passes the header in COVID_HEADER so every split parses
# the same way; without it (local pipe mode) the first line is the header.
header_env = os.environ.get("COVID_HEADER")
if header_env:
    fieldnames = next(csv.reader([header_env]))
    rows = csv.reader(sys.stdin)
else:
    rows = csv.reader(sys.stdin)
    fieldnames = next(rows, [])

for values in rows:
    if values == fieldnames:
        continue  # header line at the start of the first split
    row = dict(zip(fieldnames, values))
    try:
        location  = row.get("location", "").strip()
        continent = row.get("continent", "Unknown").strip() or "Unknown"
        new_cases  = int(float(row.get("new_cases", 0) or 0))
        new_deaths = int(float(row.get("new_deaths", 0) or 0))
        # skip aggregate rows (OWID uses OWID_ prefix for continents/world)
        iso = row.get("iso_code", "")
        if iso.startswith("OWID_") or not location:
            continue
        print("{}\t{}\t{}\t{}".format(location, continent, new_cases, new_deaths))
    except (ValueError, KeyError):
        pass
