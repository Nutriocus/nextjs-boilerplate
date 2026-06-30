import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// GET /api/cron/race-analysis-reminder
// Daily cron. For each athlete whose race was YESTERDAY (J+1 morning),
// send an email inviting them to do their post-race analysis with the
// "Nutriocus Analyse de ta course" custom GPT, then log the bilan on
// the platform.
//
// Idempotent: each sent reminder is stored in athlete_data under key
// "race_reminders_sent" so the cron can re-run without duplicate emails.
// Schedule via vercel.json (e.g. "0 8 * * *" = 8h UTC daily).
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || "noreply@nutriocus.com";
const FROM_NAME = process.env.NOTIFY_FROM_NAME || "NUTRIOCUS";
const PLATFORM_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";
const COACH_NAME =
  process.env.NOTIFY_COACH_NAME ||
  "Florian Mouchel — Diététicien du sport, fondateur de Nutriocus";
const GPT_URL =
  "https://chatgpt.com/g/g-68f786ada7b08191a9e0be41fd614f02-nutriocus-analyse-de-ta-course";

type EventItem = { id?: string; date: string; name: string };
type SentMap = Record<string, string>; // raceKey -> ISO timestamp

// Returns YYYY-MM-DD for the given date in Europe/Paris.
function parisDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function yesterdayParis(): string {
  const now = new Date();
  const todayParis = parisDate(now);
  const [y, m, d] = todayParis.split("-").map(Number);
  const todayUtc = Date.UTC(y, m - 1, d);
  return parisDate(new Date(todayUtc - 86400000));
}

function raceKey(e: EventItem): string {
  return `${e.date}__${(e.name || "").trim().toLowerCase()}`;
}

