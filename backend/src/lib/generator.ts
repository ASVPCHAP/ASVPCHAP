import archetypesData from "../data/archetypes.json";
import phasesData from "../data/phases.json";
import splitsData from "../data/splits.json";
import exercisesData from "../data/exercises.json";
import type {
  Archetype,
  Equipment,
  Exercise,
  GeneratedWorkout,
  Phase,
  PhaseId,
  PrescribedExercise,
  Qualifiers,
  Split,
  TrainingAge,
} from "./types";

const archetypes = archetypesData as Archetype[];
const phases = phasesData as Record<PhaseId, Phase>;
const splits = splitsData as Split[];
const exercises = exercisesData as Exercise[];

const TRAINING_AGE_RANK: Record<TrainingAge, number> = {
  novice: 0,
  intermediate: 1,
  advanced: 2,
};

const TRAINING_AGE_VOLUME_MODIFIER: Record<TrainingAge, number> = {
  novice: 0.7,
  intermediate: 1.0,
  advanced: 1.1,
};

const EQUIPMENT_RANK: Record<Equipment, number> = {
  minimal: 0,
  home_dumbbell: 1,
  full_gym: 2,
};

export function getArchetypes(): Archetype[] {
  return archetypes;
}

export function getPhase(id: PhaseId): Phase {
  return phases[id];
}

export class GeneratorError extends Error {}

function pickSplit(archetype: Archetype, qualifiers: Qualifiers): Split {
  const ageOk = (s: Split) =>
    TRAINING_AGE_RANK[qualifiers.trainingAge] >= TRAINING_AGE_RANK[s.min_training_age];

  const inArchetype = splits.filter(
    (s) => archetype.split_options.includes(s.id) && ageOk(s)
  );
  const pool = inArchetype.length > 0 ? inArchetype : splits.filter(ageOk);

  if (pool.length === 0) {
    throw new GeneratorError(
      `No split available for training age "${qualifiers.trainingAge}".`
    );
  }

  pool.sort(
    (a, b) =>
      Math.abs(a.days - qualifiers.daysPerWeek) - Math.abs(b.days - qualifiers.daysPerWeek)
  );
  return pool[0];
}

function volumeBudgetForSession(
  archetype: Archetype,
  phase: Phase,
  qualifiers: Qualifiers,
  split: Split,
  dayIndex: number
): Record<string, number> {
  const weeklySetsPerMuscle =
    archetype.volume.sets_per_muscle_per_week *
    phase.volume_modifier *
    TRAINING_AGE_VOLUME_MODIFIER[qualifiers.trainingAge];

  const template = split.day_templates[dayIndex % split.day_templates.length];

  const sessionsPerMuscle: Record<string, number> = {};
  for (const day of split.day_templates) {
    for (const muscle of day.muscle_groups) {
      sessionsPerMuscle[muscle] = (sessionsPerMuscle[muscle] ?? 0) + 1;
    }
  }

  const budget: Record<string, number> = {};
  for (const muscle of template.muscle_groups) {
    const frequency = sessionsPerMuscle[muscle] ?? 1;
    const raw = weeklySetsPerMuscle / frequency;
    budget[muscle] = Math.min(6, Math.max(2, Math.round(raw)));
  }
  return budget;
}

function equipmentAllows(userEquipment: Equipment, exerciseEquipment: Equipment): boolean {
  return EQUIPMENT_RANK[exerciseEquipment] <= EQUIPMENT_RANK[userEquipment];
}

function rankExercise(archetype: Archetype, exercise: Exercise): number {
  const patterns = archetype.exercise_bias.preferred_movement_patterns.join(" ").toLowerCase();
  let score = 0;
  for (const tag of exercise.tags) {
    if (patterns.includes(tag.replace(/_/g, " "))) score += 1;
  }
  if (
    archetype.id === "skill_progression_calisthenics" &&
    exercise.progression_type === "skill"
  ) {
    score += 2;
  }
  return score;
}

function poolForMuscle(
  archetype: Archetype,
  qualifiers: Qualifiers,
  muscle: string
): Exercise[] {
  return exercises
    .filter((e) => e.primary_muscle === muscle)
    .filter((e) => equipmentAllows(qualifiers.equipment, e.equipment))
    .filter((e) => !e.injury_contraindications.some((f) => qualifiers.injuries.includes(f)))
    .sort((a, b) => rankExercise(archetype, b) - rankExercise(archetype, a));
}

function formatTempo(archetype: Archetype): string {
  const t = archetype.tempo;
  return `${t.eccentric_sec}-${t.pause_sec}-${t.concentric_sec}`;
}

function chooseIntensityTechnique(
  archetype: Archetype,
  phase: Phase,
  isLastExerciseForMuscle: boolean
): string | null {
  if (phase.intensity_technique_usage === "minimal") return null;
  if (archetype.intensity_techniques.length === 0) return null;
  if (!isLastExerciseForMuscle) return null;
  return archetype.intensity_techniques[0];
}

export function generateWorkout(
  archetype: Archetype,
  phaseId: PhaseId,
  qualifiers: Qualifiers
): GeneratedWorkout {
  const phase = getPhase(phaseId);
  const split = pickSplit(archetype, qualifiers);
  const dayIndex = qualifiers.dayIndex ?? 0;
  const template = split.day_templates[dayIndex % split.day_templates.length];
  const volumeBudget = volumeBudgetForSession(archetype, phase, qualifiers, split, dayIndex);

  const compoundRatio = archetype.exercise_bias.compound_ratio;
  const usedExerciseIds = new Set<string>();
  const prescribed: PrescribedExercise[] = [];
  let order = 1;

  for (const muscle of template.muscle_groups) {
    const setsBudget = volumeBudget[muscle];
    const pool = poolForMuscle(archetype, qualifiers, muscle).filter(
      (e) => !usedExerciseIds.has(e.id)
    );
    if (pool.length === 0) continue;

    const slots = setsBudget > 4 ? 2 : 1;
    const chosen: Exercise[] = [];

    const compoundFirst = compoundRatio >= 0.5;
    const wantTypes = compoundFirst ? ["compound", "isolation"] : ["isolation", "compound"];

    for (let i = 0; i < slots; i++) {
      const wantType = wantTypes[i % wantTypes.length];
      const candidate =
        pool.find((e) => e.type === wantType && !chosen.includes(e)) ??
        pool.find((e) => !chosen.includes(e));
      if (candidate) chosen.push(candidate);
    }

    const setsPerExercise = Math.max(2, Math.round(setsBudget / chosen.length));

    chosen.forEach((exercise, i) => {
      usedExerciseIds.add(exercise.id);
      const restSec =
        exercise.type === "compound"
          ? archetype.rest_seconds.compound
          : archetype.rest_seconds.isolation;
      const targetRpe = phase.intensity_technique_usage === "minimal" ? 7 : 8;

      prescribed.push({
        exercise_id: exercise.id,
        name: exercise.name,
        order: order++,
        muscle_group: muscle,
        prescribed: {
          sets: setsPerExercise,
          reps: `${archetype.rep_range.min}-${archetype.rep_range.max}`,
          tempo: formatTempo(archetype),
          rest_sec: restSec,
          target_rpe: targetRpe,
          intensity_technique: chooseIntensityTechnique(archetype, phase, i === chosen.length - 1),
        },
      });
    });
  }

  return {
    archetype: { id: archetype.id, display_name: archetype.display_name },
    phase: phaseId,
    split: { id: split.id, day_label: template.label },
    training_age: qualifiers.trainingAge,
    exercises: prescribed,
    generated_at: new Date().toISOString(),
  };
}
