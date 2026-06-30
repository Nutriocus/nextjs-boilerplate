"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Activity, Calendar, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { loadData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty } from "@/components/ui/PageHeader";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

// ============== TYPES ==============
type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: string[] | null;
  status: string | null;
  subscription_tier: string | null;
};

const TIER_GROUPS: { tier: string; label: string; color: string }[] = [
  { tier: "mission_performance", label: "Mission Performance", color: "var(--color-primary)" },
  { tier: "progression_guidee", label: "Progression Guidée", color: "var(--color-success)" },
  { tier: "plateforme", label: "Plateforme Nutriocus", color: "var(--color-dark)" },
];

type Profile = { poids?: number | string; vo2max?: number | string; photo?: string };
type EventItem = { id?: string; date: string; name: string };
type Consultation = { id: string; date: string; type?: string };
type MealPlan = { id: string; name: string; status?: "actif" | "archive"; dateDebut?: string; dateFin?: string; kcal?: number | string; maintenanceKcal?: number | string };
type CompoEntry = { date: string; poids?: number | string };
type Suivi = { label?: string; dateDebut?: string; dateFin?: string };
type AthleteSummary = {
  athlete: AthleteRow;
  photo: string | null;
  poids: number | null;
  vo2max: number | null;
  nextRace: { name: string; date: string; days: number } | null;
  recentRace: { name: string; date: string; daysAgo: number } | null;
  nextConsult: { date: string; days: number } | null;
  activePlans: number;
  suiviProgress: number | null;
  suiviDaysLeft: number | null;
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
        .select("id, first_name, last_name, email, sport, status, subscription_tier")
        .eq("coach_id", coach.id)
        .order("first_name");

      const athleteList = (list as AthleteRow[]) || [];
      setAthletes(athleteList);

      // Fetch each athlete's summary in parallel
      const sums = await Promise.all(
        athleteList.map(async (a): Promise<AthleteSummary> => {
          const [profile, events, consultations, meals, compo, suivi] = await Promise.all([
            loadData<Profile>("profile", {}, a.id),
            loadData<EventItem[]>("events", [], a.id),
            loadData<Consultation[]>("consultations", [], a.id),
            loadData<MealPlan[]>("meal", [], a.id),
            loadData<CompoEntry[]>("compo", [], a.id),
            loadData<Suivi>("suivi", {}, a.id),
          ]);

          const futureRaces = events
            .filter((e) => e.date && e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
          const nextRace = futureRaces[0]
            ? { name: futureRaces[0].name, date: futureRaces[0].date, days: daysBetween(today, futureRaces[0].date) }
            : null;

          const pastRaces = events
            .filter((e) => e.date && e.date < today && daysBetween(e.date, today) <= 7)
            .sort((a, b) => b.date.localeCompare(a.date));
          const recentRace = pastRaces[0]
            ? { name: pastRaces[0].name, date: pastRaces[0].date, daysAgo: daysBetween(pastRaces[0].date, today) }
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

          return {
            athlete: a,
            photo: profile?.photo || null,
            poids: profile.poids != null ? toNum(profile.poids) : null,
            vo2max: profile.vo2max != null ? toNum(profile.vo2max) : null,
            nextRace,
            recentRace,
            nextConsult,
            activePlans,
            suiviProgress,
            suiviDaysLeft,
            weightDrift30d,
          };
        }),
      );
      setSummaries(sums);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const recentRacesList = useMemo(
    () =>
      summaries
        .filter((s) => s.recentRace)
        .sort((a, b) => (a.recentRace!.daysAgo - b.recentRace!.daysAgo)),
    [summaries],
  );

  const upcomingRacesList = useMemo(
    () =>
      summaries
        .filter((s) => s.nextRace && s.nextRace.days <= 15)
        .sort((a, b) => a.nextRace!.days - b.nextRace!.days),
    [summaries],
  );

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

      <InstallPrompt />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Athlètes" value={athletes.length} color="var(--color-primary)" />
        <Kpi label="Suivis actifs" value={activeSuivis} note="programmes en cours" color="var(--color-success)" />
        <Kpi label="Courses ce mois" value={racesThisMonth} color="var(--color-dark)" />
        <Kpi
          label="Courses 15j"
          value={upcomingRacesList.length}
          note={recentRacesList.length > 0 ? `${recentRacesList.length} récente${recentRacesList.length > 1 ? "s" : ""}` : undefined}
          color={upcomingRacesList.length > 0 ? "var(--color-primary)" : "var(--color-dark)"}
        />
      </div>

      {/* Courses récentes & à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Courses récentes (7 derniers jours) */}
        <div className="card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              🏁 Courses récentes
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">7 derniers jours</div>
          </div>

          {recentRacesList.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)] py-3 text-center">
              Aucune course terminée cette semaine.
            </div>
          ) : (
            <div className="space-y-2">
              {recentRacesList.map((s, i) => {
                const a = s.athlete;
                const r = s.recentRace!;
                return (
                  <motion.div
                    key={`recent-${a.id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/athlete/race-analysis?athleteId=${a.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition"
                      style={{ borderLeft: `4px solid var(--color-success)`, background: "#f3faf5" }}
                    >
                      <div
                        className="px-2 py-1 rounded font-extrabold text-xs shrink-0"
                        style={{ background: "var(--color-success)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: ".04em" }}
                      >
                        J+{r.daysAgo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <strong className="uppercase text-[11px] tracking-wider" style={{ letterSpacing: ".06em" }}>
                            {a.first_name} {a.last_name}
                          </strong>
                          <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
                          {r.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {format(parseISO(r.date), "EEEE d MMMM", { locale: fr })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Courses à venir (15 prochains jours) */}
        <div className="card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              📅 Courses à venir
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">15 prochains jours</div>
          </div>

          {upcomingRacesList.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)] py-3 text-center">
              Aucune course planifiée dans les 15 jours.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRacesList.map((s, i) => {
                const a = s.athlete;
                const r = s.nextRace!;
                const urgent = r.days <= 5;
                return (
                  <motion.div
                    key={`upcoming-${a.id}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/athlete/race-strategy?athleteId=${a.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition"
                      style={{
                        borderLeft: `4px solid ${urgent ? "var(--color-danger)" : "var(--color-primary)"}`,
                        background: urgent ? "#fff3f3" : "#fff7f3",
                      }}
                    >
                      <div
                        className="px-2 py-1 rounded font-extrabold text-xs shrink-0"
                        style={{
                          background: urgent ? "var(--color-danger)" : "var(--color-primary)",
                          color: "#fff",
                          fontFamily: "var(--font-display)",
                          letterSpacing: ".04em",
                        }}
                      >
                        J-{r.days}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <strong className="uppercase text-[11px] tracking-wider" style={{ letterSpacing: ".06em" }}>
                            {a.first_name} {a.last_name}
                          </strong>
                          <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
                          {r.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {format(parseISO(r.date), "EEEE d MMMM", { locale: fr })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
          <div className="space-y-6">
            {(() => {
              const knownTiers = new Set(TIER_GROUPS.map((g) => g.tier));
              const groups: { tier: string; label: string; color: string; items: AthleteSummary[] }[] = [];
              for (const g of TIER_GROUPS) {
                groups.push({
                  ...g,
                  items: summaries.filter((s) => s.athlete.subscription_tier === g.tier),
                });
              }
              const orphans = summaries.filter((s) => !knownTiers.has(s.athlete.subscription_tier ?? ""));
              if (orphans.length > 0) {
                groups.push({
                  tier: "_other",
                  label: "Sans offre renseignée",
                  color: "var(--color-text-muted)",
                  items: orphans,
                });
              }

              return groups
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.tier}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: group.color }}
                      />
                      <h3
                        className="text-xs font-extrabold uppercase"
                        style={{
                          fontFamily: "var(--font-display)",
                          letterSpacing: ".08em",
                          color: group.color,
                        }}
                      >
                        {group.label}
                      </h3>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        · {group.items.length} athlète{group.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((s, i) => {
                        const a = s.athlete;
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
                                style={{
                                  border: "1px solid var(--color-border)",
                                  borderLeft: `4px solid ${group.color}`,
                                }}
                              >
                                {s.photo ? (
                                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid var(--color-border)" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={s.photo} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold shrink-0"
                                    style={{ background: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-display)" }}
                                  >
                                    {a.first_name[0]}
                                    {a.last_name[0]}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm uppercase" style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.01em" }}>
                                    {a.first_name} {a.last_name}
                                  </h3>
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
                  </div>
                ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
