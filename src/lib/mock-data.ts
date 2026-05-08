import { format, subDays, subMonths } from "date-fns";

export const mockAthlete = {
  id: "athlete-1",
  user_id: "user-1",
  coach_id: "coach-1",
  first_name: "Thomas",
  last_name: "Dupont",
  email: "thomas@example.com",
  sport: ["trail", "running"] as const,
  level: "amateur_confirme" as const,
  birth_date: "1989-03-15",
  height_cm: 178,
  blood_type: "A+",
  created_at: new Date().toISOString(),
  status: "active" as const,
};

export const mockBodyMeasurements = Array.from({ length: 6 }, (_, i) => ({
  id: `bm-${i}`,
  athlete_id: "athlete-1",
  measured_at: format(subMonths(new Date(), 5 - i), "yyyy-MM-dd"),
  weight_kg: 68.4 + (Math.random() - 0.5) * 2,
  body_fat_pct: 12.5 - i * 0.3 + (Math.random() - 0.5),
  fat_mass_kg: null,
  lean_mass_kg: null,
  waist_cm: 78 + (Math.random() - 0.5) * 2,
  hip_cm: 94 + (Math.random() - 0.5),
  thigh_cm: 55 + (Math.random() - 0.5),
  notes: null,
  created_at: new Date().toISOString(),
})).map((m) => ({
  ...m,
  fat_mass_kg: Math.round((m.weight_kg * m.body_fat_pct) / 100 * 10) / 10,
  lean_mass_kg: Math.round((m.weight_kg * (1 - m.body_fat_pct / 100)) * 10) / 10,
}));

export const mockEnergyLog = Array.from({ length: 30 }, (_, i) => ({
  id: `el-${i}`,
  athlete_id: "athlete-1",
  logged_date: format(subDays(new Date(), 29 - i), "yyyy-MM-dd"),
  energy_score: Math.max(3, Math.min(10, 7 + Math.round((Math.random() - 0.5) * 4))),
  tags: ["sommeil_bon", "entrainement_intense", "bonne_hydratation"].slice(
    0,
    Math.floor(Math.random() * 3)
  ),
  free_notes: i % 5 === 0 ? "Bonne séance ce matin" : null,
  coach_response: null,
  created_at: new Date().toISOString(),
}));

export const mockIREMeasurements = [
  { id: "ire-1", athlete_id: "athlete-1", measured_at: format(subMonths(new Date(), 4), "yyyy-MM-dd"), sport: "trail" as const, performance: 10.2, avg_hr: 158, max_hr: 185, weight_kg: 69.2, ire_value: 0.84, session_notes: "Sortie endurance longue", created_at: new Date().toISOString() },
  { id: "ire-2", athlete_id: "athlete-1", measured_at: format(subMonths(new Date(), 3), "yyyy-MM-dd"), sport: "trail" as const, performance: 10.8, avg_hr: 162, max_hr: 185, weight_kg: 68.8, ire_value: 0.88, session_notes: null, created_at: new Date().toISOString() },
  { id: "ire-3", athlete_id: "athlete-1", measured_at: format(subMonths(new Date(), 2), "yyyy-MM-dd"), sport: "trail" as const, performance: 11.1, avg_hr: 160, max_hr: 185, weight_kg: 68.4, ire_value: 0.91, session_notes: "Test SV1", created_at: new Date().toISOString() },
  { id: "ire-4", athlete_id: "athlete-1", measured_at: format(subMonths(new Date(), 1), "yyyy-MM-dd"), sport: "running" as const, performance: 12.5, avg_hr: 155, max_hr: 185, weight_kg: 68.0, ire_value: 0.93, session_notes: null, created_at: new Date().toISOString() },
  { id: "ire-5", athlete_id: "athlete-1", measured_at: format(new Date(), "yyyy-MM-dd"), sport: "trail" as const, performance: 11.4, avg_hr: 158, max_hr: 185, weight_kg: 67.8, ire_value: 0.95, session_notes: "Record perso", created_at: new Date().toISOString() },
];

