#!/usr/bin/env bash
# Discover every OAG-published PDF for Nandi County constituencies.
# Source of truth: oagkenya.go.ke WordPress search, paginated.
set -uo pipefail
OUT="$(dirname "$0")/inventory.tsv"
: > "$OUT"

CONSTS=("Aldai" "Chesumei" "Emgwen" "Mosop" "Nandi+Hills" "Tinderet" "Nandi")

for c in "${CONSTS[@]}"; do
  label="${c//+/ }"
  for page in 1 2 3; do
    if [ "$page" -eq 1 ]; then
      url="https://www.oagkenya.go.ke/?s=$c"
    else
      url="https://www.oagkenya.go.ke/page/$page/?s=$c"
    fi
    html=$(curl -sSL --max-time 45 "$url")
    # Grab the plain relative hrefs (the real download links), strip #new_tab / #comments
    echo "$html" \
      | grep -oE 'href="/wp-content/uploads/[^"#]+\.pdf' \
      | sed -e 's/^href="//' \
      | sort -u \
      | while read -r rel; do
          fname=$(basename "$rel")
          printf "%s\t%s\thttps://www.oagkenya.go.ke%s\n" "$label" "$fname" "$rel" >> "$OUT"
        done
    # stop paginating once a page yields nothing new
    echo "$html" | grep -qE 'href="/wp-content/uploads/[^"#]+\.pdf' || break
  done
done

sort -u "$OUT" -o "$OUT"
wc -l "$OUT"
