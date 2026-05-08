"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { mockPhysiologicalProfile } from "@/lib/mock-data";
import { calculateZones, formatDate } from "@/lib/utils";
import { Activity, Info } from "lucide-react";

const ZONE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#f97316", "#ef4444"];

export default function PhysiologicalPage() {
  const [profile, setProfile] = useState({
    weight_kg: mockPhysiologicalProfile.weight_kg,
    max_hr: mockPhysiologicalProfile.max_hr,
    resting_hr: mockPhysiologicalProfile.resting_hr || 48,
    vo2max: mockPhysiologicalProfile.vo2max,
    sv1_pct_vo2: mockPhysiologicalProfile.sv1_pct_vo2,
    sv2_pct_vo2: mockPhysiologicalProfile.sv2_pct_vo2,
    rer_sv1: mockPhysiologicalProfile.rer_sv1,
    rer_sv2: mockPhysiologicalProfile.rer_sv2,
    max_power_w: mockPhysiologicalProfile.max_power_w || 0,
  });

  const zones = calculateZones(profile);

  const zoneChartData = zones.map((z) => ({
    zone: `Z${z.zone}`,
    name: z.name,
    vo2: z.vo2,
    fc: z.fc_cible,
    rer: z.rer,
    glucides: z.pct_carbs,
    lipides: z.pct_lipids,
    g_carbs: z.g_carbs_per_min,
    g_lipids: z.g_lipids_per_min,
    kcal_h: z.kcal_per_h,
  }));

  function handleChange(key: string, value: string) {
    setProfile((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  return (
    <div>
      <Topbar
        title="Profil physiologique"
        subtitle={`Dernier test : ${formatDate(mockPhysiologicalProfile.test_date)}`}
      />

      {/* Données test */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "VO₂max", value: `${profile.vo2max}`, unit: "mL/kg/min" },
          { label: "FC max", value: `${profile.max_hr}`, unit: "bpm" },
          { label: "SV1", value: `${profile.sv1_pct_vo2}%`, unit: "VO₂max" },
          { label: "SV2", value: `${profile.sv2_pct_vo2}%`, unit: "VO₂max" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Paramètres modifiables */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            Paramètres (modifiables)
          </h3>
          <div className="space-y-3">
            {[
              { key: "weight_kg", label: "Poids (kg)", step: "0.1" },
              { key: "max_hr", label: "FC max (bpm)", step: "1" },
              { key: "resting_hr", label: "FC repos (bpm)", step: "1" },
              { key: "vo2max", label: "VO₂max (mL/kg/min)", step: "0.1" },
              { key: "sv1_pct_vo2", label: "SV1 (% VO₂max)", step: "1" },
              { key: "sv2_pct_vo2", label: "SV2 (% VO₂max)", step: "1" },
              { key: "rer_sv1", label: "RER au SV1", step: "0.01" },
              { key: "rer_sv2", label: "RER au SV2", step: "0.01" },
              { key: "max_power_w", label: "Puissance max vélo (W)", step: "1" },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  step={step}
                  value={profile[key as keyof typeof profile]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
            ))}
          </div>
          {mockPhysiologicalProfile.coach_notes && (
            <div className="mt-4 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-3">
              <p className="text-xs font-semibold text-[var(--color-primary)] mb-1">Note du coach</p>
              <p className="text-xs text-[var(--color-text-muted)]">{mockPhysiologicalProfile.coach_notes}</p>
            </div>
          )}
        </motion.div>

        {/* Tableau des zones */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card lg:col-span-2"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Zones d'entraînement</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Zone", "Nom", "% VO₂", "VO₂", "% FCmax", "FC", "W/kg", "RER", "% Gluc", "kcal/h", "g Gluc/min"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-surface-2)] first:rounded-tl-lg last:rounded-tr-lg">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z, i) => (
                  <tr key={z.zone} className="border-t border-[var(--color-border)]">
                    <td className="px-2 py-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: ZONE_COLORS[i] }}>
                        Z{z.zone}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[11px] whitespace-nowrap">{z.name}</td>
                    <td className="px-2 py-2.5 font-mono">{z.pct_vo2}%</td>
                    <td className="px-2 py-2.5 font-mono">{z.vo2}</td>
                    <td className="px-2 py-2.5 font-mono">{z.pct_fcmax}%</td>
                    <td className="px-2 py-2.5 font-mono font-bold" style={{ color: ZONE_COLORS[i] }}>{z.fc_cible}</td>
                    <td className="px-2 py-2.5 font-mono">{z.w_per_kg?.toFixed(2) || "—"}</td>
                    <td className="px-2 py-2.5 font-mono">{z.rer}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 rounded-full bg-[var(--color-primary)]" style={{ width: `${z.pct_carbs * 0.4}px`, minWidth: 2 }} />
                        <span className="font-mono">{z.pct_carbs}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 font-mono">{z.kcal_per_h}</td>
                    <td className="px-2 py-2.5 font-mono">{z.g_carbs_per_min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1 : VO2 + FC */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">VO₂ & FC par zone</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={zoneChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="vo2" tick={{ fontSize: 10 }} domain={[0, "auto"]} />
              <YAxis yAxisId="fc" orientation="right" tick={{ fontSize: 10 }} domain={[0, "auto"]} />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Line yAxisId="vo2" type="monotone" dataKey="vo2" name="VO₂ (mL/kg/min)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} isAnimationActive animationDuration={800} />
              <Line yAxisId="fc" type="monotone" dataKey="fc" name="FC (bpm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} isAnimationActive animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Graph 2 : Glucides/Lipides */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Répartition Glucides/Lipides</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="glucides" name="Glucides %" stackId="a" fill="#059669" isAnimationActive animationDuration={800} />
              <Bar dataKey="lipides" name="Lipides %" stackId="a" fill="#3b82f6" isAnimationActive animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Graph 3 : g/min */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4">Oxydation (g/min)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={zoneChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="g_carbs" name="Gluc (g/min)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} isAnimationActive animationDuration={800} />
              <Line type="monotone" dataKey="g_lipids" name="Lip (g/min)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} isAnimationActive animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
