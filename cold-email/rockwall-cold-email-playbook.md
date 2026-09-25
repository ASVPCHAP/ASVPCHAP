# Rockwall Partners — Cold Email Playbook (v1)

Prepared 25 Sep 2026 for the Oct–Dec 2026 Instantly send. Three campaigns: home services, private schools, independent pharmacies/clinics. Each email step has an **A** variant (plain and direct) and a **B** variant (story-led), so Instantly can split-test them.

---

## 1. The offer: risk reversal stacked across the sequence

Research consensus (Hormozi, Jay Abraham, Alex Berman, Gong, Instantly 2026 benchmarks):

- Don't open a cold email with a guarantee. 58% of replies come from email 1, and an **interest CTA** ("worth a look?") books about 2x more meetings than a meeting ask (Gong, 304K emails).
- The word **"audit"** reads as "a wasted sales call" to strangers. Name a concrete deliverable instead.
- Guarantee things **you control**: findings, hours, response times. Never guarantee revenue or enrollments.
- Keep "free", "guarantee", "$" and links out of email 1 (spam filters). Put the named guarantee in later steps.

### The offer ladder

| Stage | Offer | Guarantee type | Wording |
|---|---|---|---|
| Email 1 (hook) | **The Bottleneck Map**: a 20-min call → one-page map of the top 3 leaks and what each costs in hours or dollars | Implied / value-first | "It's yours to keep whether we ever work together or not." |
| Emails 3–4 (step up) | **$299 Assessment** (30 min + written plan) | Unconditional + better-than-risk-free | "If it doesn't find at least 5 hours a week of recoverable staff time, say so and you get the full $299 back plus $100 for your time." |
| Call → **Focused Install** | One bottleneck, one agreed metric | Conditional / implied | "We agree on one number before we start. If it isn't at target 60 days after go-live, we keep working at no added cost until it is." |
| Alt install pricing | Same | Split fee on target | "Half at kickoff. The other half only when the metric hits target." |
| **Operating Partnership** | Ongoing | Exit guarantee | "Month-to-month, 30 days' notice. We stay until the numbers move; you can leave the moment they don't." |

**Metrics to guarantee, by vertical** (operational numbers only):
- Home services: % of calls answered live, speed-to-lead (minutes), unsold estimates followed up within 48 hrs, after-hours calls answered.
- Schools: inquiry response time, inquiry → tour rate, admissions staff hours per week.
- Pharmacy/clinic: tech hours spent on refill-status calls, calls answered, no-show rate, days in AR. **No patient-outcome or clinical metrics, and never a percentage of collections or patient volume** (Anti-Kickback risk).

> ⚠️ **Needs your sign-off before launch:** the $299 / +$100 guarantee builds on your pending paid pack (ClickUp `86bc0gyx5`). The emails that mention it (step 3) are marked **[PAID]**. If you won't sign the paid pack yet, use the **[NO-PAID]** alternatives. Under FTC 16 CFR 239, you can only say "money back" if you refund in full on request.

---

## 2. Instantly setup

- **Variables:** `{{firstName}}`, `{{companyName}}`, `{{city}}`, `{{trigger_line}}`, `{{sendingAccountFirstName}}`. The list build fills `{{trigger_line}}` with one sentence per lead (e.g. "Saw you're hiring a dispatcher in Tyler."). Leads without a real trigger go in a separate "no-trigger" campaign copy with that line deleted. Never send a generic filler line.
- **Cadence:** 4 steps. Day 0 → Day 3 (same thread) → Day 7 (same thread) → Day 14 (new thread, new subject).
- **Deliverability:** plain text, no links or images in steps 1–2, open tracking OFF, ≤30 sends/inbox/day, warmed inboxes on secondary domains. Put the booking link (`calendar.app.google/DdKru8JjNFAetwiu7`) only in replies or step 4.
- **A/B:** every step has an A (direct) and a B (story) variant. Judge on **positive reply rate** after at least 200 sends per variant; don't judge on opens.
- **Signature (CAN-SPAM):**
  ```
  Anthony Chapman
  Rockwall Partners
  [business mailing address]
  Not relevant? Reply "no" and I won't follow up.
  ```
- **Proof framing (FTC):** always say "one client" / "one school", never "our clients get".

---

## 3. Campaign 1 — Home services (HVAC, plumbing, landscaping)

