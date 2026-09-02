#!/usr/bin/env python3
"""
build_findings.py — constituency-level audit findings for every OAG NG-CDF report.

Where a county has no per-project register, its report still carries real,
citable data: the audit opinion and the basis-for-qualification findings. This
surfaces those so the map shows honest audit data everywhere, distinct from the
physical-project cards (a bookkeeping finding is never dressed up as a ghost).

Reuses extract.py's per-document parser. Output: national_findings.json.
"""
import json
import re
from pathlib import Path
from collections import defaultdict

import extract  # sibling module (extract.extract(pdf) -> doc dict)

ROOT = Path(__file__).parent

SLUG_TO_COUNTY = {
    "mombasa": "Mombasa", "kwale": "Kwale", "kilifi": "Kilifi", "tana_river": "Tana River",
    "lamu": "Lamu", "taita_taveta": "Taita-Taveta", "garissa": "Garissa", "wajir": "Wajir",
    "mandera": "Mandera", "marsabit": "Marsabit", "isiolo": "Isiolo", "meru": "Meru",
    "tharaka_nithi": "Tharaka-Nithi", "embu": "Embu", "kitui": "Kitui", "machakos": "Machakos",
    "makueni": "Makueni", "nyandarua": "Nyandarua", "nyeri": "Nyeri", "kirinyaga": "Kirinyaga",
    "murang'a": "Murang'a", "kiambu": "Kiambu", "turkana": "Turkana", "west_pokot": "West Pokot",
    "samburu": "Samburu", "trans_nzoia": "Trans-Nzoia", "uasin_gishu": "Uasin Gishu",
    "elgeyo_marakwet": "Elgeyo-Marakwet", "nandi": "Nandi", "baringo": "Baringo",
    "laikipia": "Laikipia", "nakuru": "Nakuru", "narok": "Narok", "kajiado": "Kajiado",
    "kericho": "Kericho", "bomet": "Bomet", "kakamega": "Kakamega", "vihiga": "Vihiga",
    "bungoma": "Bungoma", "busia": "Busia", "siaya": "Siaya", "kisumu": "Kisumu",
    "homa_bay": "Homa Bay", "migori": "Migori", "kisii": "Kisii", "nyamira": "Nyamira",
    "nairobi": "Nairobi"
}

# Sections that carry substantive audit findings (skip the boilerplate parts).
SUBSTANTIVE = {
    "basis_qualified_opinion", "basis_disclaimer", "basis_for_conclusion",
    "emphasis_of_matter", "other_matter", "key_audit_matters",
}
SECTION_LABEL = {
    "basis_qualified_opinion": "Basis for Qualified Opinion",
    "basis_disclaimer": "Basis for Disclaimer of Opinion",
    "basis_for_conclusion": "Lawfulness & Effectiveness of Use of Funds",
    "emphasis_of_matter": "Emphasis of Matter",
    "other_matter": "Other Matter",
    "key_audit_matters": "Key Audit Matters",
}

# Reject headings that are continuation fragments or boilerplate, not findings.
BAD_HEADING = re.compile(
    r"^(conclusion|basis for|report on|responsibilities|the audit|in the|"
    r"january|february|march|april|may|june|july|august|september|october|"
    r"november|december|\d)", re.I,
)

# NG-CDF constituency reports only — county-level docs are curated separately.
SKIP_DOC = re.compile(r"county|assembly|executive|\bfund\b|technical|training|college|institute|mixed", re.I)


# Canonical IEBC constituency names, keyed by county. The filename is a hint,
# not an authority: `Aldai-NGCDG-2019-2020.pdf` is a real OAG filename with
# NGCDG for NG-CDF, and the old regex — which enumerated the spellings it
# expected — silently minted a constituency called "Aldai Ngcdg". Thirteen
# findings went into it and became unreachable, because no such place exists.
# Match against the real list instead of trying to predict how a filename can
# be wrong.
from gen_geography import DATA as IEBC_CONSTITUENCIES


def _norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


_BY_COUNTY = {
    county: {_norm(k): k for k in names}
    for county, names in IEBC_CONSTITUENCIES.items()
}


