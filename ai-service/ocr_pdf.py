#!/usr/bin/env python3
"""
ocr_pdf.py — recover the text of a scanned OAG PDF.

Most OAG reports ship a real text layer. A few are scans of paper, and
pdfplumber extracts nothing from them: the report is held by the platform,
counted in the corpus, and never cited, because there is no text to retrieve.

This renders each page to an image and runs Tesseract over it, writing the
result to a sidecar file next to the PDF:

    documents/ocr/<pdf-stem>.json   ->  {"pages": {"7": "1.0 EXECUTIVE ..."}}

`ingest.py` reads that sidecar for any page whose embedded text layer is empty,
and tags the resulting chunks `text_source: "ocr"` so an answer built on
machine-read text is distinguishable from one read out of a publisher's own
text layer. That distinction matters here: OCR misreads digits, and this
platform's core promise is about figures.

Requires: pdftoppm (poppler-utils) and tesseract.

Usage:
    python ocr_pdf.py documents/Some-Scanned-Report.pdf
    python ocr_pdf.py --all          # every PDF with no usable text layer
"""

import argparse
import json
import logging
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pdfplumber

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("ocr_pdf")

DOCUMENTS_DIR = Path(__file__).resolve().parent / "documents"
OCR_DIR = DOCUMENTS_DIR / "ocr"

RENDER_DPI = 300          # below ~200 Tesseract's accuracy falls off sharply
MIN_CHARS_PER_PAGE = 30   # same threshold ingest.py uses to call a page empty


def _require(binary: str) -> None:
    if shutil.which(binary) is None:
        sys.exit(f"error: `{binary}` not found. Install poppler-utils and tesseract-ocr.")


def pages_without_text(pdf_path: Path) -> list[int]:
    """1-indexed pages whose embedded text layer is empty or near-empty."""
    empty = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for n, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if len(text.strip()) < MIN_CHARS_PER_PAGE:
                empty.append(n)
    return empty


def ocr_page(pdf_path: Path, page_no: int, workdir: Path) -> str:
    stem = workdir / f"p{page_no}"
    subprocess.run(
        ["pdftoppm", "-r", str(RENDER_DPI), "-f", str(page_no), "-l", str(page_no),
         "-png", str(pdf_path), str(stem)],
        check=True, capture_output=True,
    )
    images = sorted(workdir.glob(f"p{page_no}-*.png")) or sorted(workdir.glob(f"p{page_no}.png"))
    if not images:
        return ""
    # --psm 6: assume a single uniform block of text. These are report pages,
    # not multi-column layouts, and psm 6 is markedly steadier on them than the
    # default automatic segmentation.
    out = subprocess.run(
        ["tesseract", str(images[0]), "-", "--psm", "6"],
        check=True, capture_output=True, text=True,
    )
    return out.stdout.strip()


def ocr_pdf(pdf_path: Path) -> dict:
    targets = pages_without_text(pdf_path)
    if not targets:
        logger.info(f"• {pdf_path.name}: text layer already present on every page — nothing to do")
        return {}

    logger.info(f"→ {pdf_path.name}: OCR-ing {len(targets)} page(s) at {RENDER_DPI} dpi")
    pages: dict[str, str] = {}
    with tempfile.TemporaryDirectory() as td:
        workdir = Path(td)
        for i, page_no in enumerate(targets, start=1):
            try:
                text = ocr_page(pdf_path, page_no, workdir)
            except subprocess.CalledProcessError as e:
                logger.warning(f"   page {page_no}: OCR failed ({e})")
                continue
            if len(text) >= MIN_CHARS_PER_PAGE:
                pages[str(page_no)] = text
            if i % 10 == 0 or i == len(targets):
                logger.info(f"   {i}/{len(targets)} pages")

    OCR_DIR.mkdir(parents=True, exist_ok=True)
    sidecar = OCR_DIR / f"{pdf_path.stem}.json"
    payload = {
        "pdf": pdf_path.name,
        "engine": "tesseract",
        "dpi": RENDER_DPI,
        "pages_attempted": len(targets),
        "pages_recovered": len(pages),
        "pages": pages,
    }
    sidecar.write_text(json.dumps(payload, ensure_ascii=False, indent=1))
    logger.info(f"✅ {pdf_path.name}: recovered {len(pages)}/{len(targets)} pages → {sidecar.relative_to(DOCUMENTS_DIR.parent)}")
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", nargs="?", help="path to a PDF (default: --all)")
    ap.add_argument("--all", action="store_true", help="every PDF lacking a usable text layer")
    args = ap.parse_args()

    _require("pdftoppm")
    _require("tesseract")

    if args.all:
        pdfs = sorted(DOCUMENTS_DIR.glob("*.pdf"))
    elif args.pdf:
        pdfs = [Path(args.pdf)]
    else:
        ap.error("give a PDF path or --all")

    for pdf in pdfs:
        if not pdf.exists():
            logger.error(f"❌ not found: {pdf}")
            continue
        ocr_pdf(pdf)


if __name__ == "__main__":
    main()
