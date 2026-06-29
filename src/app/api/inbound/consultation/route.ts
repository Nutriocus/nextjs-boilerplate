import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { parseInboundEmail } from "@/lib/email-inbound-parsers";
import { matchAthlete } from "@/lib/athlete-matcher";
import { generateCr } from "@/lib/cr-generator";

// Resend uses Svix-style signatures. The signing secret looks like
// "whsec_<base64>" and the request carries 3 headers: svix-id,
// svix-timestamp, svix-signature (which can contain several
// space-separated "v1,<base64>" entries — any one matching is OK).
function verifySvixSignature(
  rawBody: string,
  headers: { id: string; timestamp: string; signature: string },
  signingSecret: string,
): boolean {
  try {
    const secretBytes = Buffer.from(signingSecret.replace(/^whsec_/, ""), "base64");
    const signedPayload = `${headers.id}.${headers.timestamp}.${rawBody}`;
    const expectedB64 = crypto
      .createHmac("sha256", secretBytes)
      .update(signedPayload)
      .digest("base64");
    const expectedBuf = Buffer.from(expectedB64, "base64");
    const provided = headers.signature.split(" ")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("v1,"))
      .map((s) => s.slice(3));
    return provided.some((sig) => {
      try {
        const sigBuf = Buffer.from(sig, "base64");
        if (sigBuf.length !== expectedBuf.length) return false;
        return crypto.timingSafeEqual(expectedBuf, sigBuf);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// =====================================================================
// POST /api/inbound/consultation
// Receives Resend Inbound webhook for emails sent to cr@plateforme.nutriocus.com.
// 1. Parses Sembly or Gemini formats.
// 2. Matches the athlete via email or name (with confidence score).
// 3. Generates an HTML CR via Claude Sonnet.
// 4. Stores the draft in consultation_drafts.
// 5. Notifies the coach by email (calls the coach-notification endpoint).
//
// Auth: Resend signs webhooks via Svix headers. We verify the signature
// using RESEND_INBOUND_WEBHOOK_SECRET if configured.
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Long transcripts (1h+ consultations) can take 60-120s through Claude. The
// earlier 60s cap killed the function before the cr_html update ran, leaving
// drafts stuck in `pending` with no error. 300s is Vercel Pro's max.
export const maxDuration = 300;

type ResendInboundEmail = {
  from?: { email?: string; name?: string } | string;
  to?: Array<{ email?: string } | string> | string;
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
};

// Generic shape that works for Resend, Mailgun, SendGrid-style inbounds.
type InboundPayload = {
  from?: string | { email?: string; name?: string };
  subject?: string;
  text?: string;
  html?: string;
  data?: ResendInboundEmail;
  email?: ResendInboundEmail;
};

// Dig into the payload looking for the first non-empty string at any
// of the candidate paths. Returns "" if nothing matches.
function pickString(payload: Record<string, unknown>, paths: string[][]): string {
  for (const path of paths) {
    let cur: unknown = payload;
    for (const key of path) {
      if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[key];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === "string" && cur.trim()) return cur;
    if (cur && typeof cur === "object" && "email" in (cur as Record<string, unknown>)) {
      const e = (cur as { email?: unknown }).email;
      if (typeof e === "string" && e.trim()) return e;
    }
  }
  return "";
}

function pickFrom(payload: InboundPayload): string {
  return pickString(payload as unknown as Record<string, unknown>, [
    ["data", "from"], ["data", "from", "email"],
    ["data", "sender"], ["data", "sender", "email"],
    ["email", "from"], ["from"],
  ]);
}

function pickSubject(payload: InboundPayload): string {
  return pickString(payload as unknown as Record<string, unknown>, [
    ["data", "subject"], ["email", "subject"], ["subject"],
  ]);
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pickBodyText(payload: InboundPayload): string {
  // Try every plausible text field
  const text = pickString(payload as unknown as Record<string, unknown>, [
    ["data", "text"], ["data", "body_text"], ["data", "text_body"],
    ["data", "content_text"], ["data", "plain"],
    ["email", "text"], ["text"], ["body_text"],
  ]);
  if (text) return text;

  // Fall back to HTML → stripped
  const html = pickString(payload as unknown as Record<string, unknown>, [
    ["data", "html"], ["data", "body_html"], ["data", "html_body"],
    ["data", "content_html"], ["data", "content"], ["data", "body"],
    ["email", "html"], ["html"], ["body"],
  ]);
  if (html) return htmlToText(html);

  return "";
}

// Resend inbound webhooks send only metadata. The body must be fetched
// via GET /emails/receiving/{id} using the email_id from the webhook payload.
// Docs: https://resend.com/docs/api-reference/emails/retrieve-received-email
async function fetchInboundEmailContent(
  emailId: string,
  apiKey: string,
): Promise<{ text?: string; html?: string } | null> {
  const url = `https://api.resend.com/emails/receiving/${emailId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[inbound] fetch ${url} → HTTP ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }
    const json = await res.json();
    const text: string | undefined = json.text ?? undefined;
    const html: string | undefined = json.html ?? undefined;
    if (text || html) return { text, html };
    console.warn(`[inbound] ${url} ok but no text/html. keys:`, Object.keys(json));
    return null;
  } catch (e) {
    console.warn(`[inbound] fetch ${url} threw`, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const rawBody = await req.text();

  // Signature verification (Svix format used by Resend webhooks).
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (secret) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing Svix headers" }, { status: 401 });
    }
    if (!verifySvixSignature(rawBody, {
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
    }, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: InboundPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const from = pickFrom(payload);
  const subject = pickSubject(payload);
  let bodyText = pickBodyText(payload);

  // Resend inbound: payload is metadata-only. Fetch the full content
  // via the API using email_id when the body is empty.
  if (!bodyText) {
    const emailId = pickString(payload as unknown as Record<string, unknown>, [
      ["data", "email_id"], ["data", "id"], ["email_id"], ["id"],
    ]);
    const resendKey = process.env.RESEND_API_KEY;
    if (emailId && resendKey) {
      const fetched = await fetchInboundEmailContent(emailId, resendKey);
      if (fetched) {
        bodyText = fetched.text || (fetched.html ? htmlToText(fetched.html) : "");
      }
    }
  }

  if (!bodyText || bodyText.length < 30) {
    // Diagnostic: log the payload structure so we can adjust pickBodyText
    const keys = payload && typeof payload === "object"
      ? Object.keys(payload as object)
      : [];
    const dataKeys = payload && typeof payload === "object" && "data" in payload && payload.data && typeof payload.data === "object"
      ? Object.keys(payload.data as object)
      : [];
    console.warn("[inbound] empty body. Top-level keys:", keys, "data keys:", dataKeys, "bodyText length:", bodyText?.length ?? 0);
    return NextResponse.json({
      error: "Email body too short / empty",
      debug: { topLevelKeys: keys, dataKeys, bodyLength: bodyText?.length ?? 0 },
    }, { status: 400 });
  }

  // 1. Parse format-specific fields
  const parsed = parseInboundEmail({ from, subject, bodyText });

  // 2. Match athlete
  const match = await matchAthlete(admin, {
    names: parsed.athleteNameCandidates,
    emails: parsed.emailCandidates,
  });

  // 3. Create draft row early (so we have a row even if Claude fails)
  const athleteName = match.matched
    ? `${match.matched.firstName} ${match.matched.lastName}`.trim() ||
      (parsed.athleteNameCandidates[0] ?? "Athlète")
    : parsed.athleteNameCandidates[0] ?? "Athlète inconnu";

  const { data: draftRow, error: insertErr } = await admin
    .from("consultation_drafts")
    .insert({
      athlete_id: match.athleteId,
      athlete_match_confidence: match.confidence,
      athlete_match_method: match.method,
      source: parsed.source,
      source_sender: from,
      source_subject: subject,
      raw_email: payload as unknown as object,
      transcript_raw: parsed.transcript,
      replay_url: parsed.replayUrl,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !draftRow) {
    console.error("[inbound] insert draft error", insertErr);
    return NextResponse.json(
      { error: insertErr?.message || "Failed to create draft" },
      { status: 500 },
    );
  }

  const draftId = draftRow.id;

  // 4. Generate CR via Claude (async — but we await it so the coach gets a
  // ready-to-review draft as soon as the notification email arrives)
  const cr = await generateCr({
    athleteName,
    transcript: parsed.transcript,
    replayUrl: parsed.replayUrl,
  });

  if (!cr.ok) {
    const { error: updErr } = await admin
      .from("consultation_drafts")
      .update({
        status: "error",
        ai_error: cr.error,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);
    if (updErr) console.error("[inbound] failed to mark draft as error", updErr);
    return NextResponse.json({ ok: true, draftId, generated: false, error: cr.error });
  }

  const { error: writeErr } = await admin
    .from("consultation_drafts")
    .update({
      cr_title: cr.title,
      cr_html: cr.html,
      ai_model: cr.model,
      ai_tokens_input: cr.tokensInput,
      ai_tokens_output: cr.tokensOutput,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);
  if (writeErr) {
    // Surface the failure on the draft itself so the coach knows what happened
    console.error("[inbound] failed to write CR to draft", writeErr);
    await admin
      .from("consultation_drafts")
      .update({
        status: "error",
        ai_error: `DB write failed: ${writeErr.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);
    return NextResponse.json(
      { ok: false, draftId, generated: true, dbError: writeErr.message },
      { status: 500 },
    );
  }

  // 5. Notify coach (fire-and-forget; failure here shouldn't fail the webhook)
  try {
    const notifyUrl = `${req.nextUrl.origin}/api/notify/draft-ready`;
    await fetch(notifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId,
        athleteName,
        confidence: match.confidence,
        title: cr.title,
      }),
    });
  } catch (e) {
    console.warn("[inbound] coach notification failed", e);
  }

  return NextResponse.json({
    ok: true,
    draftId,
    athleteId: match.athleteId,
    matchConfidence: match.confidence,
    matchMethod: match.method,
    title: cr.title,
  });
}
