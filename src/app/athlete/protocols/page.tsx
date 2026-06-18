"use client";

import { useState } from "react";
import { PageHeader, Kpi, Field } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import {
  PrintReport,
  PrintH,
  PrintButton,
  PrintKpi,
} from "@/components/ui/PrintReport";
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
      <div className="screen-only">
      <div className="mb-3.5 flex gap-2.5 flex-wrap items-center">
        <GptLink url="https://chatgpt.com/g/g-68fd31200980819184b22509cce50fe7-nutriocus-diagnostic-pre-course-360deg">
          GPT — Diagnostic pré-course 360°
        </GptLink>
        <PrintButton label="Exporter en PDF" />
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

      <PrintReport
        kicker="Anticiper tes courses"
        title="Diagnostic pré-course 360°"
        subtitle={`Sport : ${sport}`}
      >
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, alignItems: "center" }}>
          <div style={{ border: "1px solid #e6e6e3", borderRadius: 12, padding: "8px 6px" }}>
            <RadarChart width={330} height={280} data={data} outerRadius="72%">
              <PolarGrid stroke="#e6e6e3" />
              <PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: "#0a0a0a", fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#787876" }} />
              <Radar dataKey="v" stroke="#FF4501" fill="#FF4501" fillOpacity={0.32} isAnimationActive={false} />
            </RadarChart>
          </div>
          <div>
            <div style={{ textAlign: "center", border: "1px solid #e6e6e3", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#787876", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Score Nutriocus global
              </div>
              <div style={{ fontWeight: 800, fontSize: 42, color: colorFor(global), lineHeight: 1.1 }}>
                {Math.round(global)}
                <span style={{ fontSize: 15, color: "#787876" }}>/100</span>
              </div>
            </div>
            <PrintKpi label="Point fort" value={fort.l} sub={`${fort.v}/100`} accent="#5f8c0a" />
            <div style={{ height: 8 }} />
            <PrintKpi label="Facteur limitant prioritaire" value={faible.l} sub={`${faible.v}/100 · ${faible.mur}`} accent={colorFor(faible.v)} />
          </div>
        </div>

        <PrintH>Seuils critiques & risques</PrintH>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: "#0a0a0a", color: "#fff" }}>
              {["Système", "Pond.", "Score", "Indicateur", "Seuil critique", "Risque"].map((h) => (
                <th key={h} style={{ padding: "7px 8px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sys.map((s) => (
              <tr key={s.k} style={{ borderBottom: "1px solid #e6e6e3" }}>
                <td style={{ padding: "6px 8px", fontWeight: 700 }}>{s.l}</td>
                <td>{s.w}%</td>
                <td style={{ fontWeight: 800, color: colorFor(s.v) }}>{s.v}</td>
                <td>{s.ind}</td>
                <td style={{ color: "#787876" }}>{s.seuil}</td>
                <td>{s.mur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintReport>
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

      <HelpSection title="ℹ️ Protocoles d'évaluation — à quoi ça sert et comment les utiliser ?">
        <HelpBlock icon="🎯" title="Pourquoi">
          <p>
            Les protocoles permettent de <b>diagnostiquer objectivement</b> tes points
            forts/faibles avant de bâtir une stratégie. Ils couvrent les 3 piliers
            de la performance d&apos;endurance :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>🔴 Mécanique</b> : économie de course, foulée, posture (efficacité du geste)</li>
            <li><b>🟣 Neuromusculaire</b> : force locale des chaînes (mollets, quadris, fessiers…)</li>
            <li><b>🟢 Durabilité</b> : capacité à maintenir l&apos;intensité dans le temps (résistance à la fatigue)</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="📝" title="Comment faire">
          <ul className="list-disc pl-5 space-y-1">
            <li>Choisis un pilier (onglet 🔴 / 🟣 / 🟢)</li>
            <li>Réalise les tests proposés (souvent autonomes — terrain ou salle)</li>
            <li>Saisis les valeurs brutes mesurées (temps, répétitions, charges, FC…)</li>
            <li>La plateforme calcule un <b>score</b> par catégorie + un score global</li>
            <li>Ouvre le <b>GPT associé</b> (bouton en haut) pour un rapport détaillé</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="🔬" title="Comment c'est utilisé ensuite">
          <ul className="list-disc pl-5 space-y-1">
            <li>L&apos;onglet <b>🎯 Synthèse 360°</b> agrège tes 3 piliers en une vue radar</li>
            <li>Tes scores guident les <b>séances de travail prioritaires</b> avec ton coach</li>
            <li>Tu refais les tests <b>tous les 2-3 mois</b> pour suivre tes progrès</li>
          </ul>
        </HelpBlock>
      </HelpSection>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("diag")} className={tab === "diag" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🎯 Synthèse 360°</button>
        <button onClick={() => setTab("meca")} className={tab === "meca" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🔴 Mécanique</button>
        <button onClick={() => setTab("neuro")} className={tab === "neuro" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🟣 Neuromusculaire</button>
        <button onClick={() => setTab("dura")} className={tab === "dura" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>🟢 Durabilité</button>
      </div>
      {tab === "meca" && (
        <HelpSection title="🔴 Protocole MÉCANIQUE — comment réaliser les tests ?">
          <HelpBlock icon="🎯" title="Objectif">
            <p>
              Évaluer ta <b>tolérance musculaire</b> (force concentrique, élasticité,
              endurance excentrique) pour anticiper le <b>mur mécanique</b> en course
              et adapter ton travail de renfo.
            </p>
            <p className="text-xs italic mt-1">
              💡 Tu peux utiliser l&apos;application <b>My Jump Lab</b> (essai gratuit 14j) pour
              mesurer les hauteurs de saut précisément.
            </p>
          </HelpBlock>
          <HelpBlock icon="1️⃣" title="Test 1 — Squat Jump (SJ) — force concentrique">
            <ul className="list-disc pl-5 space-y-1">
              <li>Pieds largeur d&apos;épaules, mains sur les hanches</li>
              <li>Descends à <b>90°</b>, <b>maintiens 1 sec</b>, puis saute le plus haut possible</li>
              <li><b>3 essais</b>, garde la meilleure hauteur</li>
              <li>Mesure : capteur, app My Jump Lab, ou règle de saut</li>
            </ul>
            <div className="mt-2 text-xs">
              <b>Interprétation :</b> &lt;25 cm = déficit · 25-35 cm = correct · &gt;35 cm = bon
            </div>
          </HelpBlock>
          <HelpBlock icon="2️⃣" title="Test 2 — Counter Movement Jump (CMJ) — élasticité">
            <ul className="list-disc pl-5 space-y-1">
              <li>Debout, mains sur les hanches</li>
              <li><b>Descente rapide puis saut immédiat</b> (utilise le rebond élastique)</li>
              <li><b>3 essais</b>, garde la meilleure</li>
            </ul>
            <div className="mt-2 text-xs">
              <b>Gain CMJ − SJ :</b> &lt;2 cm = raideur · 3-6 cm = bon équilibre · &gt;8 cm = excellente réactivité
            </div>
          </HelpBlock>
          <HelpBlock icon="3️⃣" title="Test 3 — Step Down excentrique — résistance quadriceps">
            <ul className="list-disc pl-5 space-y-1">
              <li>Monte sur une marche de <b>25-30 cm</b></li>
              <li>Descends <b>lentement</b> (phase excentrique contrôlée de <b>3-4 sec</b>) sur une jambe</li>
              <li>Remonte avec les <b>deux jambes</b></li>
              <li>Répète <b>jusqu&apos;à fatigue</b> (max 30 reps)</li>
            </ul>
            <div className="mt-2 text-xs">
              <b>Interprétation :</b> &lt;15 reps = risque mur précoce · 15-25 = bonne base · &gt;25 = très bonne tolérance
            </div>
          </HelpBlock>
          <HelpBlock icon="📊" title="Ce que la plateforme calcule">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>CMI</b> (Capacité Mécanique Initiale) : puissance + résistance intégrées</li>
              <li><b>CAP</b> (Capacité utilisable) : charge mécanique absorbable avant rupture</li>
              <li><b>ICM</b> (Indice de Contrainte Mécanique) — &lt;0,70 OK · 0,70-0,90 vigilance · &gt;0,90 risque mur</li>
            </ul>
          </HelpBlock>
        </HelpSection>
      )}

      {tab === "neuro" && (
        <HelpSection title="🟣 Protocole NEUROMUSCULAIRE LOCAL — comment réaliser les tests ?">
          <HelpBlock icon="🎯" title="Objectif">
            <p>
              Évaluer la capacité de ton <b>système nerveux à coordonner les muscles
              sous fatigue</b>. Une mauvaise synchronisation = crampes, perte de
              cadence, désynchronisation locale.
            </p>
            <p className="text-xs italic mt-1">
              Les 4 groupes clés analysés : <b>mollets, adducteurs, quadriceps, ischios</b> —
              tests à faire <b>jambe gauche puis jambe droite</b>.
            </p>
          </HelpBlock>
          <HelpBlock icon="1️⃣" title="Test 1 — Endurance isométrique (4 muscles, G + D)">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Mollets — Calf hold unilatéral</b> : sur une jambe, genou tendu, monte sur la pointe du pied, chrono jusqu&apos;à rupture. Seuil : &lt;45 s = faible</li>
              <li><b>Adducteurs — Wall squeeze</b> : assis dos au mur, balle/coussin entre les genoux, serre au max, chrono. Seuil : &lt;45 s = déficit</li>
              <li><b>Quadriceps — Wall sit unilatéral</b> : dos au mur, une jambe à 90°, chrono. Seuil : &lt;50 s = tolérance limitée</li>
              <li><b>Ischios — Glute bridge unilatéral</b> : allongé, une jambe en pont, chrono. Seuil : &lt;50 s = résistance faible</li>
            </ul>
            <div className="mt-2 text-xs">
              👉 Pour chaque test : note <b>temps G</b> et <b>temps D</b> → la plateforme calcule l&apos;<b>asymétrie %</b>.
            </div>
          </HelpBlock>
          <HelpBlock icon="2️⃣" title="Test 2 — Rate of Force Development (RFD)">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>CMJ initial H₁</b> : mesure la hauteur du saut au repos</li>
              <li><b>Fatigue</b> : enchaîne <b>20 fentes sautées</b> alternées (RPE 9/10)</li>
              <li><b>Pause 10 s</b></li>
              <li><b>3 CMJ</b> → moyenne = H₂</li>
              <li>Ratio = H₂ / H₁ × 100</li>
            </ul>
            <div className="mt-2 text-xs">
              <b>Interprétation :</b> &gt;90% = excellente relance · 80-90% = fatigue modérée · &lt;80% = déficit nerveux (risque crampe)
            </div>
          </HelpBlock>
          <HelpBlock icon="3️⃣" title="Test 3 — Équilibre unipodal yeux fermés">
            <ul className="list-disc pl-5 space-y-1">
              <li>Tiens-toi sur <b>une jambe, yeux fermés</b>, pendant <b>60 sec</b></li>
              <li>Compte le <b>nombre de fois où le pied opposé touche le sol</b></li>
              <li>Refais sur l&apos;autre jambe</li>
              <li>Chaque contact = −10% d&apos;efficacité proprioceptive</li>
            </ul>
          </HelpBlock>
          <HelpBlock icon="📊" title="Ce que la plateforme calcule">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>INML</b> par muscle (Indice Neuromusculaire Local)</li>
              <li>&gt;0,90 = coordination excellente · 0,80-0,90 = modéré · &lt;0,80 = risque élevé</li>
              <li><b>Moment probable de crampe</b> estimé en % de course par muscle</li>
              <li>Plan de travail ciblé (renfo, proprio, pliométrie + apport <b>Na 600-800 mg/L</b>)</li>
            </ul>
          </HelpBlock>
        </HelpSection>
      )}

      {tab === "dura" && (
        <HelpSection title="🟢 Protocole DURABILITÉ — comment réaliser le test ?">
          <HelpBlock icon="🎯" title="Objectif">
            <p>
              Évaluer ta capacité à <b>maintenir l&apos;intensité dans la durée</b> (fatigue
              progressive). C&apos;est souvent le vrai facteur limitant en endurance —
              au-delà des chiffres bruts de VO₂max ou de seuil.
            </p>
          </HelpBlock>
          <HelpBlock icon="📅" title="Type et durée du test (selon ton objectif)">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Type :</b> sortie longue spécifique (terrain proche course)</li>
              <li><b>10 km / semi</b> → 90 min · <b>marathon</b> → 2h · <b>trail long</b> → 2h30 · <b>ultra</b> → 3h+</li>
              <li><b>Intensité cible :</b> endurance active / allure course longue (65-80% VO₂max, zone 2 haute / zone 3 basse)</li>
              <li>Objectif : <b>reproduire les contraintes physio de la course</b></li>
            </ul>
          </HelpBlock>
          <HelpBlock icon="📝" title="Comment faire">
            <ul className="list-disc pl-5 space-y-1">
              <li>Réalise la sortie avec ta <b>montre GPS + cardio</b> (et capteur de puissance si dispo)</li>
              <li>Note ton <b>RPE au début</b> et <b>RPE à la fin</b> (échelle 1-10)</li>
              <li>Note les conditions : <b>température, dénivelé, terrain</b></li>
              <li>Récupère les données sur <b>Strava / ta montre</b> : FC moyenne début (0-30%), milieu (30-70%), fin (70-100%) — allure moyenne par segment</li>
              <li>Saisis les valeurs dans la plateforme</li>
            </ul>
          </HelpBlock>
          <HelpBlock icon="📊" title="Ce que la plateforme calcule">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>HR drift</b> = (FC fin − FC début) / FC début × 100 — &lt;5% = excellente · 5-8% = correcte · 8-12% = moyenne · &gt;12% = limitante</li>
              <li><b>Dérive mécanique</b> (baisse d&apos;allure à FC stable) — &lt;2% = très stable · 2-4% = OK · &gt;6% = faible</li>
              <li><b>Dérive perceptive</b> (Δ RPE) — +1 = très stable · +2 = normal · +4 = limite</li>
              <li><b>Score global Durabilité</b> — &lt;5 excellente · 5-7 solide · 7-9 moyenne · &gt;9 facteur limitant</li>
            </ul>
            <div className="mt-2 text-xs italic">
              À refaire toutes les <b>4-6 semaines</b> ou avant un objectif. Tiens compte de la fatigue de la semaine, chaleur, hydratation, état nutritionnel.
            </div>
          </HelpBlock>
        </HelpSection>
      )}

      {tab === "diag" && <Diagnostic />}
      {tab === "meca" && <Mecanique />}
      {tab === "neuro" && <Neuro />}
      {tab === "dura" && <Durabilite />}
    </div>
  );
}
