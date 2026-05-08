"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { FlaskConical, Plus, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

const PROTOCOLS = [
  {
    id: "p-1",
    name: "Tolérance glucides 60g/h",
    description: "Sortie 2h Z1-Z2 avec 60g glucides/h (1 gel/30min). Observer confort digestif.",
    duration: "2h",
    intensity: "Z1-Z2 (65-75% FCmax)",
    target_carbs_per_hour: 60,
  },
  {
    id: "p-2",
    name: "Tolérance glucides 90g/h",
    description: "Sortie 3h avec 90g glucides/h (mix glucose/fructose). Ratio 2:1 minimum.",
    duration: "3h",
    intensity: "Z2 (70-78% FCmax)",
    target_carbs_per_hour: 90,
  },
  {
    id: "p-3",
    name: "Test sodium & électrolytes",
    description: "Comparer sortie sans sodium vs 1g sodium/h. Peser avant/après.",
    duration: "2h",
    intensity: "Z2",
    target_carbs_per_hour: 60,
  },
  {
    id: "p-4",
    name: "Simulation course A (30km)",
    description: "Reproduire les conditions de course : même heure, même alimentation, mêmes produits.",
    duration: "3-4h",
    intensity: "Z2-Z3 (course target)",
    target_carbs_per_hour: 75,
  },
  {
    id: "p-5",
    name: "Test produits solides",
    description: "Intégration d'aliments solides (galettes riz, barres) toutes les 45min.",
    duration: "2h30",
    intensity: "Z1-Z2",
    target_carbs_per_hour: 50,
  },
  {
    id: "p-6",
    name: "Test caféine en course",
    description: "1 gel caféine (40mg) toutes les 90min à partir du km 20. Observer la réponse.",
    duration: "3h",
    intensity: "Z2-Z3",
    target_carbs_per_hour: 70,
  },
];

const mockTests = [
  {
    id: "t-1",
    test_date: "2026-04-12",
    test_type: "glucides_tolerance",
    protocol: "Tolérance glucides 60g/h",
    target_carbs_per_hour: 60,
    result: "Excellent ! Zéro trouble digestif. Énergie constante sur les 2h.",
    status: "completed",
    notes: "À répéter à 90g/h",
  },
  {
    id: "t-2",
    test_date: "2026-04-26",
    test_type: "glucides_tolerance",
    protocol: "Tolérance glucides 90g/h",
    target_carbs_per_hour: 90,
    result: "Légers ballonnements vers 1h30. Ratio 1:0.8 à revoir → tester 2:1 pur.",
    status: "completed",
    notes: "Retest avec SiS Beta Fuel (ratio 1:0.8 natif)",
  },
  {
    id: "t-3",
    test_date: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    test_type: "simulation_course",
    protocol: "Simulation course A (30km)",
    target_carbs_per_hour: 75,
    result: null,
    status: "planned",
    notes: "J-8 avant la Maxi Race. Conditions identiques.",
  },
];

export default function TestsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <Topbar
        title="Tests à l'effort"
        subtitle="Protocoles de test nutritionnel programmés"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Programmer un test
          </button>
        }
      />

      {/* Formulaire */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[var(--color-primary)]" />
            Programmer un nouveau test
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Date prévue</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Protocole</label>
              <select className="input">
                <option value="">Sélectionner un protocole...</option>
                {PROTOCOLS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="custom">Protocole personnalisé</option>
              </select>
            </div>
            <div>
              <label className="label">Glucides cibles (g/h)</label>
              <input type="number" placeholder="60" className="input" />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Notes préparatoires</label>
            <textarea rows={3} className="input resize-none" placeholder="Instructions spécifiques, conditions, matériel..." />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary">Programmer</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </motion.div>
      )}

      {/* Historique tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {mockTests.map((test, i) => {
          const isPlanned = test.status === "planned";
          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card ${isPlanned ? "border-amber-500/20" : "border-[var(--color-border)]"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className={`w-4 h-4 ${isPlanned ? "text-amber-400" : "text-[var(--color-primary)]"}`} />
                  <span className={`badge text-[10px] ${isPlanned ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                    {isPlanned ? "Planifié" : "Terminé ✓"}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {format(new Date(test.test_date), "d MMMM", { locale: fr })}
                </span>
              </div>

              <h3 className="font-semibold font-display text-sm mb-1">{test.protocol}</h3>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(test.test_date)}
                </span>
                {test.target_carbs_per_hour && (
                  <span>⚡ {test.target_carbs_per_hour}g glucides/h</span>
                )}
              </div>

              {test.result && (
                <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 mb-2">
                  <p className="text-xs font-semibold text-green-400 mb-1">Résultat</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{test.result}</p>
                </div>
              )}

              {test.notes && (
                <p className="text-xs text-[var(--color-text-muted)] italic">{test.notes}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Catalogue protocoles */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h3 className="font-semibold font-display text-sm mb-4">Catalogue de protocoles</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PROTOCOLS.map((p) => (
            <div key={p.id} className="card-2 hover:border-[var(--color-primary)]/20 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-sm">{p.name}</h4>
                <span className="badge bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px]">
                  {p.target_carbs_per_hour}g/h
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">{p.description}</p>
              <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
                <span>⏱ {p.duration}</span>
                <span>💓 {p.intensity}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
