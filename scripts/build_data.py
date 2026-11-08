"""Build data/maternal_mortality.json from the raw World Bank files in data/raw/.

Run from the repo root after scripts/get_data.sh:
    python3 -I scripts/build_data.py
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "maternal_mortality.json"

YEARS = list(range(2000, 2018))  # the modeled maternal mortality estimates cover 2000-2017
INDICATORS = {
    "mmr": ("gender-raw-2021.csv", "SH.STA.MMRT"),    # maternal deaths per 100,000 live births (modeled)
    "deaths": ("health-raw-2021.csv", "SH.MMR.DTHS"),  # number of maternal deaths
}
AGGREGATES = ["WLD", "SSF", "SAS", "LCN", "MEA", "EAS", "ECS", "NAC", "HIC"]


def load(file, code):
    raw = pd.read_csv(RAW / file, skiprows=4)  # first 4 lines are a title block
    rows = raw[raw["Indicator Code"] == code].set_index("Country Code")
    return rows[[str(y) for y in YEARS]]


def series(frame, code):
    if code not in frame.index:
        return [None] * len(YEARS)
    return [None if pd.isna(v) else round(float(v), 1) for v in frame.loc[code]]


tables = {key: load(*spec) for key, spec in INDICATORS.items()}
names = pd.read_csv(RAW / "gender-raw-2021.csv", skiprows=4).drop_duplicates("Country Code").set_index("Country Code")["Country Name"]
meta = pd.read_csv(RAW / "Metadata_Country_API_17_DS2_en_csv_v2_3058240.csv").set_index("Country Code")
iso_num = {alpha3: num for _, alpha3, num, _ in json.loads((RAW / "iso-codes.json").read_text())}

countries = []
for code, row in meta[meta.Region.notna()].iterrows():  # aggregates have no Region
    mmr = series(tables["mmr"], code)
    if all(v is None for v in mmr):
        continue
    countries.append({
        "iso3": code,
        "isoNum": iso_num.get(code),
        "name": names[code],
        "region": row.Region,
        "income": None if pd.isna(row.IncomeGroup) else row.IncomeGroup,  # Venezuela is unclassified
        "mmr": mmr,
        "deaths": series(tables["deaths"], code),
    })

aggregates = [{"code": code, "name": names[code], "mmr": series(tables["mmr"], code), "deaths": series(tables["deaths"], code)}
              for code in AGGREGATES]

OUT.write_text(json.dumps({
    "source": "World Bank, World Development Indicators (2021-09-15): SH.STA.MMRT, SH.MMR.DTHS",
    "years": YEARS,
    "countries": countries,
    "aggregates": aggregates,
}, separators=(",", ":"), allow_nan=False))

print(f"Wrote {OUT.relative_to(ROOT)}: {len(countries)} countries, {len(aggregates)} aggregates, {OUT.stat().st_size / 1024:.0f} KB")
missing = [c["iso3"] for c in countries if not c["isoNum"]]
if missing:
    print("No ISO numeric code (won't appear on the map):", missing)
