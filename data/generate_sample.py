"""Generate a realistic COVID-19 sample dataset (no internet needed)."""
import csv
import os
import random
from datetime import date, timedelta

random.seed(42)

COUNTRIES = [
    ("USA", "North America", 331000000),
    ("IND", "Asia", 1380000000),
    ("BRA", "South America", 213000000),
    ("GBR", "Europe", 67000000),
    ("RUS", "Europe", 146000000),
    ("FRA", "Europe", 67000000),
    ("DEU", "Europe", 83000000),
    ("ITA", "Europe", 60000000),
    ("ESP", "Europe", 47000000),
    ("TUR", "Asia", 84000000),
    ("ARG", "South America", 45000000),
    ("COL", "South America", 51000000),
    ("MEX", "North America", 128000000),
    ("POL", "Europe", 38000000),
    ("IRN", "Asia", 84000000),
    ("ZAF", "Africa", 60000000),
    ("NGA", "Africa", 211000000),
    ("EGY", "Africa", 102000000),
    ("AUS", "Oceania", 26000000),
    ("JPN", "Asia", 126000000),
    ("KOR", "Asia", 52000000),
    ("CAN", "North America", 38000000),
    ("PAK", "Asia", 220000000),
    ("IDN", "Asia", 274000000),
    ("PHL", "Asia", 110000000),
]

start_date = date(2020, 1, 22)
end_date = date(2023, 12, 31)

rows = []
for iso, continent, population in COUNTRIES:
    total_cases = 0
    total_deaths = 0
    total_vax = 0
    base_cfr = random.uniform(0.005, 0.025)
    peak_factor = random.uniform(0.0001, 0.0005)
    d = start_date
    wave_offset = random.randint(0, 60)
    while d <= end_date:
        days = (d - start_date).days
        # simulate waves using sine
        import math
        wave = (math.sin((days - wave_offset) / 60) + 1.5) * peak_factor
        new_cases = max(0, int(population * wave * random.uniform(0.7, 1.3)))
        new_deaths = max(0, int(new_cases * base_cfr * random.uniform(0.8, 1.2)))
        new_vax = max(0, int(population * 0.001 * (1 if days > 300 else 0) * random.uniform(0.5, 1.5)))
        total_cases += new_cases
        total_deaths += new_deaths
        total_vax = min(total_vax + new_vax, population * 2)
        rows.append({
            "iso_code": iso,
            "continent": continent,
            "location": iso,
            "date": d.isoformat(),
            "total_cases": total_cases,
            "new_cases": new_cases,
            "total_deaths": total_deaths,
            "new_deaths": new_deaths,
            "total_vaccinations": total_vax,
            "people_vaccinated": int(total_vax * 0.6),
            "population": population,
        })
        d += timedelta(days=1)

outfile = os.path.join(os.path.dirname(os.path.abspath(__file__)), "owid-covid-data.csv")
with open(outfile, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} rows -> {outfile}")
