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
    "uasin_gishu": "Uasin Gishu", "kericho": "Kericho", "kiambu": "Kiambu",
    "mombasa": "Mombasa", "kisumu": "Kisumu", "kakamega": "Kakamega",
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


def constituency_from_filename(name):
    stem = re.sub(r"\.pdf$", "", name, flags=re.I)
    stem = re.sub(r"[-_]?NGC[DF]+[-_]?\d{4}[-_]\d{4}.*$", "", stem, flags=re.I)
    stem = re.sub(r"[-_]?\d{4}[-_]\d{4}.*$", "", stem)
    return re.sub(r"[-_]+", " ", stem).strip().title()


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

            constituency = constituency_from_filename(pdf.name)
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


if __name__ == "__main__":
    main()
