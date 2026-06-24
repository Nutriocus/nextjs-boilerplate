"use client";

import { useState, useMemo, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
  ReferenceArea,
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

// External tool — "Diététicien Nutriocus de poche" GPT
const DIETETICIEN_GPT_URL =
  "https://chatgpt.com/g/g-693fd73e063081919c01bef7714c6099-ton-dieteticien-nutriocus-de-poche";

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

function dateLong(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
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

// ============ TOOLTIPS CONTENT ============
const TOOLTIPS = {
  vfc: (
    <>
      <b>VFC (Variabilité de la Fréquence Cardiaque)</b>
      <br />
      Indicateur de l&apos;équilibre du système nerveux autonome. Mesurée le matin au réveil
      via un capteur (Whoop, Garmin, Apple Watch, HRV4Training…).
      <br />
      Une VFC en baisse = stress élevé / récupération insuffisante.
      <br />
      Exprimée en millisecondes (ex. 45 ms).
    </>
  ),
  rpePendant: (
    <>
      <b>RPE pendant (Rate of Perceived Exertion)</b>
      <br />
      Note ton intensité ressentie pendant la séance, sur une échelle de 1 à 10 :
      <br />
      1 = très facile, 5 = modéré, 7 = soutenu, 9 = très dur, 10 = max.
    </>
  ),
  rpeApres: (
    <>
      <b>RPE après séance</b>
      <br />
      Note ton ressenti global au sortir de la séance, sur 1 à 10 :
      <br />
      1 = je pourrais en refaire 2h, 5 = OK fatigué, 8 = vidé, 10 = cramé.
    </>
  ),
  depense: (
    <>
      <b>Dépense kcal de la sortie</b>
      <br />
      Calories dépensées sur ta séance (hors métabolisme de base). Donnée fournie par ta
      montre (Garmin, Suunto, Coros, Apple Watch, Strava…).
      <br />
      Ne prends que la valeur de la séance, sans le reste de la journée.
    </>
  ),
  nap: (
    <>
      <b>NAP (Niveau d&apos;Activité Physique du quotidien)</b>
      <br />
      Hors séance de sport, choisis ta note du jour :
      <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
        <li>
          <b>1,2</b> = Assis ou allongé toute la journée
        </li>
        <li>
          <b>1,4</b> = Journée sédentaire, sans autres activités. Bureau / écran.
        </li>
        <li>
          <b>1,6</b> = Activité régulière, petits déplacements, travail debout, loisirs
          plein air.
        </li>
        <li>
          <b>1,8</b> = Activités plein air, métier physiquement exigeant.
        </li>
        <li>
          <b>2,0</b> = Métier extrêmement exigeant (bûcheron, déménageur…).
        </li>
      </ul>
    </>
  ),
  qualite: (
    <>
      <b>Qualité ressentie de l&apos;alimentation (1 à 5)</b>
      <br />
      Note la qualité globale de ce que tu as mangé aujourd&apos;hui :
      <br />
      1 = très mauvaise (junk food, écarts), 3 = correcte, 5 = parfaite (équilibrée, variée,
      pas d&apos;écart).
    </>
  ),
};

// =====================================================================
// PAGE
// =====================================================================
// ─── Helpers de coloration pour le score de Disponibilité Énergétique (DE) ───
// Seuils standards endurance : <30 = déficit chronique (RED-S), 30-45 = à surveiller, ≥45 = optimal
function deColor(score: number): string {
  if (!score || score <= 0) return "var(--color-text-muted)";
  if (score < 30) return "var(--color-danger)";
  if (score < 45) return "#b36b00";
  return "var(--color-success)";
}
function deLabel(score: number): string {
  if (!score || score <= 0) return "—";
  if (score < 30) return "⚠ déficit chronique";
  if (score < 45) return "à surveiller";
  return "✓ optimal";
}

export default function EnergyPage() {
  const [entries, setEntries, loaded] = useAthleteData<Entry[]>("energy", []);
  const [profile] = useAthleteData<{ sexe?: string; poids?: number | string; taille?: number | string; age?: number | string; masseMaigre?: number | string }>("profile", {});
  const [compo] = useAthleteData<{ date: string; masseMaigre?: number | string }[]>("compo", []);
  const [tab, setTab] = useState<"journal" | "synth">("journal");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Entry>(blankEntry());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [chartLines, setChartLines] = useState({ Énergie: true, Sommeil: true, Humeur: true, Stress: true });

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
    setEntries((prev) => {
      // If editing, replace the existing entry (by id), keep id
      if (editingId) {
        return prev.map((e) => (e.id === editingId ? { ...draft, id: editingId } : e))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      // Otherwise: new entry, replace any entry with same date
      return [...prev.filter((e) => e.date !== draft.date), { ...draft, id: newId() }]
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    setDraft(blankEntry());
    setOpen(false);
    setEditingId(null);
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette journée ?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (viewingId === id) setViewingId(null);
  }

  function startEdit(entry: Entry) {
    setDraft({ ...entry });
    setEditingId(entry.id);
    setOpen(true);
    setViewingId(null);
  }

  function startNew() {
    setDraft(blankEntry());
    setEditingId(null);
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setDraft(blankEntry());
  }

  const update = (k: keyof Entry, v: unknown) =>
    setDraft((d) => ({ ...d, [k]: v as never }));

  const viewing = entries.find((e) => e.id === viewingId);

  // ESC to close detail modal
  useEffect(() => {
    if (!viewingId) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingId(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [viewingId]);

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

  // Helper: recovery score badge
  const recoveryLabel = (v: number) => {
    if (v >= 80) return { label: "Bonne récupération", color: "var(--color-success)" };
    if (v >= 60) return { label: "Récupération moyenne", color: "var(--color-primary)" };
    return { label: "Mauvaise récupération", color: "var(--color-danger)" };
  };

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
            <div className="flex gap-2 flex-wrap">
              <a
                href={DIETETICIEN_GPT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark btn-sm"
                title="Ouvre ton diététicien NUTRIOCUS de poche pour estimer rapidement tes apports kcal / protéines / lipides / glucides"
              >
                🤖 Ton diététicien NUTRIOCUS de poche
              </a>
              <button onClick={open ? closeForm : startNew} className="btn-primary">
                {open ? "Fermer" : "+ Journée"}
              </button>
            </div>
          )
        }
        desc="Score de disponibilité énergétique = (apports − dépense de la sortie) / masse maigre. Sous 30 kcal/kg, l'organisme entre en déficit chronique."
      />

      <HelpSection title="ℹ️ Carnet de bord de l'énergie — pourquoi, cible, comment ?">
        <HelpBlock icon="🎯" title="Pourquoi">
          <p>
            Le <b>déficit énergétique chronique</b> (RED-S) est la 1ère cause de
            blessures, fatigue, troubles hormonaux et baisse de performance chez
            les sportifs d&apos;endurance. Mesurer ta <b>disponibilité énergétique</b>
            (DE) jour après jour permet de la détecter et la corriger avant la casse.
          </p>
        </HelpBlock>
        <HelpBlock icon="🎚️" title="Ce que l'on vise">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>≥ 45 kcal/kg de masse maigre/jour</b> : zone optimale (santé + performance)</li>
            <li><b>30-45 kcal/kg/j</b> : zone à surveiller</li>
            <li><b>&lt; 30 kcal/kg/j</b> : zone de déficit chronique (RED-S) → risque blessure / hormonal</li>
            <li>Côté macros : viser <b>1,6-2,2 g/kg protéines</b>, <b>5-8 g/kg glucides</b> (selon volume d&apos;entraînement)</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="📝" title="Comment remplir une journée">
          <ul className="list-disc pl-5 space-y-1">
            <li>Clique <b>+ Journée</b> → choisis la date</li>
            <li>Renseigne la <b>dépense de la sortie</b> (kcal estimées depuis ta montre ou la page « Dépenses en course »)</li>
            <li>Saisis tes <b>apports</b> : kcal, protéines (g), lipides (g), glucides (g)</li>
            <li>Si tu ne sais pas estimer un repas → bouton <b>🤖 Ton diététicien Nutriocus de poche</b> : décris ton repas, il te donne les macros</li>
            <li>Note l&apos;<b>énergie ressentie</b> (1-10), <b>sommeil</b>, <b>humeur</b>, <b>libido</b> — marqueurs précoces de fatigue centrale</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="📊" title="Comment analyser">
          <ul className="list-disc pl-5 space-y-1">
            <li>Onglet <b>Synthèse & scores</b> : moyennes 7j / 14j / 28j, courbes d&apos;évolution</li>
            <li>Une <b>DE moyenne sous 30 sur 7-14 jours</b> = alerte → augmente les apports ou réduis la charge</li>
            <li>Croise <b>énergie ressentie ↓ + DE basse</b> = signal fort de surrégime</li>
            <li>Partage avec ton coach pour ajuster <b>charge / récupération / nutrition</b></li>
          </ul>
        </HelpBlock>
      </HelpSection>

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
          color={deColor(avgScore)}
          warn={avgScore < 30 && avgScore > 0}
          note={deLabel(avgScore)}
        />
        <Kpi
          label="Score récupération (21j)"
          value={avgRecov ? Math.round(avgRecov) : "—"}
          unit="/100"
          color={avgRecov ? recoveryLabel(avgRecov).color : "var(--color-primary)"}
          note={avgRecov ? recoveryLabel(avgRecov).label : ""}
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
              <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
                <div className="font-extrabold">
                  {editingId ? "✎ Modifier la journée" : "+ Nouvelle journée"}
                </div>
                <a
                  href={DIETETICIEN_GPT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-xs"
                  style={{ color: "var(--color-primary)" }}
                >
                  🤖 Estimer mes apports kcal / macros →
                </a>
              </div>
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
                <Field label={<InfoTooltip label="VFC" content={TOOLTIPS.vfc} />}>
                  <input className="input" value={draft.vfc} onChange={(e) => update("vfc", e.target.value)} />
                </Field>
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
                <Field label={<InfoTooltip label="RPE pendant" content={TOOLTIPS.rpePendant} />}>
                  <input className="input" value={draft.rpePendant} onChange={(e) => update("rpePendant", e.target.value)} />
                </Field>
                <Field label={<InfoTooltip label="RPE après" content={TOOLTIPS.rpeApres} />}>
                  <input className="input" value={draft.rpeApres} onChange={(e) => update("rpeApres", e.target.value)} />
                </Field>
                <Field label={<InfoTooltip label="Dépense sortie (kcal)" content={TOOLTIPS.depense} />}>
                  <input className="input" value={draft.depenseSortie} onChange={(e) => update("depenseSortie", e.target.value)} />
                </Field>
                <Field label={<InfoTooltip label="NAP" content={TOOLTIPS.nap} />}>
                  <input className="input" value={draft.nap} onChange={(e) => update("nap", e.target.value)} />
                </Field>
                <Field label="Apport (kcal)"><input className="input" value={draft.kcal} onChange={(e) => update("kcal", e.target.value)} /></Field>
                <Field label="Prot (g)"><input className="input" value={draft.prot} onChange={(e) => update("prot", e.target.value)} /></Field>
                <Field label="Lip (g)"><input className="input" value={draft.lip} onChange={(e) => update("lip", e.target.value)} /></Field>
                <Field label="Gluc (g)"><input className="input" value={draft.gluc} onChange={(e) => update("gluc", e.target.value)} /></Field>
                <Field label={<InfoTooltip label="Qualité (1-5)" content={TOOLTIPS.qualite} />}>
                  <input className="input" value={draft.qualite} onChange={(e) => update("qualite", e.target.value)} />
                </Field>
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
                <button onClick={closeForm} className="btn-ghost">Annuler</button>
                <button onClick={saveDraft} className="btn-primary">
                  {editingId ? "Enregistrer les modifications" : "Enregistrer"}
                </button>
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
                    <tr
                      key={e.id}
                      onClick={() => setViewingId(e.id)}
                      style={{ cursor: "pointer" }}
                      className="hover:bg-[var(--color-surface-2)] transition"
                      title="Cliquer pour voir le détail"
                    >
                      <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{dateShort(e.date)}</td>
                      <td>{e.entrainement || "—"}</td>
                      <td>{Math.round(e.depenseEnergetique)}</td>
                      <td>{toNum(e.kcal) || "—"}</td>
                      <td style={{ fontWeight: 700, color: e.bilan >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {e.bilan >= 0 ? "+" : ""}{Math.round(e.bilan)}
                      </td>
                      <td style={{ fontWeight: 700, color: deColor(e.score) }}>
                        {e.score ? e.score.toFixed(0) : "—"}
                      </td>
                      <td>{Math.round(e.recovery)}</td>
                      <td>{e.dureeSommeil != null ? e.dureeSommeil.toFixed(1) + "h" : "—"}</td>
                      <td>{toNum(e.hydratation) || "—"}</td>
                      <td>
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            remove(e.id);
                          }}
                          style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}
                          title="Supprimer"
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
              <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
                <div className="font-extrabold text-sm">Score de récupération /100</div>
                <div className="flex gap-1.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(207,46,46,0.15)", color: "var(--color-danger)" }}>&lt; 60 mauvaise</span>
                  <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(255,69,1,0.15)", color: "var(--color-primary)" }}>60-80 moyenne</span>
                  <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(95,140,10,0.18)", color: "var(--color-success)" }}>&gt; 80 bonne</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  {/* Color bands */}
                  <ReferenceArea y1={0} y2={60} fill="var(--color-danger)" fillOpacity={0.06} />
                  <ReferenceArea y1={60} y2={80} fill="var(--color-primary)" fillOpacity={0.05} />
                  <ReferenceArea y1={80} y2={100} fill="var(--color-success)" fillOpacity={0.06} />
                  <ReferenceLine y={60} stroke="var(--color-danger)" strokeDasharray="4 4" />
                  <ReferenceLine y={80} stroke="var(--color-success)" strokeDasharray="4 4" />
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
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {(["Énergie", "Sommeil", "Humeur", "Stress"] as const).map((k) => {
                  const colors: Record<string, string> = {
                    Énergie: "var(--color-primary)",
                    Sommeil: "var(--color-dark)",
                    Humeur: "var(--color-success)",
                    Stress: "var(--color-danger)",
                  };
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setChartLines((c) => ({ ...c, [k]: !c[k] }))}
                      className="text-xs px-2 py-1 rounded transition"
                      style={{
                        background: chartLines[k] ? colors[k] : "transparent",
                        color: chartLines[k] ? "#fff" : "var(--color-text-muted)",
                        border: `1px solid ${chartLines[k] ? colors[k] : "var(--color-border)"}`,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {chartLines[k] ? "✓ " : ""}{k}
                    </button>
                  );
                })}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={[0, 3]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Legend />
                  {chartLines.Énergie && <Line dataKey="Énergie" stroke="var(--color-primary)" strokeWidth={2} dot={false} />}
                  {chartLines.Sommeil && <Line dataKey="Sommeil" stroke="var(--color-dark)" strokeWidth={2} dot={false} />}
                  {chartLines.Humeur && <Line dataKey="Humeur" stroke="var(--color-success)" strokeWidth={2} dot={false} />}
                  {chartLines.Stress && <Line dataKey="Stress" stroke="var(--color-danger)" strokeWidth={2} dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <Empty>Ajoute des journées pour générer les synthèses.</Empty>
        )
      )}

      {/* ============ DETAIL MODAL ============ */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setViewingId(null)}
        >
          <div
            className="card w-full max-w-3xl overflow-hidden"
            style={{ background: "var(--color-surface)", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 flex justify-between items-center flex-wrap gap-2" style={{ background: "var(--color-dark)", color: "#fff" }}>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-70" style={{ letterSpacing: ".1em" }}>
                  Détail de la journée
                </div>
                <div className="font-extrabold uppercase text-sm" style={{ fontFamily: "var(--font-display)" }}>
                  {dateLong(viewing.date)}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(viewing)} className="btn-primary btn-sm">
                  ✎ Modifier
                </button>
                <button
                  onClick={() => remove(viewing.id)}
                  className="btn-ghost btn-sm"
                  style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  Supprimer
                </button>
                <button onClick={() => setViewingId(null)} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <DetailField label="Énergie matin">{viewing.energieMatin}</DetailField>
              <DetailField label="Énergie midi">{viewing.energieMidi}</DetailField>
              <DetailField label="Énergie soir">{viewing.energieSoir}</DetailField>
              <DetailField label="FC repos (bpm)">{viewing.fcRepos || "—"}</DetailField>
              <DetailField label="VFC (ms)">{viewing.vfc || "—"}</DetailField>
              <DetailField label="Sommeil">{viewing.sommeil}</DetailField>
              <DetailField label="Coucher / Lever">
                {viewing.coucher || "—"}h → {viewing.lever || "—"}h
              </DetailField>
              <DetailField label="Humeur">{viewing.humeur}</DetailField>
              <DetailField label="Stress">{viewing.stress}</DetailField>
              <DetailField label="Motivation">{viewing.motivation}</DetailField>
              <DetailField label="Entraînement">{viewing.entrainement || "—"}</DetailField>
              <DetailField label="Durée (min)">{viewing.duree || "—"}</DetailField>
              <DetailField label="Intensité">{viewing.intensite}</DetailField>
              <DetailField label="RPE pendant">{viewing.rpePendant || "—"}</DetailField>
              <DetailField label="RPE après">{viewing.rpeApres || "—"}</DetailField>
              <DetailField label="Dépense sortie (kcal)">{viewing.depenseSortie || "—"}</DetailField>
              <DetailField label="NAP">{viewing.nap || "—"}</DetailField>
              <DetailField label="Apport (kcal)">{viewing.kcal || "—"}</DetailField>
              <DetailField label="Prot. / Lip. / Gluc. (g)">
                {viewing.prot || "—"} / {viewing.lip || "—"} / {viewing.gluc || "—"}
              </DetailField>
              <DetailField label="Qualité repas (/5)">{viewing.qualite || "—"}</DetailField>
              <DetailField label="Hydratation (ml)">{viewing.hydratation || "—"}</DetailField>
              <DetailField label="Faim / fringale" wide>{viewing.faim || "—"}</DetailField>
            </div>

            {viewing.commentaire && (
              <div className="px-5 pb-4">
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1" style={{ letterSpacing: ".06em" }}>
                  Commentaire
                </div>
                <div className="rounded-lg p-3 text-sm italic" style={{ background: "var(--color-surface-2)" }}>
                  {viewing.commentaire}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 md:col-span-3" : ""}>
      <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
        {label}
      </div>
      <div className="font-bold mt-0.5">{children}</div>
    </div>
  );
}
