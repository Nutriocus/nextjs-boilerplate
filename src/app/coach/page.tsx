"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Users, Activity, Calendar, ChevronRight, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { loadData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty } from "@/components/ui/PageHeader";

// ============== TYPES ==============
type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: string[] | null;
  status: string | null;
};

type Profile = { poids?: number | string; vo2max?: number | string };
type EventItem = { id?: string; date: string; name: string };
type Consultation = { id: string; date: string; type?: string };
type MealPlan = { id: string; name: string; status?: "actif" | "archive"; dateDebut?: string; dateFin?: string; kcal?: number | string; maintenanceKcal?: number | string };
type CompoEntry = { date: string; poids?: number | string };
type Suivi = { label?: string; dateDebut?: string; dateFin?: string };
type Questionnaire = { nom?: string; prenom?: string } | Record<string, unknown>;

type Alert = {
  severity: "high" | "medium" | "low";
  athleteId: string;
  athleteName: string;
  icon: string;
  title: string;
  detail?: string;
  href: string;
};

type AthleteSummary = {
  athlete: AthleteRow;
  poids: number | null;
  vo2max: number | null;
  nextRace: { name: string; date: string; days: number } | null;
  nextConsult: { date: string; days: number } | null;
  activePlans: number;
  suiviProgress: number | null;
  suiviDaysLeft: number | null;
  intakeFilled: boolean;
  weightDrift30d: number | null;
};

// ============== HELPERS ==============
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function buildAlerts(s: AthleteSummary): Alert[] {
  const alerts: Alert[] = [];
  const a = s.athlete;
  const name = `${a.first_name} ${a.last_name}`;
  const baseHref = `/coach/athletes/${a.id}`;

  // 🟥 Race in < 14 days without active meal plan
  if (s.nextRace && s.nextRace.days >= 0 && s.nextRace.days <= 14 && s.activePlans === 0) {
    alerts.push({
      severity: "high",
      athleteId: a.id,
      athleteName: name,
      icon: "🏁",
      title: `Course ${s.nextRace.name} dans ${s.nextRace.days} j sans plan alimentaire actif`,
      detail: "Définis un plan alimentaire avant la course.",
      href: `/athlete/meal-plans?athleteId=${a.id}`,
    });
  }

  // 🟧 Race in < 5 days → trigger pre-race plan
  if (s.nextRace && s.nextRace.days >= 0 && s.nextRace.days <= 5) {
    alerts.push({
      severity: s.nextRace.days <= 2 ? "high" : "medium",
      athleteId: a.id,
      athleteName: name,
      icon: "🍽",
      title: `Période pré-course ${s.nextRace.name} (J-${s.nextRace.days})`,
      detail: "Vérifie le plan alimentaire J-4 → Jour J.",
      href: `/athlete/pre-race?athleteId=${a.id}`,
    });
  }

  // 🟧 Weight drift > 2 kg in 30 days
  if (s.weightDrift30d != null && Math.abs(s.weightDrift30d) >= 2) {
    alerts.push({
      severity: "medium",
      athleteId: a.id,
      athleteName: name,
      icon: "⚖️",
      title: `Dérive de poids ${s.weightDrift30d > 0 ? "+" : ""}${s.weightDrift30d.toFixed(1)} kg sur 30 j`,
      detail: "Variation significative, à valider.",
      href: `/athlete/composition?athleteId=${a.id}`,
    });
  }

  // 🟨 Intake questionnaire not filled
  if (!s.intakeFilled) {
    alerts.push({
      severity: "low",
      athleteId: a.id,
      athleteName: name,
      icon: "📝",
      title: "Questionnaire d'introduction non rempli",
      detail: "À faire remplir avant la 1ère consultation.",
      href: `/athlete/profile?athleteId=${a.id}`,
    });
  }

  // 🟦 Consultation today/tomorrow
  if (s.nextConsult && s.nextConsult.days >= 0 && s.nextConsult.days <= 1) {
    alerts.push({
      severity: "medium",
      athleteId: a.id,
      athleteName: name,
      icon: "📋",
      title: s.nextConsult.days === 0 ? "Consultation aujourd'hui" : "Consultation demain",
      href: `/athlete/consultations?athleteId=${a.id}`,
    });
  }

  // 🟪 Suivi (program) ending in < 14 days
  if (s.suiviDaysLeft != null && s.suiviDaysLeft >= 0 && s.suiviDaysLeft <= 14) {
    alerts.push({
      severity: "low",
      athleteId: a.id,
      athleteName: name,
      icon: "⏳",
      title: `Fin de suivi dans ${s.suiviDaysLeft} j`,
      detail: "Planifie le bilan ou le renouvellement.",
      href: baseHref,
    });
  }

  return alerts;
}

