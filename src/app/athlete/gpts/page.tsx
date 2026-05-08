"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockGPTs, mockEnergyLog } from "@/lib/mock-data";
import { ExternalLink, Sparkles } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  analyse: "Analyse & Performance",
  nutrition: "Nutrition",
  performance: "Performance",
  strategie: "Stratégie",
};

export default function GPTsPage() {
  const last7 = mockEnergyLog.slice(-7);
  const avgEnergy =
    last7.reduce((s, e) => s + e.energy_score, 0) / last7.length;

  const grouped = mockGPTs
    .filter((g) => g.active)
    .reduce(
      (acc, gpt) => {
        const cat = gpt.category || "autre";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(gpt);
        return acc;
      },
      {} as Record<string, typeof mockGPTs>
    );

  return (
    <div>
      <Topbar
        title="Mes GPTs NUTRIOCUS"
        subtitle="9 assistants IA spécialisés pour optimiser ta performance"
      />

      {/* Alert énergie basse */}
      {avgEnergy <= 5 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚠️</span>
            <p className="font-semibold text-orange-400">
              Énergie faible détectée ({avgEnergy.toFixed(1)}/10 sur 7 jours)
            </p>
          </div>
          <p className="text-sm text-orange-400/70">
            Le GPT ci-dessous est recommandé pour analyser ton déficit énergétique.
          </p>
        </motion.div>
      )}

      {Object.entries(grouped).map(([category, gpts], catIndex) => (
        <div key={category} className="mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: catIndex * 0.05 }}
            className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3"
          >
            {CATEGORY_LABELS[category] || category}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gpts.map((gpt, i) => {
              const isHighlighted =
                gpt.highlight &&
                gpt.energy_threshold &&
                avgEnergy <= gpt.energy_threshold;

              return (
                <motion.div
                  key={gpt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.05 + i * 0.04 }}
                >
                  <a
                    href={gpt.url === "#" ? undefined : gpt.url}
                    target={gpt.url !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`card group flex flex-col gap-3 h-full cursor-pointer hover:border-[var(--color-primary)]/40 transition-all duration-200 hover:shadow-md ${
                      isHighlighted
                        ? "border-orange-500/40 shadow-orange-500/10 shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{gpt.icon}</span>
                        {isHighlighted && (
                          <span className="badge bg-orange-500/20 text-orange-400 text-[10px] flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Recommandé
                          </span>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold font-display text-sm mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                        {gpt.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        {gpt.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        gpt.url === "#"
                          ? "text-[var(--color-text-muted)]"
                          : "text-[var(--color-primary)]"
                      }`}>
                        {gpt.url === "#" ? "URL à configurer" : "Ouvrir →"}
                      </span>
                    </div>
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card-2 text-center py-6"
      >
        <p className="text-xs text-[var(--color-text-muted)]">
          Les URLs des GPTs sont configurées par votre coach depuis son interface d'administration.
        </p>
      </motion.div>
    </div>
  );
}
