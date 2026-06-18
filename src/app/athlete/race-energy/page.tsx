"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

// =====================================================================
// Race energy expenditure — segment-by-segment, based on GPT pacing plan
//
// Formula:
//   Keytel et al. (2005) — heart-rate-based energy expenditure
//   Men:    kcal/min = (-55.0969 + 0.6309·FC + 0.1988·W + 0.2017·age) / 4.184
//   Women:  kcal/min = (-20.4022 + 0.4472·FC - 0.1263·W + 0.074·age) / 4.184
// =====================================================================

type Segment = {
  id: string;
  nom: string;
  km: string;
  dplus: string;
  dmoins: string;
  dureeMin: string;
  fcCible: string;
  terrain?: string;
  objectif?: string;
};

type PacingPlan = {
  id: string;
  name: string;
  raceDate: string;
  segments: Segment[];
  cibleCho: string; // g/h target (overrides profile.tolGlucCAP if set)
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Keytel formula
function keytelKcalPerMin(fc: number, weight: number, age: number, isWoman: boolean): number {
  if (fc <= 0 || weight <= 0 || age <= 0) return 0;
  if (isWoman) {
    return (-20.4022 + 0.4472 * fc - 0.1263 * weight + 0.074 * age) / 4.184;
  }
  return (-55.0969 + 0.6309 * fc + 0.1988 * weight + 0.2017 * age) / 4.184;
}

function durationFromString(s: string): number {
  if (!s) return 0;
  // Accept "1h05" / "1:05" / "65" / "65 min"
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

// Parser: tries to extract segments from a pasted GPT table (markdown or tabular)
function parseGptTable(text: string): Segment[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const segments: Segment[] = [];
  for (const line of lines) {
    // Markdown table row: starts with "|"
    if (!line.includes("|") && !line.includes("\t")) continue;
    // Skip separator rows like |---|---|
    if (/^[\s|:-]+$/.test(line)) continue;
    const cells = line.includes("|")
      ? line.split("|").map((c) => c.trim()).filter((c) => c.length > 0)
      : line.split("\t").map((c) => c.trim());
    if (cells.length < 3) continue;
    // Try to detect header row
    if (cells.some((c) => /segment|distance|d\+|durée|fc|km/i.test(c)) && !cells.some((c) => /^\d+([.,]\d+)?$/.test(c))) continue;

    // Heuristic mapping: first cell = name, then look for numeric values
    // We accept cells like: Name | distance | D+ | terrain | durée | FC | objectif
    // Or shorter / different orders
    const nom = cells[0];
    // Find first number-like cell after the name → distance km
    const numericCells = cells.slice(1).map((c) => {
      const n = c.match(/-?\d+([.,]\d+)?/);
      return n ? parseFloat(n[0].replace(",", ".")) : null;
    });
    // Heuristic: first num = km, second num (often signed) = d+ (positive), third = duration (>20), FC (~100-200) detected by range
    const km = String(numericCells[0] ?? "");
    // D+ : look for positive value <2000 right after km
    const dplus = numericCells[1] != null && numericCells[1] >= 0 ? String(Math.round(numericCells[1])) : "";
    // Duration: any cell that looks like X-150 min or X h
    let dureeMin = "";
    let fcCible = "";
    for (let i = 1; i < cells.length; i++) {
      const cell = cells[i];
      // Duration: "1h05", "65 min", "65"
      if (!dureeMin && /\d+\s*h\s*\d{1,2}/i.test(cell)) {
        dureeMin = String(durationFromString(cell));
      } else if (!dureeMin && /\d+\s*min/i.test(cell)) {
        dureeMin = String(durationFromString(cell));
      }
      // FC: look for 80-200 range
      const fcMatch = cell.match(/\b(1[0-9]{2}|[8-9][0-9])\b/);
      if (!fcCible && fcMatch && /fc|bpm|cible/i.test(cells.join(" "))) {
        fcCible = fcMatch[1];
      }
    }
    // Fallback: if no FC found via context, take any 80-200 number that's not km/D+
    if (!fcCible) {
      for (const n of numericCells) {
        if (n != null && n >= 80 && n <= 200 && n !== toNum(km) && n !== toNum(dplus)) {
          fcCible = String(Math.round(n));
          break;
        }
      }
    }
    // Fallback duration: any number 20-600
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
      terrain: "",
      objectif: "",
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
  terrain: "",
  objectif: "",
});

const GPT_LINK = "https://chatgpt.com/g/g-trail-pacing-engine-nutriocus";

// =====================================================================
// PAGE
// =====================================================================
export default function RaceEnergyPage() {
  const [profile] = useAthleteData<{
    sexe?: string;
    age?: number | string;
    poids?: number | string;
    masseMaigre?: number | string;
    reservesGlucides?: number | string;
    tolGlucCAP?: number | string;
    tolGlucCyc?: number | string;
    tolHydrCAP?: number | string;
  }>("profile", {});

  const [plans, setPlans, loaded] = useAthleteData<PacingPlan[]>("pacing_plans", []);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const current = plans.find((p) => p.id === currentId);

  // Default discipline tolerance — fallback if cibleCho not set
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

  const newPlan = () => {
    const p: PacingPlan = {
      id: newId(),
      name: "Nouvelle stratégie de pacing",
      raceDate: today(),
      segments: [BLANK_SEGMENT()],
      cibleCho: String(defaultTol),
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
      alert("Aucun segment trouvé. Colle bien un tableau markdown ou tabulé (Segment | distance | D+ | durée | FC cible).");
      return;
    }
    updatePlan({ segments: parsed });
    setPasteText("");
    setPasteOpen(false);
  };

  // ============== COMPUTATION ==============
  const isWoman = (profile.sexe || "").toLowerCase().includes("femme");
  const poidsKg = toNum(profile.poids);
  const ageY = toNum(profile.age) || 30;
  const reservesGlycogene = toNum(profile.reservesGlucides) || 500;
  const cibleChoH = current ? toNum(current.cibleCho) || defaultTol : defaultTol;

  const enriched = useMemo(() => {
    if (!current) return [];
    return current.segments.map((s) => {
      const fc = toNum(s.fcCible);
      const dur = toNum(s.dureeMin);
      const kcalPerMin = keytelKcalPerMin(fc, poidsKg, ageY, isWoman);
      const kcalTotal = Math.max(0, kcalPerMin * dur);
      const choIngerable = (cibleChoH * dur) / 60; // g
      const choKcal = choIngerable * 4; // 1g CHO = 4 kcal
      const deficit = kcalTotal - choKcal; // kcal puisés dans les réserves
      const pente = toNum(s.km) > 0
        ? ((toNum(s.dplus) - toNum(s.dmoins)) / (toNum(s.km) * 1000)) * 100
        : 0;
      return {
        ...s,
        kcalPerMin: Math.round(kcalPerMin * 10) / 10,
        kcalTotal: Math.round(kcalTotal),
        choIngerable: Math.round(choIngerable),
        choKcal: Math.round(choKcal),
        deficit: Math.round(deficit),
        pente: Math.round(pente * 10) / 10,
        dur,
      };
    });
  }, [current, poidsKg, ageY, isWoman, cibleChoH]);

  const totals = useMemo(() => {
    if (!enriched.length) return null;
    const totKcal = enriched.reduce((s, e) => s + e.kcalTotal, 0);
    const totMin = enriched.reduce((s, e) => s + e.dur, 0);
    const totKm = enriched.reduce((s, e) => s + toNum(e.km), 0);
    const totDplus = enriched.reduce((s, e) => s + toNum(e.dplus), 0);
    const totCho = enriched.reduce((s, e) => s + e.choIngerable, 0);
    const totChoKcal = totCho * 4;
    const deficit = totKcal - totChoKcal;
    const stockGlycoKcal = reservesGlycogene * 4;
    const afterStock = Math.max(0, deficit - stockGlycoKcal);
    return {
      totKcal,
      totMin,
      totKm,
      totDplus,
      totCho,
      totChoKcal,
      deficit,
      stockGlycoKcal,
      afterStock,
      kcalPerH: totMin > 0 ? Math.round((totKcal / totMin) * 60) : 0,
      coveredPct: totKcal > 0 ? Math.round(((totChoKcal + stockGlycoKcal) / totKcal) * 100) : 0,
    };
  }, [enriched, reservesGlycogene]);

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Dépenses énergétiques en course" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  // ============== PLAN LIST VIEW ==============
  if (!current) {
    return (
      <div>
        <PageHeader
          kicker="Anticiper tes courses"
          title="Dépenses énergétiques en course"
          desc="Estimation segment par segment de tes besoins énergétiques, basée sur ton plan de pacing (idéalement généré par ton GPT Trail Pacing Engine Nutriocus)."
          action={
            <div className="flex gap-1.5 flex-wrap">
              <a href={GPT_LINK} target="_blank" rel="noopener noreferrer" className="btn-dark btn-sm">
                🤖 GPT Trail Pacing
              </a>
              <button onClick={newPlan} className="btn-primary">+ Nouveau plan</button>
            </div>
          }
        />

        {plans.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-2">🏔️</div>
            <div className="font-extrabold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Crée ton premier plan de pacing
            </div>
            <div className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
              Génère ton plan via le <b>GPT Trail Pacing Engine Nutriocus</b>, puis colle-le ici.
              On calcule automatiquement la dépense énergétique par segment et le déficit à anticiper.
            </div>
            <button onClick={newPlan} className="btn-primary">+ Nouveau plan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentId(p.id)}
                className="card p-4 text-left cursor-pointer hover:-translate-y-0.5 transition"
                style={{ borderLeft: "5px solid var(--color-primary)" }}
              >
                <div className="font-extrabold text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {p.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {p.segments.length} segment{p.segments.length > 1 ? "s" : ""} · cible {p.cibleCho || defaultTol} g/h
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============== PLAN EDIT/VIEW ==============
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Nom du plan">
            <input className="input" value={current.name} onChange={(e) => updatePlan({ name: e.target.value })} />
          </Field>
          <Field label="Date course">
            <input type="date" className="input" value={current.raceDate} onChange={(e) => updatePlan({ raceDate: e.target.value })} />
          </Field>
          <Field
            label={
              <InfoTooltip
                label="Cible CHO (g/h)"
                content={
                  <>
                    Tolérance glucidique testée à l&apos;effort.
                    <br />Pré-rempli depuis ton profil ({defaultTol} g/h pour la CAP/Trail).
                    <br />Module &laquo; Tests de tolérance &raquo; pour la mesurer.
                  </>
                }
              />
            }
          >
            <input className="input" value={current.cibleCho} onChange={(e) => updatePlan({ cibleCho: e.target.value })} />
          </Field>
          <div className="text-xs text-[var(--color-text-muted)] self-end pb-2">
            Calcul : <b>Keytel (2005)</b> = FC + poids + âge + sexe
          </div>
        </div>
      </div>

      {/* Paste GPT */}
      {pasteOpen && (
        <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-dark)" }}>
          <div className="text-xs text-[var(--color-text-muted)] mb-2">
            Colle ici la sortie du GPT (tableau markdown ou tabulé) avec : <b>Segment | distance | D+ | durée | FC cible</b>.
            Le parser détecte automatiquement les colonnes.
          </div>
          <textarea
            className="input"
            style={{ minHeight: 160, resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`| Segment | Distance (km) | D+ (m) | Durée | FC cible |
|---------|---------------|--------|-------|----------|
| Départ → Col 1 | 7.2 | 380 | 1h05 | 145 |
| Col 1 → Plateau | 4.8 | 30 | 0h35 | 152 |`}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setPasteOpen(false)} className="btn-ghost btn-sm">Annuler</button>
            <button onClick={importFromPaste} className="btn-primary btn-sm">
              Remplacer les segments
            </button>
          </div>
        </div>
      )}

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Kpi label="Dépense totale" value={totals.totKcal.toLocaleString("fr-FR")} unit="kcal" color="var(--color-primary)" />
          <Kpi label="Dépense moyenne" value={totals.kcalPerH} unit="kcal/h" color="var(--color-dark)" />
          <Kpi label="CHO ingérables" value={Math.round(totals.totCho)} unit="g" note={`${Math.round(totals.totChoKcal)} kcal`} color="var(--color-success)" />
          <Kpi
            label="Couverture"
            value={Math.min(100, totals.coveredPct)}
            unit="%"
            note={totals.afterStock > 0 ? `Déficit ${Math.round(totals.afterStock)} kcal` : "OK"}
            color={totals.coveredPct >= 100 ? "var(--color-success)" : totals.coveredPct >= 75 ? "var(--color-primary)" : "var(--color-danger)"}
          />
        </div>
      )}

      {/* Segments table */}
      <div className="card overflow-auto mb-4">
        <table className="table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Segment</th>
              <th>KM</th>
              <th>D+</th>
              <th>D−</th>
              <th>Pente</th>
              <th>Durée</th>
              <th>FC cible</th>
              <th>kcal/min</th>
              <th>kcal total</th>
              <th>CHO ingérable</th>
              <th>Déficit kcal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((s) => (
              <tr key={s.id}>
                <td><input className="input" style={{ minWidth: 130 }} value={s.nom} onChange={(e) => updateSeg(s.id, { nom: e.target.value })} placeholder="Départ → Col 1" /></td>
                <td><input className="input" style={{ width: 60 }} value={s.km} onChange={(e) => updateSeg(s.id, { km: e.target.value })} /></td>
                <td><input className="input" style={{ width: 60 }} value={s.dplus} onChange={(e) => updateSeg(s.id, { dplus: e.target.value })} /></td>
                <td><input className="input" style={{ width: 60 }} value={s.dmoins} onChange={(e) => updateSeg(s.id, { dmoins: e.target.value })} /></td>
                <td style={{ color: s.pente > 5 ? "var(--color-danger)" : s.pente < -5 ? "var(--color-success)" : "var(--color-text-muted)", fontWeight: 600 }}>
                  {s.pente !== 0 ? (s.pente > 0 ? "+" : "") + s.pente + " %" : "—"}
                </td>
                <td><input className="input" style={{ width: 60 }} value={s.dureeMin} onChange={(e) => updateSeg(s.id, { dureeMin: e.target.value })} title="Minutes" /></td>
                <td><input className="input" style={{ width: 60 }} value={s.fcCible} onChange={(e) => updateSeg(s.id, { fcCible: e.target.value })} /></td>
                <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{s.kcalPerMin > 0 ? s.kcalPerMin : "—"}</td>
                <td style={{ fontWeight: 800, color: "var(--color-primary)" }}>{s.kcalTotal > 0 ? s.kcalTotal : "—"}</td>
                <td style={{ color: "var(--color-success)", fontWeight: 600 }}>{s.choIngerable > 0 ? `${s.choIngerable} g` : "—"}</td>
                <td style={{ fontWeight: 700, color: s.deficit > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {s.deficit !== 0 ? (s.deficit > 0 ? "−" : "+") + Math.abs(s.deficit) : "0"}
                </td>
                <td>
                  <button onClick={() => removeSegment(s.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button onClick={addSegment} className="btn-ghost btn-sm">+ Ajouter un segment</button>
        </div>
      </div>

      {/* Analysis / recommendations */}
      {totals && totals.totKcal > 0 && (
        <div className="card p-4">
          <div className="font-extrabold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            📊 Analyse énergétique
          </div>

          {/* Visual bar */}
          <div className="mb-4">
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1.5" style={{ letterSpacing: ".06em" }}>
              Couverture des {totals.totKcal.toLocaleString("fr-FR")} kcal totales
            </div>
            <div className="h-4 rounded-full overflow-hidden flex" style={{ background: "var(--color-surface-2)" }}>
              <div
                style={{
                  width: `${Math.min(100, (totals.totChoKcal / totals.totKcal) * 100)}%`,
                  background: "var(--color-success)",
                }}
                title={`CHO ingérés en course : ${Math.round(totals.totChoKcal)} kcal`}
              />
              <div
                style={{
                  width: `${Math.min(100 - (totals.totChoKcal / totals.totKcal) * 100, (totals.stockGlycoKcal / totals.totKcal) * 100)}%`,
                  background: "var(--color-primary)",
                }}
                title={`Réserves glycogène : ${Math.round(totals.stockGlycoKcal)} kcal`}
              />
              {totals.afterStock > 0 && (
                <div
                  style={{
                    width: `${(totals.afterStock / totals.totKcal) * 100}%`,
                    background: "var(--color-danger)",
                  }}
                  title={`Déficit après stock : ${Math.round(totals.afterStock)} kcal`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-[var(--color-text-muted)] mt-1.5">
              <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-success)", borderRadius: 2, marginRight: 4 }} />CHO en course ({Math.round(totals.totChoKcal)} kcal)</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-primary)", borderRadius: 2, marginRight: 4 }} />Réserves glycogène ({Math.round(totals.stockGlycoKcal)} kcal)</span>
              {totals.afterStock > 0 && (
                <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-danger)", borderRadius: 2, marginRight: 4 }} />Déficit ({Math.round(totals.afterStock)} kcal)</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2 text-sm">
            {totals.coveredPct >= 100 && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(95,140,10,0.10)", color: "var(--color-success)" }}>
                ✅ <b>Stratégie viable</b> : tes apports glucidiques en course + tes réserves de glycogène couvrent {totals.coveredPct >= 110 ? "largement" : ""} les besoins ({totals.coveredPct}%). Concentre-toi sur l&apos;exécution.
              </div>
            )}
            {totals.coveredPct >= 75 && totals.coveredPct < 100 && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,69,1,0.10)", color: "var(--color-primary)" }}>
                ⚠ <b>Couverture à {totals.coveredPct} %</b> — déficit de {Math.round(totals.afterStock)} kcal. Acceptable sur du long si tu es bien adapté à oxyder les lipides, mais surveille la fatigue tardive.
              </div>
            )}
            {totals.coveredPct < 75 && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}>
                🚨 <b>Couverture insuffisante ({totals.coveredPct} %)</b> — déficit de {Math.round(totals.afterStock)} kcal. Risque de coup de pompe. Options :
                <ul className="list-disc pl-5 mt-1 text-xs">
                  <li>Augmenter ta tolérance glucidique en amont (module &laquo; Tests de tolérance &raquo;)</li>
                  <li>Réduire l&apos;intensité cible (FC plus basse)</li>
                  <li>Mieux pré-charger les réserves (J-4 → J-1 plus glucidiques)</li>
                </ul>
              </div>
            )}
            {enriched.some((s) => s.deficit > 200) && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(207,46,46,0.06)", color: "var(--color-text)" }}>
                🚩 <b>Segments à risque énergétique</b> :{" "}
                {enriched.filter((s) => s.deficit > 200).map((s) => s.nom || "?").join(" · ")}
                <br />
                <span className="text-xs text-[var(--color-text-muted)]">Déficit &gt; 200 kcal sur ce segment isolé — anticipe avec un gel ou une boisson plus concentrée juste avant.</span>
              </div>
            )}
          </div>

          {/* Profile context */}
          <div className="text-[10px] text-[var(--color-text-muted)] mt-4 pt-3 border-t border-[var(--color-border)]">
            Calcul basé sur ton profil : {profile.sexe || "—"} · {poidsKg || "—"} kg · {ageY || "—"} ans · réserves glycogène {reservesGlycogene} g · cible CHO {cibleChoH} g/h.
            <br />
            ⓘ Formule Keytel et al. (2005) — précision ±10 %. Ne tient pas compte des variations terrain/température au-delà de l&apos;impact sur la FC.
          </div>
        </div>
      )}
    </div>
  );
}