**Target:** Owner/President/GM (champions: Ops Manager, CSR Manager). 10–75 employees, 5–40 trucks, on ServiceTitan / Housecall Pro / Jobber.
**Best triggers:** job posts for a CSR/dispatcher/call-taker; Google reviews that mention "never called back" / "left a voicemail"; new location.
**Timing:** first cold snap = no-heat calls pile up after hours; December = budget planning; landscaping off-season = time to fix systems.

### Step 1 — Day 0

**1A — direct**
Subject: `{{companyName}} phones`
```
Hi {{firstName}},

{{trigger_line}}

Invoca looked at 70M home services calls this year: only 52% were answered by a person, and most shops never asked for the booking when they were.

I'll spend 20 minutes mapping how calls, estimates and invoices move through {{companyName}}. You keep a one-page map of your top 3 leaks and what each one costs, whether we work together or not.

Worth a look?

Anthony
```

**1B — story**
Subject: `no-heat calls`
```
Hi {{firstName}},

{{trigger_line}}

One Texas client was losing inquiries because nobody could get back to people fast enough. We automated intake and booking. They freed 20 staff hours a week and new sign-ups went from 1–2 a month to 6, with the same team.

It was a school, not a shop, but no-heat season is the same problem with a thermostat.

Open to a 20-minute look at where {{companyName}}'s calls leak?

Anthony
```

### Step 2 — Day 3 (same thread)

**2A**
```
{{firstName}}, one more number: ServiceTitan found about 80% of estimate follow-up calls go to voicemail, and roughly 90% of those voicemails never get a callback.

Most shops your size are sitting on a stack of unsold estimates nobody owns.

That's usually leak #1 or #2 on the map. Want me to show you yours?
```

**2B**
```
{{firstName}}, a quick picture of what "installed" looks like:

a call comes in at 9:40pm → it's answered, qualified, and on the board for 7am → the estimate gets a text at 24 and 72 hours → the invoice chases itself.

No new software for your techs to learn. It plugs into what you already run.

Worth 20 minutes?
```

### Step 3 — Day 7 (same thread)

**3A [PAID]**
```
{{firstName}}, if you'd rather go deeper than a quick call:

a 30-minute Assessment with a written plan. If it doesn't find at least 5 hours a week of recoverable office time at {{companyName}}, say so and you get the full $299 back plus $100 for your time.

Want the details?
```

**3B [PAID]**
```
{{firstName}}, here's how I take the risk off you:

before any install we agree on one number, e.g. % of calls answered live, or minutes to first response. If it isn't at target 60 days after go-live, I keep working at no added cost until it is.

Is that a fair deal to talk about?
```

**3 [NO-PAID] alternative**
```
{{firstName}}, here's how I take the risk off you: we agree on one number before any work starts (calls answered live, minutes to first response). Half the fee at kickoff. The other half only when that number hits target.

Fair enough to talk about?
```

### Step 4 — Day 14 (new thread)

**4A**
Subject: `closing the loop`
```
Hi {{firstName}},

I'll leave it here. If after-hours calls or unsold estimates are costing {{companyName}} this winter, the map offer stands: 20 minutes, and you keep the one-pager either way.

Grab a time: calendar.app.google/DdKru8JjNFAetwiu7

Anthony
```

**4B**
Subject: `wrong person?`
```
Hi {{firstName}},

Should I be talking to whoever runs your office or dispatch instead? Happy to send them the 20-minute bottleneck map offer directly.

Anthony
```

---

## 4. Campaign 2 — Private / independent K-12 schools

**Target:** Head of School (decision maker); Director of Admission / Enrollment (champion); Business Manager for collections. 150–600 students, 1–3 admissions staff, on Finalsite / Blackbaud / Veracross.
**Best triggers:** posted open-house dates; a new or open Director of Admission role; a new Head of School.
**Timing:** Oct–Nov is peak inquiry and tour season. Pitch "live before your January deadline". Re-enrollment contracts go out Jan–Mar, so December is the pitch window for re-enrollment follow-up. Don't send Dec 19 – Jan 5.

### Step 1 — Day 0

