"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PrintButton, PrintReport, PrintH } from "@/components/ui/PrintReport";
import {
  PRERACE_PLANS,
  closestWeightBucket,
  MEAL_LABELS,
  MEAL_ORDER,
  type PreraceDay,
  type PreraceFood,
  type PreraceRacePossibility,
  type Meal,
} from "@/data/prerace-plans";

type DayKey = PreraceDay | "J-J";

type PreraceData = {
  poids: number | string;
  gPerKg: { j4: number | string; j3: number | string; j2: number | string; j1: number | string };
  notes: string;
  // Surcharges spécifiques à l'athlète : si présent, remplace entièrement la section pour ce (jour, repas).
  customDays?: Partial<Record<PreraceDay, Partial<Record<Meal, PreraceFood[]>>>>;
  // Surcharge pour les 3 possibilités du Jour J.
  customRaceDay?: PreraceRacePossibility[];
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

const DAYS: { k: DayKey; label: string; desc: string }[] = [
  { k: "J-4", label: "J-4", desc: "Début de la charge progressive — féculents bien tolérés" },
  { k: "J-3", label: "J-3", desc: "Montée de la charge glucidique" },
  { k: "J-2", label: "J-2", desc: "Pic de surcompensation glycogénique" },
  { k: "J-1", label: "J-1", desc: "Optimisation digestive, peu de fibres — petit déjeuner mutualisé avec la collation sous forme de pancake" },
  { k: "J-J", label: "Jour J", desc: "Petit déjeuner course — choisis la possibilité qui correspond" },
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

function FoodEditor({
  items,
  onChange,
}: {
  items: PreraceFood[];
  onChange: (next: PreraceFood[]) => void;
}) {
  const updateItem = (idx: number, key: keyof PreraceFood, value: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, { food: "", qty: "", tip: "" }]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1.4fr_auto] gap-1.5">
          <input
            className="input"
            placeholder="Aliment"
            value={it.food}
            onChange={(e) => updateItem(i, "food", e.target.value)}
          />
          <input
            className="input"
            placeholder="Quantité"
            value={it.qty}
            onChange={(e) => updateItem(i, "qty", e.target.value)}
          />
          <input
            className="input"
            placeholder="Conseil (optionnel)"
            value={it.tip}
            onChange={(e) => updateItem(i, "tip", e.target.value)}
          />
          <button
            onClick={() => removeItem(i)}
            className="btn-ghost btn-sm"
            style={{ color: "var(--color-danger)" }}
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={addItem} className="btn-ghost btn-xs self-start mt-1">
        + Ajouter un aliment
      </button>
    </div>
  );
}

