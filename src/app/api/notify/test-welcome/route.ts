import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import type { SubscriptionTier } from "@/lib/subscription";

// =====================================================================
// GET /api/notify/test-welcome?tier=mission_performance&email=nutriocus@gmail.com
// Sends a TEST welcome email — coach only. Useful to preview the email.
// =====================================================================

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  // Auth check via cookie session (browser fetch with credentials sends cookies)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Bearer token. Open browser console and pass your session token." },
      { status: 401 },
    );
  }
  const userToken = authHeader.slice(7);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: coach } = await admin
    .from("coaches")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!coach) {
    return NextResponse.json({ error: "Réservé aux coachs" }, { status: 403 });
  }

  // Params
  const tierParam = (req.nextUrl.searchParams.get("tier") || "mission_performance") as SubscriptionTier;
  const validTiers: SubscriptionTier[] = ["plateforme", "progression_guidee", "mission_performance"];
  if (!validTiers.includes(tierParam)) {
    return NextResponse.json({ error: `Invalid tier. Use one of: ${validTiers.join(", ")}` }, { status: 400 });
  }
  const targetEmail = req.nextUrl.searchParams.get("email") || "nutriocus@gmail.com";

  // Fake magic link for the test (does not actually log in, but visually identical)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";
  const fakeMagicLink = `${siteUrl}/auth?test=1`;

  const res = await sendWelcomeEmail({
    firstName: "Florian",
    email: targetEmail,
    tier: tierParam,
    magicLink: fakeMagicLink,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error || "send failed" }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    sent_to: targetEmail,
    tier: tierParam,
    note: "Email de test envoyé. Le lien d'activation est volontairement bidon (page de login normale).",
  });
}
