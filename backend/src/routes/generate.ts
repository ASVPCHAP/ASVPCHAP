import { Router } from "express";
import { matchArchetype } from "../lib/fuzzyMatch";
import { GeneratorError, generateWorkout, getArchetypes } from "../lib/generator";
import type { GenerateRequest, Equipment, InjuryFlag, PhaseId, TrainingAge } from "../lib/types";

const router = Router();

const VALID_TRAINING_AGES: TrainingAge[] = ["novice", "intermediate", "advanced"];
const VALID_EQUIPMENT: Equipment[] = ["minimal", "home_dumbbell", "full_gym"];
const VALID_INJURIES: InjuryFlag[] = ["shoulder", "knee", "lower_back"];
const VALID_PHASES: PhaseId[] = ["deficit", "maintenance", "surplus"];

function validateRequest(body: any): { error: string } | { value: GenerateRequest } {
  if (typeof body?.input !== "string" || body.input.trim().length === 0) {
    return { error: "`input` (free-text archetype/athlete name) is required." };
  }
  if (!VALID_PHASES.includes(body?.phase)) {
    return { error: `\`phase\` must be one of: ${VALID_PHASES.join(", ")}.` };
  }
  const q = body?.qualifiers ?? {};
  if (!VALID_TRAINING_AGES.includes(q.trainingAge)) {
    return { error: `qualifiers.trainingAge must be one of: ${VALID_TRAINING_AGES.join(", ")}.` };
  }
  if (typeof q.daysPerWeek !== "number" || q.daysPerWeek < 1 || q.daysPerWeek > 7) {
    return { error: "qualifiers.daysPerWeek must be a number between 1 and 7." };
  }
  if (!VALID_EQUIPMENT.includes(q.equipment)) {
    return { error: `qualifiers.equipment must be one of: ${VALID_EQUIPMENT.join(", ")}.` };
  }
  const injuries: InjuryFlag[] = Array.isArray(q.injuries) ? q.injuries : [];
  if (injuries.some((f) => !VALID_INJURIES.includes(f))) {
    return { error: `qualifiers.injuries entries must be one of: ${VALID_INJURIES.join(", ")}.` };
  }

  return {
    value: {
      input: body.input,
      phase: body.phase,
      qualifiers: {
        trainingAge: q.trainingAge,
        daysPerWeek: q.daysPerWeek,
        equipment: q.equipment,
        injuries,
        dayIndex: typeof q.dayIndex === "number" ? q.dayIndex : undefined,
      },
    },
  };
}

router.post("/generate", (req, res) => {
  const validated = validateRequest(req.body);
  if ("error" in validated) {
    return res.status(400).json({ error: validated.error });
  }
  const { input, phase, qualifiers } = validated.value;

  const { match, suggestions } = matchArchetype(input, getArchetypes());
  if (!match) {
    return res.status(200).json({
      matched: false,
      message: "No confident archetype match. Try a training style keyword, or pick one below.",
      suggestions: suggestions.map((s) => ({
        id: s.archetype.id,
        display_name: s.archetype.display_name,
      })),
    });
  }

  try {
    const workout = generateWorkout(match.archetype, phase, qualifiers);
    return res.status(200).json({ matched: true, match_confidence: match.score, workout });
  } catch (err) {
    if (err instanceof GeneratorError) {
      return res.status(422).json({ error: err.message });
    }
    throw err;
  }
});

router.get("/archetypes", (_req, res) => {
  res.json(
    getArchetypes().map((a) => ({ id: a.id, display_name: a.display_name }))
  );
});

export default router;
