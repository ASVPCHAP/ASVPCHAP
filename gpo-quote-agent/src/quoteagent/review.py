"""Confidence gating: decide which lines a human has to look at.

The point of the product is not that the model is always right. It's that when
the model is unsure, the quote says so on that line instead of shipping a wrong
price to a member. Blocking flags stop the auto-send; non-blocking flags travel
with the quote as context for whoever signs it.
"""

from __future__ import annotations

from .models import CatalogItem, Flag, MatchResult, RequestedLine

EXTRACTION_REVIEW = 0.60
EXTRACTION_BLOCK = 0.45
MATCH_REVIEW = 0.80
MATCH_BLOCK = 0.60


def intake_flags(line: RequestedLine, match: MatchResult) -> list[Flag]:
    flags: list[Flag] = []

    if line.quantity is None:
        flags.append(
            Flag(
                "MISSING_QTY",
                f"No quantity could be read from: {line.raw_text!r}",
                blocking=True,
            )
        )

    if line.extraction_confidence < EXTRACTION_REVIEW:
        flags.append(
            Flag(
                "EXTRACTION_LOW_CONFIDENCE",
                f"Line read with {line.extraction_confidence:.0%} confidence "
                f"from: {line.raw_text!r}",
                blocking=line.extraction_confidence < EXTRACTION_BLOCK,
            )
        )

    if match.item is None:
        alternatives = ", ".join(f"{sku} ({score})" for sku, score in match.runners_up)
        flags.append(
            Flag(
                "NO_MATCH",
                f"No catalog SKU matched {line.description!r} "
                f"(best {match.confidence}). "
                + (f"Nearest: {alternatives}" if alternatives else "No near matches."),
                blocking=True,
            )
        )
        return flags

    if match.method == "ambiguous":
        top = match.runners_up[0][1] if match.runners_up else 0.0
        near_ties = [
            sku for sku, score in match.runners_up if abs(score - top) < 1e-9
        ] or [sku for sku, _ in match.runners_up[:1]]
        flags.append(
            Flag(
                "AMBIGUOUS_MATCH",
                f"{line.description!r} fits {match.item.sku} and "
                f"{', '.join(near_ties)} about equally well. Needs a human pick.",
                blocking=True,
            )
        )
    elif match.method != "mfr_part" and match.confidence < MATCH_REVIEW:
        flags.append(
            Flag(
                "MATCH_LOW_CONFIDENCE",
                f"{line.description!r} -> {match.item.sku} at "
                f"{match.confidence:.0%} confidence.",
                blocking=match.confidence < MATCH_BLOCK,
            )
        )

    return flags


def uom_flags(
    line: RequestedLine, item: CatalogItem, quantity: int
) -> tuple[int, list[Flag]]:
    """Reconcile the customer's unit against the catalog unit.

    Returns the quantity to price and any flags. A box/case mix-up is a 10x
    error in either direction, so it is never resolved silently.
    """
    flags: list[Flag] = []
    requested_uom = (line.uom or "").upper()

    if not requested_uom or requested_uom == item.uom:
        return quantity, flags

    factor = item.uom_conversion.get(requested_uom)
    if factor:
        converted = quantity // factor
        remainder = quantity % factor
        detail = (
            f"Customer asked for {quantity} {requested_uom}; SKU {item.sku} sells "
            f"in {item.uom} of {factor} {requested_uom}. Quoting {converted} "
            f"{item.uom}."
        )
        if remainder:
            detail += f" {remainder} {requested_uom} does not divide evenly."
        flags.append(Flag("UOM_CONVERTED", detail, blocking=True))
        return max(converted, 1), flags

    flags.append(
        Flag(
            "UOM_MISMATCH",
            f"Customer asked for {quantity} {requested_uom}; SKU {item.sku} sells "
            f"in {item.uom} and no conversion is on file. Confirm before quoting.",
            blocking=True,
        )
    )
    return quantity, flags


def stock_flags(item: CatalogItem, quantity: int) -> list[Flag]:
    if quantity > item.stock:
        return [
            Flag(
                "BACKORDER_RISK",
                f"Qty {quantity} exceeds on-hand {item.stock} for {item.sku}. "
                f"Confirm lead time before committing to a date.",
            )
        ]
    return []
