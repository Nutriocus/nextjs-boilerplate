import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import type { SubscriptionTier } from "@/lib/subscription";

// =====================================================================
// POST /api/stripe/webhook
// Stripe events listener.
// IMPORTANT: signature is verified against the RAW request body — do not
// JSON.parse the body before constructEvent().
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLORIAN_COACH_UUID = "3023a4de-45fa-4cc8-a0d9-e09a1ceedd14";

// Maps Stripe Price IDs back to internal tier slugs.
// Used as fallback when checkout metadata.tier is missing
// (e.g. Payment Links created from the Stripe Dashboard).
function buildPriceToTierMap(): Record<string, SubscriptionTier> {
  const map: Record<string, SubscriptionTier> = {};
  const add = (id: string | undefined, tier: SubscriptionTier) => {
    if (id) map[id] = tier;
  };
  // Plateforme
  add(process.env.STRIPE_PRICE_PLATEFORME_MONTHLY || "price_1TkNDaBJVlo0KFNYt28yTMcN", "plateforme");
  add(process.env.STRIPE_PRICE_PLATEFORME_YEARLY  || "price_1TkNDkBJVlo0KFNYvwhWc23U", "plateforme");
  // Progression Guidée
  add(process.env.STRIPE_PRICE_PROGRESSION_GUIDEE_MONTHLY || "price_1TkNN7BJVlo0KFNYujr5OcR8", "progression_guidee");
  add(process.env.STRIPE_PRICE_PROGRESSION_GUIDEE_YEARLY  || "price_1TkNNKBJVlo0KFNY4DZbrmCP", "progression_guidee");
  // Mission Performance
  add(process.env.STRIPE_PRICE_MISSION_PERFORMANCE_MONTHLY || "price_1T55KjBJVlo0KFNYzzUlObH6", "mission_performance");
  add(process.env.STRIPE_PRICE_MISSION_PERFORMANCE_YEARLY  || "price_1TkNPdBJVlo0KFNYZiQaiU5z", "mission_performance");
  return map;
}

