import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Equipment, InjuryFlag, PhaseId, Qualifiers, TrainingAge } from "../api/types";

interface Props {
  onSubmit: (phase: PhaseId, qualifiers: Qualifiers) => void;
  onBack: () => void;
  submitting: boolean;
}

const PHASES: { id: PhaseId; label: string }[] = [
  { id: "deficit", label: "Cutting" },
  { id: "maintenance", label: "Maintaining" },
  { id: "surplus", label: "Bulking" },
];

const TRAINING_AGES: { id: TrainingAge; label: string }[] = [
  { id: "novice", label: "Novice (<1 yr)" },
  { id: "intermediate", label: "1-3 yrs" },
  { id: "advanced", label: "3+ yrs" },
];

const DAYS_OPTIONS = [3, 4, 5, 6];

const EQUIPMENT_OPTIONS: { id: Equipment; label: string }[] = [
  { id: "full_gym", label: "Full gym" },
  { id: "home_dumbbell", label: "Home dumbbells" },
  { id: "minimal", label: "Minimal / bodyweight" },
];

const INJURY_OPTIONS: { id: InjuryFlag; label: string }[] = [
  { id: "shoulder", label: "Shoulder" },
  { id: "knee", label: "Knee" },
  { id: "lower_back", label: "Lower back" },
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function QualifiersScreen({ onSubmit, onBack, submitting }: Props) {
  const [phase, setPhase] = useState<PhaseId>("maintenance");
  const [trainingAge, setTrainingAge] = useState<TrainingAge>("intermediate");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState<Equipment>("full_gym");
  const [injuries, setInjuries] = useState<InjuryFlag[]>([]);

  function toggleInjury(flag: InjuryFlag) {
    setInjuries((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.section}>Diet phase</Text>
      <View style={styles.row}>
        {PHASES.map((p) => (
          <Chip key={p.id} label={p.label} selected={phase === p.id} onPress={() => setPhase(p.id)} />
        ))}
      </View>

      <Text style={styles.section}>Training age</Text>
      <View style={styles.row}>
        {TRAINING_AGES.map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            selected={trainingAge === t.id}
            onPress={() => setTrainingAge(t.id)}
          />
        ))}
      </View>

      <Text style={styles.section}>Days per week</Text>
      <View style={styles.row}>
        {DAYS_OPTIONS.map((d) => (
          <Chip
            key={d}
            label={String(d)}
            selected={daysPerWeek === d}
            onPress={() => setDaysPerWeek(d)}
          />
        ))}
      </View>

      <Text style={styles.section}>Equipment access</Text>
      <View style={styles.row}>
        {EQUIPMENT_OPTIONS.map((e) => (
          <Chip
            key={e.id}
            label={e.label}
            selected={equipment === e.id}
            onPress={() => setEquipment(e.id)}
          />
        ))}
      </View>

      <Text style={styles.section}>Injury flags</Text>
      <View style={styles.row}>
        {INJURY_OPTIONS.map((i) => (
          <Chip
            key={i.id}
            label={i.label}
            selected={injuries.includes(i.id)}
            onPress={() => toggleInjury(i.id)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={submitting}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        disabled={submitting}
        onPress={() => onSubmit(phase, { trainingAge, daysPerWeek, equipment, injuries })}
      >
        <Text style={styles.buttonText}>{submitting ? "Generating..." : "Generate Workout"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  section: { fontSize: 14, fontWeight: "700", marginTop: 20, marginBottom: 8, color: "#333" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextSelected: { color: "#fff" },
  button: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backButton: { paddingVertical: 12, alignItems: "center", marginTop: 12 },
  backButtonText: { color: "#555", fontSize: 14 },
});
