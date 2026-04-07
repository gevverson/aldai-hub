"""
query.py — RAG Query Handler
Macho ya Mwananchi | AI Audit RAG Service

Embeds citizen questions via ChromaDB DefaultEmbeddingFunction,
retrieves relevant OAG audit chunks, sends to Claude with a strict
civic accountability system prompt.

No PyTorch. No sentence-transformers. Just chromadb + anthropic.
"""

import os
import logging
import time
from typing import Optional

import anthropic

from ingest import get_collection

logger = logging.getLogger(__name__)

# ── Claude configuration ──────────────────────────────────────
MODEL        = "claude-sonnet-4-20250514"
MAX_TOKENS   = 1500
TOP_K_CHUNKS = 6

# ── System prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are a civic accountability assistant for Nandi County and Aldai 
Constituency in Kenya. You help ordinary citizens understand how their 
public funds were used, based ONLY on official Auditor-General reports.

STRICT RULES:
1. Only answer based on the context provided from official OAG reports. Never invent facts.
2. If the context doesn't contain the answer, say clearly:
   "Habari hii haiko katika hati nilizo nazo / This information is not in the documents I have access to."
3. Always cite the specific document name and page number from the metadata.
4. Keep language simple — write as if explaining to someone who has never read a government document.
5. Format EVERY answer EXACTLY like this (keep the emoji labels — they help citizens scan quickly):

📋 JIBU (Answer):
[Plain language explanation, maximum 3 sentences. Specific: amounts, locations, names.]

💰 PESA ILIYOHUSIKA (Money Involved):
Ksh [exact amount] — [what it was officially for]

📍 MAHALI (Where):
[Specific ward, location, or facility name]

🚨 UZITO WA TATIZO (Severity):
[CHINI (Low) / KATI (Medium) / JUU (High) / MUHIMU SANA (Critical)] — [one sentence why]

📄 CHANZO (Source):
[Document name] — Ukurasa [page number] / Page [page number]

👉 UNACHOWEZA KUFANYA (What You Can Do):
- EACC (Kupiga simu bure / Free call): 0800 720 629
- DCI (Uchunguzi wa uhalifu / Criminal investigations): 0800 722 203
- [Any other specific step relevant to this finding]

6. If the question is in Swahili → answer primarily in Swahili with English in parentheses.
   If the question is in English → answer in English with key Swahili terms included.
