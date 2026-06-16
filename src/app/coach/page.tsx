"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  FileText,
  AlertTriangle,
  ChevronRight,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Mock data — sera remplacé par Supabase plus tard
const mockAthletes = [
  {
    id: "athlete-1",
    first_name: "Thomas",
    last_name: "Dupont",
    sport: ["trail"],
    weight_kg: 68.4,
    vo2max: 62,
    avg_energy_7d: 6.8,
    next_race: "Maxi Race Annecy",
    next_race_days: 37,
    pending_reports: 0,
  },
  {
    id: "athlete-2",
    first_name: "Marie",
    last_name: "Lambert",
    sport: ["triathlon"],
    weight_kg: 59.2,
    vo2max: 56,
    avg_energy_7d: 4.2,
    next_race: "Ironman 70.3",
    next_race_days: 15,
    pending_reports: 1,
  },
  {
    id: "athlete-3",
    first_name: "Lucas",
    last_name: "Bernard",
    sport: ["cyclisme"],
    weight_kg: 72.1,
    vo2max: 68,
    avg_energy_7d: 7.6,
    next_race: "Granfondo des Vosges",
    next_race_days: 62,
    pending_reports: 0,
  },
];

function PageHeader({
  kicker,
  title,
  desc,
  action,
}: {
  kicker: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <div className="kicker">{kicker}</div>
          <h1
            className="font-extrabold uppercase mt-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "34px",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          <div className="flex gap-1 mt-2">
            <div className="h-1 w-16 bg-[var(--color-primary)] rounded-full" />
            <div className="h-1 w-6 bg-[var(--color-accent)] rounded-full" />
          </div>
        </div>
        {action}
      </div>
      {desc && (
        <p className="text-[var(--color-text-muted)] mt-3 text-sm max-w-2xl leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  color = "var(--color-primary)",
  note,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  note?: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: "14px 16px", borderTop: `3px solid ${color}` }}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export default function CoachDashboard() {
  const lowEnergyAlerts = mockAthletes.filter((a) => a.avg_energy_7d < 6);
  const pendingReports = mockAthletes.filter((a) => a.pending_reports > 0);
  const avgEnergy = (
    mockAthletes.reduce((s, a) => s + a.avg_energy_7d, 0) / mockAthletes.length
  ).toFixed(1);

  return (
    <div>
      <PageHeader
        kicker="Espace coach"
        title="Tableau de bord"
        desc={`${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} · ${mockAthletes.length} athlètes actifs`}
        action={
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
              className="card flex items-center gap-3 p-4"
              style={{
                borderLeft: `5px solid var(--color-primary)`,
                background: "#fff7f3",
              }}
            >
              <AlertTriangle className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <p className="text-sm flex-1">
                <strong>
                  {athlete.first_name} {athlete.last_name}
                </strong>{" "}
                — Énergie faible ({athlete.avg_energy_7d.toFixed(1)}/10 sur 7j).
                Vérifier la charge d&apos;entraînement.
              </p>
              <Link
                href={`/coach/athletes/${athlete.id}`}
                className="btn-ghost btn-sm"
              >
                Voir le profil
              </Link>
            </motion.div>
          ))}

          {pendingReports.map((athlete) => (
            <motion.div
              key={`report-${athlete.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="card flex items-center gap-3 p-4"
              style={{
                borderLeft: `5px solid var(--color-dark)`,
                background: "#f8f8f6",
              }}
            >
              <FileText className="w-5 h-5 text-[var(--color-dark)] shrink-0" />
              <p className="text-sm flex-1">
                <strong>
                  {athlete.first_name} {athlete.last_name}
                </strong>{" "}
                a envoyé {athlete.pending_reports} compte
                {athlete.pending_reports > 1 ? "s" : ""} rendu
                {athlete.pending_reports > 1 ? "s" : ""} à valider.
              </p>
              <Link
                href={`/coach/athletes/${athlete.id}`}
                className="btn-ghost btn-sm"
              >
                Répondre
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi
          label="Athlètes actifs"
          value={mockAthletes.length}
          color="var(--color-primary)"
        />
        <Kpi
          label="CRs en attente"
          value={pendingReports.reduce((s, a) => s + a.pending_reports, 0)}
          color="var(--color-dark)"
        />
        <Kpi
          label="Alertes énergie"
          value={lowEnergyAlerts.length}
          color="var(--color-danger)"
        />
        <Kpi
          label="Énergie moy. groupe"
          value={avgEnergy}
          unit="/10"
          color="var(--color-success)"
        />
      </div>

      {/* Athletes list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-extrabold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              letterSpacing: "-0.01em",
            }}
          >
            Mes athlètes
          </h2>
          <Link href="/coach/athletes" className="btn-ghost btn-sm">
            Voir tous
          </Link>
        </div>

        <div className="space-y-2">
          {mockAthletes.map((athlete, i) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={`/coach/athletes/${athlete.id}`}>
                <div
                  className="flex items-center gap-4 p-3 rounded-[10px] transition-all cursor-pointer hover:bg-[var(--color-surface-2)]"
                  style={{ border: `1px solid var(--color-border)` }}
                >
                  {/* Avatar (initials) */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold shrink-0"
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {athlete.first_name[0]}
                    {athlete.last_name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3
                        className="text-sm uppercase"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {athlete.first_name} {athlete.last_name}
                      </h3>
                      {athlete.avg_energy_7d < 6 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      )}
                      {athlete.pending_reports > 0 && (
                        <span className="badge">
                          {athlete.pending_reports} CR
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="capitalize">{athlete.sport[0]}</span>
                      <span>VO₂max {athlete.vo2max}</span>
                      <span>{athlete.weight_kg} kg</span>
                      {athlete.next_race && (
                        <span className="text-[var(--color-primary)] font-semibold">
                          → {athlete.next_race} ({athlete.next_race_days}j)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Energy score */}
                  <div className="text-right shrink-0">
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 22,
                        lineHeight: 1.1,
                        color:
                          athlete.avg_energy_7d >= 7
                            ? "var(--color-success)"
                            : athlete.avg_energy_7d >= 5
                              ? "var(--color-primary)"
                              : "var(--color-danger)",
                      }}
                    >
                      {athlete.avg_energy_7d.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      énergie/10
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-8 tracking-[0.1em] uppercase">
        Mock data — sera connecté à Supabase
      </p>
    </div>
  );
}
