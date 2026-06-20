import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/stripe/webhook
// Stripe events listener.
// IMPORTANT: signature is verified against the RAW request body — do not
// JSON.parse the body before constructEvent().
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLORIAN_COACH_UUID = "3023a4de-45fa-4cc8-a0d9-e09a1ceedd14";

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
        const tier = session.metadata?.tier || null;
        const email = (session.customer_details?.email || "").toLowerCase();
        const fullName = session.customer_details?.name || "";

        if (!email) break;

        // 1. Already an athlete with this email? → just link Stripe
        const { data: existing } = await admin
          .from("athletes")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          await admin
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
          break;
        }

        // 2. New athlete: send invite (Supabase auth user + email)
        const inviteRes = await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${siteUrl}/auth/callback`,
          data: { full_name: fullName, source: "stripe", tier },
        });

        let userId: string | undefined = inviteRes.data?.user?.id;
        if (inviteRes.error) {
          // If already exists (manual auth user created earlier), fetch the id
          if (/already/i.test(inviteRes.error.message)) {
            const { data: list } = await admin.auth.admin.listUsers();
            const found = list.users.find((u) => u.email?.toLowerCase() === email);
            userId = found?.id;
          } else {
            throw new Error(`Invite failed: ${inviteRes.error.message}`);
          }
        }

        const parts = fullName.trim().split(/\s+/);
        const first_name = parts[0] || email.split("@")[0];
        const last_name = parts.slice(1).join(" ") || "—";

        await admin.from("athletes").insert({
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
