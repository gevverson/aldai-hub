"""
main.py — FastAPI entry point for the Macho ya Mwananchi AI RAG microservice
Port: 8001  (Node.js proxies from /api/audit/* → http://localhost:8001/*)

Endpoints:
  POST /query      — Citizen Q&A against OAG audit documents
  POST /ingest     — Admin: upload a new PDF for ingestion
  GET  /documents  — List all ingested documents
  GET  /health     — Health check

On startup: automatically ingests the built-in OAG knowledge base (from text)
so the service works immediately without any PDFs uploaded.
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

import ingest as ingest_module
import query as query_module

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("macho-audit-ai")

# ── Built-in OAG knowledge base (text, pre-seeded on startup) ─
OAG_SEED_TEXT = """
============================================================
OFFICIAL OAG AUDIT INTELLIGENCE — NANDI COUNTY / ALDAI NG-CDF
Kenya Office of the Auditor-General Reports FY 2018/19 | FY 2019/20 | FY 2020/21 | FY 2023/24
============================================================

--- GHOST PROJECTS (Projects paid for but physically non-existent) ---

1. KIMAREN GIRLS SECONDARY SCHOOL — Kemeloi-Maraba Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 3,200,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 42
   Official Status: "COMPLETE" — PHYSICAL VERIFICATION: DOES NOT EXIST
   Finding: Auditors visited GPS coordinates. No school structure found. Empty field.
   No foundation, gate, fencing, or signage. Payment vouchers confirm Ksh 3.2M disbursed.
   No completion certificate exists. Contractor identity unverifiable.
   Responsible Officer: NG-CDF Fund Account Manager Cornelius Serem
   EACC Tracking Code: GHOST-KIM-19
   Severity: CRITICAL

--- STALLED / ABANDONED INFRASTRUCTURE ---

2. KAPSABET MOTHER AND BABY UNIT — Kapsabet Ward
   Fund: County Government | Year: FY 2019/20 | Allocated: Ksh 208,800,000
   OAG Reference: Nandi County Audit Report FY2019/20, Page 88
   Official Status: "ONGOING" — COMMUNITY STATUS: STALLED 4+ YEARS PAST DEADLINE
   Finding: Construction halted. No meaningful progress for over 4 years past deadline.
   Contractor absent. No penalty for abandonment despite binding contractual obligation.
   Maternal health services severely compromised. No completion certificate issued.
   Responsible Officer: County Executive Committee Member, Health Department
   Tracking Code: STALL-KBT-MBU-19
   Severity: HIGH

3. KABIYET DAIRY CREAMERY — Kabiyet Ward
   Fund: County Government | Years: FY 2016–2021 | Total Allocated: Ksh 621,000,000
   OAG Reference: Multiple — FY16/17, FY17/18, FY18/19, FY19/20, FY20/21
   Official Status: "UNDER CONSTRUCTION" — COMMUNITY STATUS: STALLED 8+ YEARS, NEVER OPERATIONAL
   Finding: Ksh 621 million disbursed across multiple years. Facility never operational.
   Cost exceeds market rate for equivalent facility by approximately 340%.
   Auditors flagged inflated procurement in FY17/18. No contractor penalty. Ghost beneficiary allegations.
   Responsible Officer: County Director of Agriculture and Procurement Unit
   Severity: CRITICAL

4. KAPSENGERE HOSPITAL PHASE II — Terik Ward
   Fund: County Government | Year: FY 2019/20 | Allocated: Ksh 9,954,900
   OAG Reference: Nandi County Audit Report FY2019/20, Page 94
   Official Status: "COMPLETE" — PHYSICAL VERIFICATION: COMPLETELY ABANDONED
   Finding: Site physically abandoned. Access ramp structurally defective — safety hazard.
   OAG engineers recommended immediate demolition. Ksh 9.9M paid to contractor who vacated.
   Patients cannot safely access facility. No completion certificate.
   Responsible Officer: County Director of Infrastructure
   Severity: HIGH

5. KOBUJOI SUB-COUNTY HOSPITAL — Kobujoi Ward
   Fund: County Government | Year: FY 2020/21 | Allocated: Ksh 3,292,946
   OAG Reference: Nandi County Audit Report FY2020/21, Page 71
   Finding: AUDIT OBSTRUCTION — Signed contract documents withheld from auditors.
   Payment vouchers of Ksh 3.2M missing from audit trail.
   Classified as obstruction of audit. Work minimal relative to amount paid.
   Potential fraudulent payment to connected contractors flagged.
   EACC Whistleblower Code: OBST-KBJ-20
   Severity: CRITICAL

--- PAYROLL FRAUD (NANDI COUNTY GOVERNMENT) ---

