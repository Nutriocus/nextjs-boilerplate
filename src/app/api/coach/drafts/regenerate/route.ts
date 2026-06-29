import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCr } from "@/lib/cr-generator";

// =====================================================================
// POST /api/coach/drafts/regenerate
// Re-runs Claude on an existing draft's stored transcript. Useful when
// a draft is stuck empty (e.g. earlier Vercel function timeout) and you
// don't want to forward the email again.
// Body: { draftId }
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  }

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

  let body: { draftId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { draftId } = body;
  if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

  const { data: draft } = await admin
    .from("consultation_drafts")
    .select("transcript_raw, replay_url, athlete_id")
    .eq("id", draftId)
    .maybeSingle();
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (!draft.transcript_raw) {
    return NextResponse.json({ error: "Draft has no transcript to regenerate from" }, { status: 400 });
  }

  // Resolve athlete name for the prompt
  let athleteName = "Athlète";
  if (draft.athlete_id) {
    const { data: ath } = await admin
      .from("athletes")
      .select("first_name, last_name")
      .eq("id", draft.athlete_id)
      .maybeSingle();
    if (ath) athleteName = `${ath.first_name ?? ""} ${ath.last_name ?? ""}`.trim() || athleteName;
  }

  const cr = await generateCr({
    athleteName,
    transcript: draft.transcript_raw,
    replayUrl: draft.replay_url,
  });

  if (!cr.ok) {
    await admin
      .from("consultation_drafts")
      .update({ status: "error", ai_error: cr.error, updated_at: new Date().toISOString() })
      .eq("id", draftId);
    return NextResponse.json({ ok: false, error: cr.error }, { status: 500 });
  }

  const { error: writeErr } = await admin
    .from("consultation_drafts")
    .update({
      cr_title: cr.title,
      cr_html: cr.html,
      ai_model: cr.model,
      ai_tokens_input: cr.tokensInput,
      ai_tokens_output: cr.tokensOutput,
      ai_error: null,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);
  if (writeErr) {
    return NextResponse.json({ error: writeErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, title: cr.title, tokens: cr.tokensOutput });
}
