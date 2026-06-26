"use client";

import { useEffect, useState } from "react";
import { InlineWidget } from "react-calendly";
import { supabase } from "@/lib/supabase";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/subscription";

// =====================================================================
// BookingSection — embedded Calendly widget on the consultations page.
// Visible only for Progression Guidée (1 consult/mois) & Mission Performance
// (2 consults/mois). The component reads the athlete's tier and current
// month's consultations to display a remaining-slots counter (honor system).
// =====================================================================

const CALENDLY_URL = "https://calendly.com/nutriocus/nutriocus-consultation-de-suivi";

const MONTHLY_QUOTA: Partial<Record<SubscriptionTier, number>> = {
  progression_guidee: 1,
  mission_performance: 2,
};

type Consult = { date?: string };

export function BookingSection({
  consultations,
  athleteIdOverride,
}: {
  consultations: Consult[];
  athleteIdOverride?: string | null;
}) {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [calendlyBookings, setCalendlyBookings] = useState<{ scheduled_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Resolve the athlete row (coach override or own)
      const query = supabase
        .from("athletes")
        .select("id, subscription_tier, first_name, last_name, email");
      const { data: athlete } = athleteIdOverride
        ? await query.eq("id", athleteIdOverride).maybeSingle()
        : await query.eq("user_id", user.id).maybeSingle();

      if (athlete) {
        setAthleteId(athlete.id);
        setTier((athlete.subscription_tier as SubscriptionTier | null) ?? null);
        setFirstName(athlete.first_name ?? "");
        setLastName(athlete.last_name ?? "");
        setEmail(athlete.email ?? "");

        // Load current-month Calendly bookings for this athlete
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        const { data: bookings } = await supabase
          .from("calendly_bookings")
          .select("scheduled_at")
          .eq("athlete_id", athlete.id)
          .eq("status", "booked")
          .gte("scheduled_at", startOfMonth)
          .lt("scheduled_at", startOfNextMonth);
        if (bookings) setCalendlyBookings(bookings);
      }
      setLoading(false);
    })();
  }, [athleteIdOverride]);

  if (loading || !tier) return null;
  const quota = MONTHLY_QUOTA[tier];
  if (!quota) return null; // Plateforme tier doesn't get this feature

  // Count current-month "slots" : Calendly bookings (auto via webhook)
  // + manual CRs (legacy / created by coach without Calendly).
  // We take the MAX of both sources to avoid double-counting a booking that
  // also has a CR. This is a safe over-estimate that matches user intent.
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const crsThisMonth = consultations.filter(
    (c) => c.date && c.date.startsWith(currentYM),
  ).length;
  const calendlyThisMonth = calendlyBookings.length;
  const bookedThisMonth = Math.max(crsThisMonth, calendlyThisMonth);
  const remaining = Math.max(0, quota - bookedThisMonth);
  const tierLabel = SUBSCRIPTION_TIERS[tier].label;
  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div
      className="card mb-4 overflow-hidden"
      style={{ borderLeft: "5px solid var(--color-primary)" }}
    >
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
        <div>
          <div
            className="text-[10px] uppercase font-extrabold"
            style={{ letterSpacing: ".1em", color: "var(--color-primary)" }}
          >
            📅 Réserver une consultation
          </div>
          <div
            className="font-display font-extrabold text-base mt-0.5"
            style={{ letterSpacing: "-0.01em" }}
          >
            {firstName ? `${firstName}, tu peux ` : "Tu peux "}
            réserver <b style={{ color: "var(--color-primary)" }}>{quota} consultation{quota > 1 ? "s" : ""} par mois</b> dans le cadre de ton offre <b>{tierLabel}</b>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} —
            {" "}
            {remaining > 0 ? (
              <>
                <b style={{ color: "var(--color-success)" }}>
                  {remaining} consultation{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                </b>
                {bookedThisMonth > 0 && (
                  <> · {bookedThisMonth} déjà programmée{bookedThisMonth > 1 ? "s" : ""}</>
                )}
              </>
            ) : (
              <b style={{ color: "var(--color-primary)" }}>
                ✓ Quota du mois utilisé ({bookedThisMonth}/{quota})
              </b>
            )}
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={open ? "btn-ghost btn-sm" : "btn-primary btn-sm"}
          disabled={remaining === 0}
          style={{ opacity: remaining === 0 ? 0.5 : 1 }}
        >
          {open ? "Fermer le calendrier" : remaining === 0 ? "Quota atteint ce mois" : "Choisir un créneau →"}
        </button>
      </div>

      {open && remaining > 0 && (
        <div style={{ minHeight: 680 }}>
          <InlineWidget
            url={CALENDLY_URL}
            styles={{ height: 680, minWidth: "320px" }}
            prefill={{
              email,
              firstName,
              lastName,
              name: `${firstName} ${lastName}`.trim(),
            }}
            utm={{
              // utmContent embeds the athlete UUID so the webhook can match
              // the booking back to the right athlete row (without ambiguity).
              utmContent: athleteId || "",
              utmSource: "plateforme.nutriocus.com",
              utmMedium: "embed",
            }}
            pageSettings={{
              backgroundColor: "ffffff",
              primaryColor: "FF4501",
              textColor: "0a0a0a",
              hideEventTypeDetails: false,
              hideLandingPageDetails: false,
              hideGdprBanner: false,
            }}
          />
        </div>
      )}

      {remaining === 0 && (
        <div className="px-4 py-3 text-xs text-[var(--color-text-muted)]" style={{ background: "var(--color-surface-2)" }}>
          💡 Tu as utilisé toutes tes consultations de {monthLabel}. La prochaine sera disponible le 1er du mois prochain.
        </div>
      )}
    </div>
  );
}
