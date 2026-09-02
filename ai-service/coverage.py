"""coverage.py — which counties the indexed corpus actually reaches.

The Audit Translator answers only from ingested documents, and the corpus is
currently one county. A reader in Meru who asks about Meru gets a decline that
reads as the AI being broken, when the truthful answer is "no Meru report has
been ingested yet". Saying so requires knowing what the corpus covers.

Derived from the indexed document names against the canonical IEBC county and
constituency list — never hardcoded, so ingesting a Meru report changes what
the page says without anyone remembering to edit a string. A name that matches
nothing is reported as unattributed rather than guessed into a county.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "pipeline"))
from gen_geography import DATA as IEBC  # noqa: E402


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", " ", s.lower())


# Every place name that identifies a county, longest first so "Nandi Hills"
# wins over "Nandi" and a constituency is never mistaken for its neighbour.
_PLACES: list[tuple[str, str]] = sorted(
    (
        [(_norm(county), county) for county in IEBC]
        + [(_norm(k), county) for county, ks in IEBC.items() for k in ks]
    ),
    key=lambda p: -len(p[0]),
)


def county_of(document_name: str) -> str | None:
    """The county a document belongs to, or None if the name does not say."""
    haystack = f" {' '.join(_norm(document_name).split())} "
    for needle, county in _PLACES:
        if f" {needle} " in haystack:
            return county
    return None


def summarise(documents: list[dict]) -> dict:
    """Corpus coverage for /health and /documents."""
    counties: dict[str, int] = {}
    unattributed = 0
    for d in documents:
        county = county_of(d.get("document_name", ""))
        if county is None:
            unattributed += 1
        else:
            counties[county] = counties.get(county, 0) + 1

    return {
        "documents": len(documents),
        "counties": sorted(counties),
        "documents_by_county": dict(sorted(counties.items())),
        "unattributed": unattributed,
        # 47 counties exist. Saying "1 of 47" on the page is the difference
        # between a reader thinking the service failed and knowing it has not
        # reached them yet.
        "counties_total": len(IEBC),
    }
