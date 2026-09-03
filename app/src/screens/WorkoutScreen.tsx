import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ArchetypeSuggestion, GeneratedWorkout } from "../api/types";

interface Props {
  workout?: GeneratedWorkout;
  suggestions?: ArchetypeSuggestion[];
  message?: string;
  onStartOver: () => void;
}

export function WorkoutScreen({ workout, suggestions, message, onStartOver }: Props) {
  if (!workout) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>No confident match</Text>
        <Text style={styles.subtitle}>{message}</Text>
        {suggestions?.map((s) => (
          <View key={s.id} style={styles.suggestionRow}>
            <Text style={styles.suggestionText}>{s.display_name}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.button} onPress={onStartOver}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{workout.archetype.display_name}</Text>
      <Text style={styles.subtitle}>
        {workout.split.day_label} - {workout.phase} phase - {workout.training_age}
      </Text>

      {workout.exercises.map((exercise) => (
        <View key={`${exercise.order}-${exercise.exercise_id}`} style={styles.exerciseRow}>
          <Text style={styles.exerciseName}>
            {exercise.order}. {exercise.name}
          </Text>
          <Text style={styles.exerciseMeta}>
            {exercise.prescribed.sets} sets x {exercise.prescribed.reps} reps · tempo{" "}
            {exercise.prescribed.tempo} · rest {exercise.prescribed.rest_sec}s · RPE{" "}
            {exercise.prescribed.target_rpe}
          </Text>
          {exercise.prescribed.intensity_technique && (
            <Text style={styles.exerciseTechnique}>
              + {exercise.prescribed.intensity_technique.replace(/_/g, " ")} on final set
            </Text>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={onStartOver}>
        <Text style={styles.buttonText}>Start Over</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20, textTransform: "capitalize" },
  exerciseRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
  },
  exerciseName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  exerciseMeta: { fontSize: 13, color: "#555" },
  exerciseTechnique: { fontSize: 12, color: "#a15c00", marginTop: 2 },
  suggestionRow: { paddingVertical: 8 },
  suggestionText: { fontSize: 15, color: "#333" },
  button: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
