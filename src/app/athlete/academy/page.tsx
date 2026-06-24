"use client";

import { useEffect, useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { useCoachData } from "@/lib/coach-storage";
import { supabase } from "@/lib/supabase";
import { PageHeader, Empty } from "@/components/ui/PageHeader";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichHtml } from "@/components/ui/RichHtml";
import {
  tierMeetsRequirement,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/subscription";

type Resource = { id: string; label: string; url: string };
type Lesson = {
  id: string;
  title: string;
  url: string;            // video URL (optional)
  duration: string;
  description?: string;   // HTML rich text from TipTap
  resources?: Resource[]; // PDFs / external links
};
type Module = { id: string; title: string; lessons: Lesson[] };
type Formation = {
  id: string;
  title: string;
  desc: string;
  modules: Module[];
  /** Minimum tier required to access. If undefined → open to all. */
  requiredTier?: SubscriptionTier;
};

const newId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT: Formation[] = [
  {
    id: "f1",
    title: "Formation 1 — Les fondamentaux de la nutrition endurance",
    desc: "Ta première formation complète.",
    requiredTier: "mission_performance",
    modules: [
      {
        id: "m1",
        title: "Module 1 — Introduction",
        lessons: [{ id: newId(), title: "Bienvenue & objectifs", url: "", duration: "" }],
      },
    ],
  },
  {
    id: "f2",
    title: "Formation 2 — Nutrition de performance avancée",
    desc: "Ta seconde formation complète.",
    requiredTier: "mission_performance",
    modules: [
      {
        id: "m1",
        title: "Module 1 — Stratégie de course",
        lessons: [{ id: newId(), title: "Construire sa stratégie", url: "", duration: "" }],
      },
    ],
  },
];

/** Parses a duration string like "12:30", "1:45", or "1:23:45" → total seconds. */
function parseDurationToSeconds(s: string | undefined | null): number {
  if (!s) return 0;
  const parts = s.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
  if (parts.length === 2) return parts[0] * 60 + parts[1]; // mm:ss
  if (parts.length === 1) return parts[0] * 60; // assume minutes
  return 0;
}

/** Formats total seconds as "1h23min" or "23min" if under an hour. */
function formatDurationTotal(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function totalDurationOfFormation(f: Formation): number {
  let total = 0;
  for (const m of f.modules) {
    for (const l of m.lessons) {
      total += parseDurationToSeconds(l.duration);
    }
  }
  return total;
}

function progressOf(f: Formation, doneMap: Record<string, boolean>): { t: number; d: number; pct: number } {
  let t = 0;
  let d = 0;
  f.modules.forEach((m) =>
    m.lessons.forEach((l) => {
      t++;
      if (doneMap[l.id]) d++;
    }),
  );
  return { t, d, pct: t ? Math.round((d / t) * 100) : 0 };
}

export default function AcademyPage() {
  // Shared library across all athletes of the coach
  const [academy, setAcademy, loadedAcademy] = useCoachData<Formation[]>("academy", DEFAULT);
  // Personal progress per athlete (lesson id → done)
  const [done, setDone, loadedDone] = useAthleteData<Record<string, boolean>>("academy_progress", {});

  const [view, setView] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [athleteTier, setAthleteTier] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsCoach(!!coach);

      // Load athlete tier (null for coach-only accounts)
      const { data: athlete } = await supabase
        .from("athletes")
        .select("subscription_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (athlete) setAthleteTier(athlete.subscription_tier);
    })();
  }, []);

  // Coach sees everything; athlete must meet the tier requirement.
  const canAccessFormation = (f: Formation) =>
    isCoach || tierMeetsRequirement(athleteTier, f.requiredTier);

  const f = academy.find((x) => x.id === view);

  function updateF(id: string, patch: Partial<Formation>) {
    setAcademy((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function delF(id: string) {
    if (confirm("Supprimer cette formation (pour tous les athlètes) ?")) {
      setAcademy((p) => p.filter((x) => x.id !== id));
      setView(null);
    }
  }
  function addF() {
    const nf: Formation = { id: newId(), title: "Nouvelle formation", desc: "", modules: [] };
    setAcademy((p) => [...p, nf]);
    setView(nf.id);
    setEditing(true);
  }
  function addModule() {
    if (!f) return;
    updateF(f.id, { modules: [...f.modules, { id: newId(), title: "Nouveau module", lessons: [] }] });
  }
  function updateModule(mi: number, patch: Partial<Module>) {
    if (!f) return;
    updateF(f.id, { modules: f.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)) });
  }
  function delModule(mi: number) {
    if (!f) return;
    updateF(f.id, { modules: f.modules.filter((_, i) => i !== mi) });
  }
  function addLesson(mi: number) {
    if (!f) return;
    updateModule(mi, { lessons: [...f.modules[mi].lessons, { id: newId(), title: "Nouvelle leçon", url: "", duration: "" }] });
  }
  function updateLesson(mi: number, li: number, patch: Partial<Lesson>) {
    if (!f) return;
    updateModule(mi, { lessons: f.modules[mi].lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) });
  }
  function delLesson(mi: number, li: number) {
    if (!f) return;
    updateModule(mi, { lessons: f.modules[mi].lessons.filter((_, i) => i !== li) });
  }
  // Move helpers — generic array reorder
  function move<T>(arr: T[], from: number, delta: number): T[] {
    const to = from + delta;
    if (to < 0 || to >= arr.length) return arr;
    const next = [...arr];
    const [el] = next.splice(from, 1);
    next.splice(to, 0, el);
    return next;
  }
  function moveModule(mi: number, delta: number) {
    if (!f) return;
    updateF(f.id, { modules: move(f.modules, mi, delta) });
  }
  function moveLesson(mi: number, li: number, delta: number) {
    if (!f) return;
    updateModule(mi, { lessons: move(f.modules[mi].lessons, li, delta) });
  }
  function toggleDone(lesson: Lesson) {
    setDone((p) => ({ ...p, [lesson.id]: !p[lesson.id] }));
  }

  if (!loadedAcademy || !loadedDone) {
    return (
      <div>
        <PageHeader kicker="Académie Nutriocus" title="Académie" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (f) {
    // Tier gating — block opening the formation if the athlete is below the required tier
    if (!canAccessFormation(f)) {
      const requiredLabel = f.requiredTier ? SUBSCRIPTION_TIERS[f.requiredTier].label : "—";
      return (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <button onClick={() => setView(null)} className="btn-ghost btn-sm">
              ← Toutes les formations
            </button>
          </div>
          <div className="card p-8 text-center" style={{ borderLeft: "5px solid var(--color-primary)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h2 className="font-display font-extrabold text-2xl mb-2" style={{ letterSpacing: "-0.01em" }}>
              Réservé à {requiredLabel}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
              Cette formation est uniquement accessible aux athlètes inscrits à
              l&apos;offre <b>{requiredLabel}</b>. Passe à cette offre pour accéder à
              tout le contenu de l&apos;Académie.
            </p>
            <a href="/athlete/subscription" className="btn-primary btn-sm">
              💳 Mettre à jour mon abonnement →
            </a>
          </div>
        </div>
      );
    }

    const prog = progressOf(f, done);
    const lesson = selectedLesson || (f.modules[0]?.lessons[0] ?? null);

    return (
      <div>
        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
          <button onClick={() => { setView(null); setSelectedLesson(null); setEditing(false); }} className="btn-ghost btn-sm">
            ← Toutes les formations
          </button>
          {isCoach && (
            <div className="flex gap-2">
              <button onClick={() => setEditing((e) => !e)} className={editing ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
                {editing ? "Terminer l'édition" : "✎ Éditer (global)"}
              </button>
              <button onClick={() => delF(f.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>Supprimer</button>
            </div>
          )}
        </div>

        {editing && isCoach ? (
          <input className="input text-2xl font-extrabold mb-1.5" value={f.title} onChange={(e) => updateF(f.id, { title: e.target.value })} />
        ) : (
          <h1
            className="font-extrabold uppercase mt-1 mb-1.5"
            style={{ fontFamily: "var(--font-display)", fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {f.title}
          </h1>
        )}

        {editing && isCoach && (
          <>
            <div className="text-xs text-[var(--color-primary)] mb-2">
              ✏ Mode édition coach — tes modifications sont partagées avec tous tes athlètes.
            </div>
            <div className="card p-3 mb-3" style={{ background: "var(--color-surface-2)" }}>
              <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                🔒 Accès — tier requis
              </div>
              <select
                className="input"
                style={{ maxWidth: 320 }}
                value={f.requiredTier ?? ""}
                onChange={(e) => updateF(f.id, { requiredTier: (e.target.value || undefined) as SubscriptionTier | undefined })}
              >
                <option value="">Aucune restriction (accessible à tous)</option>
                <option value="plateforme">La plateforme Nutriocus (et plus)</option>
                <option value="progression_guidee">Progression Guidée (et plus)</option>
                <option value="mission_performance">Mission Performance uniquement</option>
              </select>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-2">
                Les tiers supérieurs ont automatiquement accès au contenu des tiers inférieurs.
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden" style={{ minWidth: 160 }}>
            <div style={{ width: prog.pct + "%", height: "100%", background: "var(--color-primary)" }} />
          </div>
          <div className="font-extrabold text-[var(--color-primary)]">{prog.pct}%</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {prog.d}/{prog.t} leçons · {f.modules.length} modules · {formatDurationTotal(totalDurationOfFormation(f))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
          <div className="card p-4">
            {lesson?.url && <VideoEmbed url={lesson.url} title={lesson.title} />}
            <div className="mt-2.5 font-extrabold text-lg" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
              {lesson?.title || "Sélectionne une leçon"}
            </div>

            {/* Description rich text (read mode) */}
            {lesson?.description && !editing && (
              <div className="mt-4 prose-academy">
                <RichHtml html={lesson.description} variant="screen" />
              </div>
            )}

            {/* Description rich text (edit mode for coach) */}
            {lesson && editing && isCoach && (
              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                  📝 Contenu texte (édition)
                </div>
                <RichTextEditor
                  value={lesson.description || ""}
                  onChange={(html) => {
                    const mi = f.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
                    if (mi < 0) return;
                    const li = f.modules[mi].lessons.findIndex((l) => l.id === lesson.id);
                    updateLesson(mi, li, { description: html });
                  }}
                  placeholder="Ajoute du texte, des explications, des liens..."
                  minHeight={200}
                />
              </div>
            )}

            {/* Resources (PDFs / external links) — read mode */}
            {lesson?.resources && lesson.resources.length > 0 && !editing && (
              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                  📎 Ressources
                </div>
                <div className="flex flex-col gap-1.5">
                  {lesson.resources.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                    >
                      <span style={{ fontSize: 18 }}>📄</span>
                      <span className="flex-1 text-sm font-bold">{r.label}</span>
                      <span className="text-xs" style={{ color: "var(--color-primary)" }}>Ouvrir →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resources — edit mode for coach */}
            {lesson && editing && isCoach && (
              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                  📎 Ressources (PDF / liens) — édition
                </div>
                {(lesson.resources ?? []).map((r, ri) => {
                  const mi = f.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
                  const li = mi >= 0 ? f.modules[mi].lessons.findIndex((l) => l.id === lesson.id) : -1;
                  return (
                    <div key={r.id} className="flex gap-1.5 mb-1.5 items-center">
                      <input
                        className="input text-sm flex-1"
                        placeholder="Nom (ex. Fiche bilan sanguin)"
                        value={r.label}
                        onChange={(e) => {
                          if (mi < 0 || li < 0) return;
                          const newRes = [...(lesson.resources ?? [])];
                          newRes[ri] = { ...newRes[ri], label: e.target.value };
                          updateLesson(mi, li, { resources: newRes });
                        }}
                      />
                      <input
                        className="input text-xs"
                        style={{ flex: 1.5 }}
                        placeholder="URL (Drive / Dropbox / S3...)"
                        value={r.url}
                        onChange={(e) => {
                          if (mi < 0 || li < 0) return;
                          const newRes = [...(lesson.resources ?? [])];
                          newRes[ri] = { ...newRes[ri], url: e.target.value };
                          updateLesson(mi, li, { resources: newRes });
                        }}
                      />
                      <button
                        onClick={() => {
                          if (mi < 0 || li < 0) return;
                          updateLesson(mi, li, { resources: (lesson.resources ?? []).filter((_, idx) => idx !== ri) });
                        }}
                        className="btn-ghost btn-xs"
                        style={{ color: "var(--color-danger)" }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    const mi = f.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
                    const li = mi >= 0 ? f.modules[mi].lessons.findIndex((l) => l.id === lesson.id) : -1;
                    if (mi < 0 || li < 0) return;
                    updateLesson(mi, li, {
                      resources: [...(lesson.resources ?? []), { id: newId(), label: "Nouvelle ressource", url: "" }],
                    });
                  }}
                  className="btn-ghost btn-sm"
                >
                  + Ressource
                </button>
              </div>
            )}
          </div>

          <div>
            {editing && isCoach && (
              <div className="mb-2.5">
                <button onClick={addModule} className="btn-primary btn-sm">+ Module</button>
              </div>
            )}
            {f.modules.map((m, mi) => (
              <div key={m.id} className="card p-3 mb-2.5">
                {editing && isCoach ? (
                  <div className="flex gap-1.5 mb-1.5 items-center">
                    <input className="input font-bold flex-1" value={m.title} onChange={(e) => updateModule(mi, { title: e.target.value })} />
                    <button
                      onClick={() => moveModule(mi, -1)}
                      disabled={mi === 0}
                      className="btn-ghost btn-xs"
                      style={{ opacity: mi === 0 ? 0.3 : 1, minWidth: 26 }}
                      title="Monter ce module"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveModule(mi, 1)}
                      disabled={mi === f.modules.length - 1}
                      className="btn-ghost btn-xs"
                      style={{ opacity: mi === f.modules.length - 1 ? 0.3 : 1, minWidth: 26 }}
                      title="Descendre ce module"
                    >
                      ↓
                    </button>
                    <button onClick={() => delModule(mi)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
                  </div>
                ) : (
                  <div className="font-extrabold text-[13px] mb-1.5">{m.title}</div>
                )}
                {m.lessons.map((l, li) => (
                  <div key={l.id} className="mb-1.5">
                    {editing && isCoach ? (
                      <div className="flex flex-col gap-1 bg-[var(--color-surface-2)] p-2 rounded-lg">
                        <div className="flex gap-1.5 items-center">
                          <input className="input text-sm flex-1" placeholder="Titre leçon" value={l.title} onChange={(e) => updateLesson(mi, li, { title: e.target.value })} />
                          <button
                            onClick={() => moveLesson(mi, li, -1)}
                            disabled={li === 0}
                            className="btn-ghost btn-xs"
                            style={{ opacity: li === 0 ? 0.3 : 1, minWidth: 26 }}
                            title="Monter cette leçon"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveLesson(mi, li, 1)}
                            disabled={li === m.lessons.length - 1}
                            className="btn-ghost btn-xs"
                            style={{ opacity: li === m.lessons.length - 1 ? 0.3 : 1, minWidth: 26 }}
                            title="Descendre cette leçon"
                          >
                            ↓
                          </button>
                          <button onClick={() => delLesson(mi, li)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
                        </div>
                        <input className="input text-xs" placeholder="Lien vidéo (YouTube/Vimeo/Loom)" value={l.url} onChange={(e) => updateLesson(mi, li, { url: e.target.value })} />
                        <input className="input text-xs" placeholder="Durée (ex 12:30)" value={l.duration} onChange={(e) => updateLesson(mi, li, { duration: e.target.value })} />
                      </div>
                    ) : (
                      <div
                        onClick={() => setSelectedLesson(l)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer"
                        style={{ background: lesson?.id === l.id ? "#fff3ee" : "transparent" }}
                      >
                        <input type="checkbox" checked={!!done[l.id]} onClick={(e) => e.stopPropagation()} onChange={() => toggleDone(l)} />
                        <span className="flex-1 text-sm" style={{ fontWeight: lesson?.id === l.id ? 700 : 500 }}>
                          {l.title}
                        </span>
                        {l.duration && <span className="text-[11px] text-[var(--color-text-muted)]">{l.duration}</span>}
                        <span className="text-[var(--color-primary)] text-xs">▶</span>
                      </div>
                    )}
                  </div>
                ))}
                {editing && isCoach && <button onClick={() => addLesson(mi)} className="btn-ghost btn-xs">+ Leçon</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Académie Nutriocus"
        title="Académie"
        action={isCoach ? <button onClick={addF} className="btn-primary">+ Formation</button> : undefined}
        desc={
          isCoach
            ? "Bibliothèque partagée avec tous tes athlètes Mission Performance. Tes modifications sont visibles par tous."
            : "Tes formations complètes et leurs vidéos. Suis ta progression leçon par leçon."
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academy.map((f) => {
          const p = progressOf(f, done);
          const accessible = canAccessFormation(f);
          const tierLabel = f.requiredTier ? SUBSCRIPTION_TIERS[f.requiredTier].label : null;
          return (
            <div
              key={f.id}
              className="card overflow-hidden cursor-pointer relative"
              onClick={() => setView(f.id)}
              style={{ opacity: accessible ? 1 : 0.72 }}
            >
              <div className="h-[90px] bg-[var(--color-dark)] flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/nutriocus-white.png" alt="NUTRIOCUS" style={{ height: 38, width: "auto" }} />
                {!accessible && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontSize: 16,
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    🔒
                  </div>
                )}
              </div>
              <div className="p-4">
                {tierLabel && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-1.5 inline-block"
                    style={{
                      background: accessible ? "rgba(95,140,10,0.14)" : "rgba(255,69,1,0.10)",
                      color: accessible ? "var(--color-success)" : "var(--color-primary)",
                      letterSpacing: ".08em",
                    }}
                  >
                    {accessible ? "✓ " : "🔒 "}{tierLabel}
                  </span>
                )}
                <div className="font-extrabold text-base mb-1">{f.title}</div>
                <div className="text-xs text-[var(--color-text-muted)] mb-3">
                  {f.desc || `${f.modules.length} modules`}
                </div>
                {accessible ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div style={{ width: p.pct + "%", height: "100%", background: "var(--color-primary)" }} />
                      </div>
                      <span className="font-extrabold text-[var(--color-primary)] text-sm">{p.pct}%</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      {p.t} leçons · {f.modules.length} modules · {formatDurationTotal(totalDurationOfFormation(f))}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                    Réservé à {tierLabel} →
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
