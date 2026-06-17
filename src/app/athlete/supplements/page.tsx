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

type CatalogueEntry = {
  nom: string;
  cat: "sante" | "perf";
  posologie?: string;
  frequence?: string;
  effets: string;
};

const CATALOGUE: CatalogueEntry[] = [
  // ============ SANTÉ / RÉCUPÉRATION / QUOTIDIEN ============
  {
    nom: "Vitamine D",
    cat: "sante",
    posologie: "3000 UI",
    frequence: "Le matin",
    effets:
      "Amélioration du système immunitaire, réduction de l'inflammation et amélioration de la récupération. Aide à renforcer les os et à prévenir les fractures. Réduction du risque de blessures musculaires. Améliore la force musculaire, l'endurance, l'équilibre et la coordination. Régulation du métabolisme, de la fonction cardiaque, de la santé cognitive et émotionnelle et de la régulation hormonale.",
  },
  {
    nom: "Oméga 3",
    cat: "sante",
    posologie: "3 gélules",
    frequence: "Le matin",
    effets:
      "Amélioration de la récupération avec des rôles anti-inflammatoires et antioxydants. Amélioration de la force musculaire, de la performance anaérobie et de la capacité d'endurance. Soutien de la santé cardiovasculaire. Soutien de la fonction cognitive.",
  },
  {
    nom: "Multivitamines",
    cat: "sante",
    posologie: "2 gélules",
    frequence: "Le matin",
    effets:
      "Optimisation de la récupération grâce aux propriétés antioxydantes. Comblement des déficits et des carences ainsi que des besoins accrus du sportif d'endurance. Soutien du système immunitaire. Optimisation de la performance physique et mentale.",
  },
  {
    nom: "Glycine",
    cat: "sante",
    effets:
      "Participe à la synthèse des protéines. Favorise la relaxation, réduit l'anxiété et le stress et améliore la qualité du sommeil. Participe à la synthèse du collagène et favorise une bonne santé tendino-articulaire. Participe à la synthèse du glutathion (antioxydant puissant aidant à la détoxification). Participe à la régulation des réponses inflammatoires et immunitaires. Participe à la régulation du métabolisme.",
  },
  {
    nom: "Magnésium (bisglycinate)",
    cat: "sante",
    effets:
      "Rôle clé dans la contraction musculaire et la relaxation. Améliore la récupération du sportif en réduisant les niveaux d'inflammation. Rôle essentiel dans l'élimination du lactate. Permet d'optimiser les taux de testostérone biologiquement actifs. Maintien de l'équilibre électrolytique. Réduit les troubles de l'humeur et améliore la qualité du sommeil. Maintien d'une bonne densité minérale osseuse et réduction du risque de blessures liées aux os.",
  },
  {
    nom: "Glutamine",
    cat: "sante",
    effets:
      "Favorise une santé intestinale optimale chez le sportif. Maintien de l'intégrité de la muqueuse intestinale. Renforce la fonction immunitaire et prévient les infections intestinales. Améliore l'assimilation des nutriments. Prévention contre les troubles digestifs.",
  },
  {
    nom: "Vitamine C",
    cat: "sante",
    effets:
      "Lutte contre le stress oxydatif par son rôle d'antioxydant. Soutien du système immunitaire et réduit le risque d'infection. Participe à la synthèse du collagène. Améliore l'absorption du fer non héminique (fer végétal). Améliore la fonction pulmonaire. Améliore la durée et la qualité du sommeil.",
  },
  {
    nom: "Fer bisglycinate",
    cat: "sante",
    posologie: "14 mg / jour",
    frequence: "Le matin",
    effets:
      "Réduction de la fatigue chez le sportif. Augmentation des niveaux de fer sérique, de ferritine en cas de carences. Augmentation des niveaux d'hémoglobine en cas d'anémie.",
  },
  {
    nom: "Taurine",
    cat: "sante",
    effets:
      "Permet de soulager la fatigue visuelle avec un effet protecteur sur la fonction rétinienne. Améliore les performances cognitives, l'agilité et l'équilibre. Augmente l'oxydation lipidique d'un exercice à jeun. Retarde les douleurs musculaires. Améliore les performances aérobies. Améliore le développement du système nerveux central et la formation de la mémoire. Possède un rôle d'antioxydant.",
  },
  {
    nom: "Mélatonine",
    cat: "sante",
    effets:
      "Permet de traiter les troubles du sommeil (insomnies, troubles du rythme circadien). Permet d'aider à compenser un décalage horaire.",
  },
  {
    nom: "Ashwagandha",
    cat: "sante",
    effets:
      "Permet de lutter contre la fatigue et d'améliorer les fonctions cognitives. Améliore la production de testostérone. Favorise la réduction du stress avec une réduction du cortisol. Favorise une amélioration de la qualité du sommeil. Favorise la force musculaire, l'endurance et la récupération après l'exercice.",
  },
  {
    nom: "Rhodiola Rosea",
    cat: "sante",
    effets:
      "Amélioration du métabolisme énergétique. Réduction de la fatigue, de l'épuisement et du burnout. Meilleure régulation des hormones du stress (cortisol et noradrénaline).",
  },
  {
    nom: "Choline",
    cat: "sante",
    effets:
      "Amélioration de la concentration et des performances cognitives. Amélioration de la mémoire et de l'apprentissage.",
  },
  {
    nom: "Bacopa Monnieri",
    cat: "sante",
    effets:
      "Propriétés antioxydantes et anti-inflammatoires. Améliore la mémoire, la concentration et les capacités d'apprentissage. Effets bénéfiques sur le stress et l'anxiété.",
  },
  {
    nom: "Curcumine",
    cat: "sante",
    effets:
      "Propriétés antioxydantes, anti-inflammatoires et antimicrobiennes. Effet neuroprotecteur.",
  },
  {
    nom: "Probiotiques",
    cat: "sante",
    effets:
      "Amélioration de l'absorption des nutriments. Réduction des troubles digestifs. Régulation de l'inflammation. Renforcement de l'immunité.",
  },
  {
    nom: "Collagène",
    cat: "sante",
    effets:
      "Diminution des douleurs articulaires. Amélioration de la récupération après une blessure. Prévention de la perte osseuse. Diminution du risque d'ostéoporose. Augmentation de la densité minérale osseuse.",
  },
  {
    nom: "Glucosamine / Chondroïtine",
    cat: "sante",
    effets:
      "Participe à la structure des tissus conjonctifs et cartilagineux. Stimulation de la synthèse du collagène. Inhibition de la dégradation du collagène.",
  },

  // ============ PERFORMANCE ============
  {
    nom: "Caféine",
    cat: "perf",
    effets:
      "Amélioration des performances chez le sportif. Diminution de la perception de l'effort réalisé. Réduit la sensation de fatigue et de douleurs. Augmente la concentration et la vigilance du sportif.",
  },
  {
    nom: "Créatine",
    cat: "perf",
    effets:
      "Participe au métabolisme énergétique anaérobie alactique. Améliore la mémoire de travail. Améliore la force musculaire, la puissance et la capacité à effectuer des efforts intenses. Effets anticataboliques. Augmente la rétention d'eau intracellulaire. Stimule la croissance musculaire. Favorise la synthèse du glycogène musculaire.",
  },
  {
    nom: "L-Citrulline",
    cat: "perf",
    effets:
      "Entraîne une vasodilatation des vaisseaux sanguins. Augmente l'approvisionnement des nutriments et de l'oxygène aux muscles. Améliore la récupération du sportif.",
  },
  {
    nom: "Bêta-alanine",
    cat: "perf",
    effets:
      "Retarde la fatigue chez l'athlète et améliore les performances. Réduit l'acidité intramusculaire par sa conversion en carnosine. Permet de tolérer une intensité plus importante sur un sprint.",
  },
  {
    nom: "Bicarbonate de sodium",
    cat: "perf",
    effets:
      "Retarde la fatigue chez l'athlète et améliore les performances. Réduit l'acidité extramusculaire en gérant mieux les ions H+. Permet de tolérer une intensité plus importante sur un sprint.",
  },
  {
    nom: "Taurine (performance)",
    cat: "perf",
    effets:
      "Améliore la performance sur des efforts < 15 min. Améliore la thermorégulation à l'effort. Améliore l'absorption des BCAA.",
  },
  {
    nom: "Jus de betterave",
    cat: "perf",
    effets:
      "Entraîne une vasodilatation des vaisseaux sanguins. Augmente l'approvisionnement des nutriments et de l'oxygène aux muscles. Améliore la performance pour des efforts < 30 min. Amélioration de la récupération post-effort.",
  },
  {
    nom: "Nitrates",
    cat: "perf",
    effets:
      "Entraîne une vasodilatation des vaisseaux sanguins. Augmente l'approvisionnement des nutriments et de l'oxygène aux muscles. Améliore la performance pour des efforts < 30 min. Effet positif sur la fonction cognitive avec une amélioration du temps de réaction.",
  },
  {
    nom: "HMB",
    cat: "perf",
    effets:
      "Augmentation de la biogenèse mitochondriale. Augmentation de l'AMPK. Augmentation du pic de puissance anaérobie. Réduction de la masse grasse chez l'athlète. Effet favorable sur les performances d'endurance et sur la VO2 max.",
  },
  {
    nom: "Carnitine",
    cat: "perf",
    effets:
      "Augmente le flux de la glycolyse. Augmentation de l'oxydation des acides gras.",
  },
  {
    nom: "Jus de cerise",
    cat: "perf",
    effets:
      "Amélioration de la récupération post-effort. Réduction de l'inflammation due à l'exercice.",
  },
  {
    nom: "Cétones",
    cat: "perf",
    effets: "Amélioration de l'utilisation des lipides à l'effort.",
  },
  {
    nom: "Cordyceps",
    cat: "perf",
    effets:
      "Augmentation de la vasodilatation en direction du cerveau. Augmentation de la neurotransmission vers le cerveau. Augmentation de la vigilance, de la concentration.",
  },
  {
    nom: "BCAA",
    cat: "perf",
    effets:
      "Réduction de la fatigue nerveuse. Amélioration de la récupération. Réduction de la dégradation musculaire à l'effort.",
  },
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
    if (!item || !editing) return;
    setEditing({
      ...editing,
      nom: item.nom,
      cat: item.cat,
      // Auto-remplit posologie / fréquence / effets attendus depuis le catalogue.
      // N'écrase pas un champ déjà personnalisé par l'utilisateur.
      posologie: editing.posologie || item.posologie || editing.posologie,
      frequence: editing.frequence && editing.frequence !== "Quotidien" ? editing.frequence : item.frequence || editing.frequence,
      effetsAttendus: editing.effetsAttendus || item.effets,
    });
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
            <Field label="Effets attendus">
              <textarea
                className="input"
                style={{ minHeight: 90, resize: "vertical" }}
                value={editing.effetsAttendus}
                onChange={(e) => setEditing({ ...editing, effetsAttendus: e.target.value })}
                placeholder="Sélectionne d'abord un complément dans le catalogue pour pré-remplir automatiquement les effets attendus."
              />
            </Field>
            {(() => {
              const cat = CATALOGUE.find((c) => c.nom === editing.nom);
              if (!cat || editing.effetsAttendus === cat.effets) return null;
              return (
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, effetsAttendus: cat.effets })}
                  className="btn-ghost btn-xs mt-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  ↺ Recharger les effets depuis le catalogue
                </button>
              );
            })()}
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
                {s.effetsAttendus && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] mb-1">
                      Effets attendus
                    </div>
                    <ul className="text-xs text-[#444] space-y-0.5 pl-4 list-disc">
                      {s.effetsAttendus
                        .split(/\.(?:\s+|$)/)
                        .map((seg) => seg.trim())
                        .filter((seg) => seg.length > 0)
                        .map((seg, i) => (
                          <li key={i}>{seg}{seg.endsWith(".") ? "" : "."}</li>
                        ))}
                    </ul>
                  </div>
                )}
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
