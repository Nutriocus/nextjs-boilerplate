"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty } from "@/components/ui/PageHeader";
import { VideoEmbed } from "@/components/ui/VideoEmbed";

type Lesson = { id: string; title: string; url: string; duration: string; done: boolean };
type Module = { id: string; title: string; lessons: Lesson[] };
type Formation = { id: string; title: string; desc: string; modules: Module[] };

const newId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT: Formation[] = [
  {
    id: "f1",
    title: "Formation 1 — Les fondamentaux de la nutrition endurance",
    desc: "Ta première formation complète.",
    modules: [
      {
        id: "m1",
        title: "Module 1 — Introduction",
        lessons: [{ id: newId(), title: "Bienvenue & objectifs", url: "", duration: "", done: false }],
      },
    ],
  },
  {
    id: "f2",
    title: "Formation 2 — Nutrition de performance avancée",
    desc: "Ta seconde formation complète.",
    modules: [
      {
        id: "m1",
        title: "Module 1 — Stratégie de course",
        lessons: [{ id: newId(), title: "Construire sa stratégie", url: "", duration: "", done: false }],
      },
    ],
  },
];

function progress(f: Formation): { t: number; d: number; pct: number } {
  let t = 0, d = 0;
  f.modules.forEach((m) => m.lessons.forEach((l) => { t++; if (l.done) d++; }));
  return { t, d, pct: t ? Math.round((d / t) * 100) : 0 };
}

export default function AcademyPage() {
  const [academy, setAcademy, loaded] = useAthleteData<Formation[]>("academy", DEFAULT);
  const [view, setView] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const f = academy.find((x) => x.id === view);

  function updateF(id: string, patch: Partial<Formation>) {
    setAcademy((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function delF(id: string) {
    if (confirm("Supprimer cette formation ?")) {
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
    updateModule(mi, { lessons: [...f.modules[mi].lessons, { id: newId(), title: "Nouvelle leçon", url: "", duration: "", done: false }] });
  }
  function updateLesson(mi: number, li: number, patch: Partial<Lesson>) {
    if (!f) return;
    updateModule(mi, { lessons: f.modules[mi].lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) });
  }
  function delLesson(mi: number, li: number) {
    if (!f) return;
    updateModule(mi, { lessons: f.modules[mi].lessons.filter((_, i) => i !== li) });
  }
  function toggleDone(mi: number, li: number) {
    if (!f) return;
    updateLesson(mi, li, { done: !f.modules[mi].lessons[li].done });
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Académie Nutriocus" title="Académie" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (f) {
    const prog = progress(f);
    const lesson = selectedLesson || (f.modules[0]?.lessons[0] ?? null);

    return (
      <div>
        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
          <button onClick={() => { setView(null); setSelectedLesson(null); setEditing(false); }} className="btn-ghost btn-sm">
            ← Toutes les formations
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditing((e) => !e)} className={editing ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
              {editing ? "Terminer l'édition" : "Éditer"}
            </button>
            <button onClick={() => delF(f.id)} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>Supprimer</button>
          </div>
        </div>

        {editing ? (
          <input className="input text-2xl font-extrabold mb-1.5" value={f.title} onChange={(e) => updateF(f.id, { title: e.target.value })} />
        ) : (
          <h1
            className="font-extrabold uppercase mt-1 mb-1.5"
            style={{ fontFamily: "var(--font-display)", fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {f.title}
          </h1>
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden" style={{ minWidth: 160 }}>
            <div style={{ width: prog.pct + "%", height: "100%", background: "var(--color-primary)" }} />
          </div>
          <div className="font-extrabold text-[var(--color-primary)]">{prog.pct}%</div>
          <div className="text-xs text-[var(--color-text-muted)]">{prog.d}/{prog.t} leçons</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
          <div className="card p-4">
            <VideoEmbed url={lesson?.url || ""} title={lesson?.title} />
            <div className="mt-2.5 font-extrabold">{lesson?.title || "Sélectionne une leçon"}</div>
          </div>

          <div>
            {editing && (
              <div className="mb-2.5">
                <button onClick={addModule} className="btn-primary btn-sm">+ Module</button>
              </div>
            )}
            {f.modules.map((m, mi) => (
              <div key={m.id} className="card p-3 mb-2.5">
                {editing ? (
                  <div className="flex gap-1.5 mb-1.5">
                    <input className="input font-bold" value={m.title} onChange={(e) => updateModule(mi, { title: e.target.value })} />
                    <button onClick={() => delModule(mi)} className="btn-ghost btn-xs" style={{ color: "var(--color-danger)" }}>✕</button>
                  </div>
                ) : (
                  <div className="font-extrabold text-[13px] mb-1.5">{m.title}</div>
                )}
                {m.lessons.map((l, li) => (
                  <div key={l.id} className="mb-1.5">
                    {editing ? (
                      <div className="flex flex-col gap-1 bg-[var(--color-surface-2)] p-2 rounded-lg">
                        <div className="flex gap-1.5">
                          <input className="input text-sm" placeholder="Titre leçon" value={l.title} onChange={(e) => updateLesson(mi, li, { title: e.target.value })} />
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
                        <input type="checkbox" checked={l.done} onClick={(e) => e.stopPropagation()} onChange={() => toggleDone(mi, li)} />
                        <span className="flex-1 text-sm" style={{ fontWeight: lesson?.id === l.id ? 700 : 500 }}>
                          {l.title}
                        </span>
                        {l.duration && <span className="text-[11px] text-[var(--color-text-muted)]">{l.duration}</span>}
                        <span className="text-[var(--color-primary)] text-xs">▶</span>
                      </div>
                    )}
                  </div>
                ))}
                {editing && <button onClick={() => addLesson(mi)} className="btn-ghost btn-xs">+ Leçon</button>}
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
        action={<button onClick={addF} className="btn-primary">+ Formation</button>}
        desc="Tes formations complètes et leurs vidéos. Suis ta progression leçon par leçon."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academy.map((f) => {
          const p = progress(f);
          return (
            <div key={f.id} className="card overflow-hidden cursor-pointer" onClick={() => setView(f.id)}>
              <div className="h-[90px] bg-[var(--color-dark)] flex items-center justify-center text-[var(--color-primary)] font-display font-extrabold text-2xl">
                NUTRIOCUS<span className="text-[var(--color-primary)]">.</span>
              </div>
              <div className="p-4">
                <div className="font-extrabold text-base mb-1">{f.title}</div>
                <div className="text-xs text-[var(--color-text-muted)] mb-3">{f.desc || `${f.modules.length} modules`}</div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div style={{ width: p.pct + "%", height: "100%", background: "var(--color-primary)" }} />
                  </div>
                  <span className="font-extrabold text-[var(--color-primary)] text-sm">{p.pct}%</span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  {p.d}/{p.t} leçons · {f.modules.length} modules
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
