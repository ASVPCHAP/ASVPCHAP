# GPO Quote Agent

A working demo of the wedge: a legacy supplier receives a GPO member's RFQ as a
forwarded email, an exported spreadsheet, or a scan of a paper requisition, and
gets back a contract-priced quote with an audit trail and an exception queue.

All data here is **synthetic**. The catalog, contract terms and member roster are
invented; no real supplier's or GPO's data is used. See `PLAN.md` for the
business architecture this implements.

## Run it

No dependencies, no API key:

```bash
cd gpo-quote-agent
PYTHONPATH=src python3 -m quoteagent.cli data/samples/rfq_email.txt --date 2026-08-05
PYTHONPATH=src python3 -m quoteagent.cli data/samples/rfq_scanned_ocr.txt --audit
PYTHONPATH=src python3 -m quoteagent.cli data/samples/rfq_spreadsheet.csv --json
```

Exit codes are CI-friendly: `0` clear to send, `1` held for review, `2` rejected.

```bash
python3 -m pytest tests -q     # 68 tests
```

## The demo claim

`data/samples/` holds the **same order** arriving three ways — a chatty email, a
spreadsheet with four preamble rows, and an OCR'd requisition where `5500` came
through as `55OO` and `SHELVING` as `SHELVlNG`. All three produce identical SKUs,
quantities and prices. The scan produces exactly one extra line: the one that is
genuinely illegible, which is flagged rather than guessed.

## Pipeline

```
RFQ file
   │
   ├─ extract.py     detect channel, pull line items      → RequestedLine[]
   │                 (deterministic parsers, or Claude via --extractor llm)
   ├─ match.py       resolve text → catalog SKU + confidence
   ├─ review.py      UOM reconciliation, confidence gating
   ├─ pricing.py     contract precedence → volume breaks → margin floor
   └─ quote.py       assemble, set status
                     → render.py (human) or to_dict() (ERP/CRM)
```

### Pricing is a precedence chain, not a discount

This is the part a generic CPQ tool doesn't model. Every step is recorded so the
quote survives a contract audit:

1. **Fixed contract line price** — overrides everything below it
2. **Contract category rule** — e.g. storage at -28%
3. **Member tier discount** — bronze/silver/gold off list
4. **List price** — off-contract, which is a compliance exception, not a normal path

Then volume breaks on whichever base resolved (best qualifying break only, never
stacked), then a **margin floor** the supplier will not sell below regardless of
what the contract entitles the member to.

Two findings fall out of that chain that a supplier-side tool alone would miss:

- **`TIER_UNDERCUT`** — the contract's category rule produces a *worse* price
  than the member's own tier. With a best-price clause the member gets the tier
  price and the stale contract term is surfaced; without one, the member is
  going to dispute the quote. Either way somebody should know.
- **`MARGIN_FLOOR`** — the contract entitles the member to a price below
  cost + floor. Real in this dataset on the pallet jack (gold tier + volume break
  lands under cost+15%) and on safety glasses at 500+. The price is clamped and
  the line blocks; resolving it needs a pricing exception or a contract amendment.

### Confidence gating

The product's value is not that the model is always right — it's that when it
isn't sure, the quote says so on that line instead of shipping a wrong price.

| Flag | Blocks | Meaning |
|---|---|---|
| `MISSING_QTY` | ✓ | No quantity readable |
| `EXTRACTION_LOW_CONFIDENCE` | ✓ <45% | Line read poorly (OCR damage) |
| `NO_MATCH` | ✓ | No catalog SKU is a plausible read |
| `AMBIGUOUS_MATCH` | ✓ | Two SKUs fit equally well — human picks |
| `MATCH_LOW_CONFIDENCE` | ✓ <60% | Matched, but not confidently |
| `UOM_CONVERTED` / `UOM_MISMATCH` | ✓ | Box/case mix-up: a 10x error either way |
| `MARGIN_FLOOR` | ✓ | Contract price breaches the floor |
| `QTY_EXCEEDS_MAX` | ✓ | Over the contract's per-line cap |
| `OFF_CONTRACT` | | Category outside the contract; quoted at list |
| `TIER_UNDERCUT` | | Contract term is worse than the member's tier |
| `BACKORDER_RISK` | | Quantity exceeds on-hand |
| `MEMBER_NOT_ACTIVE`, `CONTRACT_NOT_IN_EFFECT`, … | ✓ | Quote-level: rejects outright |

Quote status: `AUTO_SEND` (no flags) → `REVIEW_RECOMMENDED` (notes only) →
`HOLD_FOR_REVIEW` (a line blocks) → `REJECTED` (member/contract ineligible).

## Extraction: two backends

The **deterministic parsers** run with no API key and are what the tests
exercise. They handle the shapes in `data/samples/`: bulleted email lines,
spreadsheets with junk preambles, fixed-column OCR output. The hard part they
solve is that most numbers in an RFQ line are *not* quantities — `5500 lb`,
`48x24x72`, `150w`, `5 shelf`, `4x1gal` are specs, and a parser that grabs the
first integer quotes 5,500 pallet jacks.

They are deliberately good enough to demo, not good enough to ship. Real RFQ
traffic is open-ended: forwarded threads with three levels of quoting, a
photographed page at an angle, "same as last time but 20% more". That's the
argument for the **Claude backend** in `llm_extract.py`:

```bash
pip install anthropic
export ANTHROPIC_API_KEY=...        # or: ant auth login
PYTHONPATH=src python3 -m quoteagent.cli data/samples/rfq_email.txt --extractor llm
```

It uses `claude-opus-5` with structured outputs against a strict schema, asks
for a per-line confidence score rather than assuming success, handles
`stop_reason: "refusal"`, and opts into server-side fallbacks. Note the prompt
instructs it to report the unit the customer *actually wrote* even when it
suspects a mistake — a box/case mismatch is a finding for the reviewer, not
something to silently correct.

**Untested against the live API.** This environment has no credentials, so the
LLM path is written against the current SDK surface but has never executed. Treat
it as reviewed code, not verified code. The deterministic path is what the 68
tests cover.

## Layout

```
data/catalog.json          20 synthetic SKUs with cost, list, stock, UOM conversions
data/contracts.json        contract terms, tiers, category rules, volume breaks, members
data/samples/              the same order as email / spreadsheet / OCR scan
src/quoteagent/            models, reference, extract, llm_extract, match, review,
                           pricing, quote, render, cli
tests/                     68 tests
```
