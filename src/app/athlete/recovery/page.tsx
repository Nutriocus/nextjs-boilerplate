"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { PrintButton, PrintReport, PrintH } from "@/components/ui/PrintReport";

// ====================== TYPES ======================
type StepCategory = "glycogene" | "muscles" | "micro" | "";

type RecoveryStep = {
  id: string;
  timing: string;
  title: string;
  details: string;
  objectif: string;
  category: StepCategory;
};

type HydrationPhase = {
  id: string;
  label: string;
  details: string;
};

type Supplement = { id: string; name: string; dose: string };

type SupplementMoment = {
  id: string;
  timing: string;
  items: Supplement[];
};

type RecoveryProtocol = {
  steps: RecoveryStep[];
  hydration: HydrationPhase[];
  supplements: SupplementMoment[];
};

const newId = () => Math.random().toString(36).slice(2, 9);

// ====================== DEFAULTS (from PROTOCOLE RECUPERATION.pdf) ======================
const DEFAULT_PROTOCOL: RecoveryProtocol = {
  steps: [
    {
      id: newId(),
      timing: "+10'",
      title: "Gourde de glucides",
      details: "Mélanger 40 g de maltodextrine dans 400 ml d'eau",
      objectif: "Je refais mes stocks de glycogène",
      category: "glycogene",
    },
    {
      id: newId(),
      timing: "+35'",
      title: "Shaker de protéines",
      details: "Mélanger 35 g d'isolat de whey dans 400 ml d'eau + 15 g de maltodextrine",
      objectif: "Je reconstruis mes muscles",
      category: "muscles",
    },
    {
      id: newId(),
      timing: "+1H",
      title: "Collation",
      details:
        "150 à 200 g cuits de glucides féculents · 150 g de viandes uniquement si le repas est dans + de 2H30 · Fruits ou compote en dessert (kiwi ++)",
      objectif: "Je refais mes stocks de glycogène",
      category: "glycogene",
    },
    {
      id: newId(),
      timing: "+2H",
      title: "Collation 2",
      details: "Mélanger 150 g de compote + 30 g flocons d'avoine + 15 g de miel d'acacia",
      objectif: "Je refais mes stocks de glycogène",
      category: "glycogene",
    },
    {
      id: newId(),
      timing: "+3H",
      title: "Repas du soir",
      details:
        "200 g cuits de glucides féculents · 150 g de viandes ou poissons · Légumes bien cuits uniquement · Dessert à base de fruits mûrs ou compotes (kiwi ++)",
      objectif:
        "Je refais mes stocks de glycogène · Je reconstruis mes muscles · J'apporte des micronutriments essentiels à la récupération",
      category: "micro",
    },
  ],
  hydration: [
    {
      id: newId(),
      label: "Première heure",
      details:
        "Eau plate dans la gourde de maltodextrine et dans le shaker de protéines.",
    },
    {
      id: newId(),
      label: "Puis toutes les heures",
      details:
        "Boire 600 ml d'eau type St Yorre — effet tampon des bicarbonates (HCO3-).",
    },
    {
      id: newId(),
      label: "Dernière heure avant le coucher",
      details: "Réduire à 200 ml l'hydratation pour éviter les réveils nocturnes.",
    },
  ],
  supplements: [
    {
      id: newId(),
      timing: "Dans l'heure après la course",
      items: [
        { id: newId(), name: "Multivitamines", dose: "1 gélule" },
        { id: newId(), name: "Oméga 3", dose: "1 gélule" },
        { id: newId(), name: "Vitamine C", dose: "300 mg" },
        { id: newId(), name: "Vitamine D", dose: "1000 UI" },
        { id: newId(), name: "Glycine / Glutamine", dose: "" },
      ],
    },
    {
      id: newId(),
      timing: "30 minutes avant le coucher",
      items: [
        { id: newId(), name: "Multivitamines", dose: "1 gélule" },
        { id: newId(), name: "Oméga 3", dose: "1 gélule" },
        { id: newId(), name: "Glycine", dose: "5 g" },
        { id: newId(), name: "Magnésium", dose: "1 gélule" },
      ],
    },
    {
      id: newId(),
      timing: "30 minutes avant le repas",
      items: [{ id: newId(), name: "Probiotiques", dose: "1 gélule" }],
    },
  ],
};

const CATEGORY_LABELS: Record<StepCategory, string> = {
  glycogene: "Reconstitution glycogène",
  muscles: "Reconstruction musculaire",
  micro: "Micronutriments récupération",
  "": "",
};

const CATEGORY_COLORS: Record<StepCategory, string> = {
  glycogene: "var(--color-primary)",
  muscles: "#7b1fa2",
  micro: "var(--color-success)",
  "": "var(--color-text-muted)",
};

