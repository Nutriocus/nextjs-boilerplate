"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6">
      {/* Brand block */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-3 mb-2 px-5 py-1.5 rounded-full bg-[var(--color-dark)] text-white">
          <span
            className="font-extrabold tracking-tight text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NUTRIOCUS
            <span className="text-[var(--color-primary)]">.</span>
          </span>
        </div>
        <h1
          className="font-extrabold uppercase mt-3"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "44px",
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
          }}
        >
          Ultra Performance
        </h1>
        <div className="flex gap-1 justify-center mt-3">
          <div className="h-1 w-16 bg-[var(--color-primary)] rounded-full" />
          <div className="h-1 w-6 bg-[var(--color-accent)] rounded-full" />
        </div>
        <p className="text-[var(--color-text-muted)] text-sm mt-5 max-w-md mx-auto">
          La plateforme de coaching nutritionnel pour athlètes
          d&apos;endurance.
        </p>
      </motion.div>

      {/* Cards de sélection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {/* Coach */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link href="/auth?role=coach">
            <div className="card cursor-pointer p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group border-t-[3px] border-t-[var(--color-primary)]">
              <div className="kicker mb-1">Espace</div>
              <h2
                className="font-extrabold uppercase mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "26px",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                Coach
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Gérez vos athlètes, partagez les plans et suivez les
                progressions.
              </p>
              <div className="inline-flex items-center text-sm font-bold text-[var(--color-primary)]">
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
            <div className="card cursor-pointer p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group border-t-[3px] border-t-[var(--color-dark)]">
              <div className="kicker mb-1" style={{ color: "var(--color-dark)" }}>
                Espace
              </div>
              <h2
                className="font-extrabold uppercase mb-2"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "26px",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                }}
              >
                Athlète
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Accédez à votre espace personnel, vos plans et tous vos outils.
              </p>
              <div className="inline-flex items-center text-sm font-bold text-[var(--color-dark)]">
                Accéder
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <p className="text-[10px] text-[var(--color-text-muted)] tracking-[0.1em] uppercase">
          Plateforme nutrition · trail · triathlon · cyclisme · course
        </p>
      </motion.div>
    </div>
  );
}
