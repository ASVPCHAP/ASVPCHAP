"""Core data structures for the RFQ -> quote pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any


# ---------------------------------------------------------------- reference data


@dataclass(frozen=True)
class CatalogItem:
    sku: str
    mfr_part: str
    description: str
    category: str
    uom: str
    list_price: float
    unit_cost: float
    stock: int
    keywords: tuple[str, ...] = ()
    uom_conversion: dict[str, int] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> CatalogItem:
        return cls(
            sku=d["sku"],
            mfr_part=d["mfr_part"],
            description=d["description"],
            category=d["category"],
            uom=d["uom"],
            list_price=float(d["list_price"]),
            unit_cost=float(d["unit_cost"]),
            stock=int(d["stock"]),
            keywords=tuple(d.get("keywords", ())),
            uom_conversion=dict(d.get("uom_conversion", {})),
        )


@dataclass(frozen=True)
class Contract:
    contract_id: str
    gpo: str
    supplier: str
    effective: date
    expires: date
    covered_categories: frozenset[str]
    tiers: dict[str, float]
    category_rules: dict[str, float]
    line_prices: dict[str, dict[str, Any]]
    volume_breaks: dict[str, list[dict[str, Any]]]
    best_price_clause: bool
    margin_floor_pct: float
    max_line_qty: int
    freight_terms: str
    payment_terms: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Contract:
        return cls(
            contract_id=d["contract_id"],
            gpo=d["gpo"],
            supplier=d["supplier"],
            effective=date.fromisoformat(d["effective"]),
            expires=date.fromisoformat(d["expires"]),
            covered_categories=frozenset(d["covered_categories"]),
            tiers=dict(d["tiers"]),
            category_rules=dict(d.get("category_rules", {})),
            line_prices=dict(d.get("line_prices", {})),
            volume_breaks=dict(d.get("volume_breaks", {})),
            best_price_clause=bool(d.get("best_price_clause", False)),
            margin_floor_pct=float(d["margin_floor_pct"]),
            max_line_qty=int(d["max_line_qty"]),
            freight_terms=d.get("freight_terms", ""),
            payment_terms=d.get("payment_terms", ""),
        )

    def covers(self, item: CatalogItem) -> bool:
        return item.category in self.covered_categories

    def in_effect(self, on: date) -> bool:
        return self.effective <= on <= self.expires


@dataclass(frozen=True)
class Member:
    member_id: str
    name: str
    contract_id: str
    tier: str
    status: str
    tax_exempt: bool
    ship_to: tuple[str, ...] = ()
    suspension_reason: str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Member:
        return cls(
            member_id=d["member_id"],
            name=d["name"],
            contract_id=d["contract_id"],
            tier=d["tier"],
            status=d["status"],
            tax_exempt=bool(d.get("tax_exempt", False)),
            ship_to=tuple(d.get("ship_to", ())),
            suspension_reason=d.get("suspension_reason", ""),
        )


# ------------------------------------------------------------------ RFQ intake


@dataclass
class RequestedLine:
    """One line item as the customer expressed it, before catalog resolution."""

    raw_text: str
    quantity: int | None
    description: str
    uom: str | None = None
    mfr_part: str | None = None
    notes: str = ""
    extraction_confidence: float = 1.0


@dataclass
class RFQ:
    source_path: str
    channel: str  # email | spreadsheet | scanned
    member_id: str | None
    ship_to: str | None
    lines: list[RequestedLine] = field(default_factory=list)
    requested_by: str | None = None
    needed_by: str | None = None
    raw_text: str = ""
    extractor: str = "deterministic"


# ----------------------------------------------------------------- match result


@dataclass
class MatchResult:
    item: CatalogItem | None
    confidence: float
    method: str
    runners_up: list[tuple[str, float]] = field(default_factory=list)


# --------------------------------------------------------------- priced output


@dataclass
class Flag:
    code: str
    detail: str
    blocking: bool = False


@dataclass
class QuotedLine:
    requested: RequestedLine
    match: MatchResult
    quantity: int
    uom: str | None
    unit_price: float | None
    extended_price: float | None
    pricing_basis: str = ""
    audit: list[str] = field(default_factory=list)
    flags: list[Flag] = field(default_factory=list)

    @property
    def sku(self) -> str:
        return self.match.item.sku if self.match.item else "—"

    @property
    def needs_review(self) -> bool:
        return bool(self.flags)

    @property
    def is_blocked(self) -> bool:
        return any(f.blocking for f in self.flags)


@dataclass
class Quote:
    quote_id: str
    rfq: RFQ
    member: Member | None
    contract: Contract | None
    quote_date: date
    lines: list[QuotedLine] = field(default_factory=list)
    flags: list[Flag] = field(default_factory=list)
    status: str = "DRAFT"  # AUTO_SEND | HOLD_FOR_REVIEW | REJECTED

    @property
    def subtotal(self) -> float:
        return round(sum(l.extended_price or 0.0 for l in self.lines), 2)

    @property
    def review_lines(self) -> list[QuotedLine]:
        return [l for l in self.lines if l.needs_review]

    @property
    def all_flags(self) -> list[Flag]:
        return list(self.flags) + [f for l in self.lines for f in l.flags]
