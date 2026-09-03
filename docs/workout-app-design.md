# Workout Generator — Design Doc

## Concept

A workout app where the user enters a training style or the name of an athlete they
admire ("I want to train like X"). The system fuzzy-matches that input to a generic
**archetype** — a codified training philosophy — and generates a personalized program.

The archetype is the product's differentiator. Any app can generate a push/pull/legs
split; the IP is in codifying *how* different training philosophies actually differ
(tempo, rest, exercise selection bias, volume, progression style) into structured data.

**Initial target user:** bodybuilding / physique-focused lifters, expanding to hybrid
and calisthenics athletes.

**Monetization:** subscription. The recurring value is the tracking + adaptive
progression loop, not the initial program (a one-time program generator gets
screenshotted and cancelled).

### Naming / legal note

Never brand generated output with a real person's name or imply endorsement. Users may
*type* a name; the system maps it internally to a generic archetype and surfaces only
the archetype label ("Based on your input, here's a Mass-Builder / High-Volume
program"). Right-of-publicity exposure comes from commercial use of a real person's
identity — the internal mapping table avoids it while preserving the marketing hook.

---

## Core model

Three orthogonal inputs combine into a program:

```
archetype (style)  ×  phase (recovery capacity)  ×  qualifiers (constraints)
        → generated program
```

- **Archetype** — what the training *feels* like. Tempo, rep ranges, rest, exercise bias.
- **Phase** — how much the user can currently recover. Driven by diet phase.
- **Qualifiers** — hard constraints. Days available, equipment, injuries, training age.

---

## Archetype schema

```json
{
  "id": "contraction_pump_specialist",
  "display_name": "Contraction & Pump Focus",
  "matched_names": ["<internal fuzzy-match keys>"],
  "rep_range": { "min": 10, "max": 15 },
  "tempo": { "eccentric_sec": 3, "pause_sec": 1, "concentric_sec": 1 },
  "rest_seconds": { "compound": 60, "isolation": 45 },
  "exercise_bias": {
    "compound_ratio": 0.4,
    "isolation_ratio": 0.6,
    "preferred_movement_patterns": [
      "cable/machine over free weight when isolating",
      "unilateral finishers"
    ]
  },
  "volume": { "sets_per_muscle_per_week": 16 },
  "split_options": ["bro_split_5day", "upper_lower_pump"],
  "intensity_techniques": ["drop_sets", "partials_at_peak_contraction", "1.5_reps"],
  "cueing_style": "mind-muscle connection, squeeze at peak, controlled negative",
  "progression_style": "reps-in-reserve autoregulated; increase load only after RPE ceiling hit for 2 sessions",
  "phase_sensitivity": "medium"
}
```

`phase_sensitivity` controls how aggressively the phase modifier is applied. Pure
hypertrophy archetypes are less phase-sensitive than skill-heavy calisthenics ones.

### Starter archetype set (bodybuilding)

| Archetype | Reps | Rest | Bias | Progression |
|---|---|---|---|---|
| Old-School Mass Builder | 6–10 | 120s | 0.7 compound, explosive concentric | Linear load week over week |
| Contraction / Pump Specialist | 10–15 | 45–60s | 0.6 isolation, slow eccentric | RPE-autoregulated |
| Science-Based / Evidence Lifter | 8–12 | 90s | balanced, minimal techniques | RPE-autoregulated, tracked overload |
| Fascia Stretch / High-Volume Modern | 10–20 | 45–75s | stretch-position emphasis, drop sets | Volume-driven |
| Powerbuilding Hybrid | 4–8 main, 8–12 accessory | 120–180s / 60s | strength-first, hypertrophy accessories | Linear on mains, RPE on accessories |

### Hybrid / calisthenics archetype

```json
{
  "id": "skill_progression_calisthenics",
  "display_name": "Skill-Based Bodyweight Progression",
  "structure": "push/pull/legs or full-body, skill-first ordering",
  "session_order": ["skill_work_first_when_fresh", "strength_bodyweight", "accessory_core"],
  "progression_style": "leverage/rep progression ladder (e.g. pseudo-planche push-up -> tuck planche)",
  "load_style": "bodyweight + band / weighted vest scaling",
  "phase_sensitivity": "high"
}
```

---

## Phase (diet state)

Diet phase is a **training** input, not only a nutrition one. It changes recovery
capacity, which changes what the program should prescribe.

- **Deficit / cutting** — reduced recovery. Hold or reduce total *volume* while
  maintaining intensity on key lifts; volume is the first thing to cut, not intensity.
  Skill work suffers most (motor learning and CNS demand), so reduce its frequency.
  Increase deload frequency.
- **Maintenance** — baseline programming, standard progressive overload.
- **Surplus / bulking** — elevated recovery. Increase volume, train closer to failure
  more often, introduce new skill work and higher frequency.

This matters more for calisthenics/hybrid than for traditional lifting, because
calisthenics progression is largely *skill acquisition* (leverage progressions,
isometrics) rather than load progression, and skill acquisition is far more sensitive
to recovery state than adding weight to a bar.

```json
{
  "phase": "deficit",
  "volume_modifier": 0.75,
  "skill_work_frequency": "reduced",
  "intensity_technique_usage": "minimal",
  "deload_frequency_weeks": 3,
  "priority": "maintain_strength_and_skill_level"
}
```

```json
{
  "phase": "surplus",
  "volume_modifier": 1.15,
  "skill_work_frequency": "increased",
  "intensity_technique_usage": "normal",
  "deload_frequency_weeks": 5,
  "priority": "progress_new_skills_and_load"
}
```

### Phase input: now vs later

- **v1 — self-reported.** Simple toggle: cutting / maintaining / bulking. Zero
  integration cost, ships immediately.
- **Later — inferred.** Pull intake and bodyweight-trend data from a nutrition
  integration and infer phase (weekly average intake vs. estimated TDEE, or bodyweight
  trend over 2–3 weeks). More accurate, since many users mislabel their own phase.
  Should **nudge, not silently override**: "Your logged intake suggests a slight
  surplus — want to update your phase?" Keeps the user in control.

Note: this shares an integration layer with workout logging (Apple Health / wearables),
so phase-detection and tracking integrations are one effort, not two.

---

## Qualifying questions

Asked after archetype match, before generation:

1. **Training age** — novice / 1–3 yr / 3+ yr → sets volume ceiling and gates split complexity
2. **Days per week available** — 3 / 4 / 5–6 → selects from `archetype.split_options`
3. **Equipment access** — full gym / home dumbbell / minimal → filters exercise pool
4. **Injury flags** — shoulder / knee / lower back / none → excludes movement patterns
5. **Current split** (optional) — lets returning users skip re-derivation

Output: a filtered exercise pool + the archetype's prescription rules.

---

## Generator pipeline

**1. Resolve inputs → constraints**
Archetype supplies rep ranges, tempo, rest, compound/isolation ratio, intensity
techniques, split options. Phase supplies volume modifier, skill frequency, deload
cadence. Qualifiers supply days/week, equipment filter, injury exclusions, training age.

**2. Pick the split**
Intersect `archetype.split_options` with days available. Training age gates this —
novices should not receive a 6-day split regardless of request.

**3. Calculate weekly volume budget**

```
sets_per_muscle = archetype.volume.sets_per_muscle_per_week
                × phase.volume_modifier
                × training_age_modifier    // novice 0.7, intermediate 1.0, advanced 1.1
```

Distribute the budget across the split's sessions.

**4. Build the exercise pool**
Master exercise library. Each exercise tagged with:

- primary / secondary muscles
- movement pattern
- equipment required
- compound vs. isolation
- injury contraindications
- progression type (load vs. skill/leverage)

Filter by equipment + injury flags, then rank by `archetype.preferred_movement_patterns`.

**5. Assemble each session**
Order by `archetype.session_order` (skill work first for calisthenics, heavy compound
first for mass-builder). Fill compound slots then isolation slots per the archetype's
ratio, drawing from the ranked pool. Attach sets/reps/tempo/rest. Apply intensity
techniques only where phase allows.

**6. Periodize across the block (8 weeks)**
Progress weeks via `archetype.progression_style` — linear load, RPE autoregulation, or
leverage ladder. Insert deloads at `phase.deload_frequency_weeks`.

---

## Logging data model

```json
{
  "workout_id": "uuid",
  "user_id": "uuid",
  "block_id": "uuid",
  "week": 3,
  "day": 2,
  "date_scheduled": "2026-09-15",
  "status": "completed",
  "exercises": [
    {
      "exercise_id": "incline_db_press",
      "order": 1,
      "prescribed": {
        "sets": 4,
        "reps": "8-10",
        "tempo": "3-1-1",
        "rest_sec": 90,
        "target_rpe": 8
      },
      "logged_sets": [
        { "set": 1, "weight": 70, "reps": 10, "rpe": 7, "unit": "lb" },
        { "set": 2, "weight": 70, "reps": 9, "rpe": 8, "unit": "lb" }
      ],
      "notes": "left shoulder tight"
    }
  ],
  "session_feedback": {
    "difficulty": 4,
    "energy": 3,
    "soreness_flags": ["chest"]
  }
}
```

Store `prescribed` and `logged_sets` **separately** — the delta between them is the
signal that drives auto-progression and is the core of the subscription's value.

### Auto-progression rules (from logged data)

- Consistently hitting top of rep range at low RPE → increase load next session
- Missing reps or high RPE two sessions running → hold load or deload that movement
- `session_feedback.energy` trending low across a week → flag for early deload
- Soreness flags recurring on the same muscle → check volume distribution for that group

---

## Build order (MVP → v2)

1. **Archetype input + qualifiers → single generated workout.** Not the full block yet.
   Validates output *quality* before investing in progression logic.
2. **Full weekly / 8-week block generation.**
3. **Manual logging** — weight, reps, RPE, notes.
4. **Auto-progression** between sessions from logged data.
5. **Integrations** — Apple Health, wearables, nutrition/calorie tracking. Last on
   purpose: most expensive, least differentiating early.

---

## Open questions

- Fallback flow when a typed name matches no archetype — short preference quiz?
- How large the starter exercise library needs to be before generation feels non-repetitive
- Whether hybrid athletes need a separate concurrent-training model (lifting + conditioning
  interference) or can be served by combining existing archetypes
- Free tier boundary: does free include generation but not logging, or a limited block length?
