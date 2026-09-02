"""
main.py — FastAPI entry point for the Macho ya Mwananchi AI RAG microservice
Port: 8001  (Node.js proxies from /api/audit/* → http://localhost:8001/*)

Endpoints:
  POST /query      — Citizen Q&A against OAG audit documents
  POST /ingest     — Admin: upload a new PDF for ingestion
  GET  /documents  — List all ingested documents
  GET  /health     — Health check

On startup: purges the retired hand-written summary from the index, then
(optionally) indexes the 46 signed OAG PDFs in ./documents. Answers are
grounded in those PDFs only — if the corpus is not indexed, the service says
so rather than answering from memory.
"""

import os
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "server" / ".env")  # share .env with Node
load_dotenv()  # also load from ai-service/.env if present

import coverage
import ingest as ingest_module
import query as query_module

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("macho-audit-ai")

# ── Corpus provenance ────────────────────────────────────────
# There used to be a 7,000-character hand-written "built-in OAG knowledge base"
# seeded here on every startup. It was retired: it named individual officers as
# responsible for fraud and quoted an EACC tracking code, none of which appear
# anywhere in the 46 signed Auditor-General PDFs this platform actually ships.
# A site that promises "nothing is estimated" cannot answer from an unsourced
# summary. Answers now come only from the indexed PDFs — see ingest_all.py.
BUILTIN_SUMMARY_DOC = "OAG_BUILTIN_NANDI_KNOWLEDGE"


def _purge_builtin_summary() -> None:
    """Delete the retired hand-written summary from any index that still has it.

    The blob is gone from the source, but an index that outlives a deploy (a
    baked image, a mounted disk, a developer's local chroma_db) would keep
    serving it. Removing it at startup makes the retirement stick everywhere.
    """
    try:
        col = ingest_module.get_collection()
        existing = col.get(where={"document_name": BUILTIN_SUMMARY_DOC}, include=[])
        stale_ids = existing.get("ids", [])
        if stale_ids:
            col.delete(ids=stale_ids)
            logger.warning(
                "[STARTUP] purged %d chunk(s) of the retired built-in summary "
                "from the index", len(stale_ids),
            )
    except Exception as exc:  # never block startup on a cleanup
        logger.error("[STARTUP] could not purge built-in summary: %s", exc)


# ── App lifespan ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start clean: drop the retired summary, then index the real corpus."""
    logger.info("🦅 Macho ya Mwananchi AI Service starting up…")

    _purge_builtin_summary()

    # The corpus is normally baked into the index at build time (see the
    # buildCommand in render.yaml and the RUN step in the Dockerfile), which
    # is what makes it survive a cold start on an ephemeral disk.
    #
    # This flag is the escape hatch for environments where the build step did
    # not run. Embeddings are computed locally by ChromaDB's ONNX model, so
    # ingestion costs CPU time, not API quota — but it takes minutes, so it
    # runs in a background thread and the health check answers immediately.
    # Off by default. Set INGEST_CORPUS_ON_STARTUP=1 to enable.
    if os.getenv("INGEST_CORPUS_ON_STARTUP") == "1":
        import threading, subprocess, sys as _sys

        def _ingest_corpus():
            logger.info("[STARTUP] background corpus ingestion started")
            try:
                subprocess.run([_sys.executable, "ingest_all.py"], check=True, cwd=str(Path(__file__).parent))
                logger.info("[STARTUP] ✅ corpus ingestion finished")
            except Exception as exc:
                logger.error(f"[STARTUP] corpus ingestion failed: {exc}")

        threading.Thread(target=_ingest_corpus, daemon=True).start()
    else:
        indexed = len({d.get("document_name") for d in ingest_module.list_ingested_documents()})
        shipped = len(list((Path(__file__).parent / "documents").glob("*.pdf")))
        if indexed:
            logger.info("[STARTUP] %d document(s) indexed from %d shipped PDFs", indexed, shipped)
        else:
            logger.error(
                "[STARTUP] index is EMPTY — %d PDFs shipped but none indexed. "
                "Audit AI will decline every question until the corpus is built. "
                "Run ingest_all.py, or set INGEST_CORPUS_ON_STARTUP=1.", shipped,
            )

    logger.info("🤖 AI service ready on http://localhost:8001")
    logger.info("   'Ukweli ni nguvu.' — The truth is power.")
    yield
    logger.info("🦅 AI service shutting down…")


# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="Macho ya Mwananchi — AI Audit Service",
    description=(
        "RAG microservice powering the AI Audit Translator. "
        "Answers citizen questions about Nandi County public funds "
        "using official Auditor-General reports."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

_allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3001,http://localhost:5173").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Request/Response models ───────────────────────────────────
class QueryRequest(BaseModel):
    question:     str              = Field(..., min_length=3, max_length=1000)
    language:     str | None       = Field(None, pattern="^(sw|en)$")
    ward_context: str | None       = None


class IngestResponse(BaseModel):
    success:         bool
    chunks_created:  int
    document_name:   str
    pages_processed: int
    message:         str


# ── Endpoints ─────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check — used by Node.js proxy to verify service availability."""
    docs = ingest_module.list_ingested_documents()
    return {
        "status":     "ok",
        "service":    "Macho ya Mwananchi AI Audit Service",
        "model":      query_module.MODEL,
        "documents":  len(docs),
        "api_key_set": bool(os.getenv("GEMINI_API_KEY")),
        # What the corpus actually reaches. The service can only answer from
        # ingested reports, so a reader is entitled to know which counties
        # those are before their question is declined.
        "coverage":   coverage.summarise(docs),
        "message":    "Ukweli ni nguvu. 🇰🇪",
    }


@app.post("/query")
async def query_endpoint(body: QueryRequest):
    """
    Main citizen Q&A endpoint.
    Accepts a question in English or Swahili.
    Returns a structured audit answer with source citations.
    """
    result = await query_module.answer_question(
        question=body.question,
        language=body.language,
        ward_context=body.ward_context,
    )

    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])

    return {"success": True, **result}


@app.post("/ingest", response_model=IngestResponse)
async def ingest_pdf_endpoint(
    file:          UploadFile = File(...),
    document_name: str        = Form(...),
    year:          str        = Form(...),
    source:        str        = Form("OAG Kenya"),
    x_admin_token: str | None = Header(None),
):
    """
    Admin endpoint: Upload a new OAG PDF report for ingestion.
    Protected by X-Admin-Token header (must match ADMIN_TOKEN env var).
    """
    admin_token = os.getenv("ADMIN_TOKEN", "")
    if not admin_token or x_admin_token != admin_token:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid admin token")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save uploaded PDF to documents/ folder
    save_path = ingest_module.DOCUMENTS_DIR / file.filename
    content   = await file.read()

    with open(save_path, "wb") as f:
        f.write(content)

    logger.info(f"[INGEST] Received PDF: {file.filename} ({len(content):,} bytes)")

    try:
        result = ingest_module.ingest_pdf(
            file_path=str(save_path),
            document_name=document_name,
            year=year,
            source=source,
        )
        return IngestResponse(
            success=True,
            chunks_created=result["chunks_created"],
            document_name=result["document_name"],
            pages_processed=result["pages_processed"],
            message=(
                f"✅ '{document_name}' ingested successfully: "
                f"{result['chunks_created']} chunks from {result['pages_processed']} pages."
            ),
        )
    except Exception as e:
        logger.error(f"[INGEST] Error ingesting {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.get("/documents")
async def list_documents():
    """List all documents currently indexed in ChromaDB."""
    docs = ingest_module.list_ingested_documents()
    return {
        "count":     len(docs),
        "coverage":  coverage.summarise(docs),
        "documents": docs,
    }


# ── Dev entry point ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info",
    )
