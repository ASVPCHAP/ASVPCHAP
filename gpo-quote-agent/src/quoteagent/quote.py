"""Assemble the quote: intake -> match -> UOM -> price -> gate -> status."""

from __future__ import annotations

import hashlib
from datetime import date

from .match import Matcher
from .models import RFQ, Flag, Quote, QuotedLine
from .pricing import check_eligibility, price_line
from .reference import Reference
from .review import intake_flags, stock_flags, uom_flags

STATUS_AUTO_SEND = "AUTO_SEND"
STATUS_REVIEW_RECOMMENDED = "REVIEW_RECOMMENDED"
STATUS_HOLD = "HOLD_FOR_REVIEW"
STATUS_REJECTED = "REJECTED"


def _quote_id(rfq: RFQ, quote_date: date) -> str:
    digest = hashlib.sha1(
        f"{rfq.source_path}|{rfq.member_id}|{quote_date}".encode()
    ).hexdigest()[:6]
    return f"Q-{quote_date:%Y%m%d}-{digest.upper()}"


def build_quote(
    rfq: RFQ,
    reference: Reference,
    quote_date: date | None = None,
    member_override: str | None = None,
) -> Quote:
    quote_date = quote_date or date.today()
    member = reference.member(member_override or rfq.member_id)
    contract = reference.contract_for(member)

    quote = Quote(
        quote_id=_quote_id(rfq, quote_date),
        rfq=rfq,
        member=member,
        contract=contract,
        quote_date=quote_date,
        flags=check_eligibility(member, contract, quote_date),
    )

    matcher = Matcher(reference)

    for line in rfq.lines:
        match = matcher.match(line)
        flags: list[Flag] = list(intake_flags(line, match))
        quantity = line.quantity or 0
        item = match.item

        priced_unit: float | None = None
        priced_ext: float | None = None
        basis = ""
        audit: list[str] = []

        if item is not None:
            quantity, converted_flags = uom_flags(line, item, quantity)
            flags.extend(converted_flags)
            flags.extend(stock_flags(item, quantity))

            if member and contract and quantity > 0:
                result = price_line(item, quantity, contract, member)
                priced_unit = result.unit_price
                priced_ext = round(result.unit_price * quantity, 2)
                basis = result.basis
                audit = result.audit
                flags.extend(result.flags)
            elif quantity > 0:
                priced_unit = item.list_price
                priced_ext = round(item.list_price * quantity, 2)
                basis = "list (no contract applied)"
                audit = [f"List price {item.list_price:.2f} — no contract in force"]

        quote.lines.append(
            QuotedLine(
                requested=line,
                match=match,
                quantity=quantity,
                uom=item.uom if item else line.uom,
                unit_price=priced_unit,
                extended_price=priced_ext,
                pricing_basis=basis,
                audit=audit,
                flags=flags,
            )
        )

    quote.status = _status(quote)
    return quote


def _status(quote: Quote) -> str:
    if any(f.blocking for f in quote.flags):
        return STATUS_REJECTED
    if any(l.is_blocked for l in quote.lines):
        return STATUS_HOLD
    if quote.all_flags:
        return STATUS_REVIEW_RECOMMENDED
    return STATUS_AUTO_SEND


def to_dict(quote: Quote) -> dict:
    """Serializable form — the payload a supplier's ERP or CRM would consume."""
    return {
        "quote_id": quote.quote_id,
        "quote_date": quote.quote_date.isoformat(),
        "status": quote.status,
        "source": {
            "path": quote.rfq.source_path,
            "channel": quote.rfq.channel,
            "extractor": quote.rfq.extractor,
            "ship_to": quote.rfq.ship_to,
        },
        "member": None
        if quote.member is None
        else {
            "member_id": quote.member.member_id,
            "name": quote.member.name,
            "tier": quote.member.tier,
            "status": quote.member.status,
        },
        "contract": None
        if quote.contract is None
        else {
            "contract_id": quote.contract.contract_id,
            "gpo": quote.contract.gpo,
            "freight_terms": quote.contract.freight_terms,
            "payment_terms": quote.contract.payment_terms,
        },
        "subtotal": quote.subtotal,
        "quote_flags": [
            {"code": f.code, "detail": f.detail, "blocking": f.blocking}
            for f in quote.flags
        ],
        "lines": [
            {
                "raw_text": l.requested.raw_text,
                "requested_description": l.requested.description,
                "sku": l.sku,
                "catalog_description": l.match.item.description if l.match.item else None,
                "match_confidence": l.match.confidence,
                "match_method": l.match.method,
                "runners_up": l.match.runners_up,
                "quantity": l.quantity,
                "uom": l.uom,
                "unit_price": l.unit_price,
                "extended_price": l.extended_price,
                "pricing_basis": l.pricing_basis,
                "audit": l.audit,
                "flags": [
                    {"code": f.code, "detail": f.detail, "blocking": f.blocking}
                    for f in l.flags
                ],
            }
            for l in quote.lines
        ],
    }
