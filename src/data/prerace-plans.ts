// Pre-race meal plans — manually curated by the coach, weight bucket by weight bucket.
// Source of truth: coach-provided text (replaces previous PDF auto-extraction).
//
// Status:
//   55 kg → J-4, J-3, J-2, J-1 complete · Jour de course: en attente
//   56-78 kg → en attente

export type PreraceFood = { food: string; qty: string; tip: string };
export type Meal = "petit_dej" | "collation" | "dejeuner" | "malto" | "diner";

export const MEAL_LABELS: Record<Meal, string> = {
  petit_dej: "Petit déjeuner",
  collation: "Collation matin / après-midi",
  dejeuner: "Déjeuner",
  malto: "Maltodextrine",
  diner: "Dîner",
};

export const MEAL_ORDER: Meal[] = ["petit_dej", "collation", "dejeuner", "malto", "diner"];

export type PreraceDay = "J-4" | "J-3" | "J-2" | "J-1";
export type PreracePlanDay = Partial<Record<Meal, PreraceFood[]>>;

export type PreraceRacePossibility = {
  label: string;
  description?: string;
  items: PreraceFood[];
};

export type PreraceWeightPlan = {
  weight: number;
  days: Partial<Record<PreraceDay, PreracePlanDay>>;
  raceDay: PreraceRacePossibility[]; // empty = pas encore configuré
};

const WEIGHT_BUCKETS: number[] = [55, 56, 57, 60, 64, 68, 70, 72, 78];

// Shorthand for food entry (keeps the data block readable below).
const f = (food: string, qty: string, tip = ""): PreraceFood => ({ food, qty, tip });

// Common shaker blocks reused inside 55 kg J-4 / J-3.
const SHAKER_J4_J3 = [
  f("MALTODEXTRINE", "50 grammes dans 400ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
  f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
  f("MALTODEXTRINE", "50 grammes dans 400ml d'eau", "Le prendre 1H avant le coucher"),
];

const SHAKER_J2_55 = [
  f("MALTODEXTRINE", "50 grammes dans 400ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
  f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
  f("MALTODEXTRINE", "50 grammes dans 400ml d'eau", "Le prendre 30 minutes après le déjeuner."),
  f("MALTODEXTRINE", "50 grammes dans 400ml d'eau", "Le prendre 1H avant le coucher"),
];

export const PRERACE_PLANS: Record<number, PreraceWeightPlan> = {
  55: {
    weight: 55,
    days: {
      "J-4": {
        petit_dej: [
          f("FROMAGE BLANC", "200 grammes", "Privilégier le fromage blanc 3% MG"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120g crus (360g riz; 300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN COMPLET", "60 grammes = 2 tranches", "Privilégier le pain complet ou aux céréales"),
          f("CONFITURE", "20 grammes", "Privilégier la confiture la plus riche en fruit."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120g crus (360g riz; 300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: SHAKER_J4_J3,
      },
      "J-3": {
        petit_dej: [
          f("FROMAGE BLANC", "200 grammes", "Privilégier le fromage blanc 3% MG"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120g crus (360g riz; 300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN COMPLET", "60 grammes = 2 tranches", "Privilégier le pain complet ou aux céréales"),
          f("CONFITURE", "20 grammes", "Privilégier la confiture la plus riche en fruit."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FECULENTS", "Céréales = 120g crus (360g riz; 300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: SHAKER_J4_J3,
      },
      "J-2": {
        petit_dej: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "60 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 130g crus (390g riz; 325g pâtes cuits) // Patate douce ou Pommes de terre = 520g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN COMPLET", "90 grammes = 3 tranches", "Privilégier le pain complet ou aux céréales"),
          f("CONFITURE", "30 grammes", "Privilégier la confiture la plus riche en fruit."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 130g crus (390g riz; 325g pâtes cuits) // Patate douce ou Pommes de terre = 520g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: SHAKER_J2_55,
      },
      "J-1": {
        // À J-1 le petit déjeuner et la collation sont mutualisés sous forme de pancake.
        petit_dej: [
          f("LAIT VEGETAL", "130 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("MIEL", "20 grammes", "Privilégier le miel d'acacia"),
          f("FLOCONS D'AVOINE", "100 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("OEUF", "1 unité", "Privilégier les oeufs d'origine biologiques"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "175 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
          f("RIZ BASMATI", "50 grammes crus = 110 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PATATE DOUCE ECRASEE", "200 grammes", "Privilégier les produits de saison et biologique."),
        ],
        diner: [
          f("VIANDES OU POISSON", "175 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "75 grammes crus = 160 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
      },
    },
    raceDay: [
      {
        label: "Possibilité 1 — Version salée",
        description: "Repas classique poulet/dinde + riz blanc, à privilégier si la digestion est solide.",
        items: [
          f("FILET DE POULET OU ESCALOPE DE DINDE", "150 grammes", "Viande maigre, à privilégier"),
          f("RIZ BASMATI", "110 grammes crus (= 2 g/kg de poids de corps)", "Soit ~230 g cuits pour 55 kg"),
        ],
      },
      {
        label: "Possibilité 2 — Version sucrée (cake d'avoine)",
        description: "Cake d'avoine maison — mélange les ingrédients et cuis 30 min au four à 180 °C.",
        items: [
          f("FARINE D'AVOINE", "150 grammes", "Flocons d'avoine mixés"),
          f("OEUFS", "2 unités", "Privilégier oeufs biologiques"),
          f("PROTÉINE EN POUDRE", "20 grammes", "Whey isolate ou native"),
          f("LAIT VÉGÉTAL", "150 ml", "Avoine ou amande"),
          f("BANANE", "1 unité", "Bien mûre pour digestibilité"),
          f("CHOCOLAT NOIR 70%", "10 grammes", ""),
          f("LEVURE", "1 sachet", "Levure chimique"),
        ],
      },
      {
        label: "Possibilité 3 — Version shaker",
        description: "Format liquide à siroter — idéal si départ très matinal ou stress digestif.",
        items: [
          f("PROTÉINE WHEY ISOLAT", "40 grammes", ""),
          f("POUDRE D'AVOINE", "140 grammes", "Flocons d'avoine mixés"),
          f("BANANE", "1 unité", "Bien mûre"),
          f("LAIT D'AMANDE", "180 grammes", ""),
        ],
      },
    ],
  },

  // Autres poids à renseigner (56, 57, 60, 64, 68, 70, 72, 78 kg).
  56: { weight: 56, days: {}, raceDay: [] },
  57: { weight: 57, days: {}, raceDay: [] },
  60: { weight: 60, days: {}, raceDay: [] },
  64: { weight: 64, days: {}, raceDay: [] },
  68: { weight: 68, days: {}, raceDay: [] },
  70: { weight: 70, days: {}, raceDay: [] },
  72: { weight: 72, days: {}, raceDay: [] },
  78: { weight: 78, days: {}, raceDay: [] },
};

export function closestWeightBucket(weightKg: number): number {
  if (!weightKg || isNaN(weightKg)) return 55;
  const configured = WEIGHT_BUCKETS.filter((w) => {
    const p = PRERACE_PLANS[w];
    return p && Object.keys(p.days).length > 0;
  });
  const pool = configured.length > 0 ? configured : WEIGHT_BUCKETS;
  let best = pool[0];
  let bestDist = Math.abs(weightKg - best);
  for (const w of pool) {
    const d = Math.abs(weightKg - w);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  }
  return best;
}
