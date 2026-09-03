export type TrainingAge = "novice" | "intermediate" | "advanced";
export type Equipment = "minimal" | "home_dumbbell" | "full_gym";
export type InjuryFlag = "shoulder" | "knee" | "lower_back";
export type PhaseId = "deficit" | "maintenance" | "surplus";

export interface Qualifiers {
  trainingAge: TrainingAge;
  daysPerWeek: number;
  equipment: Equipment;
  injuries: InjuryFlag[];
}

export interface PrescribedExercise {
  exercise_id: string;
  name: string;
  order: number;
  muscle_group: string;
  prescribed: {
    sets: number;
    reps: string;
    tempo: string;
    rest_sec: number;
    target_rpe: number;
    intensity_technique: string | null;
  };
}

export interface GeneratedWorkout {
  archetype: { id: string; display_name: string };
  phase: PhaseId;
  split: { id: string; day_label: string };
  training_age: TrainingAge;
  exercises: PrescribedExercise[];
  generated_at: string;
}

export interface ArchetypeSuggestion {
  id: string;
  display_name: string;
}

export type GenerateResponse =
  | { matched: true; match_confidence: number; workout: GeneratedWorkout }
  | { matched: false; message: string; suggestions: ArchetypeSuggestion[] };
