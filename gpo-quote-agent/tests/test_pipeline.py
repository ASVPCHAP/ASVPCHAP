"""End-to-end: the same order, arriving three different ways."""

from datetime import date

import pytest

from quoteagent.extract import extract
from quoteagent.quote import build_quote, to_dict

QUOTE_DATE = date(2026, 8, 5)
CHANNELS = ["rfq_email.txt", "rfq_spreadsheet.csv", "rfq_scanned_ocr.txt"]


def run(samples, reference, filename, **kwargs):
    rfq = extract(samples / filename)
    return build_quote(rfq, reference, quote_date=QUOTE_DATE, **kwargs)


@pytest.fixture(params=CHANNELS)
def quote(request, samples, reference):
    return run(samples, reference, request.param)


def test_every_channel_identifies_the_member_and_contract(quote):
    assert quote.member.member_id == "RMP-10442"
    assert quote.contract.contract_id == "RMP-MRO-2026"


def test_channels_agree_on_skus_quantities_and_prices(samples, reference):
    """Email, spreadsheet and a damaged scan of the same order must produce the
    same quote. This is the claim the product is sold on."""
    results = {}
    for filename in CHANNELS:
        quote = run(samples, reference, filename)
        results[filename] = [
            (l.sku, l.quantity, l.unit_price)
            for l in quote.lines
            if l.match.item is not None
        ]

    email, spreadsheet, scanned = (results[f] for f in CHANNELS)
    assert email == spreadsheet
    assert email == scanned


def test_scanned_channel_adds_the_illegible_line_and_nothing_else(samples, reference):
    email = run(samples, reference, "rfq_email.txt")
    scanned = run(samples, reference, "rfq_scanned_ocr.txt")
    assert len(scanned.lines) == len(email.lines) + 1

    extra = scanned.lines[-1]
    assert extra.match.item is None
    assert {"NO_MATCH", "EXTRACTION_LOW_CONFIDENCE"} <= {f.code for f in extra.flags}


def test_quote_is_held_because_lines_are_blocked_not_rejected(quote):
    assert quote.status == "HOLD_FOR_REVIEW"
    assert not any(f.blocking for f in quote.flags)  # the member itself is fine
    assert any(l.is_blocked for l in quote.lines)


def test_uom_mismatch_is_converted_and_surfaced_never_silent(quote):
    """40 boxes of gloves is 4 cases. Getting this wrong is a 10x error, so the
    conversion is applied but always blocks for confirmation."""
    line = next(l for l in quote.lines if l.sku == "GI-8830515")
    assert line.quantity == 4
    assert line.uom == "CS"
    flag = next(f for f in line.flags if f.code == "UOM_CONVERTED")
    assert flag.blocking


def test_clean_lines_carry_a_price_and_no_flags(quote):
    shelving = next(l for l in quote.lines if l.sku == "GI-4417832")
    assert shelving.unit_price == 197.68
    assert shelving.extended_price == 4744.32
    assert shelving.flags == []


def test_subtotal_is_the_sum_of_the_lines(quote):
    expected = round(sum(l.extended_price or 0 for l in quote.lines), 2)
    assert quote.subtotal == expected


def test_every_priced_line_has_an_audit_trail(quote):
    for line in quote.lines:
        if line.unit_price is not None:
            assert line.audit, f"{line.sku} priced with no audit trail"


def test_suspended_member_rejects_the_whole_quote(samples, reference):
    quote = run(samples, reference, "rfq_email.txt", member_override="RMP-20817")
    assert quote.status == "REJECTED"
    assert "MEMBER_NOT_ACTIVE" in {f.code for f in quote.flags}


def test_unknown_member_rejects_the_whole_quote(samples, reference):
    quote = run(samples, reference, "rfq_email.txt", member_override="RMP-99999")
    assert quote.status == "REJECTED"
    assert "MEMBER_NOT_IDENTIFIED" in {f.code for f in quote.flags}


def test_serialized_quote_is_json_ready_and_keeps_the_audit(samples, reference):
    import json

    payload = to_dict(run(samples, reference, "rfq_email.txt"))
    round_tripped = json.loads(json.dumps(payload))

    assert round_tripped["status"] == "HOLD_FOR_REVIEW"
    assert round_tripped["member"]["tier"] == "gold"
    assert len(round_tripped["lines"]) == 7
    assert all(l["audit"] for l in round_tripped["lines"] if l["unit_price"])


def test_cli_exit_code_signals_review_state(samples):
    from quoteagent.cli import main

    code = main([str(samples / "rfq_email.txt"), "--date", "2026-08-05"])
    assert code == 1  # held for review

    code = main(
        [str(samples / "rfq_email.txt"), "--date", "2026-08-05", "--member", "RMP-20817"]
    )
    assert code == 2  # rejected
