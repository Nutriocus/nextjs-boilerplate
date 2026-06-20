"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  daysUntilDataDeletion,
  isInGracePeriod,
  type AthleteSubscription,
} from "@/lib/subscription";

export default function ExpiredPage() {
  const [athlete, setAthlete] = useState<AthleteSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("athletes")
        .select("subscription_status, subscription_ends_at, subscription_tier, expired_at")
        .eq("user_id", user.id)
        .maybeSingle();
      setAthlete(data || null);
      setLoading(false);
    })();
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Pas de session active");
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert("Impossible d'ouvrir le portail : " + (json.error || "erreur inconnue"));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "erreur inconnue";
      alert("Erreur : " + msg);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader kicker="Abonnement" title="Chargement…" />
      </div>
    );
  }

  const daysLeft = athlete ? daysUntilDataDeletion(athlete) : null;
  const inGrace = athlete ? isInGracePeriod(athlete) : false;

  return (
    <div>
      <PageHeader
        kicker="Abonnement"
        title="Ton abonnement a expiré"
        desc="L'accès à la plateforme est suspendu, mais tes données sont conservées pendant 90 jours."
      />

      <div
        className="card p-6 mb-4"
        style={{ borderLeft: "5px solid var(--color-primary)" }}
      >
        <div className="text-[10px] uppercase font-bold mb-1" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
          📦 Tes données sont en sécurité
        </div>
        <div className="font-display font-extrabold text-2xl mb-2" style={{ letterSpacing: "-0.01em" }}>
          {inGrace && daysLeft != null
            ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} avant la suppression automatique`
            : "Tes données ont été supprimées."}
        </div>
        <p className="text-sm text-[var(--color-text)] mb-4 leading-relaxed">
          Tous tes bilans, tests, plans alimentaires, stratégies de course, données physiologiques et
          historiques de progression sont conservés. Si tu reprends ton abonnement avant la fin de
          cette période, tu retrouves immédiatement <b>tout</b> où tu l&apos;avais laissé.
        </p>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="btn-primary"
          style={{ display: "inline-flex", padding: "10px 20px", fontSize: 14 }}
        >
          {portalLoading ? "Ouverture…" : "🔄 Reprendre mon abonnement →"}
        </button>
        <div className="text-[11px] text-[var(--color-text-muted)] mt-2">
          Ouvre ton portail Stripe sécurisé pour réactiver ton abonnement,
          mettre à jour ta carte ou changer de plan.
        </div>
      </div>

      <div className="card p-4 text-sm text-[var(--color-text-muted)]">
        Un souci ? Écris-nous à <a href="mailto:nutriocus@gmail.com" style={{ color: "var(--color-primary)", fontWeight: 700 }}>nutriocus@gmail.com</a>
      </div>
    </div>
  );
}
