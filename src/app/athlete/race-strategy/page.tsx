"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockRaces } from "@/lib/mock-data";
import { Flag, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const mockStrategies = [
  {
    id: "rs-1",
    race_id: "race-1",
    race_name: "Maxi Race Annecy",
    race_date: "2026-06-14",
    title: "Stratégie Maxi Race Annecy 110K",
    pre_race: "J-3 : 8-9g/kg glucides, réduire fibres et graisses\nJ-2 : Idem, tester les jambes 30min Z1\nJ-1 : Pasta party (400g pâtes), sommeil avant 22h\nJ0 matin : 3h avant départ — porridge avoine + banane + 1 café",
    during_race: "0-25km : 2 gels/h SiS + 400mL eau/h — Zone 2 strict\n25-50km : +1 gel caféine au 35km, 500mL Maurten/h\n50-80km (nuit) : alterner solide (galette riz, soupe) + gel\n80-110km (final) : 1 gel caféine toutes les 45min, café aux ravitos si dispo",
    post_race: "Immédiatement : 500mL récup Maurten Recovery + banane\nH+2 : Repas complet protéines (30g) + glucides (1g/kg)\nJ+1 à J+5 : Anti-inflammatoires naturels (curcuma, oméga-3), protéines 2g/kg",
    products_used: [
      { name: "SiS Beta Fuel Gel", quantity: "12 gels", timing: "Toutes les 30min au-delà du km 20" },
      { name: "Maurten Drink Mix 320", quantity: "4 sachets", timing: "En boisson la nuit (km 50-80)" },
      { name: "GU Gel Caféine", quantity: "4 gels", timing: "Km 35, 65, 85, 100" },
    ],
    created_at: new Date().toISOString(),
  },
];

export default function RaceStrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  return (
    <div>
      <Topbar
        title="Stratégies de course"
        subtitle="Protocoles nutritionnels J-3 à J+3"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Liste des stratégies */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Vos stratégies
          </h3>
          {mockStrategies.map((strategy, i) => (
            <motion.button
              key={strategy.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedStrategy(strategy.id === selectedStrategy ? null : strategy.id)}
              className={`card w-full text-left cursor-pointer transition-all hover:border-[var(--color-primary)]/30 ${
                selectedStrategy === strategy.id ? "border-[var(--color-primary)]/50" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Flag className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <h4 className="font-semibold text-sm">{strategy.race_name}</h4>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {format(new Date(strategy.race_date), "d MMMM yyyy", { locale: fr })}
              </p>
              <p className="text-xs text-[var(--color-primary)] mt-1">{strategy.title}</p>
            </motion.button>
          ))}

          {/* Courses sans stratégie */}
          <div>
            <h4 className="text-xs text-[var(--color-text-muted)] mb-2">Courses à planifier</h4>
            {mockRaces
              .filter((r) => r.status === "upcoming" && !mockStrategies.find((s) => s.race_id === r.id))
              .map((race) => (
                <div key={race.id} className="card-2 mb-2 opacity-60">
                  <p className="text-sm font-semibold">{race.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(race.date)}</p>
                  <p className="text-xs text-[var(--color-primary)] mt-1">Stratégie à venir...</p>
                </div>
              ))}
          </div>
        </div>

        {/* Détail stratégie */}
        <div className="lg:col-span-2">
          {selectedStrategy ? (
            (() => {
              const strategy = mockStrategies.find((s) => s.id === selectedStrategy);
              if (!strategy) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="card">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-5 h-5 text-[var(--color-primary)]" />
                      <h2 className="font-bold font-display text-lg">{strategy.title}</h2>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {format(new Date(strategy.race_date), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>

                  {[
                    { title: "📅 Avant la course (J-3 à J0)", content: strategy.pre_race, color: "border-blue-500/20 bg-blue-500/5" },
                    { title: "⚡ Pendant la course", content: strategy.during_race, color: "border-green-500/20 bg-green-500/5" },
                    { title: "🔄 Récupération (J0 à J+5)", content: strategy.post_race, color: "border-purple-500/20 bg-purple-500/5" },
                  ].map(({ title, content, color }) => (
                    <div key={title} className={`card border ${color}`}>
                      <h3 className="font-semibold font-display text-sm mb-3">{title}</h3>
                      <div className="space-y-1">
                        {content.split("\n").map((line, i) => (
                          <p key={i} className="text-sm text-[var(--color-text-muted)]">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}

                  {strategy.products_used && strategy.products_used.length > 0 && (
                    <div className="card">
                      <h3 className="font-semibold font-display text-sm mb-3">🎽 Produits utilisés</h3>
                      <div className="space-y-2">
                        {strategy.products_used.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                            <div>
                              <p className="text-sm font-semibold">{p.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {p.quantity} — {p.timing}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()
          ) : (
            <div className="card h-80 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-[var(--color-text-muted)] mb-3" />
              <p className="font-semibold mb-1">Sélectionnez une stratégie</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Cliquez sur une course pour voir sa stratégie nutritionnelle détaillée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
