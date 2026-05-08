"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SPORT_LABELS, LEVEL_LABELS } from "@/lib/utils";

// Dans une vraie implémentation, cela viendrait de Supabase
const athlete = {
  id: "athlete-1",
  first_name: "Thomas",
  last_name: "Dupont",
  email: "thomas@example.com",
  sport: ["trail", "running"],
  level: "amateur_confirme",
  weight_kg: 68.4,
  vo2max: 62,
  avg_energy_7d: 6.8,
  status: "active",
};

export default function CoachAthletePage({ params }: { params: { id: string } }) {
  const ATHLETE_SECTIONS = [
    { label: "Dashboard", href: `/athlete/dashboard` },
    { label: "Corps & IRE", href: `/athlete/body` },
    { label: "Profil physio", href: `/athlete/physiological` },
    { label: "Carnet d'énergie", href: `/athlete/energy-log` },
    { label: "Plans alimentaires", href: `/athlete/meal-plans` },
    { label: "Compléments", href: `/athlete/supplements` },
    { label: "Stratégies", href: `/athlete/race-strategy` },
    { label: "Roadmap", href: `/athlete/roadmap` },
    { label: "Comptes rendus", href: `/athlete/race-reports` },
    { label: "Produits effort", href: `/athlete/products` },
    { label: "Questionnaire", href: `/athlete/questionnaire` },
  ];

  return (
    <div>
      <div className="mb-5">
        <Link href="/coach/athletes" className="btn-ghost text-sm mb-3 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Retour aux athlètes
        </Link>
      </div>

      <Topbar
        title={`${athlete.first_name} ${athlete.last_name}`}
        subtitle={`${athlete.email} · ${LEVEL_LABELS[athlete.level]}`}
      />

      {/* Profil rapide */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Poids", value: `${athlete.weight_kg} kg` },
          { label: "VO₂max", value: `${athlete.vo2max} mL/kg/min` },
          { label: "Énergie moy.", value: `${athlete.avg_energy_7d}/10` },
          { label: "Sports", value: athlete.sport.map((s) => SPORT_LABELS[s]).join(", ") },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card"
          >
            <span className="stat-label">{label}</span>
            <span className="stat-value text-sm text-[var(--color-primary)]">{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Accès aux sections de l'athlète */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="font-semibold font-display text-sm mb-4">
          Accès à l'espace de {athlete.first_name}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          En tant que coach, vous avez accès à toutes les sections de cet athlète en lecture et en écriture.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ATHLETE_SECTIONS.map(({ label, href }) => (
            <Link key={label} href={href}>
              <div className="card-2 flex items-center justify-between hover:border-[var(--color-primary)]/30 cursor-pointer transition-all text-sm font-medium">
                {label}
                <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Upload document */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mt-5"
      >
        <h3 className="font-semibold font-display text-sm mb-4">
          Partager un document avec {athlete.first_name}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Type de document</label>
            <select className="input">
              <option value="">Sélectionner...</option>
              <option value="plan_alim">Plan alimentaire</option>
              <option value="strategie_course">Stratégie de course</option>
              <option value="cr_consultation">CR de consultation</option>
              <option value="replay_consultation">Replay de consultation</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="label">Titre</label>
            <input type="text" placeholder="Titre du document" className="input" />
          </div>
          <div className="lg:col-span-2">
            <label className="label">Description (optionnel)</label>
            <input type="text" placeholder="Description courte..." className="input" />
          </div>
        </div>

        <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:border-[var(--color-primary)]/40 transition-colors cursor-pointer">
          <p className="font-semibold mb-1">Glissez un fichier ici</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            PDF, MP4, MOV, PNG, JPG — max 500 MB
          </p>
          <button className="btn-secondary text-sm">
            Parcourir les fichiers
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn-primary">Partager le document</button>
        </div>
      </motion.div>
    </div>
  );
}
