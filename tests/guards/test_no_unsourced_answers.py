#!/usr/bin/env python3
"""
Guard tests: the AI must never answer from anything but the indexed OAG PDFs.

Macho ya Mwananchi tells citizens every figure is "read directly from a signed
Auditor-General report and cited to its page. Nothing is estimated." A previous
version shipped a hand-written summary that named individual officers as
responsible for fraud and quoted an EACC tracking code, none of which appear in
any of the 46 signed PDFs. It was retired in this commit.

These are deliberately source-text checks, not imports: the ai-service runtime
deps (chromadb, onnxruntime, google-generativeai) are far too heavy to install
in CI just to assert that some strings are absent.

Run: python3 tests/guards/test_no_unsourced_answers.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AI   = ROOT / "ai-service"

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}{(' — ' + detail) if detail else ''}")
        failures.append(name)


main_py  = (AI / "main.py").read_text()
query_py = (AI / "query.py").read_text()

print("\nretired hand-written knowledge base")
check("no OAG_SEED_TEXT constant", "OAG_SEED_TEXT" not in main_py)
check("no 'Responsible Officer' attributions", "Responsible Officer" not in main_py)
check("no invented EACC tracking code", "GHOST-KIM" not in main_py)
check("startup purges the retired summary", "_purge_builtin_summary" in main_py)

print("\nno improvisation when retrieval is empty")
check(
    "retrieval failure does not invite general knowledge",
    not re.search(r'context_parts\s*=\s*\[\s*["\'].*general OAG knowledge', query_py),
)
check("empty retrieval short-circuits before the model", "_no_sources_response" in query_py)
check(
    "the decline is returned, not just defined",
    "return _no_sources_response(" in query_py,
)
check(
    "dev-mode placeholder invents no finding",
    "Kimaren" not in query_py and "Ukurasa 42" not in query_py,
)

print("\nno unsourced fallback in the Node API")
audit_js = (ROOT / "server" / "routes" / "audit.js").read_text()
check("hand-written OAG context file deleted",
      not (ROOT / "server" / "data" / "oag_context.js").exists())
check("audit route no longer imports it",
      not re.search(r"^\s*import .*oag_context", audit_js, re.M))
check("no prompt-primed direct-Gemini answering",
      "GoogleGenerativeAI" not in audit_js)
check("fallback declines instead of improvising", "UNAVAILABLE_ANSWER" in audit_js)

print("\nno fabricated attributions anywhere in shipped source")
NAMED = ["GHOST-KIM", "Cornelius Serem", "Responsible Officer"]
scanned = 0
for path in list((ROOT / "server").rglob("*.js")) + list(AI.glob("*.py")):
    if "node_modules" in path.parts or "venv" in path.parts:
        continue
    scanned += 1
    body = path.read_text(errors="ignore")
    for needle in NAMED:
        if needle in body:
            check(f"{path.relative_to(ROOT)} free of '{needle}'", False)
check(f"scanned {scanned} source files for fabricated attributions", True)

print("\ncorpus is indexed at build time, not runtime")
render = (ROOT / "render.yaml").read_text()
docker = (AI / "Dockerfile").read_text()
check("render.yaml builds the index", "ingest_all.py" in render)
check("Dockerfile bakes the index", "ingest_all.py" in docker)

print("\ncorpus is present")
pdfs = list((AI / "documents").glob("*.pdf"))
check(f"OAG PDFs shipped ({len(pdfs)})", len(pdfs) >= 46, f"found {len(pdfs)}")

print()
if failures:
    print(f"FAILED: {len(failures)} guard(s) — {', '.join(failures)}\n")
    sys.exit(1)
print("All guards passed.\n")
