"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Badge } from "@/components/ui/PageHeader";

type DomNote = { note: "vert" | "orange" | "rouge" | ""; com: string };
type Race = {
  id: string;
  name: string;
  type: "Trail" | "Triathlon" | "Marathon" | "Cyclisme" | "Course";
  date: string;
  distance: string;
  dplus: string;
  dmoins: string;
  temperature: string;
  meteo: string;
  objectif: string;
  resultat: string;
  fcMoy: string;
  fcMax: string;
  ravitos: string;
  cho: string;
  choH: string;
  liquides: string;
  liquidesH: string;
  sodium: string;
  sodiumL: string;
  cafeine: string;
  cafeineH: string;
  strategie: "Oui" | "Non" | "Partiellement";
  domaines: Record<string, DomNote>;
  forts: string[];
  progres: string[];
  priorites: string[];
  tests: string;
  conclusion: string;
};

const DOMAINS = [
  { k: "energetique", l: "Gestion énergétique" },
  { k: "hydratation", l: "Hydratation / Sodium" },
  { k: "cardio", l: "Racing & cardio" },
  { k: "descente", l: "Technique descente (trail)" },
  { k: "musculaire", l: "Musculaire" },
  { k: "mental", l: "Focus mental" },
];

const NOTE_COLORS: Record<string, string> = {
  vert: "var(--color-success)",
  orange: "var(--color-primary)",
  rouge: "var(--color-danger)",
};

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const dateLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function blankRace(): Race {
  const dom: Record<string, DomNote> = {};
  DOMAINS.forEach((d) => (dom[d.k] = { note: "", com: "" }));
  return {
    id: newId(),
    name: "Nouvelle course",
    type: "Trail",
    date: today(),
    distance: "",
    dplus: "",
    dmoins: "",
    temperature: "",
    meteo: "",
    objectif: "",
    resultat: "",
    fcMoy: "",
    fcMax: "",
    ravitos: "",
    cho: "",
    choH: "",
    liquides: "",
    liquidesH: "",
    sodium: "",
    sodiumL: "",
    cafeine: "",
    cafeineH: "",
    strategie: "Oui",
    domaines: dom,
    forts: ["", "", ""],
    progres: ["", "", ""],
    priorites: ["", "", ""],
    tests: "",
    conclusion: "",
  };
}

function NoteSwitcher({ value, onChange }: { value: string; onChange: (v: "vert" | "orange" | "rouge") => void }) {
  return (
    <div className="flex gap-1">
      {(["vert", "orange", "rouge"] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          title={r}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            border: value === r ? `2px solid var(--color-dark)` : "1px solid var(--color-border)",
            background: value === r ? NOTE_COLORS[r] : "#fff",
            cursor: "pointer",
            fontSize: 12,
            padding: 0,
          }}
        >
          {value !== r ? (r === "vert" ? "🟢" : r === "orange" ? "🟠" : "🔴") : ""}
        </button>
      ))}
    </div>
  );
}

