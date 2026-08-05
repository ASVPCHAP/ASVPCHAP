"""Command line entry point.

    python -m quoteagent.cli data/samples/rfq_email.txt
    python -m quoteagent.cli data/samples/rfq_scanned_ocr.txt --audit
    python -m quoteagent.cli data/samples/rfq_spreadsheet.csv --json
    python -m quoteagent.cli <file> --extractor llm      # needs ANTHROPIC_API_KEY
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

from .extract import extract
from .quote import build_quote, to_dict
from .reference import DATA_DIR, Reference
from .render import render, render_audit

EXIT_BY_STATUS = {
    "AUTO_SEND": 0,
    "REVIEW_RECOMMENDED": 0,
    "HOLD_FOR_REVIEW": 1,
    "REJECTED": 2,
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="quoteagent",
        description="Turn a GPO member's RFQ into a contract-priced quote.",
    )
    parser.add_argument("rfq", help="Path to an RFQ (email text, CSV, or OCR text)")
    parser.add_argument(
        "--member",
        help="Override the GPO member ID instead of reading it from the RFQ",
    )
    parser.add_argument(
        "--extractor",
        choices=["deterministic", "llm"],
        default=os.getenv("QUOTEAGENT_EXTRACTOR", "deterministic"),
        help="Line-item extraction backend (default: deterministic)",
    )
    parser.add_argument("--data-dir", default=str(DATA_DIR), help="Reference data directory")
    parser.add_argument("--date", help="Quote date as YYYY-MM-DD (default: today)")
    parser.add_argument("--audit", action="store_true", help="Print the pricing audit trail")
    parser.add_argument("--json", action="store_true", help="Emit the machine-readable quote")
    args = parser.parse_args(argv)

    quote_date = date.fromisoformat(args.date) if args.date else date.today()
    reference = Reference.load(args.data_dir)

    try:
        rfq = extract(Path(args.rfq), extractor=args.extractor)
    except RuntimeError as exc:
        print(f"extraction failed: {exc}", file=sys.stderr)
        return 3

    quote = build_quote(rfq, reference, quote_date=quote_date, member_override=args.member)

    if args.json:
        print(json.dumps(to_dict(quote), indent=2))
    else:
        print(render(quote))
        if args.audit:
            print()
            print(render_audit(quote))

    return EXIT_BY_STATUS.get(quote.status, 1)


if __name__ == "__main__":
    sys.exit(main())
