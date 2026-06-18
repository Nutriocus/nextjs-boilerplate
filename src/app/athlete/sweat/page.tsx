"use client";

import { useState, useMemo, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  ReferenceLine,
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

// ===================== PAGE =====================
export default function SweatPage() {
  const [tests, setTests, loaded] = useAthleteData<SweatTest[]>("sweat", []);
  const [profile] = useAthleteData<{ poids?: number | string }>("profile", {});
  const [tab, setTab] = useState<"journal" | "analyse" | "anticipation">("journal");
  const [draft, setDraft] = useState<SweatTest>(blank());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pred, setPred] = useState({
    temp: "20",
    fc: "150",
    humidite: "60",
    duree: "60",
    poids: profile.poids ? String(profile.poids) : "70",
  });

  // Sync prediction weight when profile loads / changes
  useEffect(() => {
    if (profile.poids != null && profile.poids !== "") {
      setPred((p) => ({ ...p, poids: String(profile.poids) }));
    }
  }, [profile.poids]);

  const update = (k: keyof SweatTest, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    if (!draft.duree) return;
    setTests((prev) => {
      if (editingId) {
        return prev.map((t) => (t.id === editingId ? { ...draft, id: editingId } : t))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      return [...prev, { ...draft, id: newId() }].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    setDraft(blank());
    setOpen(false);
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce test ?")) return;
    setTests((prev) => prev.filter((t) => t.id !== id));
    if (viewingId === id) setViewingId(null);
  };

  const startEdit = (t: SweatTest) => {
    setDraft({ ...t });
    setEditingId(t.id);
    setOpen(true);
    setViewingId(null);
  };

  const startNew = () => {
    setDraft(blank());
    setEditingId(null);
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    setDraft(blank());
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
              <div className="font-extrabold mb-3">{editingId ? "✎ Modifier le test" : "+ Nouveau test"}</div>
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
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={closeForm} className="btn-ghost">Annuler</button>
                <button onClick={save} className="btn-primary">{editingId ? "Enregistrer les modifications" : "Ajouter"}</button>
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
              <div className="text-[10px] text-[var(--color-text-muted)]">
                Pré-rempli depuis ton profil. Modifie si besoin.
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
                  const dureeH = toNum(pred.duree) / 60;
                  const poidsKg = toNum(pred.poids);
                  // 2.5% rule: max tolerable water loss = 2.5% × body weight (in ml = 25 × kg)
                  const maxLossMl = poidsKg * 25; // 0.025 × kg × 1000 ml/kg
                  const totalSweatMl = prediction.predicted * dureeH;
                  const toIngestTotalMl = Math.max(0, totalSweatMl - maxLossMl);
                  const toIngestPerH = dureeH > 0 ? toIngestTotalMl / dureeH : 0;
                  const lossPctIfZero = poidsKg > 0 ? (totalSweatMl / (poidsKg * 1000)) * 100 : 0;
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

                      {/* Warnings */}
                      <div className="mt-4 space-y-1.5 text-xs">
                        {!willCompensate && (
                          <div
                            className="p-2.5 rounded"
                            style={{ background: "rgba(95,140,10,0.10)", color: "var(--color-success)" }}
                          >
                            ✓ Avec une durée de {pred.duree} min, tu peux rester sous 2,5 % de déshydratation <b>sans rien boire</b>
                            (perte estimée : {lossPctIfZero.toFixed(1)} %). Bois quand même pour le confort.
                          </div>
                        )}
                        {toIngestPerH > 1000 && (
                          <div
                            className="p-2.5 rounded"
                            style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}
                          >
                            ⚠ Plus de 1 000 ml/h à ingérer = au-delà de la tolérance digestive moyenne. Travaille en amont ta
                            tolérance hydrique (voir le module &quot;Tests de tolérance&quot;).
                          </div>
                        )}
                        {toIngestPerH >= 500 && toIngestPerH <= 1000 && (
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
            <Tooltip formatter={(v: number, name) => [v, name === "x" ? xLabel : "Sudation (ml/h)"]} cursor={{ strokeDasharray: "3 3" }} />
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
