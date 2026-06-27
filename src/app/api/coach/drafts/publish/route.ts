import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/coach/drafts/publish
// Publishes a consultation_drafts row as a real consultation in
// athletes.athlete_data (key="consultations").
// Body: { draftId, athleteId, date, type, coach, replay, html, notifyAthlete }
//
// Auth: caller must be a coach (verified via JWT).
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newId = () => Math.random().toString(36).slice(2, 9);

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  }

  // Verify JWT belongs to a coach
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userClient = createClient(url, serviceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
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
  if (!coach) return NextResponse.json({ error: "Réservé au coach" }, { status: 403 });

  let body: {
    draftId?: string;
    athleteId?: string;
    date?: string;
    type?: string;
    coach?: string;
    replay?: string;
    html?: string;
    notifyAthlete?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { draftId, athleteId, date, type, coach: coachName, replay, html, notifyAthlete } = body;
  if (!draftId || !athleteId || !date || !type || !html) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Load existing consultations for the athlete
  const { data: existing } = await admin
    .from("athlete_data")
    .select("data")
    .eq("athlete_id", athleteId)
    .eq("key", "consultations")
    .maybeSingle();

  const consultations = Array.isArray(existing?.data) ? (existing!.data as Array<Record<string, unknown>>) : [];

  const newConsult = {
    id: newId(),
    date,
    coach: coachName || "Florian Mouchel",
    type,
    compteRendu: html,
    replay: replay || "",
  };

  const next = [...consultations, newConsult].sort((a, b) =>
    String(a.date) < String(b.date) ? 1 : -1,
  );

  // 2. Upsert consultations
  const { error: saveErr } = await admin
    .from("athlete_data")
    .upsert({ athlete_id: athleteId, key: "consultations", data: next });
  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  // 3. Update draft status
  await admin
    .from("consultation_drafts")
    .update({
      status: "published",
      athlete_id: athleteId, // in case coach changed assignment
      published_consultation_id: newConsult.id,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);

  // 4. Optionally notify the athlete
  if (notifyAthlete) {
    try {
      await fetch(`${req.nextUrl.origin}/api/notify/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          athleteId,
          consultationType: type,
          consultationDate: date,
        }),
      });
    } catch (e) {
      console.warn("[publish] notify athlete failed", e);
    }
  }

  return NextResponse.json({ ok: true, consultationId: newConsult.id });
}