**1A — direct**
Subject: `inquiry to enrollment`
```
Hi {{firstName}},

{{trigger_line}}

NAIS's latest numbers: the median school gets 385 inquiries and enrolls 79. Fewer than half of inquiries ever become an application, and at over $32K average tuition, every family that drifts off is expensive.

I'll spend 20 minutes mapping how an inquiry moves through {{companyName}}'s admissions. You keep a one-page map of where families drop off, whether we work together or not.

Worth a look?

Anthony
```

**1B — story**
Subject: `20 hours a week`
```
Hi {{firstName}},

{{trigger_line}}

One Texas K-8 school I work with had admissions buried in intake emails and tour scheduling. We automated parent intake, tour booking and the CRM-to-billing handoff.

They freed 20 staff hours a week, and new enrollments went from 1–2 a month to 6, with the same team.

Open to a 20-minute look at {{companyName}}'s funnel before open-house season peaks?

Anthony
```

### Step 2 — Day 3 (same thread)

**2A**
```
{{firstName}}, one thing I ask every admissions office: how fast does a parent inquiry get a real reply at 8pm on a Sunday?

That's when families shop schools, and most offices answer Monday. Whoever answers first usually gets the tour.

That's usually leak #1 on the map.
```

**2B**
```
{{firstName}}, what "installed" looked like at that school:

inquiry form → instant personal reply + tour slots → reminder the day before → post-tour follow-up → application nudge → enrollment handed to billing.

Nothing new for your team to learn. It runs on the systems you already have.

Worth 20 minutes?
```

### Step 3 — Day 7 (same thread)

**3A [PAID]**
```
{{firstName}}, if you'd rather go deeper:

a 30-minute Assessment with a written plan. If it doesn't find at least 5 hours a week your admissions team can get back, say so and you get the full $299 back plus $100 for your time.

Want the details?
```

**3B**
```
{{firstName}}, I know October–November is the worst time to start a project.

That's why the first install is one workflow, measured against one number (e.g. inquiry reply time), and live before your January deadline. And it's month to month after that, so you can leave the moment it isn't paying off.

Worth a conversation?
```

### Step 4 — Day 14 (new thread)

**4A**
Subject: `re-enrollment season`
```
Hi {{firstName}},

Last note from me. Re-enrollment contracts go out soon. If chasing families on contracts and tuition is eating your team's January, that's a good first thing to automate.

The 20-minute map offer stands: calendar.app.google/DdKru8JjNFAetwiu7

Anthony
```

**4B**
Subject: `right person?`
```
Hi {{firstName}},

Is your Director of Admission the better person for this? Happy to send them the 20-minute funnel map offer directly.

Anthony
```

---

## 5. Campaign 3 — Independent / specialty pharmacies & small clinics

**Target:** Owner / Pharmacist-in-Charge (1–5 stores); champions: Pharmacy Manager, Lead Tech, Business Development rep (compounding/specialty). Clinics: Practice Owner, Practice Administrator, Office Manager.
**Best triggers:** a nearby chain store closure (transferred patients flood the phones); job posts for techs/clerks; a new location or new BD hire.
**Timing:** Oct 15 – Dec 7 is Medicare Open Enrollment, the busiest phone season. Send the first wave early October or right after Dec 7. January deductible resets cause a spike in rejected claims and PAs, so that's a good hook for clinics.

**Compliance guardrails for this campaign (non-negotiable):**
- Only operational outcomes: tech hours, calls answered, refill queue, no-shows, AR. No clinical, adherence or health-outcome claims.
- Never mention or request patient data. The line "We sign a BAA before touching anything with patient data" is included only because it will be true. If you won't sign BAAs, delete it.
- No fees tied to patient volume, fills or collections.
- Don't imply any affiliation with NCPA or PBMs. Don't pitch compounding marketing claims.

### Step 1 — Day 0

**1A — direct**
Subject: `{{companyName}} phone line`
```
Hi {{firstName}},

{{trigger_line}}

NCPA's survey: 67% of independents can't fill open positions, and techs are the hardest to hire. Meanwhile the phones don't stop, and refill-status calls land on the same techs.

I'll spend 20 minutes mapping where your staff's hours go. You keep a one-page map of the top 3 time drains, whether we work together or not.

Worth a look?

Anthony
```

