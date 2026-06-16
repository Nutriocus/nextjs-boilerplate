"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";

type Protocol = {
  id: string;
  name: string;
  steps: { timing: string; content: string }[];
};

const DEFAULT: Protocol[] = [
  {
    id: "r1",
    name: "Récupération post sortie longue",
    steps: [
      { timing: "+10 min", content: "Maltodextrine 50 g + 500 ml d'eau" },
      { timing: "+30 à 60 min", content: "Repas complet : glucides + protéines (~0,3 g/kg) + légumes" },
      { timing: "+2 à 3 h", content: "Collation : fromage blanc + flocons + fruit + miel" },
    ],
  },
];

const newId = () => Math.random().toString(36).slice(2, 9);

export default function RecoveryPage() {
  const [protocols, setProtocols, loaded] = useAthleteData<Protocol[]>("recovery", DEFAULT);
  const [editing, setEditing] = useState<Protocol | null>(null);

  const newProto = (): Protocol => ({
    id: newId(),
    name: "Nouveau protocole",
    steps: [{ timing: "", content: "" }],
  });

  function save(p: Protocol) {
    setProtocols((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p],
    );
    setEditing(null);
  }

  function del(id: string) {
    if (confirm("Supprimer ?")) setProtocols((prev) => prev.filter((p) => p.id !== id));
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Nutrition à l'effort" title="Protocole de récupération" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <PageHeader kicker="Nutrition à l'effort" title="Protocole de récupération" />
        <div className="card p-4">
          <Field label="Nom">
            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </Field>
          <div className="mt-4 flex flex-col gap-2">
            {editing.steps.map((s, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-2">
                <input
                  className="input"
                  placeholder="Timing"
                  value={s.timing}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      steps: editing.steps.map((x, idx) => (idx === i ? { ...x, timing: e.target.value } : x)),
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Contenu"
                  value={s.content}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      steps: editing.steps.map((x, idx) => (idx === i ? { ...x, content: e.target.value } : x)),
                    })
                  }
                />
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setEditing({ ...editing, steps: editing.steps.filter((_, idx) => idx !== i) })}
                  style={{ color: "var(--color-danger)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn-ghost btn-sm mt-3"
            onClick={() => setEditing({ ...editing, steps: [...editing.steps, { timing: "", content: "" }] })}
          >
            + Étape
          </button>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setEditing(null)} className="btn-ghost">Annuler</button>
            <button onClick={() => save(editing)} className="btn-primary">Enregistrer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Nutrition à l'effort"
        title="Protocole de récupération"
        action={<button onClick={() => setEditing(newProto())} className="btn-primary">+ Nouveau</button>}
      />
      <div className="flex flex-col gap-4">
        {protocols.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="font-extrabold uppercase text-lg" style={{ fontFamily: "var(--font-display)" }}>
                {p.name}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(p)} className="btn-dark btn-sm">Éditer</button>
                <button onClick={() => del(p.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
                  ✕
                </button>
              </div>
            </div>
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-success)] opacity-30" />
              {p.steps.map((s, i) => (
                <div key={i} className="relative mb-3">
                  <div
                    className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-[var(--color-success)]"
                    style={{ border: "2px solid #fff" }}
                  />
                  <div className="text-[var(--color-primary)] font-bold text-sm">{s.timing}</div>
                  <div className="text-sm">{s.content}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {protocols.length === 0 && <Empty>Aucun protocole.</Empty>}
      </div>
    </div>
  );
}
