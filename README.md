# The Living Gospel - Mesquite — Auxiliary Handbook

A simple static website that serves as the reference dossier for the church: how the
church is structured, the auxiliaries (ministries/service teams) that run it, who leads
each one, how to reach them, their standard operating procedures, and the supplies each
team needs.

> **Note:** Name, mission, address, and service times below were pulled from public search results,
> not confirmed directly by the church.

## Structure

- `index.html` — home page
- `structure.html` — church org structure (placeholder, to be filled in)
- `auxiliaries.html` — searchable directory of all auxiliaries
- `auxiliary.html` — detail template for a single auxiliary (loaded via `?slug=...`)
- `sop-questionnaire.html` — shared SOP questionnaire, submitted via Netlify Forms (see below)
- `update-request.html` — shared form for adding a contact, adding a note, or requesting
  supplies for a specific auxiliary, also via Netlify Forms
- `data/auxiliaries.json` — all auxiliary data: contacts, SOPs, supplies, assessment notes
- `assets/style.css`, `assets/app.js` — shared styling and rendering logic
- `assets/sop-form.js` — SOP questionnaire pre-fill and submission logic
- `assets/update-form.js` — update-request form logic (request-type toggling, submission)
- `assets/images/logo.png` — church logo, used in the header and as favicon

## How to add or edit content

Everything about an individual auxiliary — contacts, SOP steps, supply list, notes — lives
in **`data/auxiliaries.json`**. You do not need to touch any HTML to update this content.

Each auxiliary is an object like:

```json
{
  "slug": "kitchen",
  "name": "Kitchen",
  "description": "One-line description of what this auxiliary does.",
  "contacts": [
    { "role": "Leader", "name": "Bro. Kyron Washington", "phone": "214-926-1255", "email": "kyronwash@gmail.com" }
  ],
  "sop": [
    "A plain step works fine,",
    { "label": "Pre-Service", "text": "A labeled step renders as \"Pre-Service: A labeled step renders...\" — use this for grouping steps by phase (Pre-Service, During Service, Safety, Scheduling, etc.), which is the format most auxiliaries currently use." }
  ],
  "supplies": [
    "Item needed",
    "Another item needed"
  ],
  "goals": ["Optional: top goals for the year, from an auxiliary assessment"],
  "strengths": ["Optional: what's working well"],
  "improvements": ["Optional: areas of opportunity"],
  "events": "Optional: freeform text on recurring events/meetings",
  "volunteerRecruitment": "Optional: freeform text on how the team recruits",
  "notes": "Any freeform notes."
}
```

- To add a new auxiliary, add a new object to the array with a unique `slug`.
- To document an SOP or supply list, just fill in the `sop` / `supplies` arrays — the page
  will render them automatically and drop the "not documented yet" placeholder. `sop` items
  can be plain strings or `{ "label": "...", "text": "..." }` objects for grouped/labeled
  steps (e.g. "Pre-Service", "Safety") — the labeled format is what most auxiliaries use.
- `goals`, `strengths`, `improvements`, `events`, and `volunteerRecruitment` are optional —
  when present they render as an "Auxiliary Assessment" section on the detail page (useful for
  capturing annual auxiliary-leader assessments/surveys). Omit them if not applicable.
- The `auxiliaries.html` directory page and search box update automatically from this file.
- `safetyGuidelinesStatus` and `emergencyProceduresStatus` are optional short strings (e.g.
  `"Yes"`, `"No"`, `"In progress"`) used to pre-fill the Emergency & Safety section of the SOP
  questionnaire with what's already known.

## SOP questionnaire workflow

`sop-questionnaire.html` is a single shared form (auxiliary leaders pick their auxiliary from a
dropdown) covering the 10 sections a usable SOP needs: Purpose & Scope, Roles, Setup,
During-Service Duties, Breakdown, Supplies, Emergency & Safety (required), Scheduling &
Coverage, Training & Onboarding, and Special Circumstances.

