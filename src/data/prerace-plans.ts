// Pre-race meal plans extracted from coach PDFs (J-4 → J-J)
// Generated from 9 weight buckets: 55, 56, 57, 60, 64, 68, 70, 72, 78 kg
// Each athlete is matched to the closest weight bucket based on their profile.

export type PreraceFood = { food: string; qty: string; tip: string };
export type PreraceDay = "J-4" | "J-3" | "J-2" | "J-1" | "J-J";
export type PreracePlanByDay = Record<PreraceDay, PreraceFood[]>;
export type PreracePlansByWeight = Record<number, PreracePlanByDay>;

export const PRERACE_WEIGHT_BUCKETS: number[] = [55, 56, 57, 60, 64, 68, 70, 72, 78];

export function closestWeightBucket(weightKg: number): number {
  if (!weightKg || isNaN(weightKg)) return 70;
  let best = PRERACE_WEIGHT_BUCKETS[0];
  let bestDist = Math.abs(weightKg - best);
  for (const w of PRERACE_WEIGHT_BUCKETS) {
    const d = Math.abs(weightKg - w);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  }
  return best;
}

export const PRERACE_PLANS: PreracePlansByWeight = {
  "55": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "PAIN COMPLET",
        "qty": "60 grammes = 2 tranches",
        "tip": "Privilégier le pan complet ou aux céréales"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "200 grammes",
        "tip": "Privilégiuer le fromage blanc 3% MG"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CONFITURE",
        "qty": "20 grammes",
        "tip": "Privilégier la confiture la plus riche en fruit."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120g crus (250g riz; 360g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "40 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "PAIN COMPLET",
        "qty": "60 grammes = 2 tranches",
        "tip": "Privilégier le pan complet ou aux céréales"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "200 grammes",
        "tip": "Privilégiuer le fromage blanc 3% MG"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CONFITURE",
        "qty": "20 grammes",
        "tip": "Privilégier la confiture la plus riche en fruit."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120g crus (250g riz; 360g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "40 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-2": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "100 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "PAIN COMPLET",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pan complet ou aux céréales"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CONFITURE",
        "qty": "30 grammes",
        "tip": "Privilégier la confiture la plus riche en fruit."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 130g crus (270g riz; 390g pâtes cuits) // Patate douce ou Pommes de terre = 520g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 400ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner."
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "60 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-1": [
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "130 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "175 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"
      },
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs d'origine biologiques"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "50 grammes crus = 110 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "75 grammes crus = 160 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "100 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "56": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "TOFU OU OEUFS",
        "qty": "200 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "40 grammes dans 500ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner."
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 90g crus (200g riz ou 270g pâtes) // Patate douce ou Pommes de terre = 360g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "40 grammes dans 500ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "TOFU OU OEUFS",
        "qty": "200 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "40 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "MIEL",
        "qty": "15 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 90g crus (200g riz ou 270g pâtes) // Patate douce ou Pommes de terre = 360g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-2": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "TOFU OU OEUFS",
        "qty": "200 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "MIEL",
        "qty": "15 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 110g crus (230g riz ou 330g pâtes) // Patate douce ou Pommes de terre = 440g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "100 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-1": [
      {
        "food": "TOFU",
        "qty": "200 grammes",
        "tip": ""
      },
      {
        "food": "OEUF",
        "qty": "2 unités",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "OEUFS",
        "qty": "3 unités",
        "tip": "Privilégier les oeufs d'origine bio"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "50 grammes crus = 110 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "90 grammes crus = 270 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "80 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "57": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "100 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "15 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 100g crus (210g riz cuits) // Patate douce ou Pommes de terre = 400g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "40 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "100 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "40 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "15 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 100g crus (210g riz cuits) // Patate douce ou Pommes de terre = 400g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "40 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-2": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 7 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "100 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "15 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120g crus (240g riz cuits) // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 100g crus (210g riz cuits) // Patate douce ou Pommes de terre = 400g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "40 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-1": [
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"
      },
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs d'origine biologique"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "45 grammes crus = 100 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "65 grammes crus = 140 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "20 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "100 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "60": {
    "J-4": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "125 grammes",
        "tip": "Privilégier le 3% de MG"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "50 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120 g crus ou 260g cuits // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      }
    ],
    "J-3": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "40 grammes dans 500ml",
        "tip": "Soit sur l'entrainement ou alors 30 minutes après le repas du midi"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 140 g crus ou 320g cuits // Patate douce ou Pommes de terre = 560g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "40 grammes dans 500ml",
        "tip": "1H avant le coucher"
      }
    ],
    "J-2": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "60 grammes dans 600ml",
        "tip": "30 minutes après le repas"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150 g crus ou 360g cuits // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "60 grammes dans 600ml",
        "tip": "1H avant le coucher"
      }
    ],
    "J-1": [
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs biologique"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "250 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "80 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "125 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons maigres (colin, cabillaud)"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "Céréales = 50g crus ou 110g cuits",
        "tip": "Privilégier le riz basmati"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "Céréales = 70 g crus ou 160g cuits",
        "tip": "Privilégier le riz basmati"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier les compotes sans sucres ajoutés"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "64": {
    "J-4": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "125 grammes",
        "tip": "Privilégier le 3% de MG"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "50 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120 g crus ou 260g cuits // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      }
    ],
    "J-3": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "40 grammes dans 500ml",
        "tip": "Soit sur l'entrainement ou alors 30 minutes après le repas du midi"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 140 g crus ou 320g cuits // Patate douce ou Pommes de terre = 560g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "40 grammes dans 500ml",
        "tip": "1H avant le coucher"
      }
    ],
    "J-2": [
      {
        "food": "PAIN",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "8 grammes pour la viande et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "60 grammes dans 600ml",
        "tip": "30 minutes après le repas"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "125 grammes ou 3 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150 g crus ou 360g cuits // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "10 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "SHAKER MALTODEXTRINE",
        "qty": "60 grammes dans 600ml",
        "tip": "1H avant le coucher"
      }
    ],
    "J-1": [
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs biologique"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "250 grammes",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "70 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "80 grammes",
        "tip": "Privilégier les flocons d'avoine biologique"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "125 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons maigres (colin, cabillaud)"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "Céréales = 50g crus ou 110g cuits",
        "tip": "Privilégier le riz basmati"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "Céréales = 70 g crus ou 160g cuits",
        "tip": "Privilégier le riz basmati"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier les compotes sans sucres ajoutés"
      },
      {
        "food": "PUREE D'OLEAGINEUX",
        "qty": "20 grammes",
        "tip": "Choisir entre purée d'amande, beurre de cacahuète, ..."
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "200 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "68": {
    "J-4": [
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs d'origine biologique"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LAIT D'AVOINE",
        "qty": "100 grammes",
        "tip": "Possibilité de prendre du lait d'amande"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande ou le poisson",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "150 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "50 grammes",
        "tip": "Privilégier les flocons d'avoine biologique ou prendre de la farine"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "PAIN BLANC",
        "qty": "30 grammes",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (320g riz ou 450g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs d'origine biologique"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LAIT D'AVOINE",
        "qty": "100 grammes",
        "tip": "Possibilité de prendre du lait d'amande"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande ou le poisson",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "150 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "50 grammes",
        "tip": "Privilégier les flocons d'avoine biologique ou prendre de la farine"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "PAIN BLANC",
        "qty": "30 grammes",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (320g riz ou 450g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-2": [
      {
        "food": "OEUF",
        "qty": "1 unité",
        "tip": "Privilégier les oeufs d'origine biologique"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LAIT D'AVOINE",
        "qty": "100 grammes",
        "tip": "Possibilité de prendre du lait d'amande"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "7 grammes pour la viande ou le poisson et 8 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande ou le poisson",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "FROMAGE BLANC",
        "qty": "150 grammes",
        "tip": "Privilégier le fromage blanc 3% de MG"
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "50 grammes",
        "tip": "Privilégier les flocons d'avoine biologique ou prendre de la farine"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "PAIN BLANC",
        "qty": "60 grammes = 2 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (320g riz ou 450g pâtes cuits) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "50 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-1": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "150 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "WHEY PROTEINE",
        "qty": "30 grammes",
        "tip": "Privilégier la whey isolate ou native"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "110 grammes crus = 230 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "140 grammes crus = 300 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "60 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "300 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "70": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "30 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "YAOURT",
        "qty": "1 unité = 125 grammes",
        "tip": "Au choix"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (310g riz; 450g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "PAIN COMPLET",
        "qty": "1 tranche = 30 grammes",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau Le",
        "tip": "prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "100 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "PAIN",
        "qty": "4 tranches = 120 grammes",
        "tip": "Possibilité de prendre du pain complet ou blanc"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "30 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "YAOURT",
        "qty": "1 unité = 125 grammes",
        "tip": "Au choix"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (310g riz; 450g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "PAIN COMPLET",
        "qty": "1 tranche = 30 grammes",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "100 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "CONFITURE OU MIEL",
        "qty": "40 grammes",
        "tip": "Privilégier le miel d'acacia ou la confiture la plus riche en fruits"
      }
    ],
    "J-2": [
      {
        "food": "PAIN",
        "qty": "4 tranches = 120 grammes",
        "tip": "Possibilité de prendre du pain complet ou blanc"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "OLEAGINEUX",
        "qty": "30 grammes",
        "tip": "Choisir entre amandes, noix, noix de cajou, noisettes, noix du brésil..."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après la collation ou sur un entrainement"
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "150 grammes ou 4 oeufs",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "YAOURT",
        "qty": "1 unité = 125 grammes",
        "tip": "Au choix"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 150g crus (310g riz; 450g pâtes cuites) // Patate douce ou Pommes de terre = 600g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "PAIN COMPLET",
        "qty": "1 tranche = 30 grammes",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "50 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "100 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "CONFITURE OU MIEL",
        "qty": "40 grammes",
        "tip": "Privilégier le miel d'acacia ou la confiture la plus riche en fruits"
      }
    ],
    "J-1": [
      {
        "food": "WHEY",
        "qty": "30 grammes",
        "tip": "Privilégier la wxhey isolate ou native"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande et 10 grammes pour la patate douce",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "300 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "150 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "70 grammes crus = 150 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "130 grammes crus = 280 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "80 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "60 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "200 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "300 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  },
  "72": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "",
        "tip": ""
      },
      {
        "food": "PAIN DE MIE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande et 10 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HYDRATATION A BASE D'EAU",
        "qty": "",
        "tip": ""
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "LEGUMES",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 200g crus OU 600g cuits pâtes",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200ml",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "COMPOTE DE POMME SSA",
        "qty": "1 unité",
        "tip": "200ml"
      }
    ],
    "J-3": [
      {
        "food": "FRUIT",
        "qty": "",
        "tip": ""
      },
      {
        "food": "PAIN DE MIE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10grammespourla viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60grammesdans400mld'eau",
        "tip": ""
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HYDRATATION A BASE D'EAU",
        "qty": "",
        "tip": ""
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales =200gcrusOU600gcuits pâtes",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200ml",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60grammesdans400mld'eau",
        "tip": ""
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "COMPOTE DE POMME SSA",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HYDRATATION A BASE D'EAU",
        "qty": "1 unité",
        "tip": "800ml"
      }
    ],
    "J-2": [
      {
        "food": "FRUIT",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales =200gcrus OU 600gcuits pâtes",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "PAIN DE MIE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 400 ml d'eau",
        "tip": ""
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HYDRATATION A BASE D'EAU",
        "qty": "",
        "tip": ""
      },
      {
        "food": "VIANDES OU POISSON OU OEUFS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales =200g crus OU 600g cuits pâtes",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200ml",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 400mld'eau",
        "tip": ""
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 400ml d'eau",
        "tip": ""
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "COMPOTE DE POMME SSA",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HYDRATATION A BASE D'EAU",
        "qty": "1 unité",
        "tip": "800ml"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      }
    ],
    "J-1": [
      {
        "food": "MIEL",
        "qty": "",
        "tip": ""
      },
      {
        "food": "VIANDES BLANCHES OU POISSON BLANC",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FRUIT",
        "qty": "",
        "tip": ""
      },
      {
        "food": "OEUFS",
        "qty": "",
        "tip": ""
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "",
        "tip": ""
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FLOCON D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "ESCALOPE DE DINDE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FRUIT",
        "qty": "1 unité",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "",
        "tip": ""
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200ml",
        "tip": "Privilégier le lait d'amande ou d'avoine"
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "",
        "tip": ""
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "",
        "tip": ""
      },
      {
        "food": "BEURRE DE CACAHUETE",
        "qty": "200ml",
        "tip": "Privilégier le lait d'avoine ou d'amande"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      }
    ],
    "J-J": []
  },
  "78": {
    "J-4": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FROMAGE",
        "qty": "30 grammes",
        "tip": ""
      },
      {
        "food": "PAIN BLANC",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande et 10 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "200 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CONFITURE",
        "qty": "30 grammes",
        "tip": "Privilégier la confiture avec le plus de fruits dans la compo."
      },
      {
        "food": "PAIN BLANC",
        "qty": "30 grammes = 1 tranche",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 110g crus (330G riz;375g pâtes cuits) // Patate douce ou Pommes de terre = 440g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 110g crus (330g riz;275g pâtes cuits) // Patate douce ou Pommes de terre = 440g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "SAUCE TOMATE",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "60 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-3": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FROMAGE",
        "qty": "30 grammes",
        "tip": ""
      },
      {
        "food": "PAIN BLANC",
        "qty": "90 grammes = 3 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande et 10 grammes pour les légumes",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner."
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "200 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "LEGUMES",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CONFITURE",
        "qty": "30 grammes",
        "tip": "Privilégier la confiture avec le plus de fruits dans la compo."
      },
      {
        "food": "PAIN BLANC",
        "qty": "60 grammes = 2 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 120g crus (360g riz;300g pâtes cuits) // Patate douce ou Pommes de terre = 480g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "SAUCE TOMATE",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 1H avant le coucher"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "60 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      }
    ],
    "J-2": [
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le miel d'acacia"
      },
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "FROMAGE",
        "qty": "30 grammes",
        "tip": ""
      },
      {
        "food": "PAIN BLANC",
        "qty": "120 grammes = 4 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "300 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le petit déjeuner."
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "150 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "200 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet, steack 5%) - 1 poisson gras max par semaine"
      },
      {
        "food": "CONFITURE",
        "qty": "40 grammes",
        "tip": "Privilégier la confiture avec le plus de fruits dans la compo."
      },
      {
        "food": "PAIN BLANC",
        "qty": "60 grammes = 2 tranches",
        "tip": "Privilégier le pain blanc type baguette"
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 130g crus (390g riz;325g pâtes cuits) // Patate douce ou Pommes de terre = 520g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "FECULENTS",
        "qty": "Céréales = 140g crus (420g riz;350g pâtes cuits) // Patate douce ou Pommes de terre = 560g cuit",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "SAUCE TOMATE",
        "qty": "100 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "10 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "MALTODEXTRINE",
        "qty": "60 grammes dans 600ml d'eau",
        "tip": "Le prendre 30 minutes après le déjeuner"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "90 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "300 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-1": [
      {
        "food": "FRUIT",
        "qty": "1 unité = 150 grammes",
        "tip": "Privilégier les fruits de saison et biologiques."
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande et 10 grammes sur les patates douces",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "HUILE D'OLIVE",
        "qty": "10 grammes pour la viande",
        "tip": "Privilégier l'huile d'olive biologique et pressée à froid"
      },
      {
        "food": "LAIT VEGETAL",
        "qty": "200 grammes",
        "tip": "Privilégier le lait d'avoine ou le lait d'amande"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "VIANDES OU POISSON",
        "qty": "200 grammes",
        "tip": "Privilégier les viandes maigres (dinde, poulet) ou les poissons blancs (colin, cabillaud, lieu)"
      },
      {
        "food": "MIEL",
        "qty": "20 grammes",
        "tip": "Privilégier le mile d'acacia"
      },
      {
        "food": "RIZ BASMATI",
        "qty": "80 grammes crus = 240 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "RIZ BASMATI",
        "qty": "120 grammes crus = 360 grammes cuits",
        "tip": "Privilégier le riz basmati, les pâtes semi-complètes, de la patate douce."
      },
      {
        "food": "CHOCOLAT NOIR",
        "qty": "20 grammes",
        "tip": "Privilégier le chocolat 70% de cacao"
      },
      {
        "food": "FLOCONS D'AVOINE",
        "qty": "80 grammes",
        "tip": "Priviligier les flocons d'avoine biologique sans gluten"
      },
      {
        "food": "COMPOTE DE POMME",
        "qty": "100 grammes",
        "tip": "Privilégier de la compote sans sucres ajoutés"
      },
      {
        "food": "PATATE DOUCE ECRASEE",
        "qty": "300 grammes",
        "tip": "Privilégier les produits de saison et biologique."
      }
    ],
    "J-J": []
  }
};

