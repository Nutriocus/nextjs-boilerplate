"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader, Kpi, Empty, Field } from "@/components/ui/PageHeader";
import { ATHLETE_NAV } from "@/components/athlete/AthleteSidebar";
import { loadData, saveData } from "@/lib/athlete-storage";

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
