import { NextRequest, NextResponse } from "next/server";

// =====================================================================
// POST /api/notify/draft-ready
// Called by the inbound webhook after a draft CR has been generated.
// Sends an email to the coach with a deep-link to the review UI.
//
// Body: { draftId, athleteName, confidence, title }
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COACH_EMAIL = process.env.NOTIFY_COACH_EMAIL || "nutriocus@gmail.com";
const FROM_ADDR = process.env.NOTIFY_FROM_EMAIL || "Nutriocus <noreply@plateforme.nutriocus.com>";

function confidenceBadge(score: number): { label: string; color: string } {
  if (score >= 0.95) return { label: "Match excellent", color: "#5f8c0a" };
  if (score >= 0.85) return { label: "Match fiable", color: "#5f8c0a" };
  if (score >= 0.7) return { label: "Match probable", color: "#e6a833" };
  if (score > 0) return { label: "Match incertain — vérifier", color: "#cf2e2e" };
  return { label: "Athlète non identifié", color: "#cf2e2e" };
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
  }

  let body: {
    draftId?: string;
    athleteName?: string;
    confidence?: number;
    title?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.draftId) {
    return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
  }

  const reviewUrl = `https://plateforme.nutriocus.com/coach/drafts/${body.draftId}`;
  const badge = confidenceBadge(body.confidence ?? 0);
  const athleteName = body.athleteName || "Athlète";
  const title = body.title || "Nouvelle consultation";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#0a0a0a">
      <div style="background:#0a0a0a;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#FF4501;font-weight:800">
          📋 Nouveau CR généré
        </div>
        <div style="font-size:22px;font-weight:800;margin-top:6px">${title}</div>
      </div>
      <div style="background:#fff;padding:22px;border:1px solid #e6e6e3;border-top:none;border-radius:0 0 10px 10px">
        <p style="margin:0 0 14px;font-size:15px">
          Un compte rendu a été automatiquement généré à partir du dernier email de transcription reçu.
        </p>
        <div style="background:#f7f7f5;padding:14px 16px;border-radius:8px;margin-bottom:18px">
          <div style="font-size:12px;color:#787876;text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:4px">
            Athlète détecté
          </div>
          <div style="font-size:17px;font-weight:800;margin-bottom:8px">${athleteName}</div>
          <span style="display:inline-block;background:${badge.color};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700">
            ${badge.label}
          </span>
        </div>
        <a href="${reviewUrl}"
           style="display:inline-block;background:#FF4501;color:#fff;text-decoration:none;padding:14px 28px;font-weight:800;border-radius:8px;font-size:15px">
          📝 Relire et publier
        </a>
        <p style="margin:20px 0 0;font-size:12px;color:#787876;line-height:1.5">
          Le brouillon n'est pas encore visible côté athlète. Tu peux le relire,
          l'éditer, et le publier d'un clic depuis l'interface coach. Si l'athlète
          détecté n'est pas le bon, tu pourras le réassigner manuellement.
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDR,
        to: [COACH_EMAIL],
        subject: `📋 CR à valider — ${athleteName}`,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Resend ${res.status}: ${errText}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
