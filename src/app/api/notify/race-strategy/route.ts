import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/notify/race-strategy
// Body: { athleteId, planName, raceDate?, discipline?, km?, dplus?, objectif? }
// Sends an email to the athlete telling them a race strategy is ready
// on the platform.
//
// Auth: caller must be a logged-in coach.
// Email sent via Resend API (RESEND_API_KEY env var).
// =====================================================================

export const runtime = "nodejs";

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || "noreply@nutriocus.com";
const FROM_NAME = process.env.NOTIFY_FROM_NAME || "NUTRIOCUS";
const PLATFORM_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";
const COACH_NAME =
  process.env.NOTIFY_COACH_NAME ||
  "Florian Mouchel — Diététicien du sport, fondateur de Nutriocus";

const DISCIPLINE_LABEL: Record<string, string> = {
  course: "Course à pied",
  trail: "Trail",
  cyclisme: "Cyclisme",
  triathlon: "Triathlon",
};

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured on Vercel" }, { status: 500 });
    }

    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const userToken = authHeader.slice(7);
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: `Unauthorized: ${userErr?.message ?? "no user"}` }, { status: 401 });
    }

    // 2. Service-role admin client
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Verify caller is a coach
    const { data: coach, error: coachErr } = await admin
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (coachErr) {
      return NextResponse.json({ error: `Coach lookup: ${coachErr.message}` }, { status: 500 });
    }
    if (!coach) {
      return NextResponse.json(
        { error: `Réservé aux coachs (user_id=${user.id}).` },
        { status: 403 },
      );
    }

    // 4. Parse + fetch athlete
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const { athleteId, planName, raceDate, discipline, km, dplus, objectif } = body as {
      athleteId?: string;
      planName?: string;
      raceDate?: string;
      discipline?: string;
      km?: string | number;
      dplus?: string | number;
      objectif?: string;
    };
    if (!athleteId) {
      return NextResponse.json({ error: "athleteId requis" }, { status: 400 });
    }
    const { data: athlete } = await admin
      .from("athletes")
      .select("email, first_name")
      .eq("id", athleteId)
      .maybeSingle();
    if (!athlete?.email) {
      return NextResponse.json({ error: "Athlète sans email" }, { status: 404 });
    }

    // 5. Compose email
    const discLabel = discipline ? DISCIPLINE_LABEL[discipline] || discipline : null;
    const dateLong = raceDate
      ? new Date(raceDate + "T00:00:00").toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

    const metaParts: string[] = [];
    if (discLabel) metaParts.push(discLabel);
    if (km) metaParts.push(`${km} km`);
    if (dplus) metaParts.push(`${dplus} m D+`);
    if (objectif) metaParts.push(`objectif ${objectif}`);
    const meta = metaParts.join(" · ");

    const subject = `🎯 Ta stratégie de course « ${planName ?? "ta course"} » est prête — Nutriocus`;

    const text = `Bonjour ${athlete.first_name || ""},

Ta stratégie de course pour ${planName ? `« ${planName} »` : "ta prochaine course"} ${dateLong ? `(${dateLong})` : ""} est désormais disponible sur ta plateforme Nutriocus.

${meta ? meta + "\n\n" : ""}Tu peux la consulter, télécharger le PDF prêt à imprimer pour ton sac de course, et l'ajuster si besoin depuis l'espace Stratégie de course :
${PLATFORM_URL}/athlete/race-strategy

Bonne préparation,
${COACH_NAME}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0; padding:0; background-color:#f4f4f2; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f2; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#0a0a0a; padding:24px 28px; color:#ffffff;">
                <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a98; margin-bottom:4px;">Anticiper tes courses</div>
                <div style="font-size:22px; font-weight:800; letter-spacing:-0.01em;">🎯 Ta stratégie de course est prête</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 16px;">Bonjour ${athlete.first_name || ""},</p>
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 14px;">
                  Ta stratégie de course pour ${planName ? `<strong>« ${planName} »</strong>` : "ta prochaine course"}
                  ${dateLong ? ` du <strong>${dateLong}</strong>` : ""} est désormais disponible sur ta plateforme Nutriocus.
                </p>
                ${meta ? `<div style="background:#fafaf8; border-left:4px solid #FF4501; border-radius:8px; padding:10px 14px; font-size:13px; color:#0a0a0a; margin:0 0 16px;">${meta}</div>` : ""}
                <p style="font-size:14px; color:#787876; line-height:1.55; margin:0 0 24px;">
                  Tu peux la consulter, télécharger le <strong>PDF prêt à imprimer</strong> pour ton sac de course, et l'ajuster si besoin.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#FF4501; border-radius:8px;">
                      <a href="${PLATFORM_URL}/athlete/race-strategy" style="display:inline-block; padding:12px 22px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                        Ouvrir ma stratégie de course →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px; color:#787876; line-height:1.55; margin:24px 0 0;">
                  Bonne préparation,<br />
                  <strong>${COACH_NAME}</strong>
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

    // 6. Send via Resend
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
      console.error("[notify race-strategy] Resend error:", resendRes.status, errText);
      return NextResponse.json({ error: `Resend (${resendRes.status}): ${errText}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[notify race-strategy] unexpected", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
