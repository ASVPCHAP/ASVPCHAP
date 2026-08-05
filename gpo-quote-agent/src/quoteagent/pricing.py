"""Contract pricing.

This is the part a generic CPQ tool doesn't have. The price on a GPO line is not
"list minus a discount" — it is the output of a precedence chain, and every step
has to be explainable afterwards, because the GPO audits it:

    1. fixed contract line price
    2. contract category rule
    3. member tier discount off list
    4. list price (off-contract — a compliance exception, not a normal path)

then volume breaks on whatever the base resolved to, then a margin floor that
the supplier will not sell below regardless of what the contract says.

Every line carries the trail. `audit` is the artifact that makes a quote
defensible in a contract review.
"""

from __future__ import annotations

from dataclasses import dataclass

from .models import CatalogItem, Contract, Flag, Member


@dataclass
class PricedResult:
    unit_price: float
    basis: str
    audit: list[str]
    flags: list[Flag]


def _money(value: float) -> float:
    return round(value + 1e-9, 2)


def _volume_break(contract: Contract, sku: str, qty: int) -> dict | None:
    breaks = sorted(
        (b for b in contract.volume_breaks.get(sku, []) if qty >= int(b["min_qty"])),
        key=lambda b: int(b["min_qty"]),
    )
    return breaks[-1] if breaks else None


def price_line(
    item: CatalogItem,
    qty: int,
    contract: Contract,
    member: Member,
) -> PricedResult:
    audit: list[str] = []
    flags: list[Flag] = []

    audit.append(f"List price {item.list_price:.2f} / {item.uom} (SKU {item.sku})")

    # ---- step 1-4: resolve the contract base price -------------------------
    if not contract.covers(item):
        audit.append(
            f"Category '{item.category}' is NOT in contract {contract.contract_id} "
            f"({', '.join(sorted(contract.covered_categories))}) — priced at list"
        )
        flags.append(
            Flag(
                "OFF_CONTRACT",
                f"'{item.category}' is outside contract {contract.contract_id}. "
                f"Quoted at list; member expects contract pricing on this line.",
            )
        )
        return PricedResult(_money(item.list_price), "list (off-contract)", audit, flags)

    tier_pct = contract.tiers[member.tier]
    tier_price = item.list_price * (1 - tier_pct)

    fixed = contract.line_prices.get(item.sku)
    category_pct = contract.category_rules.get(item.category)

    if fixed and fixed.get("type") == "fixed":
        base = float(fixed["price"])
        basis = f"contract fixed price ({contract.contract_id})"
        audit.append(f"Fixed contract line price {base:.2f} (overrides tier and category)")
    elif category_pct is not None:
        base = item.list_price * (1 - category_pct)
        basis = f"category rule '{item.category}' -{category_pct:.0%}"
        audit.append(
            f"Category rule '{item.category}' -{category_pct:.0%} -> {base:.2f} "
            f"(takes precedence over tier)"
        )
    else:
        base = tier_price
        basis = f"{member.tier} tier -{tier_pct:.0%}"
        audit.append(f"{member.tier.title()} tier -{tier_pct:.0%} -> {base:.2f}")

    # ---- best-price clause ------------------------------------------------
    if tier_price < base - 0.005:
        detail = (
            f"Contract precedence yields {base:.2f} but {member.tier} tier "
            f"(-{tier_pct:.0%}) yields {tier_price:.2f}."
        )
        if contract.best_price_clause:
            audit.append(
                f"Best-price clause: tier {tier_price:.2f} beats {basis} {base:.2f} "
                f"-> applying tier"
            )
            base = tier_price
            basis = f"{member.tier} tier via best-price clause"
            flags.append(
                Flag(
                    "TIER_UNDERCUT",
                    detail + " Best-price clause applied; contract terms may be stale.",
                )
            )
        else:
            audit.append(
                f"No best-price clause: holding {basis} {base:.2f} despite better tier price"
            )
            flags.append(
                Flag(
                    "TIER_UNDERCUT",
                    detail + " No best-price clause — member is likely to dispute.",
                )
            )

    # ---- volume breaks ----------------------------------------------------
    vb = _volume_break(contract, item.sku, qty)
    if vb:
        pct = float(vb["pct"])
        base *= 1 - pct
        audit.append(
            f"Volume break at qty {vb['min_qty']}+ -{pct:.0%} -> {base:.2f} (qty {qty})"
        )
        basis += f" + vol -{pct:.0%}"

    unit_price = _money(base)

    # ---- margin floor ----------------------------------------------------
    floor = _money(item.unit_cost * (1 + contract.margin_floor_pct))
    if unit_price < floor:
        audit.append(
            f"MARGIN FLOOR: {unit_price:.2f} is below cost {item.unit_cost:.2f} "
            f"+{contract.margin_floor_pct:.0%} = {floor:.2f} -> clamped"
        )
        flags.append(
            Flag(
                "MARGIN_FLOOR",
                f"Contract price {unit_price:.2f} breaches the "
                f"{contract.margin_floor_pct:.0%} margin floor ({floor:.2f}). "
                f"Clamped — needs a pricing exception or a contract amendment.",
                blocking=True,
            )
        )
        unit_price = floor
        basis += " (margin floor)"
    else:
        margin = (unit_price - item.unit_cost) / unit_price if unit_price else 0.0
        audit.append(f"Margin check OK: {margin:.1%} at {unit_price:.2f}")

    if qty > contract.max_line_qty:
        flags.append(
            Flag(
                "QTY_EXCEEDS_MAX",
                f"Qty {qty} exceeds the contract per-line maximum of "
                f"{contract.max_line_qty}. Needs a special-order quote.",
                blocking=True,
            )
        )

    return PricedResult(unit_price, basis, audit, flags)


def check_eligibility(
    member: Member | None, contract: Contract | None, quote_date
) -> list[Flag]:
    """Contract-level gates that invalidate the whole quote."""
    flags: list[Flag] = []

    if member is None:
        flags.append(
            Flag(
                "MEMBER_NOT_IDENTIFIED",
                "No GPO member could be identified from the RFQ. Contract pricing "
                "cannot be applied — quote at list or get the membership number.",
                blocking=True,
            )
        )
        return flags

    if member.status != "active":
        flags.append(
            Flag(
                "MEMBER_NOT_ACTIVE",
                f"{member.name} ({member.member_id}) is {member.status}"
                + (f": {member.suspension_reason}" if member.suspension_reason else "")
                + ". Contract pricing is not available.",
                blocking=True,
            )
        )

    if contract is None:
        flags.append(
            Flag(
                "CONTRACT_NOT_FOUND",
                f"Member {member.member_id} references contract "
                f"{member.contract_id}, which is not loaded.",
                blocking=True,
            )
        )
    elif not contract.in_effect(quote_date):
        flags.append(
            Flag(
                "CONTRACT_NOT_IN_EFFECT",
                f"Contract {contract.contract_id} runs "
                f"{contract.effective}..{contract.expires}; quote date {quote_date} "
                f"is outside that window.",
                blocking=True,
            )
        )

    return flags
