"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  hasAccess,
  getRequiredTierForPath,
  tierMeetsRequirement,
  SUBSCRIPTION_TIERS,
  type AthleteSubscription,
  type SubscriptionTier,
} from "@/lib/subscription";

// =====================================================================
// AccessGate — enforces subscription access on every athlete page.
//
// Behaviour:
// - Always allowed: /athlete/expired and /athlete/subscription
//   (so an expired user can still reach the renew/manage screens)
// - Coach viewing an athlete via ?athleteId=... → skip check entirely
//   (the coach's session may have no subscription)
// - past_due → keep access + show a yellow banner so they update payment
// - expired (or canceled past period end) → redirect to /athlete/expired
// =====================================================================

const ALWAYS_ALLOWED_PATHS = ["/athlete/expired", "/athlete/subscription"];

export function AccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const athleteIdFromUrl = searchParams?.get("athleteId");

  const [checked, setChecked] = useState(false);
  const [showPastDueBanner, setShowPastDueBanner] = useState(false);
  const [tierBlocked, setTierBlocked] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1. Always-allowed paths bypass any check
      if (ALWAYS_ALLOWED_PATHS.includes(pathname || "")) {
        if (mounted) setChecked(true);
        return;
      }

      // 2. If viewing as a coach (?athleteId=…), skip subscription check
      //    The coach's own session may not have a subscription tied to it.
      if (athleteIdFromUrl) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: coach } = await supabase
            .from("coaches")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (coach) {
            if (mounted) setChecked(true);
            return;
          }
        }
      }

      // 3. Fetch the current user's athlete subscription
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // No session at all — let other guards (auth) handle it
        if (mounted) setChecked(true);
        return;
      }

      const { data: athlete } = await supabase
        .from("athletes")
        .select("subscription_status, subscription_ends_at, expired_at, subscription_tier")
        .eq("user_id", user.id)
        .maybeSingle();

      // If the user is NOT an athlete (e.g. coach-only), skip check
      if (!athlete) {
        if (mounted) setChecked(true);
        return;
      }

      // 4. Decide based on subscription state
      const access = hasAccess(athlete as AthleteSubscription);
      if (!access) {
        router.replace("/athlete/expired");
        return;
      }

      // 5. past_due → still has access but warn
      if (athlete.subscription_status === "past_due") {
        if (mounted) setShowPastDueBanner(true);
      }

      // 6. Tier gating — check if the current page requires a tier the athlete doesn't have
      const required = getRequiredTierForPath(pathname || "");
      if (required && !tierMeetsRequirement(athlete.subscription_tier, required)) {
        if (mounted) setTierBlocked(required);
      }

      if (mounted) setChecked(true);
    })();

    return () => {
      mounted = false;
    };
  }, [pathname, athleteIdFromUrl, router]);

  if (!checked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[var(--color-text-muted)]">
        Vérification de l&apos;accès…
      </div>
    );
  }

  if (tierBlocked) {
    const tierLabel = SUBSCRIPTION_TIERS[tierBlocked].label;
    return (
      <div>
        <div
          className="card p-8 text-center"
          style={{ borderLeft: "5px solid var(--color-primary)" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h2
            className="font-display font-extrabold text-2xl mb-2"
            style={{ letterSpacing: "-0.01em" }}
          >
            Réservé à {tierLabel}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
            Cette fonctionnalité est uniquement accessible aux athlètes inscrits
            à l&apos;offre <b>{tierLabel}</b> ou supérieure. Passe à cette offre
            pour y accéder.
          </p>
          <a href="/athlete/subscription" className="btn-primary btn-sm">
            💳 Mettre à jour mon abonnement →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPastDueBanner && (
        <div
          style={{
            background: "rgba(179,107,0,0.10)",
            border: "1px solid rgba(179,107,0,0.4)",
            color: "#b36b00",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ⚠ Paiement en retard — Stripe relance ta banque. Mets à jour ta carte depuis{" "}
          <a href="/athlete/subscription" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
            Mon abonnement
          </a>
          {" "}pour éviter une coupure d&apos;accès.
        </div>
      )}
      {children}
    </>
  );
}
