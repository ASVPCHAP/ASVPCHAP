"""Turn a messy RFQ (email, spreadsheet, scanned page) into structured lines.

Two implementations sit behind `extract()`:

* the deterministic parsers in this module, which run with no API key and are
  what the tests exercise;
* the Claude-backed extractor in `llm_extract.py`, used when
  `--extractor llm` is passed (or `QUOTEAGENT_EXTRACTOR=llm` is set).

The deterministic parsers are deliberately good enough to demo, not good enough
to ship: they cover the shapes in `data/samples/`. Real RFQ traffic is
open-ended, which is the argument for the LLM path.
"""

from __future__ import annotations

import csv
import io
import re
from pathlib import Path

from .models import RFQ, RequestedLine

MEMBER_ID_RE = re.compile(r"\bRMP[-\s]?(\d{5})\b", re.IGNORECASE)
PART_RE = re.compile(r"\b[A-Z]{2,4}(?:-[A-Z0-9]+){1,3}\b")

QTY_UNITS = {
    "ea": "EA",
    "each": "EA",
    "pc": "EA",
    "pcs": "EA",
    "piece": "EA",
    "pieces": "EA",
    "unit": "EA",
    "units": "EA",
    "box": "BX",
    "boxes": "BX",
    "bx": "BX",
    "case": "CS",
    "cases": "CS",
    "cs": "CS",
    "pair": "PR",
    "pairs": "PR",
    "pr": "PR",
    "pack": "PK",
    "packs": "PK",
    "pk": "PK",
    "roll": "RL",
    "rolls": "RL",
    "set": "ST",
    "sets": "ST",
}

# Units that mark a *specification*, not a quantity ("5500 lb", "150w", "55 gal").
SPEC_UNITS = (
    "lb|lbs|pound|pounds|gal|gallon|gallons|oz|in|inch|inches|ft|foot|feet|"
    "mm|cm|m|w|watt|watts|k|v|volt|volts|amp|amps|lumen|lumens|btu|"
    "shelf|shelves|level|levels|tier|tiers|gauge|ga|ply"
)

SPEC_PATTERNS = [
    re.compile(r"\d+(?:\.\d+)?\s*[xX]\s*\d+(?:\.\d+)?(?:\s*[xX]\s*\d+(?:\.\d+)?)*"),
    re.compile(rf"\d+(?:\.\d+)?\s*(?:{SPEC_UNITS})\b", re.IGNORECASE),
    re.compile(r"\d+(?:\.\d+)?\s*[\"']"),
    re.compile(r"\bZ\d+(?:\.\d+)?\b", re.IGNORECASE),
]

FILLER_RE = re.compile(
    r"\b(?:of the|of|the|our|please|pls|need|needs|want|require|requires|"
    r"qty|quantity|part|part number|pn|item|approx|about|and|for)\b",
    re.IGNORECASE,
)

PLACEHOLDER = "\x00{}\x00"


# --------------------------------------------------------------- shared helpers


def _mask_specs(text: str) -> tuple[str, list[str]]:
    """Hide dimension/spec numbers so they can't be mistaken for a quantity."""
    kept: list[str] = []
    masked = text
    for pattern in SPEC_PATTERNS:
        while True:
            m = pattern.search(masked)
            if not m:
                break
            kept.append(m.group(0))
            masked = masked[: m.start()] + PLACEHOLDER.format(len(kept) - 1) + masked[m.end() :]
    return masked, kept


def _unmask(text: str, kept: list[str]) -> str:
    for i, original in enumerate(kept):
        text = text.replace(PLACEHOLDER.format(i), original)
    return text


