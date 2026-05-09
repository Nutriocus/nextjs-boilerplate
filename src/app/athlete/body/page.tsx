"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { mockBodyMeasurements, mockIREMeasurements } from "@/lib/mock-data";
import { calculateIRE, formatDate, round, SPORT_LABELS } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Scale, TrendingUp, Plus, Info } from "lucide-react";

const SPORT_OPTIONS = [
  { value: "trail", label: "Trail / Running" },
  { value: "cyclisme", label: "Cyclisme" },
];

function IRETip({ value }: { value: number }) {
  if (value >= 1.0) return <span className="text-green-400 text-xs font-semibold">Excellent 🟢</span>;
  if (value >= 0.8) return <span className="text-amber-400 text-xs font-semibold">Bon 🟡</span>;
  return <span className="text-red-400 text-xs font-semibold">Modéré 🔴</span>;
}

export default function BodyPage() {
  const [showIREForm, setShowIREForm] = useState(false);
  const [showBodyForm, setShowBodyForm] = useState(false);

  // Calcul IRE live
  const [ireForm, setIREForm] = useState({
    sport: "trail",
    performance: "",
    avg_hr: "",
    max_hr: "185",
    weight_kg: "68.4",
  });
  const irePreview =
    ireForm.performance && ireForm.avg_hr && ireForm.max_hr && ireForm.weight_kg
      ? calculateIRE(
          ireForm.sport,
          parseFloat(ireForm.performance),
          parseInt(ireForm.avg_hr),
          parseInt(ireForm.max_hr),
          parseFloat(ireForm.weight_kg)
        )
      : null;

  // Chart data
  const bodyChartData = mockBodyMeasurements.map((m) => ({
    date: format(new Date(m.measured_at), "MMM", { locale: fr }),
    poids: round(m.weight_kg),
    masse_grasse: round(m.fat_mass_kg || 0),
    masse_maigre: round(m.lean_mass_kg || 0),
    mg_pct: round(m.body_fat_pct || 0, 1),
  }));

  const ireChartData = mockIREMeasurements.map((m) => ({
    date: format(new Date(m.measured_at), "MMM", { locale: fr }),
    ire: m.ire_value,
    sport: SPORT_LABELS[m.sport],
  }));

  const lastMeasure = mockBodyMeasurements[mockBodyMeasurements.length - 1];
  const lastIRE = mockIREMeasurements[mockIREMeasurements.length - 1];

  return (
    <div>
      <Topbar
        title="Corps & IRE"
        subtitle="Suivi corporel et Indice de Rendement Énergétique"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowBodyForm(!showBodyForm)} className="btn-secondary">
              <Plus className="w-4 h-4" />
              Mesure corps
            </button>
            <button onClick={() => setShowIREForm(!showIREForm)} className="btn-primary">
              <TrendingUp className="w-4 h-4" />
              Ajouter IRE
            </button>
          </div>
        }
      />

      {/* Stats actuelles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Poids", value: `${lastMeasure?.weight_kg.toFixed(1)} kg`, sub: "Dernière mesure" },
          { label: "Masse grasse", value: `${lastMeasure?.body_fat_pct?.toFixed(1)}%`, sub: `${lastMeasure?.fat_mass_kg?.toFixed(1)} kg` },
          { label: "Masse maigre", value: `${lastMeasure?.lean_mass_kg?.toFixed(1)} kg`, sub: "Muscle + os + eau" },
          { label: "IRE actuel", value: lastIRE?.ire_value.toFixed(2) || "—", sub: SPORT_LABELS[lastIRE?.sport || "trail"] },
        ].map(({ label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">{label}</span>
            <span className="stat-value text-[var(--color-primary)]">{value}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Formulaire mesure corps */}
      {showBodyForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[var(--color-primary)]" />
            Nouvelle mesure corporelle
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "date", label: "Date", type: "date", placeholder: "" },
              { name: "weight_kg", label: "Poids (kg)", type: "number", placeholder: "68.4" },
              { name: "body_fat_pct", label: "Masse grasse (%)", type: "number", placeholder: "12.5" },
              { name: "waist_cm", label: "Tour de taille (cm)", type: "number", placeholder: "78" },
              { name: "hip_cm", label: "Tour de hanche (cm)", type: "number", placeholder: "94" },
              { name: "thigh_cm", label: "Tour de cuisse (cm)", type: "number", placeholder: "55" },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input type={type} placeholder={placeholder} className="input" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary">Enregistrer</button>
            <button onClick={() => setShowBodyForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Évolution poids */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Évolution du poids</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bodyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} unit="kg" />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--color-text)" }}
              />
              <Line
                type="monotone"
                dataKey="poids"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ fill: "var(--color-primary)", r: 4 }}
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Composition corporelle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Composition corporelle</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={bodyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="kg" />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="masse_maigre"
                name="Masse maigre"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                isAnimationActive
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="masse_grasse"
                name="Masse grasse"
                stackId="1"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.6}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Section IRE */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold font-display">Indice de Rendement Énergétique (IRE)</h3>
        </div>
        <div className="flex items-center gap-2 mb-5">
          <Info className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <p className="text-xs text-[var(--color-text-muted)]">
            IRE ≥ 1.0 = Excellent · 0.8–1.0 = Bon · &lt; 0.8 = Modéré
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ireChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 1.2]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
            />
            {/* Zone de référence */}
            <Bar dataKey="ire" name="IRE" fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>

        {/* Tableau IRE */}
        <div className="table-wrapper mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sport</th>
                <th>Performance</th>
                <th>FC moy</th>
                <th>FC max</th>
                <th>Poids</th>
                <th>IRE</th>
                <th>Niveau</th>
              </tr>
            </thead>
            <tbody>
              {mockIREMeasurements.slice().reverse().map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.measured_at)}</td>
                  <td>{SPORT_LABELS[m.sport]}</td>
                  <td>{m.performance} {(m.sport as string) === "cyclisme" ? "W" : "km/h"}</td>
                  <td>{m.avg_hr} bpm</td>
                  <td>{m.max_hr} bpm</td>
                  <td>{m.weight_kg} kg</td>
                  <td className="font-bold font-display">{m.ire_value.toFixed(2)}</td>
                  <td><IRETip value={m.ire_value} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Formulaire IRE */}
      {showIREForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
            Calculer & enregistrer un IRE
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Sport</label>
              <select
                className="input"
                value={ireForm.sport}
                onChange={(e) => setIREForm({ ...ireForm, sport: e.target.value })}
              >
                {SPORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                {ireForm.sport === "cyclisme" ? "Puissance (W)" : "Vitesse (km/h)"}
              </label>
              <input
                type="number"
                placeholder={ireForm.sport === "cyclisme" ? "250" : "11.5"}
                className="input"
                value={ireForm.performance}
                onChange={(e) => setIREForm({ ...ireForm, performance: e.target.value })}
              />
            </div>
            <div>
              <label className="label">FC moyenne (bpm)</label>
              <input
                type="number"
                placeholder="158"
                className="input"
                value={ireForm.avg_hr}
                onChange={(e) => setIREForm({ ...ireForm, avg_hr: e.target.value })}
              />
            </div>
            <div>
              <label className="label">FC max (bpm)</label>
              <input
                type="number"
                placeholder="185"
                className="input"
                value={ireForm.max_hr}
                onChange={(e) => setIREForm({ ...ireForm, max_hr: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Poids (kg)</label>
              <input
                type="number"
                placeholder="68.4"
                className="input"
                value={ireForm.weight_kg}
                onChange={(e) => setIREForm({ ...ireForm, weight_kg: e.target.value })}
              />
            </div>
          </div>

          {irePreview !== null && (
            <div className="card-2 mb-4 flex items-center gap-4">
              <div className="text-3xl font-bold font-display text-[var(--color-primary)]">
                {irePreview.toFixed(2)}
              </div>
              <div>
                <p className="font-semibold text-sm">IRE calculé</p>
                <IRETip value={irePreview} />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-primary" disabled={irePreview === null}>
              Enregistrer
            </button>
            <button onClick={() => setShowIREForm(false)} className="btn-ghost">
              Annuler
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
