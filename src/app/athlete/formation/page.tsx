"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  mockFormationModules,
  mockFormationProgress,
} from "@/lib/mock-data";
import { GraduationCap, Play, FileText, Lock, CheckCircle, Clock } from "lucide-react";

const PROGRAM_LABELS: Record<string, string> = {
  bases_nutrition: "Les bases de la nutrition",
  endurance_nutrition: "Nutrition des sports d'endurance",
};

const PROGRAM_DESCRIPTIONS: Record<string, string> = {
  bases_nutrition: "Fondamentaux nutritionnels pour optimiser ton énergie au quotidien et à l'effort.",
  endurance_nutrition: "Nutrition avancée pour athlètes d'endurance : physiologie, stratégies, supplémentation.",
};

export default function FormationPage() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const programs = ["bases_nutrition", "endurance_nutrition"] as const;

  function getProgress(moduleId: string) {
    return mockFormationProgress.find((p) => p.module_id === moduleId);
  }

  const totalCompleted = mockFormationProgress.filter((p) => p.completed).length;
  const totalModules = mockFormationModules.length;
  const overallPct = Math.round((totalCompleted / totalModules) * 100);

  return (
    <div>
      <Topbar
        title="Formation NUTRIOCUS"
        subtitle="2 programmes · 9 modules · À votre rythme"
      />

      {/* Progression globale */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold font-display text-sm">Progression globale</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {totalCompleted}/{totalModules} modules complétés
            </p>
          </div>
          <span className="text-2xl font-bold font-display text-[var(--color-primary)]">
            {overallPct}%
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Programmes */}
      <div className="space-y-6">
        {programs.map((program, pIndex) => {
          const modules = mockFormationModules.filter(
            (m) => m.program === program
          );
          const completed = modules.filter(
            (m) => getProgress(m.id)?.completed
          ).length;
          const pct = Math.round((completed / modules.length) * 100);

          return (
            <motion.div
              key={program}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pIndex * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h2 className="font-bold font-display">
                      {PROGRAM_LABELS[program]}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {PROGRAM_DESCRIPTIONS[program]}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[var(--color-primary)]">{pct}%</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {completed}/{modules.length}
                  </div>
                </div>
              </div>

              <div className="progress-bar mb-4">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: pIndex * 0.1 + 0.2 }}
                />
              </div>

              <div className="space-y-2">
                {modules.map((module, mIndex) => {
                  const progress = getProgress(module.id);
                  const isCompleted = progress?.completed || false;
                  const inProgress = !isCompleted && (progress?.progress_pct || 0) > 0;
                  const isLocked = mIndex > 0 && !getProgress(modules[mIndex - 1].id)?.completed;
                  const isSelected = selectedModule === module.id;

                  return (
                    <div key={module.id}>
                      <button
                        onClick={() => !isLocked && setSelectedModule(isSelected ? null : module.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          isLocked
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-[var(--color-surface-2)] cursor-pointer"
                        } ${isSelected ? "bg-[var(--color-surface-2)]" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? "bg-green-500"
                              : inProgress
                              ? "bg-amber-500/20"
                              : isLocked
                              ? "bg-[var(--color-surface-2)]"
                              : "bg-[var(--color-primary)]/10"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : isLocked ? (
                            <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          ) : (
                            <Play className={`w-3.5 h-3.5 ${inProgress ? "text-amber-400" : "text-[var(--color-primary)]"}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--color-text-muted)]">
                              Module {module.order_index}
                            </span>
                            {inProgress && (
                              <span className="text-[10px] font-semibold text-amber-400">
                                {progress?.progress_pct}% en cours
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold truncate">{module.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)] truncate">
                            {module.description}
                          </p>
                        </div>

                        {module.duration_min && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] shrink-0">
                            <Clock className="w-3 h-3" />
                            {module.duration_min} min
                          </div>
                        )}
                      </button>

                      {/* Expanded module */}
                      {isSelected && !isLocked && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="ml-11 mt-2 mb-1"
                        >
                          <div className="card-2 p-4">
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                              {module.description}
                            </p>
                            <div className="flex gap-2">
                              {module.video_url ? (
                                <a
                                  href={module.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-primary text-sm"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  Regarder la vidéo
                                </a>
                              ) : (
                                <button disabled className="btn-primary opacity-50 text-sm">
                                  <Play className="w-3.5 h-3.5" />
                                  Vidéo à venir
                                </button>
                              )}
                              {module.pdf_url ? (
                                <a
                                  href={module.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary text-sm"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  PDF résumé
                                </a>
                              ) : (
                                <button disabled className="btn-secondary opacity-50 text-sm">
                                  <FileText className="w-3.5 h-3.5" />
                                  PDF à venir
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
