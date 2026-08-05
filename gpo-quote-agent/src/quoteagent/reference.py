"""Loads the synthetic catalog, contracts and member roster."""

from __future__ import annotations

import json
from pathlib import Path

from .models import CatalogItem, Contract, Member

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class Reference:
    def __init__(
        self,
        items: list[CatalogItem],
        contracts: dict[str, Contract],
        members: dict[str, Member],
    ) -> None:
        self.items = items
        self.contracts = contracts
        self.members = members
        self._by_sku = {i.sku: i for i in items}
        self._by_part = {i.mfr_part.upper(): i for i in items}

    @classmethod
    def load(cls, data_dir: Path | str = DATA_DIR) -> Reference:
        data_dir = Path(data_dir)
        catalog = json.loads((data_dir / "catalog.json").read_text())
        contracts_doc = json.loads((data_dir / "contracts.json").read_text())

        items = [CatalogItem.from_dict(d) for d in catalog["items"]]
        contracts = {
            c["contract_id"]: Contract.from_dict(c) for c in contracts_doc["contracts"]
        }
        members = {
            m["member_id"]: Member.from_dict(m) for m in contracts_doc["members"]
        }
        return cls(items, contracts, members)

    def item(self, sku: str) -> CatalogItem | None:
        return self._by_sku.get(sku)

    def by_mfr_part(self, part: str) -> CatalogItem | None:
        return self._by_part.get(part.upper())

    def member(self, member_id: str | None) -> Member | None:
        if not member_id:
            return None
        return self.members.get(member_id.upper())

    def contract_for(self, member: Member | None) -> Contract | None:
        if member is None:
            return None
        return self.contracts.get(member.contract_id)
