"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { mockPhysiologicalProfile } from "@/lib/mock-data";
import { calculateRaceEnergy, round, interpolateRER } from "@/lib/utils";
import { Flame, Info, Save } from "lucide-react";

export default function RaceEnergyPage() {
  const [form, setForm] = useState({
    weight_kg: mockPhysiologicalProfile.weight_kg,
    distance_km: 80,
    duration_h: 14,
    intensity_pct: 72,
    vo2max: mockPhysiologicalProfile.vo2max,
    rer: 0.88,
  });

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  // RER auto-calculé selon intensité et profil
  const autoRER = interpolateRER(
    form.intensity_pct,
    mockPhysiologicalProfile.sv1_pct_vo2,
    mockPhysiologicalProfile.sv2_pct_vo2,
    mockPhysiologicalProfile.rer_sv1,
    mockPhysiologicalProfile.rer_sv2
  );

  const result = calculateRaceEnergy(form);

  const pieData = [
    {
      name: "Glycogène endogène",
      value: Math.min(result.total_carbs_g, result.glycogen_stores_g),
      color: "#059669",
    },
    {
      name: "Glucides exogènes nécessaires",
      value: result.exogenous_carbs_needed_g,
      color: "#f97316",
    },
    {
      name: "Lipides",
      value: result.total_fat_g,
      color: "#3b82f6",
    },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <Topbar
        title="Dépenses énergétiques en course"
        subtitle="Calcul des besoins nutritionnels pour ta prochaine compétition"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Paramètres */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Paramètres de la course
          </h3>

          <div className="space-y-3">
            {[
              { key: "weight_kg", label: "Poids (kg)", step: "0.1" },
              { key: "distance_km", label: "Distance (km)", step: "1" },
              { key: "duration_h", label: "Durée estimée (h)", step: "0.25" },
              { key: "vo2max", label: "VO₂max (mL/kg/min)", step: "0.5" },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  step={step}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
            ))}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Intensité cible (% VO₂max)</label>
                <span className="text-sm font-bold text-[var(--color-primary)]">{form.intensity_pct}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={form.intensity_pct}
                onChange={(e) => handleChange("intensity_pct", e.target.value)}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                <span>Récup (40%)</span>
                <span>VO₂max (100%)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">RER à l'intensité cible</label>
                <button
                  className="text-xs text-[var(--color-primary)] underline"
                  onClick={() => handleChange("rer", autoRER.toFixed(3))}
                >
                  Auto ({round(autoRER, 3)})
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.7"
                max="1.0"
                value={form.rer}
                onChange={(e) => handleChange("rer", e.target.value)}
                className="input text-sm py-2"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                0.7 = 100% lipides · 1.0 = 100% glucides
              </p>
            </div>
          </div>
        </motion.div>

        {/* Résultats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card lg:col-span-2"
        >
          <h3 className="font-semibold font-display text-sm mb-5">Résultats</h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Dépense totale", value: result.total_kcal.toLocaleString("fr-FR"), unit: "kcal" },
              { label: "Dépense/min", value: result.kcal_per_min, unit: "kcal/min" },
              { label: "Glucides totaux", value: result.total_carbs_g, unit: "g" },
              { label: "Lipides totaux", value: result.total_fat_g, unit: "g" },
              { label: "Réserves glycogène", value: result.glycogen_stores_g, unit: "g (estimé)" },
              { label: "Glucides exogènes", value: result.exogenous_carbs_needed_g, unit: "g nécessaires" },
              { label: "Glucides/heure", value: result.carbs_per_hour_g, unit: "g/h conseillés" },
              { label: "Hydratation cible", value: `${result.hydration_ml_h_min}–${result.hydration_ml_h_max}`, unit: "mL/h" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="card-2">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-bold font-display text-[var(--color-primary)]">{value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{unit}</p>
              </div>
            ))}
          </div>

          {/* Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
                Répartition des sources d'énergie
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={800}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                    formatter={(value: number) => [`${value} g`, ""]}
                  />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recommandations */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
                Recommandations
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 shrink-0">🔋</span>
                  <p className="text-[var(--color-text-muted)]">
                    Vise <strong className="text-green-400">{result.carbs_per_hour_g} g de glucides/heure</strong> — soit ~{Math.ceil(result.carbs_per_hour_g / 40)} gels de 40g par heure.
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-blue-400 shrink-0">💧</span>
                  <p className="text-[var(--color-text-muted)]">
                    Hydrate-toi entre <strong className="text-blue-400">{result.hydration_ml_h_min}–{result.hydration_ml_h_max} mL/h</strong>. Ajuste selon la chaleur.
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-orange-400 shrink-0">⚡</span>
                  <p className="text-[var(--color-text-muted)]">
                    Tes réserves de glycogène <strong className="text-orange-400">({result.glycogen_stores_g} g)</strong> couvrent{" "}
                    {result.glycogen_stores_g >= result.total_carbs_g ? "toute" : `${Math.round((result.glycogen_stores_g / result.total_carbs_g) * 100)}%`} de la dépense glucidique.
                  </p>
                </div>
                {result.exogenous_carbs_needed_g > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 shrink-0">🚨</span>
                    <p className="text-[var(--color-text-muted)]">
                      Il te manquera <strong className="text-red-400">{result.exogenous_carbs_needed_g} g</strong> de glucides — l'apport exogène est indispensable.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button className="btn-primary">
              <Save className="w-4 h-4" />
              Sauvegarder le calcul
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
