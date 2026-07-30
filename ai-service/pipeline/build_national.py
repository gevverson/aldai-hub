#!/usr/bin/env python3
"""
build_national.py — county-agnostic OAG project extractor.

Takes the appendix rows harvested for ANY county and emits Project records
tagged with county + constituency, each cited to source report + page.

This replaces the Nandi-specific build_seed.py: appendices are selected by
CONTENT (title keywords), not a hand-maintained whitelist, so adding a new
county requires no code change — only running the harvester for it.

Integrity rules (unchanged):
  * amounts and audit notes are verbatim from the Auditor-General
  * status is classified only from the auditor's own words
  * nothing is invented — no fabricated GPS, no guessed wards
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

# Appendix selection is decided per-table, not by title alone: many real
# project tables are titled only "Appendix 1", while bursary ledgers and
# outstanding-cheque dumps sometimes carry the same bare title. Titles that
# clearly name a project table are trusted; everything else has to look like
# one (institution-style names, and an auditor's remark column).
PROJECT_APPENDIX = re.compile(
    r"project|implementation|verification|unsatisfactory|incomplete|stalled", re.I
)
EXCLUDE_APPENDIX = re.compile(r"bursary|cheque|unutilized|unutilised|unspent", re.I)

INSTITUTION = re.compile(
    r"school|primary|secondary|college|institute|polytechnic|academy|dispensary"
    r"|hospital|health|centre|center|church|mosque|office|ward|market|chief|kmtc"
    r"|vocational|training|nursery|e\.?c\.?d",
    re.I,
)


def appendix_is_projects(title, parsed_rows):
    """Decide whether a table is a physical-project table worth publishing."""
    if EXCLUDE_APPENDIX.search(title):
        return False
    if PROJECT_APPENDIX.search(title):
        return True
    if len(parsed_rows) < 3:
        return False
    # Bare "Appendix 1": trust it only if it reads like a project register —
    # institution-style names and auditors' remarks rather than a cash ledger.
    named = sum(1 for p in parsed_rows if INSTITUTION.search(p[0]))
    remarked = sum(1 for p in parsed_rows if p[3])
    n = len(parsed_rows)
    return named / n >= 0.5 and remarked / n >= 0.4

CAT_RULES = [
    ("education", r"school|primary|secondary|classroom|dormitory|laborator|library|e\.?c\.?d|academy|institute|college|tuition|dining|latrine|polytechnic|kmtc"),
    ("health", r"hospital|dispensary|health|mother|baby|clinic|maternity|medical"),
    ("agriculture", r"dairy|creamer|cattle|dip|milk|agri|dam|irrigation|coffee|tea|market|stall|jua|slaughter|water"),
    ("transport", r"road|bridge|culvert|drift|tarmac|murram"),
    ("security", r"police|chief|administration|patrol|ap post|gate|fence|wall|perimeter"),
]

STATUS_RULES = [
    # GHOST = the WHOLE project is physically absent / never begun. Kept strict:
    # "did not exist", "no works done at all", "construction not started + no
    # materials on site". Component-level "X had not started" is NOT ghost — that
    # is caught by the PARTIAL_WORK guard below and downgraded to incomplete.
    ("GHOST PROJECT", r"did not exist|does not (physically )?exist|does not exist|no structure|empty (field|plot)|nothing (on site|was done)|no works? (had been|were|was) done|no (visible )?works?.*(on site|on the ground)|construction works not started|not commenced.*(no|nothing)|works? had not (started|commenced|begun).*(materials? not|no materials?)"),
    ("STALLED", r"\bstalled\b|\bstall\b|abandon|not on[- ]?site|no (meaningful )?progress|contractor (had )?(left|vacated|not on)"),
    ("INCOMPLETE", r"incomplete|not (yet )?complete|not done|not (in )?use|still requires|additional funding|pending|delay|ongoing|had not (started|been done)|not (yet )?(started|constructed|finished)"),
    ("DISPUTED", r"crack|leak|substandard|sub-standard|defect|poor (paint|work|workmanship)|not neatly|no certificate|no (log ?book|title)|ownership .* not|(documents|records|log ?book) (not|were not|missing|not availed|not provided)|not labelled|not as per|bill of quantit|no clear description|inequality|procurement records"),
    ("COMPLETE", r"complete and in use|project complete|completed and|works? complete|installed and in use|delivered and (are )?in use|complete\.?\s*$"),
]

# Evidence that SOME physical construction exists — a project showing any of
# these cannot honestly be called a ghost, only incomplete/stalled/disputed.
PARTIAL_WORK = re.compile(
    r"plaster|foundation|superstructure|walling|\bwalls?\b|slab|roof(ed|ing)|"
    r"beam|column|pillar|lintel|floor(ing|ed)?|painted|window|door|ground floor|"
    r"\d+\s*%|per\s?cent|percent|works? done|erected|in use|classrooms? (done|constructed|complete)",
    re.I,
)

AMOUNT_CELL = re.compile(r"^[\d,]+(?:\.\d+)?$")


def classify(text, rules, default):
    t = text.lower()
    for label, pat in rules:
        if re.search(pat, t):
            return label
    return default


def classify_status(remark):
    """Status, but never GHOST when the source shows partial construction."""
    label = classify(remark, STATUS_RULES, "REPORTED — SEE NOTE")
    if label == "GHOST PROJECT" and PARTIAL_WORK.search(remark):
        # Some works exist — re-classify against everything except GHOST.
        label = classify(remark, STATUS_RULES[1:], "INCOMPLETE")
    return label


def constituency_from_filename(name):
    stem = re.sub(r"\.pdf$", "", name, flags=re.I)
    stem = re.sub(r"[-_]?NGC[DF]+[-_]?\d{4}[-_]\d{4}.*$", "", stem, flags=re.I)
    stem = re.sub(r"[-_]?\d{4}[-_]\d{4}.*$", "", stem)
    return re.sub(r"[-_]+", " ", stem).strip().title()


def fy_from_filename(name):
    m = re.search(r"(\d{4})[-_](\d{4})", name)
    return f"{m.group(1)}/{m.group(2)}" if m else "unknown"


YEAR_CELL = re.compile(r"^\d{4}\s*[/-]\s*\d{2,4}$|^\d{4}$")


def parse_row(cells):
    """Locate the amount column; everything before is identity, after is remark."""
    body = cells[1:] if re.match(r"^\d{1,3}[.)]?$", cells[0]) else cells
    # Some counties (e.g. Mombasa) put a financial-year column before the
    # project name — "1 | 2017/2018 | Airport Secondary School | …". Drop a
    # leading year cell so the name is not read as the year.
    if body and YEAR_CELL.match(body[0].strip()):
        body = body[1:]
    # Match the cell as-is: a cell like "7 10000000" is two collided columns,
    # and collapsing the space would invent a number that is not in the report.
    idx = next((i for i, c in enumerate(body) if AMOUNT_CELL.fullmatch(c.strip())), None)
    if idx is None or idx == 0:
        return None
    amount = int(float(body[idx].strip().replace(",", "")))
    name = body[0].strip()
    activity = " ".join(body[1:idx]).strip()
    remark = " ".join(body[idx + 1:]).strip()
    return name, activity, amount, remark


COUNTY_REPORT = re.compile(r"county[-_ ](executive|assembly)|county[-_ ]government", re.I)


def build(county, raw_path):
    rows = json.loads(Path(raw_path).read_text())

    # Group rows by the table they came from so include/exclude is decided
    # per appendix rather than per row.
    groups = {}
    for r in rows:
        groups.setdefault((r["source_pdf"], r.get("appendix", "")), []).append(r)

    out = []
    for (pdf, title), grp in groups.items():
        parsed = [(p, r) for r in grp if (p := parse_row(r["cells"]))]
        if not parsed:
            continue
        if not appendix_is_projects(title, [p for p, _ in parsed]):
            continue

        is_county_doc = bool(COUNTY_REPORT.search(pdf))
        constituency = None if is_county_doc else constituency_from_filename(pdf)
        fund = "County" if is_county_doc else "NG-CDF"
        fy = fy_from_filename(pdf)
        label = f"County Executive of {county}" if is_county_doc else constituency

        for (name, activity, amount, remark), r in parsed:
            if len(name) < 3 or amount <= 0:
                continue
            # County tables lead with the contractor; the project sits next to it.
            if is_county_doc and activity:
                name, activity = activity, f"Contractor: {name}"
            status = (
                classify_status(remark)
                if remark
                else "REPORTED — NO VERIFICATION RESULT"
            )
            note = f"{activity}. {remark}".strip(". ") if activity else remark
            if not note.strip():
                # Row had an amount but no activity/remark text in the source
                # table. Be explicit rather than emit an empty note.
                note = "Listed in the audit project table; no descriptive remark recorded in the source."
            out.append({
                "name": name,
                "county": county,
                "constituency": constituency,   # null on county-wide projects
                "ward": None,                   # OAG does not break findings to ward
                "fund": fund,
                "category": classify(f"{name} {activity}", CAT_RULES, "other"),
                "allocated": amount,
                "year": fy,
                "officialStatus": "Reported funded",
                "communityStatus": status,
                "auditNote": note,
                "source": f"OAG {label} {'' if is_county_doc else 'NG-CDF '}Audit FY{fy}, p{r['page']}",
                "lat": None,
                "lng": None,
            })
    return out


SLUG_TO_COUNTY = {
    "meru":"Meru","kilifi":"Kilifi","kitui":"Kitui","bomet":"Bomet","kajiado":"Kajiado","siaya":"Siaya",
    "makueni":"Makueni","homa_bay":"Homa Bay","migori":"Migori","garissa":"Garissa","nyeri":"Nyeri","bungoma":"Bungoma",
    "nairobi": "Nairobi", "nakuru": "Nakuru", "machakos": "Machakos",
    "kisii": "Kisii", "murang'a": "Murang'a",
    "uasin_gishu": "Uasin Gishu", "kericho": "Kericho", "kiambu": "Kiambu",
    "mombasa": "Mombasa", "kisumu": "Kisumu", "kakamega": "Kakamega",
}

if __name__ == "__main__":
    # Nandi lives at the root; every other county is a counties/<slug> dir with
    # its own projects_raw.json. Auto-discover so adding a county needs no edit.
    targets = [("Nandi", ROOT / "projects_raw.json")]
    counties_dir = ROOT / "counties"
    if counties_dir.exists():
        for sub in sorted(counties_dir.iterdir()):
            raw = sub / "projects_raw.json"
            if raw.exists():
                name = SLUG_TO_COUNTY.get(sub.name, sub.name.replace("_", " ").title())
                targets.append((name, raw))

    allrecs = []
    for county, path in targets:
        if not Path(path).exists():
            print(f"skip {county}: no data")
            continue
        recs = build(county, path)
        allrecs.extend(recs)
        print(f"{county:<14} {len(recs):>4} projects")

    # Dedupe: the same project can appear in both an "all projects" appendix and
    # an "unsatisfactory projects" appendix of the same report. Keep one record
    # per (county, constituency, name, amount), preferring the one that carries a
    # real physical-verification result over a bare "reported" row.
    STATUS_RANK = {
        "GHOST PROJECT": 6, "STALLED": 5, "DISPUTED": 4, "INCOMPLETE": 3,
        "COMPLETE": 2, "REPORTED — SEE NOTE": 1, "REPORTED — NO VERIFICATION RESULT": 0,
    }
    best = {}
    for r in allrecs:
        key = (r["county"], r["constituency"], re.sub(r"\s+", " ", r["name"].lower()).strip(), r["allocated"])
        cur = best.get(key)
        if cur is None or STATUS_RANK.get(r["communityStatus"], 0) > STATUS_RANK.get(cur["communityStatus"], 0):
            best[key] = r
    deduped = list(best.values())
    dropped = len(allrecs) - len(deduped)
    if dropped:
        print(f"\ndeduped {dropped} duplicate rows -> {len(deduped)}")
    allrecs = deduped

    (ROOT / "national_projects.json").write_text(json.dumps(allrecs, indent=2, ensure_ascii=False))
    from collections import Counter
    print(f"\nTOTAL {len(allrecs)} projects across {len(set(r['county'] for r in allrecs))} counties")
    print("constituencies:", len(set(r["constituency"] for r in allrecs)))
    print("status:", dict(Counter(r["communityStatus"] for r in allrecs)))
