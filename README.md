## Hi there 👋

## Workout Generator (MVP)

A workout app where the user enters a training style or an athlete they admire ("I want
to train like X"). The input is fuzzy-matched to an internal **archetype** — a codified
training philosophy (tempo, rep ranges, rest, exercise bias, progression style) — which
combines with the user's diet phase and hard constraints (days/week, equipment, injuries,
training age) to generate a single workout. See [`docs/workout-app-design.md`](docs/workout-app-design.md)
for the full design doc.

This repo currently implements build-order step 1 from that doc: archetype input +
qualifiers → single generated workout. Full block periodization, logging, and
auto-progression are not built yet.

### Layout

- `backend/` — TypeScript/Express API. Owns the archetype, phase, split, and exercise
  data plus the generator pipeline (`src/lib/generator.ts`, `src/lib/fuzzyMatch.ts`).
- `app/` — Expo (React Native) client. Three-screen flow: archetype text input →
  qualifying questions → generated workout.
- `docs/` — design docs.

### Running the backend

```
cd backend
npm install
npm run dev        # ts-node-dev on http://localhost:3000
```

Sanity-check the generator logic directly (no server needed):

```
npm run test
```

Endpoints:

- `POST /api/generate` — body `{ input, phase, qualifiers }`, returns a matched
  archetype + generated workout, or a no-match response with suggestions.
- `GET /api/archetypes` — list of archetype ids/display names.
- `GET /health`

### Running the app

```
cd app
npm install
npm start
```

Set `expo.extra.apiBaseUrl` in `app/app.json` to point at your backend (defaults to
`http://localhost:3000`; use your machine's LAN IP when testing on a physical device).

<!--
**ASVPCHAP/ASVPCHAP** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->
