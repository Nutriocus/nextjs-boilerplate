"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

type Entry = {
  id: string;
  date: string;
  energieMatin: "Bonne" | "Moyenne" | "Faible";
  energieMidi: "Bonne" | "Moyenne" | "Faible";
  energieSoir: "Bonne" | "Moyenne" | "Faible";
  fcRepos: string;
  vfc: string;
  sommeil: "Bon" | "Moyen" | "Mauvais";
  coucher: string;
  lever: string;
  humeur: "Bonne" | "Moyenne" | "Faible";
  stress: "Léger" | "Correct" | "Intense";
  motivation: "Elevée" | "Moyenne" | "Faible";
  entrainement: string;
  duree: string;
  intensite: string;
  rpePendant: string;
  rpeApres: string;
  depenseSortie: string;
  nap: string;
  kcal: string;
  prot: string;
  lip: string;
  gluc: string;
  qualite: string;
  hydratation: string;
  faim: string;
  commentaire: string;
};

const fgMap = { Bonne: 3, Moyenne: 2, Faible: 1 };
const slMap = { Bon: 3, Moyen: 2, Mauvais: 1 };
const stMap = { Léger: 1, Correct: 2, Intense: 3 };
const moMap = { Elevée: 3, Moyenne: 2, Faible: 1 };

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function dateShort(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return d;
  }
}

function metabolismeBase(p: { sexe?: string; poids?: number | string; taille?: number | string; age?: number | string }) {
  const t = toNum(p.poids);
  const r = toNum(p.taille);
  const n = toNum(p.age);
  if (p.sexe === "Femme") return 9.74 * t + 172.9 * r - 4.737 * n + 667.051;
  return 13.707 * t + 492.3 * r - 6.673 * n + 77.607;
}

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 9);

const blankEntry = (): Entry => ({
  id: newId(),
  date: today(),
  energieMatin: "Bonne",
  energieMidi: "Bonne",
  energieSoir: "Bonne",
  fcRepos: "",
  vfc: "",
  sommeil: "Bon",
  coucher: "",
  lever: "",
  humeur: "Bonne",
  stress: "Léger",
  motivation: "Elevée",
  entrainement: "",
  duree: "",
  intensite: "Faible (Z1/Z2)",
  rpePendant: "",
  rpeApres: "",
  depenseSortie: "",
  nap: "1.4",
  kcal: "",
  prot: "",
  lip: "",
  gluc: "",
  qualite: "",
  hydratation: "",
  faim: "Non, j'étais au top",
  commentaire: "",
});

