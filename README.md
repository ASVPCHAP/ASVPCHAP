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
- `data/auxiliaries.json` — all auxiliary data: contacts, SOPs, supplies, assessment notes
- `assets/style.css`, `assets/app.js` — shared styling and rendering logic
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
    "Step one of the procedure.",
    "Step two of the procedure."
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
  will render them automatically and drop the "not documented yet" placeholder.
- `goals`, `strengths`, `improvements`, `events`, and `volunteerRecruitment` are optional —
  when present they render as an "Auxiliary Assessment" section on the detail page (useful for
  capturing annual auxiliary-leader assessments/surveys). Omit them if not applicable.
- The `auxiliaries.html` directory page and search box update automatically from this file.

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
