"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";

type MealItem = { name: string; qty: string; tip: string };
type MealSection = { title: string; items: MealItem[] };
type MealPlan = {
  id: string;
  type: "repos" | "courte" | "longue" | "perso";
  name: string;
  kcal: number | string;
  prot: number | string;
  lip: number | string;
  gluc: number | string;
  supplements: string[];
  sections: MealSection[];
};

const newId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_PLANS: MealPlan[] = [
  {
    id: "p_repos",
    type: "repos",
    name: "Plan Repos",
    kcal: 2638,
    prot: "111-136",
    lip: "74-93",
    gluc: "314-381",
    supplements: ["Créatine — 5 g/j", "Oméga 3 — 3 g/j", "Bisglycinate de Magnésium — 300 mg/j"],
    sections: [
      {
        title: "Petit déjeuner",
        items: [
          { name: "Oeufs", qty: "3 unités", tip: "Bio" },
          { name: "Pain de mie", qty: "2 tranches", tip: "Complet" },
          { name: "Flocon d'avoine", qty: "70 g", tip: "" },
          { name: "Oléagineux", qty: "20 g", tip: "Amandes / noix" },
        ],
      },
      {
        title: "Déjeuner",
        items: [
          { name: "Viandes / poisson / oeufs", qty: "125 g", tip: "Viandes maigres" },
          { name: "Féculents", qty: "100 g crus", tip: "Riz, pâtes" },
          { name: "Légumes", qty: "200 g", tip: "De saison" },
          { name: "Fruit", qty: "1 unité", tip: "" },
        ],
      },
      {
        title: "Collation",
        items: [
          { name: "Flocon d'avoine", qty: "50 g", tip: "" },
          { name: "Fromage blanc", qty: "150 g", tip: "3% MG" },
          { name: "Fruit", qty: "1 unité", tip: "" },
        ],
      },
      {
        title: "Dîner",
        items: [
          { name: "Viandes / poisson / oeufs", qty: "125 g", tip: "" },
          { name: "Féculents", qty: "100 g crus", tip: "" },
          { name: "Légumes", qty: "200 g", tip: "" },
        ],
      },
    ],
  },
  {
    id: "p_courte",
    type: "courte",
    name: "Plan Sortie < 2H",
    kcal: 3390,
    prot: "111-136",
    lip: "74-93",
    gluc: "502-569",
    supplements: ["Créatine — 5 g/j", "Oméga 3 — 3 g/j"],
    sections: [
      {
        title: "Pendant la sortie",
        items: [
          { name: "Glucides", qty: "60 g sur la sortie", tip: "Boisson" },
          { name: "Hydratation", qty: "700 ml mini", tip: "" },
        ],
      },
      {
        title: "Repas (post sortie courte)",
        items: [
          { name: "Féculents", qty: "150 g crus", tip: "" },
          { name: "Protéines", qty: "125 g", tip: "" },
        ],
      },
    ],
  },
  {
    id: "p_longue",
    type: "longue",
    name: "Plan Sortie > 2H30",
    kcal: 4580,
    prot: "111-136",
    lip: "74-93",
    gluc: "798-834",
    supplements: ["Créatine — 5 g/j", "Maltodextrine post-effort"],
    sections: [
      {
        title: "Pendant la sortie longue",
        items: [
          { name: "Glucides", qty: "100 g par heure", tip: "Boisson + gels + barres" },
          { name: "Hydratation", qty: "700 ml mini par heure", tip: "" },
        ],
      },
      {
        title: "Post sortie longue",
        items: [
          { name: "Maltodextrine", qty: "50 g", tip: "10 min après" },
          { name: "Hydratation", qty: "500 ml", tip: "" },
        ],
      },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  repos: "var(--color-success)",
  courte: "var(--color-primary)",
  longue: "var(--color-dark)",
  perso: "#787876",
};

function PlanCard({
  plan,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  plan: MealPlan;
  onEdit: (p: MealPlan) => void;
  onDuplicate: (p: MealPlan) => void;
  onDelete: (p: MealPlan) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div
        className="px-4 py-3 flex justify-between items-center text-white"
        style={{ background: TYPE_COLORS[plan.type] || "var(--color-dark)" }}
      >
        <div className="font-extrabold uppercase text-base" style={{ fontFamily: "var(--font-display)" }}>
          {plan.name}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onEdit(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Éditer</button>
          <button onClick={() => onDuplicate(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Dupliquer</button>
          <button onClick={() => onDelete(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>✕</button>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1">
        {plan.sections.map((s, i) => (
          <div key={i} className="mt-3">
            <div
              className="text-white font-bold text-[11px] uppercase rounded-lg px-3 py-1.5"
              style={{ background: i % 2 ? "var(--color-primary)" : "var(--color-dark)", letterSpacing: ".08em" }}
            >
              {s.title}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {s.items.map((it, j) => (
                <div
                  key={j}
                  className="rounded-lg px-3 py-2 bg-[var(--color-surface-2)]"
                  style={{ border: "1px dashed var(--color-border)" }}
                >
                  <div className="text-[var(--color-primary)] font-bold text-sm">{it.name}</div>
                  <div className="text-sm mt-0.5">{it.qty}</div>
                  {it.tip && <div className="text-[var(--color-text-muted)] text-xs italic mt-0.5">{it.tip}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {(plan.kcal || plan.gluc) && (
          <div className="mt-4 rounded-lg px-4 py-3 text-white flex gap-5 flex-wrap justify-center text-sm" style={{ background: "var(--color-dark)" }}>
            {plan.kcal && (
              <span><b className="text-[var(--color-accent)]">{plan.kcal}</b> kcal</span>
            )}
            {plan.prot && (
              <span>Prot. <b>{plan.prot}</b> g</span>
            )}
            {plan.lip && (
              <span>Lip. <b>{plan.lip}</b> g</span>
            )}
            {plan.gluc && (
              <span>Gluc. <b className="text-[var(--color-accent)]">{plan.gluc}</b> g</span>
            )}
          </div>
        )}

        {plan.supplements && plan.supplements.length > 0 && (
          <div className="mt-3 text-xs space-y-0.5">
            {plan.supplements.map((s, i) => (
              <div key={i}>• {s}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanEditor({ plan, onSave, onCancel }: { plan: MealPlan; onSave: (p: MealPlan) => void; onCancel: () => void }) {
  const [local, setLocal] = useState<MealPlan>(plan);

  const updateItem = (sIdx: number, iIdx: number, field: keyof MealItem, value: string) => {
    setLocal((p) => ({
      ...p,
      sections: p.sections.map((s, i) =>
        i !== sIdx ? s : { ...s, items: s.items.map((it, j) => (j !== iIdx ? it : { ...it, [field]: value })) },
      ),
    }));
  };
  const addItem = (sIdx: number) => {
    setLocal((p) => ({
      ...p,
      sections: p.sections.map((s, i) => (i !== sIdx ? s : { ...s, items: [...s.items, { name: "", qty: "", tip: "" }] })),
    }));
  };
  const removeItem = (sIdx: number, iIdx: number) => {
    setLocal((p) => ({
      ...p,
      sections: p.sections.map((s, i) => (i !== sIdx ? s : { ...s, items: s.items.filter((_, j) => j !== iIdx) })),
    }));
  };
  const updateSectionTitle = (sIdx: number, title: string) => {
    setLocal((p) => ({ ...p, sections: p.sections.map((s, i) => (i !== sIdx ? s : { ...s, title })) }));
  };
  const removeSection = (sIdx: number) => {
    setLocal((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== sIdx) }));
  };
  const addSection = () => {
    setLocal((p) => ({
      ...p,
      sections: [...p.sections, { title: "Nouvelle section", items: [{ name: "", qty: "", tip: "" }] }],
    }));
  };

  return (
    <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-primary)" }}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
        <Field label="Nom"><input className="input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} /></Field>
        <Field label="Kcal"><input className="input" value={local.kcal} onChange={(e) => setLocal({ ...local, kcal: e.target.value })} /></Field>
        <Field label="Prot."><input className="input" value={local.prot} onChange={(e) => setLocal({ ...local, prot: e.target.value })} /></Field>
        <Field label="Lip."><input className="input" value={local.lip} onChange={(e) => setLocal({ ...local, lip: e.target.value })} /></Field>
        <Field label="Gluc."><input className="input" value={local.gluc} onChange={(e) => setLocal({ ...local, gluc: e.target.value })} /></Field>
      </div>

      {local.sections.map((sec, sIdx) => (
        <div key={sIdx} className="bg-[var(--color-surface-2)] rounded-lg p-3 mb-2.5">
          <div className="flex gap-2 mb-2">
            <input className="input font-bold" value={sec.title} onChange={(e) => updateSectionTitle(sIdx, e.target.value)} />
            <button onClick={() => removeSection(sIdx)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>Suppr.</button>
          </div>
          {sec.items.map((it, iIdx) => (
            <div key={iIdx} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1.4fr_auto] gap-1.5 mb-1.5">
              <input className="input" placeholder="Aliment" value={it.name} onChange={(e) => updateItem(sIdx, iIdx, "name", e.target.value)} />
              <input className="input" placeholder="Quantité" value={it.qty} onChange={(e) => updateItem(sIdx, iIdx, "qty", e.target.value)} />
              <input className="input" placeholder="Conseil" value={it.tip} onChange={(e) => updateItem(sIdx, iIdx, "tip", e.target.value)} />
              <button onClick={() => removeItem(sIdx, iIdx)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>✕</button>
            </div>
          ))}
          <button onClick={() => addItem(sIdx)} className="btn-ghost btn-xs">+ Aliment</button>
        </div>
      ))}

      <div className="flex justify-between items-center mt-3">
        <button onClick={addSection} className="btn-ghost btn-sm">+ Section</button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost">Annuler</button>
          <button onClick={() => onSave(local)} className="btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

export default function MealPlansPage() {
  const [plans, setPlans, loaded] = useAthleteData<MealPlan[]>("meal", DEFAULT_PLANS);
  const [editing, setEditing] = useState<MealPlan | null>(null);

  const save = (p: MealPlan) => {
    setPlans((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]));
    setEditing(null);
  };

  const duplicate = (p: MealPlan) => {
    setPlans((prev) => [...prev, { ...JSON.parse(JSON.stringify(p)), id: newId(), name: p.name + " (copie)", type: "perso" }]);
  };

  const del = (p: MealPlan) => {
    if (confirm("Supprimer " + p.name + " ?")) setPlans((prev) => prev.filter((x) => x.id !== p.id));
  };

  const create = () => {
    setEditing({
      id: newId(),
      name: "Nouveau plan",
      type: "perso",
      kcal: "",
      prot: "",
      lip: "",
      gluc: "",
      supplements: [],
      sections: [{ title: "Petit déjeuner", items: [{ name: "", qty: "", tip: "" }] }],
    });
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Structurer ton quotidien" title="Plans alimentaires" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Plans alimentaires"
        action={<button onClick={create} className="btn-primary">+ Nouveau plan</button>}
        desc="Tes plans par typologie de journée (repos, sortie courte, sortie longue, perso)."
      />

      {editing && <PlanEditor plan={editing} onSave={save} onCancel={() => setEditing(null)} />}

      <div className="flex flex-col gap-4">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} onEdit={setEditing} onDuplicate={duplicate} onDelete={del} />
        ))}
        {plans.length === 0 && <Empty>Aucun plan.</Empty>}
      </div>
    </div>
  );
}
