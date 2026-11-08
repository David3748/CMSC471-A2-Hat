#!/usr/bin/env bash
# Downloads ProPublica's "Civilian Complaints Against New York City Police Officers"
# dataset into data/raw/. The raw files are gitignored: ProPublica's terms of use
# don't allow republishing the raw data on a stand-alone basis.
set -euo pipefail

URL="https://static.propublica.org/projects/datastore-archive/CCRB-Complaint-Data_202007271729.zip"
RAW_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/raw"

mkdir -p "$RAW_DIR"
curl -fsSL -o "$RAW_DIR/ccrb.zip" "$URL"
unzip -o -q "$RAW_DIR/ccrb.zip" -x "__MACOSX/*" -d "$RAW_DIR"

echo "Extracted to $RAW_DIR:"
ls -1 "$RAW_DIR"