export default function PreRacePage() {
  const [profile] = useAthleteData<{ poids?: number | string }>("profile", {});
  const [data, setData, loaded] = useAthleteData<PreraceData>("prerace", DEFAULT);
  const [local, setLocal] = useState<PreraceData>(DEFAULT);
  const [selectedDay, setSelectedDay] = useState<DayKey>("J-4");
  const [selectedMeal, setSelectedMeal] = useState<Meal | "tous">("tous");
  const [selectedPossibility, setSelectedPossibility] = useState(0);

  // Édition par repas (jour + repas) ou par possibilité (jour J)
  const [editingMeal, setEditingMeal] = useState<{ day: PreraceDay; meal: Meal } | null>(null);
  const [editBuffer, setEditBuffer] = useState<PreraceFood[]>([]);
  const [editingRace, setEditingRace] = useState<PreraceRacePossibility[] | null>(null);

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
  const weightPlan = PRERACE_PLANS[bucket];

  const persist = (next: PreraceData) => {
    setLocal(next);
    setData(next);
  };

  const updatePoids = (v: string) => persist({ ...local, poids: v });
  const updateGperKg = (k: keyof PreraceData["gPerKg"], v: string) =>
    persist({ ...local, gPerKg: { ...local.gPerKg, [k]: toNum(v) } });
  const updateNotes = (v: string) => persist({ ...local, notes: v });

  // ============== Helpers d'override ==============
  const getEffectiveMealItems = (day: PreraceDay, meal: Meal): PreraceFood[] => {
    const custom = local.customDays?.[day]?.[meal];
    if (custom) return custom;
    return weightPlan?.days[day]?.[meal] || [];
  };

  const isMealCustomized = (day: PreraceDay, meal: Meal): boolean =>
    Boolean(local.customDays?.[day]?.[meal]);

  const saveMealOverride = (day: PreraceDay, meal: Meal, items: PreraceFood[]) => {
    const cleaned = items
      .map((it) => ({ food: it.food.trim(), qty: it.qty.trim(), tip: it.tip.trim() }))
      .filter((it) => it.food);
    const customDays = { ...(local.customDays || {}) };
    customDays[day] = { ...(customDays[day] || {}), [meal]: cleaned };
    persist({ ...local, customDays });
    setEditingMeal(null);
  };

  const resetMealOverride = (day: PreraceDay, meal: Meal) => {
    if (!local.customDays?.[day]?.[meal]) return;
    if (!confirm(`Réinitialiser ${MEAL_LABELS[meal]} de ${day} au plan standard ${bucket} kg ?`)) return;
    const customDays = { ...local.customDays };
    const dayMap = { ...(customDays[day] || {}) };
    delete dayMap[meal];
    if (Object.keys(dayMap).length === 0) delete customDays[day];
    else customDays[day] = dayMap;
    persist({ ...local, customDays });
  };

  const startEditMeal = (day: PreraceDay, meal: Meal) => {
    setEditBuffer(getEffectiveMealItems(day, meal).map((it) => ({ ...it })));
    setEditingMeal({ day, meal });
  };

  const getEffectiveRaceDay = (): PreraceRacePossibility[] =>
    local.customRaceDay || weightPlan?.raceDay || [];
  const isRaceDayCustomized = (): boolean => Boolean(local.customRaceDay);

  const startEditRaceDay = () => {
    const base = getEffectiveRaceDay();
    const seed: PreraceRacePossibility[] =
      base.length > 0
        ? base.map((p) => ({ ...p, items: p.items.map((it) => ({ ...it })) }))
        : [{ label: "Possibilité 1", description: "", items: [{ food: "", qty: "", tip: "" }] }];
    setEditingRace(seed);
  };
  const saveRaceDayOverride = () => {
    if (!editingRace) return;
    const cleaned = editingRace
      .map((p) => ({
        label: p.label.trim() || "Possibilité",
        description: p.description?.trim() || "",
        items: p.items
          .map((it) => ({ food: it.food.trim(), qty: it.qty.trim(), tip: it.tip.trim() }))
          .filter((it) => it.food),
      }))
      .filter((p) => p.items.length > 0);
    persist({ ...local, customRaceDay: cleaned });
    setEditingRace(null);
  };
  const resetRaceDayOverride = () => {
    if (!local.customRaceDay) return;
    if (!confirm(`Réinitialiser le Jour J au plan standard ${bucket} kg ?`)) return;
    const next = { ...local };
    delete next.customRaceDay;
    persist(next);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Avant la course" title="Préparation alimentaire (J-4 → Jour J)" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  const dayDescriptor = DAYS.find((d) => d.k === selectedDay)!;
  const isJJ = selectedDay === "J-J";

  // Build per-day meal map applying overrides
  const buildDayMealsWithOverrides = (day: PreraceDay): Record<Meal, PreraceFood[]> => {
    const out = { petit_dej: [], collation: [], dejeuner: [], malto: [], diner: [] } as Record<Meal, PreraceFood[]>;
    for (const m of MEAL_ORDER) out[m] = getEffectiveMealItems(day, m);
    return out;
  };

  const dayPlan = !isJJ ? buildDayMealsWithOverrides(selectedDay as PreraceDay) : null;
  const availableMeals: Meal[] = dayPlan ? MEAL_ORDER.filter((m) => (dayPlan[m] || []).length > 0) : [];
  const totalItems = availableMeals.reduce((s, m) => s + (dayPlan?.[m]?.length || 0), 0);

  const possibilities = getEffectiveRaceDay();

  const gKey = (selectedDay === "J-J" ? "j1" : selectedDay.replace("J-", "j").toLowerCase()) as keyof PreraceData["gPerKg"];
  const gk = toNum(local.gPerKg[gKey]);
  const cibleCHO = Math.round(gk * poids);

  return (
    <div>
      <div className="screen-only">
        <PageHeader
          kicker="Avant la course"
          title="Préparation alimentaire (J-4 → Jour J)"
          desc="Plan détaillé par jour, organisé par repas. Personnalisable repas par repas pour s'adapter à l'athlète."
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
            Cibles glucidiques : J-4 = {Math.round(toNum(local.gPerKg.j4) * poids)} g
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
                setSelectedPossibility(0);
                setEditingMeal(null);
                setEditingRace(null);
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

          {/* JOUR J : possibilités du race day + édition globale */}
          {isJJ ? (
            <div className="p-4">
              <div className="flex justify-end gap-2 mb-3">
                {isRaceDayCustomized() && (
                  <>
                    <span className="badge" style={{ background: "rgba(255,69,1,0.12)", color: "var(--color-primary)" }}>
                      ✦ Personnalisé
                    </span>
                    <button onClick={resetRaceDayOverride} className="btn-ghost btn-xs">
                      Réinitialiser au plan standard
                    </button>
                  </>
                )}
                {!editingRace && (
                  <button onClick={startEditRaceDay} className="btn-dark btn-sm">
                    ✎ Modifier les possibilités
                  </button>
                )}
              </div>

              {editingRace ? (
                <div className="card p-3" style={{ border: "2px solid var(--color-primary)" }}>
                  <div className="flex flex-col gap-4">
                    {editingRace.map((p, i) => (
                      <div key={i} className="bg-[var(--color-surface-2)] rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 mb-2 items-end">
                          <Field label="Titre">
                            <input
                              className="input"
                              value={p.label}
                              onChange={(e) =>
                                setEditingRace(
                                  editingRace.map((q, idx) => (idx === i ? { ...q, label: e.target.value } : q)),
                                )
                              }
                            />
                          </Field>
                          <Field label="Description (optionnel)">
                            <input
                              className="input"
                              value={p.description || ""}
                              onChange={(e) =>
                                setEditingRace(
                                  editingRace.map((q, idx) => (idx === i ? { ...q, description: e.target.value } : q)),
                                )
                              }
                            />
                          </Field>
                          <button
                            onClick={() => setEditingRace(editingRace.filter((_, idx) => idx !== i))}
                            className="btn-ghost btn-sm"
                            style={{ color: "var(--color-danger)" }}
                          >
                            Supprimer
                          </button>
                        </div>
                        <FoodEditor
                          items={p.items}
                          onChange={(next) =>
                            setEditingRace(editingRace.map((q, idx) => (idx === i ? { ...q, items: next } : q)))
                          }
                        />
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setEditingRace([
                          ...editingRace,
                          {
                            label: `Possibilité ${editingRace.length + 1}`,
                            description: "",
                            items: [{ food: "", qty: "", tip: "" }],
                          },
                        ])
                      }
                      className="btn-ghost btn-sm self-start"
                    >
                      + Ajouter une possibilité
                    </button>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setEditingRace(null)} className="btn-ghost btn-sm">
                      Annuler
                    </button>
                    <button onClick={saveRaceDayOverride} className="btn-primary btn-sm">
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : possibilities.length === 0 ? (
                <Empty>
                  Les possibilités du jour de course pour {bucket} kg ne sont pas encore renseignées.
                </Empty>
              ) : (
                <>
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {possibilities.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPossibility(i)}
                        className={selectedPossibility === i ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {possibilities[selectedPossibility] && (
                    <>
                      {possibilities[selectedPossibility].description && (
                        <div className="text-sm text-[var(--color-text-muted)] mb-3 italic">
                          {possibilities[selectedPossibility].description}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {possibilities[selectedPossibility].items.map((it, i) => (
                          <FoodCard key={i} item={it} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Sélecteur de repas */}
              {availableMeals.length > 0 && (
                <div className="px-4 pt-3 flex gap-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
                  <button
                    onClick={() => setSelectedMeal("tous")}
                    className={selectedMeal === "tous" ? "btn-dark btn-sm" : "btn-ghost btn-sm"}
                  >
                    Tous ({totalItems})
                  </button>
                  {availableMeals.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMeal(m)}
                      className={selectedMeal === m ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                      style={selectedMeal === m ? { background: MEAL_COLORS[m] } : {}}
                    >
                      {MEAL_ICONS[m]} {MEAL_LABELS[m]} ({(dayPlan?.[m] || []).length})
                      {isMealCustomized(selectedDay as PreraceDay, m) && " ✦"}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4">
                {availableMeals.length === 0 ? (
                  <div className="space-y-3">
                    <Empty>
                      Le plan {dayDescriptor.label} pour {bucket} kg n&apos;est pas encore renseigné.
                      Tu peux créer un repas personnalisé pour cet athlète.
                    </Empty>
                    <div className="flex gap-1.5 flex-wrap">
                      {MEAL_ORDER.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setEditBuffer([{ food: "", qty: "", tip: "" }]);
                            setEditingMeal({ day: selectedDay as PreraceDay, meal: m });
                          }}
                          className="btn-ghost btn-sm"
                        >
                          + {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : selectedMeal === "tous" ? (
                  <div className="space-y-4">
                    {availableMeals.map((m) => {
                      const customized = isMealCustomized(selectedDay as PreraceDay, m);
                      return (
                        <div key={m}>
                          <div
                            className="flex items-center gap-2 text-white font-bold text-[11px] uppercase rounded-lg px-3 py-1.5 mb-2"
                            style={{ background: MEAL_COLORS[m], letterSpacing: ".08em" }}
                          >
                            <span>{MEAL_ICONS[m]} {MEAL_LABELS[m]}</span>
                            {customized && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(255,255,255,0.25)" }}
                              >
                                ✦ Personnalisé
                              </span>
                            )}
                            <span style={{ flex: 1 }} />
                            <button
                              onClick={() => startEditMeal(selectedDay as PreraceDay, m)}
                              className="text-[10px] px-2 py-0.5 rounded"
                              style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
                            >
                              ✎ Modifier
                            </button>
                            {customized && (
                              <button
                                onClick={() => resetMealOverride(selectedDay as PreraceDay, m)}
                                className="text-[10px] px-2 py-0.5 rounded"
                                style={{ background: "rgba(255,255,255,0.10)", color: "#fff" }}
                              >
                                ↺ Reset
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(dayPlan?.[m] || []).map((it, i) => (
                              <FoodCard key={i} item={it} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (() => {
                    const m = selectedMeal as Meal;
                    const customized = isMealCustomized(selectedDay as PreraceDay, m);
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          {customized && (
                            <span className="badge" style={{ background: "rgba(255,69,1,0.12)", color: "var(--color-primary)" }}>
                              ✦ Personnalisé
                            </span>
                          )}
                          <span style={{ flex: 1 }} />
                          <button onClick={() => startEditMeal(selectedDay as PreraceDay, m)} className="btn-dark btn-sm">
                            ✎ Modifier
                          </button>
                          {customized && (
                            <button onClick={() => resetMealOverride(selectedDay as PreraceDay, m)} className="btn-ghost btn-sm">
                              Réinitialiser au plan standard
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {(dayPlan?.[m] || []).map((it, i) => (
                            <FoodCard key={i} item={it} />
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Editor inline du repas */}
                {editingMeal && editingMeal.day === selectedDay && (
                  <div className="card mt-4 p-3" style={{ border: "2px solid var(--color-primary)" }}>
                    <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      ✎ Édition — {MEAL_ICONS[editingMeal.meal]} {MEAL_LABELS[editingMeal.meal]} ({editingMeal.day})
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mb-3">
                      Ces modifications ne s&apos;appliquent qu&apos;à cet athlète et écrasent le plan standard {bucket} kg pour ce repas.
                    </div>
                    <FoodEditor items={editBuffer} onChange={setEditBuffer} />
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => setEditingMeal(null)} className="btn-ghost btn-sm">
                        Annuler
                      </button>
                      <button
                        onClick={() => saveMealOverride(editingMeal.day, editingMeal.meal, editBuffer)}
                        className="btn-primary btn-sm"
                      >
                        Enregistrer
                      </button>
                    </div>
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

      {/* PDF version */}
      <PrintReport
        kicker="Avant la course"
        title="Préparation alimentaire (J-4 → Jour J)"
        subtitle={poids ? `${poids} kg · Cibles glucidiques jour par jour` : undefined}
      >
        {(() => {
          const days: PreraceDay[] = ["J-4", "J-3", "J-2", "J-1"];
          const visibleDays = days.filter((d) => {
            const meals = buildDayMealsWithOverrides(d);
            return MEAL_ORDER.some((m) => (meals[m] || []).length > 0);
          });
          return visibleDays.map((day, dayIdx) => {
          const meals = buildDayMealsWithOverrides(day);
          const visible = MEAL_ORDER.filter((m) => (meals[m] || []).length > 0);
          const gkLocal = toNum(local.gPerKg[day.replace("J-", "j").toLowerCase() as keyof PreraceData["gPerKg"]]);
          const total = Math.round(gkLocal * poids);
          return (
            <div
              key={day}
              style={{
                marginTop: dayIdx === 0 ? 12 : 0,
                breakBefore: dayIdx === 0 ? "auto" : "page",
                pageBreakBefore: dayIdx === 0 ? "auto" : "always",
              }}
            >
              <PrintH>{day} — Cible {total} g CHO</PrintH>
              {visible.map((m) => (
                <div key={m} className="no-break" style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
                    {MEAL_LABELS[m]}
                    {isMealCustomized(day, m) && <span style={{ color: "#FF4501", marginLeft: 6 }}>✦ Personnalisé</span>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                    {meals[m].map((it, i) => (
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
          });
        })()}

        {possibilities.length > 0 && (
          <div style={{ breakBefore: "page", pageBreakBefore: "always" }}>
            <PrintH>
              Jour de course — petit déjeuner course
              {isRaceDayCustomized() && <span style={{ color: "#FF4501", marginLeft: 6 }}>✦ Personnalisé</span>}
            </PrintH>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(possibilities.length, 3)}, 1fr)`, gap: 8 }}>
              {possibilities.map((p, idx) => (
                <div key={idx} className="no-break" style={{ border: "1px solid #e6e6e3", borderRadius: 9, padding: "8px 10px" }}>
                  <div style={{ fontWeight: 800, fontSize: 11.5 }}>{p.label}</div>
                  {p.description && <div style={{ fontSize: 9.5, color: "#787876", marginBottom: 4 }}>{p.description}</div>}
                  {p.items.map((it, j) => (
                    <div key={j} style={{ fontSize: 10, marginTop: 3 }}>
                      <b style={{ color: "#FF4501" }}>{it.food}</b> — {it.qty}
                      {it.tip && <div style={{ fontSize: 9, color: "#787876", fontStyle: "italic" }}>{it.tip}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {local.notes && (
          <div style={{ breakBefore: "page", pageBreakBefore: "always" }}>
            <PrintH>Notes & sensations</PrintH>
            <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{local.notes}</div>
          </div>
        )}
      </PrintReport>
    </div>
  );
}