export const mockRaces = [
  { id: "race-1", athlete_id: "athlete-1", name: "Maxi Race Annecy", date: "2026-06-14", distance_km: 110, elevation_m: 6500, type: "trail" as const, priority: "A" as const, goal_time: "22:00:00", status: "upcoming" as const, actual_time: null, finish_position: null, notes: "Objectif A de la saison", created_at: new Date().toISOString() },
  { id: "race-2", athlete_id: "athlete-1", name: "Trail du Mont Blanc 80K", date: "2026-08-28", distance_km: 80, elevation_m: 4600, type: "trail" as const, priority: "B" as const, goal_time: "14:00:00", status: "upcoming" as const, actual_time: null, finish_position: null, notes: null, created_at: new Date().toISOString() },
  { id: "race-3", athlete_id: "athlete-1", name: "Semi-marathon Lyon", date: "2026-04-05", distance_km: 21.1, elevation_m: 150, type: "running" as const, priority: "C" as const, goal_time: "1:28:00", status: "completed" as const, actual_time: "1:31:24", finish_position: "187/2340", notes: "Bon indicateur forme", created_at: new Date().toISOString() },
  { id: "race-4", athlete_id: "athlete-1", name: "Skyrhune", date: "2025-10-11", distance_km: 23, elevation_m: 2200, type: "trail" as const, priority: "B" as const, goal_time: "3:30:00", status: "completed" as const, actual_time: "3:22:15", finish_position: "45/800", notes: null, created_at: new Date().toISOString() },
  { id: "race-5", athlete_id: "athlete-1", name: "Marathon Paris", date: "2026-04-06", distance_km: 42.2, elevation_m: 200, type: "running" as const, priority: "C" as const, goal_time: "3:15:00", status: "upcoming" as const, actual_time: null, finish_position: null, notes: null, created_at: new Date().toISOString() },
  { id: "race-6", athlete_id: "athlete-1", name: "UTMB CCC", date: "2026-09-02", distance_km: 101, elevation_m: 6100, type: "trail" as const, priority: "A" as const, goal_time: "20:00:00", status: "upcoming" as const, actual_time: null, finish_position: null, notes: "Wildcard obtenue", created_at: new Date().toISOString() },
];

export const mockPhysiologicalProfile = {
  id: "physio-1",
  athlete_id: "athlete-1",
  test_date: "2026-02-15",
  weight_kg: 68.4,
  max_hr: 185,
  resting_hr: 48,
  vo2max: 62,
  sv1_pct_vo2: 65,
  sv2_pct_vo2: 83,
  rer_sv1: 0.85,
  rer_sv2: 0.95,
  max_power_w: 320,
  vo2_sv1: 40.3,
  vo2_sv2: 51.5,
  coach_notes: "Très bon profil lipidique. À travailler : résistance au seuil 2.",
  is_current: true,
  created_at: new Date().toISOString(),
};

export const mockSupplements = [
  { id: "sup-1", athlete_id: "athlete-1", name: "Magnésium bisglycinate", dose: "300 mg", timing: "Soir", category: "recommended" as const, coach_recommendation: true, start_date: "2026-01-01", end_date: null, notes: "Améliore la qualité du sommeil", active: true, created_at: new Date().toISOString() },
  { id: "sup-2", athlete_id: "athlete-1", name: "Vitamine D3", dose: "2000 UI", timing: "Matin avec repas gras", category: "recommended" as const, coach_recommendation: true, start_date: "2025-10-01", end_date: "2026-04-01", notes: "Période hivernale", active: true, created_at: new Date().toISOString() },
  { id: "sup-3", athlete_id: "athlete-1", name: "Beta-alanine", dose: "3.2 g", timing: "Avant séance intense", category: "effort_only" as const, coach_recommendation: true, start_date: "2026-02-01", end_date: null, notes: "Phase de chargement 4 semaines", active: true, created_at: new Date().toISOString() },
  { id: "sup-4", athlete_id: "athlete-1", name: "Caféine", dose: "200 mg", timing: "J-1h course A", category: "effort_only" as const, coach_recommendation: false, start_date: null, end_date: null, notes: "Personnel", active: true, created_at: new Date().toISOString() },
  { id: "sup-5", athlete_id: "athlete-1", name: "Créatine monohydrate", dose: "5 g", timing: "Post-entraînement", category: "monitor" as const, coach_recommendation: false, start_date: null, end_date: null, notes: "À surveiller sur les indices rénaux", active: false, created_at: new Date().toISOString() },
];

