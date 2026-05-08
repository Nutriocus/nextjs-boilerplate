"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  MessageSquare,
  FileText,
  AlertTriangle,
  ChevronRight,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { mockEnergyLog } from "@/lib/mock-data";

const mockAthletes = [
  {
    id: "athlete-1",
    first_name: "Thomas",
    last_name: "Dupont",
    sport: ["trail"],
    level: "amateur_confirme",
    weight_kg: 68.4,
    vo2max: 62,
    last_energy: 7,
    avg_energy_7d: 6.8,
    next_race: "Maxi Race Annecy",
    next_race_days: 37,
    pending_reports: 0,
    status: "active",
  },
  {
    id: "athlete-2",
    first_name: "Marie",
    last_name: "Lambert",
    sport: ["triathlon"],
    level: "semi_elite",
    weight_kg: 59.2,
    vo2max: 56,
    last_energy: 4,
    avg_energy_7d: 4.2,
    next_race: "Ironman 70.3",
    next_race_days: 15,
    pending_reports: 1,
    status: "active",
  },
  {
    id: "athlete-3",
    first_name: "Lucas",
    last_name: "Bernard",
    sport: ["cyclisme"],
    level: "amateur_confirme",
    weight_kg: 72.1,
    vo2max: 68,
    last_energy: 8,
    avg_energy_7d: 7.6,
    next_race: "Granfondo des Vosges",
    next_race_days: 62,
    pending_reports: 0,
    status: "active",
  },
];

export default function CoachDashboard() {
  const lowEnergyAlerts = mockAthletes.filter((a) => a.avg_energy_7d < 6);
  const pendingReports = mockAthletes.filter((a) => a.pending_reports > 0);

  return (
    <div>
      <Topbar
        title="Dashboard Coach"
        subtitle={`${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} · ${mockAthletes.length} athlètes actifs`}
        actions={
          <Link href="/coach/athletes" className="btn-primary">
            <Users className="w-4 h-4" />
            Gérer les athlètes
          </Link>
        }
      />

      {/* Alertes */}
      {(lowEnergyAlerts.length > 0 || pendingReports.length > 0) && (
        <div className="space-y-3 mb-6">
          {lowEnergyAlerts.map((athlete) => (
            <motion.div
              key={`alert-${athlete.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-400 flex-1">
                <strong>{athlete.first_name} {athlete.last_name}</strong> — Énergie faible{" "}
                ({athlete.avg_energy_7d.toFixed(1)}/10 sur 7j). Vérifier la charge d'entraînement.
              </p>
              <Link href={`/coach/athletes/${athlete.id}`} className="btn-secondary text-xs">
                Voir le profil
              </Link>
            </motion.div>
          ))}

          {pendingReports.map((athlete) => (
            <motion.div
              key={`report-${athlete.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
            >
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-sm text-blue-400 flex-1">
                <strong>{athlete.first_name} {athlete.last_name}</strong> a envoyé{" "}
                {athlete.pending_reports} compte{athlete.pending_reports > 1 ? "s" : ""} rendu{athlete.pending_reports > 1 ? "s" : ""} à valider.
              </p>
              <Link href={`/coach/athletes/${athlete.id}`} className="btn-secondary text-xs">
                Répondre
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Athlètes actifs", value: mockAthletes.length, icon: Users, color: "text-[var(--color-primary)]" },
          { label: "CRs en attente", value: pendingReports.reduce((s, a) => s + a.pending_reports, 0), icon: FileText, color: "text-blue-400" },
          { label: "Alertes énergie", value: lowEnergyAlerts.length, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Énergie moy. groupe", value: (mockAthletes.reduce((s, a) => s + a.avg_energy_7d, 0) / mockAthletes.length).toFixed(1) + "/10", icon: Activity, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <span className="stat-label">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className={`stat-value ${color}`}>{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Tableau athlètes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold font-display">Mes athlètes</h2>
          <Link href="/coach/athletes" className="btn-ghost text-sm">
            Voir tous
          </Link>
        </div>

        <div className="space-y-3">
          {mockAthletes.map((athlete, i) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 + 0.2 }}
            >
              <Link href={`/coach/athletes/${athlete.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-all cursor-pointer">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center font-bold text-[var(--color-primary)] shrink-0">
                    {athlete.first_name[0]}{athlete.last_name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm">
                        {athlete.first_name} {athlete.last_name}
                      </h3>
                      {athlete.avg_energy_7d < 6 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {athlete.pending_reports > 0 && (
                        <span className="badge bg-blue-500/20 text-blue-400 text-[10px]">
                          {athlete.pending_reports} CR
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="capitalize">{athlete.sport[0]}</span>
                      <span>VO₂max {athlete.vo2max}</span>
                      <span>{athlete.weight_kg} kg</span>
                      {athlete.next_race && (
                        <span className="text-[var(--color-primary)]">
                          → {athlete.next_race} ({athlete.next_race_days}j)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Énergie */}
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold font-display ${
                      athlete.avg_energy_7d >= 7 ? "text-green-400" :
                      athlete.avg_energy_7d >= 5 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {athlete.avg_energy_7d.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">énergie/10</div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
