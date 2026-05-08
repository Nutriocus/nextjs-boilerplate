export type Sport = "trail" | "triathlon" | "cyclisme" | "running";
export type Level = "loisir" | "amateur_confirme" | "semi_elite" | "elite";
export type Priority = "A" | "B" | "C";
export type RaceStatus = "upcoming" | "completed" | "dns" | "dnf";
export type NutritionalPhase =
  | "charge_glucidique"
  | "base"
  | "affutage"
  | "recuperation";

export interface Coach {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Athlete {
  id: string;
  user_id: string;
  coach_id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: Sport[];
  level: Level;
  birth_date?: string;
  height_cm?: number;
  blood_type?: string;
  created_at: string;
  status: "active" | "inactive";
}

export interface BodyMeasurement {
  id: string;
  athlete_id: string;
  measured_at: string;
  weight_kg: number;
  body_fat_pct?: number;
  fat_mass_kg?: number;
  lean_mass_kg?: number;
  waist_cm?: number;
  hip_cm?: number;
  thigh_cm?: number;
  notes?: string;
  created_at: string;
}

export interface IREMeasurement {
  id: string;
  athlete_id: string;
  measured_at: string;
  sport: Sport;
  performance: number;
  avg_hr: number;
  max_hr: number;
  weight_kg: number;
  ire_value: number;
  session_notes?: string;
  created_at: string;
}

export interface PhysiologicalProfile {
  id: string;
  athlete_id: string;
  test_date: string;
  weight_kg: number;
  max_hr: number;
  resting_hr?: number;
  vo2max: number;
  sv1_pct_vo2: number;
  sv2_pct_vo2: number;
  rer_sv1: number;
  rer_sv2: number;
  max_power_w?: number;
  vo2_sv1?: number;
  vo2_sv2?: number;
  coach_notes?: string;
  is_current: boolean;
  created_at: string;
}

export interface Supplement {
  id: string;
  athlete_id: string;
  name: string;
  dose: string;
  timing: string;
  category?: "recommended" | "effort_only" | "monitor" | "personal";
  coach_recommendation: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  active: boolean;
  created_at: string;
}

export interface MealPlan {
  id: string;
  athlete_id: string;
  title: string;
  phase?: NutritionalPhase;
  week_start?: string;
  content: Record<string, unknown>;
  coach_notes?: string;
  is_current: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  athlete_id: string;
  uploaded_by: string;
  type:
    | "plan_alim"
    | "strategie_course"
    | "cr_consultation"
    | "replay_consultation"
    | "autre";
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  athlete_id: string;
  title: string;
  phase?: string;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
}

export interface Race {
  id: string;
  athlete_id: string;
  name: string;
  date: string;
  distance_km?: number;
  elevation_m?: number;
  type?: Sport;
  priority: Priority;
  goal_time?: string;
  status: RaceStatus;
  actual_time?: string;
  finish_position?: string;
  notes?: string;
  created_at: string;
}

export interface RaceStrategy {
  id: string;
  athlete_id: string;
  race_id?: string;
  title: string;
  pre_race?: string;
  during_race?: string;
  post_race?: string;
  products_used?: ProductUsed[];
  notes?: string;
  created_at: string;
}

export interface ProductUsed {
  name: string;
  quantity: string;
  timing: string;
}

export interface EffortProduct {
  id: string;
  athlete_id: string;
  name: string;
  type: "gel" | "boisson" | "solide" | "complement";
  carbs_per_unit?: number;
  glucose_fructose_ratio?: string;
  caffeine_mg: number;
  sodium_mg: number;
  tolerance_score?: number;
  status: "validated" | "testing" | "eliminated" | "partial";
  notes?: string;
  created_at: string;
}

export interface ProductTest {
  id: string;
  athlete_id: string;
  test_date: string;
  test_type:
    | "glucides_tolerance"
    | "sodium"
    | "hydrique"
    | "simulation_course";
  target_carbs_per_hour?: number;
  protocol?: string;
  result?: string;
  status: "planned" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
}

export interface EnergyLog {
  id: string;
  athlete_id: string;
  logged_date: string;
  energy_score: number;
  tags: string[];
  free_notes?: string;
  coach_response?: string;
  created_at: string;
}

export interface SweatSession {
  id: string;
  athlete_id: string;
  session_date: string;
  exercise_type: string;
  duration_min: number;
  weight_before_kg: number;
  weight_after_kg: number;
  fluid_intake_ml: number;
  urine_ml: number;
  temperature_c?: number;
  humidity_pct?: number;
  avg_hr?: number;
  sweat_rate_ml_h?: number;
  mass_loss_pct?: number;
  notes?: string;
  created_at: string;
}

export interface RaceReport {
  id: string;
  athlete_id: string;
  race_id?: string;
  race_name: string;
  race_date: string;
  distance_km?: number;
  finish_time?: string;
  ranking?: string;
  nutrition_during?: string;
  energy_by_phase?: string;
  overall_assessment?: string;
  what_worked?: string;
  what_to_improve?: string;
  coach_feedback?: string;
  coach_validated: boolean;
  created_at: string;
}

export interface WeeklyPlan {
  id: string;
  athlete_id: string;
  week_start: string;
  phase?: string;
  content: Record<string, unknown>;
  coach_notes?: string;
  created_at: string;
}

export interface RaceEnergyCalculation {
  id: string;
  athlete_id: string;
  race_id?: string;
  calculated_at: string;
  weight_kg?: number;
  distance_km?: number;
  estimated_duration_h?: number;
  target_intensity_pct?: number;
  vo2max?: number;
  rer?: number;
  total_kcal?: number;
  kcal_per_min?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  glycogen_stores_g?: number;
  exogenous_carbs_needed_g?: number;
  carbs_per_hour_g?: number;
  recommended_hydration_ml_h?: number;
}

export interface Recipe {
  id: string;
  title: string;
  category:
    | "avant_effort"
    | "pendant_effort"
    | "recuperation"
    | "quotidien";
  prep_time_min?: number;
  kcal?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  ingredients?: RecipeIngredient[];
  steps?: string[];
  tags?: string[];
  is_ai_generated: boolean;
  image_url?: string;
  created_at: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface FormationModule {
  id: string;
  program: "bases_nutrition" | "endurance_nutrition";
  title: string;
  description?: string;
  order_index: number;
  video_url?: string;
  pdf_url?: string;
  duration_min?: number;
  created_at: string;
}

export interface AthleteFormationProgress {
  id: string;
  athlete_id: string;
  module_id: string;
  progress_pct: number;
  completed: boolean;
  last_watched_at?: string;
  created_at: string;
}

export interface GPT {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  url: string;
  category?: "analyse" | "nutrition" | "performance" | "strategie";
  highlight: boolean;
  energy_threshold?: number;
  order_index?: number;
  active: boolean;
  created_at: string;
}

export interface Questionnaire {
  id: string;
  athlete_id: string;
  sport_years?: number;
  weekly_hours?: number;
  profession?: string;
  family_status?: string;
  deep_motivation?: string;
  goal_a?: string;
  goal_b?: string;
  goal_3years?: string;
  fears?: string;
  strengths?: string;
  improvements?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  resting_hr?: number;
  medical_followup?: string;
  meals_per_day?: number;
  first_meal_time?: string;
  daily_diet?: string;
  favorite_foods?: string;
  avoided_foods?: string;
  daily_hydration?: number;
  caffeine_habit?: string;
  alcohol_habit?: string;
  training_nutrition?: string;
  digestive_issues?: string;
  what_worked?: string;
  what_didnt?: string;
  pre_race_protocol?: string;
  current_supplements?: string;
  supplement_side_effects?: string;
  considered_supplements?: string;
  hemoglobin?: number;
  hematocrit?: number;
  ferritin?: number;
  vitamin_d?: number;
  zinc?: number;
  magnesium?: number;
  crp?: number;
  tsh?: number;
  testosterone?: number;
  blood_test_date?: string;
  coach_blood_notes?: string;
  updated_at: string;
}

// Computed zone type for physiological calculations
export interface PhysiologicalZone {
  zone: number;
  name: string;
  pct_vo2: number;
  vo2: number;
  pct_fcmax: number;
  fc_cible: number;
  w_per_kg?: number;
  rer: number;
  pct_carbs: number;
  pct_lipids: number;
  kcal_per_min: number;
  kcal_per_h: number;
  g_carbs_per_min: number;
  g_lipids_per_min: number;
}

export type UserRole = "coach" | "athlete";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: Coach | Athlete;
}
