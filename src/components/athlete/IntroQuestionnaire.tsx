"use client";

import { useState, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { Field, Empty } from "@/components/ui/PageHeader";

// ============================================================
// TYPES
// ============================================================
export type FoodDay = {
  kcal: string;
  prot: string;
  lip: string;
  gluc: string;
  fibres: string;
  sucres: string;
  lien: string;
  notes: string;
};

export type IntroData = {
  // 1. Données générales
  nom: string;
  prenom: string;
  age: string;
  dateNaissance: string;
  situationPro: string;
  profession: string;
  positionTravail: string;
  horaires: string;
  situationPerso: string;
  courses: string;
  cuisine: string;
  infoSupp1: string;

  // 2. Données médicales
  historiquePoids: string;
  pathologie: string;
  traitement: string;
  allergies: string;
  regime: string;
  antecedents: string;
  objectifsPoids: string;

  // 3. Motivations
  situationActuelle: string;
  tentativesPrec: string;
  situationVisee: string;
  criteresSatisfaction: string;
  suiviReve: string;

  // 4. Objectifs sportifs
  prochainesCourses: string;
  experience: string;
  volumeHebdo: string;
  semaineType: string;
  derniers15j: string;
  coachStaff: string;

  // 5. Sommeil
  qualiteSommeil: string;
  quantiteSommeil: string;
  regularite: string;
  heureCoucher: string;
  heureLever: string;
  endormissement: string;
  reveilsNocturnes: string;
  appareilMesure: string;

  // 6. Alimentation quotidien
  journalJ1: FoodDay;
  journalJ2: FoodDay;
  journalJ3: FoodDay;
  hydratation: string;
  theCafe: string;
  alcool: string;

  // 7. Alimentation effort
  derniereStrategie: string;
  problemesDigestifs: string;
  produitsEffort: string;
  apportMaxGlucides: string;

  // 8. Compléments
  complementsList: string;

  // 9. Bilan sanguin
  dernierBilan: string;
  deficitsCarences: string;
};

const blankDay = (): FoodDay => ({
  kcal: "",
  prot: "",
  lip: "",
  gluc: "",
  fibres: "",
  sucres: "",
  lien: "",
  notes: "",
});

const DEFAULT: IntroData = {
  nom: "",
  prenom: "",
  age: "",
  dateNaissance: "",
  situationPro: "",
  profession: "",
  positionTravail: "",
  horaires: "",
  situationPerso: "",
  courses: "",
  cuisine: "",
  infoSupp1: "",
  historiquePoids: "",
  pathologie: "",
  traitement: "",
  allergies: "",
  regime: "",
  antecedents: "",
  objectifsPoids: "",
  situationActuelle: "",
  tentativesPrec: "",
  situationVisee: "",
  criteresSatisfaction: "",
  suiviReve: "",
  prochainesCourses: "",
  experience: "",
  volumeHebdo: "",
  semaineType: "",
  derniers15j: "",
  coachStaff: "",
  qualiteSommeil: "",
  quantiteSommeil: "",
  regularite: "",
  heureCoucher: "",
  heureLever: "",
  endormissement: "",
  reveilsNocturnes: "",
  appareilMesure: "",
  journalJ1: blankDay(),
  journalJ2: blankDay(),
  journalJ3: blankDay(),
  hydratation: "",
  theCafe: "",
  alcool: "",
  derniereStrategie: "",
  problemesDigestifs: "",
  produitsEffort: "",
  apportMaxGlucides: "",
  complementsList: "",
  dernierBilan: "",
  deficitsCarences: "",
};

// ============================================================
// SECTION HEADER
// ============================================================
function Section({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center gap-3 mb-1">
        <span
          className="font-display font-extrabold text-white rounded-lg px-2.5 py-1"
          style={{ background: "var(--color-primary)", fontSize: 13, letterSpacing: ".05em" }}
        >
          {num}
        </span>
        <span
          className="font-extrabold uppercase"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      {desc && (
        <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">{desc}</p>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function TArea({
  label,
  ic,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  ic?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={`${ic ? ic + " " : ""}${label}`}>
      <textarea
        className="input"
        style={{ minHeight: 60, resize: "vertical" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Inscrivez votre réponse ici…"}
      />
    </Field>
  );
}

function TInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

// ============================================================
// JOURNAL ALIMENTAIRE
// ============================================================
function FoodDayCard({
  num,
  data,
  onChange,
}: {
  num: number;
  data: FoodDay;
  onChange: (d: FoodDay) => void;
}) {
  const upd = (k: keyof FoodDay, v: string) => onChange({ ...data, [k]: v });
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
    >
      <div className="font-extrabold mb-2.5" style={{ color: "var(--color-primary)" }}>
        Journée {num}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
        <TInput label="KCAL" value={data.kcal} onChange={(v) => upd("kcal", v)} />
        <TInput label="Protéines" value={data.prot} onChange={(v) => upd("prot", v)} />
        <TInput label="Lipides" value={data.lip} onChange={(v) => upd("lip", v)} />
        <TInput label="Glucides" value={data.gluc} onChange={(v) => upd("gluc", v)} />
        <TInput label="Fibres" value={data.fibres} onChange={(v) => upd("fibres", v)} />
        <TInput label="Sucres" value={data.sucres} onChange={(v) => upd("sucres", v)} />
      </div>
      <Field label="👉 Lien vers ton alimentation de la journée">
        <input className="input" value={data.lien} onChange={(e) => upd("lien", e.target.value)} placeholder="https://…" />
      </Field>
      <div className="mt-2">
        <Field label="✍ Infos supplémentaires">
          <textarea
            className="input"
            style={{ minHeight: 50, resize: "vertical" }}
            value={data.notes}
            onChange={(e) => upd("notes", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function IntroQuestionnaire() {
  const [stored, setStored, loaded] = useAthleteData<IntroData>("questionnaire", DEFAULT);
  const [d, setD] = useState<IntroData>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);

  useEffect(() => {
    if (loaded) setD({ ...DEFAULT, ...stored });
  }, [loaded, stored]);

  const upd = <K extends keyof IntroData>(k: K, v: IntroData[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const save = () => {
    setStored(d);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!loaded) return <Empty>Chargement…</Empty>;

  const TABS = [
    { n: 1, label: "Données générales" },
    { n: 2, label: "Données médicales" },
    { n: 3, label: "Motivations" },
    { n: 4, label: "Objectifs sportifs" },
    { n: 5, label: "Sommeil" },
    { n: 6, label: "Alimentation quotidien" },
    { n: 7, label: "Alimentation effort" },
    { n: 8, label: "Compléments" },
    { n: 9, label: "Bilan sanguin" },
  ] as const;

  return (
    <div>
      <div
        className="card p-4 mb-4"
        style={{ background: "var(--color-dark)", border: "none", color: "#fff" }}
      >
        <div className="font-extrabold uppercase mb-1" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
          ✴ Introduction au suivi NUTRIOCUS
        </div>
        <div className="text-sm" style={{ color: "#bbb" }}>
          Questionnaire à remplir avant la première consultation. Tu peux le faire en plusieurs fois — les réponses sont sauvegardées automatiquement.
        </div>
        <a
          href="https://www.loom.com/share/6ff69cbfe0ec446ea2b6b67e33df38f5"
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-[var(--color-accent)] font-bold text-sm"
        >
          ▶ Vidéo d&apos;introduction ↗
        </a>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.n}
            onClick={() => setTab(t.n)}
            className={tab === t.n ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            {t.n}. {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — Données générales */}
      {tab === 1 && (
        <Section num="1" title="Les données générales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TInput label="Nom" value={d.nom} onChange={(v) => upd("nom", v)} />
            <TInput label="Prénom" value={d.prenom} onChange={(v) => upd("prenom", v)} />
            <TInput label="Âge" value={d.age} onChange={(v) => upd("age", v)} />
            <TInput label="Date de naissance" type="date" value={d.dateNaissance} onChange={(v) => upd("dateNaissance", v)} />
          </div>
          <div className="text-xs text-[var(--color-text-muted)] italic">
            💡 Pense à transmettre une photo de toi en sportif à ton coach (utilisée pour personnaliser ton dossier &quot;Stratégie nutritionnelle d&apos;avant course&quot;). Tu peux l&apos;ajouter dans l&apos;onglet &quot;Profil technique&quot;.
          </div>
          <TArea label="💼 Quelle est votre situation professionnelle ? Quelle est votre profession ?" value={d.situationPro} onChange={(v) => upd("situationPro", v)} />
          <TArea label="🪑 Êtes-vous plutôt assis ou debout lors de vos journées de travail ? Décrivez une journée type." value={d.positionTravail} onChange={(v) => upd("positionTravail", v)} />
          <TArea label="🕓 Avez-vous des horaires normaux ou décalés ? Si décalés, comment cela se traduit ?" value={d.horaires} onChange={(v) => upd("horaires", v)} />
          <Field label="Quelle est votre situation personnelle ?">
            <select className="input" value={d.situationPerso} onChange={(e) => upd("situationPerso", e.target.value)}>
              <option value="">— Choisir —</option>
              <option>Je vis seul(e)</option>
              <option>Je vis en couple</option>
              <option>Je vis en couple avec des enfants</option>
              <option>Je vis seul(e) avec des enfants</option>
              <option>Je vis en colocation</option>
            </select>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="🧅 Qui s'occupe des courses chez toi ?">
              <select className="input" value={d.courses} onChange={(e) => upd("courses", e.target.value)}>
                <option value="">— Choisir —</option>
                <option>Moi</option>
                <option>Une autre personne</option>
              </select>
            </Field>
            <Field label="🍳 Qui s'occupe de la cuisine chez toi ?">
              <select className="input" value={d.cuisine} onChange={(e) => upd("cuisine", e.target.value)}>
                <option value="">— Choisir —</option>
                <option>Moi</option>
                <option>Une autre personne</option>
              </select>
            </Field>
          </div>
          <TArea label="Une information supplémentaire à spécifier ?" value={d.infoSupp1} onChange={(v) => upd("infoSupp1", v)} />
        </Section>
      )}

      {/* TAB 2 — Données médicales */}
      {tab === 2 && (
        <Section num="2" title="Les données médicales">
          <div className="text-xs text-[var(--color-text-muted)] italic">
            💡 Poids et taille sont renseignés dans l&apos;onglet &quot;Profil technique&quot;.
          </div>
          <TArea label="⚖ Historique du poids sur les dernières années" value={d.historiquePoids} onChange={(v) => upd("historiquePoids", v)} />
          <TArea label="🩺 Avez-vous une pathologie particulière ?" value={d.pathologie} onChange={(v) => upd("pathologie", v)} />
          <TArea label="💊 Suivez-vous un traitement médical ?" value={d.traitement} onChange={(v) => upd("traitement", v)} />
          <TArea label="🤒 Avez-vous des allergies alimentaires ?" value={d.allergies} onChange={(v) => upd("allergies", v)} />
          <TArea label="🫘 Suivez-vous un régime particulier ?" value={d.regime} onChange={(v) => upd("regime", v)} />
          <TArea label="📋 Antécédents médicaux ?" value={d.antecedents} onChange={(v) => upd("antecedents", v)} />
          <TArea label="🎯 Objectifs de poids ?" value={d.objectifsPoids} onChange={(v) => upd("objectifsPoids", v)} />
        </Section>
      )}

      {/* TAB 3 — Motivations */}
      {tab === 3 && (
        <Section num="3" title="Les motivations du suivi nutritionnel">
          <TArea label="🚦 Quelle est votre situation actuelle avant de commencer le suivi ?" value={d.situationActuelle} onChange={(v) => upd("situationActuelle", v)} />
          <TArea label="📝 Qu'avez-vous déjà essayé pour résoudre ce problème ?" value={d.tentativesPrec} onChange={(v) => upd("tentativesPrec", v)} />
          <TArea label="🏁 Quelle situation voulez-vous atteindre à la fin du suivi ?" value={d.situationVisee} onChange={(v) => upd("situationVisee", v)} />
          <TArea label="📌 Sur quels critères allez-vous mesurer que vous êtes pleinement satisfait ?" value={d.criteresSatisfaction} onChange={(v) => upd("criteresSatisfaction", v)} />
          <TArea label="💭 Décrivez le suivi dans votre situation rêvée — comment se déroulerait-il ?" value={d.suiviReve} onChange={(v) => upd("suiviReve", v)} />
        </Section>
      )}

      {/* TAB 4 — Objectifs sportifs */}
      {tab === 4 && (
        <Section num="4" title="Les objectifs sportifs">
          <TArea label="🏆 Quelles sont vos prochaines courses prévues ?" value={d.prochainesCourses} onChange={(v) => upd("prochainesCourses", v)} />
          <TArea label="🥇 Avez-vous déjà réalisé ce type de course ou est-ce une première ?" value={d.experience} onChange={(v) => upd("experience", v)} />
          <TArea label="🕓 Quel est votre volume d'entraînement hebdomadaire ?" value={d.volumeHebdo} onChange={(v) => upd("volumeHebdo", v)} />
          <TArea label="📆 Quelle est votre semaine type ?" value={d.semaineType} onChange={(v) => upd("semaineType", v)} />
          <TArea label="📊 Pour les 15 derniers jours, pour chaque sortie : durée et dépense énergétique (en kcal)" value={d.derniers15j} onChange={(v) => upd("derniers15j", v)} />
          <TArea label="🗣 Êtes-vous accompagné par un coach, un staff technique ?" value={d.coachStaff} onChange={(v) => upd("coachStaff", v)} />
        </Section>
      )}

      {/* TAB 5 — Sommeil */}
      {tab === 5 && (
        <Section num="5" title="Le sommeil">
          <TArea label="✅ Comment jugez-vous la qualité de votre sommeil ?" value={d.qualiteSommeil} onChange={(v) => upd("qualiteSommeil", v)} />
          <TArea label="🛌 Comment jugez-vous la quantité de votre sommeil ?" value={d.quantiteSommeil} onChange={(v) => upd("quantiteSommeil", v)} />
          <TArea label="⏰ Vous couchez-vous et levez-vous à des horaires réguliers ?" value={d.regularite} onChange={(v) => upd("regularite", v)} />
          <div className="grid grid-cols-2 gap-3">
            <TInput label="🕑 Heure habituelle de coucher" value={d.heureCoucher} onChange={(v) => upd("heureCoucher", v)} placeholder="ex 23h30" />
            <TInput label="🕣 Heure habituelle de lever" value={d.heureLever} onChange={(v) => upd("heureLever", v)} placeholder="ex 7h00" />
          </div>
          <TArea label="🥱 Avez-vous des difficultés à vous endormir ?" value={d.endormissement} onChange={(v) => upd("endormissement", v)} />
          <TArea label="👀 Avez-vous fréquemment des réveils nocturnes ?" value={d.reveilsNocturnes} onChange={(v) => upd("reveilsNocturnes", v)} />
          <Field label="📊 Mesurez-vous la qualité de votre sommeil avec un appareil ?">
            <select className="input" value={d.appareilMesure} onChange={(e) => upd("appareilMesure", e.target.value)}>
              <option value="">— Choisir —</option>
              <option>Montre connectée</option>
              <option>Whoop</option>
              <option>OURA</option>
              <option>Non, je ne mesure pas</option>
            </select>
          </Field>
        </Section>
      )}

      {/* TAB 6 — Alimentation quotidien */}
      {tab === 6 && (
        <Section
          num="6"
          title="L'alimentation au quotidien"
          desc="Pour bien définir ton plan alimentaire, on met en place un journal alimentaire sur 3 jours. Sur les 3 prochains jours, contrôle et mesure tout ce que tu consommes pour connaître tes apports caloriques exacts. Important : ne change pas ton alimentation pendant ces 3 jours — on veut un reflet réel."
        >
          <FoodDayCard num={1} data={d.journalJ1} onChange={(v) => upd("journalJ1", v)} />
          <FoodDayCard num={2} data={d.journalJ2} onChange={(v) => upd("journalJ2", v)} />
          <FoodDayCard num={3} data={d.journalJ3} onChange={(v) => upd("journalJ3", v)} />
          <TArea label="💧 Quelle est ta consommation hydrique par jour ?" value={d.hydratation} onChange={(v) => upd("hydratation", v)} />
          <TArea label="☕ Consommes-tu du thé, du café ? Si oui, quelle quantité ?" value={d.theCafe} onChange={(v) => upd("theCafe", v)} />
          <TArea label="🍷 Quelle est ta consommation d'alcool ?" value={d.alcool} onChange={(v) => upd("alcool", v)} />
        </Section>
      )}

      {/* TAB 7 — Alimentation effort */}
      {tab === 7 && (
        <Section num="7" title="L'alimentation de l'effort">
          <TArea label="✍ Quelle a été ta dernière stratégie nutritionnelle de course ?" value={d.derniereStrategie} onChange={(v) => upd("derniereStrategie", v)} />
          <TArea label="💩 Ressens-tu régulièrement des problèmes digestifs ?" value={d.problemesDigestifs} onChange={(v) => upd("problemesDigestifs", v)} />
          <TArea label="🍫 Quels sont les produits de l'effort que tu consommes ?" value={d.produitsEffort} onChange={(v) => upd("produitsEffort", v)} placeholder="Liste les produits que tu consommes" />
          <TArea label="⚡ Quel apport maximal en glucides as-tu déjà toléré ?" value={d.apportMaxGlucides} onChange={(v) => upd("apportMaxGlucides", v)} />
        </Section>
      )}

      {/* TAB 8 — Compléments */}
      {tab === 8 && (
        <Section num="8" title="Les compléments alimentaires">
          <TArea
            label="💊 Liste les compléments alimentaires que tu consommes"
            value={d.complementsList}
            onChange={(v) => upd("complementsList", v)}
            placeholder="Nom, posologie, fréquence…"
          />
          <div className="text-xs text-[var(--color-text-muted)] italic">
            💡 Tu peux aussi gérer ta complémentation détaillée dans l&apos;onglet « Complémentation » du menu.
          </div>
        </Section>
      )}

      {/* TAB 9 — Bilan sanguin */}
      {tab === 9 && (
        <Section num="9" title="Le bilan sanguin">
          <TArea label="🩸 À quand remonte ton dernier bilan sanguin ?" value={d.dernierBilan} onChange={(v) => upd("dernierBilan", v)} />
          <TArea label="🚨 Ton dernier bilan présentait-il des déficits ou des carences ?" value={d.deficitsCarences} onChange={(v) => upd("deficitsCarences", v)} />
        </Section>
      )}

      {/* Action bar */}
      <div className="sticky bottom-0 bg-[var(--color-background)] pt-3 pb-2 flex justify-between items-center gap-3 flex-wrap" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex gap-1.5">
          {tab > 1 && (
            <button onClick={() => setTab((tab - 1) as typeof tab)} className="btn-ghost btn-sm">← Précédent</button>
          )}
          {tab < 9 && (
            <button onClick={() => setTab((tab + 1) as typeof tab)} className="btn-ghost btn-sm">Suivant →</button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {saved && <span className="text-[var(--color-success)] text-sm font-semibold">✓ Enregistré</span>}
          <button onClick={save} className="btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
