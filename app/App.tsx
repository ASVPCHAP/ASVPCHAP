import { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { generateWorkout } from "./src/api/client";
import { InputScreen } from "./src/screens/InputScreen";
import { QualifiersScreen } from "./src/screens/QualifiersScreen";
import { WorkoutScreen } from "./src/screens/WorkoutScreen";
import type { ArchetypeSuggestion, GeneratedWorkout, PhaseId, Qualifiers } from "./src/api/types";

type Step = "input" | "qualifiers" | "result";

export default function App() {
  const [step, setStep] = useState<Step>("input");
  const [archetypeInput, setArchetypeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<GeneratedWorkout | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<ArchetypeSuggestion[] | undefined>(undefined);
  const [noMatchMessage, setNoMatchMessage] = useState<string | undefined>(undefined);

  async function handleSubmit(phase: PhaseId, qualifiers: Qualifiers) {
    setSubmitting(true);
    setError(null);
    try {
      const response = await generateWorkout(archetypeInput, phase, qualifiers);
      if (response.matched) {
        setWorkout(response.workout);
        setSuggestions(undefined);
        setNoMatchMessage(undefined);
      } else {
        setWorkout(undefined);
        setSuggestions(response.suggestions);
        setNoMatchMessage(response.message);
      }
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep("input");
    setArchetypeInput("");
    setWorkout(undefined);
    setSuggestions(undefined);
    setNoMatchMessage(undefined);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {submitting ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      ) : step === "input" ? (
        <InputScreen
          onContinue={(input) => {
            setArchetypeInput(input);
            setStep("qualifiers");
          }}
        />
      ) : step === "qualifiers" ? (
        <QualifiersScreen onSubmit={handleSubmit} onBack={() => setStep("input")} submitting={submitting} />
      ) : (
        <WorkoutScreen
          workout={workout}
          suggestions={suggestions}
          message={noMatchMessage}
          onStartOver={startOver}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorBanner: { backgroundColor: "#fdecea", padding: 12 },
  errorText: { color: "#a11", fontSize: 13 },
});