export const mockEffortProducts = [
  { id: "ep-1", athlete_id: "athlete-1", name: "SiS Beta Fuel Gel", type: "gel" as const, carbs_per_unit: 40, glucose_fructose_ratio: "1:0.8", caffeine_mg: 0, sodium_mg: 60, tolerance_score: 9, status: "validated" as const, notes: "Excellent, pas de troubles digestifs", created_at: new Date().toISOString() },
  { id: "ep-2", athlete_id: "athlete-1", name: "Maurten Drink Mix 320", type: "boisson" as const, carbs_per_unit: 80, glucose_fructose_ratio: "0.8:1", caffeine_mg: 0, sodium_mg: 500, tolerance_score: 8, status: "validated" as const, notes: "Pour efforts > 3h", created_at: new Date().toISOString() },
  { id: "ep-3", athlete_id: "athlete-1", name: "GU Energy Gel Caféine", type: "gel" as const, carbs_per_unit: 22, glucose_fructose_ratio: "2:1", caffeine_mg: 40, sodium_mg: 55, tolerance_score: 7, status: "testing" as const, notes: "Test en cours sur séances longues", created_at: new Date().toISOString() },
  { id: "ep-4", athlete_id: "athlete-1", name: "Spring Energy Canaberry", type: "solide" as const, carbs_per_unit: 45, glucose_fructose_ratio: "N/A", caffeine_mg: 0, sodium_mg: 180, tolerance_score: 6, status: "testing" as const, notes: "Trop épais par temps froid", created_at: new Date().toISOString() },
  { id: "ep-5", athlete_id: "athlete-1", name: "Gel générique supermarché", type: "gel" as const, carbs_per_unit: 25, glucose_fructose_ratio: "100:0", caffeine_mg: 0, sodium_mg: 10, tolerance_score: 3, status: "eliminated" as const, notes: "Douleurs abdominales > 1h d'effort", created_at: new Date().toISOString() },
];

export const mockSweatSessions = [
  { id: "sw-1", athlete_id: "athlete-1", session_date: format(subDays(new Date(), 45), "yyyy-MM-dd"), exercise_type: "Trail long", duration_min: 180, weight_before_kg: 68.4, weight_after_kg: 66.8, fluid_intake_ml: 1200, urine_ml: 0, temperature_c: 22, humidity_pct: 65, avg_hr: 145, sweat_rate_ml_h: 933, mass_loss_pct: 2.3, notes: null, created_at: new Date().toISOString() },
  { id: "sw-2", athlete_id: "athlete-1", session_date: format(subDays(new Date(), 30), "yyyy-MM-dd"), exercise_type: "Vélo route", duration_min: 120, weight_before_kg: 68.1, weight_after_kg: 67.2, fluid_intake_ml: 800, urine_ml: 0, temperature_c: 18, humidity_pct: 55, avg_hr: 150, sweat_rate_ml_h: 850, mass_loss_pct: 1.3, notes: null, created_at: new Date().toISOString() },
  { id: "sw-3", athlete_id: "athlete-1", session_date: format(subDays(new Date(), 14), "yyyy-MM-dd"), exercise_type: "Running intensité", duration_min: 75, weight_before_kg: 67.9, weight_after_kg: 67.1, fluid_intake_ml: 400, urine_ml: 0, temperature_c: 26, humidity_pct: 70, avg_hr: 168, sweat_rate_ml_h: 1040, mass_loss_pct: 1.2, notes: "Temps chaud", created_at: new Date().toISOString() },
  { id: "sw-4", athlete_id: "athlete-1", session_date: format(subDays(new Date(), 3), "yyyy-MM-dd"), exercise_type: "Trail intensité", duration_min: 90, weight_before_kg: 68.2, weight_after_kg: 67.0, fluid_intake_ml: 600, urine_ml: 0, temperature_c: 14, humidity_pct: 60, avg_hr: 162, sweat_rate_ml_h: 1000, mass_loss_pct: 1.8, notes: null, created_at: new Date().toISOString() },
];

