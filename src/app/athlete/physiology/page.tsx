"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import {
  PhysioProfileExt,
  PhysioFields,
  getPhysioFor,
  isTriathlete,
  DEFAULT_SWIM_GLUC_PER_H,
} from "@/lib/physio-profile";
import { PageHeader, Field } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import {
  PrintReport,
  PrintH,
  PrintButton,
  PrintBox,
} from "@/components/ui/PrintReport";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// =====================================================================
// Profil physiologique & énergétique
// Triathletes can fill separate tests for CAP and Vélo (FCmax/VO2max/
// thresholds differ between disciplines). Mono-discipline athletes
// see the original single-test view unchanged.
// =====================================================================

const DEFAULT_PROFILE: PhysioProfileExt = {
  poids: 71,
  fcmax: 190,
  vo2max: 62,
  sv1: 160,
  sv2: 175,
  rerSV1: 0.85,
  rerSV2: 0.95,
  vo2SV1: 44,
  vo2SV2: 60,
};

const ZONES = [
  { z: "Z1 — Endurance basse", vo2: 0.55, fc: 0.65, rer: 0.8 },
  { z: "Z2 — Endurance aéro",  vo2: 0.7,  fc: 0.75, rer: 0.85 },
  { z: "Z3 — Tempo",            vo2: 0.8,  fc: 0.83, rer: 0.9 },
  { z: "Z4 — Seuil",            vo2: 0.9,  fc: 0.9,  rer: 0.95 },
  { z: "Z5 — Soutenu",          vo2: 0.95, fc: 0.95, rer: 0.98 },
];

type ViewKey = "principal" | "cap" | "velo" | "natation";

const VIEW_LABEL: Record<ViewKey, string> = {
  principal: "Test principal",
  cap: "Course à pied",
  velo: "Vélo",
  natation: "Natation",
};

