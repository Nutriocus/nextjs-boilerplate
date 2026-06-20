// =====================================================================
// Blood biomarkers reference — pre-tuned for endurance athletes.
// Thresholds combine standard lab ranges + endurance-specific optimum
// (Burke, Stellingwerff, Pedlar, Maughan, IOC RED-S consensus).
// =====================================================================

export type BloodCategory =
  | "fer"
  | "hormones"
  | "vitamines"
  | "lipides"
  | "inflammation";

export const CATEGORY_META: Record<BloodCategory, { label: string; icon: string; color: string }> = {
  fer:           { label: "Fer & transport oxygène",        icon: "🩸", color: "#cf2e2e" },
  hormones:      { label: "Hormones",                        icon: "⚗️", color: "#FF4501" },
  vitamines:     { label: "Vitamines & micronutriments",     icon: "☀️", color: "#b36b00" },
  lipides:       { label: "Lipides",                         icon: "💧", color: "#5f8c0a" },
  inflammation:  { label: "Inflammation",                    icon: "🔥", color: "#0a0a0a" },
};

export type MarkerStatus = "optimal" | "normal" | "alertLow" | "alertHigh" | "missing";

export type MarkerDef = {
  key: string;
  label: string;
  category: BloodCategory;
  unit: string;
  utility: string;
  /** If true the optimal/alert ranges depend on biological sex. */
  sexSpecific?: boolean;
  ranges: {
    sex?: "H" | "F";
    normalMin: number;
    normalMax: number;
    /** Endurance-optimal window (greener). */
    optimalMin?: number;
    optimalMax?: number;
    /** Below this = red alert. */
    alertBelow?: number;
    /** Above this = red alert. */
    alertAbove?: number;
    alertMessage?: string;
  }[];
};