export const mockFormationModules = [
  // Programme 1
  { id: "fm-1", program: "bases_nutrition" as const, title: "Fondamentaux nutritionnels", description: "Glucides, protéines, lipides, micronutriments — comprendre les bases.", order_index: 1, video_url: null, pdf_url: null, duration_min: 25, created_at: new Date().toISOString() },
  { id: "fm-2", program: "bases_nutrition" as const, title: "Énergie au quotidien", description: "Comment gérer son énergie et optimiser sa récupération.", order_index: 2, video_url: null, pdf_url: null, duration_min: 20, created_at: new Date().toISOString() },
  { id: "fm-3", program: "bases_nutrition" as const, title: "Avant l'effort", description: "Charge glucidique, timing des repas, protocoles pré-compétition.", order_index: 3, video_url: null, pdf_url: null, duration_min: 22, created_at: new Date().toISOString() },
  { id: "fm-4", program: "bases_nutrition" as const, title: "Récupération", description: "Fenêtre anabolique, nutrition post-effort, sommeil et régénération.", order_index: 4, video_url: null, pdf_url: null, duration_min: 18, created_at: new Date().toISOString() },
  // Programme 2
  { id: "fm-5", program: "endurance_nutrition" as const, title: "Physiologie endurance", description: "VO₂max, seuils ventilatoires, filières énergétiques.", order_index: 1, video_url: null, pdf_url: null, duration_min: 30, created_at: new Date().toISOString() },
  { id: "fm-6", program: "endurance_nutrition" as const, title: "Glucides en course", description: "Timing, produits, ratio glucose/fructose, tolérances.", order_index: 2, video_url: null, pdf_url: null, duration_min: 28, created_at: new Date().toISOString() },
  { id: "fm-7", program: "endurance_nutrition" as const, title: "Hydratation & sodium", description: "Besoins hydriques, sweat rate, pertes sodiques, stratégies.", order_index: 3, video_url: null, pdf_url: null, duration_min: 24, created_at: new Date().toISOString() },
  { id: "fm-8", program: "endurance_nutrition" as const, title: "Supplémentation sport", description: "Preuves scientifiques, timing, interactions, ce qui marche vraiment.", order_index: 4, video_url: null, pdf_url: null, duration_min: 26, created_at: new Date().toISOString() },
  { id: "fm-9", program: "endurance_nutrition" as const, title: "Stratégie compétition", description: "De J-3 à J+3 : le protocole complet race day.", order_index: 5, video_url: null, pdf_url: null, duration_min: 35, created_at: new Date().toISOString() },
];

export const mockFormationProgress = [
  { id: "fp-1", athlete_id: "athlete-1", module_id: "fm-1", progress_pct: 100, completed: true, last_watched_at: subDays(new Date(), 10).toISOString(), created_at: new Date().toISOString() },
  { id: "fp-2", athlete_id: "athlete-1", module_id: "fm-2", progress_pct: 100, completed: true, last_watched_at: subDays(new Date(), 8).toISOString(), created_at: new Date().toISOString() },
  { id: "fp-3", athlete_id: "athlete-1", module_id: "fm-3", progress_pct: 60, completed: false, last_watched_at: subDays(new Date(), 2).toISOString(), created_at: new Date().toISOString() },
  { id: "fp-4", athlete_id: "athlete-1", module_id: "fm-4", progress_pct: 0, completed: false, last_watched_at: null, created_at: new Date().toISOString() },
  { id: "fp-5", athlete_id: "athlete-1", module_id: "fm-5", progress_pct: 100, completed: true, last_watched_at: subDays(new Date(), 15).toISOString(), created_at: new Date().toISOString() },
  { id: "fp-6", athlete_id: "athlete-1", module_id: "fm-6", progress_pct: 45, completed: false, last_watched_at: subDays(new Date(), 5).toISOString(), created_at: new Date().toISOString() },
];

