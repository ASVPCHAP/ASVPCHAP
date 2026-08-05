"""SKU resolution, including the cases that must NOT resolve confidently."""

import pytest

from quoteagent.match import Matcher, tokenize
from quoteagent.models import RequestedLine


@pytest.fixture(scope="module")
def matcher(reference):
    return Matcher(reference)


def line(description: str, **kwargs) -> RequestedLine:
    return RequestedLine(
        raw_text=description, quantity=1, description=description, **kwargs
    )


def test_part_number_wins_outright(matcher):
    result = matcher.match(line("some vague shelving thing", mfr_part="HDS-4824-72"))
    assert result.item.sku == "GI-4417832"
    assert result.method == "mfr_part"
    assert result.confidence > 0.95


def test_specification_picks_between_near_identical_skus(matcher):
    """27x48 forks vs 20.5x48 forks — the dimension is the only difference."""
    result = matcher.match(line("pallet jack manual 5500 lb 27x48 forks"))
    assert result.item.sku == "GI-2210094"
    assert result.method == "text"
    assert result.confidence >= 0.8


def test_size_picks_between_near_identical_skus(matcher):
    assert matcher.match(line("nitrile gloves powder free large")).item.sku == "GI-8830515"
    assert matcher.match(line("nitrile gloves powder free medium")).item.sku == "GI-8830523"


def test_genuine_ambiguity_is_reported_not_guessed(matcher):
    """Steel and poly drum dollies are equally good reads of '55 gal drum dolly'."""
    result = matcher.match(line("55 gal drum dollies"))
    assert result.method == "ambiguous"
    assert result.confidence < 0.8
    assert {result.item.sku, *(sku for sku, _ in result.runners_up[:1])} == {
        "GI-3345120",
        "GI-3345138",
    }


def test_unknown_product_does_not_match(matcher):
    result = matcher.match(line("BRACKET ASSY"))
    assert result.item is None
    assert result.method == "no_match"


@pytest.mark.parametrize(
    "damaged,clean",
    [
        ("HEAVY DUTY STEEL SHELVlNG 48X24X72 5 SHELF", "heavy duty steel shelving 48x24x72"),
        ("PALLET JACK MANUAL 55OO LB 27X48 F0RKS", "pallet jack manual 5500 lb 27x48 forks"),
        ("LED HlGH BAY 15OW 5OOOK", "led high bay 150w 5000k"),
        ("NEUTRAL FL00R CLEANER C0NC 4X1 GAL", "neutral floor cleaner concentrate 4x1 gal"),
    ],
)
def test_ocr_damage_resolves_to_the_same_sku_as_clean_text(matcher, damaged, clean):
    damaged_result = matcher.match(line(damaged))
    clean_result = matcher.match(line(clean))
    assert damaged_result.item is not None
    assert damaged_result.item.sku == clean_result.item.sku
    # And it should be confident enough not to land in the review queue.
    assert damaged_result.confidence >= 0.8, damaged_result


def test_confusion_fold_is_applied_before_tokenizing():
    """The regression this guards: folding after the digit/letter split turns
    '55OO' into ['ss','oo'] while '5500' stays ['ssoo'], and they never match."""
    assert tokenize("55OO") == tokenize("5500")
    assert tokenize("15OW") == tokenize("150W")
    assert tokenize("SHELVlNG") == tokenize("SHELVING")
