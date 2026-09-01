"""
query.py — RAG Query Handler
Macho ya Mwananchi | AI Audit RAG Service

Embeds citizen questions via ChromaDB DefaultEmbeddingFunction,
retrieves relevant OAG audit chunks, sends them to Gemini (see MODEL_CHAIN)
with a strict civic accountability system prompt.

If retrieval returns nothing, the question is declined without calling the
model at all — no chunk, no answer.

Uses the `google-genai` SDK. Its predecessor, `google-generativeai`, is
end-of-life and prints "All support has ended" on import — the same class of
silent decay that retired gemini-2.0-flash out from under this service.

Free tier: 1,500 requests/day — more than enough for this platform.
Get your key at: https://aistudio.google.com/app/apikey
"""

import os
import logging
import time
from typing import Optional

from google import genai
from google.genai import types as genai_types

from ingest import get_collection

logger = logging.getLogger(__name__)

# ── Gemini configuration ──────────────────────────────────────
# Google retires Gemini models on a rolling schedule and the API then answers
# 404 for the old name — gemini-2.0-flash was shut down on 1 June 2026 and took
# this endpoint down with it, silently, for months. Try the chain in order and
# remember whichever one answers, so a future retirement degrades to the next
# model instead of taking Audit AI offline. Override with GEMINI_MODEL.
MODEL_CHAIN = [
    m.strip() for m in os.getenv(
        "GEMINI_MODEL",
        "gemini-3.6-flash,gemini-3.7-flash,gemini-flash-latest",
    ).split(",") if m.strip()
]
MODEL        = MODEL_CHAIN[0]   # reported in responses; updated on fallback
TOP_K_CHUNKS = 6

# Chroma always returns the top K chunks, however poor the match — so without a
# floor an off-topic question still arrives at the model wrapped in "OFFICIAL
# OAG AUDIT DOCUMENTS", which is an invitation to answer it. Measured over the
# 46-report corpus (cosine distance): genuine audit questions match at
# 0.41–0.63, off-topic questions at 0.75–0.91. 0.72 sits in the gap.
# Swahili questions match ~0.1 worse than their English equivalents — the
# embedding model is English-centric — so the margin is deliberately kept above
# the worst observed Swahili match. Tune with RELEVANCE_MAX_DISTANCE.
MAX_DISTANCE = float(os.getenv("RELEVANCE_MAX_DISTANCE", "0.72"))

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
    4. Call Gemini 2.0 Flash with civic system prompt
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
    retrieval_failed = False

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
            if dist > MAX_DISTANCE:
                continue  # too weak to cite; see MAX_DISTANCE
            doc_name  = meta.get("document_name", "OAG Report")
            page      = meta.get("page_number", "?")
            year      = meta.get("year", "")
            relevance = f"{max(0, (1 - dist)) * 100:.0f}%"
            # Chunks recovered from a page scan by OCR rather than read from the
            # publisher's own text layer. Carried through to the citation so a
            # reader can weigh a figure accordingly — OCR misreads digits, and
            # digits are what this platform is for.
            via_ocr   = meta.get("text_source") == "ocr"

            context_parts.append(
                f"[SOURCE {i} | {doc_name} | {year} | Page {page} | Relevance: {relevance}"
                + (" | TEXT RECOVERED BY OCR — treat exact figures with caution]" if via_ocr else "]")
                + f"\n{doc.strip()}"
            )
            sources_data.append({
                "document": doc_name,
                "page":     page,
                "year":     year,
                "score":    round(float(dist), 4),
                "via_ocr":  via_ocr,
            })

    except Exception as e:
        # Do NOT fall back to "use general OAG knowledge" here. Without retrieved
        # chunks the model has nothing to cite, and the format it is asked to fill
        # in demands amounts, wards and page numbers — so an invitation to
        # improvise produces confident, well-formatted fabrication. Fail loudly.
        logger.error(f"[QUERY] ChromaDB error: {e}")
        retrieval_failed = True
    else:
        if docs and not context_parts:
            logger.info(
                "[QUERY] %d chunk(s) retrieved but all above the relevance "
                "floor (best=%.3f, max=%.2f) — declining",
                len(docs), min(distances), MAX_DISTANCE,
            )

    # No sources means no answer. Short-circuit before Gemini: a model handed an
    # empty context and a template full of required fields will fill them in.
    if not context_parts:
        logger.warning(
            "[QUERY] no chunks retrieved (retrieval_failed=%s) — declining", retrieval_failed
        )
        return _no_sources_response(lang, start, retrieval_failed)

    context_text = "\n---\n".join(context_parts)

    # ── Step 2: Build prompt ──
    user_message = (
        f"OFFICIAL OAG AUDIT DOCUMENTS (semantic search results):\n{context_text}\n\n"
        f"---\nCITIZEN QUESTION ({lang.upper()}):\n{question}\n\n"
        f"Answer in {'Swahili (with English clarifications)' if lang == 'sw' else 'English (with Swahili key terms)'}. "
        f"Follow the exact format in your instructions."
    )

    # ── Step 3: Call Gemini ──
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("[QUERY] No GEMINI_API_KEY — returning mock response")
        return _mock_response(lang, sources_data, start)

    global MODEL
    try:
        client = genai.Client(api_key=api_key)

        last_error = None
        for candidate in MODEL_CHAIN:
            try:
                response = client.models.generate_content(
                    model=candidate,
                    contents=user_message,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                )
                answer_text = response.text
            except Exception as model_err:
                # A retired or unknown model name is a 404 / NOT_FOUND. Anything
                # else (auth, quota, safety) is real and must not be masked by
                # walking the chain.
                if _is_model_unavailable(model_err):
                    logger.warning(f"[QUERY] model {candidate} unavailable, trying next")
                    last_error = model_err
                    continue
                raise
            else:
                if candidate != MODEL:
                    logger.warning(f"[QUERY] falling back to model {candidate}")
                    MODEL = candidate
                elapsed_ms = int((time.time() - start) * 1000)
                logger.info(
                    f"[QUERY] ✅ {elapsed_ms}ms | lang={lang} | "
                    f"sources={len(sources_data)} | model={candidate}"
                )
                return {
                    "answer":           answer_text,
                    "sources":          sources_data,
                    "language":         lang,
                    "response_time_ms": elapsed_ms,
                    "model":            candidate,
                }

        raise last_error if last_error else RuntimeError("no Gemini model configured")

    except Exception as e:
        err = str(e)
        if "API_KEY_INVALID" in err or "PERMISSION_DENIED" in err:
            return {"error": "AI service authentication failed. Check GEMINI_API_KEY."}
        if "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
            # Gemini reports a per-minute rate limit and a per-day quota with the
            # same RESOURCE_EXHAUSTED status. Telling someone to "try again
            # tomorrow" when the limit resets in sixty seconds sends them away
            # for a day over a one-minute wait, so only say that when the error
            # actually names the daily limit.
            low = err.lower()
            per_minute = "per minute" in low or "perminute" in low or "rate limit" in low
            if per_minute:
                logger.warning("[QUERY] Gemini per-minute rate limit hit")
                return {"error": "Too many questions right now. Please try again in about a minute."}
            logger.warning("[QUERY] Gemini quota exhausted: %s", err[:200])
            return {"error": "AI service daily quota reached. Please try again tomorrow."}
        logger.error(f"[QUERY] Gemini error: {e}")
        return {"error": f"AI service error: {err[:120]}"}