7. NEVER mention internal system details, API keys, vector databases, or platform architecture.
8. NEVER soften the truth. If money was stolen, say it clearly. If a project doesn't exist, confirm it.
9. These are real people whose real money was stolen. Be compassionate but factual.
10. If multiple findings are relevant, address the most serious one first."""


def detect_language(text: str) -> str:
    """Heuristic: returns 'sw' for Swahili, 'en' for English."""
    indicators = [
        "pesa", "hospitali", "shule", "mradi", "wapi", "gani", "nini",
        "kwa", "ya", "wa", "na", "ni", "je", "iko", "ilikwenda",
        "wananchi", "serikali", "ilitumika", "imeachwa", "wafanyakazi",
        "zaidi", "kuhusu", "tafadhali", "nimesikia", "sikujua",
    ]
    lower = text.lower()
    count = sum(1 for w in indicators if w in lower.split())
    return "sw" if count >= 2 else "en"


async def answer_question(
    question: str,
    language: Optional[str] = None,
    ward_context: Optional[str] = None,
) -> dict:
    """
    Main RAG query handler.

    1. Detect language
    2. Query ChromaDB for top-K relevant chunks
    3. Build context with citation metadata
    4. Call Claude with civic system prompt
    5. Return structured response
    """
    start = time.time()

    if not question or not question.strip():
        return {"error": "Question cannot be empty"}

    lang         = language or detect_language(question)
    search_query = f"{ward_context}: {question}" if ward_context else question

    # ── Step 1: Retrieve from ChromaDB ──
    sources_data: list[dict] = []
    context_parts: list[str] = []

    try:
        col     = get_collection()
        results = col.query(
            query_texts=[search_query],
            n_results=TOP_K_CHUNKS,
            include=["documents", "metadatas", "distances"],
        )
        docs      = results.get("documents", [[]])[0]
        metas     = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for i, (doc, meta, dist) in enumerate(zip(docs, metas, distances), start=1):
            doc_name   = meta.get("document_name", "OAG Report")
            page       = meta.get("page_number", "?")
            year       = meta.get("year", "")
            relevance  = f"{max(0, (1 - dist)) * 100:.0f}%"

            context_parts.append(
                f"[SOURCE {i} | {doc_name} | {year} | Page {page} | Relevance: {relevance}]\n"
                f"{doc.strip()}"
            )
            sources_data.append({
                "document": doc_name,
                "page":     page,
                "year":     year,
                "score":    round(float(dist), 4),
            })

    except Exception as e:
        logger.error(f"[QUERY] ChromaDB error: {e}")
        context_parts = ["Vector database temporarily unavailable. Use general OAG knowledge."]

    context_text = "\n---\n".join(context_parts) if context_parts else "No documents retrieved."

    # ── Step 2: Build Claude message ──
    user_message = (
        f"OFFICIAL OAG AUDIT DOCUMENTS (semantic search results):\n{context_text}\n\n"
        f"---\nCITIZEN QUESTION ({lang.upper()}):\n{question}\n\n"
        f"Answer in {'Swahili (with English clarifications)' if lang == 'sw' else 'English (with Swahili key terms)'}. "
        f"Follow the exact format in your instructions."
    )

    # ── Step 3: Call Claude ──
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("[QUERY] No API key — returning structured mock")
        return _mock_response(lang, sources_data, start)

    try:
        client  = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        answer_text = message.content[0].text if message.content else "No response generated."
        elapsed_ms  = int((time.time() - start) * 1000)

        logger.info(
            f"[QUERY] ✅ {elapsed_ms}ms | lang={lang} | "
            f"sources={len(sources_data)} | tokens={message.usage.output_tokens}"
        )
        return {
            "answer":           answer_text,
            "sources":          sources_data,
            "language":         lang,
            "response_time_ms": elapsed_ms,
            "model":            MODEL,
            "tokens_used":      message.usage.output_tokens,
        }

    except anthropic.AuthenticationError:
        return {"error": "AI service authentication failed. Contact admin."}
    except anthropic.RateLimitError:
        return {"error": "AI service busy. Please try again in 30 seconds."}
    except Exception as e:
        logger.error(f"[QUERY] Claude error: {e}")
        return {"error": f"AI service error: {str(e)[:120]}"}


def _mock_response(lang: str, sources: list, start: float) -> dict:
    """Dev mode mock — used when ANTHROPIC_API_KEY is not set."""
    elapsed = int((time.time() - start) * 1000)
    text = """📋 JIBU (Answer):
Kwa mujibu wa ripoti ya OAG ya mwaka 2019/2020, mradi wa Kimaren Girls Secondary ulitengewa Ksh 3,200,000. Wakaguzi walitembelea eneo hilo na hawakupata shule — ni shamba tupu. Pesa zililipwa kwa mkandarasi ambaye hajapatikana.

💰 PESA ILIYOHUSIKA (Money Involved):
Ksh 3,200,000 — Ujenzi wa Kimaren Girls Secondary School

📍 MAHALI (Where):
Kata ya Kemeloi-Maraba, Jimbo la Aldai, Kaunti ya Nandi

🚨 UZITO WA TATIZO (Severity):
MUHIMU SANA (Critical) — Mradi wa kufikirika (ghost project): pesa za umma zililipwa kwa mradi usiokuwepo kabisa.

📄 CHANZO (Source):
Ripoti ya Ukaguzi wa NG-CDF Nandi FY2019/20 — Ukurasa 42

👉 UNACHOWEZA KUFANYA (What You Can Do):
- EACC (bure/free): 0800 720 629
- DCI: 0800 722 203
- Tumia fomu ya ripoti ya siri katika jukwaa hili (Ripoti anonymously here)"""

    return {
        "answer":           text,
        "sources":          sources,
        "language":         lang,
        "response_time_ms": elapsed,
        "model":            "mock-dev-mode",
        "tokens_used":      0,
        "dev_mode":         True,
    }
