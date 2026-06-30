"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

type CarbLoading = "none" | "1day" | "4days";
type Discipline = "trail" | "cap_route" | "cyclisme" | "triathlon" | "natation";

type Segment = {
  id: string;
  nom: string;
  discipline?: Discipline; // overrides plan discipline for this segment (useful for triathlon)
  km: string;
  dplus: string;
  dmoins: string;
  dureeMin: string;
  fcCible: string;
  puissanceW: string; // optional: for cycling — use this instead of FC when present
  cibleChoH: string;
};

type PacingPlan = {
  id: string;
  name: string;
  raceDate: string;
  discipline: Discipline;
  carbLoading: CarbLoading;
  rer: string;
  useProfile: boolean;
  cibleCho: string;
  segments: Segment[];
};

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  trail: "Trail",
  cap_route: "Course sur route",
  cyclisme: "Cyclisme",
  triathlon: "Triathlon",
  natation: "Natation",
};
const DISCIPLINE_ICONS: Record<Discipline, string> = {
  trail: "⛰",
  cap_route: "🏃",
  cyclisme: "🚴",
  triathlon: "🏊🚴🏃",
  natation: "🏊",
};

const WALL_THRESHOLD_G = 300;

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function glycogenReservesFor(sex: string | undefined, loading: CarbLoading): number {
  const isWoman = (sex || "").toLowerCase().includes("femme");
  if (loading === "4days") return isWoman ? 700 : 800;
  if (loading === "1day") return isWoman ? 550 : 600;
  return isWoman ? 400 : 450;
}

const CARB_LOADING_LABELS: Record<CarbLoading, string> = {
  none: "Aucune surcharge",
  "1day": "Surcharge 1 jour",
  "4days": "Surcharge 4 jours",
};

function keytelKcalPerMin(fc: number, weight: number, age: number, isWoman: boolean): number {
  if (fc <= 0 || weight <= 0 || age <= 0) return 0;
  if (isWoman) {
    return (-20.4022 + 0.4472 * fc - 0.1263 * weight + 0.074 * age) / 4.184;
  }
  return (-55.0969 + 0.6309 * fc + 0.1988 * weight + 0.2017 * age) / 4.184;
}

function choFractionFromRER(rer: number): number {
  if (!rer || rer < 0.7) return 0;
  if (rer >= 1.0) return 1;
  return (rer - 0.7) / 0.3;
}

// Linear interpolation of RER from segment FC (bpm) using the athlete's
// physiological data: SV1 / SV2 in bpm + RER values at SV1 and SV2.
// Outside the SV1-SV2 range, we extrapolate to baseline (0.80) at rest
// and to 1.00 at FCmax.
function rerFromPhysio(fc: number, physio: {
  fcmax?: number; sv1?: number; sv2?: number; rerSV1?: number; rerSV2?: number;
}): number | null {
  const sv1 = Number(physio.sv1) || 0;
  const sv2 = Number(physio.sv2) || 0;
  const rer1 = Number(physio.rerSV1) || 0;
  const rer2 = Number(physio.rerSV2) || 0;
  const fcmax = Number(physio.fcmax) || 0;
  if (!sv1 || !sv2 || !rer1 || !rer2 || sv1 >= sv2) return null;
  if (fc <= 0) return null;

  if (fc <= sv1) {
    // Between baseline (~0.80 at very low intensity) and rerSV1
    // Use SV1 / 2 as a rough "low endurance" reference
    const lowFC = Math.max(1, sv1 * 0.65);
    if (fc <= lowFC) return 0.80;
    const t = (fc - lowFC) / (sv1 - lowFC);
    return 0.80 + t * (rer1 - 0.80);
  }
  if (fc <= sv2) {
    const t = (fc - sv1) / (sv2 - sv1);
    return rer1 + t * (rer2 - rer1);
  }
  // Above SV2 → extrapolate to ~1.00 at FCmax (or cap if no FCmax)
  if (fcmax && fcmax > sv2) {
    const t = Math.min(1, (fc - sv2) / (fcmax - sv2));
    return rer2 + t * (1.0 - rer2);
  }
  return Math.min(1.0, rer2 + 0.02); // safe cap
}

