"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Target,
  Heart,
  UtensilsCrossed,
  Flame,
  Pill,
  FlaskConical,
  Check,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: User,
    title: "Informations personnelles",
    color: "text-blue-400",
  },
  {
    id: 2,
    icon: Target,
    title: "Objectifs & motivations",
    color: "text-green-400",
  },
  {
    id: 3,
    icon: Heart,
    title: "Données médicales",
    color: "text-red-400",
  },
  {
    id: 4,
    icon: UtensilsCrossed,
    title: "Nutrition au quotidien",
    color: "text-amber-400",
  },
  {
    id: 5,
    icon: Flame,
    title: "Nutrition à l'effort",
    color: "text-orange-400",
  },
  {
    id: 6,
    icon: Pill,
    title: "Compléments alimentaires",
    color: "text-purple-400",
  },
  {
    id: 7,
    icon: FlaskConical,
    title: "Bilan sanguin",
    color: "text-cyan-400",
  },
];

function TextInput({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} name={name} placeholder={placeholder} className="input" />
    </div>
  );
}

function TextareaInput({ label, name, placeholder, rows = 3 }: { label: string; name: string; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea name={name} placeholder={placeholder} rows={rows} className="input resize-none" />
    </div>
  );
}

function SelectInput({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} className="input">
        <option value="">Sélectionner...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Step1() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextInput label="Prénom" name="first_name" placeholder="Thomas" />
      <TextInput label="Nom" name="last_name" placeholder="Dupont" />
      <TextInput label="Date de naissance" name="birth_date" type="date" />
      <SelectInput label="Niveau sportif" name="level" options={[
        { value: "loisir", label: "Loisir" },
        { value: "amateur_confirme", label: "Amateur confirmé" },
        { value: "semi_elite", label: "Semi-élite" },
        { value: "elite", label: "Élite" },
      ]} />
      <TextInput label="Années de pratique" name="sport_years" type="number" placeholder="8" />
      <TextInput label="Volume hebdomadaire (h)" name="weekly_hours" type="number" placeholder="12" />
      <TextInput label="Profession" name="profession" placeholder="Ingénieur" />
      <TextInput label="Situation familiale" name="family_status" placeholder="En couple, 2 enfants" />
      <div className="lg:col-span-2">
        <TextareaInput label="Motivation profonde — Pourquoi pratiquez-vous ?" name="deep_motivation" placeholder="Ce qui me pousse à m'entraîner chaque matin..." rows={3} />
      </div>
    </div>
  );
}

function Step2() {
  return (
    <div className="space-y-4">
      <TextareaInput label="Objectif A de saison (race principale)" name="goal_a" placeholder="Ex: Terminer la Maxi Race Annecy sous 22h" />
      <TextareaInput label="Objectif B de saison" name="goal_b" placeholder="Ex: Progresser sur le semi-marathon" />
      <TextareaInput label="Objectif à 3 ans" name="goal_3years" placeholder="Ex: Qualifier pour le UTMB" />
      <TextareaInput label="Craintes en course" name="fears" placeholder="Ex: Peur du mur, des problèmes digestifs..." />
      <TextareaInput label="Points forts" name="strengths" placeholder="Ex: Je monte bien, bonne gestion mentale..." />
      <TextareaInput label="Ce que vous voulez améliorer" name="improvements" placeholder="Ex: Descentes techniques, nutrition solide..." />
    </div>
  );
}

