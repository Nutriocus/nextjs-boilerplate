"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasAccess, type AthleteSubscription } from "@/lib/subscription";

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
        .select("subscription_status, subscription_ends_at, expired_at")
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
