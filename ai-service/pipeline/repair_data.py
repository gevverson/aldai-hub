#!/usr/bin/env python3
"""repair_data.py — correct amount-extraction defects in the seeded data.

Three defect classes were found in the 2026-08-31 audit:

  1. findings.json amountKsh mis-parsed from OCR-damaged figures. The old
     regex stripped every comma, so "Kshs.9, 207,193" became 9 and
     "Kshs.47,428,765,52" became 4,742,876,552. money.py parses these
     correctly; anything still ambiguous becomes null.

  2. Two figures where the OAG text layer itself is corrupt on the statement
     line but clean on the finding's concluding line. Verified by hand against
     the source PDF and applied as explicit overrides.

  3. seed.js carried nine rows from the Kesses FY2017/18 PMC *bank balance*
     table as if they were projects: `allocated` held a bank ACCOUNT NUMBER
     (Ksh 1.1 trillion for a primary school). They are not projects; drop them.

Idempotent: safe to re-run.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from money import first_amount  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FINDINGS = ROOT / "server" / "data" / "findings.json"
SEED = ROOT / "server" / "data" / "seed.js"

# A single NG-CDF constituency finding above ~1bn is not credible: the whole
# national NG-CDF appropriation is ~50bn and a constituency gets ~100-200M.
IMPLAUSIBLE_HIGH = 1_000_000_000
IMPLAUSIBLE_LOW = 1_000

# Verified by hand against the source PDF. The statement line carries a
# corrupted digit run; the concluding line of the same finding carries the
# real figure (and, for Turkana North, the budget table repeats it four times).
VERIFIED = {
    ("Vihiga", "Luanda", "2021/2022", "Other Grants and Transfers"):
        (60_533_774, "Luanda FY2021/22 p2 line 99: 'other grants and transfers of Kshs.60,533,774'"),
    ("Kiambu", "Thika Town", "2020/2021", "Unsupported Project Management Committee Bank Balances"):
        (14_603_311, "Thika Town FY2020/21 p2: 'PMC bank balances Kshs.14,603,311 could not be confirmed'"),
    ("Turkana", "Turkana North", "2016/2017", "Budget Performance"):
        (158_757_640, "Turkana North FY2016/17 p6 budget table: 158,757,640 (x4)"),
}

# No single headline figure exists for these; the only numbers on the line are
# a rate range, a table header, or a note about a units annotation.
DROP_AMOUNT = {
    ("Meru", "Central Imenti", "2018/2019"),
    ("Kajiado", "Kajiado North", "2016/2017"),
    ("Marsabit", "Moyale", "2018/2019"),
}


def repair_findings():
    data = json.loads(FINDINGS.read_text())
    fixed = verified = dropped = 0

    for f in data:
        amt = f.get("amountKsh")
        key4 = (f["county"], f["constituency"], f["year"], f.get("heading", ""))
        key3 = (f["county"], f["constituency"], f["year"])

        if key4 in VERIFIED:
            value, note = VERIFIED[key4]
            if f.get("amountKsh") != value:
                f["amountKsh"] = value
                f["amountNote"] = f"corrected from OCR-damaged text layer — {note}"
                verified += 1
            continue

        if amt is None:
            continue
        if not (amt < IMPLAUSIBLE_LOW or amt > IMPLAUSIBLE_HIGH):
            continue

        if key3 in DROP_AMOUNT:
            f["amountKsh"] = None
            f["amountNote"] = "no single headline figure in this finding"
            dropped += 1
            continue

        new, conf, _ = first_amount(f.get("summary", ""))
        if new is not None and IMPLAUSIBLE_LOW <= new <= IMPLAUSIBLE_HIGH:
            f["amountKsh"] = new
            f["amountNote"] = f"re-parsed from source text ({conf})"
            fixed += 1
        else:
            f["amountKsh"] = None
            f["amountNote"] = "figure unreadable in the OAG text layer"
            dropped += 1

    FINDINGS.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"findings: {fixed} re-parsed, {verified} verified-override, {dropped} nulled")
    return data


def split_objects(body: str):
    """Split a JS array body into its top-level {...} object literals."""
    out, depth, start, in_str, quote, esc = [], 0, None, False, "", False
    for i, ch in enumerate(body):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == quote:
                in_str = False
            continue
        if ch in "\"'`":
            in_str, quote = True, ch
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                out.append((start, i + 1))
    return out


def repair_seed():
    src = SEED.read_text()
    head = src.index("export const projects = [")
    astart = src.index("[", head) + 1
    aend = src.index("\n];", astart)
    body = src[astart:aend]

    spans = split_objects(body)
    keep, removed = [], 0
    for s, e in spans:
        obj = body[s:e]
        m = re.search(r"allocated:\s*([\d_]+)", obj)
        alloc = int(m.group(1).replace("_", "")) if m else 0
        is_bank_row = (
            "Kesses NG-CDF Audit FY2017/2018, p15" in obj
            and alloc >= 1_000_000_000
        )
        if is_bank_row:
            removed += 1
        else:
            keep.append(obj)

    if removed == 0:
        print("seed.js: nothing to remove (already repaired)")
        return
    new_body = "\n  " + ",\n  ".join(keep) + ",\n"
    SEED.write_text(src[:astart] + new_body + src[aend:])
    print(f"seed.js: removed {removed} PMC bank-account rows misfiled as projects")


if __name__ == "__main__":
    repair_findings()
    repair_seed()
