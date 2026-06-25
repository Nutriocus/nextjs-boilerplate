"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";

const TIERS = [
  { value: "plateforme", label: "La plateforme Nutriocus (97€/mois)", color: "#787876" },
  { value: "progression_guidee", label: "Progression Guidée (199€/mois)", color: "#b36b00" },
  { value: "mission_performance", label: "Mission Performance (399€/mois)", color: "#FF4501" },
];

export default function TestEmailsPage() {
  const [email, setEmail] = useState("nutriocus@gmail.com");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  async function sendTest(tier: string) {
    setLoading(tier);
    setResults((p) => ({ ...p, [tier]: "⏳ Envoi..." }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expirée — reconnecte-toi");
      const res = await fetch(`/api/notify/test-welcome?tier=${tier}&email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResults((p) => ({ ...p, [tier]: `✓ Envoyé à ${email}` }));
      } else {
        setResults((p) => ({ ...p, [tier]: `⚠ ${json.error || "Erreur"}` }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "erreur";
      setResults((p) => ({ ...p, [tier]: `⚠ ${msg}` }));
    } finally {
      setLoading(null);
    }
  }

  async function sendAll() {
    for (const t of TIERS) {
      await sendTest(t.value);
    }
  }

  return (
    <div>
      <Link href="/coach" className="btn-ghost btn-sm mb-3 inline-flex">← Retour</Link>

      <PageHeader
        kicker="Outils coach"
        title="Tester les emails de bienvenue"
        desc="Envoie une version test du mail de bienvenue à l'email indiqué — pour visualiser le rendu de chaque offre."
      />

      <div className="card p-4 mb-4">
        <div className="text-[10px] uppercase font-bold mb-2" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
          📧 Email destinataire
        </div>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email-test@exemple.com"
          style={{ maxWidth: 400 }}
        />
        <div className="text-[11px] text-[var(--color-text-muted)] mt-2">
          Le lien d&apos;activation dans le mail test est volontairement factice — c&apos;est juste un aperçu visuel.
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button
          onClick={sendAll}
          disabled={!!loading}
          className="btn-dark"
        >
          📨 Envoyer les 3 versions d&apos;un coup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TIERS.map((t) => (
          <div
            key={t.value}
            className="card p-4"
            style={{ borderTop: `4px solid ${t.color}` }}
          >
            <div
              className="text-[10px] uppercase font-extrabold mb-2"
              style={{ letterSpacing: ".08em", color: t.color }}
            >
              Offre
            </div>
            <div className="font-extrabold text-sm mb-3">{t.label}</div>
            <button
              onClick={() => sendTest(t.value)}
              disabled={!!loading}
              className="btn-primary btn-sm w-full"
            >
              {loading === t.value ? "Envoi..." : "📧 Envoyer le test"}
            </button>
            {results[t.value] && (
              <div
                className="mt-2 text-xs font-bold p-2 rounded"
                style={{
                  background: results[t.value].startsWith("✓")
                    ? "rgba(95,140,10,0.10)"
                    : results[t.value].startsWith("⏳")
                      ? "var(--color-surface-2)"
                      : "rgba(207,46,46,0.10)",
                  color: results[t.value].startsWith("✓")
                    ? "var(--color-success)"
                    : results[t.value].startsWith("⏳")
                      ? "var(--color-text-muted)"
                      : "var(--color-danger)",
                }}
              >
                {results[t.value]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4 mt-4 text-xs text-[var(--color-text-muted)]" style={{ background: "var(--color-surface-2)" }}>
        💡 <b>Astuce</b> : pour comparer les 3 offres côte à côte, clique sur <b>Envoyer les 3 versions d&apos;un coup</b>.
        Tu recevras 3 mails dans la boîte indiquée.
      </div>
    </div>
  );
}
