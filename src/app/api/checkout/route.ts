import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// =====================================================================
// POST /api/checkout
// Body: { tier: "mission_performance" | "progression_guidee" | "decouverte", email?: string }
// → Returns { url } = Stripe Checkout session URL to redirect the user to.
//
// Called from the marketing site (nutriocus.com) or a pricing page.
// CORS is enabled for nutriocus.com so the marketing site can call this.
// =====================================================================

export const runtime = "nodejs";

const ALLOWED_ORIGINS = [
  "https://nutriocus.com",
  "https://www.nutriocus.com",
  "https://plateforme.nutriocus.com",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://nutriocus.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

const PRICE_MAP: Record<string, string | undefined> = {
  mission_performance: process.env.STRIPE_PRICE_MISSION_PERFORMANCE,
  progression_guidee: process.env.STRIPE_PRICE_PROGRESSION_GUIDEE,
  decouverte: process.env.STRIPE_PRICE_DECOUVERTE,
};

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe not configured (missing STRIPE_SECRET_KEY)" }, { status: 500, headers });
  }
  const stripe = new Stripe(secret);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers });

  const { tier, email } = body as { tier?: string; email?: string };
  if (!tier || !PRICE_MAP[tier]) {
    return NextResponse.json(
      { error: `Invalid tier (${tier}). Expected one of: ${Object.keys(PRICE_MAP).join(", ")}` },
      { status: 400, headers },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL || "https://nutriocus.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_MAP[tier]!, quantity: 1 }],
      customer_email: email,
      metadata: { tier },
      subscription_data: { metadata: { tier } },
      success_url: `${baseUrl}/auth?welcome=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: marketingUrl,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      // EU VAT collection — enable in Stripe dashboard first.
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
    });

    return NextResponse.json({ url: session.url }, { status: 200, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
