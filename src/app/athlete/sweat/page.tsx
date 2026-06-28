"use client";

import { useState, useMemo, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import { PrintReport, PrintH, PrintButton, PrintKpi, PrintBox, printColor } from "@/components/ui/PrintReport";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

type SweatTest = {
  id: string;
  date: string;
  type: string;
  duree: string;
  fc: string;
  poidsAvant: string;
  poidsApres: string;
  eau: string;
  urine: string;
  temp: string;
  humidite: string;
  vent: string;
  uv: string;
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const newId = () => Math.random().toString(36).slice(2, 9);
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const dateShort = (d: string) =>
  parseISO(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
const dateLong = (d: string) =>
  parseISO(d).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function compute(t: SweatTest): { mlmin: number | null; mlh: number | null } {
  const dur = toNum(t.duree);
  if (!dur) return { mlmin: null, mlh: null };
  const ml =
    ((toNum(t.poidsAvant) - toNum(t.poidsApres)) * 1000 +
      toNum(t.eau) -
      toNum(t.urine)) /
    dur;
  return { mlmin: ml, mlh: ml * 60 };
}

const blank = (): SweatTest => ({
  id: newId(),
  date: today(),
  type: "Sortie Longue",
  duree: "",
  fc: "",
  poidsAvant: "",
  poidsApres: "",
  eau: "",
  urine: "",
  temp: "",
  humidite: "",
  vent: "",
  uv: "",
});

// ===================== PREDICTION =====================
// Weighted-nearest-neighbor in normalized feature space (temp, fc, humidity, duration).
// Returns predicted ml/h + confidence level.
type ValidTest = { mlh: number; temp: number; fc: number; humidite: number; duree: number };

function predictSweat(
  cond: { temp: number; fc: number; humidite: number; duree: number },
  tests: ValidTest[],
): { predicted: number; confidence: "faible" | "moyenne" | "élevée"; topMatches: ValidTest[] } | null {
  if (tests.length === 0) return null;
  const norms = { temp: 8, fc: 12, humidite: 15, duree: 60 };
  const weighted = tests.map((t) => {
    const d = Math.sqrt(
      ((t.temp - cond.temp) / norms.temp) ** 2 +
        ((t.fc - cond.fc) / norms.fc) ** 2 +
        ((t.humidite - cond.humidite) / norms.humidite) ** 2 +
        ((t.duree - cond.duree) / norms.duree) ** 2,
    );
    return { test: t, weight: Math.exp(-d * 0.7), dist: d };
  });
  const sumW = weighted.reduce((s, w) => s + w.weight, 0);
  if (sumW === 0) return { predicted: tests.reduce((s, t) => s + t.mlh, 0) / tests.length, confidence: "faible", topMatches: [] };
  const predicted = weighted.reduce((s, w) => s + w.test.mlh * w.weight, 0) / sumW;
  const maxW = Math.max(...weighted.map((w) => w.weight));
  let confidence: "faible" | "moyenne" | "élevée" = "faible";
  if (tests.length >= 5 && maxW > 0.55) confidence = "élevée";
  else if (tests.length >= 3 && maxW > 0.3) confidence = "moyenne";
  const topMatches = weighted.sort((a, b) => b.weight - a.weight).slice(0, 3).map((w) => w.test);
  return { predicted, confidence, topMatches };
}

// ===================== HYBRID 3-LAYER ULTRA MODEL =====================
// Source: PDF "Modèle hydrique et physiologique pour la Restonica Trail"
// Three coupled layers:
//   1. Water balance: D_{t+Δt} = D_t + (S_t + R_ns - I_t)·Δt
//   2. Intensity / auto-regulation: u_t = max(u_min, q · exp(-k · max(0, δ-δ₀)))
//      where q = chosen starting intensity (pacing strategy)
//            u_min = locomotion floor (athlete can't slow down infinitely)
//   3. Weather: S_t = S_ref · g_meteo · u_t^β
//      g_meteo ∈ {0.85, 1.00, 1.15} for cold / moderate / hot scenario
// Equilibrium deficit (analytical): δ_eq = δ₀ + (1/(k·β))·ln(S_ref·q^β/(I-R_ns))
type NlParams = {
  thresholdPct: number;  // δ₀
  k: number;             // sensitivity
  beta: number;          // coupling sweat↔intensity
  q: number;             // chosen starting intensity (0–1)
  uMin: number;          // locomotion floor (intensity can't drop below)
  meteoFactor: number;   // g_meteo (0.85 cold / 1.00 mod / 1.15 hot)
};

function intensityFactor(deficitPct: number, p: NlParams): number {
  const raw = p.q * Math.exp(-p.k * Math.max(0, deficitPct - p.thresholdPct));
  return Math.max(p.uMin, Math.min(1, raw));
}
function regulatedSweat(predictedMlH: number, deficitPct: number, p: NlParams): number {
  const u = intensityFactor(deficitPct, p);
  return predictedMlH * p.meteoFactor * Math.pow(u, p.beta);
}

// Analytical equilibrium: deficit at which sweat losses equal intake
// δ_eq = δ₀ + (1/(k·β)) · ln(S_ref · g · q^β / (I - R_ns))
// Returns null if the equation has no positive solution (intake already covers)
function equilibriumDeficitPct(opts: {
  sRefMlH: number; intakeMlH: number; otherLossMlH: number; p: NlParams;
}): number | null {
  const { sRefMlH, intakeMlH, otherLossMlH, p } = opts;
  const denom = intakeMlH - otherLossMlH;
  if (denom <= 0) return null;
  const numer = sRefMlH * p.meteoFactor * Math.pow(p.q, p.beta);
  if (numer <= denom) return null;
  return p.thresholdPct + (1 / (p.k * p.beta)) * Math.log(numer / denom);
}

// Pacing strategies (values straight from the PDF table p.4)
type PacingStrategy = {
  key: "conservative" | "moderate" | "aggressive" | "custom";
  label: string;
  description: string;
  q: number;
  thresholdPct: number;
  k: number;
  beta: number;
};
const PACING_STRATEGIES: PacingStrategy[] = [
  { key: "conservative", label: "🛡 Conservatrice", description: "Vise ~2,5 %, partir très sage", q: 0.64, thresholdPct: 2.0, k: 0.80, beta: 0.85 },
  { key: "moderate", label: "⚡ Performance modérée", description: "Meilleure perf en acceptant 3,5–4 %", q: 0.80, thresholdPct: 3.0, k: 0.60, beta: 0.85 },
  { key: "aggressive", label: "🔥 Agressive", description: "Pari à fort risque (>5 %)", q: 0.95, thresholdPct: 4.0, k: 0.40, beta: 0.85 },
];

// Weather scenarios — multiplies sweat by a factor (PDF p.4)
type WeatherScenario = { key: "cold" | "moderate" | "hot"; label: string; factor: number };
const WEATHER_SCENARIOS: WeatherScenario[] = [
  { key: "cold",     label: "🥶 Froid",   factor: 0.85 },
  { key: "moderate", label: "🌤 Modéré",  factor: 1.00 },
  { key: "hot",      label: "🔥 Chaud",   factor: 1.15 },
];

// Respiratory losses grow with altitude (dry air at altitude).
// Rough rule: +20 % per 1000 m above sea level.
function respLossesAtAltitude(baseMlH: number, altitudeM: number): number {
  return baseMlH * (1 + Math.max(0, altitudeM) / 1000 * 0.2);
}

// Scenario presets straight from the PDF table (page 3).
type ScenarioPreset = {
  key: string;
  label: string;
  description: string;
  sweatRangeLh: [number, number];
  defaults: { temp: string; humidite: string; fc: string };
};
const SCENARIO_PRESETS: ScenarioPreset[] = [
  { key: "cool", label: "🏔 Montagne fraîche", description: "12-18°C · 0,7-1,1 L/h", sweatRangeLh: [0.7, 1.1], defaults: { temp: "15", humidite: "55", fc: "145" } },
  { key: "temperate", label: "🌤 Trail tempéré", description: "18-24°C · 1,0-1,5 L/h", sweatRangeLh: [1.0, 1.5], defaults: { temp: "21", humidite: "60", fc: "150" } },
  { key: "hot", label: "☀️ Trail chaud", description: "25-30°C · 1,4-2,0 L/h", sweatRangeLh: [1.4, 2.0], defaults: { temp: "27", humidite: "55", fc: "150" } },
  { key: "veryhot", label: "🔥 Trail très chaud", description: ">30°C · 1,8-2,5 L/h+", sweatRangeLh: [1.8, 2.5], defaults: { temp: "32", humidite: "50", fc: "150" } },
];

// =====================================================================
// FEASIBILITY ANALYSIS
// Computes whether the planned hydration is achievable given tolerance.
// =====================================================================
type FeasibilityStatus = "feasible" | "tight" | "infeasible";
function feasibilityAnalysis(opts: {
  totalSweatMl: number;
  durationH: number;
  weightKg: number;
  toleranceMlH: number;
  thresholdPct: number;
  extraReserveL: number;
  otherLossesMlH: number; // urinary + respiratory combined, in ml/h
}): {
  status: FeasibilityStatus;
  budgetL: number;             // max acceptable deficit in L (incl. reserve)
  totalLossesL: number;        // sweat + other losses
  requiredIntakeMlH: number;   // intake needed per hour to stay under threshold
  intakeGapMlH: number;        // shortfall vs tolerance (positive if tolerance < required)
  maxSweatForFeasibilityLh: number; // sweat avg that would make the plan feasible at tolerance
  averageSweatLh: number;
} {
  const { totalSweatMl, durationH, weightKg, toleranceMlH, thresholdPct, extraReserveL, otherLossesMlH } = opts;
  const budgetL = weightKg * (thresholdPct / 100) + extraReserveL;
  const otherLossesL = (otherLossesMlH * durationH) / 1000;
  const totalLossesL = totalSweatMl / 1000 + otherLossesL;
  const requiredIntakeL = Math.max(0, totalLossesL - budgetL);
  const requiredIntakeMlH = durationH > 0 ? (requiredIntakeL * 1000) / durationH : 0;
  const intakeGapMlH = requiredIntakeMlH - toleranceMlH;
  // Inverse calc: what max sweat would make the plan exactly feasible?
  // toleranceMlH = (sweatMaxLh * 1000 + otherLossesMlH - budgetL*1000/durationH)
  // sweatMaxLh = (toleranceMlH + budgetL*1000/durationH - otherLossesMlH) / 1000
  const maxSweatForFeasibilityLh = (toleranceMlH + (budgetL * 1000) / Math.max(0.01, durationH) - otherLossesMlH) / 1000;
  const averageSweatLh = durationH > 0 ? totalSweatMl / 1000 / durationH : 0;

  let status: FeasibilityStatus = "feasible";
  if (intakeGapMlH > toleranceMlH * 0.20) status = "infeasible";
  else if (intakeGapMlH > 0) status = "tight";

  return { status, budgetL, totalLossesL, requiredIntakeMlH, intakeGapMlH, maxSweatForFeasibilityLh, averageSweatLh };
}

// ===================== HYDRATION RECOMMENDATIONS =====================
// Compute hydration advice for a given sweat rate, duration, weight, and
// personal tolerance. Caps recommended intake at the athlete's tolerance,
// and reports the resulting dehydration % when tolerance < ideal intake.
function hydrationRecs(input: {
  sweatMlH: number;
  durationMin: number;
  weightKg: number;
  toleranceMlH: number;
}) {
  const { sweatMlH, durationMin, weightKg, toleranceMlH } = input;
  const dureeH = durationMin / 60;
  const totalSweatMl = sweatMlH * dureeH;
  const maxLossMl = weightKg * 25; // 2.5% body weight in ml
  // Ideal intake to stay under 2.5% dehydration
  const idealIngestTotalMl = Math.max(0, totalSweatMl - maxLossMl);
  const idealIngestPerH = dureeH > 0 ? idealIngestTotalMl / dureeH : 0;
  // Apply personal tolerance cap
  const actualIngestPerH = Math.min(idealIngestPerH, toleranceMlH);
  const actualIngestTotalMl = actualIngestPerH * dureeH;
  // Resulting dehydration % if athlete sticks to tolerance
  const actualLossMl = totalSweatMl - actualIngestTotalMl;
  const actualLossPct = weightKg > 0 ? (actualLossMl / (weightKg * 1000)) * 100 : 0;
  // Loss % if athlete drinks NOTHING
  const lossPctIfZero = weightKg > 0 ? (totalSweatMl / (weightKg * 1000)) * 100 : 0;
  return {
    totalSweatMl,
    maxLossMl,
    idealIngestTotalMl,
    idealIngestPerH,
    actualIngestTotalMl,
    actualIngestPerH,
    actualLossMl,
    actualLossPct,
    lossPctIfZero,
    exceedsTolerance: idealIngestPerH > toleranceMlH,
    canStayUnder25IfZero: lossPctIfZero <= 2.5,
  };
}

// ===================== PAGE =====================
export default function SweatPage() {
  const [tests, setTests, loaded] = useAthleteData<SweatTest[]>("sweat", []);
  const [profile] = useAthleteData<{ poids?: number | string }>("profile", {});
  const [tab, setTab] = useState<"journal" | "analyse" | "anticipation">("journal");
  // Draft is persisted: a half-filled form survives page reload / navigation.
  // The user resets it explicitly via the "Réinitialiser" button.
  const [draft, setDraft] = useAthleteData<SweatTest>("sweat_draft", blank());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pred, setPred] = useAthleteData("sweat_pred", {
    temp: "20",
    fc: "150",
    humidite: "60",
    duree: "60",
    poids: profile.poids ? String(profile.poids) : "70",
    tolerance: "750",
  });

  // Multi-segment mode for ultras / long races where conditions vary widely.
  type PredSegment = { id: string; label: string; duree: string; temp: string; fc: string; humidite: string };
  const [predMode, setPredMode] = useAthleteData<"simple" | "segments">("sweat_pred_mode", "simple");
  const defaultSegments: PredSegment[] = [
    { id: "seg1", label: "Étape 1 — Départ", duree: "180", temp: "18", fc: "150", humidite: "70" },
    { id: "seg2", label: "Étape 2 — Cœur de course", duree: "240", temp: "26", fc: "145", humidite: "60" },
    { id: "seg3", label: "Étape 3 — Fin", duree: "180", temp: "16", fc: "140", humidite: "75" },
  ];
  const [segments, setSegments] = useAthleteData<PredSegment[]>("sweat_pred_segments", defaultSegments);
  // Pre-race water reserves: hyperhydration protocol (+500 ml) and carb-load (+750 ml of bound water)
  const [reserve, setReserve] = useAthleteData<{ hyperhydration: boolean; carbLoad: boolean }>(
    "sweat_pred_reserve",
    { hyperhydration: false, carbLoad: false },
  );
  // Additional non-sweat losses (urinary + respiratory) + altitude modulation
  const [losses, setLosses] = useAthleteData<{ urinaryMlH: string; respiratoryMlH: string; altitudeM: string }>(
    "sweat_pred_losses",
    { urinaryMlH: "30", respiratoryMlH: "60", altitudeM: "0" },
  );
  // Non-linear model parameters (Ultra mode 3-layer hybrid model from Restonica PDF)
  const [nlParams, setNlParams] = useAthleteData<{
    enabled: boolean;
    thresholdPct: string;
    k: string;
    beta: string;
    q: string;        // starting intensity (0-1)
    uMin: string;     // locomotion floor (0-1)
    strategyKey: "conservative" | "moderate" | "aggressive" | "custom";
    weatherKey: "cold" | "moderate" | "hot";
  }>(
    "sweat_pred_nl",
    { enabled: true, thresholdPct: "3.0", k: "0.6", beta: "0.85", q: "0.8", uMin: "0.5", strategyKey: "moderate", weatherKey: "moderate" },
  );
  const applyStrategy = (s: PacingStrategy) => setNlParams({
    ...nlParams,
    strategyKey: s.key,
    q: String(s.q),
    thresholdPct: String(s.thresholdPct),
    k: String(s.k),
    beta: String(s.beta),
  });
  // Apply a scenario preset to all segments
  const applyScenarioPreset = (preset: ScenarioPreset) => {
    setSegments((s) => s.map((seg) => ({
      ...seg,
      temp: preset.defaults.temp,
      humidite: preset.defaults.humidite,
      fc: preset.defaults.fc,
    })));
  };
  const addSegment = () => setSegments((s) => [
    ...s,
    { id: newId(), label: `Étape ${s.length + 1}`, duree: "120", temp: "20", fc: "145", humidite: "65" },
  ]);
  const removeSegment = (id: string) => setSegments((s) => s.filter((seg) => seg.id !== id));
  const updateSegment = (id: string, key: keyof PredSegment, value: string) =>
    setSegments((s) => s.map((seg) => (seg.id === id ? { ...seg, [key]: value } : seg)));

  // Sync prediction weight when profile loads / changes
  useEffect(() => {
    if (profile.poids != null && profile.poids !== "") {
      setPred((p) => ({ ...p, poids: String(profile.poids) }));
    }
  }, [profile.poids]);

  // When editing an existing test we use a local-only state so the
  // persisted new-test draft is never overwritten.
  const [editDraft, setEditDraft] = useState<SweatTest | null>(null);
  const activeDraft = editDraft ?? draft;
  const setActiveDraft: typeof setDraft = (updater) => {
    if (editDraft) {
      setEditDraft((d) => {
        const next = typeof updater === "function" ? (updater as (p: SweatTest) => SweatTest)(d as SweatTest) : updater;
        return next as SweatTest;
      });
    } else {
      setDraft(updater);
    }
  };
  const update = (k: keyof SweatTest, v: string) =>
    setActiveDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    if (!activeDraft.duree) return;
    setTests((prev) => {
      if (editingId && editDraft) {
        return prev.map((t) => (t.id === editingId ? { ...editDraft, id: editingId } : t))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      return [...prev, { ...draft, id: newId() }].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    // After a successful save the new-test draft is reset; the edit-draft
    // is dropped. Form closes.
    if (!editingId) setDraft(blank());
    setEditDraft(null);
    setEditingId(null);
    setOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce test ?")) return;
    setTests((prev) => prev.filter((t) => t.id !== id));
    if (viewingId === id) setViewingId(null);
  };

  const startEdit = (t: SweatTest) => {
    setEditDraft({ ...t });
    setEditingId(t.id);
    setOpen(true);
    setViewingId(null);
  };

  const startNew = () => {
    // Keep the existing persisted draft so a half-filled form is preserved.
    setEditDraft(null);
    setEditingId(null);
    setOpen(true);
  };

  const closeForm = () => {
    // No data loss: persisted draft stays, edit-draft is dropped.
    setOpen(false);
    setEditingId(null);
    setEditDraft(null);
  };

  const resetDraft = () => {
    if (editDraft) {
      // Reload original test from store
      const original = editingId ? tests.find((t) => t.id === editingId) : null;
      setEditDraft(original ? { ...original } : blank());
    } else {
      if (!confirm("Effacer toutes les données du formulaire en cours ?")) return;
      setDraft(blank());
    }
  };

  const withCalcs = tests.map((t) => ({ ...t, ...compute(t) }));
  const valid = withCalcs.filter((t) => t.mlh != null);
  const avg = valid.length ? valid.reduce((s, v) => s + (v.mlh as number), 0) / valid.length : null;
  const max = valid.length ? Math.max(...valid.map((v) => v.mlh as number)) : null;

  const viewing = tests.find((t) => t.id === viewingId);

  useEffect(() => {
    if (!viewingId) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setViewingId(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [viewingId]);

  // Prediction
  const validForPred = useMemo(() => {
    return valid
      .map((t) => ({
        mlh: t.mlh as number,
        temp: toNum(t.temp),
        fc: toNum(t.fc),
        humidite: toNum(t.humidite),
        duree: toNum(t.duree),
        date: t.date,
      }))
      .filter((t) => t.temp > 0 && t.fc > 0 && t.duree > 0);
  }, [valid]);

  const prediction = useMemo(() => {
    return predictSweat(
      { temp: toNum(pred.temp), fc: toNum(pred.fc), humidite: toNum(pred.humidite), duree: toNum(pred.duree) },
      validForPred,
    );
  }, [pred, validForPred]);

  // ============ Chart data ============
  const chartTemp = valid.filter((t) => toNum(t.temp) > 0).map((t) => ({ x: toNum(t.temp), y: Math.round(t.mlh as number) }));
  const chartDuree = valid.map((t) => ({ x: toNum(t.duree), y: Math.round(t.mlh as number) }));
  const chartFc = valid.filter((t) => toNum(t.fc) > 0).map((t) => ({ x: toNum(t.fc), y: Math.round(t.mlh as number) }));
  const chartHum = valid.filter((t) => toNum(t.humidite) > 0).map((t) => ({ x: toNum(t.humidite), y: Math.round(t.mlh as number) }));
  const byMonth = useMemo(() => {
    const sums: Record<number, { sum: number; n: number }> = {};
    valid.forEach((t) => {
      const m = parseISO(t.date).getMonth();
      if (!sums[m]) sums[m] = { sum: 0, n: 0 };
      sums[m].sum += t.mlh as number;
      sums[m].n += 1;
    });
    return MONTHS.map((label, i) => ({
      mois: label,
      avg: sums[i] ? Math.round(sums[i].sum / sums[i].n) : null,
      n: sums[i]?.n || 0,
    })).filter((d) => d.avg != null);
  }, [valid]);

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Comprendre où tu en es" title="Taux de sudation" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Taux de sudation"
        action={
          tab === "journal" && (
            <button onClick={open ? closeForm : startNew} className="btn-primary">
              {open ? "Fermer" : "+ Test"}
            </button>
          )
        }
        desc="Taux de sudation (ml/min) = ((poids avant − poids après)×1000 + eau ingérée − urine) / durée. ml/h = ml/min × 60."
      />

      <HelpSection title="ℹ️ Test de sudation — pourquoi, comment, à quoi ça sert ?">
        <HelpBlock icon="🎯" title="Pourquoi">
          <p>
            Tu transpires entre <b>0,3 et 2 L/h</b> selon ton physiologie, la température,
            l&apos;intensité, le vêtement, l&apos;acclimatation… Ne pas connaître ton taux,
            c&apos;est risquer la <b>déshydratation</b> (perte &gt; 2,5% poids = chute de
            performance) ou l&apos;<b>hyponatrémie</b> (boire trop sans sodium). Le test
            individualise ta stratégie hydrique.
          </p>
        </HelpBlock>
        <HelpBlock icon="📝" title="Comment faire le test">
          <ul className="list-disc pl-5 space-y-1">
            <li>Choisis une séance représentative (durée 1h+ idéalement, intensité proche course)</li>
            <li><b>Pèse-toi nu</b> juste avant (vidé vessie / intestin)</li>
            <li>Note l&apos;<b>eau ingérée</b> pendant l&apos;effort (peser bidons avant/après)</li>
            <li>Si tu urines pendant, estime le volume (à soustraire)</li>
            <li><b>Pèse-toi à nouveau nu</b> juste après (essuie la sueur)</li>
            <li>Saisis tout dans <b>+ Test</b> : la plateforme calcule le ml/min et ml/h</li>
            <li>Refais le test par <b>condition</b> (chaud / froid / humide / altitude…)</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="🔬" title="Comment c'est utilisé ensuite">
          <ul className="list-disc pl-5 space-y-1">
            <li>Définit ton <b>besoin hydrique en course</b> (objectif : compenser ~60-80% du taux)</li>
            <li>Calcule l&apos;<b>apport sodium</b> requis : 500-1300 mg / L d&apos;eau ingérée (anti-hyponatrémie)</li>
            <li>Alimente la stratégie de course (volume de boisson par ravito)</li>
            <li>Identifie les conditions où tu dois <b>boire plus</b> (canicule, altitude)</li>
          </ul>
        </HelpBlock>
      </HelpSection>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Kpi label="Taux de sudation moyen" value={avg != null ? Math.round(avg) : "—"} unit="ml/h" color="var(--color-primary)" />
        <Kpi label="Taux maximal observé" value={max != null ? Math.round(max) : "—"} unit="ml/h" color="var(--color-danger)" />
        <Kpi label="Séances mesurées" value={valid.length} color="var(--color-dark)" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("journal")} className={tab === "journal" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          📋 Journal & tests ({valid.length})
        </button>
        <button onClick={() => setTab("analyse")} className={tab === "analyse" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          📊 Analyse
        </button>
        <button onClick={() => setTab("anticipation")} className={tab === "anticipation" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          🔮 Anticipation
        </button>
      </div>

      {/* ============ TAB: JOURNAL ============ */}
      {tab === "journal" && (
        <>
          {open && (
            <div className="card p-4 mb-4" style={{ border: `2px solid var(--color-primary)` }}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                <div className="font-extrabold">{editingId ? "✎ Modifier le test" : "+ Nouveau test"}</div>
                {!editingId && (
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    💾 Saisie sauvegardée automatiquement — fermer la fenêtre ne perd rien.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                <Field label="Date"><input type="date" className="input" value={activeDraft.date} onChange={(e) => update("date", e.target.value)} /></Field>
                <Field label="Type d'exercice"><input className="input" value={activeDraft.type} onChange={(e) => update("type", e.target.value)} /></Field>
                <Field label="Durée (min)"><input className="input" value={activeDraft.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
                <Field label="FC moyenne (bpm)"><input className="input" value={activeDraft.fc} onChange={(e) => update("fc", e.target.value)} /></Field>
                <Field label="Poids avant (kg)"><input className="input" value={activeDraft.poidsAvant} onChange={(e) => update("poidsAvant", e.target.value)} /></Field>
                <Field label="Poids après (kg)"><input className="input" value={activeDraft.poidsApres} onChange={(e) => update("poidsApres", e.target.value)} /></Field>
                <Field label="Eau ingérée (ml)"><input className="input" value={activeDraft.eau} onChange={(e) => update("eau", e.target.value)} /></Field>
                <Field label="Urine (ml)"><input className="input" value={activeDraft.urine} onChange={(e) => update("urine", e.target.value)} /></Field>
                <Field label="Température (°C)"><input className="input" value={activeDraft.temp} onChange={(e) => update("temp", e.target.value)} /></Field>
                <Field label="Humidité (%)"><input className="input" value={activeDraft.humidite} onChange={(e) => update("humidite", e.target.value)} /></Field>
                <Field label="Vent (km/h)"><input className="input" value={activeDraft.vent} onChange={(e) => update("vent", e.target.value)} /></Field>
                <Field label="Indice UV"><input className="input" value={activeDraft.uv} onChange={(e) => update("uv", e.target.value)} /></Field>
              </div>
              <div className="flex justify-between gap-2 mt-3 flex-wrap">
                <button
                  onClick={resetDraft}
                  className="btn-ghost btn-sm"
                  style={{ color: "var(--color-danger)" }}
                  title={editingId ? "Recharger les valeurs d'origine du test" : "Vider toutes les valeurs du brouillon"}
                >
                  ↺ Réinitialiser
                </button>
                <div className="flex gap-2">
                  <button onClick={closeForm} className="btn-ghost">{editingId ? "Annuler" : "Fermer (saisie conservée)"}</button>
                  <button onClick={save} className="btn-primary">{editingId ? "Enregistrer les modifications" : "Ajouter"}</button>
                </div>
              </div>
            </div>
          )}

          {withCalcs.length > 0 ? (
            <div className="card overflow-auto">
              <table className="table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Type</th><th>Durée</th><th>FC</th><th>ml/min</th><th>ml/h</th><th>Temp</th><th>Hum.</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {withCalcs.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setViewingId(t.id)}
                      style={{ cursor: "pointer" }}
                      className="hover:bg-[var(--color-surface-2)] transition"
                      title="Cliquer pour voir le détail"
                    >
                      <td style={{ fontWeight: 700 }}>{dateShort(t.date)}</td>
                      <td>{t.type}</td>
                      <td>{t.duree}</td>
                      <td>{t.fc || "—"}</td>
                      <td style={{ color: "var(--color-primary)", fontWeight: 700 }}>{t.mlmin != null ? t.mlmin.toFixed(1) : "—"}</td>
                      <td style={{ color: "var(--color-primary)", fontWeight: 800 }}>{t.mlh != null ? Math.round(t.mlh) : "—"}</td>
                      <td>{t.temp || "—"}</td>
                      <td>{t.humidite || "—"}</td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                          style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Aucune séance. Pèse-toi avant/après pour calculer ton taux de sudation.</Empty>
          )}
        </>
      )}

      {/* ============ TAB: ANALYSE ============ */}
      {tab === "analyse" && (
        valid.length === 0 ? (
          <Empty>Ajoute au moins 1 test pour générer les graphiques d&apos;analyse.</Empty>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ScatterCard
              title="Sudation vs Température"
              xLabel="Température (°C)"
              data={chartTemp}
              color="var(--color-danger)"
            />
            <ScatterCard
              title="Sudation vs Durée"
              xLabel="Durée (min)"
              data={chartDuree}
              color="var(--color-primary)"
            />
            <ScatterCard
              title="Sudation vs FC moyenne"
              xLabel="FC (bpm)"
              data={chartFc}
              color="var(--color-dark)"
            />
            <ScatterCard
              title="Sudation vs Humidité"
              xLabel="Humidité (%)"
              data={chartHum}
              color="#2196f3"
            />
            <div className="card p-4 lg:col-span-2">
              <div className="font-extrabold mb-3 text-sm">Sudation moyenne par mois</div>
              {byMonth.length === 0 ? (
                <Empty>Pas assez de données mensuelles.</Empty>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                    <Tooltip
                      formatter={(v: number, _name, props) => [
                        `${v} ml/h (${props.payload.n} test${props.payload.n > 1 ? "s" : ""})`,
                        "Moyenne",
                      ]}
                    />
                    <Bar dataKey="avg" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )
      )}

      {/* ============ TAB: ANTICIPATION ============ */}
      {tab === "anticipation" && (
        <>
        {/* Mode toggle: simple vs multi-segments */}
        <div className="card p-3 mb-3 flex items-center gap-2 flex-wrap">
          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".08em" }}>
            Mode anticipation
          </div>
          <button
            onClick={() => setPredMode("simple")}
            className={predMode === "simple" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            Conditions constantes
          </button>
          <button
            onClick={() => setPredMode("segments")}
            className={predMode === "segments" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            title="Pour ultras/ironman où les conditions varient sur la durée"
          >
            🏔 Multi-segments (ultra)
          </button>
          <div className="ml-auto">
            <PrintButton label="📄 Exporter en PDF" />
          </div>
          {predMode === "segments" && (
            <span className="text-xs text-[var(--color-text-muted)]">
              · {segments.length} segment{segments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {predMode === "simple" && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
          <div className="card p-4">
            <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              🔮 Conditions estimées
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              Renseigne les conditions de ta prochaine course/séance. La prédiction se base sur tous tes tests passés.
            </div>
            <div className="flex flex-col gap-2.5">
              <Field label="Température estimée (°C)">
                <input className="input" value={pred.temp} onChange={(e) => setPred({ ...pred, temp: e.target.value })} />
              </Field>
              <Field label="FC moyenne estimée (bpm)">
                <input className="input" value={pred.fc} onChange={(e) => setPred({ ...pred, fc: e.target.value })} />
              </Field>
              <Field label="Humidité estimée (%)">
                <input className="input" value={pred.humidite} onChange={(e) => setPred({ ...pred, humidite: e.target.value })} />
              </Field>
              <Field label="Durée estimée (min)">
                <input className="input" value={pred.duree} onChange={(e) => setPred({ ...pred, duree: e.target.value })} />
              </Field>
              <Field label="Poids athlète (kg)">
                <input className="input" value={pred.poids} onChange={(e) => setPred({ ...pred, poids: e.target.value })} />
              </Field>
              <Field label="Tolérance hydrique perso (ml/h)">
                <input
                  className="input"
                  value={pred.tolerance}
                  onChange={(e) => setPred({ ...pred, tolerance: e.target.value })}
                  placeholder="750"
                />
              </Field>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                Tolérance digestive : ce que tu peux ingérer/heure sans inconfort. Tolérance moyenne : 500-800 ml/h. À travailler à l&apos;entraînement.
              </div>
            </div>
          </div>

          <div>
            {validForPred.length === 0 ? (
              <Empty>
                Ajoute au moins 1 test complet (avec température, FC, durée renseignées) pour générer une estimation.
              </Empty>
            ) : prediction ? (
              <>
                <div className="card p-5 mb-4" style={{ borderLeft: "5px solid var(--color-primary)", background: "rgba(255,69,1,0.04)" }}>
                  <div className="text-[10px] uppercase font-bold text-[var(--color-primary)] mb-1" style={{ letterSpacing: ".08em" }}>
                    Sudation estimée
                  </div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className="font-extrabold text-5xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                      {Math.round(prediction.predicted)}
                    </div>
                    <div className="text-sm text-[var(--color-text-muted)]">ml / h</div>
                  </div>
                  <div className="mt-2 text-sm">
                    Soit environ <b>{Math.round((prediction.predicted * toNum(pred.duree)) / 60)} ml</b> sur {pred.duree} min d&apos;effort.
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                      Confiance
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background:
                          prediction.confidence === "élevée" ? "rgba(95,140,10,0.15)" :
                          prediction.confidence === "moyenne" ? "rgba(255,69,1,0.15)" :
                          "rgba(207,46,46,0.12)",
                        color:
                          prediction.confidence === "élevée" ? "var(--color-success)" :
                          prediction.confidence === "moyenne" ? "var(--color-primary)" :
                          "var(--color-danger)",
                      }}
                    >
                      {prediction.confidence}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      ({validForPred.length} test{validForPred.length > 1 ? "s" : ""} de référence)
                    </span>
                  </div>
                </div>

                {(() => {
                  const recs = hydrationRecs({
                    sweatMlH: prediction.predicted,
                    durationMin: toNum(pred.duree),
                    weightKg: toNum(pred.poids),
                    toleranceMlH: toNum(pred.tolerance) || 750,
                  });
                  const {
                    totalSweatMl, maxLossMl,
                    idealIngestTotalMl: toIngestTotalMl,
                    idealIngestPerH: toIngestPerH,
                    actualIngestPerH, actualIngestTotalMl, actualLossPct,
                    lossPctIfZero, exceedsTolerance, canStayUnder25IfZero,
                  } = recs;
                  const poidsKg = toNum(pred.poids);
                  const willCompensate = toIngestPerH < prediction.predicted;
                  return (
                    <div className="card p-4">
                      <div className="font-extrabold mb-1 text-sm">💧 Recommandations hydratation</div>
                      <div className="text-xs text-[var(--color-text-muted)] mb-3">
                        Objectif : <b>ne pas dépasser 2,5 % de déshydratation</b> par rapport à ton poids corporel
                        ({poidsKg > 0 ? `soit max ${Math.round(maxLossMl)} ml pour ${poidsKg} kg` : "renseigne ton poids"}).
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div
                          className="rounded-lg p-3"
                          style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-primary)" }}
                        >
                          <div
                            className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]"
                            style={{ letterSpacing: ".06em" }}
                          >
                            À ingérer / heure
                          </div>
                          <div className="font-extrabold text-2xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                            {Math.round(toIngestPerH)} ml/h
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            Pour rester sous la limite des 2,5 %
                          </div>
                        </div>
                        <div
                          className="rounded-lg p-3"
                          style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-dark)" }}
                        >
                          <div
                            className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]"
                            style={{ letterSpacing: ".06em" }}
                          >
                            Volume total sur la course
                          </div>
                          <div className="font-extrabold text-2xl" style={{ color: "var(--color-dark)", fontFamily: "var(--font-display)" }}>
                            {Math.round(toIngestTotalMl)} ml
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            Sur {pred.duree} min · pertes totales estimées : {Math.round(totalSweatMl)} ml
                          </div>
                        </div>
                      </div>

                      {/* Sodium recommendations */}
                      {(() => {
                        const totalLiters = toIngestTotalMl / 1000;
                        const litersPerH = toIngestPerH / 1000;
                        const naMinTotal = Math.round(totalLiters * 500);
                        const naMaxTotal = Math.round(totalLiters * 1300);
                        const naMinPerH = Math.round(litersPerH * 500);
                        const naMaxPerH = Math.round(litersPerH * 1300);
                        return (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div
                              className="rounded-lg p-3"
                              style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #2196f3" }}
                            >
                              <div
                                className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]"
                                style={{ letterSpacing: ".06em" }}
                              >
                                🧂 Sodium / heure
                              </div>
                              <div className="font-extrabold text-2xl" style={{ color: "#2196f3", fontFamily: "var(--font-display)" }}>
                                {naMinPerH}–{naMaxPerH} mg/h
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                500 à 1300 mg / L ingéré
                              </div>
                            </div>
                            <div
                              className="rounded-lg p-3"
                              style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #2196f3" }}
                            >
                              <div
                                className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]"
                                style={{ letterSpacing: ".06em" }}
                              >
                                🧂 Sodium total sur la course
                              </div>
                              <div className="font-extrabold text-2xl" style={{ color: "#2196f3", fontFamily: "var(--font-display)" }}>
                                {naMinTotal}–{naMaxTotal} mg
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                Pour {totalLiters.toFixed(2)} L sur {pred.duree} min
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Visual breakdown */}
                      <div className="mt-4">
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1" style={{ letterSpacing: ".06em" }}>
                          Répartition des pertes
                        </div>
                        {poidsKg > 0 && totalSweatMl > 0 && (
                          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--color-surface-2)" }}>
                            <div
                              style={{
                                width: `${(Math.min(toIngestTotalMl, totalSweatMl) / totalSweatMl) * 100}%`,
                                background: "var(--color-primary)",
                              }}
                              title={`À ingérer : ${Math.round(toIngestTotalMl)} ml`}
                            />
                            <div
                              style={{
                                width: `${(Math.max(0, Math.min(maxLossMl, totalSweatMl - toIngestTotalMl)) / totalSweatMl) * 100}%`,
                                background: "var(--color-success)",
                              }}
                              title={`Déshydratation tolérée (≤ 2,5%) : ${Math.round(Math.min(maxLossMl, totalSweatMl))} ml`}
                            />
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5">
                          <span>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-primary)", borderRadius: 2, marginRight: 4 }} />
                            À ingérer pendant la course
                          </span>
                          <span>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-success)", borderRadius: 2, marginRight: 4 }} />
                            Déshydratation tolérée (≤ 2,5 %)
                          </span>
                        </div>
                      </div>

                      {/* Sodium / hyponatremia explainer */}
                      <div
                        className="mt-3 p-3 rounded-lg text-xs"
                        style={{ background: "rgba(33,150,243,0.08)", color: "var(--color-text)", borderLeft: "3px solid #2196f3" }}
                      >
                        <b style={{ color: "#2196f3" }}>⚠ Risque d&apos;hyponatrémie</b> — si tu bois sans apporter de sodium,
                        ton sang se dilue et le taux de sodium plasmatique chute. Symptômes : nausées, maux de tête, confusion,
                        perte d&apos;équilibre, voire coma dans les cas sévères.
                        <br />
                        <b>Règle d&apos;or :</b> apporter <b>500 à 1300 mg de sodium par litre d&apos;eau ingéré</b>. Le bas de la fourchette
                        suffit pour les efforts courts/tempérés ; vise le haut quand il fait chaud, que tu transpires beaucoup ou
                        que la course dure plus de 4 h.
                      </div>

                      {/* Warnings */}
                      <div className="mt-4 space-y-2 text-xs">
                        {canStayUnder25IfZero && (
                          <div
                            className="p-2.5 rounded"
                            style={{ background: "rgba(95,140,10,0.10)", color: "var(--color-success)" }}
                          >
                            ✓ Avec une durée de {pred.duree} min, tu peux rester sous 2,5 % de déshydratation <b>sans rien boire</b>
                            (perte estimée : {lossPctIfZero.toFixed(1)} %). Bois quand même pour le confort.
                          </div>
                        )}

                        {/* ⚠ CRITICAL: ingest > tolerance → tradeoff message */}
                        {exceedsTolerance && (
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              background: "rgba(207,46,46,0.10)",
                              border: "1px solid rgba(207,46,46,0.30)",
                              color: "var(--color-text)",
                            }}
                          >
                            <div className="font-extrabold mb-1" style={{ color: "var(--color-danger)" }}>
                              ⚠ Apport théorique &gt; ta tolérance digestive
                            </div>
                            <div className="leading-relaxed">
                              Pour rester sous 2,5 % de déshydratation, il faudrait ingérer{" "}
                              <b>{Math.round(toIngestPerH)} ml/h</b> — au-delà de ta tolérance déclarée
                              de <b>{Math.round(toNum(pred.tolerance) || 750)} ml/h</b>.
                              <br /><br />
                              <b>👉 Recommandation :</b> <b>reste à ta tolérance</b> ({Math.round(actualIngestPerH)} ml/h,
                              soit <b>{Math.round(actualIngestTotalMl)} ml</b> sur la course). Chercher à
                              combler à tout prix = troubles digestifs garantis (nausées, ballonnements,
                              perte d&apos;énergie, abandon possible).
                              <br /><br />
                              <b>Conséquence prévisible :</b> tu approcheras / dépasseras
                              le seuil des 2,5 % de déshydratation (estimation théorique :
                              ~{actualLossPct.toFixed(1)} %). En pratique, ce chiffre est
                              <b> auto-régulé</b> : dès que la déshydratation atteint ~2,5 %,
                              les performances baissent → allure ralentie → moins de chaleur
                              à évacuer → taux de sudation réduit. Tu finiras donc probablement
                              <b>moins déshydratée</b> que la projection linéaire, mais avec
                              une <b>perte de performance</b> sur la 2ᵉ moitié de course.
                              C&apos;est le moindre mal vs un problème digestif.
                              <br /><br />
                              <b>À travailler en amont :</b> entraîne ta tolérance hydrique (module
                              &quot;Tests de tolérance&quot;) — c&apos;est un facteur de progression
                              majeur sur les longues courses.
                            </div>
                          </div>
                        )}

                        {!exceedsTolerance && toIngestPerH >= 500 && toIngestPerH <= 1000 && (
                          <div className="text-[var(--color-text-muted)]">
                            ℹ Volume horaire dans la fourchette tolérable (500-1000 ml/h) — vérifie que tu as déjà tenu cette
                            cadence en entraînement.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {prediction.topMatches.length > 0 && (
                  <div className="card p-4 mt-4">
                    <div className="text-xs uppercase font-bold text-[var(--color-text-muted)] mb-2" style={{ letterSpacing: ".06em" }}>
                      🎯 Tests les plus similaires utilisés
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {prediction.topMatches.map((t, i) => (
                        <div key={i} className="rounded-lg p-2.5" style={{ background: "var(--color-surface-2)" }}>
                          <div className="font-bold" style={{ color: "var(--color-primary)" }}>
                            {Math.round(t.mlh)} ml/h
                          </div>
                          <div className="text-[var(--color-text-muted)] mt-0.5">
                            {t.temp}°C · {t.fc} bpm · {t.humidite}% · {t.duree} min
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
        )}

        {/* =================== MULTI-SEGMENTS MODE =================== */}
        {predMode === "segments" && (
          <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-4">
            <div className="card p-4">
              <div className="font-extrabold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                🏔 Segments de course
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mb-3">
                Décompose ta course en sections avec leurs propres conditions (température, FC, humidité, durée).
                Utile pour les ultras et ironman où météo & intensité varient fortement.
              </div>

              {/* Scenario presets — quick fill */}
              <div className="mb-3 p-2.5 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
                <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
                  🎯 Presets scénarios
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIO_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyScenarioPreset(p)}
                      className="btn-ghost btn-xs"
                      style={{ fontSize: 11, padding: "3px 8px" }}
                      title={p.description}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
                  Applique temp/humidité/FC moyens à tous les segments. Tu peux ensuite ajuster chaque segment.
                </div>
              </div>
              <div className="flex flex-col gap-3 mb-3">
                {segments.map((seg, i) => (
                  <div key={seg.id} className="rounded-lg p-2.5" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-primary)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="input"
                        style={{ fontSize: 13, fontWeight: 700, flex: 1 }}
                        value={seg.label}
                        onChange={(e) => updateSegment(seg.id, "label", e.target.value)}
                      />
                      {segments.length > 1 && (
                        <button
                          onClick={() => removeSegment(seg.id)}
                          title="Supprimer ce segment"
                          style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 16 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Field label="Durée (min)">
                        <input className="input" value={seg.duree} onChange={(e) => updateSegment(seg.id, "duree", e.target.value)} />
                      </Field>
                      <Field label="Temp (°C)">
                        <input className="input" value={seg.temp} onChange={(e) => updateSegment(seg.id, "temp", e.target.value)} />
                      </Field>
                      <Field label="FC (bpm)">
                        <input className="input" value={seg.fc} onChange={(e) => updateSegment(seg.id, "fc", e.target.value)} />
                      </Field>
                      <Field label="Humid (%)">
                        <input className="input" value={seg.humidite} onChange={(e) => updateSegment(seg.id, "humidite", e.target.value)} />
                      </Field>
                    </div>
                    {(() => {
                      const segPred = predictSweat(
                        { temp: toNum(seg.temp), fc: toNum(seg.fc), humidite: toNum(seg.humidite), duree: toNum(seg.duree) },
                        validForPred,
                      );
                      if (!segPred) return null;
                      const segSweatTotal = (segPred.predicted * toNum(seg.duree)) / 60;
                      return (
                        <div className="text-[11px] mt-2 text-[var(--color-text-muted)]">
                          → <b style={{ color: "var(--color-primary)" }}>{Math.round(segPred.predicted)} ml/h</b>
                          {" · "}Pertes segment : <b>{Math.round(segSweatTotal)} ml</b>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
              <button onClick={addSegment} className="btn-ghost btn-sm w-full">+ Ajouter un segment</button>
              <div className="mt-4 border-t border-[var(--color-border)] pt-3 flex flex-col gap-2">
                <Field label="Poids athlète (kg)">
                  <input className="input" value={pred.poids} onChange={(e) => setPred({ ...pred, poids: e.target.value })} />
                </Field>
                <Field label="Tolérance hydrique perso (ml/h)">
                  <input
                    className="input"
                    value={pred.tolerance}
                    onChange={(e) => setPred({ ...pred, tolerance: e.target.value })}
                  />
                </Field>
                <div className="mt-2 p-2.5 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
                  <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
                    💧 Réserves pré-course
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer text-xs mb-1.5">
                    <input
                      type="checkbox"
                      checked={reserve.hyperhydration}
                      onChange={(e) => setReserve({ ...reserve, hyperhydration: e.target.checked })}
                      style={{ width: 14, height: 14, marginTop: 2 }}
                    />
                    <span>
                      <b>Surhydratation pré-course</b> (+500 ml)<br />
                      <span className="text-[var(--color-text-muted)]">800 ml + 7 g sel dans les 2h pré-départ</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={reserve.carbLoad}
                      onChange={(e) => setReserve({ ...reserve, carbLoad: e.target.checked })}
                      style={{ width: 14, height: 14, marginTop: 2 }}
                    />
                    <span>
                      <b>Surcharge glucidique</b> (+750 ml)<br />
                      <span className="text-[var(--color-text-muted)]">eau liée au glycogène stocké (1g glyco = 3g eau)</span>
                    </span>
                  </label>
                </div>

                {/* Additional non-sweat losses */}
                <div className="mt-2 p-2.5 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
                  <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
                    💨 Pertes non-sudorales
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Urinaires (ml/h)">
                      <input className="input" value={losses.urinaryMlH} onChange={(e) => setLosses({ ...losses, urinaryMlH: e.target.value })} placeholder="30" />
                    </Field>
                    <Field label="Respiratoires (ml/h)">
                      <input className="input" value={losses.respiratoryMlH} onChange={(e) => setLosses({ ...losses, respiratoryMlH: e.target.value })} placeholder="60" />
                    </Field>
                    <Field label="Altitude (m)">
                      <input className="input" value={losses.altitudeM} onChange={(e) => setLosses({ ...losses, altitudeM: e.target.value })} placeholder="0" />
                    </Field>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Urinaires : ~20-60 ml/h (faibles en effort). Respiratoires : ~50-100 ml/h, +20% par 1000m d&apos;altitude.
                  </div>
                </div>

                {/* Non-linear model parameters — 3-layer hybrid model */}
                <div className="mt-2 p-2.5 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
                  <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
                    🔬 Modèle hybride à 3 couches
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs mb-2">
                    <input
                      type="checkbox"
                      checked={nlParams.enabled}
                      onChange={(e) => setNlParams({ ...nlParams, enabled: e.target.checked })}
                      style={{ width: 14, height: 14 }}
                    />
                    <span><b>Activer</b> la projection auto-régulée (bilan + intensité + météo)</span>
                  </label>
                  {nlParams.enabled && (
                    <>
                      {/* Pacing strategy quick-select */}
                      <div className="mb-2">
                        <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".06em", color: "var(--color-text-muted)" }}>
                          🎯 Stratégie de pacing
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {PACING_STRATEGIES.map((s) => (
                            <button
                              key={s.key}
                              onClick={() => applyStrategy(s)}
                              className={nlParams.strategyKey === s.key ? "btn-primary btn-xs" : "btn-ghost btn-xs"}
                              style={{ fontSize: 11, padding: "3px 8px" }}
                              title={s.description}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Weather scenario */}
                      <div className="mb-2">
                        <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".06em", color: "var(--color-text-muted)" }}>
                          🌡 Scénario météo (×sudation)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {WEATHER_SCENARIOS.map((w) => (
                            <button
                              key={w.key}
                              onClick={() => setNlParams({ ...nlParams, weatherKey: w.key })}
                              className={nlParams.weatherKey === w.key ? "btn-primary btn-xs" : "btn-ghost btn-xs"}
                              style={{ fontSize: 11, padding: "3px 8px" }}
                              title={`Facteur ×${w.factor.toFixed(2)}`}
                            >
                              {w.label} ×{w.factor.toFixed(2)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Intensité q">
                          <input className="input" value={nlParams.q} onChange={(e) => setNlParams({ ...nlParams, q: e.target.value, strategyKey: "custom" })} />
                        </Field>
                        <Field label="Seuil δ₀ (%)">
                          <input className="input" value={nlParams.thresholdPct} onChange={(e) => setNlParams({ ...nlParams, thresholdPct: e.target.value, strategyKey: "custom" })} />
                        </Field>
                        <Field label="Sensibilité k">
                          <input className="input" value={nlParams.k} onChange={(e) => setNlParams({ ...nlParams, k: e.target.value, strategyKey: "custom" })} />
                        </Field>
                        <Field label="Couplage β">
                          <input className="input" value={nlParams.beta} onChange={(e) => setNlParams({ ...nlParams, beta: e.target.value, strategyKey: "custom" })} />
                        </Field>
                        <Field label="Plancher u_min">
                          <input className="input" value={nlParams.uMin} onChange={(e) => setNlParams({ ...nlParams, uMin: e.target.value })} />
                        </Field>
                      </div>
                    </>
                  )}
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    Modèle : S = S₀·g_météo·u^β avec u = max(u_min, q·exp(-k·max(0, δ-δ₀))).
                  </div>
                </div>
              </div>
            </div>

            <div>
              {validForPred.length === 0 ? (
                <Empty>Ajoute au moins 1 test complet pour générer les estimations par segment.</Empty>
              ) : (() => {
                const poidsKg = toNum(pred.poids);
                const toleranceMlH = toNum(pred.tolerance) || 750;
                const maxLossMlGlobal = poidsKg * 25;
                // Extra pre-race water reserves (in litres)
                const extraReserveL = (reserve.hyperhydration ? 0.5 : 0) + (reserve.carbLoad ? 0.75 : 0);

                // Per-segment predictions
                const segResults = segments.map((seg) => {
                  const p = predictSweat(
                    { temp: toNum(seg.temp), fc: toNum(seg.fc), humidite: toNum(seg.humidite), duree: toNum(seg.duree) },
                    validForPred,
                  );
                  const dureeMin = toNum(seg.duree);
                  const sweatMlH = p?.predicted ?? 0;
                  const sweatTotalMl = (sweatMlH * dureeMin) / 60;
                  return { seg, dureeMin, sweatMlH, sweatTotalMl, confidence: p?.confidence ?? "faible" };
                });

                const totalDurationMin = segResults.reduce((s, r) => s + r.dureeMin, 0);
                const totalSweatMl = segResults.reduce((s, r) => s + r.sweatTotalMl, 0);
                const totalDurationH = totalDurationMin / 60;
                const avgSweatMlH = totalDurationH > 0 ? totalSweatMl / totalDurationH : 0;
                const idealIngestTotalMl = Math.max(0, totalSweatMl - maxLossMlGlobal);
                const idealIngestPerH = totalDurationH > 0 ? idealIngestTotalMl / totalDurationH : 0;
                const actualIngestPerH = Math.min(idealIngestPerH, toleranceMlH);
                const actualIngestTotalMl = actualIngestPerH * totalDurationH;
                const actualLossPct = poidsKg > 0 ? ((totalSweatMl - actualIngestTotalMl) / (poidsKg * 1000)) * 100 : 0;
                const exceedsTolerance = idealIngestPerH > toleranceMlH;
                const naMinTotal = Math.round((actualIngestTotalMl / 1000) * 500);
                const naMaxTotal = Math.round((actualIngestTotalMl / 1000) * 1300);

                // Non-sweat losses (urinary + altitude-corrected respiratory)
                const otherLossesMlH = toNum(losses.urinaryMlH) +
                  respLossesAtAltitude(toNum(losses.respiratoryMlH), toNum(losses.altitudeM));

                // Feasibility analysis (the equation from the PDF)
                const feas = feasibilityAnalysis({
                  totalSweatMl,
                  durationH: totalDurationH,
                  weightKg: poidsKg,
                  toleranceMlH,
                  thresholdPct: toNum(nlParams.thresholdPct) || 2.5,
                  extraReserveL,
                  otherLossesMlH,
                });

                // Build feasibility scenario table rows (PDF page 6)
                const budgetL = feas.budgetL;
                const scenarioRows = [1.0, 1.3, 1.5, 1.7, 2.0, 2.3].map((sweatLh) => {
                  const totalSweatLs = sweatLh * totalDurationH;
                  const otherL = (otherLossesMlH * totalDurationH) / 1000;
                  const needL = Math.max(0, totalSweatLs + otherL - budgetL);
                  const needPerH = totalDurationH > 0 ? (needL * 1000) / totalDurationH : 0;
                  return { sweatLh, needPerH, ok: needPerH <= toleranceMlH };
                });

                return (
                  <>
                    {/* Feasibility card — the headline of the long-race mode */}
                    {(() => {
                      const statusColor =
                        feas.status === "feasible" ? "var(--color-success)" :
                        feas.status === "tight" ? "#e6a833" :
                        "var(--color-danger)";
                      const statusBg =
                        feas.status === "feasible" ? "rgba(95,140,10,0.10)" :
                        feas.status === "tight" ? "rgba(230,168,51,0.12)" :
                        "rgba(207,46,46,0.10)";
                      const statusLabel =
                        feas.status === "feasible" ? "✅ Plan faisable" :
                        feas.status === "tight" ? "⚠ Plan limite" :
                        "❌ Plan non faisable";
                      const statusMsg =
                        feas.status === "feasible"
                          ? `Ta tolérance (${toleranceMlH} ml/h) couvre les ${Math.round(feas.requiredIntakeMlH)} ml/h théoriques nécessaires pour rester sous ${nlParams.thresholdPct} % de déshydratation.`
                          : feas.status === "tight"
                          ? `Plan jouable mais marge faible (${Math.round(feas.intakeGapMlH)} ml/h au-dessus de ta tolérance). À surveiller : refroidissement + pacing dès le début.`
                          : `Il manque ${Math.round(feas.intakeGapMlH)} ml/h vs ta tolérance. Hydratation seule = insuffisante. La solution n'est pas "boire plus" mais réduire la charge thermique et l'intensité.`;
                      return (
                        <div className="card p-4 mb-4" style={{ borderLeft: `5px solid ${statusColor}`, background: statusBg }}>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-extrabold text-base" style={{ color: statusColor, fontFamily: "var(--font-display)" }}>
                              {statusLabel}
                            </span>
                            <span className="text-[10px] uppercase font-bold" style={{ color: "var(--color-text-muted)", letterSpacing: ".08em" }}>
                              · Analyse de faisabilité
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed">{statusMsg}</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                            <div className="rounded p-2" style={{ background: "#fff" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Pertes totales</div>
                              <div className="font-extrabold">{feas.totalLossesL.toFixed(2)} L</div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">Sueur + non-sudo</div>
                            </div>
                            <div className="rounded p-2" style={{ background: "#fff" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Budget acceptable</div>
                              <div className="font-extrabold">{budgetL.toFixed(2)} L</div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">{nlParams.thresholdPct} % × {poidsKg} kg{extraReserveL > 0 ? ` + ${extraReserveL.toFixed(2)} L` : ""}</div>
                            </div>
                            <div className="rounded p-2" style={{ background: "#fff" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Apport nécessaire</div>
                              <div className="font-extrabold" style={{ color: statusColor }}>
                                {Math.round(feas.requiredIntakeMlH)} ml/h
                              </div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">vs tolérance {toleranceMlH}</div>
                            </div>
                            <div className="rounded p-2" style={{ background: "#fff" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Sueur max faisable</div>
                              <div className="font-extrabold">{feas.maxSweatForFeasibilityLh.toFixed(2)} L/h</div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">à ta tolérance actuelle</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actionable checklist when infeasible/tight */}
                    {feas.status !== "feasible" && (
                      <div
                        className="card p-4 mb-4"
                        style={{ borderLeft: "5px solid #2196f3", background: "rgba(33,150,243,0.06)" }}
                      >
                        <div className="font-extrabold mb-2" style={{ color: "#2196f3" }}>
                          🛠 Leviers d&apos;action
                        </div>
                        <div className="text-xs leading-relaxed mb-2">
                          La conclusion du PDF est claire : si l&apos;apport requis &gt; tolérance, la solution n&apos;est
                          <b> pas de forcer l&apos;ingestion</b> (troubles digestifs), mais de <b>réduire la charge thermique
                          et l&apos;intensité</b>. Combinaison gagnante :
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>🌡 Acclimatation chaleur (10-14j avant)</b><br />
                            Abaisse la FC et la T° interne à charge donnée. Avance le seuil de sudation.
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>❄️ Refroidissement externe aux ravitos</b><br />
                            Eau froide sur tête/nuque/avant-bras, gilet glace, glaçons dans bandana.
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>🐢 Pacing conservateur dès le départ</b><br />
                            Cible {Math.round(feas.maxSweatForFeasibilityLh * 1000)} ml/h sueur max → intensité ~{Math.round(feas.maxSweatForFeasibilityLh / Math.max(0.01, feas.averageSweatLh) * 100)}% de ce qui est projeté.
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>🌳 Recherche ombre / minimisation soleil direct</b><br />
                            Casquette légère claire, lunettes, sections ombragées privilégiées en montée.
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>👕 Vêtements évaporants</b><br />
                            Tissus techniques aérés, éviter coton. Mouillage régulier du t-shirt.
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff", borderLeft: "3px solid #2196f3" }}>
                            <b>💧 Boisson fractionnée dès km 0</b><br />
                            Ne pas attendre le rattrapage. Petites gorgées toutes les 5-10 min.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3 strategies × 3 weather scenarios matrix — analytical equilibrium deficit */}
                    {nlParams.enabled && (() => {
                      const sRef = avgSweatMlH; // ml/h
                      const intakeMlH = toleranceMlH;
                      const rNsMlH = otherLossesMlH;
                      const meteos = WEATHER_SCENARIOS;
                      const rows = PACING_STRATEGIES.map((strat) => {
                        const cells = meteos.map((m) => {
                          const p: NlParams = {
                            thresholdPct: strat.thresholdPct, k: strat.k, beta: strat.beta,
                            q: strat.q, uMin: toNum(nlParams.uMin) || 0.5, meteoFactor: m.factor,
                          };
                          const eq = equilibriumDeficitPct({ sRefMlH: sRef, intakeMlH, otherLossMlH: rNsMlH, p });
                          return { meteo: m, eqPct: eq };
                        });
                        return { strat, cells };
                      });
                      return (
                        <div className="card p-4 mb-4">
                          <div className="font-extrabold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                            🧮 Matrice stratégie × météo (déficit d&apos;équilibre)
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mb-3">
                            Pour chaque combinaison <b>stratégie de pacing</b> × <b>scénario météo</b>, voici le déficit
                            de fin de course estimé (formule analytique : δ_eq = δ₀ + (1/(k·β))·ln(S·g·q^β/(I−R_ns))).
                            <br />Cible : rester &lt;3 % (sécurité) ou &lt;4 % (performance).
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ background: "var(--color-surface-2)" }}>
                                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Stratégie</th>
                                  {meteos.map((m) => (
                                    <th key={m.key} style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>
                                      {m.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r) => {
                                  const isCurrent = r.strat.key === nlParams.strategyKey;
                                  return (
                                    <tr key={r.strat.key} style={{
                                      borderBottom: "1px solid var(--color-border)",
                                      background: isCurrent ? "rgba(255,69,1,0.08)" : undefined,
                                      fontWeight: isCurrent ? 700 : undefined,
                                    }}>
                                      <td style={{ padding: 8 }}>
                                        {r.strat.label}
                                        {isCurrent && <span className="text-[10px] text-[var(--color-primary)] ml-1">← active</span>}
                                        <div className="text-[10px] text-[var(--color-text-muted)]" style={{ fontWeight: 400 }}>
                                          {r.strat.description}
                                        </div>
                                      </td>
                                      {r.cells.map((c, i) => {
                                        if (c.eqPct === null) {
                                          return (
                                            <td key={i} style={{ padding: 8, textAlign: "right", color: "var(--color-success)", fontWeight: 700 }}>
                                              ✓ &lt; seuil
                                            </td>
                                          );
                                        }
                                        const color =
                                          c.eqPct < 3 ? "var(--color-success)" :
                                          c.eqPct < 4 ? "#e6a833" :
                                          c.eqPct < 5 ? "var(--color-primary)" :
                                          "var(--color-danger)";
                                        return (
                                          <td key={i} style={{ padding: 8, textAlign: "right", color, fontWeight: 700 }}>
                                            {c.eqPct.toFixed(1)} %
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)] mt-2">
                            Lecture (cas Restonica typique) : <b>conservatrice</b> termine ≤ 3 % en froid/modéré mais bride la perf ;
                            <b> performance modérée</b> = bon compromis si météo froid à modéré ; <b>agressive</b> = risque réel &gt;5 %.
                          </div>
                        </div>
                      );
                    })()}

                    {/* Feasibility scenario table */}
                    <div className="card p-4 mb-4">
                      <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        📐 Tableau de faisabilité
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mb-3">
                        Pour ta tolérance de <b>{toleranceMlH} ml/h</b> et un budget de
                        <b> {budgetL.toFixed(2)} L</b> (déficit ≤ {nlParams.thresholdPct} % + réserves), voici l&apos;apport
                        nécessaire selon la sudation moyenne réelle de course.
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "var(--color-surface-2)" }}>
                              <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Sudation moyenne</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Apport nécessaire</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Faisable ?</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenarioRows.map((r, i) => {
                              const isProjected = Math.abs(r.sweatLh - feas.averageSweatLh) < 0.05;
                              return (
                                <tr key={i} style={{
                                  borderBottom: "1px solid var(--color-border)",
                                  background: isProjected ? "rgba(255,69,1,0.08)" : undefined,
                                  fontWeight: isProjected ? 700 : undefined,
                                }}>
                                  <td style={{ padding: 8 }}>
                                    {r.sweatLh.toFixed(1)} L/h
                                    {isProjected && <span className="text-[10px] text-[var(--color-primary)] ml-1">← ton scénario</span>}
                                  </td>
                                  <td style={{ padding: 8, textAlign: "right" }}>{Math.round(r.needPerH)} ml/h</td>
                                  <td style={{ padding: 8, textAlign: "right", color: r.ok ? "var(--color-success)" : "var(--color-danger)", fontWeight: 700 }}>
                                    {r.ok ? "✓ Oui" : "✗ Non"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-2">
                        Source : équation du PDF · Apport = max(0, sueur + pertes_non_sudo − budget) / durée
                      </div>
                    </div>

                    {/* Global summary */}
                    <div className="card p-5 mb-4" style={{ borderLeft: "5px solid var(--color-primary)", background: "rgba(255,69,1,0.04)" }}>
                      <div className="text-[10px] uppercase font-bold text-[var(--color-primary)] mb-2" style={{ letterSpacing: ".08em" }}>
                        🏁 Estimation globale sur la course
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Durée totale</div>
                          <div className="font-extrabold text-xl" style={{ color: "var(--color-dark)" }}>
                            {Math.floor(totalDurationMin / 60)}h{String(totalDurationMin % 60).padStart(2, "0")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Pertes totales</div>
                          <div className="font-extrabold text-xl" style={{ color: "var(--color-primary)" }}>
                            {(totalSweatMl / 1000).toFixed(2)} L
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Sudation moyenne</div>
                          <div className="font-extrabold text-xl" style={{ color: "var(--color-primary)" }}>
                            {Math.round(avgSweatMlH)} ml/h
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">À ingérer (recommandé)</div>
                          <div className="font-extrabold text-xl" style={{ color: "var(--color-primary)" }}>
                            {(actualIngestTotalMl / 1000).toFixed(2)} L
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">{Math.round(actualIngestPerH)} ml/h en moy.</div>
                        </div>
                      </div>
                    </div>

                    {/* Tolerance warning if global ideal > tolerance */}
                    {exceedsTolerance && (
                      <div
                        className="p-3 rounded-lg mb-4"
                        style={{ background: "rgba(207,46,46,0.10)", border: "1px solid rgba(207,46,46,0.30)" }}
                      >
                        <div className="font-extrabold mb-1" style={{ color: "var(--color-danger)" }}>
                          ⚠ Apport théorique global &gt; ta tolérance
                        </div>
                        <div className="text-xs leading-relaxed">
                          Idéal : <b>{Math.round(idealIngestPerH)} ml/h</b> · Ta tolérance : <b>{toleranceMlH} ml/h</b>.
                          <br /><br />
                          <b>👉 Reste à ta tolérance</b> ({Math.round(actualIngestPerH)} ml/h).
                          Estimation théorique de déshydratation finale : <b>~{actualLossPct.toFixed(1)} %</b>.
                          En pratique, dès que tu approches 2,5 %, tes performances baissent → allure ralentie → moins
                          de chaleur à évacuer → sudation réduite. Le chiffre réel sera donc <b>moins critique</b>,
                          mais avec un <b>coût en performance</b>.
                        </div>
                      </div>
                    )}

                    {/* Hyperhydration recommendation when projected loss > 2.5% AND
                        the athlete hasn't already activated the hyperhydration checkbox */}
                    {actualLossPct > 2.5 && poidsKg > 0 && !reserve.hyperhydration && (
                      <div
                        className="p-3 rounded-lg mb-4"
                        style={{ background: "rgba(33,150,243,0.08)", border: "1px solid rgba(33,150,243,0.30)" }}
                      >
                        <div className="font-extrabold mb-1" style={{ color: "#2196f3" }}>
                          💧 Stratégie de surhydratation pré-course recommandée
                        </div>
                        <div className="text-xs leading-relaxed">
                          La déshydratation projetée (<b>~{actualLossPct.toFixed(1)} %</b>) dépasse le seuil critique
                          de 2,5 %. Pour partir avec une réserve hydrique,&nbsp;
                          <b>mets en place un protocole de surhydratation pré-course</b> :
                          <ul className="mt-2 list-disc pl-5 space-y-0.5">
                            <li><b>800 ml d&apos;eau + 7 g de sel</b> (≈ 1 cuillère à café rase) dans les <b>2 h avant le départ</b></li>
                            <li>Le sodium retient l&apos;eau dans le compartiment vasculaire (vs uriner direct)</li>
                            <li>Gain net : ~500 ml de réserve hydrique au départ, qui repousse le seuil des 2,5 %</li>
                            <li>À tester en entraînement avant la course pour valider la tolérance digestive</li>
                          </ul>
                          <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                            👉 Coche la case <b>« Surhydratation pré-course »</b> à gauche pour voir l&apos;impact sur la courbe.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Weight / dehydration curve over time — hourly resolution */}
                    {poidsKg > 0 && totalDurationMin > 0 && (() => {
                      type Pt = { t: number; weight: number; lossPct: number; lossL: number; segLabel: string; isMarker?: boolean };
                      const chartData: Pt[] = [];
                      const segBands: Array<{ x1: number; x2: number; label: string; color: string }> = [];

                      // Two alternating subtle background tints to distinguish segments
                      const TINT_A = "rgba(255,69,1,0.06)";   // orange tint
                      const TINT_B = "rgba(33,150,243,0.06)"; // blue tint

                      // Start with athlete's water reserve credited as "negative loss"
                      // so the curve begins ABOVE poidsKg and crosses it later.
                      const startWeight = poidsKg + extraReserveL;
                      chartData.push({
                        t: 0,
                        weight: Math.round(startWeight * 100) / 100,
                        lossPct: -((extraReserveL / poidsKg) * 100),
                        lossL: -extraReserveL,
                        segLabel: extraReserveL > 0 ? `Départ (+${extraReserveL.toFixed(2)} L)` : "Départ",
                        isMarker: true,
                      });

                      let cumTime = 0;
                      let cumNetLossL = -extraReserveL; // negative = water in reserve

                      // Non-linear simulation: when deficit > threshold, intensity drops
                      // and sweat shrinks. We simulate hour-by-hour using current deficit %.
                      const weatherFactor = (WEATHER_SCENARIOS.find((w) => w.key === nlParams.weatherKey)?.factor) ?? 1.0;
                      const nl: NlParams = {
                        thresholdPct: toNum(nlParams.thresholdPct) || 3.0,
                        k: toNum(nlParams.k) || 0.6,
                        beta: toNum(nlParams.beta) || 0.85,
                        q: toNum(nlParams.q) || 0.8,
                        uMin: toNum(nlParams.uMin) || 0.5,
                        meteoFactor: weatherFactor,
                      };
                      let cumNetLossL_NL = -extraReserveL;
                      const respMlH = respLossesAtAltitude(toNum(losses.respiratoryMlH), toNum(losses.altitudeM));
                      const uriMlH = toNum(losses.urinaryMlH);
                      const otherLossLPerH = (respMlH + uriMlH) / 1000;

                      // Track linear AND non-linear, plus intensity %
                      type Pt2 = Pt & { weightNL?: number; intensityPct?: number };
                      const data2: Pt2[] = chartData as Pt2[];

                      segResults.forEach((r, segIdx) => {
                        const segDurH = r.dureeMin / 60;
                        const segStart = cumTime;
                        const segEnd = cumTime + segDurH;
                        const shareOfSweat = totalSweatMl > 0 ? r.sweatTotalMl / totalSweatMl : 0;
                        const ingestSegL = (actualIngestTotalMl * shareOfSweat) / 1000;
                        const ingestSegLPerH = segDurH > 0 ? ingestSegL / segDurH : 0;
                        const sweatLPerH = r.sweatMlH / 1000;
                        const netLossLPerH = sweatLPerH - ingestSegLPerH + otherLossLPerH;

                        segBands.push({
                          x1: segStart,
                          x2: segEnd,
                          label: r.seg.label,
                          color: segIdx % 2 === 0 ? TINT_A : TINT_B,
                        });

                        // Stepping with sub-segment integration for non-linear curve
                        const stepH = 0.25; // 15-min resolution
                        let tCursor = segStart;
                        while (tCursor + 1e-6 < segEnd) {
                          const dt = Math.min(stepH, segEnd - tCursor);
                          // Non-linear: regulated sweat depends on current deficit %
                          const curDeficitPct = poidsKg > 0 ? (cumNetLossL_NL / poidsKg) * 100 : 0;
                          const regSweatLPerH = regulatedSweat(sweatLPerH * 1000, curDeficitPct, nl) / 1000;
                          const netLossLPerH_NL = regSweatLPerH - ingestSegLPerH + otherLossLPerH;
                          cumNetLossL_NL = cumNetLossL_NL + dt * netLossLPerH_NL;
                          tCursor += dt;

                          // Push a chart point only at integer hours to keep markers aligned
                          if (Math.abs(tCursor - Math.round(tCursor)) < 0.01 && Math.round(tCursor) > 0 && Math.round(tCursor) < segEnd - 0.05) {
                            const dtLin = Math.round(tCursor) - segStart;
                            const lossLin = cumNetLossL + dtLin * netLossLPerH;
                            const intPct = Math.round(intensityFactor(curDeficitPct, nl) * 100);
                            data2.push({
                              t: Math.round(tCursor),
                              weight: Math.round((poidsKg - lossLin) * 100) / 100,
                              weightNL: Math.round((poidsKg - cumNetLossL_NL) * 100) / 100,
                              lossPct: Math.round((lossLin / poidsKg) * 100 * 10) / 10,
                              lossL: Math.round(lossLin * 100) / 100,
                              intensityPct: Math.min(100, intPct),
                              segLabel: r.seg.label,
                            });
                          }
                        }

                        // End-of-segment markers (both linear + NL)
                        cumTime = segEnd;
                        cumNetLossL = cumNetLossL + segDurH * netLossLPerH;
                        const intPctEnd = Math.round(intensityFactor(poidsKg > 0 ? (cumNetLossL_NL / poidsKg) * 100 : 0, nl) * 100);
                        data2.push({
                          t: Math.round(cumTime * 100) / 100,
                          weight: Math.round((poidsKg - cumNetLossL) * 100) / 100,
                          weightNL: Math.round((poidsKg - cumNetLossL_NL) * 100) / 100,
                          lossPct: Math.round((cumNetLossL / poidsKg) * 100 * 10) / 10,
                          lossL: Math.round(cumNetLossL * 100) / 100,
                          intensityPct: Math.min(100, intPctEnd),
                          segLabel: `Fin ${r.seg.label}`,
                          isMarker: true,
                        });
                      });

                      // Final deficits — linear vs NL
                      const finalLossPctLinear = poidsKg > 0 ? (cumNetLossL / poidsKg) * 100 : 0;
                      const finalLossPctNL = poidsKg > 0 ? (cumNetLossL_NL / poidsKg) * 100 : 0;
                      const finalIntensityPct = Math.round(
                        intensityFactor(finalLossPctNL, nl) * 100,
                      );

                      const lossThreshold25Pct = poidsKg * 0.025;
                      const weightAt25 = poidsKg - lossThreshold25Pct;
                      const minWeight = Math.min(...chartData.map((d) => d.weight));
                      const yMin = Math.min(weightAt25 - 0.3, minWeight - 0.2);

                      // Markers shown below the chart
                      const markers = chartData.filter((d) => d.isMarker);

                      return (
                        <div className="card p-4 mb-4">
                          <div className="font-extrabold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                            📉 Courbe poids / déshydratation
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mb-3">
                            <b>Courbe bleue pleine</b> = projection linéaire (sudation constante).
                            {nlParams.enabled && (
                              <>
                                {" "}<b style={{ color: "var(--color-success)" }}>Courbe verte pointillée</b> = projection
                                non-linéaire (sudation réduite quand déficit &gt; {nlParams.thresholdPct} % car l&apos;allure
                                baisse). Bandes alternées orange/bleu = segments. Ligne rouge = seuil critique 2,5 %
                                (<b>{weightAt25.toFixed(1)} kg</b> / {lossThreshold25Pct.toFixed(2)} L de perte).
                              </>
                            )}
                          </div>
                          {nlParams.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-xs">
                              <div className="rounded p-2" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #2196f3" }}>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Déficit final · linéaire</div>
                                <div className="font-extrabold" style={{ color: "#2196f3" }}>{finalLossPctLinear.toFixed(1)} %</div>
                                <div className="text-[10px] text-[var(--color-text-muted)]">{cumNetLossL.toFixed(2)} L</div>
                              </div>
                              <div className="rounded p-2" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-success)" }}>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Déficit final · non-linéaire</div>
                                <div className="font-extrabold" style={{ color: "var(--color-success)" }}>{finalLossPctNL.toFixed(1)} %</div>
                                <div className="text-[10px] text-[var(--color-text-muted)]">{cumNetLossL_NL.toFixed(2)} L (avec auto-régulation)</div>
                              </div>
                              <div className="rounded p-2" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #e6a833" }}>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Intensité finale soutenue</div>
                                <div className="font-extrabold" style={{ color: finalIntensityPct < 80 ? "var(--color-danger)" : "#e6a833" }}>
                                  {finalIntensityPct} %
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)]">vs allure initiale</div>
                              </div>
                            </div>
                          )}
                          <div style={{ width: "100%", height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                {/* Per-segment background bands */}
                                {segBands.map((b, i) => (
                                  <ReferenceArea
                                    key={`band-${i}`}
                                    x1={b.x1}
                                    x2={b.x2}
                                    fill={b.color}
                                    fillOpacity={1}
                                    label={{
                                      value: b.label,
                                      position: "insideTop",
                                      fontSize: 9,
                                      fill: "var(--color-text-muted)",
                                    }}
                                  />
                                ))}
                                <XAxis
                                  dataKey="t"
                                  type="number"
                                  domain={[0, "dataMax"]}
                                  tickFormatter={(v) => `${v}h`}
                                  fontSize={11}
                                  ticks={Array.from({ length: Math.ceil(cumTime) + 1 }, (_, i) => i)}
                                />
                                <YAxis
                                  domain={[Math.floor(yMin * 10) / 10, Math.ceil((poidsKg + extraReserveL + 0.2) * 10) / 10]}
                                  tickFormatter={(v) => `${v.toFixed(1)}`}
                                  fontSize={11}
                                  label={{ value: "Poids (kg)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
                                />
                                <Tooltip
                                  formatter={(value: number) => [`${value} kg`, "Poids"]}
                                  labelFormatter={(v: number) => `t = ${v}h`}
                                  contentStyle={{ fontSize: 12 }}
                                />
                                <ReferenceLine
                                  y={weightAt25}
                                  stroke="var(--color-danger)"
                                  strokeDasharray="4 4"
                                  label={{
                                    value: `Seuil 2,5 % · ${weightAt25.toFixed(1)} kg`,
                                    position: "insideTopRight",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    fill: "var(--color-danger)",
                                    offset: 8,
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="weight"
                                  name="Linéaire"
                                  stroke="#2196f3"
                                  strokeWidth={2.5}
                                  dot={{ r: 3, fill: "#2196f3" }}
                                  activeDot={{ r: 5 }}
                                  isAnimationActive={false}
                                />
                                {nlParams.enabled && (
                                  <Line
                                    type="monotone"
                                    dataKey="weightNL"
                                    name="Non-linéaire (auto-régulé)"
                                    stroke="var(--color-success)"
                                    strokeWidth={2.5}
                                    strokeDasharray="5 3"
                                    dot={{ r: 3, fill: "var(--color-success)" }}
                                    activeDot={{ r: 5 }}
                                    isAnimationActive={false}
                                  />
                                )}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                            {markers.map((p, i) => (
                              <div key={i} className="rounded p-2" style={{ background: "var(--color-surface-2)" }}>
                                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] truncate">{p.segLabel}</div>
                                <div className="font-extrabold" style={{ color: p.lossPct > 2.5 ? "var(--color-danger)" : "var(--color-dark)" }}>
                                  {p.weight} kg
                                </div>
                                <div className="text-[10px]" style={{ color: p.lossPct > 2.5 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                                  -{p.lossL} L · {p.lossPct.toFixed(1)} % · t={p.t}h
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Field pilot guide — what to watch during the race */}
                    <div
                      className="card p-4 mb-4"
                      style={{ borderLeft: "5px solid var(--color-dark)" }}
                    >
                      <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        🧭 Pilotage terrain en course
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mb-3">
                        Le bon modèle n&apos;est pas &laquo; rester sous 2,5 % à tout prix &raquo;.
                        2,5 % devient un <b>seuil d&apos;alerte tactique</b>, pas un plafond dogmatique.
                        Performance modérée jusqu&apos;à 3,5–4 % reste compatible avec la perf si la chaleur est gérable.
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Pre-race plan */}
                        <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)" }}>
                          <div className="text-[11px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".06em", color: "var(--color-primary)" }}>
                            ⏱ Avant le départ
                          </div>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li><b>Surhydratation pré-course</b> : 800 ml + 7 g sel dans les 2h (si réserve activée)</li>
                            <li><b>Boisson fractionnée dès km 0</b> : ne pas attendre le rattrapage</li>
                            <li><b>200 ml / 10 min</b> ou <b>300 ml / 15 min</b> = base à 1,2 L/h</li>
                            <li><b>Refroidissement préventif</b> : tête/nuque, casquette claire, lunettes</li>
                          </ul>
                        </div>

                        {/* Warning signs */}
                        <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)" }}>
                          <div className="text-[11px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".06em", color: "var(--color-danger)" }}>
                            ⚠ Signaux d&apos;alerte (≠ « combien j&apos;ai bu »)
                          </div>
                          <ul className="list-disc pl-5 space-y-1 text-xs">
                            <li><b>FC dérivante</b> sans changement d&apos;allure</li>
                            <li><b>RPE disproportionnée</b> à l&apos;allure</li>
                            <li><b>Baisse de lucidité</b>, vue qui se brouille</li>
                            <li><b>Frissons / chair de poule</b> malgré la chaleur</li>
                            <li><b>Nausées</b>, sensation d&apos;estomac plein</li>
                            <li><b>Incapacité</b> à continuer à s&apos;alimenter</li>
                          </ul>
                        </div>
                      </div>

                      {/* Decision flow */}
                      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,69,1,0.05)", border: "1px dashed var(--color-primary)" }}>
                        <div className="text-[11px] uppercase font-bold mb-2" style={{ letterSpacing: ".06em", color: "var(--color-primary)" }}>
                          🔀 Flux décisionnel en course
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div className="rounded p-2" style={{ background: "#fff" }}>
                            <div className="font-extrabold mb-1">FC / RPE stables ?</div>
                            ✓ Oui → maintenir le pacing prévu<br />
                            ✗ Non → réduire l&apos;intensité de 5-10 %
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff" }}>
                            <div className="font-extrabold mb-1">Tolérance digestive OK ?</div>
                            ✓ Oui → 150-250 ml toutes les 10 min<br />
                            ✗ Non → réduire le volume / augmenter la fréquence
                          </div>
                          <div className="rounded p-2" style={{ background: "#fff" }}>
                            <div className="font-extrabold mb-1">Dérive thermique ?</div>
                            ✓ Oui → refroidissement actif (eau nuque/bras, ombre)<br />
                            ✗ Non → continuer<br />
                            Pas d&apos;amélioration en 10-20 min → basculer conservateur
                          </div>
                        </div>
                      </div>

                      {/* Equilibrium deficit (analytical) for the current strategy */}
                      {nlParams.enabled && (() => {
                        const weatherFactor = (WEATHER_SCENARIOS.find((w) => w.key === nlParams.weatherKey)?.factor) ?? 1.0;
                        const p: NlParams = {
                          thresholdPct: toNum(nlParams.thresholdPct) || 3.0,
                          k: toNum(nlParams.k) || 0.6,
                          beta: toNum(nlParams.beta) || 0.85,
                          q: toNum(nlParams.q) || 0.8,
                          uMin: toNum(nlParams.uMin) || 0.5,
                          meteoFactor: weatherFactor,
                        };
                        const eq = equilibriumDeficitPct({
                          sRefMlH: avgSweatMlH,
                          intakeMlH: toleranceMlH,
                          otherLossMlH: otherLossesMlH,
                          p,
                        });
                        return (
                          <div className="mt-3 text-xs p-2.5 rounded" style={{ background: "var(--color-dark)", color: "#fff" }}>
                            <b>📊 Déficit d&apos;équilibre (formule analytique)</b> — stratégie actuelle + météo actuelle :
                            {" "}
                            {eq === null ? (
                              <b style={{ color: "var(--color-accent)" }}>L&apos;apport couvre les pertes — pas de dérive.</b>
                            ) : (
                              <>
                                <b style={{ color: "var(--color-accent)" }}>{eq.toFixed(2)} %</b>
                                {" "}— la courbe va se stabiliser autour de cette valeur si tes paramètres restent constants.
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Dedicated sodium card — placed after field-pilot guide */}
                    {actualIngestTotalMl > 0 && (() => {
                      const totalL = actualIngestTotalMl / 1000;
                      const perHL = actualIngestPerH / 1000;
                      const naMinPerH = Math.round(perHL * 500);
                      const naMaxPerH = Math.round(perHL * 1300);
                      const naPerSeg = segResults.map((r) => {
                        const shareOfSweat = totalSweatMl > 0 ? r.sweatTotalMl / totalSweatMl : 0;
                        const ingestSegL = (actualIngestTotalMl * shareOfSweat) / 1000;
                        return {
                          seg: r.seg,
                          dureeMin: r.dureeMin,
                          ingestL: ingestSegL,
                          naMin: Math.round(ingestSegL * 500),
                          naMax: Math.round(ingestSegL * 1300),
                        };
                      });
                      return (
                        <div className="card p-4 mb-4" style={{ borderLeft: "5px solid #2196f3" }}>
                          <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            🧂 Plan sodium — anti-hyponatrémie
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mb-3">
                            Pour <b>{totalL.toFixed(2)} L</b> ingérés sur la course, voici les cibles sodium
                            (règle d&apos;or : 500-1300 mg / L d&apos;eau).
                          </div>

                          {/* Global sodium */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #2196f3" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                                Sodium / heure
                              </div>
                              <div className="font-extrabold text-2xl" style={{ color: "#2196f3", fontFamily: "var(--font-display)" }}>
                                {naMinPerH}–{naMaxPerH} mg/h
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                Pour {Math.round(actualIngestPerH)} ml/h ingérés
                              </div>
                            </div>
                            <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid #2196f3" }}>
                              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                                Sodium total sur la course
                              </div>
                              <div className="font-extrabold text-2xl" style={{ color: "#2196f3", fontFamily: "var(--font-display)" }}>
                                {naMinTotal}–{naMaxTotal} mg
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                Sur {Math.floor(totalDurationMin / 60)}h{String(totalDurationMin % 60).padStart(2, "0")}
                              </div>
                            </div>
                          </div>

                          {/* Per-segment sodium */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ background: "var(--color-surface-2)" }}>
                                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Segment</th>
                                  <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Durée</th>
                                  <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Apport hydrique</th>
                                  <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>🧂 Sodium</th>
                                </tr>
                              </thead>
                              <tbody>
                                {naPerSeg.map((r) => (
                                  <tr key={r.seg.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td style={{ padding: 8, fontWeight: 700 }}>{r.seg.label}</td>
                                    <td style={{ padding: 8, textAlign: "right" }}>
                                      {Math.floor(r.dureeMin / 60)}h{String(r.dureeMin % 60).padStart(2, "0")}
                                    </td>
                                    <td style={{ padding: 8, textAlign: "right" }}>{r.ingestL.toFixed(2)} L</td>
                                    <td style={{ padding: 8, textAlign: "right", color: "#2196f3", fontWeight: 700 }}>
                                      {r.naMin}–{r.naMax} mg
                                    </td>
                                  </tr>
                                ))}
                                <tr style={{ background: "var(--color-surface-2)", fontWeight: 800 }}>
                                  <td style={{ padding: 8 }}>Total</td>
                                  <td style={{ padding: 8, textAlign: "right" }}>
                                    {Math.floor(totalDurationMin / 60)}h{String(totalDurationMin % 60).padStart(2, "0")}
                                  </td>
                                  <td style={{ padding: 8, textAlign: "right" }}>{totalL.toFixed(2)} L</td>
                                  <td style={{ padding: 8, textAlign: "right", color: "#2196f3" }}>{naMinTotal}–{naMaxTotal} mg</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Hyponatremia warning */}
                          <div
                            className="mt-3 p-2.5 rounded-lg text-xs"
                            style={{ background: "rgba(33,150,243,0.08)", borderLeft: "3px solid #2196f3" }}
                          >
                            <b style={{ color: "#2196f3" }}>⚠ Risque d&apos;hyponatrémie</b> — boire beaucoup sans sodium dilue
                            le plasma sanguin. Symptômes : nausées, maux de tête, confusion, perte d&apos;équilibre, voire coma
                            dans les cas sévères.
                            <br />
                            <b>Règle d&apos;or :</b> <b>500-1300 mg de sodium / L d&apos;eau</b>. Bas de fourchette pour les
                            efforts courts ou tempérés. <b>Haut de fourchette</b> (≥ 1000 mg/L) si :
                            chaleur, forte sudation, course &gt; 4 h, ou si tu es <i>heavy sweater</i> (comme ici avec
                            {" "}{Math.round(avgSweatMlH)} ml/h moyens).
                          </div>

                          {/* Practical tips */}
                          <div className="mt-2 text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                            💡 <b>Sources concrètes :</b> boissons de l&apos;effort (souvent 400-800 mg/L → vérifier l&apos;étiquette),
                            pastilles de sel/électrolytes (200-400 mg/cap), capsules SaltStick, eau salée (1 g sel ≈ 400 mg sodium),
                            betterave/cornichons (très riches), bouillon chaud aux ravitos.
                          </div>
                        </div>
                      );
                    })()}

                    {/* Per-segment breakdown */}
                    <div className="card p-4">
                      <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        📊 Détail par segment
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "var(--color-surface-2)" }}>
                              <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>Segment</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Durée</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Conditions</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Sueur</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Pertes</th>
                              <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>À ingérer*</th>
                              {nlParams.enabled && (
                                <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid var(--color-border)" }}>Intensité†</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Re-run NL simulation per segment to compute intensity at segment end
                              const weatherFactorTable = (WEATHER_SCENARIOS.find((w) => w.key === nlParams.weatherKey)?.factor) ?? 1.0;
                              const nl: NlParams = {
                                thresholdPct: toNum(nlParams.thresholdPct) || 3.0,
                                k: toNum(nlParams.k) || 0.6,
                                beta: toNum(nlParams.beta) || 0.85,
                                q: toNum(nlParams.q) || 0.8,
                                uMin: toNum(nlParams.uMin) || 0.5,
                                meteoFactor: weatherFactorTable,
                              };
                              let nlLossL = -extraReserveL;
                              const respMlH2 = respLossesAtAltitude(toNum(losses.respiratoryMlH), toNum(losses.altitudeM));
                              const otherL = (toNum(losses.urinaryMlH) + respMlH2) / 1000;
                              return segResults.map((r) => {
                                const segDurH = r.dureeMin / 60;
                                const shareOfSweat = totalSweatMl > 0 ? r.sweatTotalMl / totalSweatMl : 0;
                                const ingestSegL = (actualIngestTotalMl * shareOfSweat) / 1000;
                                const ingestSegLPerH = segDurH > 0 ? ingestSegL / segDurH : 0;
                                const ingestSegPerH = ingestSegLPerH * 1000;
                                const ingestSeg = ingestSegL * 1000;

                                // Simulate this segment with 15-min steps
                                const stepH = 0.25;
                                let tCur = 0;
                                while (tCur + 1e-6 < segDurH) {
                                  const dt = Math.min(stepH, segDurH - tCur);
                                  const curDeficitPct = poidsKg > 0 ? (nlLossL / poidsKg) * 100 : 0;
                                  const regSweatLPerH = regulatedSweat(r.sweatMlH, curDeficitPct, nl) / 1000;
                                  nlLossL += dt * (regSweatLPerH - ingestSegLPerH + otherL);
                                  tCur += dt;
                                }
                                const endDeficitPct = poidsKg > 0 ? (nlLossL / poidsKg) * 100 : 0;
                                const intensityPctEnd = Math.min(100, Math.round(intensityFactor(endDeficitPct, nl) * 100));

                                return (
                                  <tr key={r.seg.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td style={{ padding: 8, fontWeight: 700 }}>{r.seg.label}</td>
                                    <td style={{ padding: 8, textAlign: "right" }}>
                                      {Math.floor(r.dureeMin / 60)}h{String(r.dureeMin % 60).padStart(2, "0")}
                                    </td>
                                    <td style={{ padding: 8, textAlign: "right", color: "var(--color-text-muted)" }}>
                                      {r.seg.temp}°C · {r.seg.humidite}%
                                    </td>
                                    <td style={{ padding: 8, textAlign: "right", color: "var(--color-primary)", fontWeight: 700 }}>
                                      {Math.round(r.sweatMlH)} ml/h
                                    </td>
                                    <td style={{ padding: 8, textAlign: "right" }}>{Math.round(r.sweatTotalMl)} ml</td>
                                    <td style={{ padding: 8, textAlign: "right" }}>
                                      {Math.round(ingestSeg)} ml
                                      <div className="text-[10px] text-[var(--color-text-muted)]">{Math.round(ingestSegPerH)} ml/h</div>
                                    </td>
                                    {nlParams.enabled && (
                                      <td style={{
                                        padding: 8,
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: intensityPctEnd < 80 ? "var(--color-danger)" : intensityPctEnd < 95 ? "#e6a833" : "var(--color-success)",
                                      }}>
                                        {intensityPctEnd} %
                                      </td>
                                    )}
                                  </tr>
                                );
                              });
                            })()}
                            <tr style={{ background: "var(--color-surface-2)", fontWeight: 800 }}>
                              <td style={{ padding: 8 }}>Total</td>
                              <td style={{ padding: 8, textAlign: "right" }}>
                                {Math.floor(totalDurationMin / 60)}h{String(totalDurationMin % 60).padStart(2, "0")}
                              </td>
                              <td style={{ padding: 8 }}></td>
                              <td style={{ padding: 8, textAlign: "right", color: "var(--color-primary)" }}>
                                {Math.round(avgSweatMlH)} ml/h
                              </td>
                              <td style={{ padding: 8, textAlign: "right" }}>{Math.round(totalSweatMl)} ml</td>
                              <td style={{ padding: 8, textAlign: "right" }}>{Math.round(actualIngestTotalMl)} ml</td>
                              {nlParams.enabled && <td style={{ padding: 8 }} />}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-2">
                        *Apport ingérable réparti proportionnellement à la sudation de chaque segment, capé à la tolérance personnelle.
                        {nlParams.enabled && <> †Intensité soutenable estimée en fin de segment (modèle non-linéaire). &lt; 80 % = forte dégradation de performance.</>}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ============ PRINT VIEW (anticipation) ============ */}
        {tab === "anticipation" && (() => {
          const poidsKg = toNum(pred.poids);
          const toleranceMlH = toNum(pred.tolerance) || 750;
          const extraReserveL = (reserve.hyperhydration ? 0.5 : 0) + (reserve.carbLoad ? 0.75 : 0);
          const lossThreshold25Pct = poidsKg * 0.025;
          const weightAt25 = poidsKg - lossThreshold25Pct;
          const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

          // Build per-segment results once for either mode (segments mode uses many, simple uses one virtual segment)
          const isSegments = predMode === "segments";

          // Simple-mode precomputations
          let simpleRecs: ReturnType<typeof hydrationRecs> | null = null;
          let simpleSweat: number | null = null;
          if (!isSegments && validForPred.length > 0) {
            const p = predictSweat(
              { temp: toNum(pred.temp), fc: toNum(pred.fc), humidite: toNum(pred.humidite), duree: toNum(pred.duree) },
              validForPred,
            );
            if (p) {
              simpleSweat = p.predicted;
              simpleRecs = hydrationRecs({
                sweatMlH: p.predicted,
                durationMin: toNum(pred.duree),
                weightKg: poidsKg,
                toleranceMlH,
              });
            }
          }

          // Multi-segment precomputations
          const segRows = isSegments ? segments.map((seg) => {
            const p = predictSweat(
              { temp: toNum(seg.temp), fc: toNum(seg.fc), humidite: toNum(seg.humidite), duree: toNum(seg.duree) },
              validForPred,
            );
            const dureeMin = toNum(seg.duree);
            const sweatMlH = p?.predicted ?? 0;
            const sweatTotalMl = (sweatMlH * dureeMin) / 60;
            return { seg, dureeMin, sweatMlH, sweatTotalMl };
          }) : [];
          const totalDurationMin = segRows.reduce((s, r) => s + r.dureeMin, 0);
          const totalSweatMl = segRows.reduce((s, r) => s + r.sweatTotalMl, 0);
          const totalDurationH = totalDurationMin / 60;
          const avgSweatMlH = totalDurationH > 0 ? totalSweatMl / totalDurationH : 0;
          const maxLossMlGlobal = poidsKg * 25;
          const idealIngestTotalMl = Math.max(0, totalSweatMl - maxLossMlGlobal);
          const idealIngestPerH = totalDurationH > 0 ? idealIngestTotalMl / totalDurationH : 0;
          const actualIngestPerH = Math.min(idealIngestPerH, toleranceMlH);
          const actualIngestTotalMl = actualIngestPerH * totalDurationH;
          const actualLossPct = poidsKg > 0 ? ((totalSweatMl - actualIngestTotalMl) / (poidsKg * 1000)) * 100 : 0;
          const naMinTotal = Math.round((actualIngestTotalMl / 1000) * 500);
          const naMaxTotal = Math.round((actualIngestTotalMl / 1000) * 1300);

          const cellTh: React.CSSProperties = {
            padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${printColor.line}`,
            fontSize: 10, fontWeight: 700, color: printColor.mut, textTransform: "uppercase", letterSpacing: ".05em",
          };
          const cellTd: React.CSSProperties = {
            padding: "6px 8px", borderBottom: `1px solid ${printColor.line}`, fontSize: 11,
          };

          return (
            <PrintReport
              kicker="Anticipation hydratation"
              title={isSegments ? "Stratégie multi-segments" : "Stratégie hydrique de course"}
              subtitle={`Édité le ${dateStr} · Profil ${poidsKg} kg · Tolérance ${toleranceMlH} ml/h${extraReserveL > 0 ? ` · Réserve pré-course +${extraReserveL.toFixed(2)} L` : ""}`}
            >
              {!isSegments && simpleRecs && (
                <>
                  <PrintH>Conditions estimées</PrintH>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    <PrintKpi label="Durée" value={`${pred.duree}`} unit="min" />
                    <PrintKpi label="Température" value={pred.temp} unit="°C" />
                    <PrintKpi label="Humidité" value={pred.humidite} unit="%" />
                    <PrintKpi label="FC moyenne" value={pred.fc} unit="bpm" />
                  </div>

                  <PrintH>Sudation prévue</PrintH>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    <PrintKpi label="Taux de sudation" value={Math.round(simpleSweat ?? 0)} unit="ml/h" accent={printColor.orange} />
                    <PrintKpi label="Pertes totales" value={(simpleRecs.totalSweatMl / 1000).toFixed(2)} unit="L" />
                    <PrintKpi label="Seuil 2,5 %" value={(lossThreshold25Pct).toFixed(2)} unit="L" sub={`${weightAt25.toFixed(1)} kg`} accent={printColor.red} />
                  </div>

                  <PrintH>Plan d&apos;hydratation</PrintH>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    <PrintKpi label="À ingérer / heure" value={Math.round(simpleRecs.actualIngestPerH)} unit="ml/h" />
                    <PrintKpi label="Volume total" value={(simpleRecs.actualIngestTotalMl / 1000).toFixed(2)} unit="L" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 6 }}>
                    <PrintKpi label="Sodium / heure" value={`${Math.round((simpleRecs.actualIngestPerH / 1000) * 500)}–${Math.round((simpleRecs.actualIngestPerH / 1000) * 1300)}`} unit="mg/h" accent="#2196f3" />
                    <PrintKpi label="Sodium total" value={`${Math.round((simpleRecs.actualIngestTotalMl / 1000) * 500)}–${Math.round((simpleRecs.actualIngestTotalMl / 1000) * 1300)}`} unit="mg" accent="#2196f3" />
                  </div>

                  {simpleRecs.exceedsTolerance && (
                    <PrintBox title="⚠ Apport théorique > tolérance digestive">
                      <div style={{ fontSize: 11, lineHeight: 1.55 }}>
                        Pour rester sous 2,5 %, il faudrait ingérer <b>{Math.round(simpleRecs.idealIngestPerH)} ml/h</b>,
                        au-delà de la tolérance déclarée (<b>{toleranceMlH} ml/h</b>).
                        Recommandation : rester à la tolérance ({Math.round(simpleRecs.actualIngestPerH)} ml/h).
                        Estimation théorique de déshydratation : ~{simpleRecs.actualLossPct.toFixed(1)} %.
                        En pratique, ce chiffre est auto-régulé (baisse d&apos;allure → baisse de sudation).
                      </div>
                    </PrintBox>
                  )}
                </>
              )}

              {isSegments && validForPred.length > 0 && (
                <>
                  <PrintH>Synthèse globale</PrintH>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    <PrintKpi label="Durée totale" value={`${Math.floor(totalDurationMin / 60)}h${String(totalDurationMin % 60).padStart(2, "0")}`} />
                    <PrintKpi label="Pertes totales" value={(totalSweatMl / 1000).toFixed(2)} unit="L" accent={printColor.orange} />
                    <PrintKpi label="Sudation moyenne" value={Math.round(avgSweatMlH)} unit="ml/h" accent={printColor.orange} />
                    <PrintKpi label="À ingérer total" value={(actualIngestTotalMl / 1000).toFixed(2)} unit="L" sub={`${Math.round(actualIngestPerH)} ml/h moy.`} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 6 }}>
                    <PrintKpi label="Sodium total" value={`${naMinTotal}–${naMaxTotal}`} unit="mg" accent="#2196f3" />
                    <PrintKpi label="Déshydratation finale (théo.)" value={`${actualLossPct.toFixed(1)}`} unit="%" accent={actualLossPct > 2.5 ? printColor.red : printColor.green} />
                  </div>

                  {actualLossPct > 2.5 && !reserve.hyperhydration && (
                    <PrintBox title="💧 Surhydratation pré-course recommandée">
                      <div style={{ fontSize: 11, lineHeight: 1.55 }}>
                        <b>800 ml d&apos;eau + 7 g de sel</b> (≈ 1 cuillère à café rase) dans les
                        <b> 2 h avant le départ</b>. Gain net : ~500 ml de réserve hydrique qui repousse le seuil
                        des 2,5 %. À tester en entraînement pour valider la tolérance digestive.
                      </div>
                    </PrintBox>
                  )}

                  {extraReserveL > 0 && (
                    <PrintBox title="✓ Réserves pré-course activées">
                      <div style={{ fontSize: 11 }}>
                        {reserve.hyperhydration && <span>· Surhydratation : <b>+500 ml</b><br /></span>}
                        {reserve.carbLoad && <span>· Surcharge glucidique : <b>+750 ml</b><br /></span>}
                        Total réserve : <b>+{extraReserveL.toFixed(2)} L</b>
                      </div>
                    </PrintBox>
                  )}

                  <PrintH>Détail par segment</PrintH>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
                    <thead>
                      <tr>
                        <th style={cellTh}>Segment</th>
                        <th style={{ ...cellTh, textAlign: "right" }}>Durée</th>
                        <th style={{ ...cellTh, textAlign: "right" }}>Conditions</th>
                        <th style={{ ...cellTh, textAlign: "right" }}>Sueur</th>
                        <th style={{ ...cellTh, textAlign: "right" }}>Pertes</th>
                        <th style={{ ...cellTh, textAlign: "right" }}>À ingérer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segRows.map((r) => {
                        const shareOfSweat = totalSweatMl > 0 ? r.sweatTotalMl / totalSweatMl : 0;
                        const ingestSeg = actualIngestTotalMl * shareOfSweat;
                        const ingestSegPerH = r.dureeMin > 0 ? (ingestSeg / r.dureeMin) * 60 : 0;
                        return (
                          <tr key={r.seg.id}>
                            <td style={{ ...cellTd, fontWeight: 700 }}>{r.seg.label}</td>
                            <td style={{ ...cellTd, textAlign: "right" }}>
                              {Math.floor(r.dureeMin / 60)}h{String(r.dureeMin % 60).padStart(2, "0")}
                            </td>
                            <td style={{ ...cellTd, textAlign: "right", color: printColor.mut }}>
                              {r.seg.temp}°C · {r.seg.humidite}% · {r.seg.fc} bpm
                            </td>
                            <td style={{ ...cellTd, textAlign: "right", color: printColor.orange, fontWeight: 700 }}>
                              {Math.round(r.sweatMlH)} ml/h
                            </td>
                            <td style={{ ...cellTd, textAlign: "right" }}>{Math.round(r.sweatTotalMl)} ml</td>
                            <td style={{ ...cellTd, textAlign: "right" }}>
                              {Math.round(ingestSeg)} ml
                              <span style={{ display: "block", fontSize: 9, color: printColor.mut }}>{Math.round(ingestSegPerH)} ml/h</span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: printColor.soft, fontWeight: 800 }}>
                        <td style={cellTd}>Total</td>
                        <td style={{ ...cellTd, textAlign: "right" }}>
                          {Math.floor(totalDurationMin / 60)}h{String(totalDurationMin % 60).padStart(2, "0")}
                        </td>
                        <td style={cellTd} />
                        <td style={{ ...cellTd, textAlign: "right", color: printColor.orange }}>
                          {Math.round(avgSweatMlH)} ml/h
                        </td>
                        <td style={{ ...cellTd, textAlign: "right" }}>{Math.round(totalSweatMl)} ml</td>
                        <td style={{ ...cellTd, textAlign: "right" }}>{Math.round(actualIngestTotalMl)} ml</td>
                      </tr>
                    </tbody>
                  </table>

                  <PrintBox title="Rappel — règle des 2,5 %">
                    <div style={{ fontSize: 11, lineHeight: 1.55 }}>
                      Au-delà de 2,5 % de déshydratation (
                      {lossThreshold25Pct.toFixed(2)} L / {weightAt25.toFixed(1)} kg pour cet athlète),
                      les performances chutent. Une auto-régulation se met en place :
                      allure réduite → moins de chaleur → sudation réduite. La déshydratation
                      finale réelle sera donc moindre que la projection linéaire, mais avec un
                      coût en performance.
                    </div>
                  </PrintBox>
                </>
              )}
            </PrintReport>
          );
        })()}
        </>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {viewing && (() => {
        const c = compute(viewing);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={() => setViewingId(null)}
          >
            <div
              className="card w-full max-w-2xl overflow-hidden"
              style={{ background: "var(--color-surface)", maxHeight: "92vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 flex justify-between items-center flex-wrap gap-2" style={{ background: "var(--color-dark)", color: "#fff" }}>
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-70" style={{ letterSpacing: ".1em" }}>
                    Détail du test
                  </div>
                  <div className="font-extrabold uppercase text-sm" style={{ fontFamily: "var(--font-display)" }}>
                    {dateLong(viewing.date)}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(viewing)} className="btn-primary btn-sm">✎ Modifier</button>
                  <button onClick={() => remove(viewing.id)} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                    Supprimer
                  </button>
                  <button onClick={() => setViewingId(null)} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>✕</button>
                </div>
              </div>

              {c.mlh != null && (
                <div className="px-5 py-3 flex items-baseline gap-3 flex-wrap" style={{ background: "rgba(255,69,1,0.06)", borderBottom: "1px solid var(--color-border)" }}>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-primary)]" style={{ letterSpacing: ".08em" }}>
                    Taux calculé
                  </span>
                  <span className="font-extrabold text-2xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                    {Math.round(c.mlh)} ml/h
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    soit {c.mlmin?.toFixed(1)} ml/min
                  </span>
                </div>
              )}

              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <Detail label="Type">{viewing.type}</Detail>
                <Detail label="Durée">{viewing.duree} min</Detail>
                <Detail label="FC moyenne">{viewing.fc || "—"} bpm</Detail>
                <Detail label="Poids avant">{viewing.poidsAvant || "—"} kg</Detail>
                <Detail label="Poids après">{viewing.poidsApres || "—"} kg</Detail>
                <Detail label="Δ Poids">
                  {viewing.poidsAvant && viewing.poidsApres
                    ? `${(toNum(viewing.poidsAvant) - toNum(viewing.poidsApres)).toFixed(2)} kg`
                    : "—"}
                </Detail>
                <Detail label="Eau ingérée">{viewing.eau || "—"} ml</Detail>
                <Detail label="Urine">{viewing.urine || "—"} ml</Detail>
                <Detail label="Température">{viewing.temp || "—"} °C</Detail>
                <Detail label="Humidité">{viewing.humidite || "—"} %</Detail>
                <Detail label="Vent">{viewing.vent || "—"} km/h</Detail>
                <Detail label="UV">{viewing.uv || "—"}</Detail>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============ Sub-components ============
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
        {label}
      </div>
      <div className="font-bold mt-0.5">{children}</div>
    </div>
  );
}

function ScatterCard({
  title,
  xLabel,
  data,
  color,
}: {
  title: string;
  xLabel: string;
  data: { x: number; y: number }[];
  color: string;
}) {
  // Simple linear regression for the trend line
  const trend = useMemo(() => {
    if (data.length < 2) return null;
    const n = data.length;
    const sumX = data.reduce((s, d) => s + d.x, 0);
    const sumY = data.reduce((s, d) => s + d.y, 0);
    const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
    const sumXX = data.reduce((s, d) => s + d.x * d.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const xs = data.map((d) => d.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (!isFinite(slope) || !isFinite(intercept) || minX === maxX) return null;
    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];
  }, [data]);

  return (
    <div className="card p-4">
      <div className="font-extrabold mb-2 text-sm">{title}</div>
      {data.length === 0 ? (
        <Empty>Aucune donnée.</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              label={{ value: xLabel, position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--color-text-muted)" }}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="ml/h"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              domain={["auto", "auto"]}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0]?.payload as { x: number; y: number } | undefined;
                if (!p) return null;
                return (
                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>{xLabel} : </span>
                      <b>{p.x}</b>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-muted)" }}>Sudation : </span>
                      <b style={{ color }}>{p.y} ml/h</b>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} fill={color} />
            {trend && (
              <Scatter
                data={trend}
                line={{ stroke: color, strokeWidth: 2, strokeDasharray: "4 4" }}
                shape={() => null as unknown as React.ReactElement}
              />
            )}
            <ReferenceLine y={0} stroke="var(--color-border)" />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
