import type { Archetype, ArchetypeMatch } from "./types";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const rows: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) rows[i][0] = i;
  for (let j = 0; j <= n; j++) rows[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }
  return rows[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function scoreAgainstName(input: string, candidateName: string): number {
  const a = normalize(input);
  const b = normalize(candidateName);
  if (!a || !b) return 0;

  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.85;

  const aTokens = a.split(/\s+/);
  const bTokens = b.split(/\s+/);
  const sharedTokens = aTokens.filter((t) => bTokens.includes(t)).length;
  const tokenScore = sharedTokens / Math.max(aTokens.length, bTokens.length);

  const editScore = similarity(a, b);

  return Math.max(tokenScore * 0.9, editScore);
}

const MATCH_THRESHOLD = 0.45;

/**
 * Matches free-text user input ("I want to train like X") against the internal
 * archetype table. Never exposes matched_names or raw candidate identities beyond
 * the archetype's own display_name.
 */
export function matchArchetype(
  input: string,
  archetypes: Archetype[]
): { match: ArchetypeMatch | null; suggestions: ArchetypeMatch[] } {
  const scored: ArchetypeMatch[] = archetypes.map((archetype) => {
    const best = Math.max(
      ...archetype.matched_names.map((name) => scoreAgainstName(input, name))
    );
    return { archetype, score: best };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (top && top.score >= MATCH_THRESHOLD) {
    return { match: top, suggestions: scored.slice(1, 4) };
  }
  return { match: null, suggestions: scored.slice(0, 4) };
}