export const BLOOD_MARKERS: MarkerDef[] = [
  // ─── Fer & transport oxygène ───
  {
    key: "ferritine",
    label: "Ferritine",
    category: "fer",
    unit: "ng/mL",
    utility: "Réserves de fer — clé pour la production d'énergie aérobie.",
    sexSpecific: true,
    ranges: [
      { sex: "H", normalMin: 30, normalMax: 300, optimalMin: 80, optimalMax: 200, alertBelow: 50, alertMessage: "Risque carence martiale → baisse de la production aérobie." },
      { sex: "F", normalMin: 15, normalMax: 150, optimalMin: 50, optimalMax: 130, alertBelow: 30, alertMessage: "Risque carence martiale → baisse de la production aérobie." },
    ],
  },
  {
    key: "transferrine",
    label: "Transferrine",
    category: "fer",
    unit: "g/L",
    utility: "Transporte le fer — utile pour évaluer un déficit fonctionnel.",
    ranges: [
      { normalMin: 2.0, normalMax: 3.6, optimalMin: 2.4, optimalMax: 3.0, alertAbove: 3.6, alertMessage: "Transferrine élevée → fer insuffisant à transporter (carence)." },
    ],
  },
  {
    key: "saturation_tf",
    label: "Saturation transferrine",
    category: "fer",
    unit: "%",
    utility: "Estime l'efficacité du transport du fer dans le sang.",
    ranges: [
      { normalMin: 20, normalMax: 45, optimalMin: 25, optimalMax: 40, alertBelow: 20, alertMessage: "Saturation basse → déficit fonctionnel en fer." },
    ],
  },
  {
    key: "hemoglobine",
    label: "Hémoglobine",
    category: "fer",
    unit: "g/dL",
    utility: "Indicateur direct de la capacité de transport de l'oxygène.",
    sexSpecific: true,
    ranges: [
      { sex: "H", normalMin: 13, normalMax: 17, optimalMin: 14.5, optimalMax: 16.5, alertBelow: 13, alertMessage: "Anémie probable → impact direct sur VO₂max." },
      { sex: "F", normalMin: 12, normalMax: 15, optimalMin: 13, optimalMax: 14.5, alertBelow: 12, alertMessage: "Anémie probable → impact direct sur VO₂max." },
    ],
  },

  // ─── Hormones ───
  {
    key: "testosterone_totale",
    label: "Testostérone totale",
    category: "hormones",
    unit: "ng/mL",
    utility: "Hormone anabolique — baisse souvent avec une charge d'entraînement élevée.",
    sexSpecific: true,
    ranges: [
      { sex: "H", normalMin: 2.7, normalMax: 8.0, optimalMin: 4.0, optimalMax: 7.0, alertBelow: 3.0, alertMessage: "Testostérone basse → signal de surentraînement ou RED-S chez l'homme." },
      { sex: "F", normalMin: 0.06, normalMax: 0.8, optimalMin: 0.15, optimalMax: 0.6, alertBelow: 0.05, alertMessage: "Testostérone effondrée → suspicion RED-S." },
    ],
  },
  {
    key: "cortisol",
    label: "Cortisol matinal",
    category: "hormones",
    unit: "µg/L",
    utility: "Marqueur du stress métabolique — souvent élevé en surentraînement.",
    ranges: [
      { normalMin: 50, normalMax: 250, optimalMin: 80, optimalMax: 180, alertAbove: 250, alertMessage: "Cortisol élevé → stress chronique / surentraînement / sommeil." },
    ],
  },
  {
    key: "tsh",
    label: "TSH",
    category: "hormones",
    unit: "mUI/L",
    utility: "Dépistage des troubles thyroïdiens impactant énergie et métabolisme.",
    ranges: [
      { normalMin: 0.4, normalMax: 4.0, optimalMin: 1.0, optimalMax: 2.5, alertBelow: 0.4, alertAbove: 4.0, alertMessage: "TSH hors plage → troubles thyroïdiens à investiguer." },
    ],
  },
  {
    key: "t3_libre",
    label: "T3 libre",
    category: "hormones",
    unit: "pmol/L",
    utility: "Forme active des hormones thyroïdiennes — sensible à l'état énergétique.",
    ranges: [
      { normalMin: 3.0, normalMax: 7.0, optimalMin: 4.5, optimalMax: 6.5, alertBelow: 3.0, alertMessage: "T3 libre basse → signal classique de RED-S / hypométabolisme." },
    ],
  },

  // ─── Vitamines & micronutriments ───
  {
    key: "vitamine_d",
    label: "Vitamine D (25-OH)",
    category: "vitamines",
    unit: "ng/mL",
    utility: "Essentielle pour l'immunité, les fonctions musculaires et l'absorption du calcium.",
    ranges: [
      { normalMin: 30, normalMax: 100, optimalMin: 40, optimalMax: 80, alertBelow: 30, alertMessage: "Carence en vitamine D → immunité, force musculaire et qualité osseuse affaiblies." },
    ],
  },
  {
    key: "vitamine_b12",
    label: "Vitamine B12 (cobalamine)",
    category: "vitamines",
    unit: "pg/mL",
    utility: "Indispensable à la formation des globules rouges, au système nerveux et à la production d'énergie — déficit fréquent chez les végétariens / véganes.",
    ranges: [
      { normalMin: 200, normalMax: 900, optimalMin: 400, optimalMax: 800, alertBelow: 300, alertMessage: "B12 basse → fatigue, anémie macrocytaire, troubles neuro — à supplémenter rapidement." },
    ],
  },
  {
    key: "vitamine_b9",
    label: "Vitamine B9 (folates)",
    category: "vitamines",
    unit: "ng/mL",
    utility: "Indispensable à la production des globules rouges et au métabolisme énergétique cellulaire.",
    ranges: [
      { normalMin: 5, normalMax: 20, optimalMin: 7, optimalMax: 18, alertBelow: 5, alertMessage: "Folates bas → anémie macrocytaire, fatigue chronique." },
    ],
  },
  {
    key: "zinc",
    label: "Zinc",
    category: "vitamines",
    unit: "mg/L",
    utility: "Cofacteur enzymatique clé (synthèse protéique, immunité, production de testostérone) — souvent perdu via la sueur chez le sportif d'endurance.",
    ranges: [
      { normalMin: 0.7, normalMax: 1.2, optimalMin: 0.9, optimalMax: 1.15, alertBelow: 0.7, alertMessage: "Zinc bas → immunité affaiblie, cicatrisation lente, baisse de testostérone." },
    ],
  },

  // ─── Lipides ───
  {
    key: "cholesterol_total",
    label: "Cholestérol total",
    category: "lipides",
    unit: "g/L",
    utility: "Surveillance du métabolisme lipidique — indicateur général.",
    ranges: [
      { normalMin: 0, normalMax: 2.0, optimalMin: 0, optimalMax: 2.0, alertAbove: 2.4, alertMessage: "Cholestérol total élevé → revoir profil lipidique global." },
    ],
  },
  {
    key: "hdl",
    label: "HDL",
    category: "lipides",
    unit: "g/L",
    utility: "« Bon » cholestérol — protège contre les risques cardiovasculaires.",
    sexSpecific: true,
    ranges: [
      { sex: "H", normalMin: 0.4, normalMax: 2.0, optimalMin: 0.6, optimalMax: 2.0, alertBelow: 0.4, alertMessage: "HDL bas → augmenter activité physique + acides gras de qualité." },
      { sex: "F", normalMin: 0.5, normalMax: 2.0, optimalMin: 0.65, optimalMax: 2.0, alertBelow: 0.5, alertMessage: "HDL bas → augmenter activité physique + acides gras de qualité." },
    ],
  },
  {
    key: "triglycerides",
    label: "Triglycérides",
    category: "lipides",
    unit: "g/L",
    utility: "Peuvent s'élever en cas de déséquilibre alimentaire ou métabolique.",
    ranges: [
      { normalMin: 0, normalMax: 1.5, optimalMin: 0, optimalMax: 1.0, alertAbove: 1.5, alertMessage: "Triglycérides élevés → revoir équilibre glucides/lipides et alcool." },
    ],
  },

  // ─── Inflammation ───
  {
    key: "crp_us",
    label: "CRP ultrasensible",
    category: "inflammation",
    unit: "mg/L",
    utility: "Indicateur d'inflammation de bas grade — surentraînement ou infection.",
    ranges: [
      { normalMin: 0, normalMax: 5.0, optimalMin: 0, optimalMax: 0.5, alertAbove: 2.0, alertMessage: "CRPus élevée → inflammation chronique / surentraînement / infection latente." },
    ],
  },
];

