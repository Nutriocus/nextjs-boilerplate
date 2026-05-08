"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MOMENTS = ["Matin", "Midi", "Soir"] as const;

type PillType = "training" | "nutrition" | "rest" | "race";

const PILL_COLORS: Record<PillType, string> = {
  training: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  nutrition: "bg-green-500/20 text-green-400 border border-green-500/30",
  rest: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  race: "bg-red-500/20 text-red-400 border border-red-500/30",
};

interface Pill {
  type: PillType;
  label: string;
}

const mockWeekContent: Record<string, Record<typeof MOMENTS[number], Pill[]>> = {
  Lundi: {
    Matin: [{ type: "nutrition", label: "Porridge avoine + banane" }, { type: "training", label: "Sortie Z2 1h30" }],
    Midi: [{ type: "nutrition", label: "Riz + poulet + légumes" }],
    Soir: [{ type: "nutrition", label: "Saumon + patate douce" }, { type: "rest", label: "Récupération" }],
  },
  Mardi: {
    Matin: [{ type: "training", label: "Séance qualité — Intervalles SV2 · 6×4min" }],
    Midi: [{ type: "nutrition", label: "Pâtes + thon + légumes" }],
    Soir: [{ type: "nutrition", label: "Omelette + pain complet + fromage" }],
  },
  Mercredi: {
    Matin: [{ type: "rest", label: "Repos actif — Natation douce" }],
    Midi: [{ type: "nutrition", label: "Salade quinoa + avocat + œufs" }],
    Soir: [{ type: "nutrition", label: "Soupe légumes + fromage blanc 20%" }],
  },
  Jeudi: {
    Matin: [{ type: "nutrition", label: "Pancakes protéinés + fruits rouges" }, { type: "training", label: "Trail technique D+500m · 2h" }],
    Midi: [{ type: "nutrition", label: "Wrap poulet + légumes croquants" }],
    Soir: [{ type: "nutrition", label: "Pâtes complètes + sauce tomate viande" }],
  },
  Vendredi: {
    Matin: [{ type: "training", label: "Vélo 45min Z1" }],
    Midi: [{ type: "nutrition", label: "Burger complet maison" }],
    Soir: [{ type: "nutrition", label: "Poisson vapeur + riz + légumes" }, { type: "rest", label: "Début charge glucidique si course A" }],
  },
  Samedi: {
    Matin: [{ type: "training", label: "🏃 Sortie longue 3h Z1-Z2 — Trail" }],
    Midi: [{ type: "nutrition", label: "Ravitaillement : 2-3 gels + 500mL/h" }],
    Soir: [{ type: "nutrition", label: "Bowl récup : quinoa + saumon + légumes" }],
  },
  Dimanche: {
    Matin: [{ type: "rest", label: "Repos complet ou marche" }],
    Midi: [{ type: "nutrition", label: "Repas plaisir — sans contraintes" }],
    Soir: [{ type: "nutrition", label: "Préparation semaine — batch cooking" }],
  },
};

export default function PlanningPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  return (
    <div>
      <Topbar
        title="Planification hebdomadaire"
        subtitle="Programme de la semaine — défini par votre coach"
        actions={
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        }
      />

      {/* Navigation semaine */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          className="btn-ghost"
        >
          <ChevronLeft className="w-4 h-4" />
          Semaine précédente
        </button>
        <div className="text-center">
          <p className="font-semibold font-display">
            Semaine du {format(weekStart, "d MMMM yyyy", { locale: fr })}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {format(weekStart, "d MMM", { locale: fr })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
          </p>
        </div>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="btn-ghost"
        >
          Semaine suivante
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(PILL_COLORS) as [PillType, string][]).map(([type, color]) => (
          <span key={type} className={`badge text-[10px] ${color}`}>
            {type === "training" ? "Entraînement" : type === "nutrition" ? "Nutrition" : type === "race" ? "Course" : "Repos"}
          </span>
        ))}
      </div>

      {/* Grille planning — desktop */}
      <div className="hidden lg:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-2)]" />
              {DAYS.map((day, i) => (
                <th key={day} className="px-3 py-3 text-left text-xs font-semibold bg-[var(--color-surface-2)]">
                  <div>{day}</div>
                  <div className="font-normal text-[var(--color-text-muted)]">
                    {format(addDays(weekStart, i), "d MMM", { locale: fr })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOMENTS.map((moment) => (
              <tr key={moment} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-3 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] align-top">
                  {moment}
                </td>
                {DAYS.map((day) => {
                  const pills = mockWeekContent[day]?.[moment] || [];
                  return (
                    <td key={day} className="px-2 py-2 align-top min-w-[120px]">
                      <div className="space-y-1">
                        {pills.map((pill, i) => (
                          <span
                            key={i}
                            className={`block text-[11px] px-2 py-1 rounded-full font-medium leading-tight ${PILL_COLORS[pill.type]}`}
                          >
                            {pill.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — cards par jour */}
      <div className="lg:hidden space-y-3">
        {DAYS.map((day, i) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold font-display text-sm">{day}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {format(addDays(weekStart, i), "d MMMM", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {MOMENTS.map((moment) => {
                const pills = mockWeekContent[day]?.[moment] || [];
                if (pills.length === 0) return null;
                return (
                  <div key={moment}>
                    <p className="text-[10px] text-[var(--color-text-muted)] mb-1 font-semibold">{moment}</p>
                    <div className="flex flex-wrap gap-1">
                      {pills.map((pill, j) => (
                        <span key={j} className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${PILL_COLORS[pill.type]}`}>
                          {pill.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Note coach */}
      <div className="card mt-5">
        <p className="text-xs font-semibold text-[var(--color-primary)] mb-1">
          📋 Note du coach — Semaine du {format(weekStart, "d MMMM", { locale: fr })}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Bonne semaine ! Priorité à la séance qualité du mardi. Pour la sortie longue samedi,
          testez le ratio gels/eau en préparation de la Maxi Race. Fermez bien la fenêtre anabolique
          dans les 30min post-effort.
        </p>
      </div>
    </div>
  );
}
