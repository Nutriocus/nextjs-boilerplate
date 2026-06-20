"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_TIERS,
  daysUntilDataDeletion,
  hasAccess,
  type AthleteSubscription,
  type SubscriptionStatus,
  type SubscriptionTier,
} from "@/lib/subscription";

type SubInfo = AthleteSubscription & {
  stripe_customer_id?: string | null;
};

export function SubscriptionCard() {
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

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
        .select(
          "subscription_status, subscription_ends_at, subscription_tier, expired_at, stripe_customer_id",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      setSub(data || null);
      setLoading(false);
    })();
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expirée — reconnecte-toi");
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setPortalError(json.error || "Impossible d'ouvrir le portail");
        setPortalLoading(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "erreur inconnue";
      setPortalError(msg);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-5 mt-4">
        <div className="text-sm text-[var(--color-text-muted)]">Chargement de l&apos;abonnement…</div>
      </div>
    );
  }

  // No subscription info at all → likely a coach or legacy account
  if (!sub) {
    return null;
  }

  const status = (sub.subscription_status as SubscriptionStatus | null) ?? "incomplete";
  const meta = SUBSCRIPTION_STATUS_LABELS[status] ?? SUBSCRIPTION_STATUS_LABELS.incomplete;
  const tier = (sub.subscription_tier as SubscriptionTier | null) ?? null;
  const tierInfo = tier ? SUBSCRIPTION_TIERS[tier] : null;
  const access = hasAccess(sub);
  const endsAt = sub.subscription_ends_at ? new Date(sub.subscription_ends_at) : null;
  const expiredDaysLeft = daysUntilDataDeletion(sub);

  return (
    <div
      className="card p-5 mt-4"
      style={{ borderLeft: `5px solid ${access ? "var(--color-primary)" : "var(--color-danger)"}` }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div
            className="font-extrabold uppercase"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            💳 Mon abonnement
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Gère ton plan, ta carte bancaire, télécharge tes factures — depuis le portail sécurisé Stripe.
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
          style={{ background: meta.color + "22", color: meta.color, letterSpacing: ".08em" }}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="text-[10px] uppercase font-bold mb-1"
            style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}
          >
            Offre
          </div>
          <div className="font-extrabold text-sm">
            {tierInfo?.label ?? (tier ? tier : "—")}
          </div>
          {tierInfo && (
            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
              {tierInfo.description}
            </div>
          )}
        </div>

        <div
          className="rounded-lg p-3"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="text-[10px] uppercase font-bold mb-1"
            style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}
          >
            Statut
          </div>
          <div className="font-extrabold text-sm" style={{ color: meta.color }}>
            {meta.label}
          </div>
          {status === "canceled" && endsAt && (
            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Accès jusqu&apos;au <b>{endsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</b>
            </div>
          )}
          {status === "expired" && expiredDaysLeft != null && expiredDaysLeft > 0 && (
            <div className="text-[11px] mt-0.5" style={{ color: "var(--color-danger)" }}>
              Données conservées encore <b>{expiredDaysLeft} jour{expiredDaysLeft > 1 ? "s" : ""}</b>
            </div>
          )}
        </div>

        <div
          className="rounded-lg p-3"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="text-[10px] uppercase font-bold mb-1"
            style={{ letterSpacing: ".08em", color: "var(--color-text-muted)" }}
          >
            Accès plateforme
          </div>
          <div className="font-extrabold text-sm" style={{ color: access ? "var(--color-success)" : "var(--color-danger)" }}>
            {access ? "✓ Actif" : "✗ Suspendu"}
          </div>
        </div>
      </div>

      {sub.stripe_customer_id ? (
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={openPortal} disabled={portalLoading} className="btn-primary btn-sm">
            {portalLoading ? "Ouverture…" : "🔧 Gérer mon abonnement →"}
          </button>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Portail sécurisé Stripe : annulation, changement de plan, factures, carte bancaire.
          </span>
        </div>
      ) : (
        <div
          className="rounded-lg p-3 text-xs"
          style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", border: "1px dashed var(--color-border)" }}
        >
          ⓘ Ton compte n&apos;est pas relié à un abonnement Stripe (compte créé manuellement par ton coach). Pour
          toute question contacte <a href="mailto:nutriocus@gmail.com" style={{ color: "var(--color-primary)", fontWeight: 700 }}>nutriocus@gmail.com</a>.
        </div>
      )}

      {portalError && (
        <div
          className="mt-2 text-xs"
          style={{ color: "var(--color-danger)", background: "#fcebe8", border: "1px solid rgba(207,46,46,0.4)", borderRadius: 6, padding: "8px 10px" }}
        >
          ⚠ {portalError}
        </div>
      )}
    </div>
  );
}
