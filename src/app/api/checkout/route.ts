import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// =====================================================================
// POST /api/checkout
// Body: { tier: "plateforme" | "progression_guidee" | "mission_performance",
//         interval: "monthly" | "yearly",
//         email?: string }
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

// Default price IDs (production). Each tier × interval can be overridden by env
// var for staging/test environments.
type Tier = "plateforme" | "progression_guidee" | "mission_performance";
type Interval = "monthly" | "yearly";

const PRICE_MAP: Record<Tier, Record<Interval, string>> = {
  plateforme: {
    monthly: process.env.STRIPE_PRICE_PLATEFORME_MONTHLY     || "price_1TkNDaBJVlo0KFNYt28yTMcN",
    yearly:  process.env.STRIPE_PRICE_PLATEFORME_YEARLY      || "price_1TkNDkBJVlo0KFNYvwhWc23U",
  },
  progression_guidee: {
    monthly: process.env.STRIPE_PRICE_PROGRESSION_GUIDEE_MONTHLY || "price_1TkNN7BJVlo0KFNYujr5OcR8",
    yearly:  process.env.STRIPE_PRICE_PROGRESSION_GUIDEE_YEARLY  || "price_1TkNNKBJVlo0KFNY4DZbrmCP",
  },
  mission_performance: {
    monthly: process.env.STRIPE_PRICE_MISSION_PERFORMANCE_MONTHLY || "price_1T55KjBJVlo0KFNYzzUlObH6",
    yearly:  process.env.STRIPE_PRICE_MISSION_PERFORMANCE_YEARLY  || "price_1TkNPdBJVlo0KFNYZiQaiU5z",
  },
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

  const { tier, interval, email } = body as { tier?: string; interval?: string; email?: string };

  const validTiers: Tier[] = ["plateforme", "progression_guidee", "mission_performance"];
  const validIntervals: Interval[] = ["monthly", "yearly"];

  if (!tier || !validTiers.includes(tier as Tier)) {
    return NextResponse.json(
      { error: `Invalid tier "${tier}". Expected one of: ${validTiers.join(", ")}` },
      { status: 400, headers },
    );
  }
  if (!interval || !validIntervals.includes(interval as Interval)) {
    return NextResponse.json(
      { error: `Invalid interval "${interval}". Expected one of: ${validIntervals.join(", ")}` },
      { status: 400, headers },
    );
  }

  const priceId = PRICE_MAP[tier as Tier][interval as Interval];

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL || "https://nutriocus.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { tier, interval },
      subscription_data: { metadata: { tier, interval } },
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
