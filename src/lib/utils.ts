import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function round(value: number, decimals = 1): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Table de Lusk — kcal par litre d'O2 selon le RER
const LUSK_TABLE: [number, number][] = [
  [0.707, 4.686],
  [0.75, 4.739],
  [0.80, 4.801],
  [0.85, 4.862],
  [0.90, 4.924],
  [0.95, 4.985],
  [1.00, 5.047],
];

export function lusk(rer: number): number {
  const clamped = Math.max(0.707, Math.min(1.0, rer));
  for (let i = 0; i < LUSK_TABLE.length - 1; i++) {
    const [r1, v1] = LUSK_TABLE[i];
    const [r2, v2] = LUSK_TABLE[i + 1];
    if (clamped <= r2) {
      const t = (clamped - r1) / (r2 - r1);
      return v1 + t * (v2 - v1);
    }
  }
  return 5.047;
}

// Interpolation linéaire du RER selon % VO2max
export function interpolateRER(
  pct: number,
  sv1_pct: number,
  sv2_pct: number,
  rer_sv1: number,
  rer_sv2: number
): number {
  const rer_repos = 0.78;
  const rer_max = 1.0;

  if (pct <= sv1_pct) {
    const t = pct / sv1_pct;
    return rer_repos + t * (rer_sv1 - rer_repos);
  } else if (pct <= sv2_pct) {
    const t = (pct - sv1_pct) / (sv2_pct - sv1_pct);
    return rer_sv1 + t * (rer_sv2 - rer_sv1);
  } else {
    const t = (pct - sv2_pct) / (100 - sv2_pct);
    return rer_sv2 + t * (rer_max - rer_sv2);
  }
}

// Calcul des zones physiologiques
export function calculateZones(profile: {
  weight_kg: number;
  max_hr: number;
  resting_hr: number;
  vo2max: number;
  sv1_pct_vo2: number;
  sv2_pct_vo2: number;
  rer_sv1: number;
  rer_sv2: number;
  max_power_w?: number;
}) {
  const { weight_kg, max_hr, resting_hr, vo2max, sv1_pct_vo2, sv2_pct_vo2, rer_sv1, rer_sv2, max_power_w } = profile;

  const ZONES = [
    { zone: 1, name: "Récupération active", pct_vo2: 50 },
    { zone: 2, name: "Endurance fondamentale", pct_vo2: 65 },
    { zone: 3, name: "Tempo", pct_vo2: 78 },
    { zone: 4, name: "Seuil lactique", pct_vo2: 88 },
    { zone: 5, name: "VO₂max", pct_vo2: 100 },
  ];

  return ZONES.map(({ zone, name, pct_vo2 }) => {
    const vo2_abs = (vo2max * pct_vo2) / 100;
    const fc_cible = Math.round(resting_hr + (pct_vo2 / 100) * (max_hr - resting_hr));
    const pct_fcmax = Math.round((fc_cible / max_hr) * 100);
    const rer = interpolateRER(pct_vo2, sv1_pct_vo2, sv2_pct_vo2, rer_sv1, rer_sv2);
    const vo2_L_min = (vo2_abs * weight_kg) / 1000;
    const kcal_per_min = vo2_L_min * lusk(rer);
    const kcal_per_h = kcal_per_min * 60;
    const pct_carbs = Math.max(0, Math.min(100, ((rer - 0.707) / (1.0 - 0.707)) * 100));
    const pct_lipids = 100 - pct_carbs;
    const g_carbs_per_min = (kcal_per_min * (pct_carbs / 100)) / 4;
    const g_lipids_per_min = (kcal_per_min * (pct_lipids / 100)) / 9;
    const w_per_kg = max_power_w ? (max_power_w * pct_vo2) / 100 / weight_kg : undefined;

    return {
      zone,
      name,
      pct_vo2,
      vo2: round(vo2_abs),
      pct_fcmax,
      fc_cible,
      w_per_kg: w_per_kg ? round(w_per_kg, 2) : undefined,
      rer: round(rer, 3),
      pct_carbs: Math.round(pct_carbs),
      pct_lipids: Math.round(pct_lipids),
      kcal_per_min: round(kcal_per_min),
      kcal_per_h: Math.round(kcal_per_h),
      g_carbs_per_min: round(g_carbs_per_min, 2),
      g_lipids_per_min: round(g_lipids_per_min, 2),
    };
  });
}

// Calcul IRE
export function calculateIRE(
  sport: string,
  performance: number,
  avg_hr: number,
  max_hr: number,
  weight_kg: number
): number {
  const hrRatio = avg_hr / max_hr;
  if (sport === "cyclisme") {
    return round((performance / weight_kg / hrRatio) * 0.1);
  }
  return round((performance / weight_kg / hrRatio) * 0.15);
}