export function getRange(def: MarkerDef, sex?: "H" | "F") {
  if (def.sexSpecific && sex) {
    return def.ranges.find((r) => r.sex === sex) ?? def.ranges[0];
  }
  return def.ranges[0];
}

export function evaluateMarker(
  def: MarkerDef,
  rawValue: string | number | undefined | null,
  sex?: "H" | "F",
): { status: MarkerStatus; range: MarkerDef["ranges"][number]; alert?: string } {
  const range = getRange(def, sex);
  if (rawValue === "" || rawValue === undefined || rawValue === null) {
    return { status: "missing", range };
  }
  const n = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue).replace(",", "."));
  if (isNaN(n)) return { status: "missing", range };

  if (range.alertBelow !== undefined && n < range.alertBelow) {
    return { status: "alertLow", range, alert: range.alertMessage };
  }
  if (range.alertAbove !== undefined && n > range.alertAbove) {
    return { status: "alertHigh", range, alert: range.alertMessage };
  }
  if (
    range.optimalMin !== undefined &&
    range.optimalMax !== undefined &&
    n >= range.optimalMin &&
    n <= range.optimalMax
  ) {
    return { status: "optimal", range };
  }
  return { status: "normal", range };
}

export const STATUS_META: Record<MarkerStatus, { label: string; color: string; bg: string }> = {
  optimal:   { label: "Optimal endurance", color: "var(--color-success)", bg: "rgba(95,140,10,0.12)" },
  normal:    { label: "Normal",            color: "#b36b00",              bg: "rgba(179,107,0,0.10)" },
  alertLow:  { label: "Trop bas",          color: "var(--color-danger)",  bg: "rgba(207,46,46,0.12)" },
  alertHigh: { label: "Trop élevé",        color: "var(--color-danger)",  bg: "rgba(207,46,46,0.12)" },
  missing:   { label: "Non renseigné",     color: "var(--color-text-muted)", bg: "var(--color-surface-2)" },
};

export function getMarker(key: string): MarkerDef | undefined {
  return BLOOD_MARKERS.find((m) => m.key === key);
}

// =====================================================================
// CLINICAL CONCLUSION GENERATOR
// Detects classical endurance patterns (RED-S, carence martiale, sur-
// entraînement, déficits vitaminiques) and produces a structured report
// for the athlete: synthèse, alertes, points forts, recommandations.
// =====================================================================
export type ConclusionStatus = "optimal" | "good" | "watch" | "alert";

export type Conclusion = {
  summary: string;
  status: ConclusionStatus;
  patterns: string[];       // High-level clinical patterns detected
  alerts: { label: string; message: string }[];
  strengths: string[];      // Markers in optimal endurance range
  recommendations: string[];
  filled: number;
  total: number;
};

type Eval = { status: MarkerStatus; range: MarkerDef["ranges"][number]; alert?: string };
type MarkersMap = Record<string, string | number>;