export default function RaceAnalysisPage() {
  const [races, setRaces, loaded] = useAthleteData<Race[]>("races", []);
  const [editing, setEditing] = useState<Race | null>(null);

  const save = () => {
    if (!editing) return;
    setRaces((p) => (p.some((x) => x.id === editing.id) ? p.map((x) => (x.id === editing.id ? editing : x)) : [...p, editing]));
    setEditing(null);
  };

  const del = (id: string) => {
    if (confirm("Supprimer ce bilan ?")) setRaces((p) => p.filter((r) => r.id !== id));
  };

  const updateField = <K extends keyof Race>(k: K, v: Race[K]) => setEditing((c) => (c ? { ...c, [k]: v } : c));
  const updateDom = (k: string, field: keyof DomNote, v: string) =>
    setEditing((c) => (c ? { ...c, domaines: { ...c.domaines, [k]: { ...c.domaines[k], [field]: v as never } } } : c));
  const updateList = (k: "forts" | "progres" | "priorites", idx: number, v: string) =>
    setEditing((c) => (c ? { ...c, [k]: c[k].map((x, i) => (i === idx ? v : x)) } : c));

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Anticiper tes courses" title="Analyse post-course" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <button onClick={() => setEditing(null)} className="btn-ghost btn-sm">← Tous les bilans</button>
          <div className="flex gap-2">
            <button onClick={() => del(editing.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>Supprimer</button>
            <button onClick={save} className="btn-primary btn-sm">Enregistrer</button>
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="kicker mb-2.5">Fiche course</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Field label="Nom"><input className="input" value={editing.name} onChange={(e) => updateField("name", e.target.value)} /></Field>
            <Field label="Type">
              <select className="input" value={editing.type} onChange={(e) => updateField("type", e.target.value as Race["type"])}>
                <option>Trail</option><option>Triathlon</option><option>Marathon</option><option>Cyclisme</option><option>Course</option>
              </select>
            </Field>
            <Field label="Date"><input type="date" className="input" value={editing.date} onChange={(e) => updateField("date", e.target.value)} /></Field>
            <Field label="Distance (km)"><input className="input" value={editing.distance} onChange={(e) => updateField("distance", e.target.value)} /></Field>
            <Field label="D+ (m)"><input className="input" value={editing.dplus} onChange={(e) => updateField("dplus", e.target.value)} /></Field>
            <Field label="D− (m)"><input className="input" value={editing.dmoins} onChange={(e) => updateField("dmoins", e.target.value)} /></Field>
            <Field label="Température (°C)"><input className="input" value={editing.temperature} onChange={(e) => updateField("temperature", e.target.value)} /></Field>
            <Field label="Météo"><input className="input" value={editing.meteo} onChange={(e) => updateField("meteo", e.target.value)} /></Field>
            <Field label="Objectif"><input className="input" value={editing.objectif} onChange={(e) => updateField("objectif", e.target.value)} /></Field>
            <Field label="Résultat (temps / place)"><input className="input" value={editing.resultat} onChange={(e) => updateField("resultat", e.target.value)} /></Field>
            <Field label="FC moyenne"><input className="input" value={editing.fcMoy} onChange={(e) => updateField("fcMoy", e.target.value)} /></Field>
            <Field label="FC max"><input className="input" value={editing.fcMax} onChange={(e) => updateField("fcMax", e.target.value)} /></Field>
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="kicker mb-2.5">Nutrition & hydratation réalisées</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Field label="Glucides total (g)"><input className="input" value={editing.cho} onChange={(e) => updateField("cho", e.target.value)} /></Field>
            <Field label="Glucides / h (g/h)"><input className="input" value={editing.choH} onChange={(e) => updateField("choH", e.target.value)} /></Field>
            <Field label="Liquides total (ml)"><input className="input" value={editing.liquides} onChange={(e) => updateField("liquides", e.target.value)} /></Field>
            <Field label="Liquides / h (ml/h)"><input className="input" value={editing.liquidesH} onChange={(e) => updateField("liquidesH", e.target.value)} /></Field>
            <Field label="Sodium total (mg)"><input className="input" value={editing.sodium} onChange={(e) => updateField("sodium", e.target.value)} /></Field>
            <Field label="Sodium (mg/L)"><input className="input" value={editing.sodiumL} onChange={(e) => updateField("sodiumL", e.target.value)} /></Field>
            <Field label="Caféine total (mg)"><input className="input" value={editing.cafeine} onChange={(e) => updateField("cafeine", e.target.value)} /></Field>
            <Field label="Caféine / h (mg/h)"><input className="input" value={editing.cafeineH} onChange={(e) => updateField("cafeineH", e.target.value)} /></Field>
            <Field label="Stratégie respectée ?">
              <select className="input" value={editing.strategie} onChange={(e) => updateField("strategie", e.target.value as Race["strategie"])}>
                <option>Oui</option><option>Non</option><option>Partiellement</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card p-4 mb-3.5">
          <div className="kicker mb-2.5">Évaluation par domaine</div>
          <div className="flex flex-col gap-2">
            {DOMAINS.map((d) => (
              <div key={d.k} className="grid grid-cols-1 md:grid-cols-[170px_auto_1fr] gap-2.5 items-center">
                <span className="font-bold text-sm">{d.l}</span>
                <NoteSwitcher value={editing.domaines[d.k]?.note || ""} onChange={(v) => updateDom(d.k, "note", v)} />
                <input
                  className="input"
                  placeholder="Commentaire"
                  value={editing.domaines[d.k]?.com || ""}
                  onChange={(e) => updateDom(d.k, "com", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          <div className="card p-4">
            <div className="kicker mb-2.5" style={{ color: "var(--color-success)" }}>3 points forts</div>
            {editing.forts.map((f, i) => (
              <input key={i} className="input mb-1.5" placeholder={`Point fort ${i + 1}`} value={f} onChange={(e) => updateList("forts", i, e.target.value)} />
            ))}
          </div>
          <div className="card p-4">
            <div className="kicker mb-2.5" style={{ color: "var(--color-danger)" }}>3 axes de progrès</div>
            {editing.progres.map((p, i) => (
              <input key={i} className="input mb-1.5" placeholder={`Axe ${i + 1}`} value={p} onChange={(e) => updateList("progres", i, e.target.value)} />
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="kicker mb-2.5">Ordonnance d'action</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {editing.priorites.map((p, i) => (
              <Field key={i} label={`Priorité ${i + 1}`}>
                <input className="input" value={p} onChange={(e) => updateList("priorites", i, e.target.value)} />
              </Field>
            ))}
          </div>
          <Field label="Tests / séances à planifier">
            <textarea className="input" style={{ minHeight: 80, resize: "vertical" }} value={editing.tests} onChange={(e) => updateField("tests", e.target.value)} />
          </Field>
          <Field label="Conclusion générale">
            <textarea className="input mt-2" style={{ minHeight: 80, resize: "vertical" }} value={editing.conclusion} onChange={(e) => updateField("conclusion", e.target.value)} />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Analyse post-course"
        action={<button onClick={() => setEditing(blankRace())} className="btn-primary">+ Nouveau bilan</button>}
        desc="Le sportif fait son débrief avec le GPT « Analyse de ta course », puis reporte ici le bilan pour le garder course après course."
      />

      <div className="mb-3.5">
        <a
          href="https://chatgpt.com/g/g-68f786ada7b08191a9e0be41fd614f02-nutriocus-analyse-de-ta-course"
          target="_blank"
          rel="noreferrer"
          className="btn-dark btn-sm inline-flex"
        >
          Ouvrir le GPT — Analyse de ta course ↗
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {races.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex justify-between items-start gap-2.5 flex-wrap">
              <div className="flex-1 cursor-pointer" onClick={() => setEditing(r)}>
                <div className="font-display font-extrabold text-xl">{r.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {r.type} · {dateLong(r.date)}
                  {r.distance ? ` · ${r.distance} km` : ""}
                  {r.dplus ? ` · ${r.dplus} m D+` : ""}
                  {r.resultat ? ` · ${r.resultat}` : ""}
                </div>
                <div className="flex gap-3.5 flex-wrap mt-2 text-sm">
                  {r.choH && (
                    <span>CHO <b className="text-[var(--color-primary)]">{r.choH} g/h</b></span>
                  )}
                  {r.liquidesH && (
                    <span>Hydr. <b>{r.liquidesH} ml/h</b></span>
                  )}
                  {r.sodiumL && (
                    <span>Na <b className="text-[var(--color-success)]">{r.sodiumL} mg/L</b></span>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  {DOMAINS.map((d) => {
                    const n = r.domaines[d.k]?.note;
                    return (
                      <span
                        key={d.k}
                        title={d.l}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: n ? NOTE_COLORS[n] : "var(--color-border)",
                          display: "inline-block",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(r)} className="btn-dark btn-sm">Ouvrir</button>
                <button onClick={() => del(r.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {races.length === 0 && <Empty>Aucun bilan. Fais ton analyse avec le GPT, puis crée un bilan.</Empty>}
      </div>
    </div>
  );
}
