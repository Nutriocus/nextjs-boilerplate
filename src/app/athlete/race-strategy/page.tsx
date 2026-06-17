"use client";

import { useState, useMemo, useRef } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PrintReport, PrintH, PrintButton, PrintKpi } from "@/components/ui/PrintReport";
import { PRODUCTS_CATALOG, Product } from "@/lib/products-catalog";
import { parseRacePlanFromPdfFile } from "@/lib/parse-race-plan-pdf";

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

type Strategy = {
  id: string;
  name: string;
  duree: number | string;
  poids: number | string;
  lines: Line[];
};

type RacePlanSegment = {
  nom: string;
  km: number | string;
  heure: string;
  temps: string;
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
  avantCourse: string[];
  segments: RacePlanSegment[];
};

const newId = () => Math.random().toString(36).slice(2, 9);
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
  let out = `Nom: ${plan.name}\nObjectif: ${plan.objectif}\nKM: ${plan.km}\nD+: ${plan.dplus}\nCHO: ${plan.choPerH}\nHydratation: ${plan.hydratationPerH}\n`;
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
function RacePlanCard({
  rp,
  onDelete,
  onEdit,
}: {
  rp: RacePlan;
  onDelete?: (id: string) => void;
  onEdit?: (rp: RacePlan) => void;
}) {
  return (
    <div className="card overflow-hidden mb-3.5">
      <div className="bg-[var(--color-dark)] px-4 py-3.5 text-white flex justify-between items-center flex-wrap gap-2">
        <div>
          <div className="font-display font-extrabold text-xl" style={{ letterSpacing: "-0.01em" }}>
            {rp.name}
          </div>
          <div className="text-xs text-[#bbb]">
            {rp.km} km · {rp.dplus} m D+ · objectif {rp.objectif}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-[10px] text-[#bbb]">GLUCIDES</div>
            <div className="text-[var(--color-accent)] font-extrabold text-lg">{rp.choPerH} g/h</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#bbb]">HYDRATATION</div>
            <div className="text-[var(--color-accent)] font-extrabold text-lg">{rp.hydratationPerH} ml/h</div>
          </div>
          {onEdit && (
            <button onClick={() => onEdit(rp)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid #fff4" }}>
              Éditer
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(rp.id)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid #fff4" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {rp.avantCourse && rp.avantCourse.length > 0 && (
          <div className="mb-3.5">
            <div className="kicker mb-1.5">Avant la course</div>
            {rp.avantCourse.map((l, i) => (
              <div key={i} className="text-sm py-0.5">• {l}</div>
            ))}
          </div>
        )}

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
      </div>
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
  const [strategies, setStrategies, loadedS] = useAthleteData<Strategy[]>("strat", []);
  const [racePlans, setRacePlans, loadedR] = useAthleteData<RacePlan[]>("raceplans", []);
  const [custom] = useAthleteData<Product[]>("custom", []);
  const [profile] = useAthleteData<{ poids?: number | string; tolGlucCAP?: number | string; tolHydrCAP?: number | string }>("profile", {});
  const allProducts = useMemo(() => [...PRODUCTS_CATALOG, ...custom], [custom]);

  const tolGluc = toNum(profile.tolGlucCAP) || null;
  const tolHydr = toNum(profile.tolHydrCAP) || null;

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
  const [importingPdf, setImportingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [printPlan, setPrintPlan] = useState<RacePlan | null>(null);
  const [printStrat, setPrintStrat] = useState<Strategy | null>(null);

  const blankStrategy = (): Strategy => ({
    id: newId(),
    name: "Nouvelle stratégie",
    duree: 3,
    poids: toNum(profile.poids) || 70,
    lines: [],
  });

  const blankRacePlan = (): RacePlan => ({
    id: newId(),
    name: "Nouveau plan de course",
    km: "",
    dplus: "",
    objectif: "",
    choPerH: "",
    hydratationPerH: "",
    avantCourse: [""],
    segments: [{ nom: "Départ", km: 0, heure: "", temps: "", contenu: [""] }],
  });

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

  const handleImportPdf = async (file: File) => {
    setImportingPdf(true);
    try {
      const parsed = await parseRacePlanFromPdfFile(file);
      if (!parsed) {
        alert("Impossible de lire ce PDF. Format attendu : plan de course Nutriocus (en-tête COURSE / OBJECTIF / GLUCIDES / HYDRATATION, puis AVANT LA COURSE, puis ravitaillements).");
        return;
      }
      const plan: RacePlan = {
        id: newId(),
        name: parsed.name || "Plan importé",
        km: parsed.km,
        dplus: parsed.dplus,
        objectif: parsed.objectif,
        choPerH: parsed.choPerH,
        hydratationPerH: parsed.hydratationPerH,
        avantCourse: parsed.avantCourse,
        segments: parsed.segments,
      };
      // Ouvre l'éditeur pour relecture/correction avant enregistrement
      setPlanEdit(plan);
      setImportOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la lecture du PDF : " + (e as Error).message);
    } finally {
      setImportingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
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
    return (
      <div>
        <div className="screen-only">
        <PageHeader kicker="Anticiper tes courses" title="Stratégie de course" />

        <div className="card p-4 mb-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Nom de la stratégie"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Durée (h)"><input className="input" value={editing.duree} onChange={(e) => setEditing({ ...editing, duree: e.target.value })} /></Field>
            <Field label="Poids athlète (kg)"><input className="input" value={editing.poids} onChange={(e) => setEditing({ ...editing, poids: e.target.value })} /></Field>
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
          <SummaryCards c={c} tolGluc={tolGluc} tolHydr={tolHydr} />
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
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Plan de course" />

        <div className="card p-4 mb-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <Field label="Nom du plan"><input className="input" value={planEdit.name} onChange={(e) => updatePlan({ name: e.target.value })} /></Field>
            <Field label="KM"><input className="input" value={planEdit.km} onChange={(e) => updatePlan({ km: e.target.value })} /></Field>
            <Field label="D+ (m)"><input className="input" value={planEdit.dplus} onChange={(e) => updatePlan({ dplus: e.target.value })} /></Field>
            <Field label="Objectif"><input className="input" value={planEdit.objectif} onChange={(e) => updatePlan({ objectif: e.target.value })} /></Field>
            <Field label="CHO (g/h)"><input className="input" value={planEdit.choPerH} onChange={(e) => updatePlan({ choPerH: e.target.value })} /></Field>
            <Field label="Hydratation (ml/h)"><input className="input" value={planEdit.hydratationPerH} onChange={(e) => updatePlan({ hydratationPerH: e.target.value })} /></Field>
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="font-extrabold mb-2">Avant la course</div>
          {planEdit.avantCourse.map((l, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <input
                className="input"
                value={l}
                onChange={(e) => updatePlan({ avantCourse: planEdit.avantCourse.map((x, idx) => (idx === i ? e.target.value : x)) })}
              />
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

        {planEdit.segments.map((seg, i) => (
          <div key={i} className="card p-4 mb-3.5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
              <Field label="Nom (ravito)"><input className="input" value={seg.nom} onChange={(e) => updateSeg(i, { nom: e.target.value })} /></Field>
              <Field label="KM"><input className="input" value={seg.km} onChange={(e) => updateSeg(i, { km: e.target.value })} /></Field>
              <Field label="Heure"><input className="input" value={seg.heure} onChange={(e) => updateSeg(i, { heure: e.target.value })} /></Field>
              <Field label="Temps segment"><input className="input" value={seg.temps} onChange={(e) => updateSeg(i, { temps: e.target.value })} /></Field>
              <button onClick={() => updatePlan({ segments: planEdit.segments.filter((_, idx) => idx !== i) })} className="btn-ghost" style={{ color: "var(--color-danger)" }}>Supprimer ravito</button>
            </div>
            <div className="font-extrabold mb-1">Contenu du ravito / segment</div>
            {seg.contenu.map((l, ci) => (
              <div key={ci} className="flex gap-2 mb-1.5">
                <input
                  className="input"
                  value={l}
                  onChange={(e) => updateSeg(i, { contenu: seg.contenu.map((x, idx) => (idx === ci ? e.target.value : x)) })}
                />
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

        <div className="flex justify-between flex-wrap gap-2 mb-4">
          <button
            onClick={() => updatePlan({ segments: [...planEdit.segments, { nom: "Nouveau ravito", km: "", heure: "", temps: "", contenu: [""] }] })}
            className="btn-ghost"
          >
            + Ravitaillement
          </button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPlanEdit(null)} className="btn-ghost">Annuler</button>
            <button onClick={() => downloadExport(planEdit)} className="btn-dark">Exporter en texte</button>
            <button onClick={() => { setPrintPlan(planEdit); setTimeout(() => window.print(), 200); }} className="btn-dark">Exporter en PDF</button>
            <button onClick={() => savePlan(planEdit)} className="btn-primary">Enregistrer</button>
          </div>
        </div>

        {printPlan && (
          <PrintReport
            kicker="Anticiper tes courses"
            title={printPlan.name}
            subtitle={`${printPlan.km} km · ${printPlan.dplus} m D+ · objectif ${printPlan.objectif}`}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
              <PrintKpi label="Glucides" value={printPlan.choPerH} unit="g/h" />
              <PrintKpi label="Hydratation" value={printPlan.hydratationPerH} unit="ml/h" accent="#0a0a0a" />
              <PrintKpi label="Distance" value={printPlan.km} unit="km" accent="#5f8c0a" />
              <PrintKpi label="Dénivelé +" value={printPlan.dplus} unit="m" accent="#cf2e2e" />
            </div>
            {printPlan.avantCourse.length > 0 && (
              <>
                <PrintH>Avant la course</PrintH>
                <div style={{ background: "#fafaf8", borderRadius: 10, padding: "12px 14px", borderLeft: "4px solid #FF4501" }}>
                  {printPlan.avantCourse.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>• {l}</div>
                  ))}
                </div>
              </>
            )}
            <PrintH>Déroulé par ravitaillement</PrintH>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: "#FF450155" }} />
              {printPlan.segments.map((s, i) => (
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                    {s.contenu.map((c, ci) => (
                      <span key={ci} style={{ fontSize: 11, background: "#fff", border: "1px solid #e6e6e3", borderRadius: 7, padding: "4px 9px" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PrintReport>
        )}
      </div>
    );
  }

  // ============================================================
  // MAIN LIST
  // ============================================================
  return (
    <div>
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
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportPdf(f);
              }}
            />
            <button
              onClick={() => pdfInputRef.current?.click()}
              disabled={importingPdf}
              className="btn-ghost"
              title="Importer un plan depuis un PDF Nutriocus"
            >
              {importingPdf ? "Lecture du PDF…" : "📄 Importer un PDF"}
            </button>
            <button onClick={() => setImportOpen((o) => !o)} className="btn-ghost">Importer (texte)</button>
            <button onClick={() => setPlanEdit(blankRacePlan())} className="btn-primary">+ Nouveau plan</button>
          </div>

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
              return (
                <div key={s.id} className="card p-4">
                  <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
                    <div>
                      <div className="font-display font-extrabold text-xl">{s.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{s.duree} h · {s.lines.length} produits</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(s)} className="btn-dark btn-sm">Éditer</button>
                      <button onClick={() => delStrat(s.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>✕</button>
                    </div>
                  </div>
                  <SummaryCards c={c} tolGluc={tolGluc} tolHydr={tolHydr} />
                </div>
              );
            })}
            {strategies.length === 0 && <Empty>Aucune stratégie calculée.</Empty>}
          </div>
        </>
      )}
    </div>
  );
}
