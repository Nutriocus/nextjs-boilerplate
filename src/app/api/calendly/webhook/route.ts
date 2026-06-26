import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// =====================================================================
// POST /api/calendly/webhook
// Receives Calendly events (invitee.created / invitee.canceled).
// Stores them in the calendly_bookings table so the BookingSection
// can show real-time remaining quota.
//
// Signature verification: HMAC-SHA256 of the raw body using CALENDLY_WEBHOOK_SIGNING_KEY.
// Header: Calendly-Webhook-Signature: t=<timestamp>,v1=<signature>
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CalendlyInvitee = {
  uri: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  tracking?: {
    utm_content?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
  };
};

type CalendlyEventResource = {
  uri: string;
  name?: string;
  start_time: string;
  end_time?: string;
};

type CalendlyPayload = {
  event: "invitee.created" | "invitee.canceled";
  payload: CalendlyInvitee & {
    event?: CalendlyEventResource | string;
    scheduled_event?: CalendlyEventResource;
  };
};

function verifyCalendlySignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts = header.split(",").map((p) => p.trim());
    const t = parts.find((p) => p.startsWith("t="))?.slice(2);
    const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
    if (!t || !v1) return false;
    const signedPayload = `${t}.${rawBody}`;
    const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const rawBody = await req.text();

  // Verify signature if signing key is configured
  if (signingKey) {
    const sigHeader = req.headers.get("calendly-webhook-signature");
    if (!sigHeader || !verifyCalendlySignature(rawBody, sigHeader, signingKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: CalendlyPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const invitee = body.payload;
    const eventResource = (invitee.scheduled_event ?? null) as CalendlyEventResource | null;
    const eventUri = eventResource?.uri ?? (typeof invitee.event === "string" ? invitee.event : "");
    const eventName = eventResource?.name ?? "Consultation Nutriocus";
    const scheduledAt = eventResource?.start_time;
    const inviteeEmail = (invitee.email ?? "").toLowerCase();
    const inviteeUri = invitee.uri;
    const utmContent = invitee.tracking?.utm_content ?? null;

    if (!eventUri || !inviteeUri) {
      return NextResponse.json({ error: "Missing event/invitee URI in payload" }, { status: 400 });
    }

    // Match athlete: prefer utm_content (UUID), fallback to email
    let athleteId: string | null = null;
    if (utmContent && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(utmContent)) {
      const { data } = await admin.from("athletes").select("id").eq("id", utmContent).maybeSingle();
      if (data) athleteId = data.id;
    }
    if (!athleteId && inviteeEmail) {
      const { data } = await admin.from("athletes").select("id").eq("email", inviteeEmail).maybeSingle();
      if (data) athleteId = data.id;
    }

    if (body.event === "invitee.created") {
      if (!scheduledAt) {
        return NextResponse.json({ error: "Missing scheduled_at" }, { status: 400 });
      }
      const { error: upErr } = await admin
        .from("calendly_bookings")
        .upsert(
          {
            athlete_id: athleteId,
            athlete_email: inviteeEmail,
            calendly_event_uri: eventUri,
            invitee_uri: inviteeUri,
            event_name: eventName,
            scheduled_at: scheduledAt,
            status: "booked",
            utm_content: utmContent,
            raw: body as unknown as object,
          },
          { onConflict: "invitee_uri" },
        );
      if (upErr) {
        console.error("[calendly] insert error", upErr);
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    } else if (body.event === "invitee.canceled") {
      const { error: upErr } = await admin
        .from("calendly_bookings")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("invitee_uri", inviteeUri);
      if (upErr) {
        console.error("[calendly] cancel update error", upErr);
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[calendly webhook] unexpected", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
