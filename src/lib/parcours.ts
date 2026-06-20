// =====================================================================
// MON PARCOURS NUTRIOCUS
// Structured journey through the platform in 4 phases.
// Replaces the "flat menu" UX with a guided progression.
// =====================================================================

export type MissionStatus = "done" | "todo" | "locked";

/**
 * Snapshot of athlete data the parcours uses to detect mission completion.
 * Empty defaults are safe — missing data just means "not yet done".
 */
export type ParcoursSnapshot = {
  profile?: {
    sexe?: string;
    poids?: number | string;
    taille?: number | string;
    age?: number | string;
    fcmax?: number | string;
    vo2max?: number | string;
  };
  compo?: { date?: string }[];
  events?: { name?: string; date?: string }[];
  energy?: { date?: string }[];
  sweat?: unknown[];
  tolTests?: unknown[];
  bloodTests?: unknown[];
  mealPlans?: unknown[];
  racePlans?: unknown[];
  prerace?: { dateCible?: string } | null;
  raceAnalyses?: unknown[];
};

export type ParcoursProgress = {
  /** Missions explicitly checked by the user (for reading/manual tasks). */
  manual: Record<string, boolean>;
  /** Free-roam mode: unlocks every phase regardless of progression. */
  freeMode: boolean;
};

export const EMPTY_PROGRESS: ParcoursProgress = { manual: {}, freeMode: false };

export type Mission = {
  id: string;
  title: string;
  why: string;
  durationLabel: string;
  href?: string;
  icon: string;
  /** Auto-detection — true if the mission is completed based on data. */
  isComplete?: (s: ParcoursSnapshot) => boolean;
  /** Pure reading/awareness — only completable via manual check. */
  manualOnly?: boolean;
};

export type Phase = {
  id: "1" | "2" | "3" | "4";
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  missions: Mission[];
};

function notEmpty<T>(arr: T[] | undefined | null, min = 1): boolean {
  return Array.isArray(arr) && arr.length >= min;
}

