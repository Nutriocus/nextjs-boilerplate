"use client";

import { useState } from "react";
import { PageHeader, Kpi, Field } from "@/components/ui/PageHeader";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function GptLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="btn-dark btn-sm inline-flex">
      {children} ↗
    </a>
  );
}

// ============================================================
// DIAGNOSTIC 360°
// ============================================================
function Diagnostic() {
  const SPORT_WEIGHTS: Record<string, { e: number; m: number; n: number; d: number }> = {
    Trail: { e: 35, m: 30, n: 20, d: 15 },
    Course: { e: 40, m: 25, n: 20, d: 15 },
    Triathlon: { e: 45, m: 20, n: 20, d: 15 },
    Cyclisme: { e: 50, m: 15, n: 15, d: 20 },
  };
  const [sport, setSport] = useState("Trail");
  const [scores, setScores] = useState({ e: 70, m: 65, n: 72, d: 75 });
  const w = SPORT_WEIGHTS[sport];

  const global =
    (toNum(scores.e) * w.e + toNum(scores.m) * w.m + toNum(scores.n) * w.n + toNum(scores.d) * w.d) / 100;

  const data = [
    { axe: "Énergétique", v: toNum(scores.e) },
    { axe: "Mécanique", v: toNum(scores.m) },
    { axe: "Neuromusculaire", v: toNum(scores.n) },
    { axe: "Durabilité", v: toNum(scores.d) },
  ];

  const sys = [
    { k: "e", l: "Énergétique", v: toNum(scores.e), w: w.e, ind: "Glycogène restant", seuil: "< 300 g", mur: "Mur glycogénique" },
    { k: "m", l: "Mécanique", v: toNum(scores.m), w: w.m, ind: "ICM", seuil: "> 0,9", mur: "Surcharge musculaire" },
    { k: "n", l: "Neuromusculaire", v: toNum(scores.n), w: w.n, ind: "INML", seuil: "< 0,8", mur: "Crampes / désynchronisation" },
    { k: "d", l: "Durabilité", v: toNum(scores.d), w: w.d, ind: "HR drift", seuil: "> 8 %", mur: "Fatigue progressive" },
  ];
  const sorted = [...sys].sort((a, b) => a.v - b.v);
  const faible = sorted[0];
  const fort = sorted[sorted.length - 1];

  const colorFor = (v: number) =>
    v >= 90 ? "var(--color-success)" : v >= 80 ? "var(--color-primary)" : "var(--color-danger)";

  return (
    <div>
      <div className="mb-3.5 flex gap-2.5 flex-wrap items-center">
        <GptLink url="https://chatgpt.com/g/g-68fd31200980819184b22509cce50fe7-nutriocus-diagnostic-pre-course-360deg">
          GPT — Diagnostic pré-course 360°
        </GptLink>
      </div>
      <p className="text-[var(--color-text-muted)] text-sm max-w-2xl mb-3.5">
        Profil global sur les 4 systèmes. Renseigne les scores (0–100) issus de chaque protocole / GPT. Le score Nutriocus est pondéré selon le sport, et le radar fait ressortir le facteur limitant prioritaire et le mur probable.
      </p>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {Object.keys(SPORT_WEIGHTS).map((s) => (
          <button key={s} onClick={() => setSport(s)} className={sport === s ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-2.5">Scores des 4 systèmes (0–100)</div>
          <div className="flex flex-col gap-3.5">
            {sys.map((s) => (
              <div key={s.k}>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>{s.l} <span className="text-[var(--color-text-muted)] font-medium">· {s.w}%</span></span>
                  <span style={{ color: colorFor(s.v) }}>{s.v}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={s.v}
                  onChange={(e) => setScores((p) => ({ ...p, [s.k]: Math.max(0, Math.min(100, toNum(e.target.value))) }))}
                  style={{ width: "100%", accentColor: "var(--color-primary)" }}
                />
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {s.ind}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg p-4 text-center" style={{ background: "var(--color-dark)" }}>
            <div className="text-[10px] text-[#8a8a88] tracking-widest uppercase">Score Nutriocus — {sport}</div>
            <div className="font-display font-extrabold text-4xl mt-1" style={{ color: colorFor(global) }}>
              {Math.round(global)}
              <span className="text-base text-[#8a8a88] ml-1">/100</span>
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: colorFor(global) }}>
              {global >= 90 ? "Profil très solide" : global >= 80 ? "Profil correct" : "Facteur limitant important"}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-4 mb-3.5">
            <div className="font-extrabold mb-2 text-sm">Profil Nutriocus — équilibre des 4 systèmes</div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="axe" tick={{ fontSize: 12, fill: "var(--color-text)", fontWeight: 700 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                <Radar dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.32} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5">
            <Kpi label="Point fort" value={fort.l} color="var(--color-success)" note={`${fort.v}/100`} />
            <Kpi
              label="Facteur limitant prioritaire"
              value={faible.l}
              color={colorFor(faible.v)}
              note={`${faible.v}/100`}
              warn={faible.v < 80}
            />
          </div>

          <div className="card p-4" style={{ borderLeft: `5px solid ${colorFor(faible.v)}` }}>
            <div className="font-extrabold mb-1">
              Mur le plus probable : <span style={{ color: colorFor(faible.v) }}>{faible.mur}</span>
            </div>
            <div className="text-sm text-[#444] leading-relaxed">
              Le système <b>{faible.l.toLowerCase()}</b> est le maillon faible. Travail prioritaire à mettre en place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MÉCANIQUE
// ============================================================
function Mecanique() {
  const [v, setV] = useState({ sj: "", cmj: "", step: "", charge: "" });
  const sj = toNum(v.sj);
  const cmj = toNum(v.cmj);
  const step = toNum(v.step);
  const charge = toNum(v.charge);

  const cmi = (sj + cmj) / 2 + step / 3;
  const cap = 1.8 * cmi;
  const icm = cap > 0 ? charge / cap : 0;
  const gain = cmj - sj;

  const cmiLabel = cmi < 25 ? { l: "Faible", c: "var(--color-danger)" } : cmi <= 35 ? { l: "Moyen", c: "var(--color-primary)" } : { l: "Élevé", c: "var(--color-success)" };
  const icmLabel = icm < 0.7 ? { l: "Risque faible", c: "var(--color-success)" } : icm <= 0.9 ? { l: "Vigilance", c: "var(--color-primary)" } : { l: "Risque élevé de mur", c: "var(--color-danger)" };

  return (
    <div>
      <div className="mb-3.5">
        <GptLink url="https://chatgpt.com/g/g-68fcf2ddd4d88191afd7dd65dadce091-predicteur-nutriocus-preparation-de-course">
          GPT — Prédicteur (mécanique & énergétique)
        </GptLink>
      </div>
      <p className="text-[var(--color-text-muted)] text-sm max-w-2xl mb-3.5">
        Évalue la tolérance musculaire avant la rupture. CMI = (SJ+CMJ)/2 + StepDown/3 · CAP = 1,8 × CMI · ICM = charge mécanique prévue / CAP.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-2.5">Tests</div>
          <div className="flex flex-col gap-2.5">
            <Field label="Squat Jump — SJ (cm)"><input className="input" value={v.sj} onChange={(e) => setV({ ...v, sj: e.target.value })} /></Field>
            <Field label="Counter Movement Jump — CMJ (cm)"><input className="input" value={v.cmj} onChange={(e) => setV({ ...v, cmj: e.target.value })} /></Field>
            <Field label="Step Down excentrique (reps)"><input className="input" value={v.step} onChange={(e) => setV({ ...v, step: e.target.value })} /></Field>
            <Field label="Charge mécanique prévue en course"><input className="input" value={v.charge} onChange={(e) => setV({ ...v, charge: e.target.value })} /></Field>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
            <Kpi label="CMI — capacité initiale" value={cmi ? cmi.toFixed(1) : "—"} color={cmiLabel.c} note={cmi ? cmiLabel.l : ""} />
            <Kpi label="CAP — capacité utilisable" value={cap ? cap.toFixed(1) : "—"} color="var(--color-dark)" />
            <Kpi label="ICM — indice de contrainte" value={icm ? icm.toFixed(2) : "—"} color={icmLabel.c} note={icm ? icmLabel.l : ""} warn={icm > 0.9} />
            <Kpi label="Gain CMJ − SJ" value={gain ? gain.toFixed(1) : "—"} unit="cm" color="#8a8a88" note={gain ? (gain < 2 ? "raideur" : gain > 8 ? "très réactif" : "bon équilibre") : ""} />
          </div>

          <div className="card p-4">
            <div className="font-extrabold mb-2 text-sm">Lecture</div>
            <div className="text-sm leading-relaxed text-[#333]">
              <div>CMI : &lt;25 faible (mur précoce) · 25–35 moyen · &gt;35 élevé (apte trail/ultra).</div>
              <div className="mt-1">ICM : &lt; 0,70 faible · 0,70–0,90 modéré · &gt; 0,90 élevé.</div>
              <div className="mt-2 text-[var(--color-text-muted)]">
                ICM élevé → prioriser excentrique, descentes, récupération musculaire.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEUROMUSCULAIRE
// ============================================================
function Neuro() {
  const [v, setV] = useState({ h1: "", h2a: "", h2b: "", h2c: "", depl: "", duree: "" });
  const [muscles, setMuscles] = useState<Record<string, { G: string; D: string }>>({
    mollets: { G: "", D: "" },
    adducteurs: { G: "", D: "" },
    quadriceps: { G: "", D: "" },
    ischios: { G: "", D: "" },
  });

  const MUSCLES = [
    { k: "mollets", l: "Mollets", charge: 0.35 },
    { k: "adducteurs", l: "Adducteurs", charge: 0.25 },
    { k: "quadriceps", l: "Quadriceps", charge: 0.4 },
    { k: "ischios", l: "Ischios", charge: 0.3 },
  ];

  const h1 = toNum(v.h1);
  const h2 = (toNum(v.h2a) + toNum(v.h2b) + toNum(v.h2c)) / 3;
  const rfd = h1 > 0 ? (h2 / h1) * 100 : 0;
  const stab = 100 - 10 * toNum(v.depl);
  const duree = toNum(v.duree);

  const rows = MUSCLES.map((m) => {
    const G = toNum(muscles[m.k].G);
    const D = toNum(muscles[m.k].D);
    const max = Math.max(G, D);
    const min = Math.min(G, D);
    const asym = max > 0 ? ((max - min) / max) * 100 : 0;
    const inml = (min / 60 + rfd / 100 + (100 - asym) / 100) / 3;
    const tcrampe = duree > 0 ? duree * inml * (1 / m.charge) : 0;
    const risk = inml > 0.9 ? { l: "Faible", c: "var(--color-success)" } : inml >= 0.8 ? { l: "Modéré", c: "var(--color-primary)" } : { l: "Élevé", c: "var(--color-danger)" };
    return { ...m, G, D, asym, inml, tcrampe, risk };
  });

  return (
    <div>
      <div className="mb-3.5">
        <GptLink url="https://chatgpt.com/g/g-68fd0cb2da408191a4f10d43d6327dc1-analyse-du-risque-neuromusculaire-nutriocus">
          GPT — Risque neuromusculaire
        </GptLink>
      </div>
      <p className="text-[var(--color-text-muted)] text-sm max-w-2xl mb-3.5">
        INML = (Endu/60 + RFD%/100 + (100−Asym%)/100) / 3 par groupe. RFD% = H2/H1 × 100 · Asym% = (max−min)/max × 100.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-2.5">Données globales</div>
          <div className="flex flex-col gap-2.5">
            <Field label="CMJ initial H₁ (cm)"><input className="input" value={v.h1} onChange={(e) => setV({ ...v, h1: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-1.5">
              <Field label="H₂ #1"><input className="input" value={v.h2a} onChange={(e) => setV({ ...v, h2a: e.target.value })} /></Field>
              <Field label="H₂ #2"><input className="input" value={v.h2b} onChange={(e) => setV({ ...v, h2b: e.target.value })} /></Field>
              <Field label="H₂ #3"><input className="input" value={v.h2c} onChange={(e) => setV({ ...v, h2c: e.target.value })} /></Field>
            </div>
            <Field label="Équilibre — déplacements (60s)"><input className="input" value={v.depl} onChange={(e) => setV({ ...v, depl: e.target.value })} /></Field>
            <Field label="Durée de la course (min)"><input className="input" value={v.duree} onChange={(e) => setV({ ...v, duree: e.target.value })} /></Field>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-[var(--color-surface-2)] rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-[var(--color-text-muted)]">RFD%</div>
              <div className="font-extrabold text-xl" style={{ color: rfd >= 90 ? "var(--color-success)" : rfd >= 80 ? "var(--color-primary)" : "var(--color-danger)" }}>
                {rfd ? Math.round(rfd) : "—"}
              </div>
            </div>
            <div className="flex-1 bg-[var(--color-surface-2)] rounded-lg px-2.5 py-2">
              <div className="text-[10px] text-[var(--color-text-muted)]">Stabilité%</div>
              <div className="font-extrabold text-xl">{v.depl !== "" ? Math.round(stab) : "—"}</div>
            </div>
          </div>

          <div className="font-extrabold mt-3.5 mb-2">Endurance isométrique (s) — G / D</div>
          {MUSCLES.map((m) => (
            <div key={m.k} className="grid grid-cols-2 gap-1.5 mb-1.5">
              <Field label={`${m.l} — G`}><input className="input" value={muscles[m.k].G} onChange={(e) => setMuscles({ ...muscles, [m.k]: { ...muscles[m.k], G: e.target.value } })} /></Field>
              <Field label={`${m.l} — D`}><input className="input" value={muscles[m.k].D} onChange={(e) => setMuscles({ ...muscles, [m.k]: { ...muscles[m.k], D: e.target.value } })} /></Field>
            </div>
          ))}
        </div>

        <div className="card p-0 overflow-auto">
          <table className="table">
            <thead>
              <tr><th>Muscle</th><th>Asym%</th><th>INML</th><th>Risque</th><th>Crampe probable</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <td style={{ fontWeight: 700 }}>{r.l}</td>
                  <td>{r.asym ? r.asym.toFixed(0) + "%" : "—"}</td>
                  <td style={{ fontWeight: 800 }}>{r.inml ? r.inml.toFixed(2) : "—"}</td>
                  <td><span className="badge" style={{ background: r.risk.c }}>{r.risk.l}</span></td>
                  <td>{r.tcrampe && duree > 0 ? Math.round(r.tcrampe) + " min (" + Math.round((r.tcrampe / duree) * 100) + "% course)" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DURABILITÉ
// ============================================================
function Durabilite() {
  const [v, setV] = useState({ fcDeb: "", fcFin: "", allureDeb: "", allureFin: "", rpeDeb: "", rpeFin: "", duree: "" });

  const drift = toNum(v.fcDeb) > 0 ? ((toNum(v.fcFin) - toNum(v.fcDeb)) / toNum(v.fcDeb)) * 100 : 0;
  const allurePerte = toNum(v.allureDeb) > 0 ? ((toNum(v.allureFin) - toNum(v.allureDeb)) / toNum(v.allureDeb)) * 100 : 0;
  const rpeDelta = toNum(v.rpeFin) - toNum(v.rpeDeb);
  const score = (Math.abs(drift) + Math.abs(allurePerte) + rpeDelta) / 3;
  const scoreLabel = score < 5 ? { l: "Excellente durabilité", c: "var(--color-success)" } : score <= 7 ? { l: "Durabilité solide", c: "var(--color-success)" } : score <= 9 ? { l: "Durabilité moyenne", c: "var(--color-primary)" } : { l: "Facteur limitant", c: "var(--color-danger)" };

  return (
    <div>
      <div className="mb-3.5">
        <GptLink url="https://chatgpt.com/g/g-69b3eef645d4819191bf8cb8eb6b0890-analyse-de-la-durabilite-nutriocus">
          GPT — Durabilité à l'effort
        </GptLink>
      </div>
      <p className="text-[var(--color-text-muted)] text-sm max-w-2xl mb-3.5">
        HR drift = (FC fin − FC début)/FC début × 100 · Score durabilité = (HR drift + perte allure + Δ RPE)/3.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-2.5">Données (début vs fin de séance)</div>
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="FC début"><input className="input" value={v.fcDeb} onChange={(e) => setV({ ...v, fcDeb: e.target.value })} /></Field>
              <Field label="FC fin"><input className="input" value={v.fcFin} onChange={(e) => setV({ ...v, fcFin: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="Allure début (min/km)"><input className="input" value={v.allureDeb} onChange={(e) => setV({ ...v, allureDeb: e.target.value })} /></Field>
              <Field label="Allure fin (min/km)"><input className="input" value={v.allureFin} onChange={(e) => setV({ ...v, allureFin: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="RPE début"><input className="input" value={v.rpeDeb} onChange={(e) => setV({ ...v, rpeDeb: e.target.value })} /></Field>
              <Field label="RPE fin"><input className="input" value={v.rpeFin} onChange={(e) => setV({ ...v, rpeFin: e.target.value })} /></Field>
            </div>
            <Field label="Durée de la course visée (min)"><input className="input" value={v.duree} onChange={(e) => setV({ ...v, duree: e.target.value })} /></Field>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
            <Kpi label="HR drift" value={v.fcDeb ? drift.toFixed(1) : "—"} unit="%" color={drift > 12 ? "var(--color-danger)" : drift > 8 ? "var(--color-primary)" : "var(--color-success)"} />
            <Kpi label="Perte d'allure" value={v.allureDeb ? allurePerte.toFixed(1) : "—"} unit="%" color={allurePerte > 6 ? "var(--color-danger)" : allurePerte > 4 ? "var(--color-primary)" : "var(--color-success)"} />
            <Kpi label="Δ RPE" value={v.rpeDeb ? "+" + rpeDelta : "—"} color={rpeDelta >= 4 ? "var(--color-danger)" : rpeDelta >= 3 ? "var(--color-primary)" : "var(--color-success)"} />
            <Kpi label="Score durabilité" value={score ? score.toFixed(1) : "—"} color={scoreLabel.c} note={score ? scoreLabel.l : ""} warn={score > 9} />
          </div>

          <div className="card p-4">
            <div className="font-extrabold mb-2 text-sm">Lecture</div>
            <div className="text-sm leading-relaxed text-[#333]">
              Score : &lt; 5 excellente · 5–7 solide · 7–9 moyenne · &gt; 9 facteur limitant
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              Durabilité requise selon la durée : &lt;2h modérée · 2–4h élevée · 4–8h très élevée · &gt;8h exceptionnelle.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function ProtocolsPage() {
  const [tab, setTab] = useState<"diag" | "meca" | "neuro" | "dura">("diag");

  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Protocoles d'évaluation"
        desc="Les 3 piliers Nutriocus : mécanique, neuromusculaire local, durabilité. Réalise les tests, saisis les valeurs, obtiens tes scores — et le GPT associé pour le rapport complet."
      />
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("diag")} className={tab === "diag" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🎯 Synthèse 360°</button>
        <button onClick={() => setTab("meca")} className={tab === "meca" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🔴 Mécanique</button>
        <button onClick={() => setTab("neuro")} className={tab === "neuro" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🟣 Neuromusculaire</button>
        <button onClick={() => setTab("dura")} className={tab === "dura" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🟢 Durabilité</button>
      </div>
      {tab === "diag" && <Diagnostic />}
      {tab === "meca" && <Mecanique />}
      {tab === "neuro" && <Neuro />}
      {tab === "dura" && <Durabilite />}
    </div>
  );
}
