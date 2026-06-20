import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// GET /api/cron/cleanup-expired
// Daily cleanup of expired athletes per 90-day retention rule.
// Configure in vercel.json with a cron pattern (e.g. "0 3 * * *").
//
// Steps:
//  1. Find athletes whose expired_at + 90 days < now → purge their data
//     (athlete_data rows) + remove auth user
//  2. Find athletes whose expired_at + 83 days < now (i.e. 7 days before
//     purge) → flag them for warning email (sending email is left to a
//     separate email-service integration)
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Vercel Cron signs every request with the project's CRON_SECRET if set.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  const purgeThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const warnThreshold = new Date(now.getTime() - 83 * 24 * 60 * 60 * 1000).toISOString();

  const result = { purged: 0, warned: 0, errors: [] as string[] };

  try {
    // 1. PURGE — expired more than 90 days
    const { data: toPurge } = await admin
      .from("athletes")
      .select("id, user_id, email")
      .eq("subscription_status", "expired")
      .lte("expired_at", purgeThreshold);

    for (const a of toPurge ?? []) {
      try {
        // Delete athlete_data rows
        await admin.from("athlete_data").delete().eq("athlete_id", a.id);
        // Delete athlete row
        await admin.from("athletes").delete().eq("id", a.id);
        // Delete auth user
        if (a.user_id) await admin.auth.admin.deleteUser(a.user_id);
        result.purged += 1;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown";
        result.errors.push(`purge ${a.email}: ${msg}`);
      }
    }

    // 2. WARN — expired between 83 and 90 days ago (7 days before purge)
    // TODO: integrate email send (Resend/SendGrid) once SMTP is configured.
    const { data: toWarn } = await admin
      .from("athletes")
      .select("id, email")
      .eq("subscription_status", "expired")
      .gt("expired_at", purgeThreshold)
      .lte("expired_at", warnThreshold);

    result.warned = toWarn?.length ?? 0;

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg, partial: result }, { status: 500 });
  }
}
