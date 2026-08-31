"""Robust Ksh amount parser for OAG audit text.

The original parser (`extract.py` MONEY) captured `[\\d,]+` and stripped every
comma, so three OCR artefacts in the PDF text layer silently corrupted figures:

  A. broken thousands group   "Kshs.158,7576,640"   -> 1,587,576,640 (10x over)
  B. decimal written as comma "Kshs.47,428,765,52"  -> 4,742,876,552  (100x over)
  C. space inside a group     "Kshs.9, 207,193"     -> 9              (1,000,000x under)
  D. word scale ignored       "Kshs.3 million"      -> 3

Anything still unparseable is returned as None. A null amount is honest; a
wrong one is not.
"""
import re

# A number is a 1-3 digit head followed by comma/period separated 3-digit
# groups (the separator may be followed by an OCR space), with an optional
# 1-2 digit decimal tail. Bare integers and plain decimals also match.
NUMBER = r"\d{1,3}(?:[.,]\s?\d{3})+(?:[.,]\d{1,2})?|\d+(?:\.\d+)?"

MONEY = re.compile(
    rf"[Kk]shs?\.?\s*({NUMBER})\s*(million|billion|m\b|bn\b)?",
    re.I,
)

SCALE = {"million": 1_000_000, "m": 1_000_000,
         "billion": 1_000_000_000, "bn": 1_000_000_000}

# National NG-CDF appropriation is ~Ksh 50bn; a single constituency finding
# above that is not a real figure, it is a mangled text layer.
CEILING = 50_000_000_000


def _num(s):
    try:
        return float(s)
    except ValueError:
        return None


def parse_amount(raw, scale_word=None):
    """Return (value, confidence): 'ok' | 'repaired' | 'reject'."""
    had_space = bool(re.search(r"[.,]\s\d", raw))
    raw = re.sub(r"([.,])\s(?=\d)", r"\1", raw).rstrip(".,")

    if scale_word:
        base = _num(raw.replace(",", ""))
        mult = SCALE.get(scale_word.lower().rstrip("."))
        if base is None or mult is None:
            return None, "reject"
        val = base * mult
        return (int(val), "ok") if val <= CEILING else (None, "reject")

    # Every separator delimits an exact 3-digit group: they are all thousands
    # marks, whichever character OCR produced.
    if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", raw):
        val = _num(re.sub(r"[.,]", "", raw))
        if val is None:
            return None, "reject"
        conf = "repaired" if ("." in raw or had_space) else "ok"
        return (int(val), conf) if val <= CEILING else (None, "reject")

    # Trailing 1-2 digit group after clean 3-digit groups = a decimal tail
    # ("47,428,765,52" -> 47428765.52).
    m = re.fullmatch(r"(\d{1,3}(?:[.,]\d{3})+)[.,](\d{1,2})", raw)
    if m:
        val = _num(re.sub(r"[.,]", "", m.group(1)) + "." + m.group(2))
        if val is None:
            return None, "reject"
        return (int(val), "repaired") if val <= CEILING else (None, "reject")

    # Plain integer or decimal.
    if re.fullmatch(r"\d+(?:\.\d+)?", raw):
        val = _num(raw)
        if val is None:
            return None, "reject"
        conf = "repaired" if had_space else "ok"
        return (int(val), conf) if val <= CEILING else (None, "reject")

    return None, "reject"


def first_amount(text):
    """First Ksh figure in document order, with confidence and matched text."""
    for m in MONEY.finditer(text or ""):
        # If the match stopped mid-number (next char continues the digit run),
        # the group structure was corrupt -- refuse rather than guess.
        tail = text[m.end(1):m.end(1) + 2]
        if re.match(r"\d|[.,]\d", tail):
            continue
        val, conf = parse_amount(m.group(1), m.group(2))
        if val is not None and val > 0:
            return val, conf, m.group(0)
    return None, "none", None
