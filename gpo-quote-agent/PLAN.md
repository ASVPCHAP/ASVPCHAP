# AI agency wedge: GPO ↔ legacy supplier quoting

Working notes behind the demo in this directory. Decisions taken: sell to
**suppliers**, build on **synthetic + public data**, ship a **working demo agent**
first.

## 1. The competitive reality

"We automate custom pricing for legacy suppliers" is a contested offer, not an
opening. Before building anything, know who's already there:

| Player | What they do | Implication |
|---|---|---|
| [Distro](https://distro.app/) | AI RFQ/bid-list/PO processing for distributors off live ERP data; markets a 100+ line RFQ → quote in ~90 seconds | Funded, direct, same pitch |
| [Zoovu](https://zoovu.com/blog/best-cpq-software) | Buyer-side guided configuration → structured quote requests; claims up to 80% time-to-quote reduction | Attacks the same latency from the buyer's end |
| PROS Smart CPQ | AI-first dynamic pricing for distributors and manufacturers | Enterprise incumbent |
| [Talkulate / r-sun](https://r-sun.ai/products/talkulate-ai-cpq/rfq-automation-software) | RFQ→validated quote + BOM; implementation from ~$18,400 | Useful price anchor for the category |

Two things follow. First, the category has a **price anchor in the mid five
figures** for implementation — that's the number to reason about, not $2k/month
retainers. Second, **speed alone is not defensible.** "Quote faster" is what
everyone above sells. Faster quotes that are *wrong on contract* create disputes,
chargebacks and GPO audit findings, which is a worse outcome than slow quotes.

## 2. The actual asymmetry

Rampart-side experience is knowledge of the **handshake**, not of quoting:

- how tier eligibility is actually determined, and how often member status is stale
- that contract text and tier schedules drift apart, so the "contract price" can
  be worse than the member's own tier entitlement
- which categories sit outside a contract, and how off-contract lines get quoted
  anyway and then disputed
- what a GPO asks for when it audits pricing, and what evidence closes it
- how members actually transmit demand: punchout carts, EDI, spreadsheets, email

None of the vendors above model the GPO side. They model the distributor's ERP.
So the wedge is not *faster quotes* — it's **quotes that survive contract
review**, which is a supplier-side product built out of GPO-side knowledge.

That's why the demo's pricing engine is a precedence chain with an audit trail
rather than a discount calculator, and why it emits `TIER_UNDERCUT` and
`MARGIN_FLOOR` findings. Those two flags are the whole differentiation in
miniature: a supplier-side tool that doesn't understand GPO contract structure
cannot produce them.

## 3. Ecosystem map

```
GPO (Rampart)                    Members                    Supplier (legacy)
─────────────                    ───────                    ─────────────────
negotiates contract    ─────►    buys on contract  ─────►   must honour it
sets tiers, categories           sends demand via:           quotes manually
audits compliance                  punchout cart             from PDFs + tribal
                                   EDI 850                   knowledge
                                   spreadsheet / email
                                   scanned requisition
        ▲                                                            │
        └──────────── disputes, audit findings, rebate claims ◄───────┘
```

The supplier's pain is *felt* as slow quotes and lost bids. Its *cause* is that
contract terms live in PDFs and people's heads, and the intake is unstructured.
Revenue leakage is bidirectional: quote too high and lose the bid; quote too low
or off-contract and eat a dispute, or breach a margin floor nobody was checking.

**Who pays:** the supplier. The GPO is the reason the supplier has to care.

## 4. Integration standards (the second-phase moat)

The demo takes files. Production takes traffic, and the formats are well-defined
public standards — which is good news: this is learnable without insider access.

| Standard | Direction | Where it matters |
|---|---|---|
| cXML / OCI PunchOut | buyer eProcurement → supplier site | The dominant discovery path; all punchout is built on cXML and OCI, supporting real-time price/availability ([overview](https://tradecentric.com/blog/punchout-catalog/), [cXML primer](https://www.comparatio.com/edi-standards/cxml/)) |
| EDI 850 / 855 / 810 | PO, ack, invoice | Repeat-order rails once an item is known |
| EDI 832 | supplier → buyer price/sales catalog | Contract price files. Failed transmissions routinely go unnoticed until discrepancies surface weeks later ([SPS](https://www.spscommerce.com/edi-document/edi-832-electronic-catalog/), [guide](https://www.comparatio.com/edi-standards/comprehensive-guide-to-edi-832/)) |
| CIF catalogs | supplier → Ariba/Coupa/Jaggaer | Static hosted catalog; goes stale between refreshes |

The common pattern: **punchout for discovery, EDI/API for repeat orders.** The
RFQ→quote flow this demo covers is what happens when *neither* works — a custom,
volume, or configured request that falls out of the automated path and onto a
human. That's the highest-value gap and the natural place to start, because it's
where the manual labour actually is.

The 832 failure mode is worth noting as a **second product**: silent price-file
drift is a compliance auditor, sellable to either side, and it reuses the
contract model already built here.

## 5. MVP sequence

**Phase 0 — this demo (done).** Synthetic data, three intake channels, precedence
pricing, audit trail, exception queue. Purpose: get a design-partner conversation
that isn't hypothetical. It shows a supplier their own problem with their own
vocabulary.

**Phase 1 — design partner, 4–6 weeks.** One supplier, one GPO contract, real RFQ
history under NDA. Deliverables: their contract encoded in the pricing model;
their catalog loaded; the agent run over 60–90 days of historical RFQs *offline*.
The measurement that matters:

- lines auto-priced vs. escalated (the automation rate)
- lines the agent priced differently than the human did, and who was right
- **disputes and margin-floor breaches found in already-sent historical quotes**

That last number is the sales argument for everything after. It's retrospective,
verifiable, and denominated in dollars they already lost.

**Phase 2 — in the loop.** Agent drafts, human sends. Route intake by channel
(shared inbox, EDI drop, punchout fallback). Write quotes back to their ERP/CRM.
Keep the human on the send button — the exception queue *is* the product, and
removing the human removes the audit story.

**Phase 3 — the pipe.** cXML/OCI punchout responses, EDI 832 price-file
validation, real-time contract price on the member's own screen. This is where
it stops being an agency engagement and starts being infrastructure.

Don't skip to Phase 3. The demo → historical-audit → in-the-loop sequence is what
earns the data access Phase 3 requires.

## 6. Offer and pricing

Anchor against the category's implementation-fee shape, not hourly consulting:

| | Scope | Range |
|---|---|---|
| **Contract audit** (paid pilot) | Encode one contract, run historical RFQs, report findings | $8–15k, fixed |
| **Implementation** | Live intake, ERP write-back, exception queue, one GPO contract | $25–60k |
| **Retainer** | Contract changes, new SKUs, tier updates, monitoring | $3–8k/mo |
| **Per-contract expansion** | Each additional GPO contract | $10–20k |

The paid audit is the wedge: it's cheap enough to approve without a committee,
it produces a number, and it's the only step that requires their data — so it
doubles as the qualification gate. A supplier who won't share RFQ history under
NDA won't be a Phase 2 customer either.

## 7. Open risks

**Employment conflict — resolve before any outreach.** Building an agency that
sells to the suppliers of a GPO you work for is a live conflict of interest,
independent of whether employer data is used. Check the employment agreement for
IP assignment, moonlighting, and non-solicit clauses; assume supplier
relationships formed at work are the employer's. This is why the data decision
was synthetic + public — it keeps the *build* clean, but it does not resolve the
*relationship* question. Get that answered first; it can invalidate the whole
go-to-market, and it is much cheaper to discover now.

**Sales cycle.** Legacy suppliers are slow, have no AI budget line, and buy
through IT. The paid audit is the mitigation — it's a project, not a platform
purchase.

**Data access is the real gate.** Everything past Phase 1 needs their ERP,
catalog, and contract PDFs. Scope the pilot so it produces value from *history*
alone, since that's the only data they'll share early.

**Accuracy bar is asymmetric.** A missed automation opportunity costs a little; a
wrong price on a contract line costs a dispute and possibly the contract. That
asymmetry is why blocking flags exist and why the human stays on the send button
well past the point where the automation "works".

**Category risk.** If Distro or a CPQ incumbent ships GPO contract modelling, the
differentiation compresses. The durable version of this business is the pipe
(Phase 3) and the per-contract encoding library, not the quoting agent.

## 8. Next decisions

1. Resolve the employment/IP question. Blocking.
2. Pick the first target supplier profile — MRO distributor, 2+ GPO contracts,
   quotes still done in Excel. Get to a Phase 1 audit, not a demo call.
3. Decide whether the 832 price-file auditor becomes a second offer now or later.
   It's the same contract model and it's sellable to the GPO side too, which
   hedges the category risk above.