export const mockGPTs = [
  { id: "g-1", name: "Analyse du risque mécanique", icon: "🦴", description: "Évalue tes risques de blessure selon ton volume, ton historique et ta biomécanique.", category: "analyse" as const, highlight: false, energy_threshold: null, url: "#", order_index: 1, active: true, created_at: new Date().toISOString() },
  { id: "g-2", name: "Analyse du risque neuromusculaire", icon: "⚡", description: "Détecte les signaux de surcharge neuromusculaire et propose des ajustements.", category: "analyse" as const, highlight: false, energy_threshold: null, url: "#", order_index: 2, active: true, created_at: new Date().toISOString() },
  { id: "g-3", name: "Analyse de la durabilité", icon: "📈", description: "Analyse ta capacité à maintenir l'allure et la puissance sur longue distance.", category: "analyse" as const, highlight: false, energy_threshold: null, url: "#", order_index: 3, active: true, created_at: new Date().toISOString() },
  { id: "g-4", name: "Diagnostic pré-course 360", icon: "🎯", description: "Checklist complète J-48h : nutrition, sommeil, équipement, météo, état physique.", category: "strategie" as const, highlight: false, energy_threshold: null, url: "#", order_index: 4, active: true, created_at: new Date().toISOString() },
  { id: "g-5", name: "Analyse de ta course", icon: "📊", description: "Colle ton compte rendu — analyse ta gestion nutritionnelle et physiologique.", category: "analyse" as const, highlight: false, energy_threshold: null, url: "#", order_index: 5, active: true, created_at: new Date().toISOString() },
  { id: "g-6", name: "Chef NUTRIOCUS — Créateur de recettes", icon: "👨‍🍳", description: "Dis-lui ta phase nutritionnelle et ce que tu as dans ton frigo.", category: "nutrition" as const, highlight: false, energy_threshold: null, url: "#", order_index: 6, active: true, created_at: new Date().toISOString() },
  { id: "g-7", name: "Ton Diététicien NUTRIOCUS de poche", icon: "👩‍⚕️", description: "Questions nutritionnelles au quotidien, analyse de repas, conseils personnalisés.", category: "nutrition" as const, highlight: false, energy_threshold: null, url: "#", order_index: 7, active: true, created_at: new Date().toISOString() },
  { id: "g-8", name: "Ai-je un déficit énergétique ?", icon: "⚠️", description: "Analyse tes apports vs tes besoins. Identifie les déficits et propose des ajustements concrets.", category: "nutrition" as const, highlight: true, energy_threshold: 5, url: "#", order_index: 8, active: true, created_at: new Date().toISOString() },
  { id: "g-9", name: "Stratégie de pacing pour le trail", icon: "🏔️", description: "Génère ta stratégie d'allure complète selon le profil (distance, D+, T°, objectif temps).", category: "strategie" as const, highlight: false, energy_threshold: null, url: "#", order_index: 9, active: true, created_at: new Date().toISOString() },
];

