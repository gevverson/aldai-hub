#!/usr/bin/env python3
"""
appendix_county.py — extract OAG appendix project tables for one county corpus.

Usage: python appendix_county.py <counties/<slug>>
Reads   <dir>/corpus/*.pdf  ->  writes <dir>/projects_raw.json

Same rules as the Nandi appendix.py: keep real column boundaries with
pdfplumber, merge page-break spill-over rows, strip Symbol-font bullets.
"""
import os, sys, json, re
from pathlib import Path
import pdfplumber

base = Path(sys.argv[1])
CORPUS = base / "corpus"
OUT = base / "projects_raw.json"

APPENDIX = re.compile(r"^\s*Appendix\s+[I1-9V]+", re.M | re.I)
AMOUNT = re.compile(r"\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b")
NOISE = re.compile(r"Report of the Auditor-?General|for the year ended|^\s*S/?No\.?\s*$|AUDITOR-GENERAL", re.I)
BULLETS = dict.fromkeys(map(ord, "•▪●"), None)

def clean(c):
    return " ".join(str(c or "").translate(BULLETS).split())

def is_header(cells):
    j = " ".join(cells).lower()
    return any(h in j for h in ("s/no", "project name", "observation", "remarks", "payee")) and not AMOUNT.search(" ".join(cells))

recs = []
pdfs = sorted(CORPUS.glob("*.pdf"))
for pdf in pdfs:
    try:
        with pdfplumber.open(pdf) as doc:
            start = next((i for i, p in enumerate(doc.pages) if APPENDIX.search(p.extract_text() or "")), None)
            if start is None:
                continue
            title = ""
            for page in doc.pages[start:]:
                t = page.extract_text() or ""
                m = APPENDIX.search(t)
                if m:
                    title = " ".join(t[m.start():].split("\n")[0].split())
                for table in page.extract_tables():
                    for row in table:
                        cells = [c for c in (clean(x) for x in row) if c]
                        if not cells or is_header(cells):
                            continue
                        joined = " | ".join(cells)
                        if NOISE.search(joined) or len(joined) < 12:
                            continue
                        amts = AMOUNT.findall(joined)
                        # Merge into the previous row ONLY when this is a genuine
                        # spill-over line: no leading serial number AND no amount
                        # of its own. A row that carries its own amount is a new
                        # project even when the table has no serial-number column
                        # (otherwise a whole table collapses into row 1).
                        if (recs and not re.match(r"^\d{1,3}[.)]?$", cells[0])
                                and not amts and recs[-1]["source_pdf"] == pdf.name):
                            recs[-1]["cells"][-1] += " " + " ".join(cells)
                            continue
                        recs.append({
                            "source_pdf": pdf.name, "page": page.page_number,
                            "appendix": title, "cells": cells,
                            "amount_kshs": amts[0].replace(",", "") if amts else None,
                        })
    except Exception as e:
        print(f"ERR {pdf.name}: {e}")

OUT.write_text(json.dumps(recs, indent=2, ensure_ascii=False))
print(f"{base.name}: {len(recs)} appendix rows from {len(pdfs)} PDFs")