def _is_model_unavailable(err: Exception) -> bool:
    """True only for 'this model name does not exist', which is safe to retry.

    Checked against the SDK's structured fields first (`code` / `status`), and
    only then against the message text. The message format belongs to Google and
    has changed before; the day it changes again, string-only matching would stop
    detecting a retired model and Audit AI would go dark rather than fall through
    to the next candidate. That is precisely how gemini-2.0-flash took this
    service offline for three months in 2026.

    Auth, quota and safety errors deliberately return False — masking those by
    walking the chain would turn one loud failure into three quiet ones.
    """
    code = getattr(err, "code", None)
    if code == 404:
        return True
    status = getattr(err, "status", None)
    if isinstance(status, str) and status.upper() == "NOT_FOUND":
        return True
    if code is not None or status is not None:
        # Structured error from the SDK that is not a 404 — trust it, don't
        # second-guess it with a substring scan of the message.
        return False

    msg = str(err)
    return "404" in msg or "NOT_FOUND" in msg or "no longer available" in msg


def _no_sources_response(lang: str, start: float, retrieval_failed: bool) -> dict:
    """Answer honestly when the corpus returned nothing.

    Returned instead of calling Gemini, so there is no path by which an empty
    index produces a cited-looking answer. This is the whole point: the platform
    promises every figure is read out of a signed report, and an answer with no
    retrieved chunk behind it cannot keep that promise.
    """
    if retrieval_failed:
        sw = ("Samahani — kwa sasa siwezi kufikia hati za ukaguzi. "
              "Tafadhali jaribu tena baadaye.")
        en = ("Sorry — I cannot reach the audit documents right now. "
              "Please try again shortly.")
    else:
        sw = ("Habari hii haiko katika hati nilizo nazo. Ninajibu tu kutoka "
              "ripoti za Mkaguzi Mkuu wa Serikali nilizonazo — sitakisii.")
        en = ("This information is not in the documents I have access to. I only "
              "answer from the Auditor-General reports I hold — I do not guess.")

    body = f"{sw}\n\n{en}" if lang == "sw" else f"{en}\n\n{sw}"
    text = (
        f"📋 JIBU (Answer):\n{body}\n\n"
        "👉 UNACHOWEZA KUFANYA (What You Can Do):\n"
        "- EACC (Kupiga simu bure / Free call): 0800 720 629\n"
        "- DCI (Uchunguzi wa uhalifu / Criminal investigations): 0800 722 203"
    )
    return {
        "answer":           text,
        "sources":          [],
        "language":         lang,
        "response_time_ms": int((time.time() - start) * 1000),
        "model":            "none",
        "no_sources":       True,
        "retrieval_failed": retrieval_failed,
    }


def _mock_response(lang: str, sources: list, start: float) -> dict:
    """Dev placeholder — used when GEMINI_API_KEY is not set."""
    elapsed = int((time.time() - start) * 1000)
    text = (
        "📋 JIBU (Answer):\n"
        "AI Audit Translator haijawashwa kwenye seva hii (GEMINI_API_KEY haipo).\n"
        "The AI Audit Translator is not configured on this server "
        "(GEMINI_API_KEY is not set). No answer can be given."
    )

    return {
        "answer":           text,
        "sources":          sources,
        "language":         lang,
        "response_time_ms": elapsed,
        "model":            "mock-dev-mode",
        "dev_mode":         True,
    }
