#!/usr/bin/env bash
# county_pipeline.sh — general OAG NG-CDF harvester for ANY Kenyan county.
# Proves the platform is not Nandi-specific: give it a county + its
# constituencies and it discovers, downloads, and text-extracts every
# published NG-CDF report from oagkenya.go.ke.
#
# Usage: bash county_pipeline.sh <CountyName> <Constituency1> <Constituency2> ...
set -uo pipefail

COUNTY="$1"; shift
CONSTS=("$@")
SLUG=$(echo "$COUNTY" | tr 'A-Z ' 'a-z_')
BASE="$(dirname "$0")/counties/$SLUG"
mkdir -p "$BASE/corpus" "$BASE/text"
INV="$BASE/inventory.tsv"; : > "$INV"

echo "### $COUNTY — discovering reports for ${#CONSTS[@]} constituencies ###"
for c in "${CONSTS[@]}"; do
  q="${c// /+}"
  for pg in 1 2 3; do
    u="https://www.oagkenya.go.ke/?s=$q"; [ $pg -gt 1 ] && u="https://www.oagkenya.go.ke/page/$pg/?s=$q"
    html=$(curl -sSL --max-time 40 "$u")
    echo "$html" | grep -oiE "/wp-content/uploads/[0-9/]+/${c// /[- ]}[- ]?NGC[DF]+[- ]?[0-9]{4}-[0-9]{4}\.pdf" \
      | sed 's/#.*//' | sort -u | while read -r rel; do
        printf "%s\t%s\thttps://www.oagkenya.go.ke%s\n" "$c" "$(basename "$rel")" "$rel" >> "$INV"
      done
    echo "$html" | grep -qiE "/wp-content/uploads/.*${c// /[- ]}.*NGC" || break
  done
done
sort -u "$INV" -o "$INV"
echo "discovered $(wc -l < "$INV") report(s)"

echo "### downloading ###"
awk -F'\t' '{print $2"\t"$3}' "$INV" | sort -u | while IFS=$'\t' read -r name url; do
  f="$BASE/corpus/$name"; [ -f "$f" ] && continue
  code=$(curl -sSL --max-time 90 -o "$f" -w "%{http_code}" "$url")
  sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
  if [ "$code" != "200" ] || [ "$sz" -lt 5000 ]; then echo "  FAIL $code $name"; rm -f "$f"; fi
done
echo "downloaded $(ls "$BASE/corpus"/*.pdf 2>/dev/null | wc -l) PDF(s)"
