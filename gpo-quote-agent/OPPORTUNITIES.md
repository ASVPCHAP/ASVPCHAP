# Adjacent offers: what else the contract model already answers

The reusable asset built in this repo is not the quoting agent. It's the
**contract model** — a machine-readable encoding of how a GPO agreement resolves
to a price, plus an audit trail that explains each step, plus confidence gating
that separates "confident" from "needs a human."

That asset supports three verbs:

| Verb | Question | Product shape |
|---|---|---|
| **Price it** | What *should* this line cost? | Quoting agent (built) |
| **Check it** | What *did* it cost, and was that right? | Audit / recovery / assurance |
| **Move it** | Get the right price into the buying system | Punchout, EDI, catalog enablement |

The filter for every idea below: **does it reuse the contract model?** If yes it's
a two-week build on existing code. If no, it's a different company wearing the
same logo.

---

## Tier 1 — Same engine, inverted (reuses `pricing.py` almost as-is)

### 1.1 Contract compliance recovery audit ⭐ strongest

Take historical invoice/PO line data, re-price every line against the contract
that governed it, and treat each delta as a recoverable overcharge.

This is the quoting engine run backwards. `price_line()` already computes the
entitled price; the audit compares it to the price actually paid and sums the
differences. The `MARGIN_FLOOR` and `TIER_UNDERCUT` findings already implemented
are the same class of output.

Why it's the strongest offer:

- **No integration.** Historical AP/PO/invoice extracts are the one data set a
  cautious buyer will hand over early. Everything else needs ERP access.
- **The deliverable is money, not software.** Removes the "no AI budget line"
  objection that is the single biggest risk to the quoting product.
