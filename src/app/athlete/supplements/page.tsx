"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockSupplements } from "@/lib/mock-data";
import { Pill, Info } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  recommended: { label: "Recommandé coach", color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-500" },
  effort_only: { label: "Effort uniquement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-500" },
  monitor: { label: "À surveiller", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  personal: { label: "Personnel", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", dot: "bg-slate-400" },
};

export default function SupplementsPage() {
  const active = mockSupplements.filter((s) => s.active);
  const inactive = mockSupplements.filter((s) => !s.active);

  return (
    <div>
      <Topbar
        title="Compléments alimentaires"
        subtitle="Protocole personnalisé par votre coach"
      />

      {/* Légende */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(CATEGORY_CONFIG).map(([key, { label, color, dot }]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${color}`}>
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Compléments actifs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-5"
      >
        <h3 className="font-semibold font-display text-sm mb-4 flex items-center gap-2">
          <Pill className="w-4 h-4 text-[var(--color-primary)]" />
          Protocole actuel ({active.length} compléments)
        </h3>

        <div className="space-y-3">
          {active.map((s, i) => {
            const cat = CATEGORY_CONFIG[s.category || "personal"];
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-xl border ${cat.color}`}
              >
                <div className={`w-3 h-3 rounded-full ${cat.dot} shrink-0 mt-1.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-sm">{s.name}</h4>
                    {s.coach_recommendation && (
                      <span className="text-[10px] badge bg-green-500/20 text-green-400">Coach ✓</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                    <span>💊 <strong>{s.dose}</strong></span>
                    <span>⏰ <strong>{s.timing}</strong></span>
                    {s.start_date && !s.end_date && <span>📅 Depuis {s.start_date}</span>}
                    {s.end_date && <span>📅 Jusqu'au {s.end_date}</span>}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
                      {s.notes}
                    </p>
                  )}
                </div>
                <span className={`badge text-[10px] border ${cat.color} shrink-0`}>
                  {cat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Anciens compléments */}
      {inactive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="font-semibold font-display text-sm mb-4 text-[var(--color-text-muted)]">
            Compléments inactifs / arrêtés ({inactive.length})
          </h3>
          <div className="space-y-2">
            {inactive.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0 opacity-50">
                <div className="w-2 h-2 rounded-full bg-[var(--color-border)] shrink-0" />
                <span className="text-sm">{s.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{s.dose} — {s.timing}</span>
                {s.notes && <span className="text-xs text-[var(--color-text-muted)] italic ml-auto truncate max-w-[150px]">{s.notes}</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Note info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-2 mt-5 p-4 rounded-xl bg-[var(--color-surface-2)]"
      >
        <Info className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-text-muted)]">
          La liste des compléments est définie et maintenue par votre coach. Pour toute modification ou question, contactez-le directement.
        </p>
      </motion.div>
    </div>
  );
}