// Migration: previous shape was Protocol[] (timing + content). Wrap into the new structure.
function migrate(raw: unknown): RecoveryProtocol {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "steps" in (raw as object)) {
    const r = raw as RecoveryProtocol;
    return {
      steps: (r.steps || []).map((s) => ({ ...s, id: s.id || newId() })),
      hydration: (r.hydration || DEFAULT_PROTOCOL.hydration).map((h) => ({ ...h, id: h.id || newId() })),
      supplements: (r.supplements || DEFAULT_PROTOCOL.supplements).map((m) => ({
        ...m,
        id: m.id || newId(),
        items: m.items.map((i) => ({ ...i, id: i.id || newId() })),
      })),
    };
  }
  // Old shape (array) or empty → use defaults
  return DEFAULT_PROTOCOL;
}

// ====================== UI ======================
type TabKey = "timeline" | "hydration" | "supplements";

export default function RecoveryPage() {
  const [stored, setStored, loaded] = useAthleteData<RecoveryProtocol>("recovery_v2", DEFAULT_PROTOCOL);
  const [local, setLocal] = useState<RecoveryProtocol>(DEFAULT_PROTOCOL);
  const [tab, setTab] = useState<TabKey>("timeline");
  const [edit, setEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) setLocal(migrate(stored));
  }, [loaded, stored]);

  const persist = (next: RecoveryProtocol) => {
    setLocal(next);
    setStored(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetDefaults = () => {
    if (!confirm("Réinitialiser au protocole standard NUTRIOCUS ? Tes modifications seront perdues.")) return;
    persist(JSON.parse(JSON.stringify(DEFAULT_PROTOCOL)) as RecoveryProtocol);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Récupération" title="Protocole de récupération" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-only">
        <PageHeader
          kicker="Récupération"
          title="Protocole de récupération"
          desc="Plan complet post-course : nutrition timeline, hydratation, compléments alimentaires."
          action={
            <div className="flex gap-1.5 flex-wrap">
              {saved && <span className="text-[var(--color-success)] text-sm font-semibold self-center">✓ Enregistré</span>}
              <button onClick={() => setEdit((e) => !e)} className={edit ? "btn-dark btn-sm" : "btn-ghost btn-sm"}>
                {edit ? "✓ Terminer" : "✎ Modifier"}
              </button>
              <PrintButton label="Exporter en PDF" />
            </div>
          }
        />

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button onClick={() => setTab("timeline")} className={tab === "timeline" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            🍽 Timeline nutrition ({local.steps.length})
          </button>
          <button onClick={() => setTab("hydration")} className={tab === "hydration" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            💧 Hydratation ({local.hydration.length})
          </button>
          <button onClick={() => setTab("supplements")} className={tab === "supplements" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            💊 Compléments ({local.supplements.length})
          </button>
        </div>

        {tab === "timeline" && (
          <TimelineTab local={local} persist={persist} edit={edit} />
        )}
        {tab === "hydration" && (
          <HydrationTab local={local} persist={persist} edit={edit} />
        )}
        {tab === "supplements" && (
          <SupplementsTab local={local} persist={persist} edit={edit} />
        )}

        {edit && (
          <div className="mt-6 text-right">
            <button onClick={resetDefaults} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
              ↺ Réinitialiser au protocole standard NUTRIOCUS
            </button>
          </div>
        )}
      </div>

      {/* PDF */}
      <PrintReport
        kicker="Récupération"
        title="Protocole de récupération"
        subtitle="Post-course : nutrition · hydratation · compléments"
      >
        <PrintH>Timeline nutrition post-course</PrintH>
        {local.steps.map((s) => (
          <div key={s.id} className="no-break" style={{
            borderLeft: `3px solid ${CATEGORY_COLORS[s.category]}`,
            padding: "8px 12px",
            margin: "6px 0",
            background: "#fafaf8",
            borderRadius: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 800, color: CATEGORY_COLORS[s.category], fontSize: 13 }}>{s.timing}</span>
              <span style={{ fontSize: 10, color: "#787876", fontStyle: "italic" }}>{CATEGORY_LABELS[s.category]}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 12.5, marginTop: 2 }}>{s.title}</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>{s.details}</div>
            {s.objectif && <div style={{ fontSize: 10.5, color: "#787876", marginTop: 3, fontStyle: "italic" }}>Objectif : {s.objectif}</div>}
          </div>
        ))}

        <PrintH>Hydratation</PrintH>
        {local.hydration.map((h) => (
          <div key={h.id} className="no-break" style={{ margin: "6px 0", padding: "6px 12px", borderLeft: "3px solid #0a0a0a", background: "#fafaf8", borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 12 }}>{h.label}</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>{h.details}</div>
          </div>
        ))}

        <PrintH>Compléments alimentaires</PrintH>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {local.supplements.map((m) => (
            <div key={m.id} className="no-break" style={{ border: "1px solid #e6e6e3", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: "#FF4501", marginBottom: 4 }}>{m.timing}</div>
              {m.items.map((it) => (
                <div key={it.id} style={{ fontSize: 11, padding: "2px 0" }}>
                  <b>{it.name}</b>{it.dose ? ` — ${it.dose}` : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </PrintReport>
    </div>
  );
}

// ====================== Tab: Timeline ======================
function TimelineTab({ local, persist, edit }: { local: RecoveryProtocol; persist: (p: RecoveryProtocol) => void; edit: boolean }) {
  const updateStep = (id: string, patch: Partial<RecoveryStep>) =>
    persist({ ...local, steps: local.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeStep = (id: string) =>
    persist({ ...local, steps: local.steps.filter((s) => s.id !== id) });
  const addStep = () =>
    persist({
      ...local,
      steps: [...local.steps, { id: newId(), timing: "+X min", title: "Nouvelle étape", details: "", objectif: "", category: "" }],
    });

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-[3px] bg-[var(--color-primary)] opacity-30 rounded" />
      {local.steps.map((s) => (
        <div key={s.id} className="relative mb-4">
          <div
            className="absolute -left-[18px] top-2 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: CATEGORY_COLORS[s.category], border: "3px solid #fff", boxShadow: "0 0 0 1px var(--color-border)" }}
          />
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 flex justify-between items-center flex-wrap gap-2" style={{ background: CATEGORY_COLORS[s.category], color: "#fff" }}>
              {edit ? (
                <input
                  className="input w-24"
                  style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", fontWeight: 800 }}
                  value={s.timing}
                  onChange={(e) => updateStep(s.id, { timing: e.target.value })}
                />
              ) : (
                <span className="font-extrabold text-base" style={{ fontFamily: "var(--font-display)" }}>{s.timing}</span>
              )}
              {edit ? (
                <select
                  className="input w-auto"
                  style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
                  value={s.category}
                  onChange={(e) => updateStep(s.id, { category: e.target.value as StepCategory })}
                >
                  <option value="">— Catégorie —</option>
                  <option value="glycogene">Glycogène</option>
                  <option value="muscles">Muscles</option>
                  <option value="micro">Micronutriments</option>
                </select>
              ) : (
                s.category && (
                  <span className="text-xs uppercase tracking-wider opacity-90">
                    {CATEGORY_LABELS[s.category]}
                  </span>
                )
              )}
              {edit && (
                <button onClick={() => removeStep(s.id)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>
                  ✕
                </button>
              )}
            </div>
            <div className="p-4">
              {edit ? (
                <div className="flex flex-col gap-2">
                  <Field label="Titre">
                    <input className="input" value={s.title} onChange={(e) => updateStep(s.id, { title: e.target.value })} />
                  </Field>
                  <Field label="Détails / dosage">
                    <textarea className="input" style={{ minHeight: 60 }} value={s.details} onChange={(e) => updateStep(s.id, { details: e.target.value })} />
                  </Field>
                  <Field label="Objectif">
                    <textarea className="input" style={{ minHeight: 50 }} value={s.objectif} onChange={(e) => updateStep(s.id, { objectif: e.target.value })} />
                  </Field>
                </div>
              ) : (
                <>
                  <div className="font-extrabold text-base">{s.title}</div>
                  <div className="text-sm mt-1 leading-relaxed">{s.details}</div>
                  {s.objectif && (
                    <div className="mt-3 text-xs uppercase tracking-wider font-bold" style={{ color: CATEGORY_COLORS[s.category], letterSpacing: ".08em" }}>
                      🎯 {s.objectif}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {edit && (
        <button onClick={addStep} className="btn-ghost btn-sm">
          + Ajouter une étape
        </button>
      )}
    </div>
  );
}

// ====================== Tab: Hydration ======================
function HydrationTab({ local, persist, edit }: { local: RecoveryProtocol; persist: (p: RecoveryProtocol) => void; edit: boolean }) {
  const update = (id: string, patch: Partial<HydrationPhase>) =>
    persist({ ...local, hydration: local.hydration.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
  const remove = (id: string) =>
    persist({ ...local, hydration: local.hydration.filter((h) => h.id !== id) });
  const add = () =>
    persist({ ...local, hydration: [...local.hydration, { id: newId(), label: "Nouvelle phase", details: "" }] });

  return (
    <div className="flex flex-col gap-3">
      {local.hydration.map((h, idx) => (
        <div key={h.id} className="card overflow-hidden" style={{ borderLeft: "5px solid #2196f3" }}>
          <div className="px-4 py-2.5 flex justify-between items-center" style={{ background: "var(--color-dark)", color: "#fff" }}>
            <span className="font-bold flex items-center gap-2 text-sm" style={{ letterSpacing: ".02em" }}>
              <span style={{ background: "#2196f3", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                {idx + 1}
              </span>
              {edit ? (
                <input className="input" style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }} value={h.label} onChange={(e) => update(h.id, { label: e.target.value })} />
              ) : (
                h.label
              )}
            </span>
            {edit && (
              <button onClick={() => remove(h.id)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>
                ✕
              </button>
            )}
          </div>
          <div className="p-4">
            {edit ? (
              <textarea className="input" style={{ minHeight: 70 }} value={h.details} onChange={(e) => update(h.id, { details: e.target.value })} />
            ) : (
              <div className="text-sm leading-relaxed">{h.details}</div>
            )}
          </div>
        </div>
      ))}
      {edit && (
        <button onClick={add} className="btn-ghost btn-sm self-start">+ Ajouter une phase</button>
      )}
    </div>
  );
}

// ====================== Tab: Supplements ======================
function SupplementsTab({ local, persist, edit }: { local: RecoveryProtocol; persist: (p: RecoveryProtocol) => void; edit: boolean }) {
  const updateMoment = (mid: string, patch: Partial<SupplementMoment>) =>
    persist({ ...local, supplements: local.supplements.map((m) => (m.id === mid ? { ...m, ...patch } : m)) });
  const removeMoment = (mid: string) =>
    persist({ ...local, supplements: local.supplements.filter((m) => m.id !== mid) });
  const addMoment = () =>
    persist({
      ...local,
      supplements: [...local.supplements, { id: newId(), timing: "Nouveau moment", items: [{ id: newId(), name: "", dose: "" }] }],
    });
  const updateItem = (mid: string, iid: string, patch: Partial<Supplement>) =>
    persist({
      ...local,
      supplements: local.supplements.map((m) =>
        m.id !== mid ? m : { ...m, items: m.items.map((i) => (i.id === iid ? { ...i, ...patch } : i)) },
      ),
    });
  const removeItem = (mid: string, iid: string) =>
    persist({
      ...local,
      supplements: local.supplements.map((m) =>
        m.id !== mid ? m : { ...m, items: m.items.filter((i) => i.id !== iid) },
      ),
    });
  const addItem = (mid: string) =>
    persist({
      ...local,
      supplements: local.supplements.map((m) =>
        m.id !== mid ? m : { ...m, items: [...m.items, { id: newId(), name: "", dose: "" }] },
      ),
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {local.supplements.map((m) => (
        <div key={m.id} className="card overflow-hidden" style={{ borderTop: "3px solid var(--color-primary)" }}>
          <div className="px-4 py-2.5 flex justify-between items-center" style={{ background: "var(--color-surface-2)" }}>
            {edit ? (
              <input className="input" value={m.timing} onChange={(e) => updateMoment(m.id, { timing: e.target.value })} />
            ) : (
              <span className="font-extrabold text-sm" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>{m.timing}</span>
            )}
            {edit && (
              <button onClick={() => removeMoment(m.id)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
            )}
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {m.items.map((it) => (
              <div key={it.id} className={edit ? "grid grid-cols-[1.4fr_1fr_auto] gap-1.5" : "flex justify-between items-baseline gap-2"}>
                {edit ? (
                  <>
                    <input className="input" placeholder="Nom" value={it.name} onChange={(e) => updateItem(m.id, it.id, { name: e.target.value })} />
                    <input className="input" placeholder="Dose" value={it.dose} onChange={(e) => updateItem(m.id, it.id, { dose: e.target.value })} />
                    <button onClick={() => removeItem(m.id, it.id)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-sm">• {it.name}</span>
                    {it.dose && <span className="text-xs text-[var(--color-text-muted)]">{it.dose}</span>}
                  </>
                )}
              </div>
            ))}
            {edit && (
              <button onClick={() => addItem(m.id)} className="btn-ghost btn-xs mt-1 self-start">+ Complément</button>
            )}
          </div>
        </div>
      ))}
      {edit && (
        <button onClick={addMoment} className="card p-3 text-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition" style={{ border: "2px dashed var(--color-border)", background: "transparent" }}>
          + Ajouter un moment
        </button>
      )}
    </div>
  );
}
