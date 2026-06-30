// =====================================================================
// Shared physiological profile model.
// Some athletes (triathletes) need separate lab tests per discipline
// because FCmax / VO2max / ventilatory thresholds differ between
// running and cycling. The primary `PhysioFields` on the profile stays
// as a default; `tests.cap` / `tests.velo` override per discipline.
// =====================================================================

export type PhysioFields = {
  fcmax?: number | string;
  vo2max?: number | string;
  sv1?: number | string;
  sv2?: number | string;
  rerSV1?: number | string;
  rerSV2?: number | string;
  vo2SV1?: number | string;
  vo2SV2?: number | string;
};

export type PhysioProfileExt = PhysioFields & {
  // Body composition stays global (one weight per person).
  poids?: number | string;
  discipline?: string; // "Trail" | "Course" | "Cyclisme" | "Triathlon" | "Natation"
  // Optional discipline-specific lab tests (triathletes typically fill both).
  tests?: {
    cap?: PhysioFields;
    velo?: PhysioFields;
  };
  // Swim glucide intake estimate (g/h). Defaults to DEFAULT_SWIM_GLUC_PER_H.
  // Used by tri pacing when computing the swim leg depletion.
  swimGlucPerH?: number | string;
};

export type PhysioDiscipline = "cap" | "velo" | "natation";

export const DEFAULT_SWIM_GLUC_PER_H = 45;

/**
 * Normalize the many discipline labels in use across the app to one of
 * three canonical buckets. Returns null when not recognized.
 */
export function normalizeDiscipline(d?: string | null): PhysioDiscipline | null {
  if (!d) return null;
  const v = d.toString().trim().toLowerCase();
  if (!v) return null;
  if (
    v === "velo" ||
    v === "vélo" ||
    v === "cyclisme" ||
    v === "bike" ||
    v === "cycling"
  ) {
    return "velo";
  }
  if (v === "natation" || v === "swim" || v === "swimming") {
    return "natation";
  }
  if (
    v === "cap" ||
    v === "course" ||
    v === "cap_route" ||
    v === "trail" ||
    v === "running" ||
    v === "run"
  ) {
    return "cap";
  }
  return null;
}

export function isTriathlete(profile: { discipline?: string | null }): boolean {
  return (profile.discipline || "").toString().trim().toLowerCase() === "triathlon";
}

/**
 * Resolve the physio fields to use for a given discipline.
 * If a tests.cap / tests.velo entry exists, its values override the
 * primary profile fields (missing values fall back to primary).
 * For natation or unknown disciplines, returns the primary profile fields.
 */
export function getPhysioFor(
  profile: PhysioProfileExt,
  discipline?: string | null,
): PhysioFields & { poids?: number | string } {
  const norm = normalizeDiscipline(discipline);
  const base: PhysioFields & { poids?: number | string } = {
    poids: profile.poids,
    fcmax: profile.fcmax,
    vo2max: profile.vo2max,
    sv1: profile.sv1,
    sv2: profile.sv2,
    rerSV1: profile.rerSV1,
    rerSV2: profile.rerSV2,
    vo2SV1: profile.vo2SV1,
    vo2SV2: profile.vo2SV2,
  };
  if (norm === "cap" && profile.tests?.cap) {
    return mergeNonEmpty(base, profile.tests.cap);
  }
  if (norm === "velo" && profile.tests?.velo) {
    return mergeNonEmpty(base, profile.tests.velo);
  }
  return base;
}

function mergeNonEmpty<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== undefined && v !== null && v !== "") {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}
