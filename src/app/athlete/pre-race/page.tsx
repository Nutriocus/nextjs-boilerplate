"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PrintButton, PrintReport, PrintH } from "@/components/ui/PrintReport";
import {
  PRERACE_PLANS,
  closestWeightBucket,
  preraceBreakfastOptionsFor,
  assignMeals,
  MEAL_LABELS,
  MEAL_ORDER,
  type PreraceDay,
  type PreraceFood,
  type Meal,
} from "@/data/prerace-plans";

type PreraceData = {
  poids: number | string;
  gPerKg: { j4: number | string; j3: number | string; j2: number | string; j1: number | string };
  notes: string;
};

const DEFAULT: PreraceData = {
  poids: 71,
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

const MEAL_COLORS: Record<Meal, string> = {
  petit_dej: "var(--color-primary)",
  collation: "#e6a833",
  dejeuner: "var(--color-dark)",
  malto: "var(--color-success)",
  diner: "#7b1fa2",
};

const MEAL_ICONS: Record<Meal, string> = {
  petit_dej: "🌅",
  collation: "🍎",
  dejeuner: "🍽",
  malto: "💧",
  diner: "🌙",
};

function FoodCard({ item }: { item: PreraceFood }) {
  return (
    <div
      className="rounded-lg px-3 py-2 bg-[var(--color-surface-2)]"
      style={{ border: "1px dashed var(--color-border)" }}
    >
      <div className="text-[var(--color-primary)] font-bold text-sm">{item.food}</div>
      {item.qty && <div className="text-sm mt-0.5">{item.qty}</div>}
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
  const [selectedDay, setSelectedDay] = useState<PreraceDay>("J-4");
  const [selectedMeal, setSelectedMeal] = useState<Meal | "tous">("tous");

  useEffect(() => {
    if (loaded) {
      const next: PreraceData = { ...DEFAULT, ...data };
      if ((next.poids === DEFAULT.poids || next.poids === "" || next.poids == null) && profile?.poids) {
        next.poids = profile.poids;
      }
      setLocal(next);
    }
  }, [loaded, data, profile?.poids]);

  const poids = toNum(local.poids);
  const bucket = closestWeightBucket(poids);
  const planByDay = PRERACE_PLANS[bucket];
  const breakfasts = preraceBreakfastOptionsFor(bucket);

  const updatePoids = (v: string) => {
    const d = { ...local, poids: v };
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

  const dayItems = planByDay?.[selectedDay] || [];
  const meals = assignMeals(dayItems);
  const dayDescriptor = DAYS.find((d) => d.k === selectedDay)!;
  const isJJ = selectedDay === "J-J";

  // Build list of meals that have content (for the day's meal buttons)
  const availableMeals: Meal[] = MEAL_ORDER.filter((m) => meals[m].length > 0);

  const gKey = selectedDay.replace("J-", "j").toLowerCase() as keyof PreraceData["gPerKg"];
  const gk = local.gPerKg[gKey] != null ? toNum(local.gPerKg[gKey]) : 0;
  const cibleCHO = Math.round(gk * poids);

  return (
    <div>
      <div className="screen-only">
        <PageHeader
          kicker="Avant la course"
          title="Préparation alimentaire (J-4 → Jour J)"
          desc="Plan alimentaire détaillé par jour, organisé par repas. Sélectionne le jour puis le repas que tu prépares."
          action={<PrintButton label="Exporter en PDF" />}
        />

        {/* Bandeau poids + cibles g/kg */}
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <Field label="Poids athlète (kg)">
              <input className="input" value={local.poids} onChange={(e) => updatePoids(e.target.value)} />
            </Field>
            {(["j4", "j3", "j2", "j1"] as const).map((k, idx) => {
              const label = ["J-4 (g/kg)", "J-3 (g/kg)", "J-2 (g/kg)", "J-1/J (g/kg)"][idx];
              return (
                <Field key={k} label={label}>
                  <input className="input" value={local.gPerKg[k]} onChange={(e) => updateGperKg(k, e.target.value)} />
                </Field>
              );
            })}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-2">
            Les cibles glucidiques jour par jour : J-4 = {Math.round(toNum(local.gPerKg.j4) * poids)} g
            · J-3 = {Math.round(toNum(local.gPerKg.j3) * poids)} g
            · J-2 = {Math.round(toNum(local.gPerKg.j2) * poids)} g
            · J-1/J = {Math.round(toNum(local.gPerKg.j1) * poids)} g
          </div>
        </div>

        {/* Sélecteur de jour */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {DAYS.map((d) => (
            <button
              key={d.k}
              onClick={() => {
                setSelectedDay(d.k);
                setSelectedMeal("tous");
              }}
              className={selectedDay === d.k ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
              style={{ minWidth: 90 }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Carte du jour sélectionné */}
        <div className="card overflow-hidden mb-4" style={{ borderTop: `3px solid var(--color-primary)` }}>
          <div
            className={isJJ ? "bg-[var(--color-dark)]" : "bg-[var(--color-primary)]"}
            style={{ padding: "12px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
          >
            <div>
              <div className="font-extrabold uppercase text-lg" style={{ fontFamily: "var(--font-display)" }}>
                {isJJ ? "Jour J — Petit déjeuner course" : `Plan alimentaire ${dayDescriptor.label}`}
              </div>
              <div className="text-xs opacity-90 mt-0.5">{dayDescriptor.desc}</div>
            </div>
            {!isJJ && (
              <div className="text-right">
                <div className="text-xs uppercase opacity-80">Cible</div>
                <div className="font-extrabold text-base">{cibleCHO} g CHO</div>
              </div>
            )}
          </div>

          {/* JOUR J : 3 options petit déjeuner */}
          {isJJ ? (
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
          ) : (
            <>
              {/* Sélecteur de repas */}
              <div className="px-4 pt-3 flex gap-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
                <button
                  onClick={() => setSelectedMeal("tous")}
                  className={selectedMeal === "tous" ? "btn-dark btn-sm" : "btn-ghost btn-sm"}
                >
                  Tous ({dayItems.length})
                </button>
                {availableMeals.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMeal(m)}
                    className={selectedMeal === m ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                    style={selectedMeal === m ? { background: MEAL_COLORS[m] } : {}}
                  >
                    {MEAL_ICONS[m]} {MEAL_LABELS[m]} ({meals[m].length})
                  </button>
                ))}
              </div>

              <div className="p-4">
                {selectedMeal === "tous" ? (
                  // Show all meals grouped
                  <div className="space-y-4">
                    {availableMeals.map((m) => (
                      <div key={m}>
                        <div
                          className="text-white font-bold text-[11px] uppercase rounded-lg px-3 py-1.5 mb-2"
                          style={{ background: MEAL_COLORS[m], letterSpacing: ".08em" }}
                        >
                          {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {meals[m].map((it, i) => (
                            <FoodCard key={i} item={it} />
                          ))}
                        </div>
                      </div>
                    ))}
                    {availableMeals.length === 0 && <Empty>Aucun aliment renseigné pour cette journée.</Empty>}
                  </div>
                ) : (
                  // Show one specific meal
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {meals[selectedMeal].map((it, i) => (
                      <FoodCard key={i} item={it} />
                    ))}
                    {meals[selectedMeal].length === 0 && (
                      <div className="col-span-full">
                        <Empty>Aucun aliment pour {MEAL_LABELS[selectedMeal].toLowerCase()} ce jour.</Empty>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notes / sensations */}
        <div className="card p-4">
          <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            ✍ Notes & sensations
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mb-2">
            Note ici tes sensations digestives, ton respect du plan, les écarts éventuels, ce qui a marché ou pas pour cette préparation.
          </div>
          <Field label="">
            <textarea
              className="input"
              style={{ minHeight: 100, resize: "vertical" }}
              value={local.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Ex. J-3 : féculents bien tolérés, énergie stable. J-2 : trop de fibres au dîner, ballonnements légers..."
            />
          </Field>
        </div>
      </div>

      {/* PDF version — full plan */}
      <PrintReport
        kicker="Avant la course"
        title="Préparation alimentaire (J-4 → Jour J)"
        subtitle={poids ? `${poids} kg · Cibles glucidiques jour par jour` : undefined}
      >
        {DAYS.filter((d) => d.k !== "J-J").map((d) => {
          const items = planByDay?.[d.k] || [];
          const dayMeals = assignMeals(items);
          const gkLocal = toNum(local.gPerKg[d.k.replace("J-", "j").toLowerCase() as keyof PreraceData["gPerKg"]]);
          const total = Math.round(gkLocal * poids);
          return (
            <div key={d.k} style={{ marginTop: 12 }}>
              <PrintH>{d.label} — Cible {total} g CHO</PrintH>
              <div style={{ fontSize: 10.5, color: "#787876", marginBottom: 6, marginLeft: 16 }}>{d.desc}</div>
              {MEAL_ORDER.filter((m) => dayMeals[m].length > 0).map((m) => (
                <div key={m} className="no-break" style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4, color: "#0a0a0a" }}>
                    {MEAL_LABELS[m]}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                    {dayMeals[m].map((it, i) => (
                      <div key={i} style={{ border: "1px solid #e6e6e3", borderRadius: 8, padding: "5px 9px" }}>
                        <div style={{ fontWeight: 800, color: "#FF4501", fontSize: 11 }}>{it.food}</div>
                        {it.qty && <div style={{ fontSize: 10.5 }}>{it.qty}</div>}
                        {it.tip && <div style={{ fontSize: 9, color: "#787876", fontStyle: "italic" }}>{it.tip}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
            <PrintH>Notes & sensations</PrintH>
            <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{local.notes}</div>
          </>
        )}
      </PrintReport>
    </div>
  );
}
