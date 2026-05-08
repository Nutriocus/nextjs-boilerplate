-- NUTRIOCUS — Données de test (seed)
-- À exécuter APRÈS le schema.sql dans Supabase

-- ==========================================
-- COACH DE DÉMO
-- ==========================================
INSERT INTO coaches (id, name, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Coach NUTRIOCUS', 'coach@nutriocus.com')
ON CONFLICT DO NOTHING;

-- ==========================================
-- ATHLÈTES DE DÉMO (sans user_id pour l'instant)
-- ==========================================
INSERT INTO athletes (id, coach_id, first_name, last_name, email, sport, level, birth_date, height_cm, blood_type, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Thomas', 'Dupont', 'thomas@example.com', ARRAY['trail', 'running'], 'amateur_confirme', '1989-03-15', 178, 'A+', 'active'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Marie', 'Lambert', 'marie@example.com', ARRAY['triathlon'], 'semi_elite', '1992-07-22', 165, 'O+', 'active'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Lucas', 'Bernard', 'lucas@example.com', ARRAY['cyclisme'], 'amateur_confirme', '1987-11-08', 181, 'B+', 'active')
ON CONFLICT DO NOTHING;

-- ==========================================
-- PROFILS PHYSIOLOGIQUES
-- ==========================================
INSERT INTO physiological_profile (athlete_id, test_date, weight_kg, max_hr, resting_hr, vo2max, sv1_pct_vo2, sv2_pct_vo2, rer_sv1, rer_sv2, max_power_w, is_current, coach_notes) VALUES
  ('11111111-1111-1111-1111-111111111111', '2026-02-15', 68.4, 185, 48, 62, 65, 83, 0.85, 0.95, 320, true, 'Très bon profil lipidique. À travailler : résistance au seuil 2.'),
  ('22222222-2222-2222-2222-222222222222', '2026-01-20', 59.2, 192, 52, 56, 62, 80, 0.83, 0.93, 250, true, 'Bonne économie de course. Axe de travail : natation technique.'),
  ('33333333-3333-3333-3333-333333333333', '2026-03-01', 72.1, 178, 45, 68, 70, 86, 0.86, 0.96, 380, true, 'Excellent rapport puissance/poids. VO2max en progression.')
ON CONFLICT DO NOTHING;

-- ==========================================
-- MESURES CORPORELLES (5 mois)
-- ==========================================
INSERT INTO body_measurements (athlete_id, measured_at, weight_kg, body_fat_pct, waist_cm, hip_cm, thigh_cm) VALUES
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '5 months', 70.2, 14.1, 80, 95, 56),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 months', 69.5, 13.5, 79, 94.5, 55.5),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 months', 69.0, 13.0, 78.5, 94, 55),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 months', 68.7, 12.5, 78, 94, 55),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 month', 68.4, 12.1, 77.5, 93.5, 54.5),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 67.8, 11.8, 77, 93, 54)
ON CONFLICT DO NOTHING;

-- ==========================================
-- IRE MEASUREMENTS (5 entrées)
-- ==========================================
INSERT INTO ire_measurements (athlete_id, measured_at, sport, performance, avg_hr, max_hr, weight_kg, ire_value, session_notes) VALUES
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 months', 'trail', 10.2, 158, 185, 69.2, 0.84, 'Sortie endurance longue'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 months', 'trail', 10.8, 162, 185, 68.8, 0.88, NULL),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 months', 'trail', 11.1, 160, 185, 68.4, 0.91, 'Test SV1'),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 month', 'running', 12.5, 155, 185, 68.0, 0.93, NULL),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'trail', 11.4, 158, 185, 67.8, 0.95, 'Record perso')
ON CONFLICT DO NOTHING;

-- ==========================================
-- ÉNERGIE LOG (30 jours)
-- ==========================================
INSERT INTO energy_log (athlete_id, logged_date, energy_score, tags)
SELECT
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - (30 - gs)::int,
  GREATEST(3, LEAST(10, 7 + FLOOR(RANDOM() * 5 - 2)::int)),
  CASE WHEN gs % 3 = 0 THEN ARRAY['sommeil_bon', 'bonne_hydratation'] ELSE ARRAY['entrainement_intense'] END
FROM generate_series(0, 29) AS gs
ON CONFLICT DO NOTHING;

