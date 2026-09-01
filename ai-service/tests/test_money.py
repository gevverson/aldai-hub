"""Amount parsing — the guard against publishing a wrong number.

Every case here is a real corruption class observed in OAG PDF text layers.
The parser's contract is that it returns **None rather than a guess**: on a
platform whose entire claim is that its figures come from a signed report, a
plausible-looking wrong number does more damage than a blank.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "pipeline"))

from money import CEILING, first_amount, parse_amount  # noqa: E402


class TestObservedOCRCorruption:
    """The four classes documented in money.py, with their real source text."""

    def test_broken_thousands_group_is_refused_not_guessed(self):
        # "158,7576,640" — a group of four digits. The old parser stripped the
        # commas and published 1,587,576,640: ten times the true figure.
        value, conf, _ = first_amount("Kshs.158,7576,640 was not supported")
        assert value is None, "a malformed group must not be silently rescued"
        assert conf == "none"

    def test_decimal_written_as_comma(self):
        # "47,428,765,52" is 47,428,765.52 — not 4,742,876,552.
        value, conf, _ = first_amount("Kshs.47,428,765,52 in pending bills")
        assert value == 47_428_765
        assert conf == "repaired"

    def test_space_inside_a_thousands_group(self):
        # "9, 207,193" — the old parser stopped at the space and published "9".
        value, conf, _ = first_amount("Kshs.9, 207,193 was spent on the project")
        assert value == 9_207_193
        assert conf == "repaired"

    def test_period_used_as_thousands_separator(self):
        # "1.850,000" is 1,850,000 — the old parser published "1".
        value, conf, _ = first_amount("Kshs.1.850,000 on seedlings")
        assert value == 1_850_000
        assert conf == "repaired"

    def test_word_scale_is_expanded(self):
        value, conf, _ = first_amount("Kshs.3 million was allocated")
        assert value == 3_000_000
        assert conf == "ok"


class TestRealCorrections:
    """Figures corrected by hand against the source PDFs (commit 295416a8).

    Each of these was published wrong; they are pinned so a future parser
    change cannot quietly reintroduce the error.
    """

    def test_thika_town_pmc_balance(self):
        # Published as ~14.6 trillion from 'Kshs.14,603,311,047,800'.
        value, _, _ = first_amount("PMC bank balances of Kshs.14,603,311,047,800 could not be confirmed")
        assert value is None, "an impossible figure must be refused, not rounded down"

    @pytest.mark.parametrize("text,expected", [
        ("a balance of Kshs.14,603,311 could not be confirmed", 14_603_311),
        ("Kshs.60,533,774 was not confirmed",                   60_533_774),
        ("Ksh 158,757,640 for the project",                    158_757_640),
    ])
    def test_clean_concluding_lines_parse_exactly(self, text, expected):
        value, conf, _ = first_amount(text)
        assert value == expected
        assert conf == "ok"


class TestCeiling:
    """A single constituency finding cannot exceed the national NG-CDF vote."""

    def test_ceiling_is_the_national_appropriation(self):
        assert CEILING == 50_000_000_000

    def test_figure_above_ceiling_is_refused(self):
        value, conf = parse_amount("999,999,999,999")
        assert value is None
        assert conf == "reject"

    def test_figure_below_ceiling_is_kept(self):
        value, conf = parse_amount("49,000,000,000")
        assert value == 49_000_000_000
        assert conf == "ok"


class TestNoFigure:
    def test_text_without_an_amount(self):
        assert first_amount("The committee did not maintain proper records") == (None, "none", None)

    @pytest.mark.parametrize("empty", ["", None])
    def test_empty_input_does_not_raise(self, empty):
        assert first_amount(empty) == (None, "none", None)

    def test_zero_is_not_reported_as_an_amount(self):
        # A zero figure is never a meaningful audit finding amount.
        value, _, _ = first_amount("Kshs.0 was recovered")
        assert value is None


class TestDocumentOrder:
    def test_returns_the_first_usable_figure(self):
        value, _, _ = first_amount("Kshs.1,700,000 was spent, of which Kshs.900,000 was unsupported")
        assert value == 1_700_000

    def test_skips_a_corrupt_leading_figure_and_takes_the_next(self):
        value, _, _ = first_amount("Kshs.158,7576,640 reported; the confirmed total was Kshs.2,500,000")
        assert value == 2_500_000
