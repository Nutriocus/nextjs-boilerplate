// =====================================================================
// SUBSCRIPTION BUSINESS RULES
// Pure functions describing whether an athlete has platform access,
// is in the data-retention grace period, etc. No I/O — easy to test.
// =====================================================================

export type SubscriptionStatus =
  | "trialing"     // free trial
  | "active"       // paying, full access
  | "past_due"     // payment failed but Stripe still retrying — keep access for now
  | "canceled"     // user canceled, access until subscription_ends_at
  | "expired"      // period over, no access
  | "incomplete";  // first checkout pending / never completed

export type AthleteSubscription = {
  subscription_status?: SubscriptionStatus | null;
  subscription_ends_at?: string | null;
  subscription_tier?: string | null;
  expired_at?: string | null;
};

const DATA_RETENTION_DAYS = 90;
const DELETION_WARNING_DAYS = 7; // email warning 7 days before purge

/** True if the athlete should currently have full platform access. */
export function hasAccess(a: AthleteSubscription): boolean {
  const s = a.subscription_status;
  if (s === "active" || s === "trialing" || s === "past_due") return true;
  if (s === "canceled" && a.subscription_ends_at) {
    return new Date(a.subscription_ends_at) > new Date();
  }
  return false;
}

/** True if access ended but data is still retained (within the 90-day window). */
export function isInGracePeriod(a: AthleteSubscription): boolean {
  if (!a.expired_at) return false;
  const expired = new Date(a.expired_at).getTime();
  const limit = expired + DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < limit;
}

/** Days remaining before the data is auto-purged (or null if not expired). */
export function daysUntilDataDeletion(a: AthleteSubscription): number | null {
  if (!a.expired_at) return null;
  const expired = new Date(a.expired_at).getTime();
  const deletionDate = expired + DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const diffMs = deletionDate - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/** True if we should send the "we'll delete your data in 7 days" warning email. */
export function shouldSendDeletionWarning(a: AthleteSubscription): boolean {
  const left = daysUntilDataDeletion(a);
  return left !== null && left <= DELETION_WARNING_DAYS && left > 0;
}

/** True if the data should be purged now (expired more than 90 days ago). */
export function shouldDeleteData(a: AthleteSubscription): boolean {
  const left = daysUntilDataDeletion(a);
  return left !== null && left <= 0;
}

/** Human-friendly status label for UI. */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string }> = {
  trialing:   { label: "Essai gratuit",       color: "var(--color-success)" },
  active:     { label: "Actif",               color: "var(--color-success)" },
  past_due:   { label: "Paiement à régler",   color: "#b36b00" },
  canceled:   { label: "Annulé — fin de période en cours", color: "#b36b00" },
  expired:    { label: "Expiré",              color: "var(--color-danger)" },
  incomplete: { label: "Inscription en attente", color: "var(--color-text-muted)" },
};

export type SubscriptionTier = "plateforme" | "progression_guidee" | "mission_performance";
export type SubscriptionInterval = "monthly" | "yearly";

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, {
  label: string;
  description: string;
  prices: Record<SubscriptionInterval, number>;  // EUR
}> = {
  plateforme: {
    label: "La plateforme Nutriocus",
    description: "Accès complet à la plateforme en autonomie — parcours guidé, modules, outils",
    prices: { monthly: 97, yearly: 997 },
  },
  progression_guidee: {
    label: "Progression Guidée",
    description: "Plateforme + revues régulières avec Florian — offre intermédiaire",
    prices: { monthly: 199, yearly: 1999 },
  },
  mission_performance: {
    label: "Mission Performance",
    description: "Premium — consultations, suivi 1-to-1, accompagnement complet sur la saison",
    prices: { monthly: 399, yearly: 3497 },
  },
};