function formatFrLong(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildEmail(input: {
  firstName: string;
  raceName: string;
  raceDate: string;
}) {
  const subject = `🏁 Bravo pour ta course « ${input.raceName} » — fais ton analyse post-course`;
  const dateLong = formatFrLong(input.raceDate);

  const text = `Bonjour ${input.firstName || ""},

Bravo pour ta course « ${input.raceName} » du ${dateLong} !

Pour transformer cette expérience en enseignements concrets et progresser sur tes prochaines courses, je t'invite à faire ton analyse post-course :

1. Ouvre le GPT « Nutriocus Analyse de ta course » :
${GPT_URL}

2. Réponds à ses questions sur ton ressenti, ta nutrition, ton hydratation, tes points forts et tes axes d'amélioration.

3. Reporte ensuite la synthèse dans ton bilan sur la plateforme pour la garder course après course :
${PLATFORM_URL}/athlete/race-analysis

Sans analyse structurée, on perd les enseignements et on refait les mêmes erreurs. Quelques minutes maintenant, des courses meilleures plus tard.

Bonne récupération,
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
                <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a98; margin-bottom:4px;">Apprendre de tes courses</div>
                <div style="font-size:22px; font-weight:800; letter-spacing:-0.01em;">🏁 Bravo — place à l'analyse !</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 16px;">Bonjour ${input.firstName || ""},</p>
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 14px;">
                  Bravo pour ta course <strong>« ${input.raceName} »</strong> du <strong>${dateLong}</strong> !
                </p>
                <p style="font-size:14px; color:#0a0a0a; line-height:1.55; margin:0 0 18px;">
                  Pour transformer cette expérience en enseignements concrets et progresser sur tes prochaines courses, je t'invite à faire ton <strong>analyse post-course</strong>.
                </p>

                <div style="background:#fafaf8; border-left:4px solid #FF4501; border-radius:8px; padding:14px 16px; margin:0 0 20px;">
                  <div style="font-size:13px; color:#0a0a0a; line-height:1.6;">
                    <strong>Étape 1</strong> — Ouvre le GPT « Nutriocus Analyse de ta course ».<br>
                    <strong>Étape 2</strong> — Réponds aux questions (ressenti, nutrition, hydratation, points forts, axes d'amélioration).<br>
                    <strong>Étape 3</strong> — Reporte la synthèse dans ton bilan sur la plateforme.
                  </div>
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                  <tr>
                    <td style="background:#d0ff2c; border-radius:8px;">
                      <a href="${GPT_URL}" style="display:inline-block; padding:12px 22px; color:#0a0a0a; text-decoration:none; font-weight:700; font-size:14px;">
                        Ouvrir le GPT — Analyse de ta course ↗
                      </a>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#FF4501; border-radius:8px;">
                      <a href="${PLATFORM_URL}/athlete/race-analysis" style="display:inline-block; padding:12px 22px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                        Ouvrir mon bilan post-course →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px; color:#787876; line-height:1.55; margin:24px 0 0;">
                  Sans analyse structurée, on perd les enseignements et on refait les mêmes erreurs. Quelques minutes maintenant, des courses meilleures plus tard.
                </p>
                <p style="font-size:13px; color:#787876; line-height:1.55; margin:18px 0 0;">
                  Bonne récupération,<br />
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

  return { subject, text, html };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  // ---- Test mode: ?test=1&email=foo@bar.com[&name=Florian][&race=My%20race][&date=2026-06-29]
  // Sends one sample email using the real template. Does NOT touch the DB.
  const { searchParams } = new URL(req.url);
  if (searchParams.get("test") === "1") {
    const to = searchParams.get("email");
    if (!to) {
      return NextResponse.json({ error: "Missing ?email=" }, { status: 400 });
    }
    const firstName = searchParams.get("name") || "Florian";
    const raceName = searchParams.get("race") || "Test Trail des Volcans 42K";
    const raceDate = searchParams.get("date") || yesterdayParis();
    const email = buildEmail({ firstName, raceName, raceDate });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `[TEST] ${email.subject}`,
        html: email.html,
        text: email.text,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return NextResponse.json(
        { error: `Resend ${resendRes.status}: ${errText}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, mode: "test", to, raceName, raceDate });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const targetDate = yesterdayParis();
  const result = {
    targetDate,
    candidates: 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // 1. Get all athlete_data rows with key="events"
  const { data: rows, error: rowsErr } = await admin
    .from("athlete_data")
    .select("athlete_id, data")
    .eq("key", "events");

  if (rowsErr) {
    return NextResponse.json({ error: `events fetch: ${rowsErr.message}` }, { status: 500 });
  }

  // 2. For each athlete, find events with date === yesterday
  for (const row of rows ?? []) {
    const events = (row.data as EventItem[]) ?? [];
    const matches = events.filter((e) => e && e.date === targetDate);
    if (matches.length === 0) continue;

    result.candidates += matches.length;

    // Load athlete + already-sent reminders in parallel
    const [{ data: athlete }, { data: sentRow }] = await Promise.all([
      admin
        .from("athletes")
        .select("email, first_name")
        .eq("id", row.athlete_id)
        .maybeSingle(),
      admin
        .from("athlete_data")
        .select("data")
        .eq("athlete_id", row.athlete_id)
        .eq("key", "race_reminders_sent")
        .maybeSingle(),
    ]);

    if (!athlete?.email) {
      result.errors.push(`${row.athlete_id}: no email`);
      continue;
    }

    const sent: SentMap = (sentRow?.data as SentMap) ?? {};

    for (const race of matches) {
      const key = raceKey(race);
      if (sent[key]) {
        result.skipped += 1;
        continue;
      }

      const email = buildEmail({
        firstName: athlete.first_name || "",
        raceName: race.name || "ta course",
        raceDate: race.date,
      });

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [athlete.email],
            subject: email.subject,
            html: email.html,
            text: email.text,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          result.errors.push(`${athlete.email} ${race.name}: resend ${resendRes.status} ${errText}`);
          continue;
        }

        sent[key] = new Date().toISOString();
        result.sent += 1;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown";
        result.errors.push(`${athlete.email} ${race.name}: ${msg}`);
      }
    }

    // Persist updated sent map for this athlete
    const { error: upErr } = await admin
      .from("athlete_data")
      .upsert({ athlete_id: row.athlete_id, key: "race_reminders_sent", data: sent });
    if (upErr) {
      result.errors.push(`persist sent ${row.athlete_id}: ${upErr.message}`);
    }
  }

  return NextResponse.json(result);
}
