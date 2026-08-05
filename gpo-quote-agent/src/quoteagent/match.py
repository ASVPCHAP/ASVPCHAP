"""Resolve a customer's free-text line to a catalog SKU, with a confidence score.

Scoring is weighted token overlap. Two details matter more than the algorithm:

* Both sides go through the same lossy fold, so OCR damage ("SHELVlNG", "15OW")
  lands on the same tokens as the clean catalog text.
* Rare tokens are worth double. "large", "27" and "anti-fog" are what separate
  two otherwise identical SKUs, and those are exactly the tokens a naive
  bag-of-words comparison drowns out.
"""

from __future__ import annotations

import math
import re
from collections import Counter

from .models import CatalogItem, MatchResult, RequestedLine
from .reference import Reference

ACCEPT_THRESHOLD = 0.45
AMBIGUITY_MARGIN = 0.06

STOPWORDS = {
    "the", "a", "an", "of", "and", "or", "for", "with", "to", "in", "on",
    "x", "ea", "each", "pc", "pcs", "unit", "units", "box", "boxes", "bx",
    "case", "cases", "cs", "pair", "pairs", "pr", "pack", "pk", "please",
    "need", "want", "qty", "quantity", "part", "no", "item", "type", "size",
    "approx", "capacity", "assy", "ansi",
}

SYNONYMS = {
    "gal": "gallon",
    "gallons": "gallon",
    "lb": "pound",
    "lbs": "pound",
    "w": "watt",
    "watts": "watt",
    "hi": "high",
    "vis": "visibility",
    "conc": "concentrate",
    "dolley": "dolly",
    "glove": "glove",
    "antifog": "anti",
}

# Characters OCR routinely confuses. Applied to catalog text *and* RFQ text, so
# the fold only has to be consistent, not correct.
#
# It has to run BEFORE tokenizing, not after: "55OO" and "5500" split into
# different token counts at the digit/letter boundary, so folding afterwards
# compares "ss"+"oo" against "ssoo" and never matches. Fold first and both
# sides are in one alphabet before anything else looks at them.
CONFUSION = str.maketrans({"0": "o", "1": "i", "l": "i", "5": "s"})


def _fold(text: str) -> str:
    return text.lower().translate(CONFUSION)


# The lookup tables are consulted after folding, so they have to be folded too.
STOPWORDS_FOLDED = {_fold(w) for w in STOPWORDS}
SYNONYMS_FOLDED = {_fold(k): _fold(v) for k, v in SYNONYMS.items()}


def _stem(token: str) -> str:
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 4 and token.endswith("es"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s"):
        return token[:-1]
    return token


def tokenize(text: str) -> list[str]:
    text = _fold(text)
    # split digit/letter runs: "150w" -> "150 w", "48x24x72" -> "48 x 24 x 72"
    text = re.sub(r"(?<=\d)(?=[a-z])", " ", text)
    text = re.sub(r"(?<=[a-z])(?=\d)", " ", text)
    raw = re.findall(r"[a-z0-9.]+", text)

    tokens: list[str] = []
    for token in raw:
        token = token.strip(".")
        if not token:
            continue
        token = SYNONYMS_FOLDED.get(token, token)
        token = _stem(token)
        token = SYNONYMS_FOLDED.get(token, token)
        if token in STOPWORDS_FOLDED:
            continue
        tokens.append(token)
    return tokens


class Matcher:
    def __init__(self, reference: Reference) -> None:
        self.reference = reference
        self._tokens: dict[str, set[str]] = {}
        document_frequency: Counter[str] = Counter()

        for item in reference.items:
            tokens = set(tokenize(item.description))
            for keyword in item.keywords:
                tokens |= set(tokenize(keyword))
            tokens |= set(tokenize(item.mfr_part))
            self._tokens[item.sku] = tokens
            document_frequency.update(tokens)

        self._weights = {
            token: 2.0 if count <= 3 else 1.0
            for token, count in document_frequency.items()
        }

    def _weight(self, token: str) -> float:
        # Unknown tokens carry weight so that noise ("bracket") lowers the score
        # instead of being silently ignored.
        return self._weights.get(token, 1.5)

    def _score(self, item: CatalogItem, query_tokens: list[str]) -> float:
        if not query_tokens:
            return 0.0
        candidate = self._tokens[item.sku]
        total = sum(self._weight(t) for t in query_tokens)
        hit = sum(self._weight(t) for t in query_tokens if t in candidate)
        return hit / total if total else 0.0

    def match(self, line: RequestedLine) -> MatchResult:
        if line.mfr_part:
            item = self.reference.by_mfr_part(line.mfr_part)
            if item is not None:
                return MatchResult(item=item, confidence=0.99, method="mfr_part")

        # Notes are buyer commentary ("substitute OK if same ANSI rating"), not
        # product terms — scoring them punishes lines that carry more context.
        query_tokens = tokenize(line.description)
        scored = sorted(
            ((self._score(item, query_tokens), item) for item in self.reference.items),
            key=lambda pair: pair[0],
            reverse=True,
        )
        if not scored or scored[0][0] < ACCEPT_THRESHOLD:
            runners_up = [(item.sku, round(s, 3)) for s, item in scored[:3] if s > 0]
            return MatchResult(
                item=None,
                confidence=round(scored[0][0], 3) if scored else 0.0,
                method="no_match",
                runners_up=runners_up,
            )

        top_score, top_item = scored[0]
        runners_up = [(item.sku, round(s, 3)) for s, item in scored[1:4]]

        second = scored[1][0] if len(scored) > 1 else 0.0
        method = "text"
        confidence = top_score
        if top_score - second < AMBIGUITY_MARGIN:
            method = "ambiguous"
            # Two plausible SKUs is not a 0.9-confidence answer, whatever the
            # overlap says. Damp toward the review threshold.
            confidence = min(top_score, 0.6) * (1 - math.exp(-(top_score - second) * 8))

        return MatchResult(
            item=top_item,
            confidence=round(confidence, 3),
            method=method,
            runners_up=runners_up,
        )