export type PreraceBreakfast = {
  nom: string;
  description: string;
  items: PreraceFood[];
};

// 3 race-morning breakfast options (J-J). Quantities scale with weight bucket.
export function preraceBreakfastOptionsFor(weight: number): PreraceBreakfast[] {
  const bucket = closestWeightBucket(weight);
  const flocons = Math.round(bucket * 1.4);
  const pain = Math.max(2, Math.round(bucket / 25));
  const malto = Math.round(bucket * 0.9);
  const compote = bucket < 60 ? 130 : bucket < 70 ? 150 : 180;

  return [
    {
      nom: "Option 1 - Porridge salé/sucré",
      description: "Préparation digeste, riche en glucides à index modéré",
      items: [
        { food: "Flocons d'avoine", qty: flocons + " g", tip: "Cuits dans lait végétal (avoine ou amande)" },
        { food: "Lait végétal", qty: "200 ml", tip: "Avoine ou amande, sans sucre ajouté" },
        { food: "Miel d'acacia", qty: "20 g", tip: "Pour sucrer" },
        { food: "Compote de pomme", qty: compote + " g", tip: "Sans sucre ajouté" },
        { food: "Pain blanc grillé", qty: pain + " tranche(s)", tip: "+ miel / confiture" },
      ],
    },
    {
      nom: "Option 2 - Pancakes maltodextrine",
      description: "Charge glucidique liquide + solide, très bien tolérée",
      items: [
        { food: "Flocons d'avoine mixés", qty: flocons + " g", tip: "En farine pour pancakes" },
        { food: "Lait végétal", qty: "150 ml", tip: "" },
        { food: "Banane mûre écrasée", qty: "1 unité", tip: "Bien mûre pour digestibilité" },
        { food: "Miel", qty: "15 g", tip: "Sur les pancakes" },
        { food: "Maltodextrine", qty: malto + " g dans 500 ml d'eau", tip: "À siroter 1h30 avant le départ" },
      ],
    },
    {
      nom: "Option 3 - Riz au lait digeste",
      description: "Idéale en cas de stress digestif ou départ très tôt",
      items: [
        { food: "Riz au lait", qty: Math.round(bucket * 2.5) + " g", tip: "Préparé maison la veille" },
        { food: "Compote de pomme", qty: compote + " g", tip: "Sans sucre ajouté" },
        { food: "Pain blanc + miel", qty: pain + " tranche(s)", tip: "Tranches fines" },
        { food: "Banane mûre", qty: "1 unité", tip: "Optionnel selon faim" },
        { food: "Maltodextrine", qty: Math.round(malto * 0.7) + " g dans 400 ml d'eau", tip: "À siroter 1h30 avant le départ" },
      ],
    },
  ];
}
