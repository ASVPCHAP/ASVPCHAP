import Constants from "expo-constants";
import type { GenerateResponse, PhaseId, Qualifiers } from "./types";

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "http://localhost:3000";

export async function generateWorkout(
  input: string,
  phase: PhaseId,
  qualifiers: Qualifiers
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input, phase, qualifiers }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}
