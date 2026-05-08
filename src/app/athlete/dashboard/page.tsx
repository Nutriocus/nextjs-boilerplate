"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import {
  Scale,
  Zap,
  Target,
  TrendingUp,
  BookHeart,
  GraduationCap,
  ChevronRight,
  Flame,
  Calendar,
  Activity,
} from "lucide-react";
import Link from "next/link";
import {
  mockAthlete,
  mockBodyMeasurements,
  mockEnergyLog,
  mockIREMeasurements,
  mockRaces,
  mockFormationModules,
  mockFormationProgress,
} from "@/lib/mock-data";
import { daysUntil, formatDate, getEnergyBg, getEnergyColor, PHASE_LABELS, SPORT_LABELS } from "@/lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  // Données calculées
  const lastWeight = mockBodyMeasurements[mockBodyMeasurements.length - 1];
  const lastIRE = mockIREMeasurements[mockIREMeasurements.length - 1];
  const last7Energy = mockEnergyLog.slice(-7);
  const avgEnergy = Math.round(last7Energy.reduce((s, e) => s + e.energy_score, 0) / last7Energy.length * 10) / 10;
  const todayLog = mockEnergyLog[mockEnergyLog.length - 1];

  const nextRaceA = mockRaces
    .filter((r) => r.priority === "A" && r.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const daysToNextA = nextRaceA ? daysUntil(nextRaceA.date) : null;

  const totalModules = mockFormationModules.length;
  const completedModules = mockFormationProgress.filter((p) => p.completed).length;
  const formationPct = Math.round((completedModules / totalModules) * 100);

  const energyChartData = last7Energy.map((e) => ({
    day: format(new Date(e.logged_date), "EEE", { locale: fr }),
    score: e.energy_score,
  }));

  const quickLinks = [
    { href: "/athlete/body", icon: Scale, label: "Corps & IRE", color: "text-blue-400" },
    { href: "/athlete/physiological", icon: Activity, label: "Profil physio", color: "text-purple-400" },
    { href: "/athlete/race-energy", icon: Flame, label: "Dépenses énergie", color: "text-orange-400" },
    { href: "/athlete/roadmap", icon: Target, label: "Roadmap saison", color: "text-red-400" },
    { href: "/athlete/formation", icon: GraduationCap, label: "Formation", color: "text-indigo-400" },
    { href: "/athlete/gpts", icon: Zap, label: "Mes GPTs", color: "text-green-400" },
  ];

  return (
    <div>
      <Topbar
        title={`Bonjour, ${mockAthlete.first_name} 👋`}
        subtitle={`${SPORT_LABELS[mockAthlete.sport[0]]} · ${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}`}
      />

      {/* Alerte énergie basse */}
      {todayLog && todayLog.energy_score <= 5 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-400 text-sm">
                Ton énergie est basse aujourd'hui ({todayLog.energy_score}/10)
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Consulte le GPT dédié pour analyser ton déficit énergétique.
              </p>
            </div>
            <Link
              href="/athlete/gpts"
              className="btn-secondary text-xs whitespace-nowrap"
            >
              Consulter le GPT
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Énergie moy. 7j",
            value: avgEnergy,
            suffix: "/10",
            icon: BookHeart,
            color: getEnergyColor(avgEnergy),
            href: "/athlete/energy-log",
            delay: 0,
          },
          {
            label: "Poids actuel",
            value: lastWeight?.weight_kg.toFixed(1),
            suffix: "kg",
            icon: Scale,
            color: "text-blue-400",
            href: "/athlete/body",
            delay: 0.05,
          },
          {
            label: "IRE actuel (trail)",
            value: lastIRE?.ire_value.toFixed(2),
            suffix: "",
            icon: TrendingUp,
            color: lastIRE?.ire_value >= 1.0 ? "text-green-400" : lastIRE?.ire_value >= 0.8 ? "text-amber-400" : "text-red-400",
            href: "/athlete/body",
            delay: 0.1,
          },
          {
            label: nextRaceA ? `Jours avant ${nextRaceA.name.split(" ")[0]}...` : "Prochain objectif A",
            value: daysToNextA ?? "—",
            suffix: daysToNextA ? "j" : "",
            icon: Target,
            color: "text-red-400",
            href: "/athlete/roadmap",
            delay: 0.15,
          },
        ].map(({ label, value, suffix, icon: Icon, color, href, delay }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.3, delay }}
          >
            <Link href={href}>
              <div className="stat-card hover:border-[var(--color-primary)]/30 cursor-pointer transition-all group">
                <div className="flex items-center justify-between">
                  <span className="stat-label">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`stat-value ${color}`}>
                  {value}
                  <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">
                    {suffix}
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Énergie 7 jours — mini chart */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold font-display text-sm">Énergie — 7 derniers jours</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Saisie quotidienne</p>
            </div>
            <Link href="/athlete/energy-log" className="btn-ghost text-xs">
              Voir tout
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {last7Energy.map((e) => (
              <div key={e.logged_date} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-xs font-semibold" style={{ color: e.energy_score >= 7 ? "#22c55e" : e.energy_score >= 5 ? "#f59e0b" : "#ef4444" }}>
                  {e.energy_score}
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 40, display: "flex", alignItems: "flex-end" }}>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${(e.energy_score / 10) * 100}%`,
                      backgroundColor: e.energy_score >= 7 ? "#22c55e" : e.energy_score >= 5 ? "#f59e0b" : "#ef4444",
                      opacity: 0.8,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] capitalize">
                  {format(new Date(e.logged_date), "EEE", { locale: fr }).slice(0, 3)}
                </div>
              </div>
            ))}
          </div>

          <Link href="/athlete/energy-log" className="btn-primary w-full justify-center text-sm mt-2">
            <BookHeart className="w-4 h-4" />
            Saisir mon énergie du jour
          </Link>
        </motion.div>

        {/* Formation */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.25 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display text-sm">Formation</h3>
            <Link href="/athlete/formation" className="btn-ghost text-xs">
              Continuer
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full border-4 border-[var(--color-primary)]/30 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeDasharray={`${formationPct * 1.507} 150.7`} />
              </svg>
              <span className="text-sm font-bold text-[var(--color-primary)]">{formationPct}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{completedModules}/{totalModules} modules</p>
              <p className="text-xs text-[var(--color-text-muted)]">complétés</p>
            </div>
          </div>

          <div className="space-y-2">
            {mockFormationModules.slice(0, 3).map((mod) => {
              const prog = mockFormationProgress.find((p) => p.module_id === mod.id);
              return (
                <div key={mod.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${prog?.completed ? "bg-green-500" : prog?.progress_pct && prog.progress_pct > 0 ? "bg-amber-500" : "bg-[var(--color-border)]"}`} />
                  <span className="text-xs text-[var(--color-text-muted)] truncate flex-1">{mod.title}</span>
                  {prog?.completed && <span className="text-[10px] text-green-500 shrink-0">✓</span>}
                  {!prog?.completed && prog?.progress_pct && prog.progress_pct > 0 && (
                    <span className="text-[10px] text-amber-500 shrink-0">{prog.progress_pct}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Prochaine course A */}
      {nextRaceA && (
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card mb-6 border-[var(--color-primary)]/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="badge bg-red-500/20 text-red-400 text-[10px]">OBJECTIF A</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(nextRaceA.date)}</span>
              </div>
              <h3 className="font-bold font-display">{nextRaceA.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                {nextRaceA.distance_km}km · D+{nextRaceA.elevation_m}m · Objectif {nextRaceA.goal_time}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold font-display text-red-400">{daysToNextA}</div>
              <div className="text-xs text-[var(--color-text-muted)]">jours</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accès rapide */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
          Accès rapide
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <div className="card-2 flex flex-col items-center gap-2 py-4 hover:border-[var(--color-primary)]/30 cursor-pointer transition-all text-center group">
                <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
                <span className="text-[11px] text-[var(--color-text-muted)] leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
