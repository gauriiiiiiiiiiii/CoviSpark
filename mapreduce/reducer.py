#!/usr/bin/env python3
"""
MapReduce Reducer: Aggregate total cases and deaths per country.
Input:  country\tcontinent\tnew_cases\tnew_deaths  (sorted by country)
Output: country,continent,total_cases,total_deaths
"""
import sys

current_country = None
current_continent = None
total_cases = 0
total_deaths = 0

# Print CSV header
print("country,continent,total_cases,total_deaths")

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    parts = line.split("\t")
    if len(parts) != 4:
        continue
    country, continent, cases_str, deaths_str = parts
    try:
        cases  = int(cases_str)
        deaths = int(deaths_str)
    except ValueError:
        continue

    if current_country == country:
        total_cases  += cases
        total_deaths += deaths
    else:
        if current_country is not None:
            print(f"{current_country},{current_continent},{total_cases},{total_deaths}")
        current_country   = country
        current_continent = continent
        total_cases  = cases
        total_deaths = deaths

if current_country is not None:
    print(f"{current_country},{current_continent},{total_cases},{total_deaths}")
