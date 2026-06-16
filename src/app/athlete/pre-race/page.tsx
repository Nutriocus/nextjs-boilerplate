"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";

type PreraceData = {
  poids: number | string;
  gPerKg: { j4: number | string; j3: number | string; j2: number | string; j1: number | string };
  breakfasts: { nom: string; items: string[] }[];
  notes: string;
};

const DEFAULT: PreraceData = {
  poids: 71,
  gPerKg: { j4: 8, j3: 10, j2: 12, j1: 6 },
  breakfasts: [
    {
      nom: "Option 1 — Salé/sucré",
      items: ["Pain de mie complet + miel", "Oeufs", "Flocons d'avoine + banane", "Compote"],
    },
    {
      nom: "Option 2 — Avoine",
      items: ["Porridge flocons d'avoine + lait", "Miel + fruits rouges", "Pain + confiture"],
    },
    {
      nom: "Option 3 — Léger digeste",
      items: ["Riz au lait", "Banane bien mûre", "Pain blanc + miel", "Compote"],
    },
  ],
  notes: "",
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

const DAYS = [
  { k: "j4", label: "J-4", desc: "Charge progressive, féculents bien tolérés" },
  { k: "j3", label: "J-3", desc: "Montée de la charge" },
  { k: "j2", label: "J-2", desc: "Pic de surcompensation" },
  { k: "j1", label: "J-1 / Jour J", desc: "Optimisation digestive, peu de fibres" },
] as const;

export default function PreRacePage() {
  const [data, setData, loaded] = useAthleteData<PreraceData>("prerace", DEFAULT);
  const [local, setLocal] = useState<PreraceData>(DEFAULT);

  useEffect(() => {
    if (loaded) setLocal(data);
  }, [loaded, data]);

  const updatePoids = (v: string) => {
    const d = { ...local, poids: v };
    setLocal(d);
    setData(d);
  };

  const updateGperKg = (k: keyof PreraceData["gPerKg"], v: string) => {
    const d = { ...local, gPerKg: { ...local.gPerKg, [k]: toNum(v) } };
    setLocal(d);
    setData(d);
  };

  const updateBreakfastName = (i: number, name: string) => {
    const d = { ...local, breakfasts: local.breakfasts.map((b, idx) => (idx === i ? { ...b, nom: name } : b)) };
    setLocal(d);
    setData(d);
  };

  const updateBreakfastItem = (bi: number, ii: number, v: string) => {
    const d = {
      ...local,
      breakfasts: local.breakfasts.map((b, idx) =>
        idx !== bi ? b : { ...b, items: b.items.map((x, j) => (j === ii ? v : x)) },
      ),
    };
    setLocal(d);
    setData(d);
  };

  const addItem = (bi: number) => {
    const d = {
      ...local,
      breakfasts: local.breakfasts.map((b, idx) => (idx === bi ? { ...b, items: [...b.items, ""] } : b)),
    };
    setLocal(d);
    setData(d);
  };

  const removeItem = (bi: number, ii: number) => {
    const d = {
      ...local,
      breakfasts: local.breakfasts.map((b, idx) =>
        idx !== bi ? b : { ...b, items: b.items.filter((_, j) => j !== ii) },
      ),
    };
    setLocal(d);
    setData(d);
  };

  const updateNotes = (v: string) => {
    const d = { ...local, notes: v };
    setLocal(d);
    setData(d);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Structurer ton quotidien" title="Avant la course (J-4 → Jour J)" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  const poids = toNum(local.poids);

  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Avant la course (J-4 → Jour J)"
        desc="Saisis le poids de l'athlète : les cibles glucidiques de chaque jour s'ajustent automatiquement (g/kg × poids). Les 3 options de petit-déjeuner sont communes à tous les poids."
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <Field label="Poids athlète (kg)"><input className="input" value={local.poids} onChange={(e) => updatePoids(e.target.value)} /></Field>
          <Field label="J-4 (g/kg)"><input className="input" value={local.gPerKg.j4} onChange={(e) => updateGperKg("j4", e.target.value)} /></Field>
          <Field label="J-3 (g/kg)"><input className="input" value={local.gPerKg.j3} onChange={(e) => updateGperKg("j3", e.target.value)} /></Field>
          <Field label="J-2 (g/kg)"><input className="input" value={local.gPerKg.j2} onChange={(e) => updateGperKg("j2", e.target.value)} /></Field>
          <Field label="J-1/J (g/kg)"><input className="input" value={local.gPerKg.j1} onChange={(e) => updateGperKg("j1", e.target.value)} /></Field>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {DAYS.map((d) => {
          const gk = toNum(local.gPerKg[d.k as keyof PreraceData["gPerKg"]]);
          const total = Math.round(gk * poids);
          return (
            <div
              key={d.k}
              className="card overflow-hidden"
              style={{ borderTop: `3px solid var(--color-primary)` }}
            >
              <div className="bg-[var(--color-primary)] px-4 py-3 flex justify-between items-center text-white">
                <div className="font-extrabold uppercase text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  {d.label}
                </div>
                <div className="text-sm font-bold">
                  {gk} g/kg → {total} g CHO
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm text-[var(--color-text-muted)]">{d.desc}</div>
                <div className="mt-3 text-sm">
                  <b className="text-[var(--color-primary)]">Cible glucidique :</b> {total} g
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PageHeader kicker="" title="Petits déjeuners — 3 options" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {local.breakfasts.map((b, i) => (
          <div key={i} className="card p-4" style={{ borderTop: `3px solid var(--color-accent)` }}>
            <input
              className="input font-extrabold mb-2"
              value={b.nom}
              onChange={(e) => updateBreakfastName(i, e.target.value)}
            />
            {b.items.map((it, j) => (
              <div key={j} className="flex gap-1.5 mb-1.5">
                <input className="input text-sm" value={it} onChange={(e) => updateBreakfastItem(i, j, e.target.value)} />
                <button onClick={() => removeItem(i, j)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
              </div>
            ))}
            <button onClick={() => addItem(i)} className="btn-ghost btn-xs mt-1">+ Aliment</button>
          </div>
        ))}
      </div>

      <div className="card p-4 mt-4">
        <Field label="Notes / commentaires libres">
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={local.notes}
            onChange={(e) => updateNotes(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