// ============== PAGE ==============
export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [summaries, setSummaries] = useState<AthleteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const today = toLocalISODate(new Date());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!coach) {
        setLoading(false);
        return;
      }
      const { data: list } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, email, sport, status")
        .eq("coach_id", coach.id)
        .order("first_name");

      const athleteList = (list as AthleteRow[]) || [];
      setAthletes(athleteList);

      // Fetch each athlete's summary in parallel
      const sums = await Promise.all(
        athleteList.map(async (a): Promise<AthleteSummary> => {
          const [profile, events, consultations, meals, compo, suivi, questionnaire] = await Promise.all([
            loadData<Profile>("profile", {}, a.id),
            loadData<EventItem[]>("events", [], a.id),
            loadData<Consultation[]>("consultations", [], a.id),
            loadData<MealPlan[]>("meal", [], a.id),
            loadData<CompoEntry[]>("compo", [], a.id),
            loadData<Suivi>("suivi", {}, a.id),
            loadData<Questionnaire>("questionnaire", {}, a.id),
          ]);

          const futureRaces = events
            .filter((e) => e.date && e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
          const nextRace = futureRaces[0]
            ? { name: futureRaces[0].name, date: futureRaces[0].date, days: daysBetween(today, futureRaces[0].date) }
            : null;

          const futureConsults = consultations
            .filter((c) => c.date && c.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
          const nextConsult = futureConsults[0]
            ? { date: futureConsults[0].date, days: daysBetween(today, futureConsults[0].date) }
            : null;

          const activePlans = meals.filter((m) => m.status !== "archive").length;

          let suiviProgress: number | null = null;
          let suiviDaysLeft: number | null = null;
          if (suivi.dateDebut && suivi.dateFin) {
            const total = parseISO(suivi.dateFin).getTime() - parseISO(suivi.dateDebut).getTime();
            const elapsed = Date.now() - parseISO(suivi.dateDebut).getTime();
            suiviProgress = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0;
            suiviDaysLeft = Math.max(0, Math.ceil((parseISO(suivi.dateFin).getTime() - Date.now()) / 86400000));
          }

          // Weight drift over last 30 days from compo entries
          const sortedCompo = [...compo].filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
          const latest = sortedCompo[sortedCompo.length - 1];
          const reference = sortedCompo.find((c) => daysBetween(c.date, today) <= 35 && daysBetween(c.date, today) >= 20);
          const weightDrift30d =
            latest?.poids != null && reference?.poids != null
              ? toNum(latest.poids) - toNum(reference.poids)
              : null;

          const intakeFilled = Boolean(
            (questionnaire as Questionnaire & { nom?: string; prenom?: string })?.nom ||
              (questionnaire as Questionnaire & { nom?: string; prenom?: string })?.prenom,
          );

          return {
            athlete: a,
            poids: profile.poids != null ? toNum(profile.poids) : null,
            vo2max: profile.vo2max != null ? toNum(profile.vo2max) : null,
            nextRace,
            nextConsult,
            activePlans,
            suiviProgress,
            suiviDaysLeft,
            intakeFilled,
            weightDrift30d,
          };
        }),
      );
      setSummaries(sums);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allAlerts = useMemo(() => {
    const out: Alert[] = [];
    for (const s of summaries) out.push(...buildAlerts(s));
    const order = { high: 0, medium: 1, low: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [summaries]);

  const highAlerts = allAlerts.filter((a) => a.severity === "high");
  const mediumAlerts = allAlerts.filter((a) => a.severity === "medium");
  const lowAlerts = allAlerts.filter((a) => a.severity === "low");

  // Global stats
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = (() => {
    const d = parseISO(monthStart);
    d.setMonth(d.getMonth() + 1);
    return toLocalISODate(d);
  })();

  const consultationsThisMonth = summaries.reduce((s, sum) => {
    // We didn't store all consultations, just nextConsult.
    // To get this month count we'd need to re-fetch. Use a placeholder.
    return s + (sum.nextConsult && sum.nextConsult.date >= monthStart && sum.nextConsult.date < monthEnd ? 1 : 0);
  }, 0);

  const racesThisMonth = summaries.filter(
    (s) => s.nextRace && s.nextRace.date >= monthStart && s.nextRace.date < monthEnd,
  ).length;

  const activeSuivis = summaries.filter((s) => s.suiviProgress != null && s.suiviDaysLeft != null && s.suiviDaysLeft > 0).length;

  const alertSeverityStyle = (sev: Alert["severity"]) => {
    switch (sev) {
      case "high":
        return { border: "var(--color-danger)", bg: "#fff3f3" };
      case "medium":
        return { border: "var(--color-primary)", bg: "#fff7f3" };
      case "low":
        return { border: "var(--color-dark)", bg: "#f8f8f6" };
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader kicker="Espace coach" title="Tableau de bord" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Espace coach"
        title="Tableau de bord"
        desc={`${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} · ${athletes.length} athlète${athletes.length > 1 ? "s" : ""}`}
        action={
          <div className="flex gap-1.5 flex-wrap">
            <Link href="/coach/athletes" className="btn-primary">
              <Users className="w-4 h-4 inline mr-1" />
              Gérer les athlètes
            </Link>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Athlètes" value={athletes.length} color="var(--color-primary)" />
        <Kpi label="Suivis actifs" value={activeSuivis} note="programmes en cours" color="var(--color-success)" />
        <Kpi label="Courses ce mois" value={racesThisMonth} color="var(--color-dark)" />
        <Kpi
          label="Alertes"
          value={allAlerts.length}
          note={highAlerts.length > 0 ? `${highAlerts.length} critique${highAlerts.length > 1 ? "s" : ""}` : undefined}
          color={highAlerts.length > 0 ? "var(--color-danger)" : allAlerts.length > 0 ? "var(--color-primary)" : "var(--color-success)"}
        />
      </div>

      {/* Alertes */}
      {allAlerts.length > 0 ? (
        <div className="card p-4 mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              ⚠ Alertes & actions
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {highAlerts.length} critique{highAlerts.length > 1 ? "s" : ""} · {mediumAlerts.length} à surveiller · {lowAlerts.length} info
            </div>
          </div>

          <div className="space-y-2">
            {allAlerts.slice(0, 8).map((alert, i) => {
              const style = alertSeverityStyle(alert.severity);
              return (
                <motion.div
                  key={`${alert.athleteId}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={alert.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition"
                    style={{ borderLeft: `4px solid ${style.border}`, background: style.bg }}
                  >
                    <div className="text-xl shrink-0">{alert.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <strong className="uppercase text-[11px] tracking-wider" style={{ letterSpacing: ".06em" }}>
                          {alert.athleteName}
                        </strong>
                        <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
                        {alert.title}
                      </div>
                      {alert.detail && (
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{alert.detail}</div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
            {allAlerts.length > 8 && (
              <div className="text-xs text-[var(--color-text-muted)] text-center pt-2">
                +{allAlerts.length - 8} alerte{allAlerts.length - 8 > 1 ? "s" : ""} supplémentaire{allAlerts.length - 8 > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      ) : athletes.length > 0 ? (
        <div className="card p-4 mb-6 text-center text-sm text-[var(--color-text-muted)]" style={{ borderLeft: `4px solid var(--color-success)` }}>
          <Sparkles className="inline w-4 h-4 mr-1 text-[var(--color-success)]" />
          Aucune alerte — tous tes athlètes sont à jour. Bon coaching !
        </div>
      ) : null}

      {/* Athletes table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "-0.01em" }}>
            <Activity className="inline w-4 h-4 mr-1" /> Mes athlètes
          </h2>
          <Link href="/coach/athletes" className="btn-ghost btn-sm">Voir tous →</Link>
        </div>

        {summaries.length === 0 ? (
          <Empty>Aucun athlète. Crée-en un dans Supabase pour démarrer.</Empty>
        ) : (
          <div className="space-y-2">
            {summaries.map((s, i) => {
              const a = s.athlete;
              const athleteAlerts = allAlerts.filter((al) => al.athleteId === a.id);
              const hasHigh = athleteAlerts.some((al) => al.severity === "high");
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/coach/athletes/${a.id}`}>
                    <div
                      className="flex items-center gap-3 p-3 rounded-[10px] transition hover:bg-[var(--color-surface-2)]"
                      style={{ border: "1px solid var(--color-border)", borderLeft: hasHigh ? "4px solid var(--color-danger)" : athleteAlerts.length > 0 ? "4px solid var(--color-primary)" : "1px solid var(--color-border)" }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold shrink-0"
                        style={{ background: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-display)" }}
                      >
                        {a.first_name[0]}
                        {a.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm uppercase" style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.01em" }}>
                            {a.first_name} {a.last_name}
                          </h3>
                          {athleteAlerts.length > 0 && (
                            <span
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{
                                background: hasHigh ? "var(--color-danger)" : "var(--color-primary)",
                                color: "#fff",
                                letterSpacing: ".06em",
                              }}
                            >
                              {athleteAlerts.length} alerte{athleteAlerts.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {!s.intakeFilled && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "#e6a833", color: "#fff", letterSpacing: ".06em" }}>
                              Intro à remplir
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)] mt-0.5">
                          {a.sport && a.sport.length > 0 && <span className="capitalize">{a.sport.join(" · ")}</span>}
                          {s.poids != null && <span>{s.poids} kg</span>}
                          {s.vo2max != null && <span>VO₂max {s.vo2max}</span>}
                          {s.activePlans > 0 && (
                            <span>{s.activePlans} plan{s.activePlans > 1 ? "s" : ""} actif{s.activePlans > 1 ? "s" : ""}</span>
                          )}
                          {s.nextRace && (
                            <span className="text-[var(--color-primary)] font-semibold">
                              <Calendar className="inline w-3 h-3 mr-0.5" />
                              {s.nextRace.name} (J-{s.nextRace.days})
                            </span>
                          )}
                          {s.nextConsult && !s.nextRace && (
                            <span className="text-[var(--color-dark)] font-semibold">
                              <FileText className="inline w-3 h-3 mr-0.5" />
                              Conseil J-{s.nextConsult.days}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {s.suiviProgress != null ? (
                          <>
                            <div className="font-extrabold text-base" style={{ color: "var(--color-success)", fontFamily: "var(--font-display)" }}>
                              {s.suiviProgress}%
                            </div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">
                              {s.suiviDaysLeft} j restants
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-[var(--color-text-muted)]">Pas de suivi</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