function toNum(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

export function generateConclusion(
  markers: MarkersMap,
  sex?: "H" | "F",
): Conclusion {
  const evals = new Map<string, Eval>();
  let filled = 0;
  for (const m of BLOOD_MARKERS) {
    const ev = evaluateMarker(m, markers[m.key], sex);
    evals.set(m.key, ev);
    if (ev.status !== "missing") filled += 1;
  }

  const total = BLOOD_MARKERS.length;
  const get = (k: string) => evals.get(k);
  const isAlert = (k: string) => {
    const e = get(k);
    return e && (e.status === "alertLow" || e.status === "alertHigh");
  };
  const isOptimal = (k: string) => get(k)?.status === "optimal";

  const alerts: { label: string; message: string }[] = [];
  const strengths: string[] = [];
  const patterns: string[] = [];
  const recommendations: string[] = [];

  for (const m of BLOOD_MARKERS) {
    const e = get(m.key)!;
    if (e.status === "alertLow" || e.status === "alertHigh") {
      alerts.push({ label: m.label, message: e.alert ?? STATUS_META[e.status].label });
    } else if (e.status === "optimal") {
      strengths.push(m.label);
    }
  }

  // ─── Pattern detection ───
  const ferritine = toNum(markers.ferritine);
  const hb = toNum(markers.hemoglobine);
  const sat = toNum(markers.saturation_tf);
  const t3 = toNum(markers.t3_libre);
  const testo = toNum(markers.testosterone_totale);
  const cortisol = toNum(markers.cortisol);
  const crp = toNum(markers.crp_us);
  const vitD = toNum(markers.vitamine_d);
  const b12 = toNum(markers.vitamine_b12);
  const b9 = toNum(markers.vitamine_b9);
  const zinc = toNum(markers.zinc);
  const hdl = toNum(markers.hdl);
  const trigly = toNum(markers.triglycerides);
  const chol = toNum(markers.cholesterol_total);
  const tsh = toNum(markers.tsh);

  // 1) Carence martiale + anémie ferriprive
  if (isAlert("ferritine") && (isAlert("hemoglobine") || (sat !== null && sat < 20))) {
    patterns.push("🩸 Carence martiale + anémie ferriprive probable");
    recommendations.push("Supplémentation fer (60–100 mg/j de fer-élément) sur 3 mois minimum, hors repas avec vitamine C, et recontrôler la ferritine.");
  } else if (isAlert("ferritine")) {
    patterns.push("🩸 Carence martiale fonctionnelle (réserves basses, transport encore OK)");
    recommendations.push("Augmenter l'apport en fer alimentaire (viandes rouges, abats, légumineuses + vitamine C) et envisager une supplémentation légère.");
  }

  // 2) RED-S / déficit énergétique relatif
  const redsSignals: string[] = [];
  if (t3 !== null && t3 < 3) redsSignals.push("T3 libre basse");
  if (sex === "H" && testo !== null && testo < 3) redsSignals.push("testostérone basse");
  if (sex === "F" && testo !== null && testo < 0.05) redsSignals.push("testostérone effondrée");
  if (cortisol !== null && cortisol > 250) redsSignals.push("cortisol élevé");
  if (redsSignals.length >= 2) {
    patterns.push("⚡ Signaux compatibles avec un déficit énergétique relatif (RED-S) : " + redsSignals.join(", "));
    recommendations.push("Augmenter la disponibilité énergétique (>45 kcal/kg de masse maigre/jour) et revoir la périodisation avec ton coach.");
  } else if (redsSignals.length === 1) {
    patterns.push("⚡ Signal isolé à surveiller (" + redsSignals[0] + ") — à recontrôler en cas de fatigue persistante.");
  }

  // 3) Inflammation chronique / surentraînement
  if (crp !== null && crp > 2) {
    const overload = (cortisol !== null && cortisol > 250) || (testo !== null && sex === "H" && testo < 3);
    if (overload) {
      patterns.push("🔥 Inflammation chronique + dérégulation hormonale — suspicion de surentraînement.");
      recommendations.push("Réduire la charge d'entraînement de 30 % pendant 2 semaines, prioriser sommeil et récupération, vérifier infection latente.");
    } else {
      patterns.push("🔥 CRPus élevée — chercher la cause (infection, charge récente, sommeil).");
      recommendations.push("Vérifier infection latente, ajuster charge d'entraînement, refaire un dosage à 2 semaines.");
    }
  }

  // 4) Déficit thyroïdien
  if (isAlert("tsh") || (tsh !== null && tsh > 4)) {
    patterns.push("🦋 Fonction thyroïdienne à investiguer (TSH hors plage).");
    recommendations.push("Consulter un endocrinologue, doser T3 libre + anticorps anti-thyroïdiens.");
  }

  // 5) Carences vitaminiques
  const vitDeficits: string[] = [];
  if (isAlert("vitamine_d")) vitDeficits.push("vitamine D");
  if (isAlert("vitamine_b12") || (b12 !== null && b12 < 300)) vitDeficits.push("B12");
  if (isAlert("vitamine_b9")) vitDeficits.push("B9 (folates)");
  if (vitDeficits.length >= 2) {
    patterns.push("☀️ Carences vitaminiques multiples : " + vitDeficits.join(", "));
  }
  if (isAlert("vitamine_d") || (vitD !== null && vitD < 30)) {
    recommendations.push("Supplémentation vitamine D 2 000–4 000 UI/j (selon valeur) + exposition solaire raisonnée, recontrôle à 3 mois.");
  }
  if (isAlert("vitamine_b12") || (b12 !== null && b12 < 300)) {
    recommendations.push("Supplémentation B12 (1 000 µg/j pendant 4 semaines puis 250 µg/j d'entretien) — surtout si régime végétarien ou végan.");
  }
  if (isAlert("vitamine_b9")) {
    recommendations.push("Augmenter les apports en folates (légumes verts, légumineuses) ± supplémentation 400 µg/j.");
  }

  // 6) Zinc
  if (isAlert("zinc") || (zinc !== null && zinc < 0.7)) {
    patterns.push("🛡 Statut en zinc insuffisant — vigilance immunité, cicatrisation et testostérone.");
    recommendations.push("Apport zinc 15–30 mg/j (huîtres, viandes rouges, oléagineux) ou supplémentation 15 mg/j sur 8 semaines.");
  }

  // 7) Profil lipidique
  const lipidProblems: string[] = [];
  if (chol !== null && chol > 2.4) lipidProblems.push("cholestérol total élevé");
  if (hdl !== null && hdl < (sex === "F" ? 0.5 : 0.4)) lipidProblems.push("HDL bas");
  if (trigly !== null && trigly > 1.5) lipidProblems.push("triglycérides élevés");
  if (lipidProblems.length) {
    patterns.push("💧 Profil lipidique à surveiller : " + lipidProblems.join(", "));
    if (trigly !== null && trigly > 1.5) {
      recommendations.push("Revoir équilibre glucides simples / alcool, augmenter oméga 3 (poissons gras, lin, noix).");
    }
    if (hdl !== null && hdl < (sex === "F" ? 0.5 : 0.4)) {
      recommendations.push("Augmenter activité aérobie et apports en acides gras de qualité (avocat, huile d'olive, noix).");
    }
  }

  // ─── Synthèse + statut global ───
  let status: ConclusionStatus;
  let summary: string;
  if (filled < total / 2) {
    status = "watch";
    summary = `Bilan partiellement renseigné (${filled}/${total} marqueurs). Complète-le pour une analyse complète.`;
  } else if (alerts.length === 0 && strengths.length >= 5) {
    status = "optimal";
    summary = `Excellent bilan : ${strengths.length} marqueurs dans la zone optimale endurance, aucune alerte.`;
  } else if (alerts.length === 0) {
    status = "good";
    summary = `Bilan satisfaisant : aucune alerte, ${strengths.length} marqueur${strengths.length > 1 ? "s" : ""} dans la zone optimale.`;
  } else if (alerts.length <= 2 && patterns.length <= 1) {
    status = "watch";
    summary = `Bilan correct avec ${alerts.length} point${alerts.length > 1 ? "s" : ""} d'attention identifié${alerts.length > 1 ? "s" : ""}.`;
  } else {
    status = "alert";
    summary = `Bilan à surveiller : ${alerts.length} alertes et ${patterns.length} pattern${patterns.length > 1 ? "s" : ""} clinique${patterns.length > 1 ? "s" : ""} détecté${patterns.length > 1 ? "s" : ""}.`;
  }

  return {
    summary,
    status,
    patterns,
    alerts,
    strengths,
    recommendations: Array.from(new Set(recommendations)),
    filled,
    total,
  };
}

export const CONCLUSION_STATUS_META: Record<ConclusionStatus, { label: string; color: string; bg: string; icon: string }> = {
  optimal: { label: "Excellent", color: "var(--color-success)", bg: "rgba(95,140,10,0.12)", icon: "🟢" },
  good:    { label: "Bon",        color: "var(--color-success)", bg: "rgba(95,140,10,0.08)", icon: "🟢" },
  watch:   { label: "À surveiller", color: "#b36b00",            bg: "rgba(179,107,0,0.10)", icon: "🟠" },
  alert:   { label: "Alerte",     color: "var(--color-danger)",  bg: "rgba(207,46,46,0.12)", icon: "🔴" },
};
