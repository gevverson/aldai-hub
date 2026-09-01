#!/usr/bin/env python3
"""
ingest_all.py — batch-ingest every OAG PDF in ./documents into ChromaDB.

These are the official Office of the Auditor-General reports for Nandi County
(NG-CDF per constituency, the County Executive, County Assembly, and county
funds) downloaded from oagkenya.go.ke. Each is chunked page-by-page with the
page number stored in metadata, so the AI Audit Translator can cite an answer
down to the report + page instead of relying on hand-written summaries.

Idempotent: a document already present in the collection is skipped, so this
is safe to run on every deploy.

Usage:
    python ingest_all.py            # ingest anything not already indexed
    python ingest_all.py --force    # re-ingest everything (after a wipe)
"""

import argparse
import logging
import re
import sys

import ingest as ingest_module
from ingest import DOCUMENTS_DIR, get_collection

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("ingest_all")


def meta_from_filename(name: str):
    """Derive a human document name + financial year from the OAG filename."""
    stem = name[:-4] if name.lower().endswith(".pdf") else name
    m = re.search(r"(\d{4})[-_](\d{4})", stem)
    year = f"{m.group(1)}/{m.group(2)}" if m else "unknown"
    label = re.sub(r"[-_]?\d{4}[-_]\d{4}.*$", "", stem).replace("-", " ").strip()
    label = re.sub(r"\s+", " ", label)
    # Not every OAG document is a financial-year report — special audits (the
    # Covid-19 vaccine roll-out, for one) carry no FY in the filename. Printing
    # "(OAG FYunknown)" in a citation looks like a bug in the very thing this
    # platform asks readers to trust, so omit the year rather than fake one.
    suffix = f" (OAG FY{year})" if year != "unknown" else " (OAG special audit)"
    return f"{label}{suffix}", year


def already_indexed():
    return {d["document_name"] for d in ingest_module.list_ingested_documents()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true",
                    help="re-ingest even documents already in the collection")
    args = ap.parse_args()

    pdfs = sorted(DOCUMENTS_DIR.glob("*.pdf"))
    if not pdfs:
        logger.error(f"No PDFs found in {DOCUMENTS_DIR}")
        sys.exit(1)

    # Touch the collection once so a cold start doesn't race the first ingest.
    get_collection()
    indexed = set() if args.force else already_indexed()

    total_docs = total_chunks = 0
    skipped = 0
    empty: list[str] = []   # PDFs with no extractable text layer
    for pdf in pdfs:
        doc_name, year = meta_from_filename(pdf.name)
        if doc_name in indexed:
            logger.info(f"• skip (already indexed): {doc_name}")
            skipped += 1
            continue
        try:
            result = ingest_module.ingest_pdf(
                file_path=str(pdf),
                document_name=doc_name,
                year=year,
                source="Office of the Auditor-General, Kenya",
            )
            chunks = result.get("chunks_created", 0)
            total_docs += 1
            total_chunks += chunks
            if chunks == 0:
                # A scanned PDF with no text layer extracts to nothing and would
                # otherwise be counted as ingested while contributing zero
                # searchable content — the AI would simply never cite it.
                empty.append(pdf.name)
                logger.warning(
                    f"⚠️  {doc_name}: 0 chunks — no extractable text "
                    f"(scanned image?). This report will NOT be searchable."
                )
            else:
                logger.info(
                    f"✅ {doc_name}: {chunks} chunks, "
                    f"{result.get('pages_processed', 0)} pages"
                )
        except Exception as e:
            logger.error(f"❌ {pdf.name}: {e}")

    logger.info(
        f"\nDone. Ingested {total_docs - len(empty)} searchable documents "
        f"({total_chunks} chunks), skipped {skipped} already-indexed."
    )
    if empty:
        logger.warning(
            f"\n⚠️  {len(empty)} PDF(s) yielded no text and are not searchable:"
        )
        for name in empty:
            logger.warning(f"     - {name}")
        logger.warning(
            "   Recover them with:  python ocr_pdf.py <path-to-pdf>\n"
            "   (or `python ocr_pdf.py --all`), then re-run this with --force.\n"
            "   Until then the platform holds them but cannot cite them."
        )


if __name__ == "__main__":
    main()