-- ==========================================
-- COURSES
-- ==========================================
INSERT INTO races (athlete_id, name, date, distance_km, elevation_m, type, priority, goal_time, status, actual_time, finish_position, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Maxi Race Annecy', '2026-06-14', 110, 6500, 'trail', 'A', '22:00:00', 'upcoming', NULL, NULL, 'Objectif A de la saison'),
  ('11111111-1111-1111-1111-111111111111', 'Trail du Mont Blanc 80K', '2026-08-28', 80, 4600, 'trail', 'B', '14:00:00', 'upcoming', NULL, NULL, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Semi-marathon Lyon', '2026-04-05', 21.1, 150, 'running', 'C', '1:28:00', 'completed', '1:31:24', '187/2340', 'Bon indicateur forme'),
  ('11111111-1111-1111-1111-111111111111', 'Skyrhune', '2025-10-11', 23, 2200, 'trail', 'B', '3:30:00', 'completed', '3:22:15', '45/800', NULL),
  ('11111111-1111-1111-1111-111111111111', 'UTMB CCC', '2026-09-02', 101, 6100, 'trail', 'A', '20:00:00', 'upcoming', NULL, NULL, 'Wildcard obtenue')
ON CONFLICT DO NOTHING;

-- ==========================================
-- COMPLÉMENTS
-- ==========================================
INSERT INTO supplements (athlete_id, name, dose, timing, category, coach_recommendation, notes, active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Magnésium bisglycinate', '300 mg', 'Soir', 'recommended', true, 'Améliore qualité du sommeil', true),
  ('11111111-1111-1111-1111-111111111111', 'Vitamine D3', '2000 UI', 'Matin avec repas gras', 'recommended', true, 'Période hivernale', true),
  ('11111111-1111-1111-1111-111111111111', 'Beta-alanine', '3.2 g', 'Avant séance intense', 'effort_only', true, 'Phase de chargement 4 semaines', true),
  ('11111111-1111-1111-1111-111111111111', 'Caféine', '200 mg', 'J-1h course A', 'effort_only', false, 'Personnel', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- SÉANCES SUDATION
-- ==========================================
INSERT INTO sweat_sessions (athlete_id, session_date, exercise_type, duration_min, weight_before_kg, weight_after_kg, fluid_intake_ml, urine_ml, temperature_c, humidity_pct, avg_hr, sweat_rate_ml_h, mass_loss_pct) VALUES
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '45 days', 'Trail long', 180, 68.4, 66.8, 1200, 0, 22, 65, 145, 933, 2.3),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '30 days', 'Vélo route', 120, 68.1, 67.2, 800, 0, 18, 55, 150, 850, 1.3),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '14 days', 'Running intensité', 75, 67.9, 67.1, 400, 0, 26, 70, 168, 1040, 1.2),
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', 'Trail intensité', 90, 68.2, 67.0, 600, 0, 14, 60, 162, 1000, 1.8)
ON CONFLICT DO NOTHING;

-- ==========================================
-- MODULES DE FORMATION
-- ==========================================
INSERT INTO formation_modules (id, program, title, description, order_index, duration_min) VALUES
  ('fm000001-0000-0000-0000-000000000001', 'bases_nutrition', 'Fondamentaux nutritionnels', 'Glucides, protéines, lipides, micronutriments — comprendre les bases.', 1, 25),
  ('fm000001-0000-0000-0000-000000000002', 'bases_nutrition', 'Énergie au quotidien', 'Comment gérer son énergie et optimiser sa récupération.', 2, 20),
  ('fm000001-0000-0000-0000-000000000003', 'bases_nutrition', 'Avant l'effort', 'Charge glucidique, timing des repas, protocoles pré-compétition.', 3, 22),
  ('fm000001-0000-0000-0000-000000000004', 'bases_nutrition', 'Récupération', 'Fenêtre anabolique, nutrition post-effort, sommeil et régénération.', 4, 18),
  ('fm000001-0000-0000-0000-000000000005', 'endurance_nutrition', 'Physiologie endurance', 'VO₂max, seuils ventilatoires, filières énergétiques.', 1, 30),
  ('fm000001-0000-0000-0000-000000000006', 'endurance_nutrition', 'Glucides en course', 'Timing, produits, ratio glucose/fructose, tolérances.', 2, 28),
  ('fm000001-0000-0000-0000-000000000007', 'endurance_nutrition', 'Hydratation & sodium', 'Besoins hydriques, sweat rate, pertes sodiques, stratégies.', 3, 24),
  ('fm000001-0000-0000-0000-000000000008', 'endurance_nutrition', 'Supplémentation sport', 'Preuves scientifiques, timing, interactions.', 4, 26),
  ('fm000001-0000-0000-0000-000000000009', 'endurance_nutrition', 'Stratégie compétition', 'De J-3 à J+3 : le protocole complet race day.', 5, 35)
ON CONFLICT DO NOTHING;

-- ==========================================
-- GPTs
-- ==========================================
INSERT INTO gpts (name, icon, description, category, highlight, energy_threshold, url, order_index) VALUES
  ('Analyse du risque mécanique', '🦴', 'Évalue tes risques de blessure selon ton volume, ton historique et ta biomécanique.', 'analyse', false, NULL, '#', 1),
  ('Analyse du risque neuromusculaire', '⚡', 'Détecte les signaux de surcharge neuromusculaire et propose des ajustements.', 'analyse', false, NULL, '#', 2),
  ('Analyse de la durabilité', '📈', 'Analyse ta capacité à maintenir l allure et la puissance sur longue distance.', 'analyse', false, NULL, '#', 3),
  ('Diagnostic pré-course 360', '🎯', 'Checklist complète J-48h : nutrition, sommeil, équipement, météo, état physique.', 'strategie', false, NULL, '#', 4),
  ('Analyse de ta course', '📊', 'Colle ton compte rendu — analyse ta gestion nutritionnelle et physiologique.', 'analyse', false, NULL, '#', 5),
  ('Chef NUTRIOCUS — Créateur de recettes', '👨‍🍳', 'Dis-lui ta phase nutritionnelle et ce que tu as dans ton frigo.', 'nutrition', false, NULL, '#', 6),
  ('Ton Diététicien NUTRIOCUS de poche', '👩‍⚕️', 'Questions nutritionnelles au quotidien, analyse de repas, conseils personnalisés.', 'nutrition', false, NULL, '#', 7),
  ('Ai-je un déficit énergétique ?', '⚠️', 'Analyse tes apports vs tes besoins. Identifie les déficits et propose des ajustements concrets.', 'nutrition', true, 5, '#', 8),
  ('Stratégie de pacing pour le trail', '🏔️', 'Génère ta stratégie d allure complète selon le profil (distance, D+, T°, objectif temps).', 'strategie', false, NULL, '#', 9)
ON CONFLICT DO NOTHING;
