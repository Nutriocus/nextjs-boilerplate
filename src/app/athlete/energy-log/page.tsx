"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { mockEnergyLog, mockGPTs } from "@/lib/mock-data";
import { getEnergyBg, getEnergyColor, formatDate } from "@/lib/utils";
import { BookHeart, ChevronRight, AlertTriangle } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

const TAGS = [
  { value: "sommeil_bon", label: "😴 Sommeil bon" },
  { value: "sommeil_perturbe", label: "😵 Sommeil perturbé" },
  { value: "appetit_normal", label: "🍽️ Appétit normal" },
  { value: "faim_excessive", label: "😋 Faim excessive" },
  { value: "pas_faim", label: "🤷 Pas faim" },
  { value: "digestion_ok", label: "✅ Digestion ok" },
  { value: "troubles_digestifs", label: "🤢 Troubles digestifs" },
  { value: "entrainement_intense", label: "💪 Entraînement intense" },
  { value: "repos", label: "🛌 Repos" },
  { value: "stress_eleve", label: "😰 Stress élevé" },
  { value: "bonne_hydratation", label: "💧 Bonne hydratation" },
  { value: "jambes_lourdes", label: "🦵 Jambes lourdes" },
];

export default function EnergyLogPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLog = mockEnergyLog.find((e) => e.logged_date === today);
  const last30 = mockEnergyLog.slice(-30);
  const last7 = mockEnergyLog.slice(-7);
  const avgEnergy = Math.round(last7.reduce((s, e) => s + e.energy_score, 0) / last7.length * 10) / 10;

  const [score, setScore] = useState(todayLog?.energy_score || 7);
  const [selectedTags, setSelectedTags] = useState<string[]>(todayLog?.tags || []);
  const [note, setNote] = useState(todayLog?.free_notes || "");

  const lowEnergyGPT = mockGPTs.find((g) => g.highlight && g.energy_threshold);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const chartData = last30.map((e) => ({
    date: format(new Date(e.logged_date), "d MMM", { locale: fr }),
    score: e.energy_score,
  }));

  // Compter jours consécutifs < 6
  const consecutiveLow = (() => {
    let count = 0;
    for (let i = last7.length - 1; i >= 0; i--) {
      if (last7[i].energy_score < 6) count++;
      else break;
    }
    return count;
  })();

  return (
    <div>
      <Topbar
        title="Carnet d'énergie"
        subtitle="Suivi quotidien de ton niveau d'énergie"
      />

      {/* Alerte déficit consécutif */}
      {consecutiveLow >= 3 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-400 text-sm">
                {consecutiveLow} jours consécutifs avec énergie &lt; 6
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Votre coach a été notifié. Consultez le GPT de diagnostic.
              </p>
            </div>
            {lowEnergyGPT && (
              <a href={lowEnergyGPT.url} className="btn-secondary text-xs whitespace-nowrap">
                {lowEnergyGPT.icon} Analyser
              </a>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Saisie du jour */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display text-sm flex items-center gap-2">
              <BookHeart className="w-4 h-4 text-[var(--color-primary)]" />
              Aujourd'hui
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {format(new Date(), "d MMMM", { locale: fr })}
            </span>
          </div>

          {/* Score slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Niveau d'énergie</span>
              <span
                className={`text-3xl font-bold font-display ${getEnergyColor(score)}`}
              >
                {score}
                <span className="text-base font-normal text-[var(--color-text-muted)]">/10</span>
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full h-2 rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444"} ${score * 10}%, var(--color-border) ${score * 10}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
              <span>Épuisé</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="label">Étiquettes</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    selectedTags.includes(tag.value)
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note libre */}
          <div className="mb-4">
            <label className="label">Note libre (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Comment tu te sens ?"
              rows={3}
              className="input resize-none"
            />
          </div>

          <button className="btn-primary w-full justify-center">
            Enregistrer
          </button>

          {/* Alerte énergie basse */}
          {score <= 5 && lowEnergyGPT && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3"
            >
              <p className="text-xs text-orange-400 font-semibold mb-1">
                Énergie basse détectée
              </p>
              <p className="text-xs text-orange-400/70 mb-2">
                Utilise ce GPT pour analyser ton déficit.
              </p>
              <a
                href={lowEnergyGPT.url}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400"
              >
                {lowEnergyGPT.icon} {lowEnergyGPT.name}
                <ChevronRight className="w-3 h-3" />
              </a>
            </motion.div>
          )}
        </motion.div>

        {/* Graphique 30 jours */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display text-sm">Évolution — 30 jours</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Énergie moy. 7j : <strong className={getEnergyColor(avgEnergy)}>{avgEnergy}/10</strong>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} ticks={[0, 2, 4, 6, 8, 10]} />
              <Tooltip
                contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                formatter={(value: number) => [`${value}/10`, "Énergie"]}
              />
              <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Seuil 6", fill: "#f59e0b", fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="score"
                name="Énergie"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#energyGrad)"
                dot={false}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Historique */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card"
      >
        <h3 className="font-semibold font-display text-sm mb-4">Historique récent</h3>
        <div className="space-y-2">
          {last30.slice().reverse().slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 py-2 border-b border-[var(--color-border)] last:border-0"
            >
              <div className="text-xs text-[var(--color-text-muted)] w-20 shrink-0">
                {format(new Date(entry.logged_date), "d MMM", { locale: fr })}
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                style={{
                  background:
                    entry.energy_score >= 7
                      ? "rgba(34,197,94,0.15)"
                      : entry.energy_score >= 5
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(239,68,68,0.15)",
                  color:
                    entry.energy_score >= 7
                      ? "#22c55e"
                      : entry.energy_score >= 5
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              >
                {entry.energy_score}
              </div>
              <div className="flex flex-wrap gap-1 flex-1">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                  >
                    {TAGS.find((t) => t.value === tag)?.label || tag}
                  </span>
                ))}
              </div>
              {entry.free_notes && (
                <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
                  {entry.free_notes}
                </p>
              )}
              {entry.coach_response && (
                <div className="text-xs text-[var(--color-primary)] shrink-0">
                  Coach ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
