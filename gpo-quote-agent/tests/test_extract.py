"""Extraction: the quantity-vs-specification problem is the whole game here."""

import pytest

from quoteagent.extract import extract, parse_line_item


@pytest.mark.parametrize(
    "line,quantity,uom",
    [
        ("- 24 ea of the heavy duty steel shelving, 48x24x72 (5 shelf)", 24, "EA"),
        ("- 6 pallet jacks, 5500 lb, the 27x48 fork ones", 6, None),
        ("- nitrile gloves, powder free, large - 40 boxes", 40, "BX"),
        ("- 12 of the 55 gal drum dollies", 12, None),
        ("- safety glasses clear anti-fog, need 200 pair", 200, "PR"),
        ("- 4 cases of the neutral floor cleaner (the 4x1gal)", 4, "CS"),
        # No unit word: the quantity is readable, the unit is not. Reporting
        # None here is what lets the UOM check compare against the catalog later
        # instead of assuming EA.
        ("- 30 led high bay lights 150w 5000k", 30, None),
    ],
)
def test_quantity_is_never_taken_from_a_specification(line, quantity, uom):
    parsed = parse_line_item(line)
    assert parsed.quantity == quantity
    assert parsed.uom == uom


@pytest.mark.parametrize(
    "line",
    [
        "- 6 pallet jacks, 5500 lb, the 27x48 fork ones",
        "- 12 of the 55 gal drum dollies",
        "- 30 led high bay lights 150w 5000k",
        "- 4 cases of the neutral floor cleaner (the 4x1gal)",
    ],
)
def test_specifications_survive_into_the_description(line):
    """Stripping the spec would make the line unmatchable — 27x48 vs 20.5x48."""
    parsed = parse_line_item(line)
    assert any(ch.isdigit() for ch in parsed.description), parsed.description


def test_part_number_is_captured_and_removed_from_description():
    parsed = parse_line_item(
        "- 24 ea of the heavy duty steel shelving, 48x24x72 (5 shelf) - part HDS-4824-72"
    )
    assert parsed.mfr_part == "HDS-4824-72"
    assert "HDS-4824-72" not in parsed.description


def test_a_bare_all_caps_word_pair_is_not_a_part_number():
    """ANTI-FOG looks like a part number; requiring two digits rejects it."""
    parsed = parse_line_item("200 PR SAFETY GLASSES CLEAR ANTI-F0G")
    assert parsed.mfr_part is None


def test_email_channel(samples):
    rfq = extract(samples / "rfq_email.txt")
    assert rfq.channel == "email"
    assert rfq.member_id == "RMP-10442"
    assert rfq.ship_to == "Cedar Falls campus, dock 3"
    assert len(rfq.lines) == 7
    # The trailing paragraph ("can you confirm the freight terms") is prose, not
    # a line item, and must not become one.
    assert all("freight" not in l.description.lower() for l in rfq.lines)


def test_spreadsheet_channel_skips_preamble_and_totals(samples):
    rfq = extract(samples / "rfq_spreadsheet.csv")
    assert rfq.channel == "spreadsheet"
    assert rfq.member_id == "RMP-10442"
    assert rfq.ship_to == "Cedar Falls Campus - Dock 3"
    assert len(rfq.lines) == 7
    assert [l.quantity for l in rfq.lines] == [24, 6, 40, 12, 200, 4, 30]


def test_scanned_channel_flags_illegible_text(samples):
    rfq = extract(samples / "rfq_scanned_ocr.txt")
    assert rfq.channel == "scanned"
    assert rfq.member_id == "RMP-10442"
    assert len(rfq.lines) == 8

    illegible = rfq.lines[-1]
    assert illegible.extraction_confidence <= 0.35
    assert "llegible" not in illegible.description

    legible = rfq.lines[0]
    assert legible.extraction_confidence > illegible.extraction_confidence
