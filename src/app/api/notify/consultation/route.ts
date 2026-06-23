import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/notify/consultation
// Body: { athleteId, consultationType, consultationDate }
// Sends an email to the athlete notifying them that a new consultation
// report is available on the platform.
//
// Auth: caller must be a logged-in coach (verified via Supabase token).
// Email sent via Resend API (uses RESEND_API_KEY env var).
// =====================================================================

export const runtime = "nodejs";

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || "noreply@nutriocus.com";
const FROM_NAME = process.env.NOTIFY_FROM_NAME || "NUTRIOCUS";
const PLATFORM_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!url || !anonKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured on Vercel" }, { status: 500 });
    }

    // Verify caller is a coach
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }
    const userToken = authHeader.slice(7);
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: coach } = await userClient
      .from("coaches")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!coach) {
      return NextResponse.json({ error: "Réservé aux coachs" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const { athleteId, consultationType, consultationDate } = body as {
      athleteId?: string;
      consultationType?: string;
      consultationDate?: string;
    };
    if (!athleteId) {
      return NextResponse.json({ error: "athleteId requis" }, { status: 400 });
    }

    // Fetch athlete email + first_name
    const { data: athlete } = await userClient
      .from("athletes")
      .select("email, first_name")
      .eq("id", athleteId)
      .maybeSingle();
    if (!athlete?.email) {
      return NextResponse.json({ error: "Athlète sans email" }, { status: 404 });
    }

    const coachName = `${coach.first_name ?? ""} ${coach.last_name ?? ""}`.trim() || "Ton coach Nutriocus";
    const dateLong = consultationDate
      ? new Date(consultationDate + "T00:00:00").toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "récemment";

    const subject = `📋 Nouveau compte rendu disponible — Nutriocus`;
    const text = `Bonjour ${athlete.first_name || ""},

Ton compte rendu de consultation ${consultationType ? `« ${consultationType} »` : ""} du ${dateLong} est désormais disponible sur ta plateforme Nutriocus.

Tu peux le consulter, le télécharger en PDF et échanger sur les points clés directement depuis l'espace consultations :
${PLATFORM_URL}/athlete/consultations

À très vite,
${coachName}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0; padding:0; background-color:#f4f4f2; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f2; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#0a0a0a; padding:24px 28px; color:#ffffff;">
                <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a98; margin-bottom:4px;">Espace consultations</div>
                <div style="font-size:22px; font-weight:800; letter-spacing:-0.01em;">📋 Nouveau compte rendu disponible</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 16px;">Bonjour ${athlete.first_name || ""},</p>
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 16px;">
                  Ton compte rendu ${consultationType ? `<strong>« ${consultationType} »</strong>` : ""}
                  du <strong>${dateLong}</strong> est désormais disponible sur ta plateforme Nutriocus.
                </p>
                <p style="font-size:14px; color:#787876; line-height:1.55; margin:0 0 24px;">
                  Tu peux le consulter, le télécharger en PDF et échanger sur les points clés directement depuis l'espace consultations.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#FF4501; border-radius:8px;">
                      <a href="${PLATFORM_URL}/athlete/consultations" style="display:inline-block; padding:12px 22px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                        Ouvrir mes consultations →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px; color:#787876; line-height:1.55; margin:24px 0 0;">
                  À très vite,<br />
                  <strong>${coachName}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafaf8; padding:14px 28px; border-top:1px solid #e6e6e3; color:#9a9a98; font-size:11px;">
                Email automatique de la plateforme Nutriocus · Pour toute question, réponds à ce mail.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    // Send via Resend HTTP API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [athlete.email],
        subject,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("[notify consultation] Resend error:", errText);
      return NextResponse.json({ error: `Resend: ${errText}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
