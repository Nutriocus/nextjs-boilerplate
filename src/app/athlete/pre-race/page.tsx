"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Kpi } from "@/components/ui/PageHeader";
import { PrintButton, PrintReport, PrintH } from "@/components/ui/PrintReport";
import {
  PRERACE_PLANS,
  PRERACE_WEIGHT_BUCKETS,
  closestWeightBucket,
  preraceBreakfastOptionsFor,
  type PreraceDay,
  type PreraceFood,
} from "@/data/prerace-plans";

type PreraceData = {
  poids: number | string;
  bucketOverride: number | "auto";
  gPerKg: { j4: number | string; j3: number | string; j2: number | string; j1: number | string };
  notes: string;
};

const DEFAULT: PreraceData = {
  poids: 71,
  bucketOverride: "auto",
  gPerKg: { j4: 8, j3: 10, j2: 12, j1: 6 },
  notes: "",
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

const DAYS: { k: PreraceDay; label: string; desc: string }[] = [
  { k: "J-4", label: "J-4", desc: "Début de la charge progressive — féculents bien tolérés" },
  { k: "J-3", label: "J-3", desc: "Montée de la charge glucidique" },
  { k: "J-2", label: "J-2", desc: "Pic de surcompensation glycogénique" },
  { k: "J-1", label: "J-1", desc: "Optimisation digestive, peu de fibres" },
  { k: "J-J", label: "Jour J", desc: "Petit déjeuner course — 3 options selon tolérance" },
];

function FoodCard({ item }: { item: PreraceFood }) {
  return (
    <div
      className="rounded-lg px-3 py-2 bg-[var(--color-surface-2)]"
      style={{ border: "1px dashed var(--color-border)" }}
    >
      <div className="text-[var(--color-primary)] font-bold text-sm">{item.food}</div>
      <div className="text-sm mt-0.5">{item.qty}</div>
      {item.tip && (
        <div className="text-[var(--color-text-muted)] text-xs italic mt-0.5">{item.tip}</div>
      )}
    </div>
  );
}

export default function PreRacePage() {
  const [profile] = useAthleteData<{ poids?: number | string }>("profile", {});
  const [data, setData, loaded] = useAthleteData<PreraceData>("prerace", DEFAULT);
  const [local, setLocal] = useState<PreraceData>(DEFAULT);

  useEffect(() => {
    if (loaded) {
      // Hydrate from profile weight if not customized yet
      const next: PreraceData = { ...DEFAULT, ...data };
      if ((next.poids === DEFAULT.poids || next.poids === "" || next.poids == null) && profile?.poids) {
        next.poids = profile.poids;
      }
      setLocal(next);
    }
  }, [loaded, data, profile?.poids]);

  const poids = toNum(local.poids);
  const autoBucket = closestWeightBucket(poids);
  const effectiveBucket = local.bucketOverride === "auto" ? autoBucket : Number(local.bucketOverride);
  const planByDay = PRERACE_PLANS[effectiveBucket];

  const breakfasts = preraceBreakfastOptionsFor(effectiveBucket);

  const updatePoids = (v: string) => {
    const d = { ...local, poids: v };
    setLocal(d);
    setData(d);
  };
  const updateBucket = (v: string) => {
    const d = { ...local, bucketOverride: (v === "auto" ? "auto" : Number(v)) as PreraceData["bucketOverride"] };
    setLocal(d);
    setData(d);
  };
  const updateGperKg = (k: keyof PreraceData["gPerKg"], v: string) => {
    const d = { ...local, gPerKg: { ...local.gPerKg, [k]: toNum(v) } };
    setLocal(d);
    setData(d);
  };
  const updateNotes = (v: string) => {
    const d = { ...local, notes: v };
    setLocal(d);
    setData(d);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Avant la course" title="Préparation alimentaire (J-4 → Jour J)" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-only">
        <PageHeader
          kicker="Avant la course"
          title="Préparation alimentaire (J-4 → Jour J)"
          desc="Plan détaillé adapté au poids de l'athlète. Les portions sont issues des protocoles NUTRIOCUS par tranche de poids."
          action={<PrintButton label="Exporter en PDF" />}
        />

        {/* Bandeau poids + bucket */}
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <Field label="Poids athlète (kg)">
              <input className="input" value={local.poids} onChange={(e) => updatePoids(e.target.value)} />
            </Field>
            <Field label="Tranche de plan (poids de référence)">
              <select className="input" value={String(local.bucketOverride)} onChange={(e) => updateBucket(e.target.value)}>
                <option value="auto">Auto ({autoBucket} kg)</option>
                {PRERACE_WEIGHT_BUCKETS.map((w) => (
                  <option key={w} value={w}>{w} kg</option>
                ))}
              </select>
            </Field>
            <Kpi label="Plan appliqué" value={effectiveBucket} unit="kg" color="var(--color-primary)" />
            <Kpi
              label="Écart vs athlète"
              value={poids ? (effectiveBucket - poids > 0 ? "+" : "") + (effectiveBucket - poids).toFixed(1) : "—"}
              unit="kg"
              color={Math.abs(effectiveBucket - poids) <= 2 ? "var(--color-success)" : "var(--color-danger)"}
            />
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-3">
            Tranches disponibles : {PRERACE_WEIGHT_BUCKETS.join(" · ")} kg. Le plus proche du poids athlète est sélectionné automatiquement.
          </div>
        </div>

        {/* Cibles g/kg pour repère */}
        <div className="card p-4 mb-4">
          <div className="font-extrabold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Cibles glucides théoriques (g/kg/jour)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["j4", "j3", "j2", "j1"] as const).map((k, idx) => {
              const gk = toNum(local.gPerKg[k]);
              const total = Math.round(gk * poids);
              const label = ["J-4", "J-3", "J-2", "J-1 / J"][idx];
              return (
                <div key={k} className="bg-[var(--color-surface-2)] rounded-lg p-3" style={{ borderTop: "3px solid var(--color-primary)" }}>
                  <div className="text-xs uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".08em" }}>
                    {label}
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <input
                      className="input text-base font-bold w-16"
                      value={local.gPerKg[k]}
                      onChange={(e) => updateGperKg(k, e.target.value)}
                    />
                    <span className="text-xs text-[var(--color-text-muted)]">g/kg</span>
                  </div>
                  <div className="text-sm text-[var(--color-primary)] font-bold mt-1">
                    → {total} g CHO
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans détaillés par jour */}
        {DAYS.filter((d) => d.k !== "J-J").map((d) => {
          const items = planByDay?.[d.k] || [];
          const gk = toNum(local.gPerKg[d.k.replace("J-", "j").toLowerCase() as keyof PreraceData["gPerKg"]]);
          const total = Math.round(gk * poids);
          return (
            <div
              key={d.k}
              className="card overflow-hidden mb-4"
              style={{ borderTop: `3px solid var(--color-primary)` }}
            >
              <div className="bg-[var(--color-primary)] px-4 py-3 flex justify-between items-center text-white flex-wrap gap-2">
                <div>
                  <div className="font-extrabold uppercase text-lg" style={{ fontFamily: "var(--font-display)" }}>
                    Plan alimentaire {d.label}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">{d.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase opacity-80">Cible</div>
                  <div className="font-extrabold text-base">{total} g CHO</div>
                </div>
              </div>
              <div className="p-4">
                {items.length === 0 ? (
                  <Empty>Aucun aliment renseigné pour cette tranche de poids.</Empty>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((it, i) => (
                      <FoodCard key={i} item={it} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Jour J — 3 options petit déjeuner */}
        <div className="card overflow-hidden mb-4" style={{ borderTop: "3px solid var(--color-accent)" }}>
          <div className="bg-[var(--color-dark)] px-4 py-3 flex justify-between items-center text-white flex-wrap gap-2">
            <div>
              <div className="font-extrabold uppercase text-lg" style={{ fontFamily: "var(--font-display)" }}>
                Jour J — Petit déjeuner course
              </div>
              <div className="text-xs opacity-90 mt-0.5">3 options selon tolérance & timing du départ</div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {breakfasts.map((b, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3"
                style={{ background: "var(--color-surface-2)", borderTop: "3px solid var(--color-accent)" }}
              >
                <div className="font-extrabold text-sm" style={{ fontFamily: "var(--font-display)" }}>
                  {b.nom}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5 mb-2">{b.description}</div>
                <div className="flex flex-col gap-1.5">
                  {b.items.map((it, j) => (
                    <div key={j} className="text-xs">
                      <span className="text-[var(--color-primary)] font-bold">{it.food}</span> — <b>{it.qty}</b>
                      {it.tip && <div className="text-[var(--color-text-muted)] italic">{it.tip}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <Field label="Notes / commentaires libres">
            <textarea
              className="input"
              style={{ minHeight: 80, resize: "vertical" }}
              value={local.notes}
              onChange={(e) => updateNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* PDF version */}
      <PrintReport
        kicker="Avant la course"
        title={`Préparation alimentaire — ${effectiveBucket} kg`}
        subtitle={`Plan ${poids ? poids + " kg → tranche " + effectiveBucket + " kg" : effectiveBucket + " kg"} · J-4 → Jour J`}
      >
        {DAYS.filter((d) => d.k !== "J-J").map((d) => {
          const items = planByDay?.[d.k] || [];
          const gk = toNum(local.gPerKg[d.k.replace("J-", "j").toLowerCase() as keyof PreraceData["gPerKg"]]);
          const total = Math.round(gk * poids);
          return (
            <div key={d.k} style={{ marginTop: 12 }}>
              <PrintH>{d.label} — Cible {total} g CHO</PrintH>
              <div style={{ fontSize: 10.5, color: "#787876", marginBottom: 6, marginLeft: 16 }}>{d.desc}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
                {items.map((it, i) => (
                  <div key={i} className="no-break" style={{ border: "1px solid #e6e6e3", borderRadius: 9, padding: "6px 10px" }}>
                    <div style={{ fontWeight: 800, color: "#FF4501", fontSize: 11.5 }}>{it.food}</div>
                    <div style={{ fontSize: 11 }}>{it.qty}</div>
                    {it.tip && <div style={{ fontSize: 9.5, color: "#787876", fontStyle: "italic" }}>{it.tip}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <PrintH>Jour J — 3 options petit déjeuner course</PrintH>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {breakfasts.map((b, idx) => (
            <div key={idx} className="no-break" style={{ border: "1px solid #e6e6e3", borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ fontWeight: 800, fontSize: 11.5 }}>{b.nom}</div>
              <div style={{ fontSize: 9.5, color: "#787876", marginBottom: 4 }}>{b.description}</div>
              {b.items.map((it, j) => (
                <div key={j} style={{ fontSize: 10, marginTop: 3 }}>
                  <b style={{ color: "#FF4501" }}>{it.food}</b> — {it.qty}
                  {it.tip && <div style={{ fontSize: 9, color: "#787876", fontStyle: "italic" }}>{it.tip}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {local.notes && (
          <>
            <PrintH>Notes</PrintH>
            <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{local.notes}</div>
          </>
        )}
      </PrintReport>
    </div>
  );
}
