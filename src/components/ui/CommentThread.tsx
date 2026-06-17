"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadData, saveData } from "@/lib/athlete-storage";
import { Field } from "@/components/ui/PageHeader";

// =================== TYPES ===================
type Author = "athlete" | "coach";

type Comment = {
  id: string;
  author: Author;
  authorName: string;
  body: string;
  createdAt: string; // ISO datetime
  edited?: boolean;
};

type ViewerRole = {
  role: "athlete" | "coach" | null;
  name: string;
  athleteId: string;
};

// =================== HELPERS ===================
const newId = () => Math.random().toString(36).slice(2, 9);

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// =================== HOOK: viewer role ===================
// Determines whether the current logged-in user is the athlete or a coach
// viewing the athlete via ?athleteId=...
async function resolveViewer(urlAthleteId?: string): Promise<ViewerRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null, name: "", athleteId: "" };

  // Coach?
  const { data: coach } = await supabase
    .from("coaches")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (coach && urlAthleteId) {
    const name = [coach.first_name, coach.last_name].filter(Boolean).join(" ") || "Coach";
    return { role: "coach", name, athleteId: urlAthleteId };
  }

  // Athlete?
  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (athlete) {
    const name = [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") || "Athlète";
    return { role: "athlete", name, athleteId: urlAthleteId || athlete.id };
  }

  return { role: null, name: "", athleteId: urlAthleteId || "" };
}

// =================== COMPONENT ===================
export function CommentThread({
  contextType,
  contextId,
  title = "Commentaires",
  intro,
}: {
  contextType: string;       // e.g. "consultation", "race-analysis"
  contextId: string;         // unique id within the context
  title?: string;
  intro?: string;
}) {
  const searchParams = useSearchParams();
  const urlAthleteId = searchParams?.get("athleteId") || undefined;

  const [viewer, setViewer] = useState<ViewerRole>({ role: null, name: "", athleteId: "" });
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [posting, setPosting] = useState(false);
  const storageKey = `comments_${contextType}_${contextId}`;
  const endRef = useRef<HTMLDivElement | null>(null);

  // Resolve viewer role on mount
  useEffect(() => {
    (async () => {
      const v = await resolveViewer(urlAthleteId);
      setViewer(v);
      if (v.athleteId) {
        const stored = await loadData<Comment[]>(storageKey, [], v.athleteId);
        setComments(stored);
      }
      setLoaded(true);
    })();
  }, [storageKey, urlAthleteId]);

  const post = async () => {
    if (!viewer.role || !draft.trim()) return;
    setPosting(true);
    const newComment: Comment = {
      id: newId(),
      author: viewer.role,
      authorName: viewer.name,
      body: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [...comments, newComment];
    setComments(next);
    await saveData(storageKey, next, viewer.athleteId);
    setDraft("");
    setPosting(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    const next = comments.filter((c) => c.id !== id);
    setComments(next);
    await saveData(storageKey, next, viewer.athleteId);
  };

  const startEdit = (c: Comment) => {
    setEditing(c.id);
    setEditBuffer(c.body);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const next = comments.map((c) =>
      c.id === editing ? { ...c, body: editBuffer.trim(), edited: true } : c,
    );
    setComments(next);
    await saveData(storageKey, next, viewer.athleteId);
    setEditing(null);
    setEditBuffer("");
  };

  if (!loaded) {
    return (
      <div className="card p-4 mt-4">
        <div className="text-sm text-[var(--color-text-muted)]">Chargement des commentaires…</div>
      </div>
    );
  }

  if (!viewer.role) {
    return null; // Not logged in or doesn't have role context
  }

  return (
    <div className="card p-4 mt-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-extrabold uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em", fontSize: 16 }}>
            💬 {title}
          </div>
          {intro && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{intro}</div>}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {comments.length} commentaire{comments.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)] py-4 text-center" style={{ background: "var(--color-surface-2)", borderRadius: 8 }}>
          Aucun commentaire pour le moment. Sois le premier à écrire un message.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {comments.map((c) => {
            const isViewer = c.author === viewer.role;
            const isCoach = c.author === "coach";
            const color = isCoach ? "var(--color-primary)" : "var(--color-dark)";
            return (
              <div
                key={c.id}
                className="rounded-lg p-3"
                style={{
                  borderLeft: `4px solid ${color}`,
                  background: isViewer ? "var(--color-surface-2)" : "#fff",
                  border: isViewer ? undefined : "1px solid var(--color-border)",
                }}
              >
                <div className="flex justify-between items-baseline mb-1.5 flex-wrap gap-2">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: color,
                        color: "#fff",
                        letterSpacing: ".06em",
                      }}
                    >
                      {isCoach ? "👨‍⚕️ Coach" : "🏃 Athlète"}
                    </span>
                    <span className="text-sm font-bold">{c.authorName}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]" title={formatFull(c.createdAt)}>
                      {formatTimeAgo(c.createdAt)}
                      {c.edited && " (modifié)"}
                    </span>
                  </div>
                  {isViewer && editing !== c.id && (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(c)} className="text-[11px] text-[var(--color-text-muted)] hover:underline">
                        Éditer
                      </button>
                      <button onClick={() => remove(c.id)} className="text-[11px]" style={{ color: "var(--color-danger)" }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                {editing === c.id ? (
                  <div>
                    <textarea
                      className="input"
                      style={{ minHeight: 70, resize: "vertical" }}
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditing(null)} className="btn-ghost btn-xs">Annuler</button>
                      <button onClick={saveEdit} className="btn-primary btn-xs">Enregistrer</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{c.body}</div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* Compose */}
      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Field label={`Écrire en tant que ${viewer.role === "coach" ? "👨‍⚕️ Coach" : "🏃 Athlète"} (${viewer.name})`}>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Une question, un retour, une précision…"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                post();
              }
            }}
          />
        </Field>
        <div className="flex justify-between items-center mt-2 gap-2 flex-wrap">
          <div className="text-[10px] text-[var(--color-text-muted)]">
            Ctrl/Cmd + Entrée pour envoyer rapidement
          </div>
          <button
            onClick={post}
            disabled={!draft.trim() || posting}
            className="btn-primary btn-sm"
          >
            {posting ? "Envoi…" : "✉ Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
