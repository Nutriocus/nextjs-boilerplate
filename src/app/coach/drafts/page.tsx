"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader, Empty } from "@/components/ui/PageHeader";

type Draft = {
  id: string;
  athlete_id: string | null;
  athlete_match_confidence: number | null;
  athlete_match_method: string | null;
  source: string;
  source_subject: string | null;
  cr_title: string | null;
  status: string;
  ai_error: string | null;
  created_at: string;
};

type AthleteLite = { id: string; first_name: string | null; last_name: string | null };

const SOURCE_LABEL: Record<string, string> = {
  sembly: "Sembly",
  gemini: "Gemini",
  manual: "Manuel",
  unknown: "Inconnu",
};

function confidenceBadge(score: number | null) {
  if (score === null || score === 0) {
    return { label: "Non identifié", color: "var(--color-danger)" };
  }
  if (score >= 0.95) return { label: "Match certain", color: "var(--color-success)" };
  if (score >= 0.85) return { label: "Match fiable", color: "var(--color-success)" };
  if (score >= 0.7) return { label: "À vérifier", color: "#e6a833" };
  return { label: "Incertain", color: "var(--color-danger)" };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [athletes, setAthletes] = useState<Record<string, AthleteLite>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("consultation_drafts")
        .select(
          "id, athlete_id, athlete_match_confidence, athlete_match_method, source, source_subject, cr_title, status, ai_error, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setDrafts(data as Draft[]);

      const ids = Array.from(
        new Set((data || []).map((d: Draft) => d.athlete_id).filter(Boolean)),
      ) as string[];
      if (ids.length) {
        const { data: ath } = await supabase
          .from("athletes")
          .select("id, first_name, last_name")
          .in("id", ids);
        if (ath) {
          const map: Record<string, AthleteLite> = {};
          for (const a of ath) map[a.id] = a as AthleteLite;
          setAthletes(map);
        }
      }
      setLoading(false);
    })();
  }, []);

  const visible = drafts.filter((d) => (filter === "all" ? true : d.status === "pending"));
  const counts = {
    pending: drafts.filter((d) => d.status === "pending").length,
    published: drafts.filter((d) => d.status === "published").length,
    error: drafts.filter((d) => d.status === "error").length,
  };

  if (loading) {
    return (
      <div>
        <PageHeader kicker="Coach" title="Brouillons CR à valider" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Coach"
        title="Brouillons CR à valider"
        desc="CR générés automatiquement par IA à partir des transcriptions Sembly / Gemini. Relis, édite et publie pour les rendre visibles à l'athlète."
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("pending")}
          className={filter === "pending" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
        >
          En attente ({counts.pending})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={filter === "all" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
        >
          Tout ({drafts.length})
        </button>
        {counts.error > 0 && (
          <span
            className="btn-sm"
            style={{
              background: "rgba(207,46,46,0.10)",
              color: "var(--color-danger)",
              border: "1px solid rgba(207,46,46,0.40)",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            ⚠ {counts.error} erreur{counts.error > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <Empty>Aucun brouillon {filter === "pending" ? "en attente" : ""}.</Empty>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((d) => {
            const badge = confidenceBadge(d.athlete_match_confidence);
            const athlete = d.athlete_id ? athletes[d.athlete_id] : null;
            const athleteName = athlete
              ? `${athlete.first_name ?? ""} ${athlete.last_name ?? ""}`.trim()
              : "Athlète non identifié";

            const statusColor =
              d.status === "published"
                ? "var(--color-success)"
                : d.status === "error"
                  ? "var(--color-danger)"
                  : "var(--color-primary)";

            return (
              <Link
                key={d.id}
                href={`/coach/drafts/${d.id}`}
                className="card flex items-center gap-3 px-4 py-3 hover:-translate-y-0.5 transition"
                style={{ borderLeft: `5px solid ${statusColor}` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      d.status === "error"
                        ? "rgba(207,46,46,0.10)"
                        : d.status === "published"
                          ? "rgba(95,140,10,0.10)"
                          : "var(--color-surface-2)",
                  }}
                >
                  {d.status === "error" ? "⚠" : d.status === "published" ? "✓" : "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm truncate">
                    {d.cr_title || d.source_subject || "Brouillon sans titre"}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span>{athleteName}</span>
                    <span>· {SOURCE_LABEL[d.source] || d.source}</span>
                    <span>· {fmtDate(d.created_at)}</span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold uppercase rounded px-2 py-1 whitespace-nowrap"
                  style={{
                    background: badge.color,
                    color: "#fff",
                    letterSpacing: ".06em",
                  }}
                >
                  {badge.label}
                </span>
                {d.status === "published" && (
                  <span className="text-[10px] font-bold uppercase text-[var(--color-success)]">
                    Publié
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
