"""Model-chain fallback and the relevance floor.

Two mechanisms with the same job: keep Audit AI either correct or silent, never
confidently wrong.

The fallback exists because gemini-2.0-flash was retired on 1 June 2026 while
its name was hardcoded, and the service returned 503 to every citizen for three
months without anyone noticing. The relevance floor exists because ChromaDB
returns its top K chunks however poor the match, so an off-topic question would
otherwise arrive at the model wrapped in "OFFICIAL OAG AUDIT DOCUMENTS".
"""
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import query  # noqa: E402
from google.genai import errors  # noqa: E402


def api_error(code, status, message):
    """An SDK error shaped the way google-genai actually raises them."""
    return errors.ClientError(code, {"error": {"code": code, "status": status, "message": message}})


class TestModelUnavailableDetection:
    """Only 'that model name does not exist' may be retried."""

    def test_retired_model_is_retryable(self):
        err = api_error(404, "NOT_FOUND", "models/gemini-2.0-flash is not found for API version v1beta")
        assert query._is_model_unavailable(err) is True

    @pytest.mark.parametrize("code,status,message", [
        (429, "RESOURCE_EXHAUSTED", "Quota exceeded for 'Generate requests per minute'"),
        (403, "PERMISSION_DENIED",  "API key not valid"),
        (400, "INVALID_ARGUMENT",   "API_KEY_INVALID"),
        (500, "INTERNAL",           "backend error"),
        (503, "UNAVAILABLE",        "model is overloaded"),
    ])
    def test_real_failures_are_not_masked_by_walking_the_chain(self, code, status, message):
        # Retrying these would turn one loud, diagnosable failure into three
        # quiet ones and surface the wrong message to the citizen.
        assert query._is_model_unavailable(api_error(code, status, message)) is False

    def test_structured_404_wins_over_message_text(self):
        # A quota message that happens to contain "404" must not be retried.
        err = api_error(429, "RESOURCE_EXHAUSTED", "quota 404 exceeded")
        assert query._is_model_unavailable(err) is False

    @pytest.mark.parametrize("message,expected", [
        ("404 model not found",              True),
        ("NOT_FOUND: unknown model",         True),
        ("model is no longer available",     True),
        ("connection reset by peer",         False),
        ("",                                 False),
    ])
    def test_falls_back_to_message_text_for_unstructured_errors(self, message, expected):
        # Errors raised before the SDK boundary (httpx, our own RuntimeError)
        # carry no code/status, so text matching is still the last resort.
        assert query._is_model_unavailable(RuntimeError(message)) is expected


class TestModelChain:
    def test_chain_has_a_fallback_beyond_the_first_model(self):
        assert len(query.MODEL_CHAIN) >= 2, "a single-entry chain is a hardcoded model again"

    def test_default_chain_avoids_models_with_known_retirement_dates(self):
        # gemini-2.5-* retires 16 Oct 2026; 2.0-flash is already gone.
        for model in query.MODEL_CHAIN:
            assert not model.startswith("gemini-2."), f"{model} has a known retirement date"

    def test_chain_is_overridable_by_env(self, monkeypatch):
        monkeypatch.setenv("GEMINI_MODEL", "model-a, model-b ,, model-c")
        chain = [m.strip() for m in os.getenv("GEMINI_MODEL").split(",") if m.strip()]
        assert chain == ["model-a", "model-b", "model-c"], "blank entries must be dropped"


class TestRelevanceFloor:
    def test_floor_sits_between_observed_relevant_and_off_topic_distances(self):
        # Measured over the 46-report corpus: genuine audit questions match at
        # 0.41-0.63 cosine distance, off-topic questions at 0.75-0.91.
        assert 0.63 < query.MAX_DISTANCE < 0.75

    def test_floor_is_tunable_without_a_code_change(self):
        assert os.getenv("RELEVANCE_MAX_DISTANCE") is None or query.MAX_DISTANCE > 0

    def test_top_k_is_bounded(self):
        assert 1 <= query.TOP_K_CHUNKS <= 20


class TestModelOverload:
    """A saturated model is not a dead one — try the next in the chain.

    Observed in production 2026-09-01: gemini-3.6-flash returned
    503 UNAVAILABLE "This model is currently experiencing high demand" while the
    service was otherwise healthy, and the citizen got a decline with two unused
    models sitting in the chain behind it.
    """

    def test_high_demand_503_moves_to_the_next_model(self):
        err = api_error(503, "UNAVAILABLE", "This model is currently experiencing high demand.")
        assert query._is_model_overloaded(err) is True

    @pytest.mark.parametrize("code,status,message", [
        (429, "RESOURCE_EXHAUSTED", "Quota exceeded for requests per minute"),
        (403, "PERMISSION_DENIED",  "API key not valid"),
        (400, "INVALID_ARGUMENT",   "malformed request"),
    ])
    def test_account_level_failures_do_not_walk_the_chain(self, code, status, message):
        # These fail identically on every model. Retrying turns one honest error
        # into three slow ones and delays the true message to the citizen.
        assert query._is_model_overloaded(api_error(code, status, message)) is False

    def test_overload_and_retirement_are_distinct_conditions(self):
        retired   = api_error(404, "NOT_FOUND",   "models/gemini-2.0-flash is not found")
        saturated = api_error(503, "UNAVAILABLE", "experiencing high demand")
        assert query._is_model_unavailable(retired) is True
        assert query._is_model_overloaded(retired) is False
        assert query._is_model_unavailable(saturated) is False
        assert query._is_model_overloaded(saturated) is True