async function resolveTierFromSubscription(
  stripe: Stripe,
  subscriptionId: string | null | undefined,
): Promise<SubscriptionTier | null> {
  if (!subscriptionId) return null;
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = sub.items.data[0]?.price?.id;
    if (!priceId) return null;
    const map = buildPriceToTierMap();
    return map[priceId] ?? null;
  } catch (e) {
    console.warn("[stripe webhook] resolveTierFromSubscription failed:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Missing env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_*)" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secret);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // CRITICAL: raw body, not parsed.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const defaultCoachId = process.env.DEFAULT_COACH_ID || FLORIAN_COACH_UUID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";

  try {
    switch (event.type) {
      // ────────────────────────────────────────────────────────────
      // New successful checkout → create or link athlete, send invite
      // ────────────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        // Prefer metadata.tier (set by our /api/checkout flow).
        // Fallback: derive from the subscription's Price ID — covers Stripe
        // Payment Links and any other checkout source that didn't set metadata.
        // Last resort: default to "plateforme" (the cheapest autonomous offer)
        // so the athlete never lands in DB without a tier.
        let tier: SubscriptionTier | null =
          (session.metadata?.tier as SubscriptionTier | undefined) || null;
        if (!tier) {
          tier = await resolveTierFromSubscription(stripe, subscriptionId);
          if (!tier) {
            console.warn(
              "[stripe webhook] tier missing from metadata AND unresolved from subscription, defaulting to 'plateforme'",
              { customerId, subscriptionId },
            );
            tier = "plateforme";
          } else {
            console.log("[stripe webhook] tier resolved from Price ID:", tier);
          }
        }
        const email = (session.customer_details?.email || "").toLowerCase();
        const fullName = session.customer_details?.name || "";

        console.log("[stripe webhook] checkout.session.completed", { email, customerId, tier });

        if (!email) {
          throw new Error("checkout.session.completed: missing customer email");
        }

        // 1. Already an athlete with this email? → just link Stripe
        const { data: existing, error: lookupErr } = await admin
          .from("athletes")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (lookupErr) {
          throw new Error(`Lookup athlete failed: ${lookupErr.message}`);
        }

        if (existing) {
          const { error: updateErr } = await admin
            .from("athletes")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: "active",
              subscription_tier: tier,
              subscription_ends_at: null,
              expired_at: null,
            })
            .eq("id", existing.id);
          if (updateErr) {
            throw new Error(`Update athlete failed: ${updateErr.message}`);
          }
          console.log("[stripe webhook] athlete updated", { id: existing.id, email });
          break;
        }

        // 2. New athlete: create user (no Supabase email) + send custom welcome
        const parts = fullName.trim().split(/\s+/);
        const first_name = parts[0] || email.split("@")[0];
        const last_name = parts.slice(1).join(" ") || "—";

        // Create user without sending Supabase's default email (we'll send our own)
        const createRes = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName, source: "stripe", tier, password_set: false },
        });
        let userId = createRes.data?.user?.id;
        if (createRes.error) {
          // If user already exists, find them
          if (/already|registered/i.test(createRes.error.message)) {
            const { data: list } = await admin.auth.admin.listUsers();
            const found = list.users.find((u) => u.email?.toLowerCase() === email);
            userId = found?.id;
          } else {
            throw new Error(`Create user failed: ${createRes.error.message}`);
          }
        }
        if (!userId) {
          throw new Error("No user_id available after createUser");
        }

        // Generate magic link for first login (used in welcome email)
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${siteUrl}/auth/callback` },
        });
        if (linkErr) {
          console.warn("[stripe webhook] generateLink error:", linkErr.message);
        }
        const magicLink = linkData?.properties?.action_link || `${siteUrl}/auth`;

        // Insert athlete row
        const { error: insertErr } = await admin.from("athletes").insert({
          user_id: userId,
          coach_id: defaultCoachId,
          first_name,
          last_name,
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          subscription_tier: tier,
        });
        if (insertErr) {
          throw new Error(`Insert athlete failed: ${insertErr.message}`);
        }

        // Send custom welcome email via Resend
        const welcome = await sendWelcomeEmail({
          firstName: first_name,
          email,
          tier: (tier ?? null) as SubscriptionTier | null,
          magicLink,
        });
        if (!welcome.ok) {
          console.warn("[stripe webhook] welcome email failed:", welcome.error);
        }
        console.log("[stripe webhook] athlete created + welcome sent", { email, userId });

        break;
      }

      // ────────────────────────────────────────────────────────────
      // Subscription updated (status change, period end, cancel scheduled)
      // ────────────────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // If user canceled, mark "canceled" + remember when access ends.
        // If reactivated, clear the end date.
        const cancelAtPeriodEnd = sub.cancel_at_period_end;
        // Note: current_period_end is on the subscription items in v22 SDK; cast for type compat.
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        const endsAt =
          cancelAtPeriodEnd && periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

        const status: string = cancelAtPeriodEnd ? "canceled" : sub.status;

        await admin
          .from("athletes")
          .update({
            subscription_status: status,
            subscription_ends_at: endsAt,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      // ────────────────────────────────────────────────────────────
      // Subscription fully deleted (cancellation effective)
      // ────────────────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await admin
          .from("athletes")
          .update({
            subscription_status: "expired",
            expired_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      // ────────────────────────────────────────────────────────────
      // Payment failed → mark past_due (Stripe will retry; we keep access for now)
      // ────────────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await admin
          .from("athletes")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      // ────────────────────────────────────────────────────────────
      // Payment recovered → back to active
      // ────────────────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await admin
          .from("athletes")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      default:
        // Other events are ignored for now.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    // Don't return 500 on data errors — Stripe will retry indefinitely.
    // Log via Vercel logs and ack the webhook.
    console.error("[stripe webhook]", event.type, msg);
    return NextResponse.json({ received: true, error: msg });
  }
}
