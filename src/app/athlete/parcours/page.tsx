"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  PARCOURS,
  EMPTY_PROGRESS,
  getMissionStatus,
  getPhaseProgress,
  getPhaseUnlocked,
  getOverallProgress,
  getNextMission,
  type ParcoursProgress,
  type ParcoursSnapshot,
} from "@/lib/parcours";

export default function ParcoursPage() {
  // Storage — every key the parcours observes
  const [profile] = useAthleteData<ParcoursSnapshot["profile"]>("profile", {});
  const [compo] = useAthleteData<NonNullable<ParcoursSnapshot["compo"]>>("compo", []);
  const [events] = useAthleteData<NonNullable<ParcoursSnapshot["events"]>>("events", []);
  const [energy] = useAthleteData<NonNullable<ParcoursSnapshot["energy"]>>("energy", []);
  const [sweat] = useAthleteData<unknown[]>("sweat", []);
  const [tolTests] = useAthleteData<unknown[]>("tests", []);
  const [bloodTests] = useAthleteData<unknown[]>("blood_tests", []);
  const [mealPlans] = useAthleteData<unknown[]>("meal", []);
  const [racePlans] = useAthleteData<unknown[]>("raceplans", []);
  const [prerace] = useAthleteData<ParcoursSnapshot["prerace"]>("prerace", null);
  const [raceAnalyses] = useAthleteData<unknown[]>("races", []);

  const [progress, setProgress] = useAthleteData<ParcoursProgress>(
    "parcours_progress",
    EMPTY_PROGRESS,
  );

  const snapshot: ParcoursSnapshot = useMemo(
    () => ({ profile, compo, events, energy, sweat, tolTests, bloodTests, mealPlans, racePlans, prerace, raceAnalyses }),
    [profile, compo, events, energy, sweat, tolTests, bloodTests, mealPlans, racePlans, prerace, raceAnalyses],
  );

  const overall = getOverallProgress(snapshot, progress);
  const next = getNextMission(snapshot, progress);

  const toggleManual = (id: string) => {
    setProgress({
      ...progress,
      manual: { ...progress.manual, [id]: !progress.manual[id] },
    });
  };
  const toggleFreeMode = () => {
    setProgress({ ...progress, freeMode: !progress.freeMode });
  };

  return (
    <div>
      <PageHeader
        kicker="Mon parcours"
        title="Mon parcours Nutriocus"
        desc="Suis le chemin étape par étape pour maîtriser ta nutrition de performance, dans le bon ordre."
      />

      {/* Overall progress + next action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div className="card p-4 lg:col-span-1" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
            Avancement global
          </div>
          <div className="font-display font-extrabold text-3xl" style={{ letterSpacing: "-0.01em" }}>
            {overall.pct}%
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {overall.done} / {overall.total} missions
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-2)" }}>
            <div
              className="h-full"
              style={{
                width: `${overall.pct}%`,
                background: "var(--color-primary)",
                transition: "width .4s ease",
              }}
            />
          </div>
        </div>

        <div className="card p-4 lg:col-span-2" style={{ borderLeft: "5px solid var(--color-dark)" }}>
          {next ? (
            <>
              <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
                ⚡ Ta prochaine étape
              </div>
              <div className="flex items-start gap-3 mt-1">
                <div style={{ fontSize: 26, lineHeight: 1 }}>{next.mission.icon}</div>
                <div className="flex-1">
                  <div className="font-display font-extrabold text-lg" style={{ letterSpacing: "-0.01em" }}>
                    {next.mission.title}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">
                    Phase {next.phase.id} — {next.phase.title} · {next.mission.durationLabel}
                  </div>
                  <div className="text-sm text-[var(--color-text)] mb-3">{next.mission.why}</div>
                  {next.mission.href && (
                    <Link href={next.mission.href}>
                      <button className="btn-primary btn-sm">Commencer maintenant →</button>
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".08em", color: "var(--color-success)" }}>
                ✓ Parcours terminé
              </div>
              <div className="font-display font-extrabold text-xl mt-1" style={{ letterSpacing: "-0.01em" }}>
                Bravo — tu maîtrises toute la plateforme.
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mt-1">
                Le vrai travail commence maintenant : itère, ajuste, refais tes bilans, repousse tes plafonds.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Phases */}
      {PARCOURS.map((phase) => {
        const pr = getPhaseProgress(phase, snapshot, progress);
        const unlocked = getPhaseUnlocked(phase, snapshot, progress);
        return (
          <div
            key={phase.id}
            className="card p-5 mb-4"
            style={{
              borderLeft: `5px solid ${phase.color}`,
              opacity: unlocked ? 1 : 0.6,
            }}
          >
            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                <div style={{ fontSize: 22 }}>{phase.icon}</div>
                <div>
                  <div className="text-[10px] uppercase font-extrabold" style={{ letterSpacing: ".1em", color: phase.color }}>
                    Phase {phase.id} {!unlocked && "· 🔒 Verrouillée"}
                  </div>
                  <div className="font-display font-extrabold text-xl" style={{ letterSpacing: "-0.01em" }}>
                    {phase.title}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">{phase.subtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                  Avancement
                </div>
                <div className="font-extrabold text-lg" style={{ color: pr.complete ? "var(--color-success)" : phase.color }}>
                  {pr.done}/{pr.total}
                </div>
              </div>
            </div>

            <div className="text-sm text-[var(--color-text)] mb-4 mt-2">{phase.description}</div>

            {!unlocked && (
              <div
                className="text-xs mb-3 p-2.5 rounded-lg"
                style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", border: "1px dashed var(--color-border)" }}
              >
                🔒 Cette phase se débloquera quand la précédente sera terminée. Tu peux activer le mode exploration libre en bas de page si tu veux passer outre.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {phase.missions.map((m) => {
                const status = getMissionStatus(m, snapshot, progress, unlocked);
                const isManualChecked = !!progress.manual[m.id];
                // Auto-detected = mission is "done" without being manually checked
                const isAutoDetected = status === "done" && !isManualChecked && !!m.isComplete;
                return (
                  <div
                    key={m.id}
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      background:
                        status === "done" ? "rgba(95,140,10,0.08)" : "var(--color-surface-2)",
                      border:
                        status === "done"
                          ? "1px solid rgba(95,140,10,0.4)"
                          : "1px solid var(--color-border)",
                    }}
                  >
                    {/* Status indicator */}
                    <div style={{ marginTop: 2 }}>
                      {status === "done" && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: "var(--color-success)", fontSize: 13 }}
                        >
                          ✓
                        </div>
                      )}
                      {status === "todo" && (
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ border: `2px solid ${phase.color}`, background: "var(--color-surface)" }}
                        />
                      )}
                      {status === "locked" && (
                        <div className="w-6 h-6 flex items-center justify-center" style={{ fontSize: 14 }}>
                          🔒
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <div style={{ fontSize: 14 }}>{m.icon}</div>
                        <div className="font-extrabold text-sm">{m.title}</div>
                        <div
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ background: "var(--color-surface)", color: "var(--color-text-muted)", letterSpacing: ".05em" }}
                        >
                          {m.durationLabel}
                        </div>
                        {isAutoDetected && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                            style={{ background: "rgba(95,140,10,0.15)", color: "var(--color-success)", letterSpacing: ".05em" }}
                            title="Détecté automatiquement à partir de tes données"
                          >
                            ⚡ auto
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{m.why}</div>

                      <div className="flex gap-2 mt-2 flex-wrap items-center">
                        {m.href && status !== "locked" && (
                          <Link href={m.href}>
                            <button className={status === "done" ? "btn-ghost btn-sm" : "btn-dark btn-sm"}>
                              {status === "done" ? "Revoir" : "Faire →"}
                            </button>
                          </Link>
                        )}
                        {/* Tutorial video: real link if videoUrl set, otherwise
                            placeholder showing "à venir bientôt". */}
                        {status !== "locked" && (m.videoUrl ? (
                          <a href={m.videoUrl} target="_blank" rel="noopener noreferrer">
                            <button className="btn-ghost btn-sm" style={{ color: "var(--color-primary)" }}>
                              📹 Vidéo tuto
                            </button>
                          </a>
                        ) : (
                          <button
                            onClick={() => alert("🚧 Vidéo tuto en cours de tournage — disponible bientôt dans l'Académie !")}
                            className="btn-ghost btn-sm"
                            style={{ color: "var(--color-text-muted)" }}
                            title="Vidéo tuto à venir bientôt"
                          >
                            📹 Vidéo tuto · à venir
                          </button>
                        ))}
                        {/* Manual toggle — always available when phase unlocked.
                            Use it for manualOnly missions OR as an override when
                            auto-detection misses something the athlete already did. */}
                        {unlocked && (
                          <button
                            onClick={() => toggleManual(m.id)}
                            className="btn-ghost btn-sm"
                            style={{
                              color: isManualChecked ? "var(--color-success)" : "var(--color-text-muted)",
                              fontWeight: 700,
                            }}
                            title={
                              isManualChecked
                                ? "Cliquer pour annuler le marquage manuel"
                                : "Marquer cette mission comme déjà faite"
                            }
                          >
                            {isManualChecked
                              ? "✓ Marquée comme faite"
                              : isAutoDetected
                                ? "Forcer comme faite manuellement"
                                : "Marquer comme faite"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Free mode toggle */}
      <div className="card p-4 mb-4" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-extrabold text-sm">🗝 Mode exploration libre</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Débloque toutes les phases pour explorer la plateforme dans l&apos;ordre que tu veux.
              Recommandé seulement si tu sais ce que tu cherches.
            </div>
          </div>
          <button
            onClick={toggleFreeMode}
            className={progress.freeMode ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          >
            {progress.freeMode ? "✓ Activé" : "Activer"}
          </button>
        </div>
      </div>
    </div>
  );
}
