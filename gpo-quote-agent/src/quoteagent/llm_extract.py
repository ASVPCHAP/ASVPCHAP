"""Claude-backed RFQ extraction.

This is the path that makes the pipeline general. The deterministic parsers in
`extract.py` only understand the shapes we anticipated; a model reads whatever
the customer actually sent — a forwarded thread, a photographed page, a
spreadsheet with three header rows and a merged cell.

Requires `pip install anthropic` and credentials (`ANTHROPIC_API_KEY`, or an
`ant auth login` profile). Run with `--extractor llm`.
"""

from __future__ import annotations

import json
import os

from .models import RFQ, RequestedLine

MODEL = "claude-opus-5"

SYSTEM = """You extract line items from B2B purchase requests sent to an industrial supplier.

The requests arrive as forwarded emails, exported spreadsheets, and OCR'd scans of \
paper requisitions. They are written by humans in a hurry and are frequently \
ambiguous.

Rules:
- One output line per item the customer wants to buy. Do not merge or split items.
- `quantity` is how many units the customer wants. Never take a number from a \
specification: "5500 lb", "48x24x72", "150W", "5 shelf", "55 gal" and "4x1 gallon" \
are all specs, not quantities. If no quantity is stated, use null.
- `uom` is the unit the customer counted in, normalized to one of EA, BX, CS, PR, \
PK, RL, ST. Use null if not stated. Report the unit the customer actually wrote \
even when you suspect they meant a different one — a box/case mismatch is a real \
finding for the human reviewer, not something to silently correct.
- `description` is the product, with quantity words and filler removed. Preserve \
every specification (dimensions, capacity, wattage, size, color, material).
- `mfr_part` is a manufacturer part number if one appears, else null.
- `confidence` is 0.0-1.0: how sure you are this line is a correct reading of the \
source. Lower it for OCR damage, ambiguous quantities, or items you cannot read \
cleanly. Do not guess at illegible text — extract what is legible and lower the \
confidence.
- Extract `member_id` (a GPO membership number, e.g. RMP-10442), `ship_to`, \
`requested_by` and `needed_by` if present, else null.

Extract what is there. Do not infer items the customer did not ask for."""

LINE_SCHEMA = {
    "type": "object",
    "properties": {
        "raw_text": {
            "type": "string",
            "description": "The source text this line came from, verbatim.",
        },
        "quantity": {
            "anyOf": [{"type": "integer"}, {"type": "null"}],
            "description": "Units requested, or null if not stated.",
        },
        "description": {"type": "string"},
        "uom": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "mfr_part": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "notes": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": [
        "raw_text",
        "quantity",
        "description",
        "uom",
        "mfr_part",
        "notes",
        "confidence",
    ],
    "additionalProperties": False,
}

RFQ_SCHEMA = {
    "type": "object",
    "properties": {
        "member_id": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "ship_to": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "requested_by": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "needed_by": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "lines": {"type": "array", "items": LINE_SCHEMA},
    },
    "required": ["member_id", "ship_to", "requested_by", "needed_by", "lines"],
    "additionalProperties": False,
}


class ExtractionRefused(RuntimeError):
    """The model declined the request; nothing was extracted."""


def extract_with_claude(text: str, channel: str, source: str) -> RFQ:
    try:
        import anthropic
    except ModuleNotFoundError as exc:  # pragma: no cover - depends on env
        raise RuntimeError(
            "The LLM extractor needs the Anthropic SDK: pip install anthropic"
        ) from exc

    client = anthropic.Anthropic()

    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=SYSTEM,
        output_config={
            "effort": os.getenv("QUOTEAGENT_EFFORT", "medium"),
            "format": {"type": "json_schema", "schema": RFQ_SCHEMA},
        },
        messages=[
            {
                "role": "user",
                "content": (
                    f"Channel: {channel}\n"
                    f"Source: {source}\n\n"
                    f"<request>\n{text}\n</request>"
                ),
            }
        ],
    )

    if response.stop_reason == "refusal":
        category = getattr(response.stop_details, "category", None)
        raise ExtractionRefused(f"model declined this document (category={category})")

    payload = json.loads(next(b.text for b in response.content if b.type == "text"))
    return _to_rfq(payload, channel=channel, source=source, raw_text=text)


def _to_rfq(payload: dict, channel: str, source: str, raw_text: str) -> RFQ:
    lines = [
        RequestedLine(
            raw_text=d.get("raw_text", ""),
            quantity=d.get("quantity"),
            description=d.get("description", ""),
            uom=d.get("uom"),
            mfr_part=d.get("mfr_part"),
            notes=d.get("notes", ""),
            extraction_confidence=float(d.get("confidence", 0.5)),
        )
        for d in payload.get("lines", [])
    ]
    return RFQ(
        source_path=source,
        channel=channel,
        member_id=payload.get("member_id"),
        ship_to=payload.get("ship_to"),
        lines=lines,
        requested_by=payload.get("requested_by"),
        needed_by=payload.get("needed_by"),
        raw_text=raw_text,
        extractor="llm",
    )