- **Pre-fill:** when a leader picks their auxiliary, `assets/sop-form.js` looks up that
  auxiliary in `data/auxiliaries.json` and shows a "known so far" box above any field where we
  already have partial data (goals, contacts, supplies, safety status, events, recruitment) —
  pulled from earlier auxiliary assessments — so leaders aren't re-typing what we already know.
- **Submission:** the form uses [Netlify Forms](https://docs.netlify.com/forms/setup/) — no
  backend needed. Submissions land in the Netlify dashboard for the connected site
  (Site → Forms → sop-questionnaire), where they can be reviewed and exported. Forms
  processing must be enabled on the Netlify site (Site configuration → Forms) for
  submissions to be captured — a deploy that lands before Forms is turned on won't
  register the form, so trigger a fresh deploy after enabling it.
- **Getting answers onto the site:** submissions do **not** automatically publish. Someone
  (currently: manually, by pulling submissions and updating the JSON — the same process used to
  fold in the original assessment PDFs) needs to review each submission and merge the answers
  into that auxiliary's `sop` array (and `supplies`, etc.) in `data/auxiliaries.json`.
- Each auxiliary detail page shows a "Help complete this SOP" link (pointing at
  `sop-questionnaire.html?slug=...`) whenever its `sop` array is still empty.

## Update-request workflow

Every auxiliary detail page has "Quick Actions" buttons — **Add a Contact**, **Add a Note**,
**Request Supplies**, and (only shown once an SOP exists) **Add SOP Notes** — linking to
`update-request.html?slug=<aux>&type=<contact|note|supplies|sop-details>`. That single shared
form pre-selects the auxiliary and the request type, and `assets/update-form.js` shows only
the relevant fields for that type.

- Same mechanics as the SOP questionnaire: Netlify Forms (form name `auxiliary-update`), no
  backend, submissions land in the Netlify dashboard under Forms.
- Also **not** auto-published — review submissions and manually apply them.

### Review & merge process

Nothing submitted through any of these forms (SOP questionnaire or update-request) publishes
automatically — the point of that gap is to keep the site coherent instead of turning into a
pile of disconnected notes. The process:

1. **Check for new submissions.** Netlify dashboard → Site → Forms → pick the form
   (`sop-questionnaire` or `auxiliary-update`) → review new entries. (Or ask whoever's
   driving the site to pull them via the Netlify API.)
2. **Triage by type:**
   - *Contact* → add/update the entry in that auxiliary's `contacts` array.
   - *Note* → fold into `notes` (merge with what's there rather than just appending, if it
     overlaps with an existing note).
   - *Supplies* → add to `supplies`, or action it directly (order/source the item) if it's
     urgent — the site entry is a record, not a ticketing system.
   - *SOP details* → **do not just append the raw submission as a new bullet.** Read it
     against the existing `sop` array for that auxiliary, find the step it belongs with (the
     submitter's "which part of the SOP" answer is a hint, not the final word), and rewrite
     that step's `text` to incorporate the new detail in the same voice as the rest of the
     SOP — or add a new labeled step if it genuinely doesn't fit anywhere existing. The goal
     is that a leader reading the finished SOP can't tell which parts came from the original
     transcript versus a later submission.
3. **Preview before publishing.** For anything beyond a trivial one-line fix, build the
   change locally (`python3 -m http.server 8000`), check the rendered page looks right, then
   commit and push. Since Netlify is typically configured to watch this repo's branch as its
   production deploy, a push goes live — there's no separate staging step, so review before
   pushing, not after.

## Running locally

Because the pages fetch `data/auxiliaries.json` via JavaScript, open them through a local
server rather than double-clicking the file:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

This is a plain static site (no build step), so it can be hosted for free with:

- **GitHub Pages**: Repo Settings → Pages → Deploy from branch → `main` → `/ (root)`.
- **Netlify**: drag-and-drop the folder, or connect the repo (publish directory: `/`, no
  build command needed).

## Roadmap

- Fill in `structure.html` with the actual leadership org chart once available.
- Add SOPs and supply lists per auxiliary as they're documented.
- Confirm official church name, mission statement, and branding.
