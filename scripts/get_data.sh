#!/usr/bin/env bash
# Downloads the World Bank gender indicators (and the health indicators, for female
# population by age) from the pre-cleaned mirror linked in the assignment into data/raw/.
# Raw files are gitignored to keep the repo small; commit derived files instead.
set -euo pipefail

BASE="https://raw.githubusercontent.com/light-and-salt/World-Bank-Data-by-Indicators/master"
FILES=(
  "gender/gender-raw-2021.csv"
  "gender/Metadata_Country_API_17_DS2_en_csv_v2_3058240.csv"
  "gender/Metadata_Indicator_API_17_DS2_en_csv_v2_3058240.csv"
  "health/health-raw-2021.csv"
)
RAW_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/raw"

mkdir -p "$RAW_DIR"
for f in "${FILES[@]}"; do
  curl -fsSL -o "$RAW_DIR/$(basename "$f")" "$BASE/$f"
done

# ISO alpha-3 -> numeric codes, to join World Bank rows to the world-atlas map shapes
curl -fsSL -o "$RAW_DIR/iso-codes.json" "https://cdn.jsdelivr.net/npm/i18n-iso-countries@7.14.0/codes.json"

echo "Downloaded to $RAW_DIR:"
ls -1 "$RAW_DIR"
