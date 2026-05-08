"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { UtensilsCrossed, FileText, Download, Clock } from "lucide-react";
import { PHASE_LABELS, formatDate } from "@/lib/utils";

const mockMealPlans = [
  {
    id: "mp-1",
    title: "Plan base endurance — Mai 2026",
    phase: "base" as const,
    week_start: "2026-05-05",
    coach_notes: "Priorité aux glucides complexes le matin. Maintien des protéines à 1.8g/kg/j. Hydratation 3L minimum.",
    is_current: true,
    created_at: new Date().toISOString(),
    file_name: "plan_alimentaire_mai_2026.pdf",
  },
  {
    id: "mp-2",
    title: "Plan charge glucidique — Maxi Race",
    phase: "charge_glucidique" as const,
    week_start: "2026-06-08",
    coach_notes: "À appliquer J-3 avant la Maxi Race. Glucides 8-10g/kg/j. Réduire lipides.",
    is_current: false,
    created_at: new Date().toISOString(),
    file_name: "plan_charge_maxi_race_2026.pdf",
  },
  {
    id: "mp-3",
    title: "Plan récupération — Post CCC",
    phase: "recuperation" as const,
    week_start: "2026-09-03",
    coach_notes: "Fenêtre anabolique 4 semaines. Augmentation protéines 2.2g/kg.",
    is_current: false,
    created_at: new Date().toISOString(),
    file_name: null,
  },
];

const PHASE_COLORS: Record<string, string> = {
  charge_glucidique: "bg-green-500/20 text-green-400",
  base: "bg-blue-500/20 text-blue-400",
  affutage: "bg-amber-500/20 text-amber-400",
  recuperation: "bg-purple-500/20 text-purple-400",
};

export default function MealPlansPage() {
  const currentPlan = mockMealPlans.find((p) => p.is_current);

  return (
    <div>
      <Topbar
        title="Plans alimentaires"
        subtitle="Plans nutritionnels personnalisés par votre coach"
      />

      {/* Plan actuel */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 border-[var(--color-primary)]/20"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge text-[10px] ${PHASE_COLORS[currentPlan.phase || ""]}`}>
                  {PHASE_LABELS[currentPlan.phase || ""]}
                </span>
                <span className="badge bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px]">
                  Plan actuel
                </span>
              </div>
              <h2 className="font-bold font-display text-lg">{currentPlan.title}</h2>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Semaine du {formatDate(currentPlan.week_start)}
                </span>
              </div>
            </div>
            {currentPlan.file_name && (
              <button className="btn-secondary text-sm shrink-0">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
            )}
          </div>

          {currentPlan.coach_notes && (
            <div className="rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4">
              <p className="text-xs font-semibold text-[var(--color-primary)] mb-1">
                💬 Note du coach
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {currentPlan.coach_notes}
              </p>
            </div>
          )}

          {currentPlan.file_name ? (
            <div className="mt-4 h-64 rounded-xl bg-[var(--color-surface-2)] flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--color-border)]">
              <FileText className="w-10 h-10 text-[var(--color-text-muted)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                {currentPlan.file_name}
              </p>
              <button className="btn-primary text-sm">
                <FileText className="w-4 h-4" />
                Afficher le PDF
              </button>
            </div>
          ) : (
            <div className="mt-4 h-32 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center border border-dashed border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-muted)]">
                Plan structuré à venir — votre coach va l'uploader prochainement.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Historique plans */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h3 className="font-semibold font-display text-sm mb-4">Tous les plans</h3>
        <div className="space-y-3">
          {mockMealPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-sm truncate">{plan.title}</h4>
                  {plan.is_current && (
                    <span className="badge bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] shrink-0">
                      Actuel
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[10px] ${PHASE_COLORS[plan.phase || ""]}`}>
                    {PHASE_LABELS[plan.phase || ""]}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(plan.week_start)}
                  </span>
                </div>
              </div>
              {plan.file_name ? (
                <button className="btn-ghost text-xs shrink-0">
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">En attente</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