export default function EnergyPage() {
  const [entries, setEntries, loaded] = useAthleteData<Entry[]>("energy", []);
  const [profile] = useAthleteData<{ sexe?: string; poids?: number | string; taille?: number | string; age?: number | string; masseMaigre?: number | string }>("profile", {});
  const [compo] = useAthleteData<{ date: string; masseMaigre?: number | string }[]>("compo", []);
  const [tab, setTab] = useState<"journal" | "synth">("journal");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Entry>(blankEntry());

  const masseMaigre = useMemo(() => {
    const sorted = [...compo].sort((a, b) => (a.date < b.date ? 1 : -1));
    return sorted.length && sorted[0].masseMaigre != null
      ? toNum(sorted[0].masseMaigre)
      : toNum(profile.masseMaigre);
  }, [compo, profile]);

  const mb = metabolismeBase(profile);

  const enriched = useMemo(() => {
    return entries
      .map((e) => {
        const dep = toNum(e.depenseSortie);
        const nap = toNum(e.nap);
        const kcal = toNum(e.kcal);
        const totalDep = mb * nap + dep;
        const dur =
          e.coucher !== "" && e.lever !== ""
            ? 24 - toNum(e.coucher) + toNum(e.lever)
            : null;
        const gSleep = (slMap[e.sommeil] || 0) / 3;
        const gDur = dur != null ? Math.min(dur / 8, 1) : 0.6;
        const gStress = 1 - ((stMap[e.stress] || 1) - 1) / 2;
        const recov = (gSleep * 0.4 + gDur * 0.3 + gStress * 0.3) * 100;
        const eMoy =
          ((fgMap[e.energieMatin] || 0) +
            (fgMap[e.energieMidi] || 0) +
            (fgMap[e.energieSoir] || 0)) /
          3;
        return {
          ...e,
          depenseEnergetique: totalDep,
          bilan: kcal - totalDep,
          score: masseMaigre > 0 ? (kcal - dep) / masseMaigre : 0,
          dureeSommeil: dur,
          recovery: recov,
          energieMoy: eMoy,
        };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [entries, mb, masseMaigre]);

  const last21 = enriched.slice(-21);
  const avgScore = last21.length
    ? last21.reduce((s, e) => s + e.score, 0) / last21.length
    : 0;
  const avgBilan = last21.length
    ? last21.reduce((s, e) => s + e.bilan, 0) / last21.length
    : 0;
  const avgRecov = last21.length
    ? last21.reduce((s, e) => s + e.recovery, 0) / last21.length
    : 0;
  const avgEnergie = last21.length
    ? last21.reduce((s, e) => s + e.energieMoy, 0) / last21.length
    : 0;

  function saveDraft() {
    if (!draft.date) return;
    setEntries((prev) =>
      [...prev.filter((e) => e.date !== draft.date), { ...draft, id: newId() }].sort(
        (a, b) => (a.date < b.date ? 1 : -1),
      ),
    );
    setDraft(blankEntry());
    setOpen(false);
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const update = (k: keyof Entry, v: unknown) =>
    setDraft((d) => ({ ...d, [k]: v as never }));

  const chartData = last21.map((e) => ({
    d: dateShort(e.date),
    score: Math.round(e.score),
    bilan: Math.round(e.bilan),
    recov: Math.round(e.recovery),
    Énergie: +e.energieMoy.toFixed(2),
    Sommeil: slMap[e.sommeil] || null,
    Humeur: fgMap[e.humeur] || null,
    Stress: stMap[e.stress] || null,
    Motivation: moMap[e.motivation] || null,
  }));

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Comprendre où tu en es" title="Carnet de bord de l'énergie" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Carnet de bord de l'énergie"
        action={
          tab === "journal" && (
            <button onClick={() => setOpen((o) => !o)} className="btn-primary">
              {open ? "Fermer" : "+ Journée"}
            </button>
          )
        }
        desc="Score de disponibilité énergétique = (apports − dépense de la sortie) / masse maigre. Sous 30 kcal/kg, l'organisme entre en déficit chronique."
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("journal")}
          className={tab === "journal" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
        >
          Journal quotidien
        </button>
        <button
          onClick={() => setTab("synth")}
          className={tab === "synth" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
        >
          Synthèse & scores
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi
          label="Score dispo énergétique (21j)"
          value={avgScore ? avgScore.toFixed(1) : "—"}
          unit="kcal/kg"
          color="var(--color-success)"
          warn={avgScore < 30 && avgScore > 0}
          note={avgScore ? (avgScore < 30 ? "⚠ sous seuil 30" : "sain ≥ 30") : "—"}
        />
        <Kpi
          label="Score récupération (21j)"
          value={avgRecov ? Math.round(avgRecov) : "—"}
          unit="/100"
          color="var(--color-primary)"
        />
        <Kpi
          label="Synthèse énergie (21j)"
          value={avgEnergie ? avgEnergie.toFixed(2) : "—"}
          unit="/3"
          color="var(--color-dark)"
        />
        <Kpi
          label="Bilan énergétique moyen"
          value={avgBilan ? (avgBilan > 0 ? "+" : "") + Math.round(avgBilan) : "—"}
          unit="kcal"
          color="#8a8a88"
        />
      </div>

      {tab === "journal" && (
        <>
          {open && (
            <div className="card p-4 mb-4" style={{ border: `2px solid var(--color-primary)` }}>
              <div className="font-extrabold mb-3">Nouvelle journée</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => update("date", e.target.value)} /></Field>
                <Field label="Énergie matin">
                  <select className="input" value={draft.energieMatin} onChange={(e) => update("energieMatin", e.target.value)}>
                    <option>Bonne</option><option>Moyenne</option><option>Faible</option>
                  </select>
                </Field>
                <Field label="Énergie midi">
                  <select className="input" value={draft.energieMidi} onChange={(e) => update("energieMidi", e.target.value)}>
                    <option>Bonne</option><option>Moyenne</option><option>Faible</option>
                  </select>
                </Field>
                <Field label="Énergie soir">
                  <select className="input" value={draft.energieSoir} onChange={(e) => update("energieSoir", e.target.value)}>
                    <option>Bonne</option><option>Moyenne</option><option>Faible</option>
                  </select>
                </Field>
                <Field label="FC repos"><input className="input" value={draft.fcRepos} onChange={(e) => update("fcRepos", e.target.value)} /></Field>
                <Field label="VFC"><input className="input" value={draft.vfc} onChange={(e) => update("vfc", e.target.value)} /></Field>
                <Field label="Sommeil">
                  <select className="input" value={draft.sommeil} onChange={(e) => update("sommeil", e.target.value)}>
                    <option>Bon</option><option>Moyen</option><option>Mauvais</option>
                  </select>
                </Field>
                <Field label="Coucher (h)"><input className="input" value={draft.coucher} onChange={(e) => update("coucher", e.target.value)} placeholder="23.5" /></Field>
                <Field label="Lever (h)"><input className="input" value={draft.lever} onChange={(e) => update("lever", e.target.value)} placeholder="7.5" /></Field>
                <Field label="Humeur">
                  <select className="input" value={draft.humeur} onChange={(e) => update("humeur", e.target.value)}>
                    <option>Bonne</option><option>Moyenne</option><option>Faible</option>
                  </select>
                </Field>
                <Field label="Stress">
                  <select className="input" value={draft.stress} onChange={(e) => update("stress", e.target.value)}>
                    <option>Léger</option><option>Correct</option><option>Intense</option>
                  </select>
                </Field>
                <Field label="Motivation">
                  <select className="input" value={draft.motivation} onChange={(e) => update("motivation", e.target.value)}>
                    <option>Elevée</option><option>Moyenne</option><option>Faible</option>
                  </select>
                </Field>
                <Field label="Entraînement"><input className="input" value={draft.entrainement} onChange={(e) => update("entrainement", e.target.value)} /></Field>
                <Field label="Durée (min)"><input className="input" value={draft.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
                <Field label="Intensité">
                  <select className="input" value={draft.intensite} onChange={(e) => update("intensite", e.target.value)}>
                    <option>Faible (Z1/Z2)</option>
                    <option>Modérée (Z3)</option>
                    <option>Elevée (Z3/Z4)</option>
                    <option>Intense (SV2/Z5)</option>
                  </select>
                </Field>
                <Field label="RPE pendant"><input className="input" value={draft.rpePendant} onChange={(e) => update("rpePendant", e.target.value)} /></Field>
                <Field label="RPE après"><input className="input" value={draft.rpeApres} onChange={(e) => update("rpeApres", e.target.value)} /></Field>
                <Field label="Dépense sortie (kcal)"><input className="input" value={draft.depenseSortie} onChange={(e) => update("depenseSortie", e.target.value)} /></Field>
                <Field label="NAP"><input className="input" value={draft.nap} onChange={(e) => update("nap", e.target.value)} /></Field>
                <Field label="Apport (kcal)"><input className="input" value={draft.kcal} onChange={(e) => update("kcal", e.target.value)} /></Field>
                <Field label="Prot (g)"><input className="input" value={draft.prot} onChange={(e) => update("prot", e.target.value)} /></Field>
                <Field label="Lip (g)"><input className="input" value={draft.lip} onChange={(e) => update("lip", e.target.value)} /></Field>
                <Field label="Gluc (g)"><input className="input" value={draft.gluc} onChange={(e) => update("gluc", e.target.value)} /></Field>
                <Field label="Qualité (1-5)"><input className="input" value={draft.qualite} onChange={(e) => update("qualite", e.target.value)} /></Field>
                <Field label="Hydratation (ml)"><input className="input" value={draft.hydratation} onChange={(e) => update("hydratation", e.target.value)} /></Field>
                <Field label="Faim / fringale">
                  <select className="input" value={draft.faim} onChange={(e) => update("faim", e.target.value)}>
                    <option>Non, j&apos;étais au top</option>
                    <option>Oui, durant la matinée</option>
                    <option>Oui, durant l&apos;après-midi</option>
                    <option>Oui, en soirée</option>
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Commentaire libre">
                  <input className="input" value={draft.commentaire} onChange={(e) => update("commentaire", e.target.value)} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setOpen(false)} className="btn-ghost">Annuler</button>
                <button onClick={saveDraft} className="btn-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {enriched.length > 0 ? (
            <div className="card overflow-auto">
              <table className="table" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entraînement</th>
                    <th>Dépense</th>
                    <th>Apport</th>
                    <th>Bilan</th>
                    <th>Score énerg.</th>
                    <th>Récup.</th>
                    <th>Sommeil</th>
                    <th>Hydr.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...enriched].reverse().map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{dateShort(e.date)}</td>
                      <td>{e.entrainement || "—"}</td>
                      <td>{Math.round(e.depenseEnergetique)}</td>
                      <td>{toNum(e.kcal) || "—"}</td>
                      <td style={{ fontWeight: 700, color: e.bilan >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {e.bilan >= 0 ? "+" : ""}{Math.round(e.bilan)}
                      </td>
                      <td style={{ fontWeight: 700, color: e.score < 30 && e.score > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                        {e.score ? e.score.toFixed(0) : "—"}
                      </td>
                      <td>{Math.round(e.recovery)}</td>
                      <td>{e.dureeSommeil != null ? e.dureeSommeil.toFixed(1) + "h" : "—"}</td>
                      <td>{toNum(e.hydratation) || "—"}</td>
                      <td>
                        <button onClick={() => remove(e.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Aucune journée enregistrée. Clique sur &quot;+ Journée&quot; pour commencer.</Empty>
          )}
        </>
      )}

      {tab === "synth" && (
        last21.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">Score de disponibilité énergétique</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <ReferenceLine y={30} stroke="var(--color-danger)" strokeDasharray="4 4" />
                  <ReferenceLine y={45} stroke="var(--color-success)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="score" name="kcal/kg" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">Score de récupération /100</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="recov" name="Récup." stroke="var(--color-primary)" fill="var(--color-accent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">Bilan énergétique (kcal)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <ReferenceLine y={0} stroke="var(--color-dark)" />
                  <Bar dataKey="bilan" name="Bilan" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">Énergie · Sommeil · Humeur · Stress (/3)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="Énergie" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                  <Line dataKey="Sommeil" stroke="var(--color-dark)" strokeWidth={2} dot={false} />
                  <Line dataKey="Humeur" stroke="var(--color-success)" strokeWidth={2} dot={false} />
                  <Line dataKey="Stress" stroke="var(--color-danger)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Empty>Ajoute des journées pour générer les synthèses.</Empty>
        )
      )}
    </div>
  );
}
