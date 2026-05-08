-- NUTRIOCUS — Schema Supabase PostgreSQL
-- Coller ce SQL dans l'éditeur SQL de votre projet Supabase

-- ==========================================
-- TABLES PRINCIPALES
-- ==========================================

-- COACHS
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATHLÈTES
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  coach_id UUID REFERENCES coaches(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  sport TEXT[],
  level TEXT CHECK (level IN ('loisir', 'amateur_confirme', 'semi_elite', 'elite')),
  birth_date DATE,
  height_cm NUMERIC,
  blood_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- QUESTIONNAIRE
CREATE TABLE IF NOT EXISTS questionnaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  sport_years INTEGER,
  weekly_hours NUMERIC,
  profession TEXT,
  family_status TEXT,
  deep_motivation TEXT,
  goal_a TEXT,
  goal_b TEXT,
  goal_3years TEXT,
  fears TEXT,
  strengths TEXT,
  improvements TEXT,
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  resting_hr INTEGER,
  medical_followup TEXT,
  meals_per_day INTEGER,
  first_meal_time TEXT,
  daily_diet TEXT,
  favorite_foods TEXT,
  avoided_foods TEXT,
  daily_hydration NUMERIC,
  caffeine_habit TEXT,
  alcohol_habit TEXT,
  training_nutrition TEXT,
  digestive_issues TEXT,
  what_worked TEXT,
  what_didnt TEXT,
  pre_race_protocol TEXT,
  current_supplements TEXT,
  supplement_side_effects TEXT,
  considered_supplements TEXT,
  hemoglobin NUMERIC,
  hematocrit NUMERIC,
  ferritin NUMERIC,
  vitamin_d NUMERIC,
  zinc NUMERIC,
  magnesium NUMERIC,
  crp NUMERIC,
  tsh NUMERIC,
  testosterone NUMERIC,
  blood_test_date DATE,
  coach_blood_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUIVI CORPOREL
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  body_fat_pct NUMERIC,
  fat_mass_kg NUMERIC GENERATED ALWAYS AS (ROUND((weight_kg * body_fat_pct / 100)::NUMERIC, 2)) STORED,
  lean_mass_kg NUMERIC GENERATED ALWAYS AS (ROUND((weight_kg * (1 - body_fat_pct / 100))::NUMERIC, 2)) STORED,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  thigh_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRE
CREATE TABLE IF NOT EXISTS ire_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  sport TEXT NOT NULL,
  performance NUMERIC NOT NULL,
  avg_hr INTEGER NOT NULL,
  max_hr INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  ire_value NUMERIC NOT NULL,
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFIL PHYSIOLOGIQUE
CREATE TABLE IF NOT EXISTS physiological_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  max_hr INTEGER NOT NULL,
  resting_hr INTEGER,
  vo2max NUMERIC NOT NULL,
  sv1_pct_vo2 NUMERIC NOT NULL,
  sv2_pct_vo2 NUMERIC NOT NULL,
  rer_sv1 NUMERIC NOT NULL,
  rer_sv2 NUMERIC NOT NULL,
  max_power_w NUMERIC,
  vo2_sv1 NUMERIC,
  vo2_sv2 NUMERIC,
  coach_notes TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPLÉMENTS
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  timing TEXT NOT NULL,
  category TEXT CHECK (category IN ('recommended', 'effort_only', 'monitor', 'personal')),
  coach_recommendation BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLANS ALIMENTAIRES
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  phase TEXT CHECK (phase IN ('charge_glucidique', 'base', 'affutage', 'recuperation')),
  week_start DATE,
  content JSONB NOT NULL DEFAULT '{}',
  coach_notes TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('plan_alim', 'strategie_course', 'cr_consultation', 'replay_consultation', 'autre')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTES DE COURSES
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  phase TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  distance_km NUMERIC,
  elevation_m NUMERIC,
  type TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('A', 'B', 'C')),
  goal_time TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'dns', 'dnf')),
  actual_time TEXT,
  finish_position TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STRATÉGIES DE COURSE
CREATE TABLE IF NOT EXISTS race_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id),
  title TEXT NOT NULL,
  pre_race TEXT,
  during_race TEXT,
  post_race TEXT,
  products_used JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUITS EFFORT
