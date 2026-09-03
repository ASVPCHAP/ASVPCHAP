import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  onContinue: (input: string) => void;
}

export function InputScreen({ onContinue }: Props) {
  const [text, setText] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Train like...</Text>
      <Text style={styles.subtitle}>
        Enter a training style or the name of an athlete you admire. We'll match it to a
        training philosophy and build your program around it.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. old school mass builder, pump, calisthenics"
        placeholderTextColor="#888"
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={[styles.button, text.trim().length === 0 && styles.buttonDisabled]}
        disabled={text.trim().length === 0}
        onPress={() => onContinue(text.trim())}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#aaa" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
