"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field } from "@/components/ui/PageHeader";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { PrintReport, PrintH, PrintButton } from "@/components/ui/PrintReport";
import { RichMarkdown } from "@/components/ui/RichMarkdown";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { RichHtml } from "@/components/ui/RichHtml";
import { CommentThread } from "@/components/ui/CommentThread";

// Heuristic: content starting with '<' is treated as HTML (TipTap), otherwise
// as legacy plain-text / Markdown so older consultations keep rendering nicely.
function isHtml(s: string): boolean {
  return /^\s*</.test(s);
}

type Consultation = {
  id: string;
  date: string;
  coach: string;
  type: string;
  compteRendu: string;
  replay: string;
};

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const dateLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const blank = (): Consultation => ({
  id: newId(),
  date: today(),
  coach: "Florian Mouchel",
  type: "Consultation de suivi",
  compteRendu: "",
  replay: "",
});

export default function ConsultationsPage() {
  const [consultations, setConsultations, loaded] = useAthleteData<Consultation[]>("consultations", []);
  const [draft, setDraft] = useState<Consultation>(blank());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<string | null>(null);

  const update = (k: keyof Consultation, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const startCreate = () => {
    setDraft(blank());
    setEditingId(null);
    setOpen(true);
  };

  const startEdit = (c: Consultation) => {
    setDraft({ ...c });
    setEditingId(c.id);
    setOpen(true);
    setView(null);
  };

  const cancelForm = () => {
    setOpen(false);
    setEditingId(null);
    setDraft(blank());
  };

  const save = () => {
    if (!draft.date) return;
    setConsultations((p) => {
      if (editingId) {
        return p
          .map((c) => (c.id === editingId ? { ...draft, id: editingId } : c))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      return [...p, { ...draft, id: newId() }].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    cancelForm();
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer cette consultation ?")) return;
    setConsultations((p) => p.filter((c) => c.id !== id));
  };

  const sorted = [...consultations].sort((a, b) => (a.date < b.date ? 1 : -1));
  const cur = consultations.find((c) => c.id === view);

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Mon accompagnement" title="Mes consultations" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  if (cur) {
    return (
      <div>
        <div className="screen-only">
          <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
            <button onClick={() => setView(null)} className="btn-ghost btn-sm">
              ← Toutes les consultations
            </button>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => startEdit(cur)} className="btn-dark btn-sm">
                ✏️ Modifier
              </button>
              <PrintButton label="Exporter le compte rendu en PDF" />
            </div>
          </div>
          <h1
            className="font-extrabold uppercase mt-3 mb-1 text-2xl sm:text-3xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {cur.type}
          </h1>
          <div className="text-[var(--color-text-muted)] text-sm mb-4">
            {dateLong(cur.date)} · {cur.coach}
          </div>
          {cur.replay && (
            <div className="card p-4 mb-4">
              <div className="font-extrabold mb-3">Replay</div>
              <VideoEmbed url={cur.replay} title={cur.type} />
            </div>
          )}
          <div className="card p-5">
            <div className="font-extrabold mb-2">Compte rendu</div>
            {cur.compteRendu ? (
              isHtml(cur.compteRendu) ? (
                <RichHtml html={cur.compteRendu} variant="screen" />
              ) : (
                <RichMarkdown variant="screen">{cur.compteRendu}</RichMarkdown>
              )
            ) : (
              <div className="text-[var(--color-text-muted)] text-sm">—</div>
            )}
          </div>

          <CommentThread
            contextType="consultation"
            contextId={cur.id}
            title="Échange consultation"
            intro="Questions, retours, précisions sur cette consultation."
          />
        </div>

        <PrintReport
          kicker="Mon accompagnement"
          title="Compte rendu de consultation"
          subtitle={`${cur.type} · ${dateLong(cur.date)} · ${cur.coach}`}
        >
          <PrintH>Compte rendu</PrintH>
          <div
            style={{
              border: "1px solid #e6e6e3",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            {cur.compteRendu ? (
              isHtml(cur.compteRendu) ? (
                <RichHtml html={cur.compteRendu} variant="print" />
              ) : (
                <RichMarkdown variant="print">{cur.compteRendu}</RichMarkdown>
              )
            ) : (
              "—"
            )}
          </div>
          {cur.replay && (
            <div style={{ marginTop: 12, fontSize: 11.5, color: "#787876" }}>
              Replay : {cur.replay}
            </div>
          )}
        </PrintReport>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Mon accompagnement"
        title="Mes consultations"
        action={
          <button onClick={open ? cancelForm : startCreate} className="btn-primary">
            {open ? "Fermer" : "+ Consultation"}
          </button>
        }
        desc="Comptes rendus et replays de tes consultations."
      />

      {open && (
        <div className="card p-4 mb-4" style={{ border: `2px solid var(--color-primary)` }}>
          <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
            {editingId ? "✏️ Modification d'une consultation" : "+ Nouvelle consultation"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => update("date", e.target.value)} /></Field>
            <Field label="Type"><input className="input" value={draft.type} onChange={(e) => update("type", e.target.value)} /></Field>
            <Field label="Coach / intervenant"><input className="input" value={draft.coach} onChange={(e) => update("coach", e.target.value)} /></Field>
          </div>
          <div className="mt-2.5">
            <Field label="Lien du replay (YouTube / Vimeo / Loom)">
              <input className="input" value={draft.replay} onChange={(e) => update("replay", e.target.value)} />
            </Field>
          </div>
          <div className="mt-2.5">
            <Field label="Compte rendu">
              <RichTextEditor
                value={draft.compteRendu}
                onChange={(html) => update("compteRendu", html)}
                placeholder={"Points clés, décisions, axes de travail…"}
                minHeight={260}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={cancelForm} className="btn-ghost">Annuler</button>
            <button onClick={save} className="btn-primary">
              {editingId ? "Enregistrer les modifications" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {sorted.map((c) => (
          <div
            key={c.id}
            className="card flex items-center gap-3 px-4 py-3"
            style={{ borderLeft: `5px solid var(--color-primary)` }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: c.replay ? "var(--color-dark)" : "var(--color-surface-2)",
                color: c.replay ? "#fff" : "var(--color-text-muted)",
                fontSize: 16,
              }}
            >
              {c.replay ? "▶" : "📄"}
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => setView(c.id)}>
              <div className="font-extrabold text-sm">{c.type}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {dateLong(c.date)} · {c.coach}
                {c.replay ? " · replay disponible" : ""}
              </div>
            </div>
            <button onClick={() => setView(c.id)} className="btn-dark btn-xs">Ouvrir</button>
            <button
              onClick={() => startEdit(c)}
              className="btn-ghost btn-xs"
              title="Modifier"
            >
              ✏️
            </button>
            <button
              onClick={() => remove(c.id)}
              style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 15 }}
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
        {consultations.length === 0 && <Empty>Aucune consultation enregistrée.</Empty>}
      </div>
    </div>
  );
}
