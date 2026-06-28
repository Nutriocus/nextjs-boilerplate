"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAthleteData } from "@/lib/athlete-storage";
import { supabase } from "@/lib/supabase";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PrintReport, PrintH, PrintButton, PrintKpi } from "@/components/ui/PrintReport";
import { PRODUCTS_CATALOG, Product } from "@/lib/products-catalog";

// ============================================================
// TYPES
// ============================================================
type Line = {
  id: string;
  mode: "db" | "manual";
  key?: string;
  name?: string;
  g?: number;
  hydr?: number;
  s?: number;
  c?: number;
  r?: string;
  qty: number | string;
};

type TolDiscipline = "Course" | "Trail" | "Cyclisme" | "Triathlon";

type Strategy = {
  id: string;
  name: string;
  duree: number | string;
  poids: number | string;
  lines: Line[];
  tolDiscipline?: TolDiscipline;
};

const TOL_DISCIPLINES: TolDiscipline[] = ["Course", "Trail", "Cyclisme", "Triathlon"];
const TOL_DISCIPLINE_ICON: Record<TolDiscipline, string> = {
  Course: "🏃",
  Trail: "⛰️",
  Cyclisme: "🚴",
  Triathlon: "🏊🚴🏃",
};

// Minimal shape of a tolerance test (from the `tests` storage key).
type ToleranceTest = {
  discipline: TolDiscipline;
  type: "glucides" | "hydrique";
  valeur: number | string;
  ressenti: "bien" | "moyen" | "mauvais" | "indetermine";
};

function maxToleranceFor(
  tests: ToleranceTest[],
  type: "glucides" | "hydrique",
  discipline: TolDiscipline,
): number | null {
  const xs = tests
    .filter((t) => t.type === type && t.ressenti === "bien" && t.discipline === discipline)
    .map((t) => {
      const n = parseFloat(String(t.valeur).replace(",", "."));
      return isNaN(n) ? 0 : n;
    });
  return xs.length ? Math.max(...xs) : null;
}

type RacePlanSegment = {
  nom: string;
  km: number | string;
  heure: string;
  temps: string;
  contenu: string[];
};

type Discipline = "course" | "trail" | "cyclisme" | "triathlon";

type TriPhaseType = "natation" | "T1" | "cyclisme" | "T2" | "course";

type TriPhase = {
  type: TriPhaseType;
  km: number | string;
  dplus: number | string;
  temps: string;
  choPerH: number | string;
  hydratationPerH: number | string;
  sodiumPerH: number | string;
  cafeineTotal?: number | string;  // mg total over the phase (caffeine is dose-cumulative)
  contenu: string[];
};

type RacePlan = {
  id: string;
  name: string;
  km: number | string;
  dplus: number | string;
  objectif: string;
  choPerH: number | string;
  hydratationPerH: number | string;
  sodiumPerH?: number | string;   // mg/h — optional for back-compat
  cafeineTotal?: number | string;  // mg total over the whole race (caffeine is dose-cumulative, not per-hour)
  avantCourse: string[];
  segments: RacePlanSegment[];
  discipline?: Discipline;
  phases?: TriPhase[];
};

const DISCIPLINE_LABEL: Record<Discipline, string> = {
  course: "Course à pied",
  trail: "Trail",
  cyclisme: "Cyclisme",
  triathlon: "Triathlon",
};

const DISCIPLINE_ICON: Record<Discipline, string> = {
  course: "🏃",
  trail: "⛰️",
  cyclisme: "🚴",
  triathlon: "🏊🚴🏃",
};

const TRI_PHASE_META: Record<TriPhaseType, {
  label: string;
  icon: string;
  hasDistance: boolean;
  hasDplus: boolean;
}> = {
  natation: { label: "Natation", icon: "🏊", hasDistance: true, hasDplus: false },
  T1:       { label: "Transition 1 (T1)", icon: "🔄", hasDistance: false, hasDplus: false },
  cyclisme: { label: "Cyclisme", icon: "🚴", hasDistance: true, hasDplus: true },
  T2:       { label: "Transition 2 (T2)", icon: "🔄", hasDistance: false, hasDplus: false },
  course:   { label: "Course à pied", icon: "🏃", hasDistance: true, hasDplus: true },
};

function defaultTriPhases(): TriPhase[] {
  return [
    { type: "natation", km: "", dplus: "", temps: "", choPerH: 0,  hydratationPerH: 0,   sodiumPerH: 0,   contenu: ["Gel ~5 min avant la sortie d'eau (optionnel longue distance)"] },
    { type: "T1",       km: "", dplus: "", temps: "", choPerH: 0,  hydratationPerH: 0,   sodiumPerH: 0,   contenu: ["Gorgée boisson en sortant de la combinaison"] },
    { type: "cyclisme", km: "", dplus: "", temps: "", choPerH: 80, hydratationPerH: 600, sodiumPerH: 500, contenu: ["Bidon iso 90g CHO / 750ml", "1 gel toutes les 30 min"] },
    { type: "T2",       km: "", dplus: "", temps: "", choPerH: 0,  hydratationPerH: 0,   sodiumPerH: 0,   contenu: ["Gorgée d'eau + gel posé sur la table"] },
    { type: "course",   km: "", dplus: "", temps: "", choPerH: 60, hydratationPerH: 500, sodiumPerH: 500, contenu: ["1 gel tous les 4-5 km", "Eau + cola au ravito"] },
  ];
}

const newId = () => Math.random().toString(36).slice(2, 9);

