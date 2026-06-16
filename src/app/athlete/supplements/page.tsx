"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Badge } from "@/components/ui/PageHeader";

type Supplement = {
  id: string;
  cat: "sante" | "perf";
  nom: string;
  active: boolean;
  dateDebut: string;
  periode: string;
  posologie: string;
  frequence: string;
  effetsAttendus: string;
  effetsPercus: string;
  decision: "Maintenir" | "En testing" | "Surveillance" | "Stop";
  commentaires: string;
};

const CATALOGUE = [
  { nom: "Vitamine D", cat: "sante" },
  { nom: "Multivitamines", cat: "sante" },
  { nom: "Oméga 3", cat: "sante" },
  { nom: "Magnésium (bisglycinate)", cat: "sante" },
  { nom: "Glycine", cat: "sante" },
  { nom: "Glutamine", cat: "sante" },
  { nom: "Vitamine C", cat: "sante" },
  { nom: "Fer bisglycinate", cat: "sante" },
  { nom: "Taurine", cat: "sante" },
  { nom: "Mélatonine", cat: "sante" },
  { nom: "Ashwagandha", cat: "sante" },
  { nom: "Rhodiola Rosea", cat: "sante" },
  { nom: "Choline", cat: "sante" },
  { nom: "Bacopa Monnieri", cat: "sante" },
  { nom: "Curcumine", cat: "sante" },
  { nom: "Probiotiques", cat: "sante" },
  { nom: "Collagène", cat: "sante" },
  { nom: "Glucosamine / Chondroïtine", cat: "sante" },
  { nom: "Créatine", cat: "perf" },
  { nom: "Caféine", cat: "perf" },
  { nom: "Bêta-alanine", cat: "perf" },
  { nom: "Citrulline", cat: "perf" },
  { nom: "Nitrates / Jus de betterave", cat: "perf" },
];

const DECISION_VARIANTS: Record<string, "green" | "orange" | "red" | "dark"> = {
  Maintenir: "green",
  "En testing": "orange",
  Surveillance: "dark",
  Stop: "red",
};

const newId = () => Math.random().toString(36).slice(2, 9);
const dateLong = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "";

