"use client";

import { useState, useMemo } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Kpi } from "@/components/ui/PageHeader";
import { PrintReport } from "@/components/ui/PrintReport";

type MealItem = { name: string; qty: string; tip: string };
type MealSection = { title: string; items: MealItem[] };
type Objectif = "maintien" | "deficit" | "surplus" | "perso";
type Status = "actif" | "archive";

type MealPlan = {
  id: string;
  type: "repos" | "courte" | "longue" | "perso";
  name: string;
  status: Status;
  dateDebut: string;
  dateFin: string;
  objectif: Objectif;
  maintenanceKcal: number | string;
  kcal: number | string;
  prot: number | string;
  lip: number | string;
  gluc: number | string;
  supplements: string[];
  sections: MealSection[];
};

const newId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_PLAN_BASE: Pick<MealPlan, "status" | "dateDebut" | "dateFin" | "objectif" | "maintenanceKcal"> = {
  status: "actif",
  dateDebut: "",
  dateFin: "",
  objectif: "maintien",
  maintenanceKcal: "",
};

const DEFAULT_PLANS: MealPlan[] = [
  {
    id: "p_repos",
    type: "repos",
    name: "Plan Repos",
    ...DEFAULT_PLAN_BASE,
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
    ...DEFAULT_PLAN_BASE,
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
    ...DEFAULT_PLAN_BASE,
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

const TYPE_LABELS: Record<string, string> = {
  repos: "Repos",
  courte: "Sortie courte",
  longue: "Sortie longue",
  perso: "Perso",
};

const OBJECTIF_LABELS: Record<Objectif, string> = {
  maintien: "Maintien",
  deficit: "Déficit",
  surplus: "Surplus",
  perso: "Personnalisé",
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function computeDelta(plan: MealPlan): number | null {
  const m = toNum(plan.maintenanceKcal);
  const k = toNum(plan.kcal);
  if (!m || !k) return null;
  return k - m;
}

function fmtDate(s: string) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
}

function PlanCard({
  plan,
  onEdit,
  onDuplicate,
  onDelete,
  onPrint,
  onArchive,
  onActivate,
}: {
  plan: MealPlan;
  onEdit: (p: MealPlan) => void;
  onDuplicate: (p: MealPlan) => void;
  onDelete: (p: MealPlan) => void;
  onPrint: (p: MealPlan) => void;
  onArchive: (p: MealPlan) => void;
  onActivate: (p: MealPlan) => void;
}) {
  const delta = computeDelta(plan);
  const isArchive = plan.status === "archive";

  return (
    <div className="card overflow-hidden" style={{ opacity: isArchive ? 0.78 : 1 }}>
      <div
        className="px-4 py-3 flex justify-between items-center text-white flex-wrap gap-2"
        style={{ background: TYPE_COLORS[plan.type] || "var(--color-dark)" }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-extrabold uppercase text-base" style={{ fontFamily: "var(--font-display)" }}>
            {plan.name}
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.18)", letterSpacing: ".1em" }}
          >
            {TYPE_LABELS[plan.type]}
          </span>
          {isArchive && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: "rgba(0,0,0,0.35)", letterSpacing: ".1em" }}
            >
              📦 Archivé
            </span>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => onPrint(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>PDF</button>
          <button onClick={() => onEdit(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Éditer</button>
          <button onClick={() => onDuplicate(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Dupliquer</button>
          {isArchive ? (
            <button onClick={() => onActivate(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Réactiver</button>
          ) : (
            <button onClick={() => onArchive(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>Archiver</button>
          )}
          <button onClick={() => onDelete(plan)} className="btn-ghost btn-xs" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>✕</button>
        </div>
      </div>

      {/* Méta-données du plan */}
      {(plan.dateDebut || plan.dateFin || plan.objectif !== "maintien" || delta != null) && (
        <div
          className="px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs items-center"
          style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}
        >
          {(plan.dateDebut || plan.dateFin) && (
            <span className="text-[var(--color-text-muted)]">
              <b className="text-[var(--color-text)]">Période :</b> {fmtDate(plan.dateDebut) || "—"} → {fmtDate(plan.dateFin) || "en cours"}
            </span>
          )}
          {plan.objectif && (
            <span className="text-[var(--color-text-muted)]">
              <b className="text-[var(--color-text)]">Objectif :</b> {OBJECTIF_LABELS[plan.objectif]}
            </span>
          )}
          {toNum(plan.maintenanceKcal) > 0 && (
            <span className="text-[var(--color-text-muted)]">
              <b className="text-[var(--color-text)]">Maintenance :</b> {Math.round(toNum(plan.maintenanceKcal))} kcal
            </span>
          )}
          {delta != null && (
            <span
              className="font-bold px-2 py-0.5 rounded"
              style={{
                background: delta < 0 ? "rgba(207,46,46,0.12)" : delta > 0 ? "rgba(95,140,10,0.14)" : "var(--color-surface)",
                color: delta < 0 ? "var(--color-danger)" : delta > 0 ? "var(--color-success)" : "var(--color-text-muted)",
              }}
            >
              {delta > 0 ? "+" : ""}{Math.round(delta)} kcal / jour
            </span>
          )}
        </div>
      )}

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
  const delta = computeDelta(local);

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
      <div className="font-extrabold uppercase mb-3" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
        Édition du plan
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        <Field label="Nom"><input className="input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} /></Field>
        <Field label="Typologie">
          <select className="input" value={local.type} onChange={(e) => setLocal({ ...local, type: e.target.value as MealPlan["type"] })}>
            <option value="repos">Repos</option>
            <option value="courte">Sortie courte</option>
            <option value="longue">Sortie longue</option>
            <option value="perso">Perso</option>
          </select>
        </Field>
        <Field label="Date de début"><input type="date" className="input" value={local.dateDebut} onChange={(e) => setLocal({ ...local, dateDebut: e.target.value })} /></Field>
        <Field label="Date de fin"><input type="date" className="input" value={local.dateFin} onChange={(e) => setLocal({ ...local, dateFin: e.target.value })} /></Field>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        <Field label="Objectif">
          <select className="input" value={local.objectif} onChange={(e) => setLocal({ ...local, objectif: e.target.value as Objectif })}>
            <option value="maintien">Maintien</option>
            <option value="deficit">Déficit</option>
            <option value="surplus">Surplus</option>
            <option value="perso">Personnalisé</option>
          </select>
        </Field>
        <Field label="Maintenance (kcal)"><input className="input" value={local.maintenanceKcal} placeholder="ex. 3100" onChange={(e) => setLocal({ ...local, maintenanceKcal: e.target.value })} /></Field>
        <Field label="Statut">
          <select className="input" value={local.status} onChange={(e) => setLocal({ ...local, status: e.target.value as Status })}>
            <option value="actif">Actif</option>
            <option value="archive">Archivé</option>
          </select>
        </Field>
        <div className="flex flex-col justify-end">
          {delta != null && (
            <div
              className="rounded-lg px-3 py-2 text-center font-extrabold"
              style={{
                background: delta < 0 ? "rgba(207,46,46,0.10)" : delta > 0 ? "rgba(95,140,10,0.12)" : "var(--color-surface-2)",
                color: delta < 0 ? "var(--color-danger)" : delta > 0 ? "var(--color-success)" : "var(--color-text-muted)",
                fontFamily: "var(--font-display)",
              }}
            >
              {delta > 0 ? "+" : ""}{Math.round(delta)} kcal/j
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        <Field label="Kcal du plan"><input className="input" value={local.kcal} onChange={(e) => setLocal({ ...local, kcal: e.target.value })} /></Field>
        <Field label="Prot. (g)"><input className="input" value={local.prot} onChange={(e) => setLocal({ ...local, prot: e.target.value })} /></Field>
        <Field label="Lip. (g)"><input className="input" value={local.lip} onChange={(e) => setLocal({ ...local, lip: e.target.value })} /></Field>
        <Field label="Gluc. (g)"><input className="input" value={local.gluc} onChange={(e) => setLocal({ ...local, gluc: e.target.value })} /></Field>
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

      <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
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
  const [plansRaw, setPlans, loaded] = useAthleteData<MealPlan[]>("meal", DEFAULT_PLANS);
  const [editing, setEditing] = useState<MealPlan | null>(null);
  const [printPlan, setPrintPlan] = useState<MealPlan | null>(null);
  const [filter, setFilter] = useState<"actifs" | "archives" | "tous">("actifs");

  // Migration: backfill missing fields on legacy data
  const plans = useMemo<MealPlan[]>(
    () =>
      plansRaw.map((p) => ({
        ...DEFAULT_PLAN_BASE,
        ...p,
        status: p.status || "actif",
        objectif: p.objectif || "maintien",
      })),
    [plansRaw],
  );

  const actifs = plans.filter((p) => p.status !== "archive");
  const archives = plans.filter((p) => p.status === "archive");

  const visible = filter === "actifs" ? actifs : filter === "archives" ? archives : plans;

  // KPIs sur les plans actifs
  const deficits = actifs.map(computeDelta).filter((d): d is number => d != null);
  const avgDelta = deficits.length ? Math.round(deficits.reduce((a, b) => a + b, 0) / deficits.length) : null;
  const planEnDeficit = actifs.filter((p) => {
    const d = computeDelta(p);
    return d != null && d < 0;
  }).length;

  const save = (p: MealPlan) => {
    setPlans((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]));
    setEditing(null);
  };

  const duplicate = (p: MealPlan) => {
    setPlans((prev) => [
      ...prev,
      { ...JSON.parse(JSON.stringify(p)), id: newId(), name: p.name + " (copie)", type: "perso", status: "actif", dateDebut: "", dateFin: "" },
    ]);
  };

  const del = (p: MealPlan) => {
    if (confirm("Supprimer " + p.name + " ?")) setPlans((prev) => prev.filter((x) => x.id !== p.id));
  };

  const archive = (p: MealPlan) => {
    const today = new Date().toISOString().slice(0, 10);
    setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "archive", dateFin: x.dateFin || today } : x)));
  };

  const activate = (p: MealPlan) => {
    setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "actif" } : x)));
  };

  const print = (p: MealPlan) => {
    setPrintPlan(p);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintPlan(null), 1500);
    }, 200);
  };

  const create = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({
      id: newId(),
      name: "Nouveau plan",
      type: "perso",
      status: "actif",
      dateDebut: today,
      dateFin: "",
      objectif: "maintien",
      maintenanceKcal: "",
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
      <div className="screen-only">
        <PageHeader
          kicker="Structurer ton quotidien"
          title="Plans alimentaires"
          action={<button onClick={create} className="btn-primary">+ Nouveau plan</button>}
          desc="Tes plans actifs avec leur période et leur écart calorique vs. maintenance. Les plans terminés sont archivés pour historique."
        />

        {/* KPI synthèse */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Kpi label="Plans actifs" value={actifs.length} color="var(--color-primary)" />
          <Kpi label="En déficit" value={planEnDeficit} note={planEnDeficit > 0 ? "vs maintenance" : ""} color="var(--color-danger)" />
          <Kpi
            label="Écart moyen / jour"
            value={avgDelta == null ? "—" : `${avgDelta > 0 ? "+" : ""}${avgDelta}`}
            unit={avgDelta == null ? "" : "kcal"}
            color={avgDelta == null ? "#8a8a88" : avgDelta < 0 ? "var(--color-danger)" : avgDelta > 0 ? "var(--color-success)" : "var(--color-dark)"}
          />
          <Kpi label="Archives" value={archives.length} note="historique" color="var(--color-dark)" />
        </div>

        {/* Filtres */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("actifs")}
            className={filter === "actifs" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            ✴ Plans actifs ({actifs.length})
          </button>
          <button
            onClick={() => setFilter("archives")}
            className={filter === "archives" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            📦 Archives ({archives.length})
          </button>
          <button
            onClick={() => setFilter("tous")}
            className={filter === "tous" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            Tous ({plans.length})
          </button>
        </div>

        {editing && <PlanEditor plan={editing} onSave={save} onCancel={() => setEditing(null)} />}

        <div className="flex flex-col gap-4">
          {visible.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onEdit={setEditing}
              onDuplicate={duplicate}
              onDelete={del}
              onPrint={print}
              onArchive={archive}
              onActivate={activate}
            />
          ))}
          {visible.length === 0 && (
            <Empty>
              {filter === "actifs"
                ? "Aucun plan actif. Crée-en un nouveau ou réactive une archive."
                : filter === "archives"
                  ? "Aucun plan archivé pour le moment."
                  : "Aucun plan."}
            </Empty>
          )}
        </div>
      </div>

      {printPlan && (
        <PrintReport
          kicker="Structurer ton quotidien"
          title="Plan alimentaire"
          subtitle={printPlan.name}
        >
          {(printPlan.dateDebut || printPlan.dateFin || toNum(printPlan.maintenanceKcal) > 0) && (
            <div className="no-break" style={{ marginTop: 6, fontSize: 11, color: "#787876" }}>
              {(printPlan.dateDebut || printPlan.dateFin) && (
                <span>Période : {fmtDate(printPlan.dateDebut) || "—"} → {fmtDate(printPlan.dateFin) || "en cours"}{"   "}</span>
              )}
              {printPlan.objectif && <span>· Objectif : {OBJECTIF_LABELS[printPlan.objectif]}{"   "}</span>}
              {toNum(printPlan.maintenanceKcal) > 0 && <span>· Maintenance : {Math.round(toNum(printPlan.maintenanceKcal))} kcal</span>}
              {computeDelta(printPlan) != null && (
                <span>
                  {" · "}
                  <b style={{ color: (computeDelta(printPlan) ?? 0) < 0 ? "#cf2e2e" : "#5f8c0a" }}>
                    {(computeDelta(printPlan) ?? 0) > 0 ? "+" : ""}{Math.round(computeDelta(printPlan) ?? 0)} kcal/j
                  </b>
                </span>
              )}
            </div>
          )}

          {printPlan.sections.map((s, i) => (
            <div key={i} className="no-break" style={{ marginTop: i ? 14 : 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <span style={{ width: 6, height: 16, background: "#FF4501", borderRadius: 3 }} />
                <span style={{ fontWeight: 800, fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {s.title}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {s.items.map((it, j) => (
                  <div
                    key={j}
                    style={{ border: "1px solid #e6e6e3", borderRadius: 9, padding: "7px 11px" }}
                  >
                    <div style={{ fontWeight: 800, color: "#FF4501", fontSize: 12.5 }}>{it.name}</div>
                    <div style={{ fontSize: 12 }}>{it.qty}</div>
                    {it.tip && (
                      <div style={{ fontSize: 10.5, color: "#787876", fontStyle: "italic" }}>{it.tip}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {(printPlan.kcal || printPlan.gluc) && (
            <div
              className="no-break"
              style={{
                marginTop: 16,
                background: "#0a0a0a",
                borderRadius: 12,
                padding: "13px 18px",
                display: "flex",
                gap: 24,
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              {printPlan.kcal && (
                <span>
                  <b style={{ color: "#d0ff2c", fontSize: 16 }}>{printPlan.kcal}</b> kcal
                </span>
              )}
              {printPlan.prot && (
                <span>
                  Prot. <b>{printPlan.prot}</b> g
                </span>
              )}
              {printPlan.lip && (
                <span>
                  Lip. <b>{printPlan.lip}</b> g
                </span>
              )}
              {printPlan.gluc && (
                <span>
                  Gluc. <b style={{ color: "#d0ff2c", fontSize: 16 }}>{printPlan.gluc}</b> g
                </span>
              )}
            </div>
          )}

          {printPlan.supplements && printPlan.supplements.length > 0 && (
            <div className="no-break" style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <span style={{ width: 6, height: 16, background: "#FF4501", borderRadius: 3 }} />
                <span style={{ fontWeight: 800, fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Compléments
                </span>
              </div>
              {printPlan.supplements.map((sup, i) => (
                <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>
                  • {sup}
                </div>
              ))}
            </div>
          )}
        </PrintReport>
      )}
    </div>
  );
}