const VIEW_ICON: Record<ViewKey, string> = {
  principal: "🧪",
  cap: "🏃",
  velo: "🚴",
  natation: "🏊",
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

type ZoneCalc = ReturnType<typeof computeZones>[number];

function computeZones(fields: PhysioFields & { poids?: number | string }) {
  const vo2max = toNum(fields.vo2max);
  const poids = toNum(fields.poids);
  const fcmax = toNum(fields.fcmax);
  return ZONES.map((z) => {
    const cho = Math.max(0, Math.min(1, (z.rer - 0.7) / 0.3));
    const lip = 1 - cho;
    const vo2lmin = (vo2max * poids) / 1000 * z.vo2;
    const kcalmin = 5 * vo2lmin;
    const fcCible = Math.round(fcmax * z.fc);
    return {
      ...z,
      fcCible,
      cho,
      lip,
      vo2lmin,
      kcalmin,
      kcalh: kcalmin * 60,
      gchomin: (kcalmin * cho) / 4,
      glipmin: (kcalmin * lip) / 9,
    };
  });
}

export default function PhysiologyPage() {
  const [profile, setProfile] = useAthleteData<PhysioProfileExt>("profile", DEFAULT_PROFILE);
  const triathlete = isTriathlete(profile);

  // Default view: "principal" for mono-disciplines; "cap" for triathletes.
  const [view, setView] = useState<ViewKey>(triathlete ? "cap" : "principal");

  // Update primary profile fields (used by "principal" view).
  const updatePrimary = (k: keyof PhysioProfileExt, v: string) =>
    setProfile((p) => ({ ...p, [k]: v }));

  // Update a discipline-specific test (cap or velo).
  const updateTest = (disc: "cap" | "velo", k: keyof PhysioFields, v: string) =>
    setProfile((p) => ({
      ...p,
      tests: {
        ...(p.tests ?? {}),
        [disc]: { ...((p.tests ?? {})[disc] ?? {}), [k]: v },
      },
    }));

  // Resolve the fields displayed in the form + zones for the current view.
  const currentFields: PhysioFields & { poids?: number | string } =
    view === "principal"
      ? {
          poids: profile.poids,
          fcmax: profile.fcmax,
          vo2max: profile.vo2max,
          sv1: profile.sv1,
          sv2: profile.sv2,
          rerSV1: profile.rerSV1,
          rerSV2: profile.rerSV2,
          vo2SV1: profile.vo2SV1,
          vo2SV2: profile.vo2SV2,
        }
      : view === "cap"
        ? getPhysioFor(profile, "course")
        : view === "velo"
          ? getPhysioFor(profile, "cyclisme")
          : { poids: profile.poids };

  const editingDiscTest = view === "cap" || view === "velo";
  const rawTestFields: PhysioFields | undefined = editingDiscTest
    ? profile.tests?.[view === "cap" ? "cap" : "velo"]
    : undefined;

  const zones = view === "natation" ? [] : computeZones(currentFields);

  const subData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    CHO: +z.gchomin.toFixed(2),
    Lipides: +z.glipmin.toFixed(2),
  }));
  const kcalData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    "kcal/h": Math.round(z.kcalh),
  }));
  const substratData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    "% CHO": Math.round(z.cho * 100),
    "% Lipides": Math.round(z.lip * 100),
  }));

  const visibleTabs: ViewKey[] = triathlete
    ? ["principal", "cap", "velo", "natation"]
    : ["principal"];

  const swimGph = profile.swimGlucPerH ?? DEFAULT_SWIM_GLUC_PER_H;

  return (
    <div>
      <div className="screen-only">
      <PageHeader
        kicker="Anticiper tes courses"
        title="Profil physiologique & énergétique"
        action={<PrintButton />}
        desc={
          triathlete
            ? "Triathlète : renseigne idéalement un test labo par discipline (CAP + Vélo). La déplétion glycogène en triathlon utilisera automatiquement les seuils correspondants à chaque segment."
            : `Zones calculées depuis ton profil (VO₂max ${profile.vo2max ?? "—"}, poids ${profile.poids ?? "—"} kg). %CHO = (RER−0,7)/0,3 · VO₂ = VO₂max×poids/1000×%VO₂max · kcal/min = 5×VO₂.`
        }
      />

      <HelpSection title="ℹ️ Profil physiologique — c'est quoi et à quoi ça sert ?">
        <HelpBlock icon="🎯" title="Pourquoi">
          <p>
            Ton profil physiologique est la <b>carte d&apos;identité énergétique de ton corps</b> :
            VO₂max, FCmax, seuils ventilatoires (SV1 / SV2), RER associés. Ces données viennent
            d&apos;un <b>test à l&apos;effort en laboratoire</b> (avec masque + analyseur de gaz).
          </p>
          <p>
            Elles permettent de connaître précisément <b>tes zones d&apos;intensité</b> et la
            répartition <b>glucides / lipides</b> consommés à chaque allure.
          </p>
        </HelpBlock>
        {triathlete && (
          <HelpBlock icon="🚴🏃" title="Pourquoi 2 tests en triathlon">
            <p>
              FCmax et seuils ventilatoires sont <b>significativement différents entre la course
              et le vélo</b> (FCmax vélo est typiquement plus basse de 5 à 15 bpm). Renseigner les
              deux tests permet à la plateforme de calculer la déplétion glycogène <b>segment par
              segment</b> avec les bons seuils.
            </p>
            <p>
              Pour la <b>natation</b>, on utilise une estimation forfaitaire en g/h glucides
              (un test VO₂ en piscine est très rare). Ajustable dans l&apos;onglet Natation.
            </p>
          </HelpBlock>
        )}
        <HelpBlock icon="🔬" title="Comment c'est utilisé dans la plateforme">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Dépenses en course</b> : calcule le % CHO oxydés par segment selon la FC cible (interpolation SV1/SV2)</li>
            <li><b>Stratégie de course</b> : valide la cohérence de la zone d&apos;effort prévue</li>
            <li><b>IRE</b> : intervient dans le calcul du poids de forme</li>
            <li><b>Analyses post-course</b> : on compare la FC moyenne réalisée vs les seuils théoriques</li>
          </ul>
        </HelpBlock>
      </HelpSection>

      {/* ──────────────── Tabs (triathlètes uniquement) ──────────────── */}
      {triathlete && (
        <div className="card p-2 mb-4 flex flex-wrap gap-1.5">
          {visibleTabs.map((t) => {
            const active = view === t;
            const filled =
              t === "principal"
                ? Boolean(profile.vo2max)
                : t === "cap" || t === "velo"
                  ? Boolean(profile.tests?.[t]?.vo2max)
                  : Boolean(profile.swimGlucPerH);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setView(t)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
                style={{
                  background: active ? "var(--color-primary)" : "var(--color-surface-2)",
                  color: active ? "#fff" : "var(--color-dark)",
                  border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                }}
              >
                <span>{VIEW_ICON[t]}</span>
                <span>{VIEW_LABEL[t]}</span>
                {!filled && !active && (
                  <span className="text-[10px] uppercase font-bold px-1 py-0.5 rounded" style={{ background: "#fff3", color: "var(--color-text-muted)" }}>
                    À remplir
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ──────────────── ÉTAPE 1 — Variables d'entrée ──────────────── */}
      {view !== "natation" ? (
        <div className="card p-4 mb-4" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] uppercase font-extrabold"
              style={{ letterSpacing: ".1em", color: "var(--color-primary)" }}
            >
              Étape 1
            </span>
            <span className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
              {triathlete ? `Variables d'entrée — ${VIEW_LABEL[view]}` : "Variables d'entrée"}
            </span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
            {editingDiscTest ? (
              <>
                Renseigne les valeurs issues du test labo <b>{view === "cap" ? "course à pied" : "vélo"}</b>.
                Les champs laissés vides reprennent automatiquement les valeurs du <b>Test principal</b>.
                Le poids reste global (renseigné dans Mon profil).
              </>
            ) : (
              <>
                Remplis les valeurs issues de ton test à l&apos;effort (labo). L&apos;Étape 2 ci-dessous se met à
                jour automatiquement. Les modifications sont enregistrées sur ton profil et utilisées
                dans toute la plateforme (dépenses en course, stratégie, IRE…).
              </>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {!editingDiscTest && (
              <Field label="Poids (kg)">
                <input
                  className="input"
                  inputMode="decimal"
                  value={profile.poids ?? ""}
                  onChange={(e) => updatePrimary("poids", e.target.value)}
                />
              </Field>
            )}
            <Field label="FCmax (bpm)">
              <input
                className="input"
                inputMode="numeric"
                value={(editingDiscTest ? rawTestFields?.fcmax : profile.fcmax) ?? ""}
                placeholder={editingDiscTest ? String(profile.fcmax ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "fcmax", e.target.value)
                    : updatePrimary("fcmax", e.target.value)
                }
              />
            </Field>
            <Field label="VO₂max (ml/kg/min)">
              <input
                className="input"
                inputMode="decimal"
                value={(editingDiscTest ? rawTestFields?.vo2max : profile.vo2max) ?? ""}
                placeholder={editingDiscTest ? String(profile.vo2max ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "vo2max", e.target.value)
                    : updatePrimary("vo2max", e.target.value)
                }
              />
            </Field>
            <Field label="SV1 (bpm)">
              <input
                className="input"
                inputMode="numeric"
                value={(editingDiscTest ? rawTestFields?.sv1 : profile.sv1) ?? ""}
                placeholder={editingDiscTest ? String(profile.sv1 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "sv1", e.target.value)
                    : updatePrimary("sv1", e.target.value)
                }
              />
            </Field>
            <Field label="SV2 (bpm)">
              <input
                className="input"
                inputMode="numeric"
                value={(editingDiscTest ? rawTestFields?.sv2 : profile.sv2) ?? ""}
                placeholder={editingDiscTest ? String(profile.sv2 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "sv2", e.target.value)
                    : updatePrimary("sv2", e.target.value)
                }
              />
            </Field>
            <Field label="RER SV1">
              <input
                className="input"
                inputMode="decimal"
                value={(editingDiscTest ? rawTestFields?.rerSV1 : profile.rerSV1) ?? ""}
                placeholder={editingDiscTest ? String(profile.rerSV1 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "rerSV1", e.target.value)
                    : updatePrimary("rerSV1", e.target.value)
                }
              />
            </Field>
            <Field label="RER SV2">
              <input
                className="input"
                inputMode="decimal"
                value={(editingDiscTest ? rawTestFields?.rerSV2 : profile.rerSV2) ?? ""}
                placeholder={editingDiscTest ? String(profile.rerSV2 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "rerSV2", e.target.value)
                    : updatePrimary("rerSV2", e.target.value)
                }
              />
            </Field>
            <Field label="VO₂ à SV1 (ml/kg/min)">
              <input
                className="input"
                inputMode="decimal"
                value={(editingDiscTest ? rawTestFields?.vo2SV1 : profile.vo2SV1) ?? ""}
                placeholder={editingDiscTest ? String(profile.vo2SV1 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "vo2SV1", e.target.value)
                    : updatePrimary("vo2SV1", e.target.value)
                }
              />
            </Field>
            <Field label="VO₂ à SV2 (ml/kg/min)">
              <input
                className="input"
                inputMode="decimal"
                value={(editingDiscTest ? rawTestFields?.vo2SV2 : profile.vo2SV2) ?? ""}
                placeholder={editingDiscTest ? String(profile.vo2SV2 ?? "") : ""}
                onChange={(e) =>
                  editingDiscTest
                    ? updateTest(view as "cap" | "velo", "vo2SV2", e.target.value)
                    : updatePrimary("vo2SV2", e.target.value)
                }
              />
            </Field>
          </div>
        </div>
      ) : (
        // ──────────────── Natation : pas de zones, juste estimation g/h ────────────────
        <div className="card p-4 mb-4" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] uppercase font-extrabold"
              style={{ letterSpacing: ".1em", color: "var(--color-primary)" }}
            >
              Natation
            </span>
            <span className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
              Estimation glucidique
            </span>
          </div>
          <div className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
            Un vrai test VO₂ en piscine est très rare. Pour la déplétion glycogène sur la partie natation,
            on utilise une <b>estimation forfaitaire en g/h</b>. La valeur par défaut ({DEFAULT_SWIM_GLUC_PER_H} g/h)
            correspond à un nageur entraîné sur allure tri olympique → IM ; ajuste si tu as un profil particulier.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <Field label="Glucides natation (g/h)">
              <input
                className="input"
                inputMode="numeric"
                value={swimGph}
                placeholder={String(DEFAULT_SWIM_GLUC_PER_H)}
                onChange={(e) => updatePrimary("swimGlucPerH", e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ──────────────── ÉTAPE 2 — Tableau des zones (sauf natation) ──────────────── */}
      {view !== "natation" && (
        <>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] uppercase font-extrabold"
              style={{ letterSpacing: ".1em", color: "var(--color-primary)" }}
            >
              Étape 2 · calcul automatique
            </span>
            <span className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
              Tableau des zones d&apos;intensité
              {triathlete && view !== "principal" && (
                <span className="text-[var(--color-text-muted)] font-normal text-sm ml-2">
                  — {VIEW_LABEL[view]}
                </span>
              )}
            </span>
          </div>
          <div className="card mb-5 overflow-x-auto">
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>%VO₂max</th>
                  <th>%FCmax</th>
                  <th>FC cible (bpm)</th>
                  <th>RER</th>
                  <th>%CHO</th>
                  <th>%Lip</th>
                  <th>VO₂ L/min</th>
                  <th>kcal/min</th>
                  <th>kcal/h</th>
                  <th>g CHO/min</th>
                  <th>g Lip/min</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z: ZoneCalc, i: number) => (
                  <tr key={i} style={{ background: i % 2 ? "#fafaf8" : "#fff" }}>
                    <td style={{ fontWeight: 700 }}>{z.z}</td>
                    <td>{Math.round(z.vo2 * 100)}%</td>
                    <td>{Math.round(z.fc * 100)}%</td>
                    <td style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                      {z.fcCible > 0 ? z.fcCible : "—"}
                    </td>
                    <td>{z.rer}</td>
                    <td style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                      {Math.round(z.cho * 100)}%
                    </td>
                    <td style={{ color: "var(--color-success)", fontWeight: 700 }}>
                      {Math.round(z.lip * 100)}%
                    </td>
                    <td>{z.vo2lmin.toFixed(2)}</td>
                    <td>{z.kcalmin.toFixed(1)}</td>
                    <td style={{ fontWeight: 700 }}>{Math.round(z.kcalh)}</td>
                    <td style={{ color: "var(--color-primary)" }}>
                      {z.gchomin.toFixed(2)}
                    </td>
                    <td style={{ color: "var(--color-success)" }}>
                      {z.glipmin.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">
                Oxydation des substrats par zone (g/min)
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="CHO" fill="var(--color-primary)" />
                  <Bar dataKey="Lipides" fill="var(--color-dark)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">
                Dépense énergétique par zone (kcal/h)
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={kcalData} margin={{ top: 5, right: 10, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Bar dataKey="kcal/h" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4 lg:col-span-2">
              <div className="font-extrabold mb-2 text-sm">
                Répartition des substrats (% CHO vs % Lipides)
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={substratData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="% CHO" stackId="1" stroke="var(--color-primary)" fill="var(--color-primary)" />
                  <Area type="monotone" dataKey="% Lipides" stackId="1" stroke="var(--color-success)" fill="var(--color-accent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
      </div>

      <PrintReport
        kicker="Anticiper tes courses"
        title={`Profil physiologique${triathlete && view !== "principal" && view !== "natation" ? ` — ${VIEW_LABEL[view]}` : ""}`}
        subtitle={`VO₂max ${currentFields.vo2max ?? "—"} ml/kg/min · Poids ${profile.poids ?? "—"} kg · FCmax ${currentFields.fcmax ?? "—"} bpm`}
      >
        {view === "natation" ? (
          <>
            <PrintH>Estimation glucidique natation</PrintH>
            <p style={{ fontSize: 12 }}>
              Glucides estimés : <b>{swimGph} g/h</b> (valeur par défaut {DEFAULT_SWIM_GLUC_PER_H} g/h).
            </p>
          </>
        ) : (
          <>
            <PrintH>Zones d&apos;intensité</PrintH>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#0a0a0a", color: "#fff" }}>
                  {["Zone", "%VO₂", "%FC", "FC cible", "RER", "%CHO", "%Lip", "kcal/h", "g CHO/min", "g Lip/min"].map((h) => (
                    <th key={h} style={{ padding: "7px 6px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z: ZoneCalc, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e6e6e3", background: i % 2 ? "#fafaf8" : "#fff" }}>
                    <td style={{ padding: "6px", fontWeight: 700 }}>{z.z}</td>
                    <td>{Math.round(z.vo2 * 100)}%</td>
                    <td>{Math.round(z.fc * 100)}%</td>
                    <td style={{ fontWeight: 700 }}>{z.fcCible > 0 ? z.fcCible : "—"}</td>
                    <td>{z.rer}</td>
                    <td style={{ color: "#FF4501", fontWeight: 700 }}>{Math.round(z.cho * 100)}%</td>
                    <td style={{ color: "#5f8c0a", fontWeight: 700 }}>{Math.round(z.lip * 100)}%</td>
                    <td style={{ fontWeight: 700 }}>{Math.round(z.kcalh)}</td>
                    <td>{z.gchomin.toFixed(2)}</td>
                    <td>{z.glipmin.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PrintH>Oxydation des substrats par zone (g/min)</PrintH>
            <PrintBox title="Glucides vs lipides">
              <BarChart width={690} height={210} data={subData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e3" />
                <XAxis dataKey="z" tick={{ fontSize: 10, fill: "#787876" }} />
                <YAxis tick={{ fontSize: 10, fill: "#787876" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="CHO" fill="#FF4501" isAnimationActive={false} />
                <Bar dataKey="Lipides" fill="#0a0a0a" isAnimationActive={false} />
              </BarChart>
            </PrintBox>
            <PrintBox title="Dépense énergétique par zone (kcal/h)">
              <BarChart width={690} height={200} data={kcalData} margin={{ top: 4, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e3" />
                <XAxis dataKey="z" tick={{ fontSize: 10, fill: "#787876" }} />
                <YAxis tick={{ fontSize: 10, fill: "#787876" }} />
                <Bar dataKey="kcal/h" fill="#FF4501" isAnimationActive={false} />
              </BarChart>
            </PrintBox>
          </>
        )}
      </PrintReport>
    </div>
  );
}
