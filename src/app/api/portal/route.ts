import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/portal
// Returns { url } = Stripe Customer Portal session for the authenticated
// athlete. The portal lets them update card, cancel subscription, see
// invoices, etc. — fully managed by Stripe.
// =====================================================================

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!secret || !supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Authenticate the user from their session token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userToken = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: athlete } = await userClient
    .from("athletes")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!athlete?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun client Stripe lié à ce compte. Si tu pensais avoir un abonnement actif, contacte le support." },
      { status: 400 },
    );
  }

  const stripe = new Stripe(secret);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: athlete.stripe_customer_id,
      return_url: `${siteUrl}/athlete/profile`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
