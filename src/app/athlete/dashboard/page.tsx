"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader, Kpi } from "@/components/ui/PageHeader";
import { ATHLETE_NAV } from "@/components/athlete/AthleteSidebar";
import { useAthleteData } from "@/lib/athlete-storage";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

const DEFAULT_PROFILE = {
  sexe: "Homme",
  discipline: "Trail",
  poids: 71,
  fcmax: 190,
  vo2max: 62,
  poidsObjectif: 69,
  tolGlucCAP: 120,
  masseMaigre: 62,
  reservesGlucides: 850,
  photo: "",
};

const DEFAULT_SUIVI = {
  label: "Coaching Nutriocus",
  dateDebut: "",
  dateFin: "",
};

function SuiviHero({
  suivi,
  profile,
  nbConsultations,
  nbLessonsDone,
  nbLessonsTotal,
  nextObjectif,
}: {
  suivi: typeof DEFAULT_SUIVI;
  profile: typeof DEFAULT_PROFILE;
  nbConsultations: number;
  nbLessonsDone: number;
  nbLessonsTotal: number;
  nextObjectif: { name: string; daysLeft: number } | null;
}) {
  let progress = 0;
  let daysLeft: number | null = null;
  if (suivi.dateDebut && suivi.dateFin) {
    const total = +new Date(suivi.dateFin) - +new Date(suivi.dateDebut);
    const elapsed = +new Date() - +new Date(suivi.dateDebut);
    progress = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0;
    daysLeft = Math.max(0, Math.ceil((+new Date(suivi.dateFin) - +new Date()) / 86400000));
  }

  return (
    <div
      className="card mb-6 overflow-hidden"
      style={{
        background: "var(--color-dark)",
        border: "none",
        padding: 0,
      }}
    >
      <div
        style={{
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: 22,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 170 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {profile?.photo ? (
              <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>★</span>
            )}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, letterSpacing: ".02em" }}>MON SUIVI</div>
            <div
              style={{
                color: "#8a8a88",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              {suivi.label || "Programme"}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                color: "#8a8a88",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              Progression
            </span>
            <span style={{ color: "#fff", fontWeight: 800 }}>{progress}%</span>
          </div>
          <div style={{ height: 10, background: "#222", borderRadius: 20, overflow: "hidden" }}>
            <div
              style={{
                width: progress + "%",
                height: "100%",
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
              }}
            />
          </div>
          {suivi.dateDebut && suivi.dateFin && (
            <div style={{ color: "#8a8a88", fontSize: 11, marginTop: 5 }}>
              {new Date(suivi.dateDebut).toLocaleDateString("fr-FR")} → {new Date(suivi.dateFin).toLocaleDateString("fr-FR")}
              {daysLeft != null ? ` · ${daysLeft} j restants` : ""}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--color-accent)", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)" }}>
              {nbConsultations}
            </div>
            <div style={{ color: "#8a8a88", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Consult.
            </div>
          </div>
          <div>
            <div style={{ color: "var(--color-accent)", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)" }}>
              {nbLessonsDone}/{nbLessonsTotal}
            </div>
            <div style={{ color: "#8a8a88", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Leçons
            </div>
          </div>
          <div>
            <div style={{ color: "var(--color-accent)", fontWeight: 800, fontSize: 22, fontFamily: "var(--font-display)" }}>
              {nextObjectif ? `J-${nextObjectif.daysLeft}` : "—"}
            </div>
            <div style={{ color: "#8a8a88", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Objectif
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGrid({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; ic: string; color?: string }[];
}) {
  return (
    <div className="mb-6">
      <div className="kicker mb-3">{title}</div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href}>
            <div
              className="card p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderLeft: `5px solid ${it.color || "var(--color-primary)"}` }}
            >
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span style={{ opacity: 0.6 }}>{it.ic}</span>
                {it.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AthleteDashboardPage() {
  const [profile] = useAthleteData("profile", DEFAULT_PROFILE);
  const [suivi] = useAthleteData("suivi", DEFAULT_SUIVI);
  const [consultations] = useAthleteData<unknown[]>("consultations", []);
  const [academy] = useAthleteData<{ modules?: { lessons?: { done?: boolean }[] }[] }[]>("academy", []);
  const [events] = useAthleteData<{ name: string; date: string }[]>("events", []);
  const [energy] = useAthleteData<{ kcal?: number; depenseSortie?: number }[]>("energy", []);
  const [compo] = useAthleteData<{ date: string; masseMaigre?: number }[]>("compo", []);

  // KPIs
  const lastCompo = [...compo].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const masseMaigre = lastCompo?.masseMaigre ?? profile.masseMaigre;
  const recentEnergy = energy.slice(-21);
  const avgScore = masseMaigre && recentEnergy.length
    ? recentEnergy.reduce(
        (s, e) => s + ((Number(e.kcal) || 0) - (Number(e.depenseSortie) || 0)) / masseMaigre,
        0,
      ) / recentEnergy.length
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const nextObjectif = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const objWithDays = nextObjectif
    ? {
        name: nextObjectif.name,
        daysLeft: Math.max(
          0,
          Math.ceil((+new Date(nextObjectif.date) - +new Date(today)) / 86400000),
        ),
      }
    : null;

  let lessonsTotal = 0;
  let lessonsDone = 0;
  academy.forEach((f) =>
    f.modules?.forEach((m) =>
      m.lessons?.forEach((l) => {
        lessonsTotal++;
        if (l.done) lessonsDone++;
      }),
    ),
  );

  // Group the nav for the dashboard tiles
  const groupedSections = ATHLETE_NAV.filter((s) => s.grp && !s.grp.includes("accompagnement"));

  return (
    <div>
      <PageHeader
        kicker="Tableau de bord"
        title="Mission Performance"
      />

      <InstallPrompt />

      <SuiviHero
        suivi={suivi}
        profile={profile}
        nbConsultations={consultations.length}
        nbLessonsDone={lessonsDone}
        nbLessonsTotal={lessonsTotal}
        nextObjectif={objWithDays}
      />

      {/* Mon accompagnement */}
      <NavGrid
        title="Mon accompagnement"
        items={[
          { href: "/athlete/academy", label: "Académie", ic: "▷", color: "var(--color-primary)" },
          { href: "/athlete/consultations", label: "Mes consultations", ic: "◳", color: "var(--color-dark)" },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Poids actuel" value={profile?.poids || "—"} unit="kg" color="var(--color-primary)" />
        <Kpi
          label="Score dispo énergétique"
          value={avgScore ? avgScore.toFixed(1) : "—"}
          unit="kcal/kg"
          color="var(--color-success)"
          warn={avgScore < 30 && avgScore > 0}
          note={avgScore ? (avgScore < 30 ? "⚠ déficit" : "sain") : "—"}
        />
        <Kpi label="Tol. glucides" value={profile?.tolGlucCAP || "—"} unit="g/h" color="var(--color-dark)" />
        <Kpi
          label="Prochain objectif"
          value={objWithDays ? "J-" + objWithDays.daysLeft : "—"}
          color="#8a8a88"
          note={objWithDays?.name || "aucun"}
        />
      </div>

      {/* Sections */}
      {groupedSections.map((section) => (
        <NavGrid
          key={section.grp}
          title={section.grp}
          items={section.items.map((it) => ({ ...it, color: "var(--color-primary)" }))}
        />
      ))}

      <NavGrid
        title="Nutrition à l'effort & outils"
        items={ATHLETE_NAV[5].items.map((it) => ({
          ...it,
          color: "var(--color-dark)",
        }))}
      />
    </div>
  );
}