def _clean_description(text: str) -> str:
    text = FILLER_RE.sub(" ", text)
    text = re.sub(r"[,;:]+", " ", text)
    text = re.sub(r"\s*[-–]\s*$", "", text)
    text = re.sub(r"^\s*[-–]\s*", "", text)
    text = re.sub(r"\(\s*\)", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip(" -–,.")


def _find_part(text: str) -> str | None:
    for candidate in PART_RE.findall(text.upper()):
        if sum(c.isdigit() for c in candidate) >= 2:
            return candidate
    return None


_UNIT_ALT = "|".join(sorted(QTY_UNITS, key=len, reverse=True))

QTY_RULES: list[tuple[re.Pattern[str], float]] = [
    # leading quantity: "24 ea of ...", "6 pallet jacks"
    (re.compile(rf"^\s*(?P<qty>\d+)\s*(?P<unit>{_UNIT_ALT})?\b", re.IGNORECASE), 0.95),
    # trailing quantity: "... - 40 boxes"
    (
        re.compile(
            rf"[-–]\s*(?P<qty>\d+)\s*(?P<unit>{_UNIT_ALT})?\s*$", re.IGNORECASE
        ),
        0.9,
    ),
    # cued quantity: "need 200 pair", "qty: 12"
    (
        re.compile(
            rf"\b(?:need|needs|want|require|requires|qty|quantity)\b[:\s]*"
            rf"(?P<qty>\d+)\s*(?P<unit>{_UNIT_ALT})?\b",
            re.IGNORECASE,
        ),
        0.9,
    ),
    # number immediately followed by a counting unit anywhere in the line
    (re.compile(rf"\b(?P<qty>\d+)\s*(?P<unit>{_UNIT_ALT})\b", re.IGNORECASE), 0.85),
    # last resort: a bare number
    (re.compile(r"\b(?P<qty>\d+)\b"), 0.6),
]


def parse_line_item(raw: str) -> RequestedLine:
    """Pull quantity, unit and description out of one free-text line."""
    text = re.sub(r"^\s*[-*•·]\s*", "", raw.strip())
    part = _find_part(text)
    masked, kept = _mask_specs(text)

    quantity: int | None = None
    uom: str | None = None
    confidence = 0.5
    remainder = masked

    for pattern, rule_confidence in QTY_RULES:
        m = pattern.search(masked)
        if not m:
            continue
        quantity = int(m.group("qty"))
        unit_word = (m.groupdict().get("unit") or "").lower()
        uom = QTY_UNITS.get(unit_word)
        confidence = rule_confidence if uom else rule_confidence - 0.1
        remainder = masked[: m.start()] + " " + masked[m.end() :]
        break

    description = _clean_description(_unmask(remainder, kept))
    if part:
        description = re.sub(re.escape(part), " ", description, flags=re.IGNORECASE)
        description = _clean_description(description)
    if not description:
        confidence = min(confidence, 0.35)

    return RequestedLine(
        raw_text=raw.strip(),
        quantity=quantity,
        description=description,
        uom=uom,
        mfr_part=part,
        extraction_confidence=round(confidence, 2),
    )


def _find_member_id(text: str) -> str | None:
    m = MEMBER_ID_RE.search(text)
    return f"RMP-{m.group(1)}" if m else None


# ---------------------------------------------------------------- email channel


def parse_email(text: str, source: str) -> RFQ:
    lines = text.splitlines()
    body_start = 0
    for i, line in enumerate(lines):
        if not line.strip():
            body_start = i
            break

    requested: list[RequestedLine] = []
    for line in lines[body_start:]:
        if not re.match(r"^\s*[-*•·]\s*\S", line):
            continue
        parsed = parse_line_item(line)
        if parsed.description:
            requested.append(parsed)

    ship_to = None
    for line in lines:
        m = re.search(r"\bship\s+(?:everything\s+)?to\s+(.+)", line, re.IGNORECASE)
        if m:
            # Stop at the sentence boundary — the rest of the line is usually
            # unrelated ("... dock 3. We're tax exempt, cert is on file").
            ship_to = re.split(r"(?<=[a-z0-9])\.\s", m.group(1))[0].strip(" .")
            ship_to = re.sub(r"^our\s+", "", ship_to, flags=re.IGNORECASE)
            break

    requested_by = None
    for line in lines:
        m = re.match(r"^From:\s*(.+)$", line, re.IGNORECASE)
        if m:
            requested_by = m.group(1).strip()
            break

    return RFQ(
        source_path=source,
        channel="email",
        member_id=_find_member_id(text),
        ship_to=ship_to,
        lines=requested,
        requested_by=requested_by,
        raw_text=text,
    )


# ------------------------------------------------------------ spreadsheet channel

HEADER_QTY = re.compile(r"^(qty|quantity|qnty|amount)\b", re.IGNORECASE)
HEADER_DESC = re.compile(r"^(desc|description|item description|product)\b", re.IGNORECASE)
HEADER_UOM = re.compile(r"^(uom|u/m|unit|units|unit of measure|pkg)\b", re.IGNORECASE)
HEADER_NOTE = re.compile(r"^(note|notes|comment|comments)\b", re.IGNORECASE)


def parse_spreadsheet(text: str, source: str) -> RFQ:
    rows = list(csv.reader(io.StringIO(text)))

    header_idx = -1
    cols: dict[str, int] = {}
    for i, row in enumerate(rows):
        cells = [c.strip() for c in row]
        found: dict[str, int] = {}
        for j, cell in enumerate(cells):
            if HEADER_QTY.match(cell):
                found["qty"] = j
            elif HEADER_DESC.match(cell):
                found["desc"] = j
            elif HEADER_UOM.match(cell):
                found["uom"] = j
            elif HEADER_NOTE.match(cell):
                found["note"] = j
        if "qty" in found and "desc" in found:
            header_idx, cols = i, found
            break

    preamble = "\n".join(",".join(r) for r in rows[: max(header_idx, 0)])
    ship_to = None
    for row in rows[: max(header_idx, 0)]:
        cells = [c.strip() for c in row]
        for j, cell in enumerate(cells):
            if re.match(r"^ship\s*to", cell, re.IGNORECASE) and j + 1 < len(cells):
                ship_to = cells[j + 1] or None

    requested: list[RequestedLine] = []
    if header_idx >= 0:
        for row in rows[header_idx + 1 :]:
            cells = [c.strip() for c in row]
            if not any(cells):
                continue
            description = cells[cols["desc"]] if cols["desc"] < len(cells) else ""
            qty_cell = cells[cols["qty"]] if cols["qty"] < len(cells) else ""
            if not description or not re.fullmatch(r"\d+", qty_cell):
                continue
            if re.search(r"\btotal\b", description, re.IGNORECASE):
                continue
            note = (
                cells[cols["note"]]
                if "note" in cols and cols["note"] < len(cells)
                else ""
            )
            uom_cell = (
                cells[cols["uom"]] if "uom" in cols and cols["uom"] < len(cells) else ""
            )
            requested.append(
                RequestedLine(
                    raw_text=",".join(cells),
                    quantity=int(qty_cell),
                    description=description,
                    uom=QTY_UNITS.get(uom_cell.lower(), uom_cell.upper() or None),
                    mfr_part=_find_part(f"{description} {note}"),
                    notes=note,
                    extraction_confidence=0.97,
                )
            )

    return RFQ(
        source_path=source,
        channel="spreadsheet",
        member_id=_find_member_id(preamble or text),
        ship_to=ship_to,
        lines=requested,
        raw_text=text,
    )


# -------------------------------------------------------------- scanned channel

OCR_ROW_RE = re.compile(r"^\s*(?P<qty>\d{1,5})\s+(?P<uom>[A-Z/]{1,3})\s+(?P<desc>\S.*)$")
ILLEGIBLE_RE = re.compile(r"(x{3,}|\?{3,}|illegible|llegible)", re.IGNORECASE)


def parse_scanned(text: str, source: str) -> RFQ:
    lines = text.splitlines()
    start = 0
    for i, line in enumerate(lines):
        collapsed = line.upper().replace("0", "O")
        if "QTY" in collapsed and "DESCRIPTI" in collapsed:
            start = i + 1
            break

    requested: list[RequestedLine] = []
    for line in lines[start:]:
        if not line.strip() or set(line.strip()) <= {"-", " "}:
            continue
        m = OCR_ROW_RE.match(line)
        if not m:
            continue
        description = m.group("desc").strip()
        confidence = 0.75
        if ILLEGIBLE_RE.search(description):
            confidence = 0.30
            description = ILLEGIBLE_RE.sub(" ", description).strip()
        requested.append(
            RequestedLine(
                raw_text=line.strip(),
                quantity=int(m.group("qty")),
                description=description,
                uom=QTY_UNITS.get(m.group("uom").lower(), m.group("uom").upper()),
                mfr_part=_find_part(description),
                extraction_confidence=confidence,
            )
        )

    ship_to = None
    for line in lines:
        if re.search(r"\bD[O0]CK\b", line.upper()):
            # Scanned pages are column layouts; the fields to the right of a
            # run of spaces belong to a different column.
            ship_to = re.split(r"\s{3,}", line.strip())[0].strip()
            break

    return RFQ(
        source_path=source,
        channel="scanned",
        member_id=_find_member_id(text),
        ship_to=ship_to,
        lines=requested,
        raw_text=text,
    )


# --------------------------------------------------------------------- dispatch


def detect_channel(path: Path, text: str) -> str:
    if path.suffix.lower() in {".csv", ".tsv"}:
        return "spreadsheet"
    head = text[:1500].upper()
    if re.search(r"^(FROM|TO|SUBJECT):", text[:400], re.MULTILINE | re.IGNORECASE):
        return "email"
    if "REQUISITI" in head.replace("0", "O") or "PURCHASE ORDER" in head:
        return "scanned"
    return "email"


PARSERS = {
    "email": parse_email,
    "spreadsheet": parse_spreadsheet,
    "scanned": parse_scanned,
}


def extract(path: Path | str, extractor: str = "deterministic") -> RFQ:
    path = Path(path)
    text = path.read_text()
    channel = detect_channel(path, text)

    if extractor == "llm":
        from .llm_extract import extract_with_claude

        rfq = extract_with_claude(text, channel=channel, source=str(path))
        rfq.extractor = "llm"
        return rfq

    rfq = PARSERS[channel](text, str(path))
    rfq.extractor = "deterministic"
    return rfq
