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
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [helpOs, setHelpOs] = useState<"ios" | "android">("ios");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    if (/Android/i.test(ua)) setHelpOs("android");
    else setHelpOs("ios");
  }, []);

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
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setInstallHelpOpen(true)}
                    className="btn-dark btn-xs"
                    title="Voir les instructions"
                  >
                    Comment faire ?
                  </button>
                  <button
                    onClick={() => setState({ ...state, pwaInstalled: true })}
                    className="btn-ghost btn-xs"
                    title="Marquer comme fait"
                  >
                    ✓
                  </button>
                </div>
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

      {installHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)" }}
          onClick={() => setInstallHelpOpen(false)}
        >
          <div
            className="card overflow-hidden w-full max-w-md"
            style={{ background: "var(--color-surface)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex justify-between items-center" style={{ background: "var(--color-dark)", color: "#fff" }}>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-70" style={{ letterSpacing: ".1em" }}>
                  Tutoriel installation
                </div>
                <div className="font-extrabold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  📱 Installer NUTRIOCUS
                </div>
              </div>
              <button
                onClick={() => setInstallHelpOpen(false)}
                className="text-2xl"
                style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Tabs iOS / Android */}
            <div className="flex gap-1.5 p-3" style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
              <button
                onClick={() => setHelpOs("ios")}
                className={helpOs === "ios" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                style={{ flex: 1 }}
              >
                🍎 iPhone / iPad
              </button>
              <button
                onClick={() => setHelpOs("android")}
                className={helpOs === "android" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                style={{ flex: 1 }}
              >
                🤖 Android
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {helpOs === "ios" ? (
                <div className="space-y-3">
                  <div className="text-sm leading-relaxed mb-2">
                    Sur iPhone et iPad, l&apos;installation se fait depuis <b>Safari</b> (et pas Chrome).
                  </div>
                  <InstallStep n={1} title="Ouvre la plateforme dans Safari">
                    Va sur <code style={{ background: "var(--color-surface-2)", padding: "1px 5px", borderRadius: 4 }}>plateforme.nutriocus.com</code> avec l&apos;app <b>Safari</b>.
                  </InstallStep>
                  <InstallStep n={2} title="Appuie sur le bouton Partager">
                    Le bouton <b>Partager</b> en bas de Safari (carré avec une flèche vers le haut <span style={{ fontSize: 14 }}>↑</span>).
                  </InstallStep>
                  <InstallStep n={3} title="Choisis « Sur l'écran d'accueil »">
                    Fais défiler les options et touche <b>« Sur l&apos;écran d&apos;accueil »</b>.
                  </InstallStep>
                  <InstallStep n={4} title="Confirme « Ajouter »">
                    En haut à droite, touche <b>Ajouter</b>. L&apos;icône NUTRIOCUS apparaît sur ton écran d&apos;accueil.
                  </InstallStep>
                  <InstallStep n={5} title="Lance l'app">
                    Ouvre NUTRIOCUS depuis l&apos;icône — tu seras connecté(e) sans barre Safari, plein écran. ✨
                  </InstallStep>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm leading-relaxed mb-2">
                    Sur Android, l&apos;installation se fait depuis <b>Chrome</b> (ou Edge / Firefox).
                  </div>
                  <InstallStep n={1} title="Ouvre la plateforme dans Chrome">
                    Va sur <code style={{ background: "var(--color-surface-2)", padding: "1px 5px", borderRadius: 4 }}>plateforme.nutriocus.com</code> avec <b>Chrome</b>.
                  </InstallStep>
                  <InstallStep n={2} title="Une bannière d'installation peut apparaître">
                    Si tu vois en bas de l&apos;écran <b>« Installer NUTRIOCUS »</b>, touche-la et passe à l&apos;étape 4.
                  </InstallStep>
                  <InstallStep n={3} title="Sinon, ouvre le menu Chrome">
                    Touche les <b>3 points ⋮</b> en haut à droite, puis sélectionne <b>« Installer l&apos;application »</b> (ou « Ajouter à l&apos;écran d&apos;accueil »).
                  </InstallStep>
                  <InstallStep n={4} title="Confirme « Installer »">
                    Une popup apparaît avec l&apos;icône NUTRIOCUS — touche <b>Installer</b>.
                  </InstallStep>
                  <InstallStep n={5} title="Lance l'app">
                    L&apos;icône NUTRIOCUS apparaît sur ton écran d&apos;accueil. Ouvre-la → app plein écran. ✨
                  </InstallStep>
                </div>
              )}

              <div className="mt-5 p-3 rounded-lg text-xs text-[var(--color-text-muted)]" style={{ background: "var(--color-surface-2)", borderLeft: "3px solid var(--color-primary)" }}>
                <b className="text-[var(--color-text)]">💡 Pourquoi installer ?</b><br />
                Tu auras ton plan, tes données et ta stratégie de course accessibles plus rapidement, même en zone faible réseau (montagne, course, voyage).
              </div>

              <div className="mt-4 flex justify-between gap-2">
                <button onClick={() => setInstallHelpOpen(false)} className="btn-ghost btn-sm">
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setState({ ...state, pwaInstalled: true });
                    setInstallHelpOpen(false);
                  }}
                  className="btn-primary btn-sm"
                >
                  ✓ C&apos;est installé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstallStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="shrink-0 flex items-center justify-center font-extrabold"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--color-primary)",
          color: "#fff",
          fontSize: 13,
          fontFamily: "var(--font-display)",
        }}
      >
        {n}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}
