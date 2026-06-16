"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PRODUCTS_CATALOG, Product } from "@/lib/products-catalog";

type Line = {
  id: string;
  mode: "db" | "manual";
  key?: string; // for db
  name?: string; // for manual
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

const newId = () => Math.random().toString(36).slice(2, 9);
function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

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

export default function RaceStrategyPage() {
  const [strategies, setStrategies, loaded] = useAthleteData<Strategy[]>("strat", []);
  const [custom] = useAthleteData<Product[]>("custom", []);
  const [profile] = useAthleteData<{ poids?: number | string; tolGlucCAP?: number | string; tolHydrCAP?: number | string }>("profile", {});
  const allProducts = useMemo(() => [...PRODUCTS_CATALOG, ...custom], [custom]);

  const tolGluc = toNum(profile.tolGlucCAP) || null;
  const tolHydr = toNum(profile.tolHydrCAP) || null;

  const [editing, setEditing] = useState<Strategy | null>(null);
  const [pickKey, setPickKey] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState({ name: "", g: "", hydr: "", s: "", c: "", r: "1:0.8" });

  const blankStrategy = (): Strategy => ({
    id: newId(),
    name: "Nouvelle stratégie",
    duree: 3,
    poids: toNum(profile.poids) || 70,
    lines: [],
  });

  const save = (s: Strategy) => {
    setStrategies((p) => (p.some((x) => x.id === s.id) ? p.map((x) => (x.id === s.id ? s : x)) : [...p, s]));
    setEditing(null);
  };

  const del = (id: string) => {
    if (confirm("Supprimer ?")) setStrategies((p) => p.filter((s) => s.id !== id));
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Stratégie de course" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (editing) {
    const c = computeTotals(editing, allProducts);
    return (
      <div>
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
              <select className="input" style={{ minWidth: 300 }} value={pickKey} onChange={(e) => setPickKey(e.target.value)}>
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
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
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
              <div className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                Pour de l&apos;eau pure : Glucides 0, Hydratation = volume (ml), Sodium = sel ajouté.
              </div>
            </div>
          )}

          <div className="mt-3.5 flex flex-col gap-2">
            {editing.lines.map((l) => {
              const r = resolveProduct(l, allProducts);
              if (!r) return null;
              return (
                <div key={l.id} className="flex items-center gap-3 bg-[var(--color-surface-2)] rounded-lg px-3 py-2 flex-wrap">
                  <div className="flex-1" style={{ minWidth: 180 }}>
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
                    <span className="text-xs text-[var(--color-text-muted)]">total</span>
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

        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
          <button onClick={() => save(editing)} className="btn-primary">Enregistrer</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Stratégie de course"
        action={<button onClick={() => setEditing(blankStrategy())} className="btn-primary">+ Nouvelle stratégie</button>}
        desc="Tes stratégies de course avec calculateur de produits (glucides, sodium, hydratation, caféine) validé vs ta tolérance."
      />

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
                  <button onClick={() => del(s.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>✕</button>
                </div>
              </div>
              <SummaryCards c={c} tolGluc={tolGluc} tolHydr={tolHydr} />
            </div>
          );
        })}
        {strategies.length === 0 && <Empty>Aucune stratégie calculée.</Empty>}
      </div>
    </div>
  );
}
