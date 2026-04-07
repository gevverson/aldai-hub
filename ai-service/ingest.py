"""
ingest.py — PDF ingestion and chunking pipeline
Macho ya Mwananchi | AI Audit RAG Service

Ingests OAG PDF reports, chunks them, and stores in ChromaDB.

Embedding strategy:
  Uses chromadb's built-in DefaultEmbeddingFunction (onnxruntime-based,
  ~40MB total vs 2.5GB for PyTorch/sentence-transformers).
  No GPU needed. Works on any Nairobi VPS.
"""

import logging
import uuid
from pathlib import Path

import pdfplumber
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────
CHROMA_DIR      = Path(__file__).parent / "chroma_db"
DOCUMENTS_DIR   = Path(__file__).parent / "documents"
COLLECTION_NAME = "oag_audit_reports"
CHUNK_SIZE      = 800
CHUNK_OVERLAP   = 120


def get_collection():
    """
    Return (or create) the Chroma collection using the lightweight
    onnxruntime-based DefaultEmbeddingFunction (no PyTorch needed).
    """
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=DefaultEmbeddingFunction(),
        metadata={"hnsw:space": "cosine"},
    )


def _add_chunks(chunks: list[str], metadatas: list[dict]):
    """Batch-insert text chunks into ChromaDB."""
    col   = get_collection()
    BATCH = 200  # keep batches small for memory safety on a VPS
    for i in range(0, len(chunks), BATCH):
        batch_chunks = chunks[i : i + BATCH]
        batch_meta   = metadatas[i : i + BATCH]
        batch_ids    = [str(uuid.uuid4()) for _ in batch_chunks]
        col.add(
            documents=batch_chunks,
            metadatas=batch_meta,
            ids=batch_ids,
        )


def ingest_text_directly(
    text: str,
    document_name: str,
    year: str,
    source: str = "OAG Kenya",
    page_number: int = 1,
) -> dict:
    """
    Ingest a plain-text string (e.g. the built-in OAG knowledge base).
    Returns stats dict: {chunks_created, document_name, pages_processed}.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", "---", " ", ""],
    )
    chunks = splitter.split_text(text)
    if not chunks:
        return {"chunks_created": 0, "document_name": document_name, "pages_processed": 0}

    metadatas = [
        {
            "source":        source,
            "document_name": document_name,
            "year":          year,
            "page_number":   str(page_number + i),
            "chunk_index":   str(i),
        }
        for i, _ in enumerate(chunks)
    ]

    _add_chunks(chunks, metadatas)
    logger.info(f"[INGEST] '{document_name}' → {len(chunks)} chunks stored")
    return {
        "chunks_created":  len(chunks),
        "document_name":   document_name,
        "pages_processed": 1,
    }


def ingest_pdf(
    file_path: str,
    document_name: str,
    year: str,
    source: str = "OAG Kenya",
) -> dict:
    """
    Ingest an OAG PDF report into ChromaDB.

    Steps:
    1. Open PDF with pdfplumber
    2. Extract text page by page
    3. Chunk with RecursiveCharacterTextSplitter (800 chars, 120 overlap)
    4. Store in ChromaDB with source metadata for citation
    5. Return {chunks_created, document_name, pages_processed}
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", "---", ". ", " ", ""],
    )

    all_chunks: list[str]  = []
    all_meta:   list[dict] = []
    pages_processed = 0

    logger.info(f"[INGEST] Opening: {path.name}")
    with pdfplumber.open(str(path)) as pdf:
        total_pages = len(pdf.pages)
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text or len(text.strip()) < 30:
                continue
            for idx, chunk in enumerate(splitter.split_text(text)):
                all_chunks.append(chunk)
                all_meta.append({
                    "source":        source,
                    "document_name": document_name,
                    "year":          year,
                    "page_number":   str(page_num),
                    "chunk_index":   str(idx),
                    "total_pages":   str(total_pages),
                })
            pages_processed += 1

    if not all_chunks:
        logger.warning(f"[INGEST] No text found in '{document_name}' — may be image-scanned")
        return {
            "chunks_created":  0,
            "document_name":   document_name,
            "pages_processed": 0,
            "warning":         "No extractable text. PDF may be image-based — use OCR first.",
        }

    _add_chunks(all_chunks, all_meta)
    logger.info(f"[INGEST] ✅ '{document_name}': {len(all_chunks)} chunks, {pages_processed} pages")
    return {
        "chunks_created":  len(all_chunks),
        "document_name":   document_name,
        "pages_processed": pages_processed,
    }


def list_ingested_documents() -> list[dict]:
    """Return unique documents currently indexed in ChromaDB."""
    try:
        col     = get_collection()
        results = col.get(include=["metadatas"])
        metas   = results.get("metadatas") or []
        seen: dict[str, dict] = {}
        for m in metas:
            name = m.get("document_name", "Unknown")
            if name not in seen:
                seen[name] = {
                    "document_name": name,
                    "year":          m.get("year", ""),
                    "source":        m.get("source", "OAG Kenya"),
                }
        return list(seen.values())
    except Exception as e:
        logger.error(f"[INGEST] list error: {e}")
        return []
