"""Human-readable quote + exception queue."""

from __future__ import annotations

from .models import Quote

WIDTH = 92
STATUS_NOTE = {
    "AUTO_SEND": "No exceptions — clear to send.",
    "REVIEW_RECOMMENDED": "Priced in full; notes below for the account owner.",
    "HOLD_FOR_REVIEW": "Held: one or more lines need a human decision before sending.",
    "REJECTED": "Cannot be quoted on contract — see contract exceptions.",
}


def _rule(char: str = "-") -> str:
    return char * WIDTH


def render(quote: Quote) -> str:
    out: list[str] = []
    member = quote.member
    contract = quote.contract

    out.append(_rule("="))
    out.append(f"QUOTE {quote.quote_id}".ljust(60) + f"{quote.quote_date}".rjust(32))
    out.append(_rule("="))
    out.append(
        f"Member:    {member.name} ({member.member_id}), {member.tier} tier"
        if member
        else "Member:    UNIDENTIFIED"
    )
    if contract:
        out.append(f"Contract:  {contract.contract_id} — {contract.gpo} / {contract.supplier}")
        out.append(f"Terms:     {contract.payment_terms}; {contract.freight_terms}")
    out.append(f"Ship to:   {quote.rfq.ship_to or '(not stated)'}")
    out.append(
        f"Source:    {quote.rfq.source_path} "
        f"[{quote.rfq.channel} / {quote.rfq.extractor} extraction]"
    )
    out.append(f"Status:    {quote.status} — {STATUS_NOTE.get(quote.status, '')}")
    out.append("")

    if quote.flags:
        out.append("CONTRACT EXCEPTIONS")
        out.append(_rule())
        for flag in quote.flags:
            marker = "BLOCK" if flag.blocking else "note "
            out.append(f"  [{marker}] {flag.code}: {flag.detail}")
        out.append("")

    out.append("LINES")
    out.append(_rule())
    out.append(
        f"{'#':>2}  {'SKU':<12} {'DESCRIPTION':<38} {'QTY':>5} {'UOM':<4} "
        f"{'UNIT':>9} {'EXT':>10}"
    )
    out.append(_rule())

    for i, line in enumerate(quote.lines, 1):
        description = (
            line.match.item.description if line.match.item else line.requested.description
        )
        marker = "!" if line.is_blocked else ("?" if line.needs_review else " ")
        unit = f"{line.unit_price:,.2f}" if line.unit_price is not None else "—"
        ext = f"{line.extended_price:,.2f}" if line.extended_price is not None else "—"
        out.append(
            f"{i:>2}{marker} {line.sku:<12} {description[:38]:<38} "
            f"{line.quantity:>5} {(line.uom or '—'):<4} {unit:>9} {ext:>10}"
        )
        if line.pricing_basis:
            out.append(f"     basis: {line.pricing_basis}")

    out.append(_rule())
    out.append(f"{'SUBTOTAL':>74} {quote.subtotal:>15,.2f}")
    priced = sum(1 for l in quote.lines if l.extended_price is not None)
    clean = sum(1 for l in quote.lines if not l.needs_review)
    out.append(
        f"{len(quote.lines)} lines · {priced} priced · {clean} clean · "
        f"{len(quote.review_lines)} need review"
    )
    at_risk = round(
        sum(l.extended_price or 0.0 for l in quote.lines if l.is_blocked), 2
    )
    if at_risk:
        blocked = sum(1 for l in quote.lines if l.is_blocked)
        out.append(
            f"Provisional: {at_risk:,.2f} of the subtotal sits on {blocked} blocked "
            f"line(s) and may change on review."
        )
    out.append("")

    if quote.review_lines:
        out.append("EXCEPTION QUEUE")
        out.append(_rule())
        for i, line in enumerate(quote.lines, 1):
            if not line.needs_review:
                continue
            out.append(f"  Line {i}: {line.requested.raw_text}")
            for flag in line.flags:
                marker = "BLOCK" if flag.blocking else "note "
                out.append(f"    [{marker}] {flag.code}: {flag.detail}")
            out.append("")

    return "\n".join(out)


def render_audit(quote: Quote) -> str:
    out = ["PRICING AUDIT TRAIL", _rule("=")]
    for i, line in enumerate(quote.lines, 1):
        header = f"Line {i}: {line.sku} x{line.quantity}"
        out.append(header)
        out.append(f"  from: {line.requested.raw_text}")
        out.append(
            f"  match: {line.match.method} @ {line.match.confidence} "
            f"(extraction {line.requested.extraction_confidence})"
        )
        for step in line.audit:
            out.append(f"    - {step}")
        if line.unit_price is not None:
            out.append(
                f"  => {line.unit_price:,.2f} / {line.uom} "
                f"x {line.quantity} = {line.extended_price:,.2f}"
            )
        out.append("")
    return "\n".join(out)