/** Move item at `from` by `delta` positions (e.g. -1 for up, +1 for down). */
function moveItem<T>(arr: T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// ============================================================
// SHARED HELPERS
// ============================================================
function ratioFromString(r: string | undefined): number {
  if (!r) return 0;
  const t = String(r).split(":");
  if (t.length < 2) return 0;
  const x = parseFloat(t[1].replace(",", "."));
  return isNaN(x) ? 0 : x;
}

function resolveProduct(line: Line, all: Product[]): { name: string; g: number; s: number; c: number; hydr: number; r: string } | null {
  if (line.mode === "manual") {
    return {
      name: line.name || "Produit perso",
      g: toNum(line.g),
      s: toNum(line.s),
      c: toNum(line.c),
      hydr: toNum(line.hydr),
      r: line.r || "",
    };
  }
  const found = all.find((p) => p.m + "|" + p.n === line.key);
  if (!found) return null;
  return {
    name: found.m + " · " + found.n,
    g: found.g,
    s: found.s,
    c: found.c,
    hydr: line.hydr != null ? toNum(line.hydr) : found.t === "Boisson" ? 500 : 0,
    r: found.r,
  };
}

function computeTotals(s: Strategy, all: Product[]) {
  let gTot = 0, naTot = 0, cafTot = 0, hydrTot = 0;
  let weightedRatio = 0, totalG = 0;
  s.lines.forEach((l) => {
    const r = resolveProduct(l, all);
    if (!r) return;
    const qty = toNum(l.qty);
    gTot += r.g * qty;
    naTot += r.s * qty;
    cafTot += r.c * qty;
    hydrTot += r.hydr * qty;
    weightedRatio += r.g * qty * ratioFromString(r.r);
    totalG += r.g * qty;
  });
  const dur = toNum(s.duree) || 1;
  const poids = toNum(s.poids) || 1;
  return {
    gTot, naTot, cafTot, hydrTot,
    ratio: totalG > 0 ? weightedRatio / totalG : 0,
    gH: gTot / dur,
    naH: naTot / dur,
    hydrH: hydrTot / dur,
    cafKg: cafTot / poids,
  };
}

// ============================================================
// IMPORT PARSING
// ============================================================
function parseRacePlanText(text: string): RacePlan | null {
  const lines = text.split("\n").map((l) => l.replace(/\r/, "")).filter((l) => l.trim() !== "");
  const plan: RacePlan = {
    id: newId(),
    name: "Plan importé",
    km: "",
    dplus: "",
    objectif: "",
    choPerH: "",
    hydratationPerH: "",
    sodiumPerH: "",
    cafeineTotal: "",
    avantCourse: [],
    segments: [],
  };
  let mode: "" | "avant" | "seg" = "";
  let currentSeg: RacePlanSegment | null = null;

  for (const raw of lines) {
    const l = raw.trim();
    const ll = l.toLowerCase();
    if (ll.startsWith("nom:")) { plan.name = l.slice(4).trim(); continue; }
    if (ll.startsWith("objectif:")) { plan.objectif = l.slice(9).trim(); continue; }
    if (ll.startsWith("km:")) { plan.km = l.slice(3).trim(); continue; }
    if (ll.startsWith("d+:")) { plan.dplus = l.slice(3).trim(); continue; }
    if (ll.startsWith("cho:")) { plan.choPerH = l.slice(4).trim(); continue; }
    if (ll.startsWith("hydratation:")) { plan.hydratationPerH = l.slice(12).trim(); continue; }
    if (ll.startsWith("sodium:")) { plan.sodiumPerH = l.slice(7).trim(); continue; }
    if (ll.startsWith("cafeine:") || ll.startsWith("caféine:")) {
      plan.cafeineTotal = l.slice(l.indexOf(":") + 1).trim();
      continue;
    }
    if (ll.startsWith("avant")) { mode = "avant"; continue; }
    if (l.startsWith("#")) {
      currentSeg = { nom: l.replace(/^#+/, "").trim(), km: "", heure: "", temps: "", contenu: [] };
      plan.segments.push(currentSeg);
      mode = "seg";
      continue;
    }
    if (mode === "avant") plan.avantCourse.push(l);
    else if (mode === "seg" && currentSeg) currentSeg.contenu.push(l);
  }
  if (plan.segments.length === 0 && plan.avantCourse.length === 0) return null;
  return plan;
}

function exportRacePlanText(plan: RacePlan): string {
  let out = `Nom: ${plan.name}\nObjectif: ${plan.objectif}\nKM: ${plan.km}\nD+: ${plan.dplus}\nCHO: ${plan.choPerH}\nHydratation: ${plan.hydratationPerH}\nSodium: ${plan.sodiumPerH ?? ""}\nCaféine: ${plan.cafeineTotal ?? ""}\n`;
  if (plan.avantCourse.length) {
    out += "AVANT\n";
    plan.avantCourse.forEach((l) => (out += l + "\n"));
  }
  plan.segments.forEach((s) => {
    out += "#" + s.nom + "\n";
    s.contenu.forEach((l) => (out += l + "\n"));
  });
  return out;
}

// ============================================================
// RACE PLAN TIMELINE COMPONENT
// ============================================================
// ============================================================
// REUSABLE: PDF print for a RacePlan (premium, no UI noise)
// ============================================================
function PlanPrintReport({ plan }: { plan: RacePlan }) {
  const discipline: Discipline = plan.discipline ?? "trail";
  const isTri = discipline === "triathlon";
  const totals = sumPhases(plan);
  const totalKm = toNum(plan.km) || (isTri ? totals.km : 0);
  const totalDplus = toNum(plan.dplus) || (isTri ? totals.dplus : 0);

  const subtitleParts: string[] = [];
  if (totalKm > 0) subtitleParts.push(`${totalKm} km`);
  if (totalDplus > 0) subtitleParts.push(`${totalDplus} m D+`);
  if (plan.objectif?.trim()) subtitleParts.push(`objectif ${plan.objectif}`);
  const subtitle = subtitleParts.join(" · ");

  return (
    <PrintReport
      kicker={`Anticiper tes courses · ${DISCIPLINE_LABEL[discipline]}`}
      title={plan.name}
      subtitle={subtitle}
    >
      {!isTri && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            <PrintKpi label="Glucides" value={plan.choPerH || "—"} unit="g/h" />
            <PrintKpi label="Hydratation" value={plan.hydratationPerH || "—"} unit="ml/h" accent="#0a0a0a" />
            <PrintKpi label="🧂 Sodium" value={plan.sodiumPerH || "—"} unit="mg/h" accent="#2196f3" />
            <PrintKpi label="☕ Caféine" value={plan.cafeineTotal || "—"} unit="mg total" accent="#cf2e2e" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9, marginTop: 6 }}>
            <PrintKpi label="Distance" value={totalKm || "—"} unit="km" accent="#5f8c0a" />
            <PrintKpi label="Dénivelé +" value={totalDplus || "—"} unit="m" accent="#cf2e2e" />
          </div>
        </>
      )}
      {isTri && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
          <PrintKpi label="Distance totale" value={totalKm || "—"} unit="km" accent="#5f8c0a" />
          <PrintKpi label="Dénivelé +" value={totalDplus || "—"} unit="m" accent="#cf2e2e" />
          <PrintKpi label="Phases" value={(plan.phases ?? []).length} unit="" accent="#FF4501" />
        </div>
      )}
      {plan.avantCourse.filter((l) => l.trim()).length > 0 && (
        <>
          <PrintH>Avant la course</PrintH>
          <div style={{ background: "#fafaf8", borderRadius: 10, padding: "12px 14px", borderLeft: "4px solid #FF4501" }}>
            {plan.avantCourse.filter((l) => l.trim()).map((l, i) => (
              <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>• {l}</div>
            ))}
          </div>
        </>
      )}
      <PrintH>{isTri ? "Stratégie par phase" : "Déroulé par ravitaillement"}</PrintH>
      <div style={{ position: "relative", paddingLeft: 20 }}>
        <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: "#FF450155" }} />

        {!isTri && plan.segments.map((s, i) => (
          <div key={i} className="no-break" style={{ position: "relative", marginBottom: 13 }}>
            <div style={{ position: "absolute", left: -19, top: 3, width: 11, height: 11, borderRadius: "50%", background: "#FF4501", border: "2px solid #fff" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: 12.5 }}>
                {s.nom}
                {s.km !== "" ? <span style={{ color: "#787876", fontWeight: 600 }}> · KM {s.km}</span> : ""}
              </b>
              <span style={{ fontSize: 11, color: "#787876" }}>
                {s.heure}
                {s.temps ? ` · ${s.temps}` : ""}
              </span>
            </div>
            {s.contenu.filter((c) => c.trim()).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                {s.contenu.filter((c) => c.trim()).map((c, ci) => (
                  <span key={ci} style={{ fontSize: 11, background: "#fff", border: "1px solid #e6e6e3", borderRadius: 7, padding: "4px 9px" }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTri && (plan.phases ?? []).map((ph, i) => {
          const meta = TRI_PHASE_META[ph.type];
          const isTransition = ph.type === "T1" || ph.type === "T2";
          return (
            <div key={i} className="no-break" style={{ position: "relative", marginBottom: 13 }}>
              <div
                style={{
                  position: "absolute",
                  left: -19,
                  top: 3,
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: isTransition ? "#787876" : "#FF4501",
                  border: "2px solid #fff",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ fontSize: 12.5 }}>
                  {meta.icon} Phase {i + 1} — {meta.label}
                  {meta.hasDistance && ph.km !== "" && <span style={{ color: "#787876", fontWeight: 600 }}> · {ph.km} km</span>}
                  {meta.hasDplus && ph.dplus !== "" && <span style={{ color: "#787876", fontWeight: 600 }}> · {ph.dplus} m D+</span>}
                </b>
                <span style={{ fontSize: 11, color: "#787876" }}>{ph.temps && `⏱ ${ph.temps}`}</span>
              </div>
              {!isTransition && (
                <div style={{ fontSize: 11, color: "#FF4501", fontWeight: 700, marginTop: 3 }}>
                  {ph.choPerH} g/h · {ph.hydratationPerH} ml/h · {ph.sodiumPerH} mg/h Na
                  {(ph.cafeineTotal || "") !== "" && <> · {ph.cafeineTotal} mg caf total</>}
                </div>
              )}
              {ph.contenu && ph.contenu.some((c) => c.trim()) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                  {ph.contenu.filter((c) => c.trim()).map((c, ci) => (
                    <span key={ci} style={{ fontSize: 11, background: "#fff", border: "1px solid #e6e6e3", borderRadius: 7, padding: "4px 9px" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PrintReport>
  );
}

function sumPhases(rp: RacePlan): { km: number; dplus: number } {
  const ph = rp.phases ?? [];
  let km = 0, dplus = 0;
  for (const p of ph) {
    km += toNum(p.km);
    dplus += toNum(p.dplus);
  }
  return { km, dplus };
}

function planSubtitle(rp: RacePlan): string {
  const discipline: Discipline = rp.discipline ?? "trail";
  const isTri = discipline === "triathlon";
  const totalKm = toNum(rp.km) || (isTri ? sumPhases(rp).km : 0);
  const totalDplus = toNum(rp.dplus) || (isTri ? sumPhases(rp).dplus : 0);
  const parts: string[] = [];
  if (totalKm > 0) parts.push(`${totalKm} km`);
  if (totalDplus > 0) parts.push(`${totalDplus} m D+`);
  if (rp.objectif && rp.objectif.trim()) parts.push(`objectif ${rp.objectif}`);
  return parts.join(" · ");
}

function RacePlanCard({
  rp,
  onDelete,
  onEdit,
  onPrint,
  expanded = true,
  onToggle,
}: {
  rp: RacePlan;
  onDelete?: (id: string) => void;
  onEdit?: (rp: RacePlan) => void;
  onPrint?: (rp: RacePlan) => void;
  /** When false, the body section is hidden and only the header bar shows. */
  expanded?: boolean;
  /** Click-handler on the header bar to toggle expand/collapse. */
  onToggle?: () => void;
}) {
  const discipline: Discipline = rp.discipline ?? "trail";
  const isTri = discipline === "triathlon";
  const subtitle = planSubtitle(rp);

  return (
    <div className="card overflow-hidden mb-2.5">
      <div
        className="bg-[var(--color-dark)] px-4 py-3.5 text-white flex justify-between items-center flex-wrap gap-2"
        style={onToggle ? { cursor: "pointer" } : undefined}
        onClick={onToggle}
        title={onToggle ? (expanded ? "Réduire" : "Voir la stratégie complète") : undefined}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 18 }}>{DISCIPLINE_ICON[discipline]}</span>
            <span
              style={{
                fontSize: 9,
                background: "var(--color-primary)",
                color: "#fff",
                padding: "2px 7px",
                borderRadius: 3,
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              {DISCIPLINE_LABEL[discipline]}
            </span>
          </div>
          <div className="font-display font-extrabold text-xl mt-1" style={{ letterSpacing: "-0.01em" }}>
            {rp.name}
          </div>
          {subtitle && (
            <div className="text-xs text-[#bbb]">{subtitle}</div>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {!isTri && (
            <>
              <div className="text-right">
                <div className="text-[10px] text-[#bbb]">GLUCIDES</div>
                <div className="text-[var(--color-accent)] font-extrabold text-lg">{rp.choPerH || "—"} g/h</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#bbb]">HYDRATATION</div>
                <div className="text-[var(--color-accent)] font-extrabold text-lg">{rp.hydratationPerH || "—"} ml/h</div>
              </div>
              {(rp.sodiumPerH || "") !== "" && (
                <div className="text-right">
                  <div className="text-[10px] text-[#bbb]">🧂 SODIUM</div>
                  <div className="font-extrabold text-lg" style={{ color: "#7ec5ff" }}>{rp.sodiumPerH} mg/h</div>
                </div>
              )}
              {(rp.cafeineTotal || "") !== "" && (
                <div className="text-right">
                  <div className="text-[10px] text-[#bbb]">☕ CAFÉINE</div>
                  <div className="font-extrabold text-lg" style={{ color: "#ffb380" }}>{rp.cafeineTotal} mg total</div>
                </div>
              )}
            </>
          )}
          {isTri && (
            <div className="text-right">
              <div className="text-[10px] text-[#bbb]">CIBLES</div>
              <div className="text-[var(--color-accent)] font-extrabold text-sm">par phase</div>
            </div>
          )}
          {onPrint && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrint(rp); }}
              className="btn-ghost btn-xs"
              style={{ color: "#fff", border: "1px solid #fff4" }}
              title="Exporter en PDF"
            >
              📄 PDF
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(rp); }}
              className="btn-ghost btn-xs"
              style={{ color: "#fff", border: "1px solid #fff4" }}
            >
              Éditer
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(rp.id); }}
              className="btn-ghost btn-xs"
              style={{ color: "#fff", border: "1px solid #fff4" }}
            >
              ✕
            </button>
          )}
          {onToggle && (
            <span
              style={{
                fontSize: 18,
                color: "var(--color-accent)",
                transition: "transform .15s",
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                display: "inline-block",
                width: 18,
                textAlign: "center",
              }}
              aria-label={expanded ? "Réduire" : "Déployer"}
            >
              ▾
            </span>
          )}
        </div>
      </div>

      {expanded && (
      <div className="p-4">
        {rp.avantCourse && rp.avantCourse.length > 0 && (
          <div className="mb-3.5">
            <div className="kicker mb-1.5">Avant la course</div>
            {rp.avantCourse.map((l, i) => (
              <div key={i} className="text-sm py-0.5">• {l}</div>
            ))}
          </div>
        )}

        {isTri ? (
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-primary)] opacity-30" />
            {(rp.phases ?? []).map((ph, i) => {
              const meta = TRI_PHASE_META[ph.type];
              const isTransition = ph.type === "T1" || ph.type === "T2";
              return (
                <div key={i} className="relative mb-4">
                  <div
                    className="absolute -left-[20px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: isTransition ? "var(--color-text-muted)" : "var(--color-primary)",
                      border: "2px solid #fff",
                      fontSize: 9,
                    }}
                  />
                  <div className="flex justify-between flex-wrap gap-1.5">
                    <div className="font-extrabold text-sm flex items-center gap-1.5">
                      <span style={{ fontSize: 15 }}>{meta.icon}</span>
                      Phase {i + 1} — {meta.label}
                      {meta.hasDistance && ph.km !== "" && (
                        <span className="text-[var(--color-text-muted)] font-semibold"> · {ph.km} km</span>
                      )}
                      {meta.hasDplus && ph.dplus !== "" && (
                        <span className="text-[var(--color-text-muted)] font-semibold"> · {ph.dplus} m D+</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {ph.temps && `⏱ ${ph.temps}`}
                    </div>
                  </div>
                  {!isTransition && (
                    <div className="mt-1 text-[11px] flex gap-3 flex-wrap" style={{ color: "var(--color-primary)" }}>
                      <span><b>{ph.choPerH}</b> g/h</span>
                      <span><b>{ph.hydratationPerH}</b> ml/h</span>
                      <span><b>{ph.sodiumPerH}</b> mg/h Na</span>
                      {(ph.cafeineTotal || "") !== "" && (
                        <span><b>{ph.cafeineTotal}</b> mg caf total</span>
                      )}
                    </div>
                  )}
                  {ph.contenu && ph.contenu.length > 0 && ph.contenu.some((c) => c.trim()) && (
                    <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {ph.contenu.filter((c) => c.trim()).map((c, ci) => (
                        <div
                          key={ci}
                          className="text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-primary)] opacity-30" />
            {rp.segments.map((s, i) => (
              <div key={i} className="relative mb-4">
                <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-[var(--color-primary)]" style={{ border: "2px solid #fff" }} />
                <div className="flex justify-between flex-wrap gap-1.5">
                  <div className="font-extrabold text-sm">
                    {s.nom}
                    {s.km !== "" && <span className="text-[var(--color-text-muted)] font-semibold"> · KM {s.km}</span>}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {s.heure}
                    {s.temps ? ` · segment ${s.temps}` : ""}
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {s.contenu.map((c, ci) => (
                    <div
                      key={ci}
                      className="text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ============================================================
// SUMMARY CARDS (calculator)
// ============================================================
function SummaryCards({ c, tolGluc, tolHydr }: { c: ReturnType<typeof computeTotals>; tolGluc: number | null; tolHydr: number | null }) {
  const warnG = tolGluc != null && c.gH > tolGluc;
  const warnH = tolHydr != null && c.hydrH > tolHydr;
  return (
    <div className="flex flex-wrap gap-2.5">
      {[
        { label: "GLUCIDES (total)", total: Math.round(c.gTot), unit: "g", sub: `${Math.round(c.gH)} g/h${tolGluc != null ? (warnG ? ` · > tol. ${tolGluc}` : ` · tol. ${tolGluc}`) : ""}`, warn: warnG },
        { label: "HYDRATATION (total)", total: Math.round(c.hydrTot), unit: "ml", sub: `${Math.round(c.hydrH)} ml/h${tolHydr != null ? (warnH ? ` · > tol. ${tolHydr}` : ` · tol. ${tolHydr}`) : ""}`, warn: warnH },
        { label: "SODIUM (total)", total: Math.round(c.naTot), unit: "mg", sub: `${Math.round(c.naH)} mg/h` },
        { label: "CAFÉINE (total)", total: Math.round(c.cafTot), unit: "mg", sub: `${c.cafKg.toFixed(1)} mg/kg` },
        { label: "RATIO G:F MOYEN", total: "1:" + c.ratio.toFixed(2), unit: "", sub: "pondéré" },
      ].map((k, i) => (
        <div
          key={i}
          className="rounded-lg px-3 py-2.5 flex-1"
          style={{
            minWidth: 130,
            background: k.warn ? "#fcebe8" : "var(--color-surface-2)",
            border: k.warn ? "1px solid rgba(207,46,46,0.4)" : "1px solid var(--color-border)",
          }}
        >
          <div className="text-[10px] text-[var(--color-text-muted)]">{k.label}</div>
          <div className="font-display font-extrabold text-2xl" style={{ color: k.warn ? "var(--color-danger)" : "var(--color-text)" }}>
            {k.total}
            <span className="text-xs text-[var(--color-text-muted)] font-bold ml-1">{k.unit}</span>
          </div>
          {k.sub && (
            <div className="text-xs font-bold mt-0.5" style={{ color: k.warn ? "var(--color-danger)" : "var(--color-primary)" }}>
              {k.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function RaceStrategyPage() {
  const searchParams = useSearchParams();
  const athleteIdFromUrl = searchParams?.get("athleteId") || null;
  const isCoachView = !!athleteIdFromUrl;

  const [strategies, setStrategies, loadedS] = useAthleteData<Strategy[]>("strat", []);
  const [racePlans, setRacePlans, loadedR] = useAthleteData<RacePlan[]>("raceplans", []);
  // Which plan(s) are expanded. Default: all collapsed; user clicks to expand.
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());
  const togglePlan = (id: string) =>
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const [custom] = useAthleteData<Product[]>("custom", []);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const [notifyLoading, setNotifyLoading] = useState(false);

  async function sendPlanByEmail(plan: RacePlan) {
    if (!athleteIdFromUrl) {
      setNotifyMsg("⚠ Tu dois être en mode coach (URL avec ?athleteId=...) pour envoyer un email.");
      setTimeout(() => setNotifyMsg(null), 8000);
      return;
    }
    setNotifyLoading(true);
    setNotifyMsg("⏳ Envoi de l'email en cours…");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expirée — reconnecte-toi");
      const res = await fetch("/api/notify/race-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          athleteId: athleteIdFromUrl,
          planName: plan.name,
          discipline: plan.discipline,
          km: plan.km,
          dplus: plan.dplus,
          objectif: plan.objectif,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setNotifyMsg("✓ Email envoyé à l'athlète.");
      } else {
        setNotifyMsg("⚠ Email non envoyé : " + (json.error || `HTTP ${res.status}`));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "erreur inconnue";
      setNotifyMsg("⚠ Email non envoyé : " + msg);
    } finally {
      setNotifyLoading(false);
      setTimeout(() => setNotifyMsg(null), 12000);
    }
  }
  const [profile] = useAthleteData<{
    poids?: number | string;
    tolGlucCAP?: number | string;
    tolHydrCAP?: number | string;
    tolGlucCyc?: number | string;
    tolHydrCyc?: number | string;
  }>("profile", {});
  const [tolTests] = useAthleteData<ToleranceTest[]>("tests", []);
  const allProducts = useMemo(() => [...PRODUCTS_CATALOG, ...custom], [custom]);

  const profileTolGlucCAP = toNum(profile.tolGlucCAP) || null;
  const profileTolHydrCAP = toNum(profile.tolHydrCAP) || null;
  const profileTolGlucCyc = toNum(profile.tolGlucCyc) || null;
  const profileTolHydrCyc = toNum(profile.tolHydrCyc) || null;

  // Resolve tolerance for a given discipline:
  // 1) best "bien toléré" test for that discipline
  // 2) profile fallback specific to the discipline (CAP for Course/Trail, Cyc for Cyclisme,
  //    most-restrictive of both for Triathlon since it combines disciplines)
  const tolFor = (discipline: TolDiscipline | undefined) => {
    const d = discipline ?? "Course";
    const testG = maxToleranceFor(tolTests, "glucides", d);
    const testH = maxToleranceFor(tolTests, "hydrique", d);

    let fallbackG: number | null = null;
    let fallbackH: number | null = null;
    if (d === "Cyclisme") {
      fallbackG = profileTolGlucCyc;
      fallbackH = profileTolHydrCyc;
    } else if (d === "Triathlon") {
      // Most restrictive of CAP and Cyc, ignoring nulls.
      const gs = [profileTolGlucCAP, profileTolGlucCyc].filter((x): x is number => x != null);
      const hs = [profileTolHydrCAP, profileTolHydrCyc].filter((x): x is number => x != null);
      fallbackG = gs.length ? Math.min(...gs) : null;
      fallbackH = hs.length ? Math.min(...hs) : null;
    } else {
      // Course / Trail
      fallbackG = profileTolGlucCAP;
      fallbackH = profileTolHydrCAP;
    }

    return { tolGluc: testG ?? fallbackG, tolHydr: testH ?? fallbackH };
  };

  const [tab, setTab] = useState<"plans" | "calc">("plans");

  // Strategy calculator
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [pickKey, setPickKey] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState({ name: "", g: "", hydr: "", s: "", c: "", r: "1:0.8" });

  // Race plan editor
  const [planEdit, setPlanEdit] = useState<RacePlan | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [printPlan, setPrintPlan] = useState<RacePlan | null>(null);
  const [printStrat, setPrintStrat] = useState<Strategy | null>(null);

  const blankStrategy = (): Strategy => ({
    id: newId(),
    name: "Nouvelle stratégie",
    duree: 3,
    poids: toNum(profile.poids) || 70,
    lines: [],
    tolDiscipline: "Course",
  });

  const blankRacePlan = (discipline: Discipline = "trail"): RacePlan => ({
    id: newId(),
    name: "Nouveau plan de course",
    km: "",
    dplus: "",
    objectif: "",
    choPerH: "",
    hydratationPerH: "",
    sodiumPerH: "",
    cafeineTotal: "",
    avantCourse: [""],
    segments: discipline === "triathlon"
      ? []
      : [{ nom: "Départ", km: 0, heure: "", temps: "", contenu: [""] }],
    discipline,
    phases: discipline === "triathlon" ? defaultTriPhases() : undefined,
  });

  const [disciplinePicker, setDisciplinePicker] = useState(false);

  const saveStrat = (s: Strategy) => {
    setStrategies((p) => (p.some((x) => x.id === s.id) ? p.map((x) => (x.id === s.id ? s : x)) : [...p, s]));
    setEditing(null);
  };
  const delStrat = (id: string) => {
    if (confirm("Supprimer ?")) setStrategies((p) => p.filter((s) => s.id !== id));
  };

  const savePlan = (p: RacePlan) => {
    setRacePlans((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]));
    setPlanEdit(null);
  };
  const delPlan = (id: string) => {
    if (confirm("Supprimer ce plan ?")) setRacePlans((p) => p.filter((x) => x.id !== id));
  };

  const handleImport = () => {
    const parsed = parseRacePlanText(importText);
    if (!parsed) {
      alert("Format non reconnu. Utilise :\nNom: ...\nObjectif: ...\nKM: ...\nD+: ...\nCHO: ...\nHydratation: ...\nAVANT\n(lignes...)\n#Nom du ravito\n(lignes...)");
      return;
    }
    setRacePlans((p) => [...p, parsed]);
    setImportText("");
    setImportOpen(false);
  };

  const downloadExport = (plan: RacePlan) => {
    const txt = exportRacePlanText(plan);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = plan.name.replace(/[^a-z0-9]+/gi, "_") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!loadedS || !loadedR) {
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Stratégie de course" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  // ============================================================
  // STRATEGY EDITOR
  // ============================================================
  if (editing) {
    const c = computeTotals(editing, allProducts);
    const editingDiscipline = editing.tolDiscipline ?? "Course";
    const { tolGluc: editTolGluc, tolHydr: editTolHydr } = tolFor(editingDiscipline);
    return (
      <div>
        <div className="screen-only">
        <PageHeader kicker="Anticiper tes courses" title="Stratégie de course" />

        <div className="card p-4 mb-3.5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Field label="Nom de la stratégie"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Durée (h)"><input className="input" value={editing.duree} onChange={(e) => setEditing({ ...editing, duree: e.target.value })} /></Field>
            <Field label="Poids athlète (kg)"><input className="input" value={editing.poids} onChange={(e) => setEditing({ ...editing, poids: e.target.value })} /></Field>
            <Field label="Discipline (tolérance)">
              <select
                className="input"
                value={editingDiscipline}
                onChange={(e) => setEditing({ ...editing, tolDiscipline: e.target.value as TolDiscipline })}
              >
                {TOL_DISCIPLINES.map((d) => (
                  <option key={d} value={d}>{TOL_DISCIPLINE_ICON[d]} {d}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-2">
            💡 Tes seuils de tolérance proviennent de tes <b>tests &quot;bien tolérés&quot;</b> pour cette discipline
            {editTolGluc != null && <> · Glucides max : <b>{editTolGluc} g/h</b></>}
            {editTolHydr != null && <> · Hydratation max : <b>{editTolHydr} ml/h</b></>}
            {editTolGluc == null && editTolHydr == null && <> · Pas de tests pour cette discipline — fallback sur les CAPs du profil.</>}
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="flex gap-2 items-end flex-wrap">
            <Field label="Ajouter un produit du catalogue">
              <select className="input" style={{ minWidth: 240 }} value={pickKey} onChange={(e) => setPickKey(e.target.value)}>
                <option value="">— Choisir —</option>
                {allProducts.map((p, i) => (
                  <option key={i} value={p.m + "|" + p.n}>
                    {p.t} · {p.m} · {p.n} ({p.g}g)
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="btn-primary"
              onClick={() => {
                if (!pickKey) return;
                const found = allProducts.find((p) => p.m + "|" + p.n === pickKey);
                const hydr = found?.t === "Boisson" ? 500 : 0;
                setEditing({
                  ...editing,
                  lines: [...editing.lines, { id: newId(), mode: "db", key: pickKey, qty: 1, hydr }],
                });
                setPickKey("");
              }}
            >
              + Ajouter
            </button>
            <button className="btn-ghost" onClick={() => setManualOpen((o) => !o)}>+ Produit manuel</button>
          </div>

          {manualOpen && (
            <div className="mt-3 p-3 bg-[var(--color-surface-2)] rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 items-end">
                <Field label="Nom"><input className="input" value={manualDraft.name} onChange={(e) => setManualDraft({ ...manualDraft, name: e.target.value })} /></Field>
                <Field label="Gluc (g)"><input className="input" value={manualDraft.g} onChange={(e) => setManualDraft({ ...manualDraft, g: e.target.value })} /></Field>
                <Field label="Hydr (ml)"><input className="input" value={manualDraft.hydr} onChange={(e) => setManualDraft({ ...manualDraft, hydr: e.target.value })} /></Field>
                <Field label="Sodium (mg)"><input className="input" value={manualDraft.s} onChange={(e) => setManualDraft({ ...manualDraft, s: e.target.value })} /></Field>
                <Field label="Caf (mg)"><input className="input" value={manualDraft.c} onChange={(e) => setManualDraft({ ...manualDraft, c: e.target.value })} /></Field>
                <Field label="Ratio"><input className="input" value={manualDraft.r} onChange={(e) => setManualDraft({ ...manualDraft, r: e.target.value })} /></Field>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!manualDraft.name) return;
                    setEditing({
                      ...editing,
                      lines: [...editing.lines, {
                        id: newId(),
                        mode: "manual",
                        name: manualDraft.name,
                        g: toNum(manualDraft.g),
                        hydr: toNum(manualDraft.hydr),
                        s: toNum(manualDraft.s),
                        c: toNum(manualDraft.c),
                        r: manualDraft.r,
                        qty: 1,
                      }],
                    });
                    setManualDraft({ name: "", g: "", hydr: "", s: "", c: "", r: "1:0.8" });
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          <div className="mt-3.5 flex flex-col gap-2">
            {editing.lines.map((l) => {
              const r = resolveProduct(l, allProducts);
              if (!r) return null;
              return (
                <div key={l.id} className="flex items-center gap-3 bg-[var(--color-surface-2)] rounded-lg px-3 py-2 flex-wrap">
                  <div className="flex-1" style={{ minWidth: 160 }}>
                    <div className="font-bold text-sm">{r.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      {r.g} g · {r.s} mg Na · {r.c} mg caf · ratio {r.r || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      className="input"
                      style={{ width: 62 }}
                      value={l.hydr ?? r.hydr}
                      onChange={(e) =>
                        setEditing({ ...editing, lines: editing.lines.map((x) => (x.id === l.id ? { ...x, hydr: toNum(e.target.value) } : x)) })
                      }
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">ml/u</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--color-text-muted)]">×</span>
                    <input
                      className="input"
                      style={{ width: 60 }}
                      value={l.qty}
                      onChange={(e) =>
                        setEditing({ ...editing, lines: editing.lines.map((x) => (x.id === l.id ? { ...x, qty: e.target.value } : x)) })
                      }
                    />
                  </div>
                  <button
                    onClick={() => setEditing({ ...editing, lines: editing.lines.filter((x) => x.id !== l.id) })}
                    style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 15 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {editing.lines.length === 0 && <Empty>Aucun produit ajouté.</Empty>}
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <SummaryCards c={c} tolGluc={editTolGluc} tolHydr={editTolHydr} />
        </div>

        <div className="flex justify-end gap-2 flex-wrap">
          <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => { setPrintStrat(editing); setTimeout(() => window.print(), 200); }} className="btn-dark">Exporter en PDF</button>
          <button onClick={() => saveStrat(editing)} className="btn-primary">Enregistrer</button>
        </div>
        </div>

        {printStrat && (
          <PrintReport
            kicker="Anticiper tes courses"
            title="Stratégie de course"
            subtitle={`${printStrat.name} · ${printStrat.duree} h · ${printStrat.poids} kg`}
          >
            <PrintH>Récapitulatif</PrintH>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
              <PrintKpi label="Glucides" value={Math.round(c.gTot)} unit="g" sub={`${Math.round(c.gH)} g/h`} />
              <PrintKpi label="Hydratation" value={Math.round(c.hydrTot)} unit="ml" sub={`${Math.round(c.hydrH)} ml/h`} accent="#0a0a0a" />
              <PrintKpi label="Sodium" value={Math.round(c.naTot)} unit="mg" sub={`${Math.round(c.naH)} mg/h`} accent="#5f8c0a" />
              <PrintKpi label="Caféine" value={Math.round(c.cafTot)} unit="mg" sub={`${c.cafKg.toFixed(1)} mg/kg`} accent="#cf2e2e" />
            </div>
            <PrintH>Détail des produits</PrintH>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: "#0a0a0a", color: "#fff" }}>
                  {["Produit", "Qté", "CHO g", "Hydr. ml", "Na mg", "Caf. mg"].map((h) => (
                    <th key={h} style={{ padding: "7px 8px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printStrat.lines.map((l, idx) => {
                  const r = resolveProduct(l, allProducts);
                  if (!r) return null;
                  const qty = toNum(l.qty);
                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid #e6e6e3", background: idx % 2 ? "#fafaf8" : "#fff" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 700 }}>{r.name}</td>
                      <td>×{qty}</td>
                      <td style={{ color: "#FF4501", fontWeight: 700 }}>{Math.round(r.g * qty)}</td>
                      <td>{Math.round(r.hydr * qty)}</td>
                      <td>{Math.round(r.s * qty)}</td>
                      <td>{Math.round(r.c * qty)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </PrintReport>
        )}
      </div>
    );
  }

  // ============================================================
  // RACE PLAN EDITOR
  // ============================================================
  if (planEdit) {
    const updatePlan = (patch: Partial<RacePlan>) => setPlanEdit({ ...planEdit, ...patch });
    const updateSeg = (i: number, patch: Partial<RacePlanSegment>) =>
      updatePlan({ segments: planEdit.segments.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
    const discipline: Discipline = planEdit.discipline ?? "trail";
    const isTri = discipline === "triathlon";
    const phases = planEdit.phases ?? (isTri ? defaultTriPhases() : []);
    const updatePhase = (i: number, patch: Partial<TriPhase>) =>
      updatePlan({ phases: phases.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });

    return (
      <div>
        <div className="screen-only">
        <PageHeader kicker="Anticiper tes courses" title="Plan de course" />

        {notifyMsg && (
          <div
            className="mb-3 p-3 rounded-lg text-sm font-bold"
            style={{
              background: notifyMsg.startsWith("✓") ? "rgba(95,140,10,0.10)" : notifyMsg.startsWith("⏳") ? "rgba(0,0,0,0.05)" : "rgba(207,46,46,0.10)",
              color: notifyMsg.startsWith("✓") ? "var(--color-success)" : notifyMsg.startsWith("⏳") ? "var(--color-text-muted)" : "var(--color-danger)",
              border: notifyMsg.startsWith("✓") ? "1px solid rgba(95,140,10,0.40)" : notifyMsg.startsWith("⏳") ? "1px solid var(--color-border)" : "1px solid rgba(207,46,46,0.40)",
            }}
          >
            {notifyMsg}
          </div>
        )}

        <div className="card p-4 mb-3.5" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div style={{ fontSize: 26, lineHeight: 1 }}>{DISCIPLINE_ICON[discipline]}</div>
            <div>
              <div className="text-[10px] uppercase font-bold" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>Discipline</div>
              <div className="font-extrabold text-lg" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{DISCIPLINE_LABEL[discipline]}</div>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] ml-auto">
              {isTri ? "Stratégie nutritionnelle par phase" : "Stratégie nutritionnelle par ravitaillement"}
            </div>
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <Field label="Nom du plan"><input className="input" value={planEdit.name} onChange={(e) => updatePlan({ name: e.target.value })} /></Field>
            <Field label="KM (total)"><input className="input" value={planEdit.km} onChange={(e) => updatePlan({ km: e.target.value })} /></Field>
            <Field label="D+ (m)"><input className="input" value={planEdit.dplus} onChange={(e) => updatePlan({ dplus: e.target.value })} /></Field>
            <Field label="Objectif"><input className="input" value={planEdit.objectif} onChange={(e) => updatePlan({ objectif: e.target.value })} /></Field>
          </div>
          {!isTri && (
            <>
              <div
                className="text-[10px] uppercase font-bold mt-3 mb-1.5"
                style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}
              >
                🎯 Cibles nutritionnelles (par heure)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <Field label="Glucides (g/h)">
                  <input className="input" value={planEdit.choPerH} onChange={(e) => updatePlan({ choPerH: e.target.value })} />
                </Field>
                <Field label="Hydratation (ml/h)">
                  <input className="input" value={planEdit.hydratationPerH} onChange={(e) => updatePlan({ hydratationPerH: e.target.value })} />
                </Field>
                <Field label="🧂 Sodium (mg/h)">
                  <input
                    className="input"
                    value={planEdit.sodiumPerH ?? ""}
                    onChange={(e) => updatePlan({ sodiumPerH: e.target.value })}
                    placeholder="500-1000"
                  />
                </Field>
                <Field label="☕ Caféine (mg total)">
                  <input
                    className="input"
                    value={planEdit.cafeineTotal ?? ""}
                    onChange={(e) => updatePlan({ cafeineTotal: e.target.value })}
                    placeholder="ex. 200"
                  />
                </Field>
              </div>
            </>
          )}
          {isTri && (
            <div className="text-xs text-[var(--color-text-muted)] mt-2">
              💡 En triathlon, les cibles d&apos;apport sont définies <b>par phase</b> ci-dessous (la natation et les transitions ont des cibles très différentes du vélo et de la course).
            </div>
          )}
        </div>

        <div className="card p-4 mb-3.5">
          <div className="font-extrabold mb-2">Avant la course</div>
          {planEdit.avantCourse.map((l, i) => (
            <div key={i} className="flex gap-1 mb-1.5">
              <input
                className="input flex-1"
                value={l}
                onChange={(e) => updatePlan({ avantCourse: planEdit.avantCourse.map((x, idx) => (idx === i ? e.target.value : x)) })}
              />
              <button
                onClick={() => updatePlan({ avantCourse: moveItem(planEdit.avantCourse, i, -1) })}
                disabled={i === 0}
                className="btn-ghost btn-sm"
                style={{ opacity: i === 0 ? 0.3 : 1, minWidth: 30 }}
                title="Monter"
              >
                ↑
              </button>
              <button
                onClick={() => updatePlan({ avantCourse: moveItem(planEdit.avantCourse, i, 1) })}
                disabled={i === planEdit.avantCourse.length - 1}
                className="btn-ghost btn-sm"
                style={{ opacity: i === planEdit.avantCourse.length - 1 ? 0.3 : 1, minWidth: 30 }}
                title="Descendre"
              >
                ↓
              </button>
              <button
                onClick={() => updatePlan({ avantCourse: planEdit.avantCourse.filter((_, idx) => idx !== i) })}
                className="btn-ghost btn-sm"
                style={{ color: "var(--color-danger)" }}
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => updatePlan({ avantCourse: [...planEdit.avantCourse, ""] })} className="btn-ghost btn-sm">+ Ligne</button>
        </div>

        {!isTri && planEdit.segments.map((seg, i) => (
          <div key={i} className="card p-4 mb-3.5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-[10px] uppercase font-bold" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                Ravito {i + 1} / {planEdit.segments.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => updatePlan({ segments: moveItem(planEdit.segments, i, -1) })}
                  disabled={i === 0}
                  className="btn-ghost btn-sm"
                  style={{ opacity: i === 0 ? 0.3 : 1 }}
                  title="Monter ce ravito dans l'ordre"
                >
                  ↑ Monter
                </button>
                <button
                  onClick={() => updatePlan({ segments: moveItem(planEdit.segments, i, 1) })}
                  disabled={i === planEdit.segments.length - 1}
                  className="btn-ghost btn-sm"
                  style={{ opacity: i === planEdit.segments.length - 1 ? 0.3 : 1 }}
                  title="Descendre ce ravito dans l'ordre"
                >
                  ↓ Descendre
                </button>
                <button onClick={() => updatePlan({ segments: planEdit.segments.filter((_, idx) => idx !== i) })} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>Supprimer</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <Field label="Nom (ravito)"><input className="input" value={seg.nom} onChange={(e) => updateSeg(i, { nom: e.target.value })} /></Field>
              <Field label="KM"><input className="input" value={seg.km} onChange={(e) => updateSeg(i, { km: e.target.value })} /></Field>
              <Field label="Heure"><input className="input" value={seg.heure} onChange={(e) => updateSeg(i, { heure: e.target.value })} /></Field>
              <Field label="Temps segment"><input className="input" value={seg.temps} onChange={(e) => updateSeg(i, { temps: e.target.value })} /></Field>
            </div>
            <div className="font-extrabold mb-1">Contenu du ravito / segment</div>
            {seg.contenu.map((l, ci) => (
              <div key={ci} className="flex gap-1 mb-1.5">
                <input
                  className="input flex-1"
                  value={l}
                  onChange={(e) => updateSeg(i, { contenu: seg.contenu.map((x, idx) => (idx === ci ? e.target.value : x)) })}
                />
                <button
                  onClick={() => updateSeg(i, { contenu: moveItem(seg.contenu, ci, -1) })}
                  disabled={ci === 0}
                  className="btn-ghost btn-sm"
                  style={{ opacity: ci === 0 ? 0.3 : 1, minWidth: 30 }}
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  onClick={() => updateSeg(i, { contenu: moveItem(seg.contenu, ci, 1) })}
                  disabled={ci === seg.contenu.length - 1}
                  className="btn-ghost btn-sm"
                  style={{ opacity: ci === seg.contenu.length - 1 ? 0.3 : 1, minWidth: 30 }}
                  title="Descendre"
                >
                  ↓
                </button>
                <button
                  onClick={() => updateSeg(i, { contenu: seg.contenu.filter((_, idx) => idx !== ci) })}
                  className="btn-ghost btn-sm"
                  style={{ color: "var(--color-danger)" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button onClick={() => updateSeg(i, { contenu: [...seg.contenu, ""] })} className="btn-ghost btn-sm">+ Ligne</button>
          </div>
        ))}

        {isTri && phases.map((ph, i) => {
          const meta = TRI_PHASE_META[ph.type];
          const isTransition = ph.type === "T1" || ph.type === "T2";
          return (
            <div
              key={i}
              className="card p-4 mb-3.5"
              style={{
                borderLeft: `4px solid ${isTransition ? "var(--color-text-muted)" : "var(--color-primary)"}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div style={{ fontSize: 22 }}>{meta.icon}</div>
                <div className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
                  Phase {i + 1} — {meta.label}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {meta.hasDistance && (
                  <Field label="Distance (km)"><input className="input" value={ph.km} onChange={(e) => updatePhase(i, { km: e.target.value })} /></Field>
                )}
                {meta.hasDplus && (
                  <Field label="D+ (m)"><input className="input" value={ph.dplus} onChange={(e) => updatePhase(i, { dplus: e.target.value })} /></Field>
                )}
                <Field label="Temps estimé"><input className="input" value={ph.temps} placeholder={isTransition ? "1:30" : "1h25"} onChange={(e) => updatePhase(i, { temps: e.target.value })} /></Field>
                {!isTransition && (
                  <>
                    <Field label="CHO (g/h)"><input className="input" value={ph.choPerH} onChange={(e) => updatePhase(i, { choPerH: e.target.value })} /></Field>
                    <Field label="Hydratation (ml/h)"><input className="input" value={ph.hydratationPerH} onChange={(e) => updatePhase(i, { hydratationPerH: e.target.value })} /></Field>
                    <Field label="🧂 Sodium (mg/h)"><input className="input" value={ph.sodiumPerH} onChange={(e) => updatePhase(i, { sodiumPerH: e.target.value })} /></Field>
                    <Field label="☕ Caféine (mg total/phase)">
                      <input
                        className="input"
                        value={ph.cafeineTotal ?? ""}
                        placeholder="ex. 100"
                        onChange={(e) => updatePhase(i, { cafeineTotal: e.target.value })}
                      />
                    </Field>
                  </>
                )}
              </div>

              <div className="font-extrabold mb-1 text-sm">Contenu / ravito de la phase</div>
              {ph.contenu.map((l, ci) => (
                <div key={ci} className="flex gap-1 mb-1.5">
                  <input
                    className="input flex-1"
                    value={l}
                    onChange={(e) => updatePhase(i, { contenu: ph.contenu.map((x, idx) => (idx === ci ? e.target.value : x)) })}
                  />
                  <button
                    onClick={() => updatePhase(i, { contenu: moveItem(ph.contenu, ci, -1) })}
                    disabled={ci === 0}
                    className="btn-ghost btn-sm"
                    style={{ opacity: ci === 0 ? 0.3 : 1, minWidth: 30 }}
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => updatePhase(i, { contenu: moveItem(ph.contenu, ci, 1) })}
                    disabled={ci === ph.contenu.length - 1}
                    className="btn-ghost btn-sm"
                    style={{ opacity: ci === ph.contenu.length - 1 ? 0.3 : 1, minWidth: 30 }}
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => updatePhase(i, { contenu: ph.contenu.filter((_, idx) => idx !== ci) })}
                    className="btn-ghost btn-sm"
                    style={{ color: "var(--color-danger)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={() => updatePhase(i, { contenu: [...ph.contenu, ""] })} className="btn-ghost btn-sm">+ Ligne</button>
            </div>
          );
        })}

        <div className="flex justify-between flex-wrap gap-2 mb-4">
          {!isTri ? (
            <button
              onClick={() => updatePlan({ segments: [...planEdit.segments, { nom: "Nouveau ravito", km: "", heure: "", temps: "", contenu: [""] }] })}
              className="btn-ghost"
            >
              + Ravitaillement
            </button>
          ) : <div />}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPlanEdit(null)} className="btn-ghost">Annuler</button>
            <button onClick={() => downloadExport(planEdit)} className="btn-dark">Exporter en texte</button>
            <button onClick={() => { setPrintPlan(planEdit); setTimeout(() => window.print(), 200); }} className="btn-dark">Exporter en PDF</button>
            {isCoachView && (
              <button
                onClick={() => sendPlanByEmail(planEdit)}
                disabled={notifyLoading}
                className="btn-dark"
                title="Envoyer cette stratégie à l'athlète par email"
              >
                📧 Envoyer par email
              </button>
            )}
            <button onClick={() => savePlan(planEdit)} className="btn-primary">Enregistrer</button>
          </div>
        </div>
        </div>{/* /screen-only */}

        {printPlan && <PlanPrintReport plan={printPlan} />}
      </div>
    );
  }

  // ============================================================
  // MAIN LIST
  // ============================================================
  return (
    <div>
      <div className="screen-only">
      <PageHeader
        kicker="Anticiper tes courses"
        title="Stratégie de course"
        desc="Tes plans de course détaillés par ravitaillement, et un calculateur produits pour valider tes apports vs ta tolérance."
      />

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("plans")} className={tab === "plans" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          Plans de course
        </button>
        <button onClick={() => setTab("calc")} className={tab === "calc" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          Calculateur produits
        </button>
      </div>

      {tab === "plans" && (
        <>
          <div className="flex justify-end gap-2 mb-3.5 flex-wrap">
            <button onClick={() => setImportOpen((o) => !o)} className="btn-ghost">Importer un plan</button>
            <button onClick={() => setDisciplinePicker(true)} className="btn-primary">+ Nouveau plan</button>
          </div>

          {disciplinePicker && (
            <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-primary)" }}>
              <div className="font-display font-extrabold text-lg mb-1" style={{ letterSpacing: "-0.01em" }}>
                Quel est le sport de ta course ?
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mb-3">
                La structure du plan s&apos;adapte au sport choisi. Pour le triathlon, tu auras 5 phases (Natation · T1 · Vélo · T2 · Course).
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {(["course", "trail", "cyclisme", "triathlon"] as Discipline[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => { setPlanEdit(blankRacePlan(d)); setDisciplinePicker(false); }}
                    className="card"
                    style={{
                      padding: "16px 10px",
                      cursor: "pointer",
                      border: "1.5px solid var(--color-border)",
                      background: "var(--color-surface-2)",
                      textAlign: "center",
                      transition: "transform .12s ease, border-color .12s ease",
                    }}
                  >
                    <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>{DISCIPLINE_ICON[d]}</div>
                    <div className="font-extrabold text-sm">{DISCIPLINE_LABEL[d]}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={() => setDisciplinePicker(false)} className="btn-ghost btn-sm">Annuler</button>
              </div>
            </div>
          )}

          {importOpen && (
            <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-dark)" }}>
              <div className="text-xs text-[var(--color-text-muted)] mb-2 leading-relaxed">
                Colle ton plan en texte. Format :<br />
                <code>Nom: ...</code> / <code>Objectif: ...</code> / <code>KM: ...</code> / <code>D+: ...</code> / <code>CHO: ...</code> / <code>Hydratation: ...</code>
                <br />
                Puis <code>AVANT</code> (lignes), puis <code>#Nom du ravito</code> et ses lignes.
              </div>
              <textarea
                className="input"
                style={{ minHeight: 200, resize: "vertical" }}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Nom: Mont Ventoux UTMB\nObjectif: 10H40\nKM: 87\nD+: 4200\nCHO: 89\nHydratation: 730\nAVANT\n3h avant : petit déjeuner\n#Départ\nFlasque 1 = 90g + 500ml\nGel (1H)\n#Ravito 1\n...`}
              />
              <div className="flex justify-end gap-2 mt-2.5">
                <button onClick={() => setImportOpen(false)} className="btn-ghost">Annuler</button>
                <button onClick={handleImport} className="btn-primary">Importer</button>
              </div>
            </div>
          )}

          {racePlans.map((rp) => (
            <RacePlanCard
              key={rp.id}
              rp={rp}
              onDelete={delPlan}
              onEdit={(p) => setPlanEdit(p)}
              onPrint={(p) => { setPrintPlan(p); setTimeout(() => window.print(), 200); }}
              expanded={expandedPlanIds.has(rp.id)}
              onToggle={() => togglePlan(rp.id)}
            />
          ))}
          {racePlans.length === 0 && <Empty>Aucun plan de course.</Empty>}
        </>
      )}

      {tab === "calc" && (
        <>
          <div className="flex justify-end mb-3.5">
            <button onClick={() => setEditing(blankStrategy())} className="btn-primary">+ Nouvelle stratégie</button>
          </div>

          <div className="flex flex-col gap-3.5">
            {strategies.map((s) => {
              const c = computeTotals(s, allProducts);
              const disc = s.tolDiscipline ?? "Course";
              const { tolGluc: sTolG, tolHydr: sTolH } = tolFor(disc);
              return (
                <div key={s.id} className="card p-4">
                  <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-display font-extrabold text-xl">{s.name}</div>
                        <span
                          style={{
                            fontSize: 10,
                            background: "var(--color-primary)",
                            color: "#fff",
                            padding: "2px 7px",
                            borderRadius: 3,
                            fontWeight: 800,
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                          }}
                        >
                          {TOL_DISCIPLINE_ICON[disc]} {disc}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">{s.duree} h · {s.lines.length} produits</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(s)} className="btn-dark btn-sm">Éditer</button>
                      <button onClick={() => delStrat(s.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>✕</button>
                    </div>
                  </div>
                  <SummaryCards c={c} tolGluc={sTolG} tolHydr={sTolH} />
                </div>
              );
            })}
            {strategies.length === 0 && <Empty>Aucune stratégie calculée.</Empty>}
          </div>
        </>
      )}
      </div>{/* /screen-only */}

      {printPlan && <PlanPrintReport plan={printPlan} />}
    </div>
  );
}
