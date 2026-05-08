"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { ChevronRight, AlertTriangle, UserPlus } from "lucide-react";
import { SPORT_LABELS, LEVEL_LABELS } from "@/lib/utils";

const mockAthletes = [
  { id: "athlete-1", first_name: "Thomas", last_name: "Dupont", email: "thomas@example.com", sport: ["trail", "running"], level: "amateur_confirme", weight_kg: 68.4, vo2max: 62, avg_energy_7d: 6.8, status: "active" },
  { id: "athlete-2", first_name: "Marie", last_name: "Lambert", email: "marie@example.com", sport: ["triathlon"], level: "semi_elite", weight_kg: 59.2, vo2max: 56, avg_energy_7d: 4.2, status: "active" },
  { id: "athlete-3", first_name: "Lucas", last_name: "Bernard", email: "lucas@example.com", sport: ["cyclisme"], level: "amateur_confirme", weight_kg: 72.1, vo2max: 68, avg_energy_7d: 7.6, status: "active" },
];

export default function CoachAthletesPage() {
  return (
    <div>
      <Topbar
        title="Mes athlètes"
        subtitle={`${mockAthletes.length} athlètes`}
        actions={
          <button className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Ajouter un athlète
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {mockAthletes.map((athlete, i) => (
          <motion.div
            key={athlete.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link href={`/coach/athletes/${athlete.id}`}>
              <div className="card hover:border-[var(--color-primary)]/30 cursor-pointer transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center font-bold text-lg text-[var(--color-primary)]">
                    {athlete.first_name[0]}{athlete.last_name[0]}
                  </div>
                  {athlete.avg_energy_7d < 6 && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <h3 className="font-bold font-display mb-1">
                  {athlete.first_name} {athlete.last_name}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                  {athlete.email}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {athlete.sport.map((s) => (
                    <span key={s} className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px]">
                      {SPORT_LABELS[s]}
                    </span>
                  ))}
                  <span className="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">
                    {LEVEL_LABELS[athlete.level]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <div className="text-sm font-bold text-[var(--color-primary)]">{athlete.weight_kg}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">kg</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-400">{athlete.vo2max}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">VO₂max</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${athlete.avg_energy_7d >= 7 ? "text-green-400" : athlete.avg_energy_7d >= 5 ? "text-amber-400" : "text-red-400"}`}>
                      {athlete.avg_energy_7d.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">énergie</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`badge ${athlete.status === "active" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
                    {athlete.status === "active" ? "Actif" : "Inactif"}
                  </span>
                  <span className="text-[var(--color-primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                    Voir profil <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