function durationFromString(s: string): number {
  if (!s) return 0;
  const m = s.match(/^(\d+)\s*[hH:]\s*(\d+)/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  return toNum(s);
}

function formatDuration(minTotal: number): string {
  if (minTotal <= 0) return "—";
  const h = Math.floor(minTotal / 60);
  const m = Math.round(minTotal % 60);
  if (h === 0) return `${m} min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function parseGptTable(text: string): Segment[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const segments: Segment[] = [];
  for (const line of lines) {
    if (!line.includes("|") && !line.includes("\t")) continue;
    if (/^[\s|:-]+$/.test(line)) continue;
    const cells = line.includes("|")
      ? line.split("|").map((c) => c.trim()).filter((c) => c.length > 0)
      : line.split("\t").map((c) => c.trim());
    if (cells.length < 3) continue;
    if (cells.some((c) => /segment|distance|d\+|durée|fc|km/i.test(c)) && !cells.some((c) => /^\d+([.,]\d+)?$/.test(c))) continue;
    const nom = cells[0];
    const numericCells = cells.slice(1).map((c) => {
      const n = c.match(/-?\d+([.,]\d+)?/);
      return n ? parseFloat(n[0].replace(",", ".")) : null;
    });
    const km = String(numericCells[0] ?? "");
    const dplus = numericCells[1] != null && numericCells[1] >= 0 ? String(Math.round(numericCells[1])) : "";
    let dureeMin = "";
    let fcCible = "";
    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      if (!dureeMin && /\d+\s*h\s*\d{1,2}/i.test(cell)) dureeMin = String(durationFromString(cell));
      else if (!dureeMin && /\d+\s*min/i.test(cell)) dureeMin = String(durationFromString(cell));
      const fcMatch = cell.match(/\b(1[0-9]{2}|[8-9][0-9])\b/);
      if (!fcCible && fcMatch && /fc|bpm|cible/i.test(cells.join(" "))) fcCible = fcMatch[1];
    }
    if (!fcCible) {
      for (const n of numericCells) {
        if (n != null && n >= 80 && n <= 200 && n !== toNum(km) && n !== toNum(dplus)) {
          fcCible = String(Math.round(n));
          break;
        }
      }
    }
    if (!dureeMin) {
      for (const n of numericCells) {
        if (n != null && n >= 15 && n <= 1200 && n !== toNum(km) && n !== toNum(dplus) && n !== toNum(fcCible)) {
          dureeMin = String(Math.round(n));
          break;
        }
      }
    }
    if (toNum(km) === 0 && toNum(dureeMin) === 0) continue;
    segments.push({
      id: newId(),
      nom,
      km,
      dplus,
      dmoins: "",
      dureeMin,
      fcCible,
      puissanceW: "",
      cibleChoH: "",
    });
  }
  return segments;
}

const BLANK_SEGMENT = (): Segment => ({
  id: newId(),
  nom: "",
  km: "",
  dplus: "",
  dmoins: "",
  dureeMin: "",
  fcCible: "",
  puissanceW: "",
  cibleChoH: "",
});

// Power-based energy expenditure (validated for cycling).
// kcal = (kJ work output) / efficiency
// 1 W × 1h = 3.6 kJ work · efficiency = 0.24 (rule "kJ ≈ kcal" derives from this).
function powerKcalPerMin(powerW: number): number {
  if (powerW <= 0) return 0;
  // (W × 60 s/min) → J/min → /1000 → kJ/min → /0.24 efficiency → kJ total energy → ×0.239 kcal/kJ
  // Simplified: kcal/min = powerW × 0.06 × 0.239 / 0.24 ≈ powerW × 0.0598
  // Or equivalently: kcal/h ≈ powerW × 3.59
  return (powerW * 60 * 0.239) / (1000 * 0.24);
}

const GPT_LINK = "https://chatgpt.com/g/g-69b52fc02f54819192145abea341ee0e-nutriocus-strategie-de-pacing-course-trail";

export default function EnergyExpenditurePage() {
  const [profile] = useAthleteData<{
    sexe?: string;
    age?: number | string;
    poids?: number | string;
    tolGlucCAP?: number | string;
    fcmax?: number | string;
    sv1?: number | string;
    sv2?: number | string;
    rerSV1?: number | string;
    rerSV2?: number | string;
    vo2max?: number | string;
    // Discipline-specific lab tests (triathletes typically fill both).
    tests?: {
      cap?: { fcmax?: number | string; sv1?: number | string; sv2?: number | string; rerSV1?: number | string; rerSV2?: number | string; vo2max?: number | string; vo2SV1?: number | string; vo2SV2?: number | string };
      velo?: { fcmax?: number | string; sv1?: number | string; sv2?: number | string; rerSV1?: number | string; rerSV2?: number | string; vo2max?: number | string; vo2SV1?: number | string; vo2SV2?: number | string };
    };
  }>("profile", {});

  const [plans, setPlans, loaded] = useAthleteData<PacingPlan[]>("pacing_plans", []);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const current = plans.find((p) => p.id === currentId);
  const defaultTol = toNum(profile.tolGlucCAP) || 90;

  const updatePlan = (patch: Partial<PacingPlan>) => {
    if (!current) return;
    setPlans((prev) => prev.map((p) => (p.id === current.id ? { ...p, ...patch } : p)));
  };
  const updateSeg = (sid: string, patch: Partial<Segment>) => {
    if (!current) return;
    updatePlan({ segments: current.segments.map((s) => (s.id === sid ? { ...s, ...patch } : s)) });
  };
  const addSegment = () => {
    if (!current) return;
    updatePlan({ segments: [...current.segments, BLANK_SEGMENT()] });
  };
  const removeSegment = (sid: string) => {
    if (!current) return;
    updatePlan({ segments: current.segments.filter((s) => s.id !== sid) });
  };
  const newPlan = (discipline: Discipline = "trail") => {
    const hasPhysio = !!(toNum(profile.sv1) && toNum(profile.sv2) && toNum(profile.rerSV1) && toNum(profile.rerSV2));
    const p: PacingPlan = {
      id: newId(),
      name: "Nouvelle stratégie " + DISCIPLINE_LABELS[discipline],
      raceDate: today(),
      discipline,
      carbLoading: "none",
      rer: "0.88",
      useProfile: hasPhysio,
      cibleCho: String(defaultTol),
      segments: [BLANK_SEGMENT()],
    };
    setPlans((prev) => [...prev, p]);
    setCurrentId(p.id);
  };
  const deletePlan = () => {
    if (!current) return;
    if (!confirm("Supprimer ce plan de pacing ?")) return;
    setPlans((prev) => prev.filter((p) => p.id !== current.id));
    setCurrentId(null);
  };
  const importFromPaste = () => {
    if (!current) return;
    const parsed = parseGptTable(pasteText);
    if (parsed.length === 0) {
      alert("Aucun segment trouvé. Colle un tableau markdown ou tabulé (Segment | distance | D+ | durée | FC cible).");
      return;
    }
    updatePlan({ segments: parsed });
    setPasteText("");
    setPasteOpen(false);
  };

  // ============== COMPUTATIONS ==============
  const isWoman = (profile.sexe || "").toLowerCase().includes("femme");
  const poidsKg = toNum(profile.poids);
  const ageY = toNum(profile.age) || 30;

  const reserves = current ? glycogenReservesFor(profile.sexe, current.carbLoading) : 0;
  const planCibleCho = current ? toNum(current.cibleCho) || defaultTol : defaultTol;

  // Profile physio data for per-segment RER.
  // For triathletes the lab tests differ between CAP and Vélo, so we resolve
  // the active physio per-segment using the segment's discipline override
  // (falls back to plan discipline, then to profile primary fields).
  const hasPhysio = !!(toNum(profile.sv1) && toNum(profile.sv2) && toNum(profile.rerSV1) && toNum(profile.rerSV2));
  const useProfilePhysio = current?.useProfile && hasPhysio;
  const fallbackRer = current ? toNum(current.rer) || 0.88 : 0.88;

  function physioForDiscipline(disc?: Discipline) {
    const d = (disc || "").toLowerCase();
    const test =
      d === "cyclisme" ? profile.tests?.velo
      : d === "trail" || d === "cap_route" ? profile.tests?.cap
      : undefined;
    const pick = <K extends "fcmax" | "sv1" | "sv2" | "rerSV1" | "rerSV2">(k: K): number => {
      const v = test?.[k];
      if (v != null && v !== "") return toNum(v);
      return toNum(profile[k]);
    };
    return {
      fcmax: pick("fcmax"),
      sv1: pick("sv1"),
      sv2: pick("sv2"),
      rerSV1: pick("rerSV1"),
      rerSV2: pick("rerSV2"),
    };
  }

  // For zone labels in the summary panel (uses plan discipline as default).
  const physio = physioForDiscipline(current?.discipline);

  function rerForSegment(fc: number, segDiscipline?: Discipline): number {
    if (useProfilePhysio) {
      const p = physioForDiscipline(segDiscipline ?? current?.discipline);
      const r = rerFromPhysio(fc, p);
      if (r != null) return r;
    }
    return fallbackRer;
  }

  const enriched = useMemo(() => {
    if (!current) return [];
    return current.segments.map((s) => {
      const fc = toNum(s.fcCible);
      const power = toNum(s.puissanceW);
      const dur = toNum(s.dureeMin);
      // POWER-based estimation (preferred when available, esp. for cycling)
      // Falls back to Keytel HR-based formula
      const usePower = power > 0;
      const kcalPerMin = usePower
        ? powerKcalPerMin(power)
        : keytelKcalPerMin(fc, poidsKg, ageY, isWoman);
      const kcalTotal = Math.max(0, kcalPerMin * dur);
      const segDisc = s.discipline ?? current.discipline;
      const rer = rerForSegment(fc, segDisc);
      const choFrac = choFractionFromRER(rer);
      const kcalCho = kcalTotal * choFrac;
      const gChoOxidized = kcalCho / 4;
      const cibleChoHSeg = toNum(s.cibleChoH) || planCibleCho;
      const gChoIngested = (cibleChoHSeg * dur) / 60;
      const netGlyco = gChoOxidized - gChoIngested;
      const pente = toNum(s.km) > 0
        ? ((toNum(s.dplus) - toNum(s.dmoins)) / (toNum(s.km) * 1000)) * 100
        : 0;
      let zone = "—";
      const segPhysio = physioForDiscipline(segDisc);
      if (segPhysio.sv1 && segPhysio.sv2 && fc > 0) {
        if (fc < segPhysio.sv1) zone = "< SV1";
        else if (fc < segPhysio.sv2) zone = "SV1-SV2";
        else zone = "> SV2";
      }
      return {
        ...s,
        kcalPerMin: Math.round(kcalPerMin * 10) / 10,
        kcalTotal: Math.round(kcalTotal),
        kcalCho: Math.round(kcalCho),
        gChoOxidized: Math.round(gChoOxidized * 10) / 10,
        gChoIngested: Math.round(gChoIngested * 10) / 10,
        netGlyco: Math.round(netGlyco * 10) / 10,
        cibleChoHSeg,
        pente: Math.round(pente * 10) / 10,
        rer: Math.round(rer * 100) / 100,
        choFracPct: Math.round(choFrac * 100),
        usePower,
        zone,
        dur,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, poidsKg, ageY, isWoman, planCibleCho, useProfilePhysio, fallbackRer, physio.sv1, physio.sv2, physio.rerSV1, physio.rerSV2, physio.fcmax]);

  const depletionChart = useMemo(() => {
    if (!enriched.length || reserves === 0) return [];
    const out: { d: string; glyco: number; minutes: number }[] = [];
    let cum = reserves;
    let cumMin = 0;
    out.push({ d: "Départ", glyco: cum, minutes: 0 });
    for (const s of enriched) {
      cum -= s.netGlyco;
      cumMin += s.dur;
      const label = s.nom && s.nom.length < 22 ? s.nom : formatDuration(cumMin);
      out.push({ d: label, glyco: Math.round(cum * 10) / 10, minutes: cumMin });
    }
    return out;
  }, [enriched, reserves]);

  const totals = useMemo(() => {
    if (!enriched.length) return null;
    const totKcal = enriched.reduce((s, e) => s + e.kcalTotal, 0);
    const totKcalCho = enriched.reduce((s, e) => s + e.kcalCho, 0);
    const totGChoOxi = enriched.reduce((s, e) => s + e.gChoOxidized, 0);
    const totGChoIng = enriched.reduce((s, e) => s + e.gChoIngested, 0);
    const totMin = enriched.reduce((s, e) => s + e.dur, 0);
    const totH = totMin / 60;
    const glycoEnd = reserves - enriched.reduce((s, e) => s + e.netGlyco, 0);
    const reachesWall = depletionChart.some((p) => p.glyco < WALL_THRESHOLD_G);
    const wallAt = depletionChart.find((p) => p.glyco < WALL_THRESHOLD_G);
    const minGChoNeeded = Math.max(0, totGChoOxi - (reserves - WALL_THRESHOLD_G));
    const minGChoPerH = totH > 0 ? minGChoNeeded / totH : 0;

    return {
      totKcal,
      totKcalCho,
      totGChoOxi,
      totGChoIng,
      totMin,
      totH,
      glycoEnd: Math.round(glycoEnd * 10) / 10,
      reachesWall,
      wallAt,
      minGChoNeeded: Math.ceil(minGChoNeeded),
      minGChoPerH: Math.ceil(minGChoPerH),
    };
  }, [enriched, reserves, depletionChart]);

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Dépenses énergétiques en course" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  // ============== LIST VIEW ==============
  if (!current) {
    return (
      <div>
        <PageHeader
          kicker="Anticiper tes courses"
          title="Dépenses énergétiques en course"
          desc="Estimation segment par segment, déplétion du glycogène en temps réel, et minimum d'apport CHO pour ne pas rencontrer le mur."
          action={
            <a href={GPT_LINK} target="_blank" rel="noopener noreferrer" className="btn-dark btn-sm">
              🤖 GPT Trail Pacing
            </a>
          }
        />

        <HelpSection title="ℹ️ Dépenses en course — pourquoi et comment remplir un nouveau plan ?">
          <HelpBlock icon="🎯" title="Pourquoi déterminer cela">
            <p>
              Connaître ta <b>dépense énergétique segment par segment</b> permet de :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Anticiper le <b>moment du « mur »</b> (épuisement du glycogène ≈ 300 g restants)</li>
              <li>Définir l&apos;<b>apport CHO minimum</b> pour tenir l&apos;objectif</li>
              <li>Calibrer la <b>stratégie ravitaillement</b> (combien manger, où, quand)</li>
              <li>Éviter le <b>surdosage</b> (et l&apos;inconfort GI) ou le <b>sous-dosage</b> (et la défaillance)</li>
            </ul>
          </HelpBlock>
          <HelpBlock icon="📝" title="Comment créer un nouveau plan">
            <ul className="list-disc pl-5 space-y-1">
              <li>Clique <b>+ Nouveau plan</b> et renseigne nom + date de course</li>
              <li>Choisis ta <b>discipline</b> (trail / route / vélo / triathlon)</li>
              <li>Renseigne les <b>réserves de glycogène</b> selon ta préparation :
                <ul className="list-disc pl-5 mt-1">
                  <li>Pas de surcharge : 450/400 g (H/F)</li>
                  <li>Surcharge 1 jour : 600/550 g</li>
                  <li>Surcharge 4 jours (recharge classique) : 800/700 g</li>
                </ul>
              </li>
              <li><b>Découpe la course en segments</b> (montées, descentes, ravitos, plats) — chaque segment a sa propre distance, D+, allure cible, FC cible</li>
              <li>La plateforme calcule pour chaque segment : kcal dépensés, CHO oxydés, % du glycogène restant, et signale le « mur » si tu passes sous 300 g</li>
              <li>Ajoute tes <b>apports prévus</b> (gels, boissons) → vérification que le bilan CHO tient</li>
            </ul>
          </HelpBlock>
          <HelpBlock icon="🔬" title="Comment c'est utilisé ensuite">
            <ul className="list-disc pl-5 space-y-1">
              <li>Le plan alimente la <b>stratégie de course</b> (frise chronologique Mont Ventoux-style)</li>
              <li>Il est <b>imprimable en PDF</b> pour ton sac de course</li>
              <li>Comparé après course à l&apos;<b>analyse post-course</b> pour ajuster les prochains plans</li>
            </ul>
          </HelpBlock>
        </HelpSection>

        <div className="card p-4 mb-4">
          <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2" style={{ letterSpacing: ".06em" }}>
            + Nouveau plan par discipline
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(["trail", "cap_route", "cyclisme", "natation", "triathlon"] as Discipline[]).map((d) => (
              <button
                key={d}
                onClick={() => newPlan(d)}
                className="card p-3 text-left cursor-pointer hover:-translate-y-0.5 transition"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <div className="text-xl mb-1">{DISCIPLINE_ICONS[d]}</div>
                <div className="font-bold text-sm">{DISCIPLINE_LABELS[d]}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {d === "cyclisme" ? "Puissance + FC" : d === "natation" ? "FC + cadence" : "FC"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="font-extrabold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Aucun plan créé
            </div>
            <div className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
              Sélectionne une discipline ci-dessus pour créer ton premier plan. Le calcul s&apos;adapte automatiquement (puissance pour le vélo, FC pour la course/trail/natation).
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map((p) => {
              const disc = p.discipline || "trail";
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentId(p.id)}
                  className="card p-4 text-left cursor-pointer hover:-translate-y-0.5 transition"
                  style={{ borderLeft: "5px solid var(--color-primary)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{DISCIPLINE_ICONS[disc]}</span>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                      {DISCIPLINE_LABELS[disc]}
                    </span>
                  </div>
                  <div className="font-extrabold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    {p.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {p.segments.length} segment{p.segments.length > 1 ? "s" : ""} · cible {p.cibleCho || defaultTol} g/h · {CARB_LOADING_LABELS[p.carbLoading]}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============== PLAN VIEW ==============
  return (
    <div>
      <button onClick={() => setCurrentId(null)} className="btn-ghost btn-sm mb-3">
        ← Mes plans de pacing
      </button>

      <PageHeader
        kicker="Anticiper tes courses"
        title={current.name}
        action={
          <div className="flex gap-1.5 flex-wrap">
            <a href={GPT_LINK} target="_blank" rel="noopener noreferrer" className="btn-dark btn-sm">
              🤖 GPT
            </a>
            <button onClick={() => setPasteOpen((o) => !o)} className="btn-ghost btn-sm">
              📋 Coller plan GPT
            </button>
            <button onClick={deletePlan} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
              Supprimer
            </button>
          </div>
        }
      />

      {/* Plan meta */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Nom du plan">
            <input className="input" value={current.name} onChange={(e) => updatePlan({ name: e.target.value })} />
          </Field>
          <Field label="Date course">
            <input type="date" className="input" value={current.raceDate} onChange={(e) => updatePlan({ raceDate: e.target.value })} />
          </Field>
          <Field label="Discipline">
            <select
              className="input"
              value={current.discipline || "trail"}
              onChange={(e) => updatePlan({ discipline: e.target.value as Discipline })}
            >
              {(["trail", "cap_route", "cyclisme", "natation", "triathlon"] as Discipline[]).map((d) => (
                <option key={d} value={d}>{DISCIPLINE_ICONS[d]} {DISCIPLINE_LABELS[d]}</option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <InfoTooltip
                label="Surcharge en glucides"
                content={
                  <>
                    <b>Stratégie de pré-charge glycogénique</b> :
                    <br />• <b>Aucune</b> = réserves de base (450g H / 400g F)
                    <br />• <b>1 jour</b> = surcharge modérée (600g H / 550g F)
                    <br />• <b>4 jours</b> = surcharge complète (800g H / 700g F)
                  </>
                }
              />
            }
          >
            <select className="input" value={current.carbLoading} onChange={(e) => updatePlan({ carbLoading: e.target.value as CarbLoading })}>
              <option value="none">Aucune surcharge</option>
              <option value="1day">Surcharge 1 jour</option>
              <option value="4days">Surcharge 4 jours</option>
            </select>
          </Field>
          <Field
            label={
              <InfoTooltip
                label={hasPhysio ? "Source du RER" : "RER moyen (manuel)"}
                content={
                  <>
                    <b>Quotient respiratoire (RER)</b> détermine la part d&apos;énergie issue des glucides.
                    <br />• <b>0,80</b> = 33 % glucides (endurance basse)
                    <br />• <b>0,88</b> = 60 % glucides (endurance ≈ SV1)
                    <br />• <b>0,93</b> = 77 % glucides (tempo, SV1-SV2)
                    <br />• <b>0,97</b> = 90 % glucides (proche SV2)
                    <br /><br />
                    {hasPhysio
                      ? "Avec ton profil physiologique renseigné, le RER est recalculé pour chaque segment en fonction de sa FC cible (zone < SV1, SV1-SV2, > SV2)."
                      : "Renseigne SV1, SV2 et RER à SV1/SV2 dans Mon profil pour avoir un calcul personnalisé par segment."}
                  </>
                }
              />
            }
          >
            {hasPhysio ? (
              <div>
                <select
                  className="input"
                  value={current.useProfile ? "auto" : "manual"}
                  onChange={(e) => updatePlan({ useProfile: e.target.value === "auto" })}
                >
                  <option value="auto">🎯 Auto (mon profil physiologique)</option>
                  <option value="manual">✏ Manuel (RER unique)</option>
                </select>
                {!current.useProfile && (
                  <input
                    className="input mt-1"
                    value={current.rer}
                    onChange={(e) => updatePlan({ rer: e.target.value })}
                    placeholder="0.88"
                  />
                )}
              </div>
            ) : (
              <input className="input" value={current.rer} onChange={(e) => updatePlan({ rer: e.target.value })} />
            )}
          </Field>
          <Field
            label={
              <InfoTooltip
                label="Cible CHO par défaut (g/h)"
                content={<>Tolérance moyenne (modifiable par segment dans le tableau). Pré-rempli depuis ton profil ({defaultTol} g/h).</>}
              />
            }
          >
            <input className="input" value={current.cibleCho} onChange={(e) => updatePlan({ cibleCho: e.target.value })} />
          </Field>
          <div className="text-xs text-[var(--color-text-muted)] flex flex-col justify-end pb-1">
            <div>📦 <b>Réserves : {reserves} g</b></div>
            <div className="text-[10px]">
              ({CARB_LOADING_LABELS[current.carbLoading]} · {isWoman ? "Femme" : "Homme"})
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] flex flex-col justify-end pb-1">
            {useProfilePhysio ? (
              <>
                <div>🎯 <b>RER auto par segment</b></div>
                <div className="text-[10px]">
                  Calculé via SV1 ({physio.sv1}), SV2 ({physio.sv2}), RER SV1/SV2 ({physio.rerSV1}/{physio.rerSV2})
                </div>
              </>
            ) : (
              <>
                <div>🔥 <b>{Math.round(choFractionFromRER(fallbackRer) * 100)} % glucides</b></div>
                <div className="text-[10px]">RER fixe {fallbackRer}{hasPhysio ? "" : " · ⚠ profil physio non renseigné"}</div>
              </>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] flex flex-col justify-end pb-1">
            <div>🧱 <b>Mur à {WALL_THRESHOLD_G} g</b></div>
            <div className="text-[10px]">seuil critique de glycogène</div>
          </div>
        </div>
      </div>

      {/* Paste GPT */}
      {pasteOpen && (
        <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-dark)" }}>
          <div className="text-xs text-[var(--color-text-muted)] mb-2">
            Colle ici la sortie du GPT (tableau markdown ou tabulé) avec : <b>Segment | distance | D+ | durée | FC cible</b>.
          </div>
          <textarea
            className="input"
            style={{ minHeight: 160, resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`| Segment | Distance (km) | D+ (m) | Durée | FC cible |
| Départ → Col 1 | 7.2 | 380 | 1h05 | 145 |`}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setPasteOpen(false)} className="btn-ghost btn-sm">Annuler</button>
            <button onClick={importFromPaste} className="btn-primary btn-sm">Remplacer les segments</button>
          </div>
        </div>
      )}

      {/* KPI top */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Kpi label="Dépense totale" value={totals.totKcal.toLocaleString("fr-FR")} unit="kcal" color="var(--color-primary)" />
          <Kpi
            label="Min CHO total"
            value={totals.minGChoNeeded}
            unit="g"
            note={totals.minGChoNeeded > 0 ? "pour ne pas toucher le mur" : "réserves suffisantes"}
            color={totals.minGChoNeeded > 0 ? "var(--color-primary)" : "var(--color-success)"}
          />
          <Kpi
            label="Min CHO par heure"
            value={totals.minGChoPerH}
            unit="g/h"
            note={`sur ${totals.totH.toFixed(1)} h`}
            color={totals.minGChoPerH > defaultTol ? "var(--color-danger)" : "var(--color-primary)"}
          />
          <Kpi
            label="Glycogène final"
            value={Math.round(totals.glycoEnd)}
            unit="g"
            note={totals.glycoEnd < WALL_THRESHOLD_G ? "⚠ sous le mur" : "OK"}
            color={totals.glycoEnd >= WALL_THRESHOLD_G ? "var(--color-success)" : "var(--color-danger)"}
          />
        </div>
      )}

      {/* Glycogen depletion chart */}
      {depletionChart.length > 1 && (
        <div className="card p-4 mb-4">
          <div className="font-extrabold mb-2 text-sm" style={{ fontFamily: "var(--font-display)" }}>
            📉 Déplétion du glycogène ({reserves} g réserves · mur {WALL_THRESHOLD_G} g)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={depletionChart} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} domain={[0, Math.ceil(reserves / 100) * 100]} />
              <Tooltip
                formatter={(v: number) => [`${v} g`, "Glycogène restant"]}
                labelFormatter={(label) => `Après ${label}`}
              />
              <ReferenceLine
                y={WALL_THRESHOLD_G}
                stroke="var(--color-danger)"
                strokeDasharray="4 4"
                label={{ value: `Mur ${WALL_THRESHOLD_G} g`, fill: "var(--color-danger)", fontSize: 10, position: "insideTopRight" }}
              />
              <Line type="monotone" dataKey="glyco" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-primary)" }} />
            </LineChart>
          </ResponsiveContainer>
          {totals?.reachesWall && totals.wallAt && (
            <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}>
              🚨 <b>Mur atteint à : {totals.wallAt.d}</b> ({totals.wallAt.glyco} g de glycogène restant).
              Augmente l&apos;apport CHO sur les segments précédents (colonne &laquo; Cible CHO/h &raquo; du tableau).
            </div>
          )}
          {!totals?.reachesWall && totals && totals.glycoEnd >= WALL_THRESHOLD_G && (
            <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(95,140,10,0.10)", color: "var(--color-success)" }}>
              ✅ <b>Stratégie viable</b> : glycogène final {Math.round(totals.glycoEnd)} g (au-dessus du mur). Tu peux exécuter cette stratégie sans risque énergétique.
            </div>
          )}
        </div>
      )}

      {/* Min CHO analysis */}
      {totals && totals.minGChoNeeded > 0 && (
        <div className="card p-4 mb-4" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            🎯 Apport CHO minimum pour ne pas toucher le mur
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-primary)" }}>
              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                Minimum par heure
              </div>
              <div className="font-extrabold text-2xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                {totals.minGChoPerH} g/h
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-dark)" }}>
              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                Minimum total sur la course
              </div>
              <div className="font-extrabold text-2xl" style={{ color: "var(--color-dark)", fontFamily: "var(--font-display)" }}>
                {totals.minGChoNeeded} g
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--color-surface-2)" }}>
              <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                Marge vs ta tolérance
              </div>
              <div
                className="font-extrabold text-2xl"
                style={{
                  color: totals.minGChoPerH > defaultTol ? "var(--color-danger)" : "var(--color-success)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {totals.minGChoPerH > defaultTol ? "+" : "−"}{Math.abs(totals.minGChoPerH - defaultTol)} g/h
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Ta tolérance : {defaultTol} g/h
              </div>
            </div>
          </div>
          {totals.minGChoPerH > defaultTol && (
            <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}>
              🚨 <b>Minimum requis ({totals.minGChoPerH} g/h) supérieur à ta tolérance actuelle ({defaultTol} g/h)</b>.
              Options : travailler la tolérance glucidique en amont, faire une surcharge plus complète, ou réduire l&apos;intensité cible.
            </div>
          )}
        </div>
      )}

      {/* Segments table */}
      <div className="card overflow-auto mb-4">
        <table className="table" style={{ minWidth: 1050 }}>
          <thead>
            <tr>
              <th>Segment</th>
              <th>KM</th>
              <th>D+</th>
              <th>D−</th>
              <th>Pente</th>
              <th>Durée</th>
              <th>FC</th>
              <th title="Puissance moyenne (W) — utilisée prioritairement à la FC pour les cyclistes">Puiss. (W)</th>
              <th title="RER calculé pour la FC du segment">RER</th>
              <th>kcal</th>
              <th title="Glucides oxydés sur le segment (= kcal × % CHO du RER)">CHO oxydés</th>
              <th>
                Cible CHO/h
                <br />
                <span className="text-[9px] font-normal text-[var(--color-text-muted)]">vide = {planCibleCho}</span>
              </th>
              <th title="Glucides ingérés au taux cible">CHO ingérés</th>
              <th title="Glycogène consommé net = oxydé − ingéré">Net glyco</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((s) => (
              <tr key={s.id}>
                <td><input className="input" style={{ minWidth: 130 }} value={s.nom} onChange={(e) => updateSeg(s.id, { nom: e.target.value })} placeholder="Départ → Col 1" /></td>
                <td><input className="input" style={{ width: 55 }} value={s.km} onChange={(e) => updateSeg(s.id, { km: e.target.value })} /></td>
                <td><input className="input" style={{ width: 55 }} value={s.dplus} onChange={(e) => updateSeg(s.id, { dplus: e.target.value })} /></td>
                <td><input className="input" style={{ width: 55 }} value={s.dmoins} onChange={(e) => updateSeg(s.id, { dmoins: e.target.value })} /></td>
                <td style={{ color: s.pente > 5 ? "var(--color-danger)" : s.pente < -5 ? "var(--color-success)" : "var(--color-text-muted)", fontWeight: 600 }}>
                  {s.pente !== 0 ? (s.pente > 0 ? "+" : "") + s.pente + " %" : "—"}
                </td>
                <td><input className="input" style={{ width: 55 }} value={s.dureeMin} onChange={(e) => updateSeg(s.id, { dureeMin: e.target.value })} /></td>
                <td><input className="input" style={{ width: 55 }} value={s.fcCible} onChange={(e) => updateSeg(s.id, { fcCible: e.target.value })} /></td>
                <td>
                  <input
                    className="input"
                    style={{ width: 60 }}
                    value={s.puissanceW}
                    onChange={(e) => updateSeg(s.id, { puissanceW: e.target.value })}
                    placeholder={current?.discipline === "cyclisme" || current?.discipline === "triathlon" ? "180" : ""}
                    title="Puissance moyenne (W) — prioritaire sur la FC quand renseignée"
                  />
                </td>
                <td
                  style={{ fontWeight: 600, color: "var(--color-text-muted)" }}
                  title={`${s.usePower ? "Calcul puissance (W)" : `${s.choFracPct}% CHO oxydés à RER ${s.rer}${s.zone !== "—" ? ` · ${s.zone}` : ""}`}`}
                >
                  {s.rer > 0 ? (
                    <span>
                      {s.rer.toFixed(2)}
                      <br />
                      <span className="text-[9px]">{s.choFracPct}% CHO{s.zone !== "—" ? ` · ${s.zone}` : ""}</span>
                    </span>
                  ) : "—"}
                </td>
                <td
                  style={{ fontWeight: 800, color: "var(--color-primary)" }}
                  title={s.usePower ? "Calcul puissance (W → kcal)" : "Calcul FC (formule Keytel)"}
                >
                  {s.kcalTotal > 0 ? s.kcalTotal : "—"}
                  {s.usePower && <span className="text-[9px] block" style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>via W</span>}
                </td>
                <td>{s.gChoOxidized > 0 ? `${s.gChoOxidized.toFixed(0)} g` : "—"}</td>
                <td>
                  <input
                    className="input"
                    style={{ width: 70 }}
                    value={s.cibleChoH}
                    onChange={(e) => updateSeg(s.id, { cibleChoH: e.target.value })}
                    placeholder={String(planCibleCho)}
                  />
                </td>
                <td style={{ color: "var(--color-success)", fontWeight: 600 }}>{s.gChoIngested > 0 ? `${s.gChoIngested.toFixed(0)} g` : "—"}</td>
                <td style={{ fontWeight: 700, color: s.netGlyco > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {s.netGlyco !== 0 ? (s.netGlyco > 0 ? "−" : "+") + Math.abs(s.netGlyco).toFixed(0) + " g" : "0"}
                </td>
                <td>
                  <button onClick={() => removeSegment(s.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr style={{ background: "var(--color-surface-2)", fontWeight: 800 }}>
                <td>TOTAL</td>
                <td colSpan={4}></td>
                <td>{formatDuration(totals.totMin)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td style={{ color: "var(--color-primary)" }}>{totals.totKcal.toLocaleString("fr-FR")}</td>
                <td>{Math.round(totals.totGChoOxi)} g</td>
                <td style={{ color: "var(--color-primary)", textAlign: "center" }} title="Cible CHO/h moyenne, pondérée par la durée des segments">
                  ⌀ {totals.totH > 0 ? Math.round(totals.totGChoIng / totals.totH) : 0} g/h
                </td>
                <td style={{ color: "var(--color-success)" }}>{Math.round(totals.totGChoIng)} g</td>
                <td style={{ color: totals.glycoEnd < WALL_THRESHOLD_G ? "var(--color-danger)" : "var(--color-success)" }}>
                  {Math.round(reserves - totals.glycoEnd)} g
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button onClick={addSegment} className="btn-ghost btn-sm">+ Ajouter un segment</button>
        </div>
      </div>

      {/* Context */}
      <div className="text-[10px] text-[var(--color-text-muted)] mt-2 px-1">
        Calcul basé sur ton profil : {profile.sexe || "—"} · {poidsKg || "—"} kg · {ageY || "—"} ans
        {hasPhysio ? ` · FCmax ${physio.fcmax} · SV1 ${physio.sv1} · SV2 ${physio.sv2} · RER SV1/SV2 ${physio.rerSV1}/${physio.rerSV2}` : ""}.
        <br />
        ⓘ Formule Keytel (2005, basée FC) pour les kcal · si une puissance (W) est renseignée sur un segment, on utilise <b>kcal = W × 3,6 × heures</b> (plus précis pour le vélo) · CHO = (RER−0,7) / 0,3 × kcal totales · réserves selon la stratégie de pré-charge glycogénique.
        {useProfilePhysio && " · RER calculé par segment via interpolation FC ↔ SV1/SV2."}
      </div>
    </div>
  );
}
