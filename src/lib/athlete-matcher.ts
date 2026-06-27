// =====================================================================
// Athlete matcher — given name/email candidates from an inbound email,
// find the matching athlete row with a confidence score.
//
// Strategy (best match wins):
//   1. Exact email match           → confidence 1.00, method "email"
//   2. Exact first+last name match → confidence 0.95, method "name_exact"
//   3. Normalized name match       → confidence 0.85, method "name_normalized"
//   4. Fuzzy name match (Lev)      → confidence 0.50-0.80, method "name_fuzzy"
//   5. No match                    → confidence 0, method "none"
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

type AthleteRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type AthleteMatchResult = {
  athleteId: string | null;
  confidence: number;
  method: "email" | "name_exact" | "name_normalized" | "name_fuzzy" | "none";
  matched?: { id: string; firstName: string; lastName: string; email: string | null };
};

// Strip accents, lowercase, collapse whitespace. "Élise Müller" → "elise muller"
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Standard Levenshtein distance — small inputs (names), so O(mn) is fine.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

export async function matchAthlete(
  admin: SupabaseClient,
  candidates: { names: string[]; emails: string[] },
): Promise<AthleteMatchResult> {
  // 1. Email match (cheapest, most reliable)
  for (const email of candidates.emails) {
    const { data } = await admin
      .from("athletes")
      .select("id, email, first_name, last_name")
      .eq("email", email)
      .maybeSingle<AthleteRow>();
    if (data) {
      return {
        athleteId: data.id,
        confidence: 1.0,
        method: "email",
        matched: {
          id: data.id,
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          email: data.email,
        },
      };
    }
  }

  // 2/3/4. Name matching — load all athletes once (volume is small: 250-1k rows)
  const { data: athletes } = await admin
    .from("athletes")
    .select("id, email, first_name, last_name");
  if (!athletes?.length) {
    return { athleteId: null, confidence: 0, method: "none" };
  }

  let best: AthleteMatchResult = { athleteId: null, confidence: 0, method: "none" };

  for (const candidate of candidates.names) {
    const normCandidate = normalize(candidate);
    if (!normCandidate) continue;

    for (const a of athletes as AthleteRow[]) {
      const fullName = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
      const normFull = normalize(fullName);
      if (!normFull) continue;

      // 2. Exact match (case + accents sensitive)
      if (fullName === candidate) {
        return {
          athleteId: a.id,
          confidence: 0.95,
          method: "name_exact",
          matched: {
            id: a.id,
            firstName: a.first_name ?? "",
            lastName: a.last_name ?? "",
            email: a.email,
          },
        };
      }

      // 3. Normalized match (accents + case insensitive)
      if (normFull === normCandidate) {
        if (best.confidence < 0.85) {
          best = {
            athleteId: a.id,
            confidence: 0.85,
            method: "name_normalized",
            matched: {
              id: a.id,
              firstName: a.first_name ?? "",
              lastName: a.last_name ?? "",
              email: a.email,
            },
          };
        }
        continue;
      }

      // 4. Fuzzy
      const sim = similarityScore(normFull, normCandidate);
      // Threshold: 0.7 → 70 % similar. Below that, ignore (too risky).
      if (sim >= 0.7) {
        const confidence = Math.min(0.8, 0.5 + (sim - 0.7) * 3); // 0.7→0.5, 0.8→0.8
        if (confidence > best.confidence) {
          best = {
            athleteId: a.id,
            confidence: Math.round(confidence * 100) / 100,
            method: "name_fuzzy",
            matched: {
              id: a.id,
              firstName: a.first_name ?? "",
              lastName: a.last_name ?? "",
              email: a.email,
            },
          };
        }
      }
    }
  }

  return best;
}