export const PARCOURS: Phase[] = [
  // ─────────────────────────── PHASE 1 ───────────────────────────
  {
    id: "1",
    title: "Te connaître",
    subtitle: "« Qui je suis ? »",
    description:
      "On commence par la photo de départ : ton corps, tes objectifs, tes seuils. C'est la fondation sur laquelle tout le reste s'appuie.",
    icon: "🧬",
    color: "#cf2e2e",
    missions: [
      {
        id: "p1_profile",
        title: "Renseigner ton profil",
        why: "Toutes les pages de la plateforme s'appuient sur tes données de base (poids, taille, âge, sexe, FCmax). Sans ça, les calculs sont génériques.",
        durationLabel: "5 min",
        href: "/athlete/profile",
        icon: "●",
        isComplete: (s) =>
          !!(s.profile?.poids && s.profile?.taille && s.profile?.age && s.profile?.sexe && s.profile?.fcmax),
      },
      {
        id: "p1_compo",
        title: "Premier point de composition corporelle",
        why: "Sans masse maigre, on ne peut pas calculer ta disponibilité énergétique (RED-S). C'est la donnée la plus structurante pour ton suivi.",
        durationLabel: "5 min",
        href: "/athlete/composition",
        icon: "▤",
        isComplete: (s) => notEmpty(s.compo, 1),
      },
      {
        id: "p1_season",
        title: "Définir tes objectifs courses de la saison",
        why: "Connaître tes échéances permet d'orienter toute la nutrition (recharge, affûtage, périodisation). Sans objectif, on optimise dans le vide.",
        durationLabel: "10 min",
        href: "/athlete/season",
        icon: "▭",
        isComplete: (s) => notEmpty(s.events, 1),
      },
      {
        id: "p1_physio",
        title: "Découvrir tes zones physiologiques",
        why: "Comprendre tes seuils SV1/SV2 et tes zones FC te permettra de mieux interpréter tes sensations à l'effort et de cibler les bonnes intensités.",
        durationLabel: "15 min de lecture",
        href: "/athlete/physiology",
        icon: "◈",
        manualOnly: true,
      },
    ],
  },

  // ─────────────────────────── PHASE 2 ───────────────────────────
  {
    id: "2",
    title: "Te diagnostiquer",
    subtitle: "« Comment fonctionne mon corps ? »",
    description:
      "Maintenant qu'on a la photo, on teste : sudation, tolérance, énergie, sang. C'est ce qui transforme une nutrition générique en une nutrition individualisée.",
    icon: "🔬",
    color: "#FF4501",
    missions: [
      {
        id: "p2_sweat",
        title: "Réaliser ton premier test de sudation",
        why: "Sans connaître ton taux de sueur, ta stratégie d'hydratation est une devinette — risque de déshydratation ou d'hyponatrémie.",
        durationLabel: "1 séance de 1h",
        href: "/athlete/sweat",
        icon: "◓",
        isComplete: (s) => notEmpty(s.sweat, 1),
      },
      {
        id: "p2_energy",
        title: "Démarrer ton carnet de bord énergie (3 jours)",
        why: "C'est ton baromètre RED-S. Détecte les jours où tu es en sous-alimentation chronique, le facteur n°1 des plateaux de performance.",
        durationLabel: "3 jours · 5 min/jour",
        href: "/athlete/energy",
        icon: "▮",
        isComplete: (s) => notEmpty(s.energy, 3),
      },
      {
        id: "p2_tol",
        title: "Réaliser ton premier test de tolérance digestive",
        why: "C'est le plafond de glucides que ton intestin tolère. En course, dépasser ce plafond = troubles GI assurés. On le repousse ensuite progressivement.",
        durationLabel: "1 séance de 1-2h",
        href: "/athlete/tolerance",
        icon: "◔",
        isComplete: (s) => notEmpty(s.tolTests, 1),
      },
      {
        id: "p2_blood_rx",
        title: "Demander ton bilan biologique à ton médecin",
        why: "Ferritine, vitamine D, hormones, CRP : ce sont les leviers invisibles de ta performance. Sans bilan, on optimise dans le noir.",
        durationLabel: "5 min · imprimer la fiche médecin",
        href: "/athlete/blood-tests",
        icon: "🩸",
        manualOnly: true,
      },
    ],
  },

  // ─────────────────────────── PHASE 3 ───────────────────────────
  {
    id: "3",
    title: "Construire tes plans",
    subtitle: "« Voici ma stratégie »",
    description:
      "Avec ta photo de départ et tes diagnostics, on bascule maintenant sur l'action : plans alimentaires personnalisés et stratégies de course.",
    icon: "🎯",
    color: "#5f8c0a",
    missions: [
      {
        id: "p3_meal",
        title: "Créer ton premier plan alimentaire",
        why: "Ton quotidien structuré : recharge, déficit ou maintien selon ta phase d'entraînement, basé sur tes vraies dépenses énergétiques.",
        durationLabel: "20 min",
        href: "/athlete/meal-plans",
        icon: "▦",
        isComplete: (s) => notEmpty(s.mealPlans, 1),
      },
      {
        id: "p3_race",
        title: "Créer ta première stratégie de course",
        why: "Plan détaillé par segment / phase : tes apports CHO, hydratation, sodium par heure, avec validation contre ta tolérance. Plus de mur en course.",
        durationLabel: "30 min",
        href: "/athlete/race-strategy",
        icon: "◎",
        isComplete: (s) => notEmpty(s.racePlans, 1),
      },
      {
        id: "p3_prerace",
        title: "Préparer le plan d'avant-course (J-4 → Jour J)",
        why: "La semaine avant la course est plus importante que la nutrition pendant. Recharge glycogène, hydratation, dernier repas optimisés.",
        durationLabel: "15 min",
        href: "/athlete/pre-race",
        icon: "▣",
        isComplete: (s) => !!s.prerace?.dateCible,
      },
      {
        id: "p3_blood_saisie",
        title: "Saisir les résultats de ton bilan biologique",
        why: "Une fois ton bilan reçu, saisis-le pour obtenir une conclusion automatique avec alertes et recommandations ciblées.",
        durationLabel: "10 min",
        href: "/athlete/blood-tests",
        icon: "🩸",
        isComplete: (s) => notEmpty(s.bloodTests, 1),
      },
    ],
  },

  // ─────────────────────────── PHASE 4 ───────────────────────────
  {
    id: "4",
    title: "Piloter ta progression",
    subtitle: "« J'optimise dans le temps »",
    description:
      "Tu as ta première saison structurée. On entre maintenant dans le cycle de progression continue : analyse, mesure, ajustement.",
    icon: "📈",
    color: "#0a0a0a",
    missions: [
      {
        id: "p4_race_analysis",
        title: "Faire ton premier bilan post-course",
        why: "Chaque course est une mine d'enseignements. Sans débrief structuré, tu refais les mêmes erreurs.",
        durationLabel: "20 min après la course",
        href: "/athlete/race-analysis",
        icon: "◍",
        isComplete: (s) => notEmpty(s.raceAnalyses, 1),
      },
      {
        id: "p4_tol_v2",
        title: "Refaire ton test de tolérance (palier supérieur)",
        why: "L'intestin s'entraîne. En 2-3 semaines, tu peux passer de 60 à 80 g/h. Repousse ton plafond pour ta prochaine course.",
        durationLabel: "1 séance de 1-2h",
        href: "/athlete/tolerance",
        icon: "◔",
        isComplete: (s) => notEmpty(s.tolTests, 2),
      },
      {
        id: "p4_compo_v2",
        title: "Refaire un point de composition corporelle",
        why: "Suivre ta masse maigre dans le temps te dit si tu gagnes en qualité (vs juste perdre du poids). Indispensable en phase d'affûtage.",
        durationLabel: "5 min",
        href: "/athlete/composition",
        icon: "▤",
        isComplete: (s) => notEmpty(s.compo, 2),
      },
      {
        id: "p4_blood_v2",
        title: "Refaire ton bilan biologique (3-6 mois)",
        why: "Ferritine, vitamine D, hormones évoluent. Recontrôler te confirme si tes ajustements nutritionnels portent leurs fruits.",
        durationLabel: "à programmer dans 3-6 mois",
        href: "/athlete/blood-tests",
        icon: "🩸",
        isComplete: (s) => notEmpty(s.bloodTests, 2),
      },
    ],
  },
];