**1B — story**
Subject: `techs on the phone`
```
Hi {{firstName}},

{{trigger_line}}

One client, a school with a small office staff, was drowning in routine calls and emails. We automated intake and scheduling in the back office and freed 20 staff hours a week, with the same team.

Different world from a pharmacy, same math: routine calls eating skilled people's time.

Open to a 20-minute look at where {{companyName}}'s hours go?

Anthony
```

### Step 2 — Day 3 (same thread)

**2A**
```
{{firstName}}, open enrollment starts Oct 15. That's usually when the "is my refill ready / is my plan changing" calls peak.

Most of those can be answered without a tech picking up. Nothing clinical, just status and routing.

That's usually leak #1 on the map. Want me to show you yours?
```

**2B**
```
{{firstName}}, for clarity on what I do and don't do:

I fix the back office — phones, refill-status and routing, scheduling, invoicing, onboarding new techs. I don't touch clinical decisions, and we sign a BAA before touching anything with patient data.

Worth 20 minutes?
```

### Step 3 — Day 7 (same thread)

**3A [PAID]**
```
{{firstName}}, if you'd rather go deeper:

a 30-minute Assessment with a written plan. If it doesn't find at least 5 hours a week of tech or front-counter time you can get back, say so and you get the full $299 back plus $100 for your time.

Want the details?
```

**3B**
```
{{firstName}}, I know margins are thin right now, so here's how I remove the risk:

we agree on one operational number (e.g. tech hours spent on status calls). Half the fee at kickoff, the other half only when that number hits target. After that it's month to month, and you can leave anytime.

Fair enough to talk about?
```

### Step 4 — Day 14 (new thread)

**4A**
Subject: `after open enrollment`
```
Hi {{firstName}},

Last note from me. If the phones are running your techs this season, the 20-minute map offer stands, and you keep the one-pager either way.

calendar.app.google/DdKru8JjNFAetwiu7

Anthony
```

**4B**
Subject: `right person?`
```
Hi {{firstName}},

Is your pharmacy manager or lead tech closer to this? Happy to send them the offer directly.

Anthony
```

---

## 6. Reply playbook (use in Instantly Unibox)

| Reply | Response |
|---|---|
| "Interested / sure" | "Great. Here's my calendar: calendar.app.google/DdKru8JjNFAetwiu7. Before we talk, what's the one thing you'd fix first if you could?" |
| "How much?" | "The map call is on me. If you want to go deeper, the Assessment is $299 and fully refundable if it doesn't find at least 5 hours a week. Installs are scoped to one number we agree on up front." |
| "Is this AI stuff?" | "AI is the back office. It's not the person your customers talk to. Everything runs on the tools you already use." |
| "We already use ServiceTitan / Finalsite / PioneerRx" | "Good, I build on top of it. Most of the leaks are in the handoffs between systems, not the systems themselves." |
| "Not now" | "Understood. Mind if I check back in [January / after open enrollment]?" → set a reminder task |
| "Remove me" | Unsubscribe immediately, no reply. |

---

## 7. Sources

- Instantly Cold Email Benchmark Report 2026 — https://instantly.ai/cold-email-benchmark-report-2026
- Gong Labs, cold-email CTA study — https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings
- Alex Berman, offer-first cold email (2026) — https://alexberman.com/cold-email-offer-first-ai-inbox-2026
- Hormozi guarantee types — https://alexhormozi.wiki/frameworks/guarantee-types-and-examples
- Jay Abraham, risk reversal — https://www.abraham.com/topic/risk-reversal/
- FTC 16 CFR 239.3 (guarantees) — https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-239/section-239.3
- Invoca Home Services Benchmarks 2026 — https://www.invoca.com/reports/the-invoca-home-services-lead-conversion-benchmarks-report-2026
- ServiceTitan, estimate follow-up — https://www.servicetitan.com/blog/success-stories-following-up-on-estimates
- NAIS Facts at a Glance 2024–25 — https://resources.finalsite.net/images/v1748959183/finalsite/uxod4t5a4mmmyjzxx9n1/Facts-at-a-Glance-2024-2025-NAIS-Members.pdf
- NCPA staffing survey — https://ncpa.org/newsroom/news-releases/2024/02/14/ncpa-releases-latest-survey-drug-supply-chain-and-staffing
- NCPA 2025 Digest — https://ncpa.org/newsroom/news-releases/2025/10/19/ncpa-releases-2025-digest-report
- HHS, business associates — https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html
