#!/usr/bin/env python3
"""
extract.py — turn OAG audit PDFs into page-cited structured findings.

Reads the PDFs in ./corpus, splits pdftotext output on form-feeds so every
finding keeps the PDF page it came from, and pulls out only the substantive
sections. The standard preamble and the boilerplate "Responsibilities of
Management" / "Auditor-General's Responsibilities" tail are dropped.

Output: findings.json  — one record per audit finding, each with an exact
        document + page citation and a verbatim excerpt.
"""

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
CORPUS = ROOT / "corpus"
OUT = ROOT / "findings.json"

# Section headings that open a block of real audit substance.
SECTION_HEADS = [
    ("basis_qualified_opinion", r"Basis\s+for\s+(?:Qualified|Adverse)\s+Opinion"),
    ("basis_disclaimer",        r"Basis\s+for\s+Disclaimer\s+of\s+Opinion"),
    ("emphasis_of_matter",      r"Emphasis\s+of\s+Matter"),
    ("other_matter",            r"Other\s+Matter"),
    ("key_audit_matters",       r"Key\s+Audit\s+Matters"),
    ("basis_for_conclusion",    r"Basis\s+for\s+(?:Adverse\s+)?Conclusion"),
]

# Where substance stops and boilerplate begins.
STOP = re.compile(
    r"^\s*(Responsibilities\s+of\s+Management"
    r"|Auditor-General'?s?\s+Responsibilit"
    r"|Management'?s?\s+Responsibilit"
    r"|The\s+audit\s+was\s+conducted\s+in\s+accordance\s+with\s+ISSAI)",
    re.I,
)

# Which of the three statutory parts we are inside.
PART = re.compile(
    r"^\s*REPORT\s+ON\s+(THE\s+FINANCIAL\s+STATEMENTS"
    r"|LAWFULNESS\s+AND\s+EFFECTIVENESS"
    r"|EFFECTIVENESS\s+OF\s+INTERNAL\s+CONTROLS)",
    re.I,
)

# The pre-2018 reports print the opinion before any "REPORT ON ..." part header,
# and write "Disclaimer Opinion" without the "of".
OPINION = re.compile(
    r"^\s*(Unqualified|Qualified|Adverse|Disclaimer(?:\s+of)?)\s+Opinion\s*$", re.I
)
FS_PART = "Report On The Financial Statements"

# "1. Heading Text" / "4.1 Heading Text" — a numbered finding.
NUMBERED = re.compile(r"^\s*(\d+(?:\.\d+)?)[\.\)]?\s{1,6}([A-Z][^\n]{4,110})\s*$")

MONEY = re.compile(r"Kshs?\.?\s?([\d,]+(?:\.\d+)?)", re.I)

# The older (pre-2018) reports embed detail tables — "school | date | voucher |
# purpose | amount" — whose rows also start with a number and a capital letter.
# Those rows are evidence for the finding above them, not findings themselves.
DATE_CELL = re.compile(r"\b\d{1,2}\.\d{1,2}\.\d{2,4}\b")
AMOUNT_CELL = re.compile(r"\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?\s*$")


def is_table_row(text: str) -> bool:
    """True when a numbered line is a table row rather than a finding heading."""
    if DATE_CELL.search(text) or AMOUNT_CELL.search(text):
        return True
    # Several separate runs of digits => tabular, not prose.
    if len(re.findall(r"\d+", text)) >= 3:
        return True
    # Real headings are prose: mostly letters, few digits.
    letters = sum(c.isalpha() or c.isspace() for c in text)
    return letters / max(len(text), 1) < 0.75


def pages_of(pdf: Path):
    """Return list of page texts, index 0 == PDF page 1."""
    txt = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    return txt.split("\f")


def parse_meta(name: str):
    """Derive entity + financial year from the OAG filename."""
    m = re.search(r"(\d{4})[-_](\d{4})", name)
    fy = f"{m.group(1)}/{m.group(2)}" if m else "unknown"
    entity = re.sub(r"[-_]?\d{4}[-_]\d{4}.*$", "", name).replace("-", " ").strip()
    return entity, fy


def extract(pdf: Path):
    pages = pages_of(pdf)
    entity, fy = parse_meta(pdf.stem)

    opinion = {}
    current_part = None
    section = None
    finding = None
    findings = []

    def close():
        nonlocal finding
        if finding and finding["excerpt"].strip():
            body = finding["excerpt"].strip()
            finding["excerpt"] = re.sub(r"\n{3,}", "\n\n", body)
            # Keep document order — the first figure quoted is the one the
            # finding is actually about; sorting by size misattributes it.
            seen, ordered = set(), []
            for a in MONEY.findall(body):
                v = a.replace(",", "")
                if v not in seen:
                    seen.add(v)
                    ordered.append(v)
            finding["amounts_kshs"] = ordered[:8]
            findings.append(finding)
        finding = None

    for pno, page in enumerate(pages, start=1):
        for line in page.split("\n"):
            # Running header/footer noise on every page.
            if re.match(r"^\s*Report of the Auditor-?General", line, re.I):
                continue
            if re.match(r"^\s*for the year ended", line, re.I):
                continue

            p = PART.match(line)
            if p:
                close()
                current_part = " ".join(p.group(0).split()).title()
                section = None
                continue

            o = OPINION.match(line)
            if o:
                opinion.setdefault(current_part or FS_PART, " ".join(o.group(0).split()))
                continue

            if STOP.match(line):
                close()
                section = None
                continue

            hit = None
            for key, pat in SECTION_HEADS:
                if re.match(rf"^\s*{pat}\s*$", line, re.I):
                    hit = key
                    break
            if hit:
                close()
                section = hit
                continue

            if section is None:
                continue

            n = NUMBERED.match(line)
            if n and is_table_row(n.group(2)):
                # Evidence row belonging to the finding already open.
                if finding is not None:
                    finding["excerpt"] += line.rstrip() + "\n"
                    finding["evidence_rows"] = finding.get("evidence_rows", 0) + 1
                continue
            if n:
                close()
                finding = {
                    "number": n.group(1),
                    "heading": " ".join(n.group(2).split()),
                    "part": current_part,
                    "section": section,
                    "page": pno,
                    "excerpt": "",
                }
                continue

            if finding is not None:
                finding["excerpt"] += line.rstrip() + "\n"

    close()
    return {
        "entity": entity,
        "financial_year": fy,
        "source_pdf": pdf.name,
        "opinions": opinion,
        "findings": findings,
    }


def main():
    docs = []
    for pdf in sorted(CORPUS.glob("*.pdf")):
        try:
            docs.append(extract(pdf))
        except Exception as e:  # keep going; report at the end
            docs.append({"source_pdf": pdf.name, "error": str(e), "findings": []})

    OUT.write_text(json.dumps(docs, indent=2))
    total = sum(len(d["findings"]) for d in docs)
    print(f"{len(docs)} documents -> {total} findings -> {OUT}")
    for d in docs:
        n = len(d.get("findings", []))
        flag = "  <-- CHECK" if n == 0 else ""
        print(f"  {d['source_pdf']:<60} {n:>3} findings{flag}")


if __name__ == "__main__":
    main()
