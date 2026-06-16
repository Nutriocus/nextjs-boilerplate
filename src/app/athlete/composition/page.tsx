"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Compo = {
  id: string;
  date: string;
  poids: number;
  mg: number | null;
  masseGrasse: number | null;
  masseMaigre: number | null;
  taille: number | null;
  hanche: number | null;
  cuisse: number | null;
};

type Test = {
  id: string;
  date: string;
  poids: number;
  puissance: number;
  vitesse: number;
  fc: number;
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function toNumOrNull(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
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

export default function CompositionPage() {
  const [compo, setCompo, loaded] = useAthleteData<Compo[]>("compo", []);
  const [tests, setTests, loadedT] = useAthleteData<Test[]>("forme", []);
  const [profile] = useAthleteData<{ discipline?: string; poidsObjectif?: number | string }>("profile", {});

  const [draft, setDraft] = useState({
    date: today(),
    poids: "",
    mg: "",
    taille: "",
    hanche: "",
    cuisse: "",
  });
  const [tDraft, setTDraft] = useState({
    date: today(),
    poids: "",
    puissance: "",
    vitesse: "",
    fc: "",
  });
  const [disc, setDisc] = useState((profile.discipline as string) || "Trail");

  const sorted = useMemo(
    () => [...compo].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [compo],
  );
  const latest = sorted[sorted.length - 1];

  const [metric, setMetric] = useState<keyof Compo>("poids");
  const metrics: { k: keyof Compo; l: string; u: string; c: string }[] = [
    { k: "poids", l: "Poids", u: "kg", c: "var(--color-primary)" },
    { k: "masseGrasse", l: "Masse grasse", u: "kg", c: "var(--color-danger)" },
    { k: "masseMaigre", l: "Masse maigre", u: "kg", c: "var(--color-success)" },
    { k: "mg", l: "% masse grasse", u: "%", c: "var(--color-dark)" },
    { k: "taille", l: "Tour taille", u: "cm", c: "#8a8a88" },
    { k: "hanche", l: "Tour hanche", u: "cm", c: "#8a8a88" },
    { k: "cuisse", l: "Tour cuisse", u: "cm", c: "var(--color-success)" },
  ];
  const cur = metrics.find((m) => m.k === metric)!;
  const chartData = sorted
    .map((c) => ({ d: dateShort(c.date), v: c[metric] as number | null }))
    .filter((x) => x.v != null);

  function addCompo() {
    if (!draft.date) return;
    const p = toNum(draft.poids);
    const mg = toNumOrNull(draft.mg);
    const mGrasse = p && mg != null ? (p * mg) / 100 : null;
    const mMaigre = p && mGrasse != null ? p - mGrasse : null;
    const c: Compo = {
      id: newId(),
      date: draft.date,
      poids: p,
      mg,
      masseGrasse: mGrasse,
      masseMaigre: mMaigre,
      taille: toNumOrNull(draft.taille),
      hanche: toNumOrNull(draft.hanche),
      cuisse: toNumOrNull(draft.cuisse),
    };
    setCompo((prev) =>
      [...prev.filter((x) => x.date !== c.date), c].sort((a, b) =>
        a.date < b.date ? -1 : 1,
      ),
    );
    setDraft({ date: today(), poids: "", mg: "", taille: "", hanche: "", cuisse: "" });
  }

  function removeCompo(id: string) {
    setCompo((prev) => prev.filter((x) => x.id !== id));
  }

  function ireFor(t: Test): { cap: number | null; trail: number | null; cyc: number | null; nat: number | null; tri: number | null } {
    if (!t.poids || !t.fc) return { cap: null, trail: null, cyc: null, nat: null, tri: null };
    const cap = t.vitesse / (t.fc * t.poids);
    const trail = t.puissance / t.poids / t.fc;
    const cyc = t.puissance / (t.fc * t.poids);
    const nat = t.vitesse / (t.fc * t.poids);
    const tri = 0.15 * nat + 0.55 * cyc + 0.3 * cap;
    return { cap, trail, cyc, nat, tri };
  }

  function addTest() {
    if (!tDraft.date) return;
    setTests((prev) =>
      [
        ...prev,
        {
          id: newId(),
          date: tDraft.date,
          poids: toNum(tDraft.poids),
          puissance: toNum(tDraft.puissance),
          vitesse: toNum(tDraft.vitesse),
          fc: toNum(tDraft.fc),
        },
      ].sort((a, b) => (a.date < b.date ? -1 : 1)),
    );
    setTDraft({ date: today(), poids: "", puissance: "", vitesse: "", fc: "" });
  }

  function removeTest(id: string) {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }

  const discKey: Record<string, "cap" | "trail" | "cyc" | "nat" | "tri"> = {
    Trail: "trail",
    Course: "cap",
    Cyclisme: "cyc",
    Natation: "nat",
    Triathlon: "tri",
  };
  const formula: Record<string, string> = {
    Trail: "Puissance / Poids / FC",
    Course: "Vitesse / (FC × Poids)",
    Cyclisme: "Puissance / (FC × Poids)",
    Natation: "Vitesse / (FC × Poids)",
    Triathlon: "0,15·Nat + 0,55·Cyc + 0,3·CAP",
  };
  const ireChart = [...tests]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((t) => ({ d: dateShort(t.date), v: ireFor(t)[discKey[disc] || "trail"] }))
    .filter((x) => x.v != null);

  if (!loaded || !loadedT) {
    return (
      <div>
        <PageHeader kicker="Comprendre où tu en es" title="Composition corporelle" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Composition corporelle"
        desc="Suivi des masses et mensurations, puis poids de forme via l'IRE selon ta discipline."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi label="Poids actuel" value={latest?.poids ?? "—"} unit="kg" color="var(--color-primary)" />
        <Kpi
          label="Masse grasse"
          value={latest?.masseGrasse != null ? latest.masseGrasse.toFixed(1) : "—"}
          unit="kg"
          color="var(--color-danger)"
          note={latest?.mg != null ? latest.mg + " %" : ""}
        />
        <Kpi
          label="Masse maigre"
          value={latest?.masseMaigre != null ? latest.masseMaigre.toFixed(1) : "—"}
          unit="kg"
          color="var(--color-success)"
        />
        <Kpi label="Poids objectif" value={profile.poidsObjectif || "—"} unit="kg" color="var(--color-dark)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start mb-6">
        <div className="card p-4">
          <div className="font-extrabold mb-3">Nouvelle mesure</div>
          <div className="flex flex-col gap-2">
            <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label="Poids (kg)"><input className="input" value={draft.poids} onChange={(e) => setDraft({ ...draft, poids: e.target.value })} /></Field>
            <Field label="Graisse corporelle (%)"><input className="input" value={draft.mg} onChange={(e) => setDraft({ ...draft, mg: e.target.value })} /></Field>
            <Field label="Tour de taille (cm)"><input className="input" value={draft.taille} onChange={(e) => setDraft({ ...draft, taille: e.target.value })} /></Field>
            <Field label="Tour de hanches (cm)"><input className="input" value={draft.hanche} onChange={(e) => setDraft({ ...draft, hanche: e.target.value })} /></Field>
            <Field label="Tour de cuisse (cm)"><input className="input" value={draft.cuisse} onChange={(e) => setDraft({ ...draft, cuisse: e.target.value })} /></Field>
            <button onClick={addCompo} className="btn-primary mt-1">Ajouter</button>
          </div>
        </div>

        <div>
          <div className="card p-4 mb-4">
            <div className="flex gap-1.5 flex-wrap mb-3">
              {metrics.map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMetric(m.k)}
                  className={metric === m.k ? "btn-primary btn-xs" : "btn-ghost btn-xs"}
                >
                  {m.l}
                </button>
              ))}
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" name={cur.l} stroke={cur.c} strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty>Ajoute des mesures.</Empty>
            )}
          </div>

          {sorted.length > 0 && (
            <div className="card overflow-auto">
              <table className="table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Poids</th><th>%MG</th><th>M.grasse</th><th>M.maigre</th><th>Taille</th><th>Hanche</th><th>Cuisse</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{dateShort(c.date)}</td>
                      <td>{c.poids}</td>
                      <td>{c.mg ?? "—"}</td>
                      <td>{c.masseGrasse != null ? c.masseGrasse.toFixed(1) : "—"}</td>
                      <td style={{ color: "var(--color-success)", fontWeight: 700 }}>{c.masseMaigre != null ? c.masseMaigre.toFixed(1) : "—"}</td>
                      <td>{c.taille ?? "—"}</td>
                      <td>{c.hanche ?? "—"}</td>
                      <td>{c.cuisse ?? "—"}</td>
                      <td>
                        <button onClick={() => removeCompo(c.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PageHeader kicker="Poids de forme" title="IRE — indice de rendement énergétique" />

      <div className="flex gap-1.5 flex-wrap mb-3">
        {["Trail", "Course", "Cyclisme", "Natation", "Triathlon"].map((d) => (
          <button key={d} onClick={() => setDisc(d)} className={disc === d ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            {d}
          </button>
        ))}
      </div>

      <div className="text-sm text-[var(--color-text-muted)] mb-3">
        Formule {disc} : <b className="text-[var(--color-text)]">{formula[disc]}</b> — plus la valeur est haute, meilleur est le rendement.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-3">Nouveau test</div>
          <div className="flex flex-col gap-2">
            <Field label="Date"><input type="date" className="input" value={tDraft.date} onChange={(e) => setTDraft({ ...tDraft, date: e.target.value })} /></Field>
            <Field label="Poids (kg)"><input className="input" value={tDraft.poids} onChange={(e) => setTDraft({ ...tDraft, poids: e.target.value })} /></Field>
            <Field label="Puissance (W)"><input className="input" value={tDraft.puissance} onChange={(e) => setTDraft({ ...tDraft, puissance: e.target.value })} /></Field>
            <Field label="Vitesse (km/h)"><input className="input" value={tDraft.vitesse} onChange={(e) => setTDraft({ ...tDraft, vitesse: e.target.value })} /></Field>
            <Field label="FC moyenne (bpm)"><input className="input" value={tDraft.fc} onChange={(e) => setTDraft({ ...tDraft, fc: e.target.value })} /></Field>
            <button onClick={addTest} className="btn-primary mt-1">Ajouter</button>
          </div>
        </div>

        <div>
          <div className="card p-4 mb-4">
            <div className="font-extrabold mb-2 text-sm">Évolution IRE — {disc}</div>
            {ireChart.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ireChart} margin={{ top: 5, right: 10, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} tickFormatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)} />
                  <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(4) : v)} />
                  <Line type="monotone" dataKey="v" name="IRE" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty>Ajoute un test pour visualiser ton poids de forme.</Empty>
            )}
          </div>

          {tests.length > 0 && (
            <div className="card overflow-auto">
              <table className="table" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Poids</th><th>Puiss.</th><th>Vit.</th><th>FC</th>
                    <th>IRE CAP</th><th>IRE Trail</th><th>IRE Cyc</th><th>IRE Tri</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...tests].sort((a, b) => (a.date < b.date ? 1 : -1)).map((t) => {
                    const i = ireFor(t);
                    const fmt = (v: number | null) => (v == null ? "—" : v.toFixed(4));
                    const highlight = (k: string) => discKey[disc] === k ? { background: "var(--color-accent)" } : {};
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700 }}>{dateShort(t.date)}</td>
                        <td>{t.poids}</td>
                        <td>{t.puissance || "—"}</td>
                        <td>{t.vitesse || "—"}</td>
                        <td>{t.fc}</td>
                        <td style={highlight("cap")}>{fmt(i.cap)}</td>
                        <td style={highlight("trail")}>{fmt(i.trail)}</td>
                        <td style={highlight("cyc")}>{fmt(i.cyc)}</td>
                        <td style={{ fontWeight: 700, ...highlight("tri") }}>{fmt(i.tri)}</td>
                        <td>
                          <button onClick={() => removeTest(t.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