// Calcul sudation
export function calculateSweat(data: {
  weight_before_kg: number;
  weight_after_kg: number;
  fluid_intake_ml: number;
  urine_ml: number;
  duration_min: number;
}) {
  const { weight_before_kg, weight_after_kg, fluid_intake_ml, urine_ml, duration_min } = data;
  const mass_loss_ml = (weight_before_kg - weight_after_kg) * 1000;
  const total_sweat_ml = mass_loss_ml + fluid_intake_ml - urine_ml;
  const sweat_rate_ml_h = Math.round(total_sweat_ml / (duration_min / 60));
  const mass_loss_pct = round(((weight_before_kg - weight_after_kg) / weight_before_kg) * 100);
  return { sweat_rate_ml_h, mass_loss_pct, total_sweat_ml };
}

// Calcul dépenses énergétiques
export function calculateRaceEnergy(data: {
  weight_kg: number;
  distance_km: number;
  duration_h: number;
  intensity_pct: number;
  vo2max: number;
  rer: number;
}) {
  const { weight_kg, duration_h, intensity_pct, vo2max, rer } = data;
  const vo2_abs = (vo2max * intensity_pct) / 100;
  const vo2_L_min = (vo2_abs * weight_kg) / 1000;
  const kcal_per_min = vo2_L_min * lusk(rer);
  const total_kcal = Math.round(kcal_per_min * duration_h * 60);
  const pct_carbs = Math.max(0, Math.min(100, ((rer - 0.707) / (1.0 - 0.707)) * 100));
  const total_carbs_g = Math.round((total_kcal * pct_carbs) / 100 / 4);
  const total_fat_g = Math.round((total_kcal * (1 - pct_carbs / 100)) / 9);
  const glycogen_stores_g = Math.round(400 + (weight_kg - 70) * 5);
  const exogenous_carbs_needed_g = Math.max(0, total_carbs_g - glycogen_stores_g);
  const carbs_per_hour_g = Math.round(exogenous_carbs_needed_g / duration_h) + 40;
  const hydration_ml_h_min = Math.round(weight_kg * 5);
  const hydration_ml_h_max = Math.round(weight_kg * 8);

  return {
    kcal_per_min: round(kcal_per_min),
    total_kcal,
    pct_carbs: Math.round(pct_carbs),
    total_carbs_g,
    total_fat_g,
    glycogen_stores_g,
    exogenous_carbs_needed_g,
    carbs_per_hour_g,
    hydration_ml_h_min,
    hydration_ml_h_max,
  };
}

export function getEnergyColor(score: number): string {
  if (score >= 7) return "text-green-500";
  if (score >= 5) return "text-amber-500";
  return "text-red-500";
}

export function getEnergyBg(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-red-500";
}

export function getSweatInterpretation(rate: number): { label: string; color: string; alert: boolean } {
  if (rate < 600) return { label: "Sudation faible", color: "text-blue-400", alert: false };
  if (rate < 1000) return { label: "Sudation modérée", color: "text-green-400", alert: false };
  if (rate < 1500) return { label: "Sudation élevée", color: "text-amber-400", alert: false };
  return { label: "Sudation très élevée", color: "text-red-400", alert: true };
}

export function getPriorityColor(priority: string): string {
  if (priority === "A") return "bg-red-500 text-white";
  if (priority === "B") return "bg-amber-500 text-white";
  return "bg-slate-500 text-white";
}

export function getStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    upcoming: { label: "À venir", color: "bg-blue-500/20 text-blue-400" },
    completed: { label: "Terminée", color: "bg-green-500/20 text-green-400" },
    dns: { label: "DNS", color: "bg-slate-500/20 text-slate-400" },
    dnf: { label: "DNF", color: "bg-red-500/20 text-red-400" },
  };
  return map[status] || map.upcoming;
}

export function getProductStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    validated: { label: "Validé ✓", color: "bg-green-500/20 text-green-400" },
    testing: { label: "En test", color: "bg-amber-500/20 text-amber-400" },
    eliminated: { label: "Éliminé ✗", color: "bg-red-500/20 text-red-400" },
    partial: { label: "Partiel", color: "bg-yellow-500/20 text-yellow-400" },
  };
  return map[status] || map.testing;
}

export const PHASE_LABELS: Record<string, string> = {
  charge_glucidique: "Charge glucidique",
  base: "Base",
  affutage: "Affûtage",
  recuperation: "Récupération",
};

export const SPORT_LABELS: Record<string, string> = {
  trail: "Trail",
  triathlon: "Triathlon",
  cyclisme: "Cyclisme",
  running: "Running",
};

export const LEVEL_LABELS: Record<string, string> = {
  loisir: "Loisir",
  amateur_confirme: "Amateur confirmé",
  semi_elite: "Semi-élite",
  elite: "Élite",
};