6. GHOST EMPLOYEES — COUNTY PAYROLL FRAUD
   OAG Reference: Nandi County Audit Report FY2019/20 and FY2023/24, Pages 12–28
   Finding: 1,885 ghost employees identified on Nandi County payroll.
   Ksh 3,300,000,000 (Ksh 3.3 BILLION) in fraudulent salary payments.
   Many entries: duplicated national ID numbers, deceased persons, non-existent individuals
   registered in remote villages. Active EACC investigation ongoing.
   Responsible Officers: County Secretary and Human Resource Director
   Report to: DCI — 0800 722 203
   Severity: CRITICAL / EACC ACTIVE INVESTIGATION

--- BURSARY FRAUD ---

7. STUDENT BURSARY DISBURSEMENT — MISSING RECEIPTS
   Fund: NG-CDF Bursary | OAG Reference: Nandi NG-CDF Audit FY2019/20
   Amount: Ksh 50,200,000 (fifty million two hundred thousand)
   Finding: Bursary funds disbursed to 847 students with NO acknowledgement receipts.
   No proof that funds reached eligible students. Risk of diversion to ghost beneficiaries.
   Supporting documents requested by auditors were not produced.
   Severity: HIGH

--- LAND AND ASSET IRREGULARITIES ---

8. MOGOMBEN PRIMARY SCHOOL LAND — Kemeloi-Maraba Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 1,000,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 55
   Finding: 1.2 acres purchased. No title deed transferred to school.
   Land remains legally in seller's name. Risk of future dispossession.
   Severity: HIGH

9. KIPLENGWAI PRIMARY SCHOOL LAND — Kaptumo-Kaboi Ward
   Fund: NG-CDF | Year: FY 2019/20 | Allocated: Ksh 1,200,000
   OAG Reference: Nandi NG-CDF Audit Report FY2019/20, Page 57
   Finding: Land purchased without title deed or survey beacons.
   No physical boundary survey. Market value estimated at Ksh 650,000 vs Ksh 1.2M paid.
   Auditors flagged potential kickback conduit through inflated purchase price.
   Severity: HIGH

--- MEDICAL INSURANCE IRREGULARITY ---

10. MEDICAL INSURANCE CONTRACT — COUNTY-WIDE
    Fund: County Government | Year: FY 2023/24 | Contract Value: Ksh 175,000,000
    OAG Reference: Nandi County Audit Report FY2023/24
    Finding: Contract worth Ksh 175 million AWARDED before tender evaluation was completed.
    This violates Kenya Public Procurement and Asset Disposal Act 2015.
    Evaluation documents post-dated the contract award date — evidence of retroactive fabrication.
    Severity: CRITICAL

--- HEALTH FACILITY CLOSURES ---

11. 144 HEALTH FACILITIES — NANDI COUNTY
    OAG Reference: Nandi County Health Audit FY2019/20 and FY2023/24
    Finding: 144 health facilities operating below minimum WHO/MoH standards.
    Drugs reported purchased and delivered — not found at dispensaries during audit.
    Medical equipment procured on paper — absent from facility inventories.
    Citizens paying for private healthcare that public funds already covered.
    Severity: HIGH

--- ACCOUNTABILITY SUMMARY ---
Total Nandi County funds tracked: Ksh 50+ BILLION (cumulative)
Active EACC investigation: Ksh 3.3 BILLION payroll fraud
Stalled/abandoned projects (2018/2019 audit alone): 491
Health facilities shut down: 144
Responsible oversight body: Nandi County Assembly — accountability rating: POOR
EACC cases from these findings: 4 active as of FY2021

--- HOW TO REPORT (FREE, ANONYMOUS) ---
EACC: 0800 720 629 (free call, 24/7)
DCI: 0800 722 203 (free call)
Controller of Budget: cob@cob.go.ke
PPOA: ppoa@ppoa.go.ke
Macho ya Mwananchi: anonymous report form (zero identity data stored)
============================================================
"""


# ── App lifespan: seed OAG knowledge on startup ──────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed the built-in OAG knowledge base on first startup."""
    logger.info("🦅 Macho ya Mwananchi AI Service starting up…")

    docs = ingest_module.list_ingested_documents()
    built_in_present = any(
        d.get("document_name") == "OAG_BUILTIN_NANDI_KNOWLEDGE"
        for d in docs
    )

    if not built_in_present:
        logger.info("[STARTUP] Seeding built-in OAG knowledge base into ChromaDB…")
        result = ingest_module.ingest_text_directly(
            text=OAG_SEED_TEXT,
            document_name="OAG_BUILTIN_NANDI_KNOWLEDGE",
            year="2018–2024",
            source="OAG Kenya (Built-in)",
        )
        logger.info(f"[STARTUP] ✅ Built-in OAG knowledge seeded: {result['chunks_created']} chunks")
    else:
        logger.info("[STARTUP] Built-in OAG knowledge already present — skipping seed")

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
        "api_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
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
    if admin_token and x_admin_token != admin_token:
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
