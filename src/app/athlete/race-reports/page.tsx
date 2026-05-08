"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockRaces } from "@/lib/mock-data";
import { FileText, Plus, Send, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const mockReports = [
  {
    id: "rr-1",
    race_name: "Skyrhune",
    race_date: "2025-10-11",
    distance_km: 23,
    finish_time: "3:22:15",
    ranking: "45/800",
    nutrition_during: "2 gels/h SiS, 500mL Maurten/h, 2 barres de céréales sur les 3 premiers ravitos. Aucun problème digestif.",
    energy_by_phase: "0-10km: 8/10 · 10-20km: 7/10 · 20-23km: 8/10",
    overall_assessment: "Excellente course ! Stratégie nutrition parfaitement exécutée. Bonne gestion de l'allure sur le D+.",
    what_worked: "Les gels SiS, boire aux ravitos avant d'avoir soif, les galettes de riz au 3ème ravito.",
    what_to_improve: "Prévoir un gel de caféine au km 18 pour le final. Chaussettes compression trop serrées.",
    coach_feedback: "Super CR Thomas ! La gestion glucidique était parfaite. Pour la Maxi Race, on cible 70g glucides/h. Travaille la descente technique.",
    coach_validated: true,
    created_at: new Date().toISOString(),
  },
];

export default function RaceReportsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const completedRaces = mockRaces.filter((r) => r.status === "completed");

  return (
    <div>
      <Topbar
        title="Comptes rendus de course"
        subtitle="Analysez vos performances et recevez le feedback de votre coach"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau CR
          </button>
        }
      />

      {/* Formulaire nouveau CR */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="card mb-6"
        >
          <h3 className="font-bold font-display mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
            Nouveau compte rendu
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Course</label>
              <select className="input">
                <option value="">Sélectionner une course...</option>
                {completedRaces.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {formatDate(r.date)}</option>
                ))}
                <option value="autre">Autre course</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Distance (km)</label>
              <input type="number" placeholder="42.2" className="input" />
            </div>
            <div>
              <label className="label">Temps de finition</label>
              <input type="text" placeholder="3:22:15" className="input" />
            </div>
            <div>
              <label className="label">Classement</label>
              <input type="text" placeholder="45/800" className="input" />
            </div>
          </div>

          {[
            { label: "Gestion nutrition pendant la course", name: "nutrition_during", placeholder: "Gels, boissons, solides, timing..." },
            { label: "Énergie ressentie par phase (ex: 0-30km: 8/10 · 30-60km: 6/10)", name: "energy_by_phase", placeholder: "0-30km: 8/10 · 30-60km: 6/10 · 60-80km: 5/10" },
            { label: "Bilan global", name: "overall_assessment", placeholder: "Résumé de la course, conditions, ressenti général..." },
            { label: "Ce qui a bien fonctionné", name: "what_worked", placeholder: "Points positifs nutrition, stratégie..." },
            { label: "À améliorer pour la prochaine", name: "what_to_improve", placeholder: "Points à travailler..." },
          ].map(({ label, name, placeholder }) => (
            <div key={name} className="mb-3">
              <label className="label">{label}</label>
              <textarea name={name} placeholder={placeholder} rows={3} className="input resize-none" />
            </div>
          ))}

          <div className="flex gap-2">
            <button className="btn-primary">
              <Send className="w-4 h-4" />
              Envoyer au coach
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </motion.div>
      )}

      {/* Liste des CRs */}
      <div className="space-y-4">
        {mockReports.map((report, i) => {
          const isSelected = selectedReport === report.id;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setSelectedReport(isSelected ? null : report.id)}
                className="card w-full text-left hover:border-[var(--color-primary)]/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold font-display">{report.race_name}</h3>
                      {report.coach_validated && (
                        <span className="badge bg-green-500/20 text-green-400 text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> Coach validé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                      <span>{format(new Date(report.race_date), "d MMMM yyyy", { locale: fr })}</span>
                      {report.distance_km && <span>{report.distance_km} km</span>}
                      {report.finish_time && <span className="font-bold text-[var(--color-primary)]">{report.finish_time}</span>}
                      {report.ranking && <span>{report.ranking}</span>}
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" />
                </div>
              </button>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="card mt-2 border-t-0 rounded-t-none"
                >
                  <div className="space-y-4">
                    {[
                      { label: "Nutrition pendant la course", value: report.nutrition_during },
                      { label: "Énergie par phase", value: report.energy_by_phase },
                      { label: "Bilan global", value: report.overall_assessment },
                      { label: "Ce qui a bien fonctionné", value: report.what_worked },
                      { label: "À améliorer", value: report.what_to_improve },
                    ].map(({ label, value }) => value ? (
                      <div key={label}>
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">{label}</p>
                        <p className="text-sm">{value}</p>
                      </div>
                    ) : null)}

                    {report.coach_feedback && (
                      <div className="rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 p-4">
                        <p className="text-xs font-semibold text-[var(--color-primary)] mb-2">
                          💬 Feedback du coach
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {report.coach_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {mockReports.length === 0 && (
          <div className="card text-center py-12">
            <FileText className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun compte rendu</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Après chaque course, rédigez un CR pour recevoir le feedback de votre coach.
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Créer mon premier CR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
