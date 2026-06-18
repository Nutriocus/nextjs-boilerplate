"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAthleteData } from "@/lib/athlete-storage";

// =====================================================================
// Onboarding checklist for new athletes
// Shows on /athlete/dashboard until everything is complete (or dismissed).
// Hidden when:
//   - Coach is in coach-view (?athleteId=…)
//   - User dismissed manually
//   - All steps completed
// =====================================================================

type ChecklistState = {
  dismissed?: boolean;
  pwaInstalled?: boolean;
};

export function OnboardingChecklist() {
  const searchParams = useSearchParams();
  const isCoachView = !!searchParams?.get("athleteId");

  // Existing data sources (we infer step completion from them)
  const [profile] = useAthleteData<{ poids?: number | string; sexe?: string; discipline?: string }>("profile", {});
  const [questionnaire] = useAthleteData<{ nom?: string; prenom?: string }>("questionnaire", {});
  const [compo] = useAthleteData<unknown[]>("compo", []);
  const [events] = useAthleteData<unknown[]>("events", []);

  const [state, setState, loaded] = useAthleteData<ChecklistState>("onboarding_state", {});
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (isCoachView) return null;
  if (!loaded) return null;
  if (state.dismissed) return null;

  const steps = [
    {
      id: "profile",
      done: !!(profile.poids || profile.sexe || profile.discipline),
      label: "Compléter mes données techniques (sexe, taille, poids…)",
      href: "/athlete/profile",
      cta: "Mon profil",
    },
    {
      id: "questionnaire",
      done: !!(questionnaire?.nom || questionnaire?.prenom),
      label: "Remplir le questionnaire d'introduction (9 sections)",
      href: "/athlete/profile",
      cta: "Questionnaire",
      important: true,
    },
    {
      id: "compo",
      done: compo.length > 0,
      label: "Ajouter ma première mesure de composition corporelle",
      href: "/athlete/composition",
      cta: "Composition",
    },
    {
      id: "events",
      done: events.length > 0,
      label: "Ajouter mes prochaines courses",
      href: "/athlete/season",
      cta: "Planification",
    },
    {
      id: "pwa",
      done: isStandalone || state.pwaInstalled,
      label: "Installer NUTRIOCUS sur mon appareil",
      href: null,
      cta: null,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  // Auto-dismiss when all done
  if (allDone && !state.dismissed) {
    // Don't auto-save dismiss (let it show the green checkmark for one render)
    // User has to dismiss manually OR will see it disappear naturally next load
  }

  return (
    <div className="card mb-4" style={{ borderLeft: "5px solid var(--color-primary)", overflow: "hidden" }}>
      <div className="px-4 py-3 flex justify-between items-center flex-wrap gap-2" style={{ background: "var(--color-dark)", color: "#fff" }}>
        <div>
          <div className="font-extrabold uppercase text-sm" style={{ fontFamily: "var(--font-display)", letterSpacing: ".02em" }}>
            🚀 Démarrage Mission Performance
          </div>
          <div className="text-xs opacity-80 mt-0.5">
            {allDone
              ? "🎉 Tu es prêt(e) ! Bonne mission."
              : `${completed} / ${total} étapes terminées (${pct}%)`}
          </div>
        </div>
        <button
          onClick={() => setState({ ...state, dismissed: true })}
          className="text-xs"
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, padding: "4px 9px", cursor: "pointer" }}
          title="Masquer cette checklist"
        >
          {allDone ? "Fermer" : "Plus tard"}
        </button>
      </div>

      <div className="h-1.5 bg-[var(--color-surface-2)]">
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
            transition: "width .3s",
          }}
        />
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{
                background: s.done ? "rgba(95,140,10,0.08)" : "var(--color-surface-2)",
                border: s.important && !s.done ? "1px solid var(--color-primary)" : "1px solid transparent",
              }}
            >
              <span
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: s.done ? "var(--color-success)" : "var(--color-surface)",
                  color: s.done ? "#fff" : "var(--color-text-muted)",
                  border: s.done ? "none" : "2px solid var(--color-border)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {s.done ? "✓" : ""}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm ${s.done ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text)]"}`}
                  style={{ fontWeight: s.important && !s.done ? 700 : 500 }}
                >
                  {s.label}
                  {s.important && !s.done && (
                    <span className="ml-2 text-[10px] uppercase font-bold text-[var(--color-primary)]" style={{ letterSpacing: ".06em" }}>
                      Priorité
                    </span>
                  )}
                </div>
              </div>
              {!s.done && s.href && (
                <Link href={s.href} className="btn-dark btn-xs shrink-0">
                  {s.cta} →
                </Link>
              )}
              {!s.done && !s.href && s.id === "pwa" && (
                <button
                  onClick={() => setState({ ...state, pwaInstalled: true })}
                  className="btn-ghost btn-xs shrink-0"
                  title="Marquer comme fait"
                >
                  Marquer fait
                </button>
              )}
            </div>
          ))}
        </div>

        {allDone && (
          <div className="mt-3 text-center text-sm">
            <span className="text-[var(--color-success)] font-bold">✨ Bravo !</span>{" "}
            Ta plateforme est prête. Tu peux fermer cette checklist.
          </div>
        )}
      </div>
    </div>
  );
}
