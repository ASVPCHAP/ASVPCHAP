import { matchArchetype } from "./fuzzyMatch";
import { generateWorkout, getArchetypes } from "./generator";
import type { PhaseId, Qualifiers } from "./types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

const archetypes = getArchetypes();

// Fuzzy match: exact-ish keyword should resolve confidently.
const pumpMatch = matchArchetype("pump", archetypes);
assert(pumpMatch.match?.archetype.id === "contraction_pump_specialist", "matches 'pump' to contraction/pump specialist");

const calisthenicsMatch = matchArchetype("calisthenics skill work", archetypes);
assert(calisthenicsMatch.match?.archetype.id === "skill_progression_calisthenics", "matches calisthenics phrase");

const gibberishMatch = matchArchetype("zzqxw12309", archetypes);
assert(gibberishMatch.match === null, "gibberish input falls back to no confident match");

// Generator: novice should never be routed into a 5-6 day split, even if archetype prefers it.
const noviceQualifiers: Qualifiers = {
  trainingAge: "novice",
  daysPerWeek: 6,
  equipment: "full_gym",
  injuries: [],
};
const pumpArchetype = archetypes.find((a) => a.id === "contraction_pump_specialist")!;
const noviceWorkout = generateWorkout(pumpArchetype, "maintenance" as PhaseId, noviceQualifiers);
assert(
  noviceWorkout.split.id !== "bro_split_5day",
  "novice is gated away from the 5-day bro split regardless of days requested"
);

// Injury exclusion: shoulder-flagged users should never receive shoulder-contraindicated work.
const shoulderQualifiers: Qualifiers = {
  trainingAge: "advanced",
  daysPerWeek: 4,
  equipment: "full_gym",
  injuries: ["shoulder"],
};
const massArchetype = archetypes.find((a) => a.id === "old_school_mass_builder")!;
const shoulderWorkout = generateWorkout(massArchetype, "surplus" as PhaseId, shoulderQualifiers);
const hasShoulderRisk = shoulderWorkout.exercises.some((e) =>
  ["barbell_bench_press", "overhead_press", "pushup", "dip"].includes(e.exercise_id)
);
assert(!hasShoulderRisk, "shoulder injury flag excludes shoulder-contraindicated exercises");

// Equipment: minimal-equipment users should only get minimal-tier exercises.
const minimalQualifiers: Qualifiers = {
  trainingAge: "intermediate",
  daysPerWeek: 3,
  equipment: "minimal",
  injuries: [],
};
const scienceArchetype = archetypes.find((a) => a.id === "science_based_evidence_lifter")!;
const minimalWorkout = generateWorkout(scienceArchetype, "maintenance" as PhaseId, minimalQualifiers);
assert(minimalWorkout.exercises.length > 0, "minimal-equipment generation still produces a workout");

console.log(JSON.stringify(minimalWorkout, null, 2));