export const mockRecipes = [
  { id: "r-1", title: "Porridge de charge glucidique", category: "avant_effort" as const, prep_time_min: 10, kcal: 520, carbs_g: 95, protein_g: 15, fat_g: 8, ingredients: [{ name: "Flocons d'avoine", quantity: "100", unit: "g" }, { name: "Lait demi-écrémé", quantity: "300", unit: "mL" }, { name: "Banane", quantity: "1", unit: "grande" }, { name: "Miel", quantity: "2", unit: "c. à soupe" }, { name: "Raisins secs", quantity: "30", unit: "g" }], steps: ["Faire chauffer le lait", "Ajouter les flocons, cuire 5min en remuant", "Ajouter banane écrasée + miel + raisins", "Servir chaud"], tags: ["glucides", "facile", "rapide"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
  { id: "r-2", title: "Galettes riz sport (à faire soi-même)", category: "pendant_effort" as const, prep_time_min: 30, kcal: 250, carbs_g: 50, protein_g: 6, fat_g: 3, ingredients: [{ name: "Riz japonais", quantity: "200", unit: "g cuit" }, { name: "Parmesan", quantity: "20", unit: "g" }, { name: "Œuf", quantity: "1", unit: "pièce" }, { name: "Sel", quantity: "1", unit: "pincée" }], steps: ["Mélanger riz refroidi, parmesan, œuf, sel", "Former des galettes", "Cuire à la poêle 3min par côté", "Envelopper dans alu pour transport"], tags: ["course", "solide", "naturel"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
  { id: "r-3", title: "Bowl récup saumon & quinoa", category: "recuperation" as const, prep_time_min: 20, kcal: 580, carbs_g: 65, protein_g: 42, fat_g: 14, ingredients: [{ name: "Quinoa", quantity: "80", unit: "g sec" }, { name: "Saumon fumé", quantity: "120", unit: "g" }, { name: "Edamame", quantity: "80", unit: "g" }, { name: "Avocat", quantity: "0.5", unit: "pièce" }, { name: "Sauce tamari", quantity: "2", unit: "c. à soupe" }], steps: ["Cuire quinoa 15min", "Disposer tous les ingrédients en bowl", "Arroser de tamari"], tags: ["récupération", "protéines", "oméga3"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
  { id: "r-4", title: "Pancakes protéinés patate douce", category: "quotidien" as const, prep_time_min: 25, kcal: 380, carbs_g: 55, protein_g: 22, fat_g: 7, ingredients: [{ name: "Patate douce", quantity: "150", unit: "g cuite" }, { name: "Œufs", quantity: "2", unit: "pièces" }, { name: "Flocons d'avoine", quantity: "40", unit: "g" }, { name: "Protéine vanille", quantity: "30", unit: "g" }], steps: ["Mixer patate douce + œufs", "Ajouter flocons + protéine", "Cuire à la poêle 2min/côté"], tags: ["quotidien", "protéines", "glucides"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
  { id: "r-5", title: "Boisson isotonique maison citron", category: "pendant_effort" as const, prep_time_min: 5, kcal: 80, carbs_g: 20, protein_g: 0, fat_g: 0, ingredients: [{ name: "Eau", quantity: "500", unit: "mL" }, { name: "Jus citron", quantity: "1", unit: "citron" }, { name: "Miel", quantity: "1", unit: "c. à soupe" }, { name: "Sel", quantity: "0.5", unit: "c. à café" }], steps: ["Mélanger tous les ingrédients", "Bien secouer"], tags: ["boisson", "isotonique", "naturel"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
  { id: "r-6", title: "Smoothie récup myrtilles-banane", category: "recuperation" as const, prep_time_min: 5, kcal: 310, carbs_g: 52, protein_g: 18, fat_g: 4, ingredients: [{ name: "Myrtilles", quantity: "100", unit: "g" }, { name: "Banane", quantity: "1", unit: "pièce" }, { name: "Lait", quantity: "200", unit: "mL" }, { name: "Protéine chocolat", quantity: "25", unit: "g" }], steps: ["Tout mixer jusqu'à consistance lisse", "Consommer dans les 30 min post-effort"], tags: ["récupération", "antioxydants", "rapide"], is_ai_generated: true, image_url: null, created_at: new Date().toISOString() },
];