- **Contingency pricing is the established norm** in this category — recovery
  audit firms charge roughly 20–35% of recovered amounts and typically work on a
  find-nothing-pay-nothing basis
  ([apexanalytix](https://www.apexanalytix.com/resources/blog/recovery-audit-cost/),
  [Auditec](https://auditecsolutions.com/recovery-audit/),
  [Transparent](https://transparentglobal.com/blog/is-accounts-payable-recovery-audit-worth-the-cost/)).
  A buyer can say yes without a procurement cycle.
- **Three buyers, one codebase** (see the buyer tension below).

The incumbents — PRGX, apexanalytix, SAS, Transparent — are human-analyst firms
serving large enterprises. Their economics require a spend threshold below which
an audit doesn't pay for itself. **The long tail under that threshold is the
opening**, and it's exactly where mid-market GPO members and regional suppliers
sit.

**Buyer tension worth resolving deliberately.** The audit points at a different
buyer than the quoting agent:

| Buyer | Framing | Strength |
|---|---|---|
| Member / GPO | "Recover what you were overcharged" | Strong — money in |
| Supplier | "Find your exposure before the GPO audits you" | Moderate — preventative, avoids clawback and contract risk |

The strongest audit buyer is the **demand side**, which cuts against the
sell-to-suppliers decision behind the quoting agent. That's a real fork, not a
detail: pick one buyer to lead with, because the sales motion, references and
positioning don't transfer between them. Auditing suppliers on behalf of members
makes you adversarial to the people you'd sell the quoting agent to.

**Pricing:** 20–30% contingency, or $10–25k fixed for a bounded scope when the
buyer won't do contingency. Note contingency requires that claims can actually
be *collected* — someone has to pursue the supplier. Scope whether you deliver
findings or pursue recovery; they're different businesses with different margins.

### 1.2 Price file / catalog drift monitor

Contract terms live in a signed agreement; prices live in an EDI 832 price file
or a CIF catalog loaded into Ariba/Coupa/Jaggaer. They drift. Failed
transmissions routinely go unnoticed until discrepancies surface weeks later
([SPS](https://www.spscommerce.com/edi-document/edi-832-electronic-catalog/)).

Continuously diff the loaded catalog against the encoded contract; alert on
every divergence. Same engine, run as a monitor instead of a one-shot.

**Why it matters strategically:** it converts a project into a subscription, and
it's the natural retainer attached to 1.1. Audit finds the historical money;
the monitor stops it recurring. Sell them together.

**Pricing:** $2–6k/mo per supplier-GPO relationship monitored.

### 1.3 Tier and eligibility reconciliation

Member rosters, tier assignments and status (active/suspended/terminated) drift
between GPO and supplier systems. The demo already models this — `MEMBER_NOT_ACTIVE`
and the tier lookup are the primitive. Productized, it's a reconciliation service
against both sides' rosters, flagging every member being quoted at the wrong tier
or quoted at all while suspended.

Small on its own. Good as an included feature that makes 1.1 and 1.2 more
accurate, and a cheap first engagement.

---

## Tier 2 — Adjacent, same buyer (suppliers), new build

### 2.1 GPO bid response — the pricing schedule half

GPOs award contracts through competitive RFPs. Suppliers respond with a narrative
questionnaire **and** a line-item pricing schedule that can run thousands of rows,
each needing a margin decision, a floor check, and consistency against existing
contracts.

The narrative half is crowded — AutoRFP, Loopio, Responsive and others compete
there and win. **The pricing schedule half is not what those tools do**, and it's
precisely the engine already built: bulk-price thousands of lines against
proposed terms, flag every line that breaches a floor or undercuts an existing
contract, and explain each one.

This is the highest-stakes, most deadline-compressed moment in the supplier's
year, which means willingness to pay is high and the deadline does the closing.

**Pricing:** $15–40k per bid, or a retainer across a bid calendar.

### 2.2 SKU cross-reference and substitution engine

Members ask for competitors' part numbers. Suppliers need the contracted
equivalent — for compliance (the GPO wants on-contract buying), for competitive
conversion (the supplier wants the share), and for backorder substitution.

`match.py` is already a working primitive for this; the production version is
entity resolution across manufacturer catalogs plus UNSPSC/GS1 classification.
Dual-sided value, and it's a data asset that compounds.

**Pricing:** $20–50k build, then licensing the crosswalk.

### 2.3 Punchout / catalog enablement as a service

Legacy suppliers can't stand up cXML or OCI punchout on their own, and it's the
gate to a GPO's members buying at all. This is the "own the pipe" phase from
`PLAN.md` §5.

Honest assessment: **this is systems integration, not AI.** Low AI leverage,
ordinary margins, real willingness to pay, and an excellent door-opener that
gets you inside the systems everything else needs. Treat it as a wedge or a
retainer anchor, not the core offer.

---

## Tier 3 — GPO-side operations (where insider knowledge is worth most)

These sell to a buyer profile that's understood natively from working at one.
Fewer buyers, higher contract values, and essentially no competition because the
workflows are invisible from outside.

### 3.1 Admin fee assurance ⭐ strongest GPO-side offer

GPOs are funded by administrative fees on member purchase volume — capped at 3%
under the safe harbor, with the volume-weighted average of actual contract fees
landing between roughly 1.22% and 2.25%, and individual contracts ranging from
0.09% to 10%
([GAO-15-13](https://www.gao.gov/assets/gao-15-13.pdf),
[GAO-10-738](https://www.gao.gov/assets/gao-10-738.pdf)).

That volume is **self-reported by suppliers**, and the reporting process is
fragmented by design: each GPO has traditionally asked for different data in
different formats, which is why the industry publishes a
[reporting toolkit](https://www.hida.org/hida/distribution/resources/pricing-accuracy/gpo-admin-fee-toolkit.aspx)
to try to standardize it. Self-reported plus fragmented plus manual equals
under-verified.

The product: reconcile supplier-reported sales against member-side purchase data
and contract terms, and surface under-reported fee revenue.

Why this is the best GPO-side sale available:

- It is **revenue-positive for the buyer**, not a cost saving. You are finding
  money the GPO is contractually owed.
- The fee structure is under active regulatory scrutiny, which creates budget.
- It reuses the contract model and the reconciliation logic from 1.1.
- The buyer is the org type already understood from the inside.

**Caveat:** this is the offer most entangled with the employment conflict in
`PLAN.md` §7 — selling fee-assurance to GPOs while employed by one is a sharper
version of the same problem. Resolve that first.

**Pricing:** contingency on recovered fees, or $30–75k annual platform.

### 3.2 Price increase request evaluation

Suppliers submit price increase requests continuously, with cost-justification
letters and index citations attached. GPO analysts evaluate them by hand:
is the justification supported, does the contract permit it, what's the member
impact, what's the precedent across categories?

Document-heavy structured judgment against contract terms — squarely AI-tractable,
completely invisible from outside the industry, and a genuine analyst-time sink.

### 3.3 Contract renewal benchmarking

When a contract comes up for renewal, is its pricing still competitive? Currently
manual analyst work comparing against public pricing and other contracts. This is
the GPO's core value proposition, done by hand.

### 3.4 Member savings reporting

GPOs must prove delivered savings to retain members. Per-member, quarterly,
manual. Directly tied to retention revenue, which makes it easy to fund.

### 3.5 Supplier compliance document monitoring

Insurance certificates, W-9s, diversity certifications, SOC 2 reports, expiration
tracking. Currently spreadsheets and email reminders. Boring, real, easy, and a
low-risk first engagement that builds the relationship.

---

## What not to build

| Idea | Why not |
|---|---|
| RFP narrative/questionnaire automation | Crowded and well-funded (AutoRFP, Loopio, Responsive). Do the pricing schedule instead (2.1) |
| Generic quote follow-up / sales nudges | No moat, no contract knowledge, every CRM ships it |
| Standalone OCR / document extraction | Commodity. It's a feature of the above, never the product |
| Member-side guided buying | Competes head-on with Coupa/Ariba/Jaggaer punchout. Wrong fight |
| A general "AI for procurement" platform | The specificity of the contract model *is* the moat. Generalizing discards it |

---

## Recommended sequence

1. **Lead with the recovery audit (1.1).** Same engine, no integration, deliverable
   is a dollar figure, contingency pricing sidesteps the budget objection.
   It is also already the Phase 1 of the quoting product — `PLAN.md` §5 recommends
   running the agent over historical RFQs to count what was lost. That *is* this
   product. Sell it as the offer rather than as a pilot for something else.
2. **Attach the drift monitor (1.2) as the retainer.** Audit finds the money once;
   the monitor is why they keep paying.
3. **Decide the buyer fork deliberately.** Demand-side (member/GPO) is the stronger
   audit sale; supply-side is the quoting agent's buyer. Leading with both makes
   you adversarial to half your market.
4. **Keep the quoting agent as the expansion, not the entry.** It needs live
   integration and trust; sell it into an account the audit already opened.
5. **Treat contract encoding as the compounding asset.** Every engagement adds
   encoded contracts to a library. That library — not any single agent — is what
   a competitor can't copy.