function Step3() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextInput label="Taille (cm)" name="height_cm" type="number" placeholder="178" />
      <TextInput label="Poids actuel (kg)" name="weight_kg" type="number" placeholder="68.4" />
      <SelectInput label="Groupe sanguin" name="blood_type" options={[
        { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
        { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
        { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
        { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
      ]} />
      <TextInput label="Fréquence cardiaque au repos (bpm)" name="resting_hr" type="number" placeholder="48" />
      <div className="lg:col-span-2">
        <TextareaInput label="Antécédents médicaux / blessures" name="medical_history" placeholder="Fracture de fatigue tibiale 2022, tendinopathie d'Achille..." />
      </div>
      <div className="lg:col-span-2">
        <TextareaInput label="Allergies et intolérances alimentaires" name="allergies" placeholder="Intolérance au gluten, allergie aux arachides..." />
      </div>
      <div className="lg:col-span-2">
        <TextareaInput label="Médicaments en cours" name="medications" placeholder="Aucun / Liste des médicaments..." />
      </div>
      <div className="lg:col-span-2">
        <TextareaInput label="Suivi médical actuel" name="medical_followup" placeholder="Médecin du sport, kiné, ostéo..." />
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextInput label="Nombre de repas par jour" name="meals_per_day" type="number" placeholder="4" />
      <TextInput label="Heure du 1er repas" name="first_meal_time" type="time" />
      <div className="lg:col-span-2">
        <TextareaInput label="Description d'une journée alimentaire type" name="daily_diet" placeholder="Petit-déjeuner : avoine + fruits\nDéjeuner : riz + poulet + légumes\n..." rows={5} />
      </div>
      <TextareaInput label="Aliments favoris" name="favorite_foods" placeholder="Pâtes, bananes, fromage..." />
      <TextareaInput label="Aliments évités" name="avoided_foods" placeholder="Légumineuses (troubles), alcool..." />
      <TextInput label="Hydratation quotidienne (L)" name="daily_hydration" type="number" placeholder="2.5" />
      <SelectInput label="Consommation de caféine" name="caffeine_habit" options={[
        { value: "aucune", label: "Aucune" },
        { value: "faible", label: "Faible (1 café/j)" },
        { value: "moderee", label: "Modérée (2-3 cafés/j)" },
        { value: "elevee", label: "Élevée (4+ cafés/j)" },
      ]} />
      <SelectInput label="Consommation d'alcool" name="alcohol_habit" options={[
        { value: "aucune", label: "Aucune" },
        { value: "occasionnelle", label: "Occasionnelle (1-2/sem)" },
        { value: "moderee", label: "Modérée (weekend)" },
        { value: "reguliere", label: "Régulière" },
      ]} />
    </div>
  );
}

function Step5() {
  return (
    <div className="space-y-4">
      <TextareaInput label="Que mangez-vous pendant les entraînements ?" name="training_nutrition" placeholder="Gel toutes les 45min sur les sorties longues, eau plate..." rows={3} />
      <TextareaInput label="Problèmes digestifs à l'effort" name="digestive_issues" placeholder="Nausées après 3h, douleurs abdominales avec gels sucrés..." rows={3} />
      <TextareaInput label="Ce qui a bien fonctionné en course" name="what_worked" placeholder="Les galettes de riz, la soupe au ravito..." rows={3} />
      <TextareaInput label="Ce qui n'a pas fonctionné" name="what_didnt" placeholder="Les gels maltodextrine pure, boire trop d'un coup..." rows={3} />
      <TextareaInput label="Protocole pré-effort actuel (J-3 à J0)" name="pre_race_protocol" placeholder="J-3 : augmentation glucides\nJ-1 : dîner pâtes\nMatin : 3h avant, toast + confiture..." rows={5} />
    </div>
  );
}

function Step6() {
  return (
    <div className="space-y-4">
      <TextareaInput
        label="Compléments actuels (nom, dose, timing)"
        name="current_supplements"
        placeholder="Magnésium bisglycinate 300mg le soir&#10;Vitamine D3 2000UI matin&#10;Protéine whey post-entraînement"
        rows={5}
      />
      <TextareaInput label="Effets indésirables constatés" name="supplement_side_effects" placeholder="Troubles digestifs avec certaine marque de whey..." rows={3} />
      <TextareaInput label="Compléments envisagés ou questions" name="considered_supplements" placeholder="Je voudrais essayer la bêta-alanine..." rows={3} />
    </div>
  );
}

function Step7() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <p className="lg:col-span-2 text-sm text-[var(--color-text-muted)] mb-2">
        Renseignez votre dernier bilan sanguin si disponible. Votre coach complétera les notes d'interprétation.
      </p>
      <TextInput label="Date du bilan" name="blood_test_date" type="date" />
      <div />
      <TextInput label="Hémoglobine (g/dL)" name="hemoglobin" type="number" placeholder="14.5" />
      <TextInput label="Hématocrite (%)" name="hematocrit" type="number" placeholder="43" />
      <TextInput label="Ferritine (ng/mL)" name="ferritin" type="number" placeholder="65" />
      <TextInput label="Vitamine D (ng/mL)" name="vitamin_d" type="number" placeholder="45" />
      <TextInput label="Zinc (µmol/L)" name="zinc" type="number" placeholder="12" />
      <TextInput label="Magnésium (mmol/L)" name="magnesium" type="number" placeholder="0.85" />
      <TextInput label="CRP (mg/L)" name="crp" type="number" placeholder="1.2" />
      <TextInput label="TSH (mUI/L)" name="tsh" type="number" placeholder="2.1" />
      <TextInput label="Testostérone (ng/dL)" name="testosterone" type="number" placeholder="520" />
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4">
          <p className="text-xs font-semibold text-[var(--color-primary)] mb-1">Note du coach</p>
          <p className="text-xs text-[var(--color-text-muted)]">Les notes d'interprétation seront ajoutées par votre coach après analyse.</p>
        </div>
      </div>
    </div>
  );
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6, Step7];

export default function QuestionnairePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  function goNext() {
    setCompleted((prev) => prev.includes(currentStep) ? prev : [...prev, currentStep]);
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  const StepContent = STEP_COMPONENTS[currentStep];
  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div>
      <Topbar
        title="Questionnaire d'introduction"
        subtitle="7 étapes — sauvegarde automatique à chaque étape"
      />

      {/* Progress bar + stepper */}
      <div className="card mb-6">
        {/* Progress */}
        <div className="progress-bar mb-4">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = completed.includes(i);
            const isCurrent = i === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 ${
                  isCurrent
                    ? "bg-[var(--color-primary)]/10"
                    : "hover:bg-[var(--color-surface-2)]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-[var(--color-primary)]"
                      : "bg-[var(--color-surface-2)]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-white" : "text-[var(--color-text-muted)]"}`} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    isCurrent ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {s.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center">
              <StepIcon className={`w-5 h-5 ${step.color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                Étape {step.id}/7
              </p>
              <h2 className="font-bold font-display text-lg">{step.title}</h2>
            </div>
          </div>

          <StepContent />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <span className="text-sm text-[var(--color-text-muted)]">
          {currentStep + 1} / {STEPS.length}
        </span>

        {currentStep < STEPS.length - 1 ? (
          <button onClick={goNext} className="btn-primary">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={goNext} className="btn-primary">
            <Check className="w-4 h-4" />
            Soumettre
          </button>
        )}
      </div>
    </div>
  );
}
