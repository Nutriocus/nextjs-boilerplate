"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";

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
const today = () => new Date().toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 9);
const dateShort = (d: string) => {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return d;
  }
};

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

export default function SweatPage() {
  const [tests, setTests, loaded] = useAthleteData<SweatTest[]>("sweat", []);
  const [draft, setDraft] = useState<SweatTest>(blank());

  const update = (k: keyof SweatTest, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const add = () => {
    if (!draft.duree) return;
    setTests((prev) =>
      [...prev, { ...draft, id: newId() }].sort((a, b) =>
        a.date < b.date ? 1 : -1,
      ),
    );
    setDraft(blank());
  };

  const remove = (id: string) =>
    setTests((prev) => prev.filter((t) => t.id !== id));

  const withCalcs = tests.map((t) => ({ ...t, ...compute(t) }));
  const valid = withCalcs.filter((t) => t.mlh != null);
  const avg = valid.length
    ? valid.reduce((s, v) => s + (v.mlh as number), 0) / valid.length
    : null;
  const max = valid.length ? Math.max(...valid.map((v) => v.mlh as number)) : null;

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
        desc="Taux de sudation (ml/min) = ((poids avant − poids après)×1000 + eau ingérée − urine) / durée. ml/h = ml/min × 60."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Kpi label="Taux de sudation moyen" value={avg != null ? Math.round(avg) : "—"} unit="ml/h" color="var(--color-primary)" />
        <Kpi label="Taux maximal observé" value={max != null ? Math.round(max) : "—"} unit="ml/h" color="var(--color-danger)" />
        <Kpi label="Séances mesurées" value={valid.length} color="var(--color-dark)" />
      </div>

      <div className="card p-4 mb-4">
        <div className="font-extrabold mb-3">Nouvelle séance</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => update("date", e.target.value)} /></Field>
          <Field label="Type d'exercice"><input className="input" value={draft.type} onChange={(e) => update("type", e.target.value)} /></Field>
          <Field label="Durée (min)"><input className="input" value={draft.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
          <Field label="FC moyenne (bpm)"><input className="input" value={draft.fc} onChange={(e) => update("fc", e.target.value)} /></Field>
          <Field label="Poids avant (kg)"><input className="input" value={draft.poidsAvant} onChange={(e) => update("poidsAvant", e.target.value)} /></Field>
          <Field label="Poids après (kg)"><input className="input" value={draft.poidsApres} onChange={(e) => update("poidsApres", e.target.value)} /></Field>
          <Field label="Eau ingérée (ml)"><input className="input" value={draft.eau} onChange={(e) => update("eau", e.target.value)} /></Field>
          <Field label="Urine (ml)"><input className="input" value={draft.urine} onChange={(e) => update("urine", e.target.value)} /></Field>
          <Field label="Température (°C)"><input className="input" value={draft.temp} onChange={(e) => update("temp", e.target.value)} /></Field>
          <Field label="Humidité (%)"><input className="input" value={draft.humidite} onChange={(e) => update("humidite", e.target.value)} /></Field>
          <Field label="Vent (km/h)"><input className="input" value={draft.vent} onChange={(e) => update("vent", e.target.value)} /></Field>
          <Field label="Indice UV"><input className="input" value={draft.uv} onChange={(e) => update("uv", e.target.value)} /></Field>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={add} className="btn-primary">Ajouter</button>
        </div>
      </div>

      {withCalcs.length > 0 ? (
        <div className="card overflow-auto">
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Durée</th><th>FC</th><th>P.avant</th><th>P.après</th>
                <th>Eau</th><th>Urine</th><th>ml/min</th><th>ml/h</th><th>Temp</th><th>Hum.</th><th></th>
              </tr>
            </thead>
            <tbody>
              {withCalcs.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700 }}>{dateShort(t.date)}</td>
                  <td>{t.type}</td>
                  <td>{t.duree}</td>
                  <td>{t.fc || "—"}</td>
                  <td>{t.poidsAvant || "—"}</td>
                  <td>{t.poidsApres || "—"}</td>
                  <td>{t.eau || "—"}</td>
                  <td>{t.urine || "—"}</td>
                  <td style={{ color: "var(--color-primary)", fontWeight: 700 }}>{t.mlmin != null ? t.mlmin.toFixed(1) : "—"}</td>
                  <td style={{ color: "var(--color-primary)", fontWeight: 800 }}>{t.mlh != null ? Math.round(t.mlh) : "—"}</td>
                  <td>{t.temp || "—"}</td>
                  <td>{t.humidite || "—"}</td>
                  <td>
                    <button onClick={() => remove(t.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucune séance. Pèse-toi avant/après pour calculer ton taux de sudation.</Empty>
      )}
    </div>
  );
}