export function getMissionStatus(
  m: Mission,
  s: ParcoursSnapshot,
  p: ParcoursProgress,
  unlocked: boolean,
): MissionStatus {
  if (p.manual[m.id]) return "done";
  if (m.isComplete && m.isComplete(s)) return "done";
  if (!unlocked) return "locked";
  return "todo";
}

export function getPhaseProgress(
  phase: Phase,
  s: ParcoursSnapshot,
  p: ParcoursProgress,
): { done: number; total: number; complete: boolean } {
  const total = phase.missions.length;
  // For progress, count both auto-done and manually-checked.
  let done = 0;
  for (const m of phase.missions) {
    if (p.manual[m.id] || (m.isComplete && m.isComplete(s))) done += 1;
  }
  return { done, total, complete: done === total };
}

/**
 * Phase N is unlocked iff Phase N-1 is complete (or freeMode is on).
 * Phase 1 is always unlocked.
 */
export function getPhaseUnlocked(
  phase: Phase,
  s: ParcoursSnapshot,
  p: ParcoursProgress,
): boolean {
  if (p.freeMode) return true;
  const idx = PARCOURS.findIndex((ph) => ph.id === phase.id);
  if (idx === 0) return true;
  const prev = PARCOURS[idx - 1];
  return getPhaseProgress(prev, s, p).complete;
}

export function getOverallProgress(
  s: ParcoursSnapshot,
  p: ParcoursProgress,
): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  for (const ph of PARCOURS) {
    const pr = getPhaseProgress(ph, s, p);
    done += pr.done;
    total += pr.total;
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/** Returns the next actionable mission across all unlocked phases. */
export function getNextMission(
  s: ParcoursSnapshot,
  p: ParcoursProgress,
): { mission: Mission; phase: Phase } | null {
  for (const phase of PARCOURS) {
    if (!getPhaseUnlocked(phase, s, p)) continue;
    for (const m of phase.missions) {
      const st = getMissionStatus(m, s, p, true);
      if (st === "todo") return { mission: m, phase };
    }
  }
  return null;
}
