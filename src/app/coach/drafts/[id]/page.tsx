"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichHtml } from "@/components/ui/RichHtml";

type Draft = {
  id: string;
  athlete_id: string | null;
  athlete_match_confidence: number | null;
  athlete_match_method: string | null;
  source: string;
  source_subject: string | null;
  source_sender: string | null;
  transcript_raw: string | null;
  replay_url: string | null;
  cr_title: string | null;
  cr_html: string | null;
  ai_model: string | null;
  ai_tokens_input: number | null;
  ai_tokens_output: number | null;
  ai_error: string | null;
  status: string;
  created_at: string;
};

type AthleteLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function DraftDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [athletes, setAthletes] = useState<AthleteLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [date, setDate] = useState(today());
  const [coach, setCoach] = useState("Florian Mouchel");
  const [replay, setReplay] = useState("");
  const [athleteId, setAthleteId] = useState<string>("");
  const [notifyAthlete, setNotifyAthlete] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function regenerate() {
    if (!draftId) return;
    if (!confirm("Relancer la génération IA sur la même transcription ? Cela remplacera le contenu actuel du CR.")) return;
    setRegenerating(true);
    setMsg("⏳ Régénération en cours (peut prendre 1-2 min sur un long transcript)…");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setMsg("⚠ Session expirée"); setRegenerating(false); return; }
      const res = await fetch("/api/coach/drafts/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ draftId }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setMsg("✓ Régénéré ! Rechargement…");
        setTimeout(() => window.location.reload(), 800);
      } else {
        setMsg("⚠ " + (json.error || `HTTP ${res.status}`));
        setRegenerating(false);
      }
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "erreur inconnue";
      setMsg("⚠ " + m);
      setRegenerating(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("consultation_drafts")
        .select("*")
        .eq("id", draftId)
        .maybeSingle();
      if (data) {
        const d = data as Draft;
        setDraft(d);
        setTitle(d.cr_title || "Consultation de suivi");
        setHtml(d.cr_html || "");
        setReplay(d.replay_url || "");
        setAthleteId(d.athlete_id || "");
      }

      const { data: ath } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, email")
        .order("first_name", { ascending: true });
      if (ath) setAthletes(ath as AthleteLite[]);

      setLoading(false);
    })();
  }, [draftId]);

  async function publish() {
    if (!athleteId) {
      setMsg("⚠ Sélectionne un athlète avant de publier");
      return;
    }
    if (!html.trim()) {
      setMsg("⚠ Le compte rendu est vide");
      return;
    }
    setSaving(true);
    setMsg("⏳ Publication en cours…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setMsg("⚠ Session expirée — reconnecte-toi");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/coach/drafts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          draftId,
          athleteId,
          date,
          type: title,
          coach,
          replay,
          html,
          notifyAthlete,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setMsg("✓ Publié ! Redirection…");
        setTimeout(() => router.push("/coach/drafts"), 1200);
      } else {
        setMsg("⚠ " + (json.error || `HTTP ${res.status}`));
        setSaving(false);
      }
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "erreur inconnue";
      setMsg("⚠ " + m);
      setSaving(false);
    }
  }

  async function discard() {
    if (!confirm("Supprimer ce brouillon ? Cette action est irréversible.")) return;
    await supabase
      .from("consultation_drafts")
      .update({ status: "discarded", updated_at: new Date().toISOString() })
      .eq("id", draftId);
    router.push("/coach/drafts");
  }

  if (loading) {
    return (
      <div>
        <PageHeader kicker="Coach" title="Brouillon CR" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }
  if (!draft) {
    return (
      <div>
        <PageHeader kicker="Coach" title="Brouillon CR" />
        <Empty>Brouillon introuvable.</Empty>
        <Link href="/coach/drafts" className="btn-ghost btn-sm mt-2">← Retour à la liste</Link>
      </div>
    );
  }

  const isPublished = draft.status === "published";
  const hasError = draft.status === "error";
  const matchedAthlete = athletes.find((a) => a.id === athleteId);

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
        <Link href="/coach/drafts" className="btn-ghost btn-sm">← Tous les brouillons</Link>
        {!isPublished && (
          <button onClick={discard} className="btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
            🗑 Jeter ce brouillon
          </button>
        )}
      </div>

      <PageHeader
        kicker={isPublished ? "Brouillon publié ✓" : hasError ? "Erreur IA ⚠" : "Brouillon à valider"}
        title={title || "Sans titre"}
        desc={`Source : ${draft.source} · ${draft.source_subject || "(sans sujet)"}`}
      />

      {hasError && (
        <div
          className="card p-4 mb-4"
          style={{ borderLeft: "5px solid var(--color-danger)", background: "rgba(207,46,46,0.05)" }}
        >
          <div className="font-extrabold mb-1">Erreur de génération IA</div>
          <div className="text-sm text-[var(--color-text-muted)]">{draft.ai_error}</div>
          <div className="text-xs mt-2">Tu peux quand même éditer manuellement le CR ci-dessous et le publier.</div>
        </div>
      )}

      {msg && (
        <div
          className="mb-3 p-3 rounded-lg text-sm font-bold"
          style={{
            background: msg.startsWith("✓") ? "rgba(95,140,10,0.10)" : "rgba(207,46,46,0.10)",
            color: msg.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)",
            border: msg.startsWith("✓") ? "1px solid rgba(95,140,10,0.40)" : "1px solid rgba(207,46,46,0.40)",
          }}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mb-4">
        {/* LEFT — main form */}
        <div className="card p-4">
          <Field label="Titre de la consultation">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPublished}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isPublished}
              />
            </Field>
            <Field label="Coach">
              <input
                className="input"
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                disabled={isPublished}
              />
            </Field>
          </div>

          <Field label="Lien du replay (optionnel)">
            <input
              className="input mt-2.5"
              value={replay}
              onChange={(e) => setReplay(e.target.value)}
              placeholder="https://…"
              disabled={isPublished}
            />
          </Field>

          <div className="mt-3">
            <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
              Compte rendu
            </div>
            {isPublished ? (
              <div className="card p-4">
                <RichHtml html={html} variant="screen" />
              </div>
            ) : (
              <RichTextEditor
                value={html}
                onChange={setHtml}
                placeholder="Le CR généré apparaît ici. Édite librement."
                minHeight={500}
              />
            )}
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
              Athlète assigné
            </div>
            <select
              className="input"
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              disabled={isPublished}
            >
              <option value="">— Sélectionne un athlète —</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.first_name} {a.last_name} {a.email ? `(${a.email})` : ""}
                </option>
              ))}
            </select>
            {draft.athlete_match_confidence !== null && draft.athlete_match_confidence > 0 && (
              <div className="text-xs text-[var(--color-text-muted)] mt-2">
                Match auto : <b>{Math.round(draft.athlete_match_confidence * 100)}%</b> ({draft.athlete_match_method})
              </div>
            )}
            {matchedAthlete?.email && (
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                📧 {matchedAthlete.email}
              </div>
            )}
          </div>

          {!isPublished && (
            <div className="card p-4" style={{ background: "var(--color-surface-2)" }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAthlete}
                  onChange={(e) => setNotifyAthlete(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span className="text-sm">📧 Notifier l&apos;athlète par email</span>
              </label>
              <button
                onClick={publish}
                disabled={saving || !athleteId}
                className="btn-primary w-full mt-3"
                style={{ opacity: saving || !athleteId ? 0.6 : 1 }}
              >
                {saving ? "Publication…" : "✓ Publier"}
              </button>
            </div>
          )}

          {draft.ai_model && (
            <div className="card p-3 text-xs text-[var(--color-text-muted)]">
              <div>
                Modèle : <b>{draft.ai_model}</b>
              </div>
              {draft.ai_tokens_input != null && draft.ai_tokens_output != null && (
                <div>
                  Tokens : {draft.ai_tokens_input} in / {draft.ai_tokens_output} out
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowTranscript((s) => !s)}
            className="btn-ghost btn-sm"
          >
            {showTranscript ? "Masquer" : "Voir"} la transcription brute
          </button>

          {!isPublished && draft.transcript_raw && (
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="btn-ghost btn-sm"
              style={{
                color: !html.trim() ? "var(--color-primary)" : "var(--color-text-muted)",
                border: !html.trim() ? "1px dashed var(--color-primary)" : undefined,
              }}
              title="Relance Claude sur la même transcription"
            >
              {regenerating ? "🔄 Régénération…" : !html.trim() ? "🔄 Régénérer (CR vide)" : "🔄 Régénérer le CR"}
            </button>
          )}
        </div>
      </div>

      {showTranscript && (
        <div className="card p-4 mb-4">
          <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}>
            Transcription source ({draft.source})
          </div>
          <pre
            className="text-xs whitespace-pre-wrap"
            style={{
              background: "var(--color-surface-2)",
              padding: 12,
              borderRadius: 8,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {draft.transcript_raw}
          </pre>
        </div>
      )}
    </div>
  );
}
