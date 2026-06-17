// Pre-race meal plans — manually curated by the coach, weight bucket by weight bucket.
// Source of truth: coach-provided text (replaces previous PDF auto-extraction).
//
// Status:
//   55 kg → complet (J-4 → Jour de course)
//   57 kg → complet (J-4 → J-1, race-day partagé)
//   64 kg → complet (J-4 → J-1, race-day partagé)
//   68 kg → complet (J-4 → J-1, race-day partagé)
//   70 kg → complet (J-4 → J-1, race-day partagé)
//   72 kg → complet (J-4 → J-1, race-day partagé)
//   60 · 78 kg → J-4 à J-1 en attente (race-day partagé déjà OK)
//   56 kg → non géré (volontairement skipé)

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

const WEIGHT_BUCKETS: number[] = [55, 57, 60, 64, 68, 70, 72, 78];

// Shorthand for food entry (keeps the data block readable below).
const f = (food: string, qty: string, tip = ""): PreraceFood => ({ food, qty, tip });

// Race-day breakfast — identique pour toutes les tranches de poids (consigne coach).
// La quantité de riz de la version salée est exprimée en g/kg de poids du corps.
const RACE_DAY_BREAKFASTS: PreraceRacePossibility[] = [
  {
    label: "Possibilité 1 — Version salée",
    description: "Repas classique poulet/dinde + riz blanc, à privilégier si la digestion est solide.",
    items: [
      f("FILET DE POULET OU ESCALOPE DE DINDE", "150 grammes", "Viande maigre, à privilégier"),
      f("RIZ BASMATI", "2 grammes crus / kg de poids du corps", "Soit ~110 g crus pour 55 kg, ~140 g pour 70 kg, etc."),
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
];

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
    raceDay: RACE_DAY_BREAKFASTS,
  },

  57: {
    weight: 57,
    days: {
      "J-4": {
        petit_dej: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 100g crus (300g riz, 250g pâtes cuits) // Patate douce ou Pommes de terre = 400g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        collation: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 100g crus (300g riz, 250g pâtes cuits) // Patate douce ou Pommes de terre = 400g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-3": {
        petit_dej: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 100g crus (300g riz, 250g pâtes cuits) // Patate douce ou Pommes de terre = 400g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 100g crus (300g riz, 250g pâtes cuits) // Patate douce ou Pommes de terre = 400g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        malto: [
          f("MALTODEXTRINE", "40 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-2": {
        petit_dej: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "50 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120g crus (360g riz, 300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("LAIT VEGETAL", "100 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FLOCONS D'AVOINE", "40 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("MIEL", "15 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 7 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 100g crus (300g riz, 250g pâtes cuits) // Patate douce ou Pommes de terre = 400g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après le déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-1": {
        // Petit déjeuner + collation mutualisés sous forme de pancake.
        petit_dej: [
          f("LAIT VEGETAL", "150 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("MIEL", "20 grammes", "Privilégier le miel d'acacia"),
          f("FLOCONS D'AVOINE", "100 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("OEUF", "1 unité", "Privilégier les oeufs d'origine biologique"),
          f("CHOCOLAT NOIR", "20 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "45 grammes crus = 135 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PATATE DOUCE ECRASEE", "200 grammes", "Privilégier les produits de saison et biologique."),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "65 grammes crus = 200 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("COMPOTE DE POMME", "150 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
      },
    },
    raceDay: RACE_DAY_BREAKFASTS,
  },

  // Autres poids à renseigner (60, 68, 70, 72, 78 kg). 56 kg volontairement non géré.
  60: { weight: 60, days: {}, raceDay: RACE_DAY_BREAKFASTS },

  64: {
    weight: 64,
    days: {
      "J-4": {
        petit_dej: [
          f("FLOCON D'AVOINE", "50 grammes", "Privilégier les flocons d'avoine biologique"),
          f("FROMAGE BLANC", "125 grammes", "Privilégier le 3% de MG"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120 g crus ou 260g cuits // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "200 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN", "90 grammes = 3 tranches", "Privilégier le pain blanc type baguette"),
          f("COMPOTE DE POMME", "100 grammes", "Privilégier les produits de saison et biologique."),
          f("PUREE D'OLEAGINEUX", "20 grammes", "Choisir entre purée d'amande, beurre de cacahuète, ..."),
          f("OLEAGINEUX", "10 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 120 g crus ou 260g cuits // Patate douce ou Pommes de terre = 480g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        // Aucun shaker maltodextrine à J-4 pour le 64 kg.
      },
      "J-3": {
        petit_dej: [
          f("FLOCON D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologique"),
          f("LAIT VEGETAL", "150 grammes", "Privilégier le lait d'amande ou d'avoine"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 140 g crus ou 320g cuits // Patate douce ou Pommes de terre = 560g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "200 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN", "90 grammes = 3 tranches", "Privilégier le pain blanc type baguette"),
          f("COMPOTE DE POMME", "100 grammes", "Privilégier les produits de saison et biologique."),
          f("PUREE D'OLEAGINEUX", "20 grammes", "Choisir entre purée d'amande, beurre de cacahuète, ..."),
          f("OLEAGINEUX", "10 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 140 g crus ou 320g cuits // Patate douce ou Pommes de terre = 560g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("SHAKER MALTODEXTRINE", "40 grammes dans 500ml", "Soit sur l'entrainement ou alors 30 minutes après le repas du midi"),
          f("SHAKER MALTODEXTRINE", "40 grammes dans 500ml", "1H avant le coucher"),
        ],
      },
      "J-2": {
        petit_dej: [
          f("FLOCON D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologique"),
          f("LAIT VEGETAL", "150 grammes", "Privilégier le lait d'amande ou d'avoine"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "8 grammes pour la viande et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150 g crus ou 360g cuits // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "200 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN", "90 grammes = 3 tranches", "Privilégier le pain blanc type baguette"),
          f("COMPOTE DE POMME", "100 grammes", "Privilégier les produits de saison et biologique."),
          f("PUREE D'OLEAGINEUX", "20 grammes", "Choisir entre purée d'amande, beurre de cacahuète, ..."),
          f("OLEAGINEUX", "10 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes ou 3 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150 g crus ou 360g cuits // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("SHAKER MALTODEXTRINE", "60 grammes dans 600ml", "30 minutes après le petit déjeuner"),
          f("SHAKER MALTODEXTRINE", "60 grammes dans 600ml", "Soit sur l'entrainement ou alors 30 minutes après le repas du midi"),
          f("SHAKER MALTODEXTRINE", "60 grammes dans 600ml", "1H avant le coucher"),
        ],
      },
      "J-1": {
        // Petit déjeuner sous forme de pancake — collation sous forme de smoothie au blender.
        petit_dej: [
          f("FLOCON D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologique"),
          f("LAIT VEGETAL", "150 grammes", "Privilégier le lait d'amande ou d'avoine"),
          f("OEUF", "1 unité", "Privilégier les oeufs biologique"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("PUREE D'OLEAGINEUX", "20 grammes", "Choisir entre purée d'amande, beurre de cacahuète, ..."),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "125 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons maigres (colin, cabillaud)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "Céréales = 50g crus ou 110g cuits", "Privilégier le riz basmati"),
          f("PATATE DOUCE ECRASEE", "200 grammes", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("FLOCON D'AVOINE", "80 grammes", "Privilégier les flocons d'avoine biologique"),
          f("LAIT VEGETAL", "250 grammes", "Privilégier le lait d'amande ou d'avoine"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        diner: [
          f("VIANDES OU POISSON", "125 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons maigres (colin, cabillaud)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "Céréales = 70 g crus ou 160g cuits", "Privilégier le riz basmati"),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier les compotes sans sucres ajoutés"),
        ],
      },
    },
    raceDay: RACE_DAY_BREAKFASTS,
  },

  68: {
    weight: 68,
    days: {
      "J-4": {
        petit_dej: [
          f("FROMAGE BLANC", "150 grammes", "Privilégier le fromage blanc 3% de MG"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "50 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          // Sous la forme de pancake.
          f("FLOCON D'AVOINE", "50 grammes", "Privilégier les flocons d'avoine biologique ou prendre de la farine"),
          f("LAIT D'AVOINE", "100 grammes", "Possibilité de prendre du lait d'amande"),
          f("OEUF", "1 unité", "Privilégier les oeufs d'origine biologique"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("MIEL", "20 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande ou le poisson", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN BLANC", "30 grammes", "Privilégier le pain blanc type baguette"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        // Aucun shaker maltodextrine à J-4 pour le 68 kg.
      },
      "J-3": {
        petit_dej: [
          f("FROMAGE BLANC", "150 grammes", "Privilégier le fromage blanc 3% de MG"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "50 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("FLOCON D'AVOINE", "50 grammes", "Privilégier les flocons d'avoine biologique ou prendre de la farine"),
          f("LAIT D'AVOINE", "100 grammes", "Possibilité de prendre du lait d'amande"),
          f("OEUF", "1 unité", "Privilégier les oeufs d'origine biologique"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("MIEL", "20 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande ou le poisson", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN BLANC", "30 grammes", "Privilégier le pain blanc type baguette"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-2": {
        petit_dej: [
          f("FROMAGE BLANC", "150 grammes", "Privilégier le fromage blanc 3% de MG"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "50 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("FLOCON D'AVOINE", "50 grammes", "Privilégier les flocons d'avoine biologique ou prendre de la farine"),
          f("LAIT D'AVOINE", "100 grammes", "Possibilité de prendre du lait d'amande"),
          f("OEUF", "1 unité", "Privilégier les oeufs d'origine biologique"),
          f("PAIN BLANC", "60 grammes = 2 tranches", "Privilégier le pain blanc type baguette"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("MIEL", "20 grammes", "Privilégier le miel d'acacia"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande ou le poisson", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz ou 375g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN BLANC", "60 grammes = 2 tranches", "Privilégier le pain blanc type baguette"),
          f("COMPOTE DE POMME", "150 grammes", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après le déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-1": {
        // Petit déjeuner sous forme de porridge.
        petit_dej: [
          f("LAIT VEGETAL", "150 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "60 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "110 grammes crus = 330 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PATATE DOUCE ECRASEE", "300 grammes", "Privilégier les produits de saison et biologique."),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
        collation: [
          f("WHEY PROTEINE", "30 grammes", "Privilégier la whey isolate ou native"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("COMPOTE DE POMME", "150 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "140 grammes crus = 420 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("COMPOTE DE POMME", "150 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
      },
    },
    raceDay: RACE_DAY_BREAKFASTS,
  },
  70: {
    weight: 70,
    days: {
      "J-4": {
        petit_dej: [
          f("LAIT VEGETAL", "200 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "100 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        collation: [
          f("OLEAGINEUX", "30 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("YAOURT", "1 unité = 125 grammes", "Au choix"),
        ],
        malto: [
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-3": {
        petit_dej: [
          f("LAIT VEGETAL", "200 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "100 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        collation: [
          f("OLEAGINEUX", "30 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
          f("PAIN", "4 tranches = 120 grammes", "Possibilité de prendre du pain complet ou blanc"),
          f("CONFITURE OU MIEL", "40 grammes", "Privilégier le miel d'acacia ou la confiture la plus riche en fruits"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("YAOURT", "1 unité = 125 grammes", "Au choix"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après le déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-2": {
        petit_dej: [
          f("LAIT VEGETAL", "200 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "100 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("OLEAGINEUX", "30 grammes", "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."),
          f("PAIN", "4 tranches = 120 grammes", "Possibilité de prendre du pain complet ou blanc"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          f("CONFITURE OU MIEL", "40 grammes", "Privilégier le miel d'acacia ou la confiture la plus riche en fruits"),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz; 375g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PAIN COMPLET", "1 tranche = 30 grammes", ""),
          f("YAOURT", "1 unité = 125 grammes", "Au choix"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        malto: [
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après le petit déjeuner."),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 30 minutes après la collation ou sur un entrainement"),
          f("MALTODEXTRINE", "50 grammes dans 600ml d'eau", "Le prendre 30 minutes après le déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 600ml d'eau", "Le prendre 1H avant le coucher"),
        ],
      },
      "J-1": {
        // Petit déjeuner sous forme de porridge — collation sous forme de smoothie.
        petit_dej: [
          f("LAIT VEGETAL", "200 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("FLOCONS D'AVOINE", "80 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("RIZ BASMATI", "70 grammes crus = 210 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("PATATE DOUCE ECRASEE", "300 grammes", "Privilégier les produits de saison et biologique."),
          f("HUILE D'OLIVE", "10 grammes pour la viande et 10 grammes pour la patate douce", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
        collation: [
          f("LAIT VEGETAL", "300 grammes", "Privilégier le lait d'avoine ou le lait d'amande"),
          f("FRUIT", "1 unité = 150 grammes", "Privilégier les fruits de saison et biologiques."),
          f("WHEY", "30 grammes", "Privilégier la whey isolate ou native"),
          f("FLOCONS D'AVOINE", "60 grammes", "Priviligier les flocons d'avoine biologique sans gluten"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
        ],
        diner: [
          f("VIANDES OU POISSON", "150 grammes", "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "130 grammes crus = 390 grammes cuits", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("COMPOTE DE POMME", "200 grammes", "Privilégier de la compote sans sucres ajoutés"),
        ],
      },
    },
    raceDay: RACE_DAY_BREAKFASTS,
  },
  72: {
    weight: 72,
    days: {
      "J-4": {
        petit_dej: [
          f("LAIT VEGETAL", "200 ml", "Privilégier le lait d'avoine ou d'amande"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat noir 70% cacao"),
          f("FLOCONS D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologiques"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "175 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande et 10 grammes pour les légumes", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150g crus (450g riz, 375g pâtes cuites) // Patate douce ou Pommes de terre = 550g cuit", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("LEGUMES", "150 grammes", "Privilégier les produits de saison et biologique."),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          f("PAIN DE MIE", "4 tranches", ""),
          f("COMPOTE DE POMME SSA", "250 grammes", ""),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les oeufs biologiques pour éviter les problèmes d'antibiotiques"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 200g crus (600g riz, 500g pâtes cuites)", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          // Collation post-dîner
          f("FLOCON D'AVOINE", "70 grammes", "Collation post-dîner"),
          f("FRUIT", "1 unité", "Collation post-dîner — privilégier les produits de saison et biologique."),
          f("LAIT VEGETAL", "200 ml", "Collation post-dîner"),
          f("CHOCOLAT NOIR", "10 grammes", "Collation post-dîner — privilégier le chocolat 70% de cacao"),
        ],
      },
      "J-3": {
        petit_dej: [
          f("LAIT VEGETAL", "200 ml", "Privilégier le lait d'avoine ou d'amande"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat noir 70% cacao"),
          f("FLOCONS D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologiques"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 220 g crus (660g riz, 550g pâtes cuites)", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
        ],
        collation: [
          f("PAIN DE MIE", "4 tranches", ""),
          f("COMPOTE DE POMME SSA", "250 grammes", ""),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "150 grammes ou 4 oeufs", "Privilégier les oeufs biologiques pour éviter les problèmes d'antibiotiques"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 200g crus (600g riz, 500g pâtes cuites)", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          // Collation post-dîner
          f("FLOCON D'AVOINE", "70 grammes", "Collation post-dîner"),
          f("FRUIT", "1 unité", "Collation post-dîner — privilégier les produits de saison et biologique."),
          f("LAIT VEGETAL", "200 ml", "Collation post-dîner"),
          f("CHOCOLAT NOIR", "10 grammes", "Collation post-dîner — privilégier le chocolat 70% de cacao"),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "Au petit déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "Au déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "À la collation"),
        ],
      },
      "J-2": {
        petit_dej: [
          f("LAIT VEGETAL", "200 ml", "Privilégier le lait d'avoine ou d'amande"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat noir 70% cacao"),
          f("FLOCONS D'AVOINE", "70 grammes", "Privilégier les flocons d'avoine biologiques"),
        ],
        dejeuner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes", "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 150 g crus de RIZ (450g cuits)", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
        ],
        collation: [
          f("PAIN DE MIE", "4 tranches", ""),
          f("COMPOTE DE POMME SSA", "250 grammes", ""),
        ],
        diner: [
          f("VIANDES OU POISSON OU OEUFS", "125 grammes", "Privilégier les oeufs biologiques pour éviter les problèmes d'antibiotiques"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("FECULENTS", "Céréales = 200g crus (600g riz, 500g pâtes cuites)", "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("FLOCON D'AVOINE", "70 grammes", ""),
          f("LAIT VEGETAL", "200 ml", ""),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
          // Dîner 2 — optionnel
          f("FECULENTS", "Céréales = 200g crus (600g riz, 500g pâtes cuites)", "Dîner 2 (optionnel — sinon ne prendre que la maltodextrine)"),
          f("CHOCOLAT NOIR", "10 grammes", "Dîner 2 (optionnel) — privilégier le chocolat 70% de cacao"),
        ],
        malto: [
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "Au petit déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "Au déjeuner"),
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "À la collation"),
          f("MALTODEXTRINE", "60 grammes dans 400ml d'eau", "Au Dîner 2 (optionnel)"),
        ],
      },
      "J-1": {
        petit_dej: [
          f("LAIT VEGETAL", "200 ml", "Privilégier le lait d'avoine ou d'amande"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat noir 70% cacao"),
          f("MIEL", "10 grammes", "Privilégier le miel d'acacia"),
          f("FLOCONS D'AVOINE", "100 grammes", "Privilégier les flocons d'avoine biologiques"),
          f("FRUIT", "1 unité", "Privilégier les produits de saison et biologique."),
        ],
        dejeuner: [
          f("VIANDES BLANCHES OU POISSON BLANC", "125 grammes", "Privilégier les viandes maigres (dinde, poulet) ou poisson blanc (colin, cabillaud)"),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "120 grammes crus = 360 grammes cuits", ""),
          f("PATATE DOUCE ECRASEE", "250 grammes", "Privilégier les produits de saison et biologique."),
        ],
        collation: [
          // En cookie ou smoothie
          f("FLOCON D'AVOINE", "120 grammes", "Privilégier les flocons d'avoine biologique"),
          f("OEUFS", "2 unités", "À remplacer par 20 grammes de whey si smoothie"),
          f("FRUIT", "2 unités", "Privilégier les produits de saison et biologique."),
          f("LAIT VEGETAL", "200 ml", "Privilégier le lait d'amande ou d'avoine"),
          f("CHOCOLAT NOIR", "10 grammes", "Privilégier le chocolat 70% de cacao"),
          f("BEURRE DE CACAHUETE", "20 grammes", "Privilégier le 100% cacahuète"),
        ],
        diner: [
          f("ESCALOPE DE DINDE", "150 grammes", ""),
          f("HUILE D'OLIVE", "10 grammes pour la viande", "Privilégier l'huile d'olive biologique et pressée à froid"),
          f("RIZ BASMATI", "140 grammes crus = 420 grammes cuits", ""),
        ],
      },
    },
    raceDay: RACE_DAY_BREAKFASTS,
  },
  78: { weight: 78, days: {}, raceDay: RACE_DAY_BREAKFASTS },
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
