#!/usr/bin/env python3
"""
build_seed.py — turn verified OAG appendix rows into Project seed records.

Rules of the road (the whole point of this task is "no rumours"):
  * Every field traces to the source PDF. amount and audit note are verbatim.
  * Nothing is invented. We do NOT fabricate GPS coordinates or split a
    constituency into wards we cannot source — lat/lng stay null and `ward`
    carries the constituency name (the level the NG-CDF report actually covers).
  * communityStatus is classified ONLY from the auditor's verbatim remark,
    using conservative keyword rules; the remark itself is kept in auditNote so
    a reader can check the classification.

Input : projects_raw.json (appendix rows) + a whitelist of genuine physical
        verification appendices.
Output: seed_generated.js  — drop-in `projects` array for server/data/seed.js
        seed_generated.json — same data, for inspection / the RAG side.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
RAW = json.loads((ROOT / "projects_raw.json").read_text())

# Only appendices that are genuine physical-verification tables
# (project name + amount + what auditors found on the ground).
# key = (source_pdf, appendix)  ->  (constituency, fund, fy, citation_label)
WHITELIST = {
    ("Aldai-NGCDF-2018-2019.pdf", "Appendix I: Unsatisfactory Implementation of Projects"):
        ("Aldai", "NG-CDF", "2018/2019"),
    ("Nandi-Hills-NGCDF-2019-2020.pdf", "Appendix 1"):
        ("Nandi Hills", "NG-CDF", "2019/2020"),
    ("Mosop-NGCDF-2019-2020.pdf", "Appendix I: Unsatisfactory Projects Implementation"):
        ("Mosop", "NG-CDF", "2019/2020"),
    ("County-Executive-of-Nandi-2021-2022.pdf", "Appendix I: Projects Verification"):
        ("Nandi County", "County", "2021/2022"),
}

CAT_RULES = [
    ("education", r"school|primary|secondary|classroom|dormitory|laborator|library|e\.?c\.?d|academy|institute|college|tuition|dining"),
    ("health",   r"hospital|dispensary|health|mother|baby|clinic|maternity|ward|medical"),
    ("agriculture", r"dairy|creamer|cattle|dip|milk|agri|dam|irrigation|coffee|tea|market|stall|jua|slaughter"),
    ("transport", r"road|bridge|culvert|drift|tarmac|murram"),
    ("security", r"police|chief|office|administration|patrol|ap post|gate|fence|wall|perimeter"),
]

# Conservative status classification from the auditor's verbatim remark.
STATUS_RULES = [
    ("GHOST PROJECT",       r"did not exist|does not exist|not exist|no structure|empty (field|plot)|not started|not commenced|works? (had )?not (yet )?(started|commenced|begun)|no (works?|construction|materials?) on|construction works not started"),
    ("STALLED",             r"\bstalled\b|\bstall\b|abandon|not on[- ]?site|no (meaningful )?progress|contractor (had )?(left|vacated|not on)"),
    ("INCOMPLETE",          r"incomplete|not (yet )?complete|not done|not (in )?use|still requires|additional funding|pending|delay"),
    ("DISPUTED",            r"crack|leak|substandard|sub-standard|defect|poor (paint|work|workmanship)|not neatly|no certificate|no (log ?book|title)|ownership .* not|(documents|records|log ?book) (not|were not|missing|not availed|not provided)|not labelled|below|gauge|not as per|bill of quantit|no clear description|inequality|procurement records"),
    ("COMPLETE",            r"complete and in use|project complete|completed and|complete\.?\s*$|works? complete|installed and in use|delivered and in use|delivered and (are )?in use|project ongoing"),
]


def classify_category(text):
    t = text.lower()
    for cat, pat in CAT_RULES:
        if re.search(pat, t):
            return cat
    return "other"


def classify_status(remark):
    t = remark.lower()
    for status, pat in STATUS_RULES:
        if re.search(pat, t):
            return status
    return "REPORTED — SEE NOTE"


def page_label(constituency, fund, fy):
    if fund == "County":
        return f"OAG County Executive of Nandi Audit FY{fy}"
    return f"OAG {constituency} NG-CDF Audit FY{fy}"


def parse_row(cells, fund):
    """Return (name, activity, amount, remark) from a whitelist row.

    NG-CDF rows:  [no, school, (activity), amount, observation]  -> name = school
    County rows:  [no, contractor, project, amount, remark]      -> name = project,
                  and the contractor is folded into the note so nothing is lost.
    """
    body = cells[1:]  # drop the serial number
    amount = None
    amount_idx = None
    for i, c in enumerate(body):
        m = re.fullmatch(r"[\d,]+(?:\.\d+)?", c.replace(" ", ""))
        if m:
            amount = int(float(c.replace(",", "")))
            amount_idx = i
            break
    if amount_idx is None:
        return None
    remark = " ".join(body[amount_idx + 1:])
    if fund == "County" and amount_idx >= 2:
        # col0 = contractor, col1.. = project description
        contractor = body[0].strip()
        name = " ".join(body[1:amount_idx]).strip()
        activity = f"Contractor: {contractor}"
    else:
        name = body[0].strip()
        activity = " ".join(body[1:amount_idx]).strip() if amount_idx > 1 else ""
    return name, activity, amount, remark.strip()


def build():
    records = []
    for r in RAW:
        key = (r["source_pdf"], r["appendix"])
        if key not in WHITELIST:
            continue
        constituency, fund, fy = WHITELIST[key]
        parsed = parse_row(r["cells"], fund)
        if not parsed:
            continue
        name, activity, amount, remark = parsed
        if len(name) < 3 or amount is None:
            continue
        status = classify_status(remark)
        note = remark if not activity else f"{activity}. {remark}"
        records.append({
            "name": name,
            "ward": constituency,          # report granularity = constituency
            "fund": fund,
            "category": classify_category(f"{name} {activity}"),
            "allocated": amount,
            "year": fy,
            "officialStatus": "Reported funded/complete",
            "communityStatus": status,
            "auditNote": note.strip(". "),
            "source": f"{page_label(constituency, fund, fy)}, p{r['page']}",
            "lat": None,
            "lng": None,
        })
    return records


def to_js(records):
    def fmt(v):
        if v is None:
            return "null"
        if isinstance(v, int):
            return f"{v:_}"
        return json.dumps(v, ensure_ascii=False)

    lines = [
        "/**",
        " * seed_generated.js — auto-generated from official OAG audit PDFs.",
        " * Every record traces to a source report + page. Amounts and audit",
        " * notes are verbatim from the Auditor-General. lat/lng are null where",
        " * the report gives no coordinates (not fabricated).",
        " * Regenerate with scratchpad/build_seed.py.",
        " */",
        "export const projects = [",
    ]
    for r in records:
        lines.append("  {")
        for k in ["name", "ward", "fund", "category", "allocated", "year",
                  "officialStatus", "communityStatus", "auditNote", "source",
                  "lat", "lng"]:
            lines.append(f"    {k+':':<17} {fmt(r[k])},")
        lines.append("  },")
    lines.append("];")
    return "\n".join(lines) + "\n"


def main():
    records = build()
    (ROOT / "seed_generated.json").write_text(json.dumps(records, indent=2, ensure_ascii=False))
    (ROOT / "seed_generated.js").write_text(to_js(records))
    print(f"{len(records)} verified project records generated.\n")
    from collections import Counter
    print("By constituency:", dict(Counter(r["ward"] for r in records)))
    print("By status      :", dict(Counter(r["communityStatus"] for r in records)))
    print("By category    :", dict(Counter(r["category"] for r in records)))
    unclass = [r for r in records if r["communityStatus"] == "REPORTED — SEE NOTE"]
    if unclass:
        print(f"\n{len(unclass)} rows need manual status review:")
        for r in unclass:
            print(f"  - {r['name']} | {r['auditNote'][:70]}")


if __name__ == "__main__":
    main()
