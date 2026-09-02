"""Corpus coverage — what the Audit Translator can actually answer about.

The service declines any question its corpus does not reach. Until this
existed, the page could not say which counties those were, so a decline in
Meru looked identical to the service being broken.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import coverage  # noqa: E402


def docs(*names):
    return [{"document_name": n} for n in names]


class TestCountyOf:
    @pytest.mark.parametrize("name,want", [
        # Real names from the live index.
        ("ALDAI NGCDF (OAG FY2021/2022)", "Nandi"),
        ("Aldai NGCDG (OAG FY2019/2020)", "Nandi"),          # OAG's own typo
        ("Aldai Technical Training Institute (OAG FY2019/2020)", "Nandi"),
        ("County Executive of Nandi (OAG FY2016/2017)", "Nandi"),
        ("Nandi County Covid 19 Vaccine Roll Out Report (OAG special audit)", "Nandi"),
        # A constituency resolves to its county, not to itself.
        ("North Imenti NGCDF (OAG FY2021/2022)", "Meru"),
        ("Bomet Central NGCDF (OAG FY2017/2018)", "Bomet"),
    ])
    def test_resolves(self, name, want):
        assert coverage.county_of(name) == want

    def test_longest_place_name_wins(self):
        # "Nandi Hills" is a constituency of Nandi; the answer is the county
        # either way, but the match must not stop at the shorter name and
        # mis-handle a constituency whose county differs from its first word.
        assert coverage.county_of("Nandi Hills NGCDF (OAG FY2016/2017)") == "Nandi"
        assert coverage.county_of("Kilifi North NGCDF (OAG FY2018/2019)") == "Kilifi"

    def test_unknown_is_none_not_a_guess(self):
        # The failure mode this whole module exists to avoid: inventing an
        # attribution. Unrecognised means unrecognised.
        assert coverage.county_of("Quarterly Summary (OAG FY2020/2021)") is None
        assert coverage.county_of("") is None

    def test_substring_of_a_word_does_not_match(self):
        # "Lamu" must not match inside "Lamuka"; place names are whole words.
        assert coverage.county_of("Lamuka Initiative Report") is None


class TestSummarise:
    def test_counts_by_county(self):
        s = coverage.summarise(docs(
            "Aldai NGCDF (OAG FY2017/2018)",
            "Emgwen NGCDF (OAG FY2021/2022)",
            "North Imenti NGCDF (OAG FY2021/2022)",
        ))
        assert s["counties"] == ["Meru", "Nandi"]
        assert s["documents_by_county"] == {"Meru": 1, "Nandi": 2}
        assert s["documents"] == 3
        assert s["unattributed"] == 0

    def test_unattributed_is_reported_not_hidden(self):
        s = coverage.summarise(docs("Aldai NGCDF (OAG FY2017/2018)", "Mystery Report"))
        assert s["unattributed"] == 1
        assert s["counties"] == ["Nandi"]

    def test_empty_corpus_claims_nothing(self):
        s = coverage.summarise([])
        assert s["counties"] == []
        assert s["documents"] == 0

    def test_denominator_is_all_of_kenya(self):
        # "1 of 47" is the number that tells a reader they are not covered yet.
        assert coverage.summarise([])["counties_total"] == 47
