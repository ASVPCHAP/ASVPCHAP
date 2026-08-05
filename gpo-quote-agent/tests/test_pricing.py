"""Contract pricing: precedence, volume breaks, margin floor, eligibility."""

from datetime import date

import pytest

from quoteagent.pricing import check_eligibility, price_line

QUOTE_DATE = date(2026, 8, 5)


@pytest.fixture
def contract(reference):
    return reference.contracts["RMP-MRO-2026"]


@pytest.fixture
def gold(reference):
    return reference.members["RMP-10442"]


@pytest.fixture
def silver(reference):
    return reference.members["RMP-30155"]


def codes(result):
    return {f.code for f in result.flags}


# --------------------------------------------------------------- precedence


def test_category_rule_beats_tier(reference, contract, gold):
    """Storage is -28% by category; gold tier is only -24%."""
    item = reference.item("GI-4417832")  # list 289.00
    result = price_line(item, 1, contract, gold)
    assert result.unit_price == 208.08  # 289 * 0.72
    assert "category rule" in result.basis
    assert not codes(result)


def test_tier_applies_where_no_category_rule_exists(reference, contract, gold):
    item = reference.item("GI-9912045")  # safety, list 4.35, no category rule
    result = price_line(item, 1, contract, gold)
    assert result.unit_price == 3.31  # 4.35 * 0.76
    assert "gold tier" in result.basis


def test_tier_is_member_specific(reference, contract, gold, silver):
    item = reference.item("GI-9912045")
    assert (
        price_line(item, 1, contract, gold).unit_price
        < price_line(item, 1, contract, silver).unit_price
    )


def test_fixed_line_price_overrides_everything_below_it(reference, contract, silver):
    """Silver tier (-18%) on a 189.00 list = 154.98, just under the 155.00 fixed
    price, so the fixed price is what a silver member pays."""
    item = reference.item("GI-6640210")
    result = price_line(item, 1, contract, silver)
    assert result.unit_price == 154.98
    assert "tier" in result.basis  # best-price clause picked the cheaper tier
    assert "TIER_UNDERCUT" in codes(result)


def test_off_contract_category_falls_to_list_and_flags(reference, contract, gold):
    item = reference.item("GI-8830515")  # safety-consumables, not covered
    result = price_line(item, 4, contract, gold)
    assert result.unit_price == item.list_price
    assert "OFF_CONTRACT" in codes(result)
    assert not any(f.blocking for f in result.flags)  # quotable, just flagged


# ------------------------------------------------------------ volume breaks


def test_volume_break_applies_at_threshold(reference, contract, gold):
    item = reference.item("GI-4417832")
    assert price_line(item, 9, contract, gold).unit_price == 208.08
    assert price_line(item, 10, contract, gold).unit_price == 197.68  # -5%
    assert price_line(item, 25, contract, gold).unit_price == 191.43  # -8%


def test_only_the_best_qualifying_break_applies(reference, contract, gold):
    """Breaks must not stack: qty 30 gets -8%, not -5% then -8%."""
    item = reference.item("GI-4417832")
    single = 289.00 * 0.72 * 0.92
    assert price_line(item, 30, contract, gold).unit_price == round(single, 2)


def test_a_deep_volume_break_can_breach_the_margin_floor(reference, contract, gold):
    """The floor is the last word, and it sits above the contract's own terms.
    Safety glasses at 500+ earn -11% on top of gold tier, which lands under
    cost+15% — so the contract entitles the member to a price the supplier
    cannot honour. That is a finding, not a rounding error."""
    item = reference.item("GI-9912045")  # list 4.35, cost 2.60
    result = price_line(item, 500, contract, gold)
    assert round(4.35 * 0.76 * 0.89, 2) < round(2.60 * 1.15, 2)  # entitled < floor
    assert result.unit_price == 2.99
    assert "MARGIN_FLOOR" in codes(result)


# ------------------------------------------------------------- margin floor


def test_margin_floor_clamps_and_blocks(reference, contract, gold):
    """Gold tier plus a volume break drives the pallet jack under cost+15%."""
    item = reference.item("GI-2210094")  # list 1199.00, cost 940.00
    result = price_line(item, 6, contract, gold)
    floor = round(940.00 * 1.15, 2)
    assert result.unit_price == floor == 1081.00
    assert "MARGIN_FLOOR" in codes(result)
    assert any(f.blocking for f in result.flags)


def test_margin_floor_never_lowers_a_compliant_price(reference, contract, gold):
    item = reference.item("GI-4417832")
    result = price_line(item, 1, contract, gold)
    assert result.unit_price > item.unit_cost * 1.15
    assert "MARGIN_FLOOR" not in codes(result)


# -------------------------------------------------------- best-price clause


def test_best_price_clause_takes_the_lower_of_rule_and_tier(reference, contract, gold):
    """Janitorial's category rule (-20%) is worse than gold tier (-24%). With a
    best-price clause the member gets the tier price, and the stale contract
    term is surfaced rather than silently honoured."""
    item = reference.item("GI-7761030")  # list 62.00
    result = price_line(item, 1, contract, gold)
    assert result.unit_price == 47.12  # 62 * 0.76, not 62 * 0.80
    assert "TIER_UNDERCUT" in codes(result)


def test_without_a_best_price_clause_the_contract_term_stands(reference, gold):
    from dataclasses import replace

    contract = replace(reference.contracts["RMP-MRO-2026"], best_price_clause=False)
    item = reference.item("GI-7761030")
    result = price_line(item, 1, contract, gold)
    assert result.unit_price == 49.60  # 62 * 0.80, the worse category rule
    assert "TIER_UNDERCUT" in codes(result)


# ------------------------------------------------------------------- limits


def test_quantity_over_contract_maximum_blocks(reference, contract, gold):
    item = reference.item("GI-9912045")
    result = price_line(item, 501, contract, gold)
    assert "QTY_EXCEEDS_MAX" in codes(result)
    assert any(f.blocking for f in result.flags)


def test_audit_trail_records_every_step(reference, contract, gold):
    result = price_line(reference.item("GI-2210094"), 6, contract, gold)
    trail = " | ".join(result.audit).lower()
    for expected in ("list price", "tier", "volume break", "margin floor"):
        assert expected in trail


# -------------------------------------------------------------- eligibility


def test_active_member_on_a_live_contract_is_eligible(reference, gold, contract):
    assert check_eligibility(gold, contract, QUOTE_DATE) == []


def test_suspended_member_cannot_be_quoted_on_contract(reference, contract):
    suspended = reference.members["RMP-20817"]
    flags = check_eligibility(suspended, contract, QUOTE_DATE)
    assert {f.code for f in flags} == {"MEMBER_NOT_ACTIVE"}
    assert flags[0].blocking
    assert "past due" in flags[0].detail


def test_unidentified_member_blocks(contract):
    flags = check_eligibility(None, contract, QUOTE_DATE)
    assert {f.code for f in flags} == {"MEMBER_NOT_IDENTIFIED"}


def test_expired_contract_blocks(reference, gold, contract):
    flags = check_eligibility(gold, contract, date(2027, 1, 1))
    assert "CONTRACT_NOT_IN_EFFECT" in {f.code for f in flags}