def constituency_from_filename(name, county=None):
    """Resolve a PDF filename to a real constituency in `county`.

    Takes the longest leading run of filename tokens that names an actual
    constituency, so trailing junk of any shape — a fund marker, a typo of
    one, a stray year — falls away without having to be anticipated.
    Returns None when nothing matches; the caller reports that rather than
    inventing a place.
    """
    stem = re.sub(r"\.pdf$", "", name, flags=re.I)
    stem = re.sub(r"[-_]?\d{4}[-_]\d{4}.*$", "", stem)
    tokens = [t for t in re.split(r"[-_\s]+", stem) if t]

    known = _BY_COUNTY.get(county, {})
    # Longest first, so "Nandi Hills" is never truncated to a shorter match.
    for n in range(len(tokens), 0, -1):
        hit = known.get(_norm(" ".join(tokens[:n])))
        if hit:
            return hit
    return None


def corpora():
    out = [("Nandi", ROOT / "corpus")]
    cdir = ROOT / "counties"
    if cdir.exists():
        for sub in sorted(cdir.iterdir()):
            if (sub / "corpus").exists():
                out.append((SLUG_TO_COUNTY.get(sub.name, sub.name.title()), sub / "corpus"))
    return out


def clean_summary(excerpt):
    s = " ".join(excerpt.split())
    # Trim to a readable one/two-sentence gist.
    if len(s) > 320:
        cut = s[:320]
        dot = cut.rfind(". ")
        s = (cut[: dot + 1] if dot > 120 else cut).strip() + " …"
    return s


def main():
    records = []
    unresolved = []               # (pdf name, county) we refuse to attribute
    opinions = defaultdict(dict)  # (county,constituency) -> {year: opinion}

    for county, corpus in corpora():
        for pdf in sorted(corpus.glob("*.pdf")):
            if SKIP_DOC.search(pdf.name):
                continue
            try:
                doc = extract.extract(pdf)
            except Exception as e:
                print(f"ERR {pdf.name}: {e}")
                continue

            constituency = constituency_from_filename(pdf.name, county)
            if constituency is None:
                # Never guess. A finding filed under a place that does not
                # exist is unreachable from the drill-down and invisible to
                # the reader it concerns.
                unresolved.append((pdf.name, county))
                continue
            fy = doc["financial_year"]
            fs_op = next((v for k, v in doc.get("opinions", {}).items()
                          if "Financial" in k), None)
            if fs_op:
                opinions[(county, constituency)][fy] = fs_op

            for f in doc["findings"]:
                if f["section"] not in SUBSTANTIVE:
                    continue
                heading = f["heading"].strip()
                if len(heading) < 10 or BAD_HEADING.match(heading):
                    continue
                amount = int(float(f["amounts_kshs"][0])) if f.get("amounts_kshs") else None
                records.append({
                    "county": county,
                    "constituency": constituency,
                    "year": fy,
                    "opinion": fs_op,
                    "heading": heading,
                    "category": SECTION_LABEL.get(f["section"], "Audit Finding"),
                    "amountKsh": amount,
                    "summary": clean_summary(f["excerpt"]),
                    "source": f"OAG {constituency} NG-CDF Audit FY{fy}, p{f['page']}",
                })

    (ROOT / "national_findings.json").write_text(json.dumps(records, indent=2, ensure_ascii=False))
    (ROOT / "national_opinions.json").write_text(json.dumps(
        {f"{c}||{k}": v for (c, k), v in opinions.items()}, indent=2, ensure_ascii=False))

    from collections import Counter
    print(f"{len(records)} findings across "
          f"{len(set((r['county'], r['constituency']) for r in records))} constituencies")
    print("by county:", dict(Counter(r["county"] for r in records)))
    print("with amount:", sum(1 for r in records if r["amountKsh"]))

    if unresolved:
        print(f"\n{len(unresolved)} report(s) could not be matched to an IEBC "
              f"constituency and were SKIPPED — fix the filename or the county "
              f"list, then re-run:")
        for name, county in unresolved:
            print(f"  {county}: {name}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
