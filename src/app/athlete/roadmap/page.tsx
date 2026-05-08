"use client";

import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockRaces } from "@/lib/mock-data";
import {
  daysUntil,
  formatDate,
  getPriorityColor,
  getStatusBadge,
} from "@/lib/utils";
import { Flag, Mountain, Ruler, Timer, Trophy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function RoadmapPage() {
  const sortedRaces = [...mockRaces].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const seasonGoal = sortedRaces.find((r) => r.priority === "A" && r.status === "upcoming");

  return (
    <div>
      <Topbar
        title="Roadmap de saison"
        subtitle="Vos objectifs et courses pour la saison"
      />

      {/* Objectif principal */}
      {seasonGoal && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Objectif principal de saison
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display mb-1">{seasonGoal.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" /> {seasonGoal.distance_km} km
            </span>
            <span className="flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5" /> D+{seasonGoal.elevation_m}m
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Objectif : {seasonGoal.goal_time}
            </span>
            <span className="font-semibold text-red-400">
              {daysUntil(seasonGoal.date)} jours
            </span>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Ligne verticale */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--color-border)]" />

        <div className="space-y-4">
          {sortedRaces.map((race, i) => {
            const status = getStatusBadge(race.status);
            const isUpcoming = race.status === "upcoming";
            const days = isUpcoming ? daysUntil(race.date) : null;

            return (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                {/* Dot */}
                <div
                  className={`absolute -left-8 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    race.status === "completed"
                      ? "border-green-500 bg-green-500"
                      : race.status === "upcoming"
                      ? "border-[var(--color-primary)] bg-[var(--color-background)]"
                      : "border-[var(--color-border)] bg-[var(--color-background)]"
                  }`}
                >
                  {race.status === "completed" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                  {race.status === "upcoming" && race.priority === "A" && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  )}
                </div>

                <div className={`card hover:border-[var(--color-primary)]/20 transition-all ${race.priority === "A" ? "border-red-500/20" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`badge text-[10px] ${getPriorityColor(race.priority)}`}>
                          Objectif {race.priority}
                        </span>
                        <span className={`badge text-[10px] ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {format(new Date(race.date), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <h3 className="font-bold font-display">{race.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                        {race.distance_km && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" /> {race.distance_km} km
                          </span>
                        )}
                        {race.elevation_m && (
                          <span className="flex items-center gap-1">
                            <Mountain className="w-3 h-3" /> D+{race.elevation_m}m
                          </span>
                        )}
                        {race.goal_time && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Objectif : {race.goal_time}
                          </span>
                        )}
                      </div>
                      {race.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
                          {race.notes}
                        </p>
                      )}
                    </div>

                    {/* Résultat ou compte à rebours */}
                    <div className="text-right shrink-0">
                      {race.status === "completed" ? (
                        <div>
                          <div className="text-lg font-bold font-display text-green-400">
                            {race.actual_time}
                          </div>
                          {race.finish_position && (
                            <div className="text-xs text-[var(--color-text-muted)]">
                              {race.finish_position}
                            </div>
                          )}
                        </div>
                      ) : days !== null ? (
                        <div>
                          <div className={`text-2xl font-bold font-display ${race.priority === "A" ? "text-red-400" : "text-[var(--color-primary)]"}`}>
                            {days}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            jours
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