export default function SupplementsPage() {
  const [suppl, setSuppl, loaded] = useAthleteData<Supplement[]>("suppl", []);
  const [filter, setFilter] = useState<"tous" | "sante" | "perf">("tous");
  const [editing, setEditing] = useState<Supplement | null>(null);

  const filtered = filter === "tous" ? suppl : suppl.filter((s) => s.cat === filter);

  const newSup = (): Supplement => ({
    id: newId(),
    cat: filter === "perf" ? "perf" : "sante",
    nom: "",
    active: false,
    dateDebut: "",
    periode: "",
    posologie: "",
    frequence: "Quotidien",
    effetsAttendus: "",
    effetsPercus: "",
    decision: "En testing",
    commentaires: "",
  });

  function save(s: Supplement) {
    setSuppl((p) => (p.some((x) => x.id === s.id) ? p.map((x) => (x.id === s.id ? s : x)) : [...p, s]));
    setEditing(null);
  }
  function del(id: string) {
    if (confirm("Supprimer ?")) setSuppl((p) => p.filter((s) => s.id !== id));
  }
  function toggle(id: string) {
    setSuppl((p) => p.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }
  function loadFromCatalogue(name: string) {
    if (!name) return;
    const item = CATALOGUE.find((c) => c.nom === name);
    if (item && editing) setEditing({ ...editing, nom: item.nom, cat: item.cat as "sante" | "perf" });
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Structurer ton quotidien" title="Complémentation" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Complémentation"
        action={<button onClick={() => setEditing(newSup())} className="btn-primary">+ Complément</button>}
        desc="Plan annuel de supplémentation : statut, posologie, fréquence, effets attendus/perçus, décision."
      />

      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button onClick={() => setFilter("tous")} className={filter === "tous" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>Tous</button>
        <button onClick={() => setFilter("sante")} className={filter === "sante" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>Santé / Récupération</button>
        <button onClick={() => setFilter("perf")} className={filter === "perf" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>Performance</button>
      </div>

      {editing && (
        <div className="card p-4 mb-4" style={{ border: `2px solid var(--color-primary)` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <Field label="Choisir dans le catalogue">
              <select className="input" value="" onChange={(e) => loadFromCatalogue(e.target.value)}>
                <option value="">— Catalogue Nutriocus —</option>
                <optgroup label="Santé">
                  {CATALOGUE.filter((c) => c.cat === "sante").map((c) => (
                    <option key={c.nom}>{c.nom}</option>
                  ))}
                </optgroup>
                <optgroup label="Performance">
                  {CATALOGUE.filter((c) => c.cat === "perf").map((c) => (
                    <option key={c.nom}>{c.nom}</option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label="Nom"><input className="input" value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></Field>
            <Field label="Catégorie">
              <select className="input" value={editing.cat === "perf" ? "Performance" : "Santé"} onChange={(e) => setEditing({ ...editing, cat: e.target.value === "Performance" ? "perf" : "sante" })}>
                <option>Santé</option><option>Performance</option>
              </select>
            </Field>
            <Field label="Date début"><input type="date" className="input" value={editing.dateDebut} onChange={(e) => setEditing({ ...editing, dateDebut: e.target.value })} /></Field>
            <Field label="Période"><input className="input" value={editing.periode} onChange={(e) => setEditing({ ...editing, periode: e.target.value })} /></Field>
            <Field label="Posologie"><input className="input" value={editing.posologie} onChange={(e) => setEditing({ ...editing, posologie: e.target.value })} /></Field>
            <Field label="Fréquence"><input className="input" value={editing.frequence} onChange={(e) => setEditing({ ...editing, frequence: e.target.value })} /></Field>
            <Field label="Décision">
              <select className="input" value={editing.decision} onChange={(e) => setEditing({ ...editing, decision: e.target.value as Supplement["decision"] })}>
                <option>Maintenir</option><option>En testing</option><option>Surveillance</option><option>Stop</option>
              </select>
            </Field>
          </div>
          <div className="mt-2.5">
            <Field label="Effets attendus"><input className="input" value={editing.effetsAttendus} onChange={(e) => setEditing({ ...editing, effetsAttendus: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <Field label="Effets perçus"><input className="input" value={editing.effetsPercus} onChange={(e) => setEditing({ ...editing, effetsPercus: e.target.value })} /></Field>
            <Field label="Commentaires"><input className="input" value={editing.commentaires} onChange={(e) => setEditing({ ...editing, commentaires: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
            <button onClick={() => save(editing)} className="btn-primary">Enregistrer</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="card px-4 py-3"
            style={{
              borderLeft: `5px solid ${s.active ? (s.cat === "perf" ? "var(--color-primary)" : "var(--color-success)") : "#ccc"}`,
              opacity: s.active ? 1 : 0.62,
            }}
          >
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-extrabold text-base">{s.nom}</span>
                  <Badge variant={s.cat === "perf" ? "orange" : "green"}>
                    {s.cat === "perf" ? "Performance" : "Santé"}
                  </Badge>
                  <Badge variant={DECISION_VARIANTS[s.decision]}>{s.decision}</Badge>
                  {s.posologie && (
                    <span className="text-xs text-[var(--color-primary)] font-bold">{s.posologie}</span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {s.frequence}
                  {s.periode ? ` · ${s.periode}` : ""}
                  {s.dateDebut ? ` · depuis le ${dateLong(s.dateDebut)}` : ""}
                </div>
                {s.effetsAttendus && <div className="text-xs text-[#555] mt-1.5">{s.effetsAttendus}</div>}
                {s.effetsPercus && <div className="text-xs text-[var(--color-success)] mt-1">Perçu : {s.effetsPercus}</div>}
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={s.active} onChange={() => toggle(s.id)} /> Actif
                </label>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditing(s)} className="btn-dark btn-xs">Éditer</button>
                  <button onClick={() => del(s.id)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <Empty>Aucun complément.</Empty>}
      </div>
    </div>
  );
}