CREATE TABLE IF NOT EXISTS effort_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gel', 'boisson', 'solide', 'complement')),
  carbs_per_unit NUMERIC,
  glucose_fructose_ratio TEXT,
  caffeine_mg NUMERIC DEFAULT 0,
  sodium_mg NUMERIC DEFAULT 0,
  tolerance_score INTEGER CHECK (tolerance_score BETWEEN 1 AND 10),
  status TEXT DEFAULT 'testing' CHECK (status IN ('validated', 'testing', 'eliminated', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TESTS PRODUITS
CREATE TABLE IF NOT EXISTS product_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('glucides_tolerance', 'sodium', 'hydrique', 'simulation_course')),
  target_carbs_per_hour NUMERIC,
  protocol TEXT,
  result TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARNET D'ÉNERGIE
CREATE TABLE IF NOT EXISTS energy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  energy_score INTEGER NOT NULL CHECK (energy_score BETWEEN 1 AND 10),
  tags TEXT[] DEFAULT '{}',
  free_notes TEXT,
  coach_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, logged_date)
);

-- TAUX DE SUDATION
CREATE TABLE IF NOT EXISTS sweat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  exercise_type TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  weight_before_kg NUMERIC NOT NULL,
  weight_after_kg NUMERIC NOT NULL,
  fluid_intake_ml INTEGER NOT NULL DEFAULT 0,
  urine_ml INTEGER DEFAULT 0,
  temperature_c NUMERIC,
  humidity_pct NUMERIC,
  avg_hr INTEGER,
  sweat_rate_ml_h NUMERIC,
  mass_loss_pct NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPTES RENDUS
CREATE TABLE IF NOT EXISTS race_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id),
  race_name TEXT NOT NULL,
  race_date DATE NOT NULL,
  distance_km NUMERIC,
  finish_time TEXT,
  ranking TEXT,
  nutrition_during TEXT,
  energy_by_phase TEXT,
  overall_assessment TEXT,
  what_worked TEXT,
  what_to_improve TEXT,
  coach_feedback TEXT,
  coach_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLANIFICATION HEBDO
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  phase TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  coach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALCULS ÉNERGIE COURSE
CREATE TABLE IF NOT EXISTS race_energy_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  weight_kg NUMERIC,
  distance_km NUMERIC,
  estimated_duration_h NUMERIC,
  target_intensity_pct NUMERIC,
  vo2max NUMERIC,
  rer NUMERIC,
  total_kcal INTEGER,
  kcal_per_min NUMERIC,
  total_carbs_g INTEGER,
  total_fat_g INTEGER,
  glycogen_stores_g INTEGER,
  exogenous_carbs_needed_g INTEGER,
  carbs_per_hour_g INTEGER,
  recommended_hydration_ml_h INTEGER
);

-- RECETTES
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('avant_effort', 'pendant_effort', 'recuperation', 'quotidien')),
  prep_time_min INTEGER,
  kcal INTEGER,
  carbs_g NUMERIC,
  protein_g NUMERIC,
  fat_g NUMERIC,
  ingredients JSONB DEFAULT '[]',
  steps JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULES FORMATION
CREATE TABLE IF NOT EXISTS formation_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program TEXT NOT NULL CHECK (program IN ('bases_nutrition', 'endurance_nutrition')),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  video_url TEXT,
  pdf_url TEXT,
  duration_min INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESSION FORMATION
CREATE TABLE IF NOT EXISTS athlete_formation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  module_id UUID REFERENCES formation_modules(id),
  progress_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, module_id)
);

-- GPTs
CREATE TABLE IF NOT EXISTS gpts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  url TEXT NOT NULL,
  category TEXT CHECK (category IN ('analyse', 'nutrition', 'performance', 'strategie')),
  highlight BOOLEAN DEFAULT FALSE,
  energy_threshold INTEGER,
  order_index INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ire_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE physiological_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE effort_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sweat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_energy_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_formation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Politique athlètes : voir ses propres données
CREATE POLICY "athlete_own_data" ON body_measurements
  FOR ALL USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "coach_all_athletes_body" ON body_measurements
  FOR ALL USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE coach_id IN (
        SELECT id FROM coaches WHERE user_id = auth.uid()
      )
    )
  );

-- (Répéter pour toutes les tables — pattern identique)

-- GPTs : lecture publique pour les athlètes authentifiés
CREATE POLICY "gpts_read" ON gpts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Recettes : lecture publique
CREATE POLICY "recipes_read" ON recipes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Formation modules : lecture publique
CREATE POLICY "formation_read" ON formation_modules
  FOR SELECT USING (auth.uid() IS NOT NULL);
