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
  ReferenceLine,
  Legend,
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
  photo?: string;
  photoNote?: string;
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
const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const newId = () => Math.random().toString(36).slice(2, 9);
const dateShort = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, dd || 1);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};
const dateLong = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, dd || 1);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);

// Compress image to data URL (similar to profile photo)
function compressImage(file: File, max: number, cb: (data: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new window.Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > max) {
          h = (h * max) / w;
          w = max;
        }
      } else if (h > max) {
        w = (w * max) / h;
        h = max;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      try {
        cb(c.toDataURL("image/jpeg", 0.78));
      } catch {
        cb(reader.result as string);
      }
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

// Find the closest entry to (refDate - daysAgo) with a non-null value for `key`
function findReference(
  sorted: Compo[],
  refDate: string,
  daysAgo: number,
  key: keyof Compo,
  toleranceDays: number,
): Compo | null {
  const target = new Date(parseISO(refDate).getTime() - daysAgo * 86400000);
  const targetISO = target.toISOString().slice(0, 10);
  let best: Compo | null = null;
  let bestDist = Infinity;
  for (const c of sorted) {
    if (c[key] == null) continue;
    const d = Math.abs(daysBetween(c.date, targetISO));
    if (d <= toleranceDays && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

// Compute a centered N-window moving average over the chart data
function movingAverage(data: { d: string; v: number | null }[], window: number) {
  return data.map((_, i, arr) => {
    const half = Math.floor(window / 2);
    const slice = arr.slice(Math.max(0, i - half), Math.min(arr.length, i + half + 1));
    const vals = slice.map((x) => x.v).filter((v): v is number => v != null);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  });
}

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
    photo: "",
    photoNote: "",
  });
  const [tDraft, setTDraft] = useState({
    date: today(),
    poids: "",
    puissance: "",
    vitesse: "",
    fc: "",
  });
  const [disc, setDisc] = useState((profile.discipline as string) || "Trail");
  const [photoCompare, setPhotoCompare] = useState<[string | null, string | null]>([null, null]);
  const [lightbox, setLightbox] = useState<Compo | null>(null);

  const sorted = useMemo(
    () => [...compo].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [compo],
  );
  const latest = sorted[sorted.length - 1];
  const objectif = toNumOrNull(profile.poidsObjectif);

  const [metric, setMetric] = useState<keyof Compo>("poids");
  const [smoothing, setSmoothing] = useState(false);
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
  const baseData = sorted
    .map((c) => ({ d: dateShort(c.date), iso: c.date, v: c[metric] as number | null }))
    .filter((x) => x.v != null);
  const avgValues = smoothing && baseData.length >= 3 ? movingAverage(baseData, 5) : null;
  const chartData = baseData.map((x, i) => ({
    ...x,
    avg: avgValues ? avgValues[i] : null,
  }));

  // Variations (latest vs 30j / 90j / 1an)
  const variations = useMemo(() => {
    if (!latest) return [];
    return [
      { label: "vs 30 j", days: 30, tolerance: 10 },
      { label: "vs 90 j", days: 90, tolerance: 20 },
      { label: "vs 1 an", days: 365, tolerance: 30 },
    ].map((v) => {
      const ref = findReference(sorted, latest.date, v.days, metric, v.tolerance);
      if (!ref || ref.id === latest.id) return { ...v, delta: null, refDate: null };
      const latestVal = latest[metric] as number | null;
      const refVal = ref[metric] as number | null;
      if (latestVal == null || refVal == null) return { ...v, delta: null, refDate: null };
      return { ...v, delta: latestVal - refVal, refDate: ref.date };
    });
  }, [sorted, latest, metric]);

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
      photo: draft.photo || undefined,
      photoNote: draft.photoNote || undefined,
    };
    setCompo((prev) =>
      [...prev.filter((x) => x.date !== c.date), c].sort((a, b) =>
        a.date < b.date ? -1 : 1,
      ),
    );
    setDraft({ date: today(), poids: "", mg: "", taille: "", hanche: "", cuisse: "", photo: "", photoNote: "" });
  }

  function removeCompo(id: string) {
    if (!confirm("Supprimer cette mesure ?")) return;
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
    Trail: "trail", Course: "cap", Cyclisme: "cyc", Natation: "nat", Triathlon: "tri",
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

  const compoWithPhotos = sorted.filter((c) => c.photo);

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
        desc="Suivi des masses et mensurations, photos avant/après, et poids de forme via l'IRE."
      />

      {/* KPI top */}
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

      {/* Variations vs 30 / 90 / 365 j */}
      {variations.some((v) => v.delta != null) && (
        <div className="card p-4 mb-5">
          <div className="text-xs uppercase font-bold text-[var(--color-text-muted)] mb-3" style={{ letterSpacing: ".08em" }}>
            Évolution {cur.l.toLowerCase()}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {variations.map((v) => {
              const cls = v.delta == null ? "text-[var(--color-text-muted)]" :
                v.delta < 0 ? "text-[var(--color-success)]" :
                v.delta > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]";
              return (
                <div key={v.label} className="text-center">
                  <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                    {v.label}
                  </div>
                  <div className={`text-2xl font-extrabold ${cls}`} style={{ fontFamily: "var(--font-display)" }}>
                    {v.delta == null ? "—" : `${v.delta > 0 ? "+" : ""}${v.delta.toFixed(1)} ${cur.u}`}
                  </div>
                  {v.refDate && (
                    <div className="text-[10px] text-[var(--color-text-muted)]">depuis le {dateShort(v.refDate)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start mb-6">
        {/* Form: new measurement */}
        <div className="card p-4">
          <div className="font-extrabold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            ➕ Nouvelle mesure
          </div>
          <div className="flex flex-col gap-2">
            <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label="Poids (kg)"><input className="input" value={draft.poids} onChange={(e) => setDraft({ ...draft, poids: e.target.value })} /></Field>
            <Field label="Graisse corporelle (%)"><input className="input" value={draft.mg} onChange={(e) => setDraft({ ...draft, mg: e.target.value })} /></Field>
            <Field label="Tour de taille (cm)"><input className="input" value={draft.taille} onChange={(e) => setDraft({ ...draft, taille: e.target.value })} /></Field>
            <Field label="Tour de hanches (cm)"><input className="input" value={draft.hanche} onChange={(e) => setDraft({ ...draft, hanche: e.target.value })} /></Field>
            <Field label="Tour de cuisse (cm)"><input className="input" value={draft.cuisse} onChange={(e) => setDraft({ ...draft, cuisse: e.target.value })} /></Field>

            <Field label="Photo (optionnel)">
              <div className="flex items-center gap-2">
                {draft.photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.photo} alt="" className="w-14 h-14 rounded object-cover" />
                    <button onClick={() => setDraft({ ...draft, photo: "" })} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>
                      Retirer
                    </button>
                  </>
                ) : (
                  <label className="btn-dark btn-sm cursor-pointer">
                    Importer
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        compressImage(f, 720, (d) => setDraft((p) => ({ ...p, photo: d })));
                      }}
                    />
                  </label>
                )}
              </div>
            </Field>
            {draft.photo && (
              <Field label="Note photo">
                <input className="input" placeholder="Face, profil, etc." value={draft.photoNote} onChange={(e) => setDraft({ ...draft, photoNote: e.target.value })} />
              </Field>
            )}

            <button onClick={addCompo} className="btn-primary mt-1">Ajouter</button>
          </div>
        </div>

        {/* Chart + table */}
        <div>
          <div className="card p-4 mb-4">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
              <div className="flex gap-1.5 flex-wrap">
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
              {baseData.length >= 3 && (
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={smoothing} onChange={(e) => setSmoothing(e.target.checked)} />
                  Lissage (moyenne mobile 5 pts)
                </label>
              )}
            </div>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                  <Tooltip
                    formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)} ${cur.u}` : v)}
                    contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  />
                  {metric === "poids" && objectif != null && (
                    <ReferenceLine y={objectif} stroke="var(--color-success)" strokeDasharray="4 4" label={{ value: `Objectif ${objectif} kg`, position: "insideTopRight", fill: "var(--color-success)", fontSize: 10 }} />
                  )}
                  <Line type="monotone" dataKey="v" name={cur.l} stroke={cur.c} strokeWidth={3} dot={{ r: 3 }} />
                  {smoothing && (
                    <Line type="monotone" dataKey="avg" name="Moyenne mobile" stroke={cur.c} strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  )}
                  {smoothing && <Legend wrapperStyle={{ fontSize: 11 }} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty>Ajoute des mesures pour visualiser la courbe.</Empty>
            )}
          </div>

          {sorted.length > 0 && (
            <div className="card overflow-auto">
              <table className="table" style={{ minWidth: 660 }}>
                <thead>
                  <tr>
                    <th>Date</th><th>Poids</th><th>%MG</th><th>M.grasse</th><th>M.maigre</th><th>Taille</th><th>Hanche</th><th>Cuisse</th><th>📷</th><th></th>
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
                        {c.photo ? (
                          <button onClick={() => setLightbox(c)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14 }}>📷</button>
                        ) : "—"}
                      </td>
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

      {/* ============ Galerie photos avant/après ============ */}
      {compoWithPhotos.length > 0 && (
        <div className="mb-6">
          <PageHeader kicker="Photos de progression" title={`Galerie (${compoWithPhotos.length})`} />
          <div className="text-sm text-[var(--color-text-muted)] mb-3">
            Clique sur 2 photos pour les comparer côte à côte (avant / après).
          </div>

          {/* Comparison view */}
          {(photoCompare[0] || photoCompare[1]) && (
            <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-primary)" }}>
              <div className="flex justify-between items-center mb-3">
                <div className="font-extrabold text-sm" style={{ fontFamily: "var(--font-display)" }}>
                  Comparaison avant / après
                </div>
                <button onClick={() => setPhotoCompare([null, null])} className="btn-ghost btn-xs">Réinitialiser</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1].map((idx) => {
                  const id = photoCompare[idx];
                  const c = compoWithPhotos.find((x) => x.id === id);
                  return (
                    <div key={idx} className="text-center">
                      <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2" style={{ letterSpacing: ".08em" }}>
                        {idx === 0 ? "Avant" : "Après"}
                      </div>
                      {c ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.photo} alt="" className="w-full max-h-96 object-contain rounded" />
                          <div className="text-sm font-bold mt-2">{dateLong(c.date)}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {c.poids} kg
                            {c.mg != null ? ` · ${c.mg}% MG` : ""}
                            {c.taille != null ? ` · taille ${c.taille} cm` : ""}
                          </div>
                          {c.photoNote && <div className="text-xs italic text-[var(--color-text-muted)] mt-1">{c.photoNote}</div>}
                        </>
                      ) : (
                        <div className="border-2 border-dashed border-[var(--color-border)] rounded p-10 text-[var(--color-text-muted)] text-sm">
                          Sélectionne une photo ci-dessous
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {photoCompare[0] && photoCompare[1] && (() => {
                const a = compoWithPhotos.find((x) => x.id === photoCompare[0]);
                const b = compoWithPhotos.find((x) => x.id === photoCompare[1]);
                if (!a || !b) return null;
                const dP = b.poids - a.poids;
                const dMG = a.mg != null && b.mg != null ? b.mg - a.mg : null;
                const dT = a.taille != null && b.taille != null ? b.taille - a.taille : null;
                const days = Math.abs(daysBetween(a.date, b.date));
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
                    <Kpi label="Durée" value={days} unit="j" color="var(--color-dark)" />
                    <Kpi label="Δ Poids" value={`${dP > 0 ? "+" : ""}${dP.toFixed(1)}`} unit="kg" color={dP < 0 ? "var(--color-success)" : "var(--color-primary)"} />
                    {dMG != null && <Kpi label="Δ %MG" value={`${dMG > 0 ? "+" : ""}${dMG.toFixed(1)}`} unit="%" color={dMG < 0 ? "var(--color-success)" : "var(--color-primary)"} />}
                    {dT != null && <Kpi label="Δ Taille" value={`${dT > 0 ? "+" : ""}${dT.toFixed(1)}`} unit="cm" color={dT < 0 ? "var(--color-success)" : "var(--color-primary)"} />}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Thumbnails grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {compoWithPhotos.map((c) => {
              const inCompareIdx = photoCompare[0] === c.id ? 0 : photoCompare[1] === c.id ? 1 : -1;
              return (
                <div
                  key={c.id}
                  className="card overflow-hidden cursor-pointer transition hover:-translate-y-0.5"
                  style={{ borderColor: inCompareIdx >= 0 ? "var(--color-primary)" : "var(--color-border)", borderWidth: inCompareIdx >= 0 ? 2 : 1 }}
                  onClick={() => {
                    if (inCompareIdx === 0) {
                      setPhotoCompare([null, photoCompare[1]]);
                    } else if (inCompareIdx === 1) {
                      setPhotoCompare([photoCompare[0], null]);
                    } else if (!photoCompare[0]) {
                      setPhotoCompare([c.id, photoCompare[1]]);
                    } else if (!photoCompare[1]) {
                      setPhotoCompare([photoCompare[0], c.id]);
                    } else {
                      // Both filled: replace #1 (Avant) with this one
                      setPhotoCompare([c.id, photoCompare[1]]);
                    }
                  }}
                >
                  <div style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photo} alt="" className="w-full h-32 object-cover" />
                    {inCompareIdx >= 0 && (
                      <div
                        className="absolute top-1 right-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ background: "var(--color-primary)", color: "#fff", letterSpacing: ".06em" }}
                      >
                        {inCompareIdx === 0 ? "Avant" : "Après"}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-bold">{dateShort(c.date)}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{c.poids} kg{c.mg != null ? ` · ${c.mg}%` : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-2xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.photo} alt="" className="w-full max-h-[75vh] object-contain" />
            <div className="text-white text-sm mt-3">
              <b>{dateLong(lightbox.date)}</b> — {lightbox.poids} kg
              {lightbox.mg != null ? ` · ${lightbox.mg}% MG` : ""}
            </div>
            {lightbox.photoNote && <div className="text-white text-xs italic opacity-80 mt-1">{lightbox.photoNote}</div>}
            <button onClick={() => setLightbox(null)} className="btn-primary btn-sm mt-3">Fermer</button>
          </div>
        </div>
      )}

      {/* ============ IRE ============ */}
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
