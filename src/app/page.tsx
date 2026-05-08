"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  Zap,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6">
      {/* Logo & Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight">
            NUTRIOCUS
          </h1>
        </div>
        <p className="text-[var(--color-text-muted)] text-base max-w-md mx-auto">
          Plateforme de coaching nutritionnel pour athlètes d'endurance
        </p>
      </motion.div>

      {/* Cards de sélection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">
        {/* Coach */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link href="/auth?role=coach">
            <div className="card group cursor-pointer hover:border-[var(--color-primary)]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/5">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                <Users className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-lg font-bold font-display mb-1">Coach</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Gérez vos athlètes, partagez les plans et suivez les
                progressions.
              </p>
              <div className="flex items-center text-sm font-semibold text-[var(--color-primary)]">
                Accéder
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Athlète */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link href="/auth?role=athlete">
            <div className="card group cursor-pointer hover:border-[var(--color-accent)]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-accent)]/5">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                <Activity className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-bold font-display mb-1">Athlète</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Accédez à votre espace personnel, vos plans et tous vos outils.
              </p>
              <div className="flex items-center text-sm font-semibold text-[var(--color-accent)]">
                Accéder
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-16 grid grid-cols-3 gap-6 text-center max-w-lg"
      >
        {[
          { icon: TrendingUp, label: "Suivi corporel & IRE" },
          { icon: Target, label: "Stratégies de course" },
          { icon: Zap, label: "9 GPTs nutrition" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              {label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
