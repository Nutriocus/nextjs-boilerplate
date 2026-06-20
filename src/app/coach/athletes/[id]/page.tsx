"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { ATHLETE_NAV } from "@/components/athlete/AthleteSidebar";
import { loadData, saveData } from "@/lib/athlete-storage";
import {
  PARCOURS,
  getPhaseProgress,
  getPhaseUnlocked,
  getOverallProgress,
  getNextMission,
} from "@/lib/parcours";

type Suivi = { label: string; dateDebut: string; dateFin: string };
const DEFAULT_SUIVI: Suivi = { label: "Coaching Nutriocus", dateDebut: "", dateFin: "" };

type AthleteRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: string[] | null;
  level: string | null;
  status: string | null;
};

export default function CoachAthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const athleteId = params.id;
  const [athlete, setAthlete] = useState<AthleteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ poids?: number | string; tolGlucCAP?: number | string; vo2max?: number | string } | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [suivi, setSuivi] = useState<Suivi>(DEFAULT_SUIVI);
  const [savingSuivi, setSavingSuivi] = useState(false);
  const [suiviSaved, setSuiviSaved] = useState(false);
  const [parcoursData, setParcoursData] = useState<{
    snapshot: import("@/lib/parcours").ParcoursSnapshot;
    progress: import("@/lib/parcours").ParcoursProgress;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!athleteId) return;
      const { data } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, email, sport, level, status")
        .eq("id", athleteId)
        .single();
      setAthlete((data as AthleteRow) || null);

      const prof = await loadData<typeof profile>("profile", {}, athleteId);
      setProfile(prof);

      const events = await loadData<{ date: string }[]>("events", [], athleteId);
      const today = new Date().toISOString().slice(0, 10);
      setEventsCount(events.filter((e) => e.date >= today).length);

      const s = await loadData<Suivi>("suivi", DEFAULT_SUIVI, athleteId);
      setSuivi({ ...DEFAULT_SUIVI, ...s });

      // Parcours snapshot: load every storage key the parcours observes
      const [compo, eventsAll, energy, sweat, tolTests, bloodTests, mealPlans, racePlans, prerace, raceAnalyses, parcoursProgress] = await Promise.all([
        loadData<{ date?: string }[]>("compo", [], athleteId),
        loadData<{ name?: string; date?: string }[]>("events", [], athleteId),
        loadData<{ date?: string }[]>("energy", [], athleteId),
        loadData<unknown[]>("sweat", [], athleteId),
        loadData<unknown[]>("tests", [], athleteId),
        loadData<unknown[]>("blood_tests", [], athleteId),
        loadData<unknown[]>("meal", [], athleteId),
        loadData<unknown[]>("raceplans", [], athleteId),
        loadData<{ dateCible?: string } | null>("prerace", null, athleteId),
        loadData<unknown[]>("races", [], athleteId),
        loadData<import("@/lib/parcours").ParcoursProgress>("parcours_progress", { manual: {}, freeMode: false }, athleteId),
      ]);
      setParcoursData({
        snapshot: { profile: prof as Record<string, unknown>, compo, events: eventsAll, energy, sweat, tolTests, bloodTests, mealPlans, racePlans, prerace, raceAnalyses },
        progress: parcoursProgress,
      });

      setLoading(false);
    })();
  }, [athleteId]);

  if (loading) {
    return (
      <div>
        <PageHeader kicker="Espace coach" title="Athlète" />
        <div className="card p-10 text-center text-[var(--color-text-muted)]">Chargement…</div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div>
        <PageHeader kicker="Espace coach" title="Athlète non trouvé" />
        <Link href="/coach/athletes" className="btn-ghost btn-sm">← Retour</Link>
      </div>
    );
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`;

  let suiviProgress: number | null = null;
  let suiviDaysLeft: number | null = null;
  if (suivi.dateDebut && suivi.dateFin) {
    const total = +new Date(suivi.dateFin) - +new Date(suivi.dateDebut);
    const elapsed = +new Date() - +new Date(suivi.dateDebut);
    suiviProgress = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0;
    suiviDaysLeft = Math.max(0, Math.ceil((+new Date(suivi.dateFin) - +new Date()) / 86400000));
  }

  return (
    <div>
      <Link href="/coach/athletes" className="btn-ghost btn-sm mb-3 inline-flex">
        ← Mes athlètes
      </Link>

      <PageHeader
        kicker={`Espace coach · ${athlete.email}`}
        title={fullName}
        desc={athlete.sport?.join(" · ") || ""}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Poids" value={profile?.poids ?? "—"} unit="kg" color="var(--color-primary)" />
        <Kpi label="VO₂max" value={profile?.vo2max ?? "—"} unit="ml/kg/min" color="var(--color-dark)" />
        <Kpi label="Tol. glucides" value={profile?.tolGlucCAP ?? "—"} unit="g/h" color="var(--color-success)" />
        <Kpi label="Objectifs à venir" value={eventsCount} color="#8a8a88" />
      </div>

      {/* Parcours overview — shows the athlete's structured journey progress */}
      {parcoursData && (() => {
        const { snapshot, progress } = parcoursData;
        const overall = getOverallProgress(snapshot, progress);
        const next = getNextMission(snapshot, progress);
        return (
          <div className="card p-5 mb-6" style={{ borderLeft: "5px solid var(--color-primary)" }}>
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
                  🗺 Parcours Nutriocus
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Avancement de {athlete.first_name} dans le parcours structuré en 4 phases
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".08em" }}>
                  Global
                </div>
                <div className="font-display font-extrabold text-3xl" style={{ color: "var(--color-primary)", letterSpacing: "-0.01em" }}>
                  {overall.pct}%
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {overall.done}/{overall.total} missions
                </div>
              </div>
            </div>

            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--color-surface-2)" }}>
              <div
                style={{
                  width: `${overall.pct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                  transition: "width .3s",
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              {PARCOURS.map((phase) => {
                const pr = getPhaseProgress(phase, snapshot, progress);
                const unlocked = getPhaseUnlocked(phase, snapshot, progress);
                return (
                  <div
                    key={phase.id}
                    className="rounded-lg p-2.5"
                    style={{
                      background: "var(--color-surface-2)",
                      borderLeft: `3px solid ${phase.color}`,
                      opacity: unlocked ? 1 : 0.55,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span style={{ fontSize: 14 }}>{phase.icon}</span>
                      <span className="text-[10px] uppercase font-extrabold" style={{ letterSpacing: ".08em", color: phase.color }}>
                        Phase {phase.id}
                      </span>
                      {!unlocked && <span className="text-[10px]">🔒</span>}
                    </div>
                    <div className="font-extrabold text-xs mb-0.5">{phase.title}</div>
                    <div
                      className="font-extrabold text-sm"
                      style={{
                        color: pr.complete ? "var(--color-success)" : "var(--color-text)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {pr.done}/{pr.total}
                      {pr.complete && <span className="ml-1 text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {next ? (
              <div
                className="rounded-lg p-3 flex items-start gap-3"
                style={{ background: "rgba(255,69,1,0.06)", border: "1px solid rgba(255,69,1,0.25)" }}
              >
                <div style={{ fontSize: 22 }}>⚡</div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-bold mb-0.5" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                    Prochaine étape à faire
                  </div>
                  <div className="font-extrabold text-sm">
                    {next.mission.title}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Phase {next.phase.id} — {next.phase.title} · {next.mission.durationLabel}
                  </div>
                </div>
                <Link href={`/athlete/parcours?athleteId=${athleteId}`}>
                  <button className="btn-dark btn-sm">Ouvrir le parcours</button>
                </Link>
              </div>
            ) : (
              <div
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ background: "rgba(95,140,10,0.10)", border: "1px solid rgba(95,140,10,0.30)" }}
              >
                <div style={{ fontSize: 22 }}>🏆</div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm">Parcours terminé</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {athlete.first_name} a complété toutes les phases — focus sur le pilotage long terme.
                  </div>
                </div>
                <Link href={`/athlete/parcours?athleteId=${athleteId}`}>
                  <button className="btn-ghost btn-sm">Voir le parcours</button>
                </Link>
              </div>
            )}
          </div>
        );
      })()}

      <div className="card p-5 mb-6" style={{ borderLeft: "5px solid var(--color-primary)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              Suivi de l&apos;athlète
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Définis le label du programme et les dates de début/fin. La barre de progression du tableau de bord se met à jour automatiquement.
            </div>
          </div>
          {suiviProgress != null && (
            <div className="flex items-center gap-3">
              <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Progression</div>
              <div className="text-2xl font-extrabold" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                {suiviProgress}%
              </div>
              {suiviDaysLeft != null && (
                <div className="text-xs text-[var(--color-text-muted)]">
                  {suiviDaysLeft} j restants
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Label du programme">
            <input
              className="input"
              value={suivi.label}
              onChange={(e) => setSuivi((s) => ({ ...s, label: e.target.value }))}
              placeholder="Ex. Coaching Nutriocus"
            />
          </Field>
          <Field label="Date de début">
            <input
              className="input"
              type="date"
              value={suivi.dateDebut}
              onChange={(e) => setSuivi((s) => ({ ...s, dateDebut: e.target.value }))}
            />
          </Field>
          <Field label="Date de fin">
            <input
              className="input"
              type="date"
              value={suivi.dateFin}
              onChange={(e) => setSuivi((s) => ({ ...s, dateFin: e.target.value }))}
            />
          </Field>
        </div>

        {suivi.dateDebut && suivi.dateFin && (
          <div className="mt-3">
            <div className="h-2.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div
                style={{
                  width: (suiviProgress ?? 0) + "%",
                  height: "100%",
                  background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                  transition: "width .3s",
                }}
              />
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1.5">
              {new Date(suivi.dateDebut).toLocaleDateString("fr-FR")} → {new Date(suivi.dateFin).toLocaleDateString("fr-FR")}
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-3 mt-4">
          {suiviSaved && <span className="text-[var(--color-success)] text-sm font-semibold">✓ Enregistré</span>}
          <button
            onClick={async () => {
              setSavingSuivi(true);
              await saveData("suivi", suivi, athleteId);
              setSavingSuivi(false);
              setSuiviSaved(true);
              setTimeout(() => setSuiviSaved(false), 2500);
            }}
            disabled={savingSuivi}
            className="btn-primary btn-sm"
          >
            {savingSuivi ? "Enregistrement…" : "Enregistrer le suivi"}
          </button>
        </div>
      </div>

      <div className="kicker mb-3">Accéder à ses modules</div>
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        Tu accèdes à ses données en lecture/écriture (même interface que l&apos;athlète).
      </div>

      {ATHLETE_NAV.map((section) =>
        section.grp ? (
          <div key={section.grp} className="mb-5">
            <div className="kicker mb-2.5">{section.grp}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {section.items.map((item) => (
                <Link key={item.href} href={`${item.href}?athleteId=${athleteId}`}>
                  <div
                    className="card p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderLeft: `5px solid var(--color-primary)` }}
                  >
                    <div className="font-extrabold text-[13px] flex items-center gap-2">
                      <span style={{ opacity: 0.6 }}>{item.ic}</span>
                      {item.label}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div key="root" className="mb-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {section.items.map((item) => (
                <Link key={item.href} href={`${item.href}?athleteId=${athleteId}`}>
                  <div
                    className="card p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderLeft: `5px solid var(--color-dark)` }}
                  >
                    <div className="font-extrabold text-[13px] flex items-center gap-2">
                      <span style={{ opacity: 0.6 }}>{item.ic}</span>
                      {item.label}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ),
      )}

      <div className="text-xs text-[var(--color-text-muted)] mt-6 text-center">
        Tu navigues actuellement dans les données de <b>{fullName}</b>. Le paramètre <code>?athleteId={athleteId.slice(0, 8)}…</code> est passé dans les URLs.
      </div>
    </div>
  );
}
