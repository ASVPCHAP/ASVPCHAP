export type TrainingAge = "novice" | "intermediate" | "advanced";
export type Equipment = "minimal" | "home_dumbbell" | "full_gym";
export type InjuryFlag = "shoulder" | "knee" | "lower_back";
export type PhaseId = "deficit" | "maintenance" | "surplus";

export interface Archetype {
  id: string;
  display_name: string;
  matched_names: string[];
  rep_range: { min: number; max: number };
  tempo: { eccentric_sec: number; pause_sec: number; concentric_sec: number };
  rest_seconds: { compound: number; isolation: number };
  exercise_bias: {
    compound_ratio: number;
    isolation_ratio: number;
    preferred_movement_patterns: string[];
  };
  volume: { sets_per_muscle_per_week: number };
  split_options: string[];
  intensity_techniques: string[];
  cueing_style: string;
  progression_style: string;
  phase_sensitivity: "low" | "medium" | "high";
  session_order?: string[];
  load_style?: string;
}

export interface Phase {
  phase: PhaseId;
  volume_modifier: number;
  skill_work_frequency: "reduced" | "normal" | "increased";
  intensity_technique_usage: "minimal" | "normal";
  deload_frequency_weeks: number;
  priority: string;
}

export interface SplitDayTemplate {
  label: string;
  muscle_groups: string[];
}

export interface Split {
  id: string;
  days: number;
  min_training_age: TrainingAge;
  day_templates: SplitDayTemplate[];
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  movement_pattern: string;
  equipment: Equipment;
  type: "compound" | "isolation";
  injury_contraindications: InjuryFlag[];
  progression_type: "load" | "skill";
  tags: string[];
}

export interface Qualifiers {
  trainingAge: TrainingAge;
  daysPerWeek: number;
  equipment: Equipment;
  injuries: InjuryFlag[];
  dayIndex?: number;
}

export interface GenerateRequest {
  input: string;
  phase: PhaseId;
  qualifiers: Qualifiers;
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

export interface ArchetypeMatch {
  archetype: Archetype;
  score: number;
}
