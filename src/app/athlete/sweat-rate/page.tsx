"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { mockSweatSessions } from "@/lib/mock-data";
import { calculateSweat, getSweatInterpretation, formatDate, round } from "@/lib/utils";
import { Droplets, Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SweatRatePage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    session_date: format(new Date(), "yyyy-MM-dd"),
    exercise_type: "",
    duration_min: "",
    weight_before_kg: "",
    weight_after_kg: "",
    fluid_intake_ml: "0",
    urine_ml: "0",
    temperature_c: "",
    humidity_pct: "",
    avg_hr: "",
  });

  const preview =
    form.weight_before_kg && form.weight_after_kg && form.duration_min
      ? calculateSweat({
          weight_before_kg: parseFloat(form.weight_before_kg),
          weight_after_kg: parseFloat(form.weight_after_kg),
          fluid_intake_ml: parseInt(form.fluid_intake_ml) || 0,
          urine_ml: parseInt(form.urine_ml) || 0,
          duration_min: parseInt(form.duration_min),
        })
      : null;

  const sessions = [...mockSweatSessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  const avgSweatRate = Math.round(
    sessions.reduce((s, e) => s + (e.sweat_rate_ml_h || 0), 0) / sessions.length
  );

  const barData = sessions.map((s) => ({
    date: format(new Date(s.session_date), "d MMM", { locale: fr }),
    taux: s.sweat_rate_ml_h,
    type: s.exercise_type,
  }));

  const scatterData = sessions
    .filter((s) => s.temperature_c)
    .map((s) => ({
      temp: s.temperature_c,
      taux: s.sweat_rate_ml_h,
    }));

  const lastSession = sessions[0];
  const lastInterp = lastSession?.sweat_rate_ml_h
    ? getSweatInterpretation(lastSession.sweat_rate_ml_h)
    : null;

  return (
    <div>
      <Topbar
        title="Taux de sudation"
        subtitle="Calcul et suivi de tes pertes hydriques à l'effort"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouvelle séance
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Taux moyen", value: `${avgSweatRate}`, unit: "mL/h" },
          { label: "Dernière séance", value: `${lastSession?.sweat_rate_ml_h}`, unit: "mL/h" },
          { label: "Perte de masse", value: `${lastSession?.mass_loss_pct?.toFixed(1)}`, unit: "%" },
          { label: "Séances analysées", value: `${sessions.length}`, unit: "séances" },
        ].map(({ label, value, unit }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">{label}</span>
            <span className="stat-value text-[var(--color-primary)]">{value}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{unit}</span>
          </motion.div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            Nouvelle mesure de sudation
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {[
              { key: "session_date", label: "Date", type: "date" },
              { key: "exercise_type", label: "Type d'exercice", type: "text", placeholder: "Trail, Running, Vélo..." },
              { key: "duration_min", label: "Durée (min)", type: "number", placeholder: "90" },
              { key: "weight_before_kg", label: "Poids avant (kg)", type: "number", placeholder: "68.4" },
              { key: "weight_after_kg", label: "Poids après (kg)", type: "number", placeholder: "67.2" },
              { key: "fluid_intake_ml", label: "Liquide bu (mL)", type: "number", placeholder: "500" },
              { key: "urine_ml", label: "Urines (mL)", type: "number", placeholder: "0" },
              { key: "temperature_c", label: "Température (°C)", type: "number", placeholder: "22" },
              { key: "humidity_pct", label: "Humidité (%)", type: "number", placeholder: "65" },
              { key: "avg_hr", label: "FC moyenne (bpm)", type: "number", placeholder: "150" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input"
                />
              </div>
            ))}
          </div>

          {/* Preview calcul */}
          {preview && (
            <div className="card-2 mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Taux de sudation</p>
                <p className={`text-xl font-bold font-display ${getSweatInterpretation(preview.sweat_rate_ml_h).color}`}>
                  {preview.sweat_rate_ml_h} mL/h
                </p>
                <p className="text-xs mt-0.5">{getSweatInterpretation(preview.sweat_rate_ml_h).label}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Perte de masse</p>
                <p className={`text-xl font-bold font-display ${preview.mass_loss_pct > 2 ? "text-red-400" : preview.mass_loss_pct > 1 ? "text-amber-400" : "text-green-400"}`}>
                  {preview.mass_loss_pct.toFixed(1)}%
                </p>
                {preview.mass_loss_pct > 1 && (
                  <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {preview.mass_loss_pct > 2 ? "Déshydratation significative" : "Déshydratation légère"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Sudation totale</p>
                <p className="text-xl font-bold font-display text-blue-400">
                  {Math.round(preview.total_sweat_ml)} mL
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-primary">Enregistrer</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Barres par séance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Taux de sudation par séance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="mL/h" />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Bar dataKey="taux" name="Sudation" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Corrélation température */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Corrélation Température / Sudation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="temp" name="Température" unit="°C" tick={{ fontSize: 10 }} />
              <YAxis dataKey="taux" name="Sudation" unit="mL/h" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter
                data={scatterData}
                fill="#f97316"
                isAnimationActive
                animationDuration={800}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {scatterData.length < 2 && (
            <p className="text-xs text-center text-[var(--color-text-muted)] mt-2">
              Ajoutez plus de séances avec température pour voir la corrélation.
            </p>
          )}
        </motion.div>
      </div>

      {/* Tableau historique */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h3 className="font-semibold font-display text-sm mb-4">Historique des séances</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exercice</th>
                <th>Durée</th>
                <th>Poids avant/après</th>
                <th>Taux sudation</th>
                <th>Perte masse</th>
                <th>Temp.</th>
                <th>Interprétation</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const interp = s.sweat_rate_ml_h ? getSweatInterpretation(s.sweat_rate_ml_h) : null;
                return (
                  <tr key={s.id}>
                    <td>{formatDate(s.session_date)}</td>
                    <td>{s.exercise_type}</td>
                    <td>{s.duration_min} min</td>
                    <td>
                      {s.weight_before_kg}→{s.weight_after_kg} kg
                    </td>
                    <td className="font-bold font-mono">{s.sweat_rate_ml_h} mL/h</td>
                    <td className={s.mass_loss_pct && s.mass_loss_pct > 1 ? "text-amber-400 font-semibold" : ""}>
                      {s.mass_loss_pct?.toFixed(1)}%
                    </td>
                    <td>{s.temperature_c ? `${s.temperature_c}°C` : "—"}</td>
                    <td className={interp?.color}>{interp?.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recommandation personnalisée */}
        <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <p className="text-xs font-semibold text-blue-400 mb-1">
            💧 Recommandation d'hydratation en course (basée sur tes données)
          </p>
          <p className="text-sm text-[var(--color-text)]">
            Selon ton taux moyen de <strong>{avgSweatRate} mL/h</strong>, vise{" "}
            <strong className="text-blue-400">{Math.round(avgSweatRate * 0.8)}–{Math.round(avgSweatRate * 1.0)} mL/h</strong>{" "}
            par temps tempéré et jusqu'à{" "}
            <strong className="text-blue-400">{Math.round(avgSweatRate * 1.2)} mL/h</strong>{" "}
            par forte chaleur. Ne dépasse pas 800–1000 mL/h pour éviter l'hyponatrémie.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
