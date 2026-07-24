#!/usr/bin/env python3
"""
appendix.py — pull project-level verification tables out of OAG appendices.

The appendices ("Appendix I: Unsatisfactory Implementation of Projects",
"Appendix 1: Project Verification", ...) are the only place the OAG names
individual projects, the shilling amount disbursed, and what physical
verification actually found. That is the civic payload for the platform.

pdfplumber keeps real column boundaries, so a project name never bleeds into
the auditor's remark the way flowed pdftotext output does.

Output: projects_raw.json — one record per table row, each carrying the source
        PDF and the exact page it was read from.
"""

import json
import re
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).parent
CORPUS = ROOT / "corpus"
OUT = ROOT / "projects_raw.json"

APPENDIX = re.compile(r"^\s*Appendix\s+[I1-9V]+", re.M | re.I)
AMOUNT = re.compile(r"\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b")
NOISE = re.compile(
    r"Report of the Auditor-?General|for the year ended|^\s*S/?No\.?\s*$|AUDITOR-GENERAL",
    re.I,
)


# OAG uses Symbol-font bullets, which decode to private-use glyphs and glue
# themselves into the amount column ("500,00<glyph>0"). Strip them first.
BULLETS = dict.fromkeys(map(ord, "•"), None)


def clean(cell):
    if not cell:
        return ""
    return " ".join(str(cell).translate(BULLETS).split())


def looks_like_header(cells):
    joined = " ".join(cells).lower()
    return any(
        h in joined for h in ("s/no", "project name", "observation", "remarks", "payee")
    ) and not AMOUNT.search(" ".join(cells))


def main():
    records = []
    for pdf_path in sorted(CORPUS.glob("*.pdf")):
        with pdfplumber.open(pdf_path) as pdf:
            # Find where the appendix section begins.
            start = None
            for i, page in enumerate(pdf.pages):
                if APPENDIX.search(page.extract_text() or ""):
                    start = i
                    break
            if start is None:
                continue

            title = ""
            for page in pdf.pages[start:]:
                text = page.extract_text() or ""
                m = APPENDIX.search(text)
                if m:
                    line = text[m.start():].split("\n")[0]
                    title = " ".join(line.split())

                for table in page.extract_tables():
                    for row in table:
                        cells = [clean(c) for c in row]
                        if not any(cells) or looks_like_header(cells):
                            continue
                        joined = " | ".join(c for c in cells if c)
                        if NOISE.search(joined) or len(joined) < 12:
                            continue
                        cells = [c for c in cells if c]
                        # A row with no leading serial number is a spill-over of
                        # the previous project's remarks across a page break.
                        if (
                            records
                            and not re.match(r"^\d{1,3}[.)]?$", cells[0])
                            and records[-1]["source_pdf"] == pdf_path.name
                        ):
                            records[-1]["cells"][-1] += " " + " ".join(cells)
                            continue
                        amounts = AMOUNT.findall(joined)
                        records.append(
                            {
                                "source_pdf": pdf_path.name,
                                "page": page.page_number,
                                "appendix": title,
                                "cells": cells,
                                "amount_kshs": amounts[0].replace(",", "") if amounts else None,
                            }
                        )

    OUT.write_text(json.dumps(records, indent=2))
    print(f"{len(records)} appendix rows -> {OUT}")
    by_doc = {}
    for r in records:
        by_doc.setdefault(r["source_pdf"], 0)
        by_doc[r["source_pdf"]] += 1
    for k, v in sorted(by_doc.items()):
        print(f"  {k:<58} {v:>3} rows")


if __name__ == "__main__":
    main()
