"""Keep the ai-service unit tests dependency-free.

`query.py` imports `ingest.get_collection` at module scope, and `ingest` pulls
in pdfplumber and chromadb (which drags onnxruntime). Installing that whole
stack in CI would cost minutes and hundreds of megabytes to test two pure
functions — and the point of this suite is that it fails in seconds, before
anything slower runs.

So: if the real `ingest` imports, use it. If its dependencies are absent, stand
in a stub. Nothing here touches retrieval — these tests cover the amount parser
and the model-chain decision, neither of which calls the collection.
"""
import sys
import types
from pathlib import Path

AI_SERVICE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_SERVICE))
sys.path.insert(0, str(AI_SERVICE / "pipeline"))

try:
    import ingest  # noqa: F401
except ImportError:
    stub = types.ModuleType("ingest")

    def get_collection(*_args, **_kwargs):
        raise AssertionError(
            "get_collection() was called in a unit test. These tests must not "
            "touch ChromaDB — if you need retrieval, write an integration test."
        )

    stub.get_collection = get_collection
    stub.DOCUMENTS_DIR = AI_SERVICE / "documents"
    sys.modules["ingest"] = stub
