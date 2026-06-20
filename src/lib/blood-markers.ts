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
  fer:           { label: "Fer & transport oxygène", icon: "🩸", color: "#cf2e2e" },
  hormones:      { label: "Hormones",                 icon: "⚗️", color: "#FF4501" },
  vitamines:     { label: "Vitamines",                icon: "☀️", color: "#b36b00" },
  lipides:       { label: "Lipides",                  icon: "💧", color: "#5f8c0a" },
  inflammation:  { label: "Inflammation",             icon: "🔥", color: "#0a0a0a" },
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

  // ─── Vitamines ───
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
