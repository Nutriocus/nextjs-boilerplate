// =====================================================================
// Welcome email — sent after first registration (Stripe payment OR
// manual athlete creation by coach). Contains:
//  - personalized welcome
//  - magic link to set password (1st access)
//  - link to fill introduction questionnaire
//  - Calendly link to book the first consultation (MP / PG tiers only)
//  - link to the guided parcours
// =====================================================================

import type { SubscriptionTier } from "./subscription";

const CALENDLY_URL = "https://calendly.com/nutriocus/appel-telephonique-suivi-du-sportif";

const TIER_INFO: Record<SubscriptionTier, { label: string; hasConsult: boolean }> = {
  plateforme: { label: "La plateforme Nutriocus", hasConsult: false },
  progression_guidee: { label: "Progression Guidée", hasConsult: true },
  mission_performance: { label: "Mission Performance", hasConsult: true },
};

export function buildWelcomeEmail(opts: {
  firstName?: string | null;
  email: string;
  tier: SubscriptionTier | null;
  magicLink: string;
  platformUrl: string;
  coachName: string;
}): { subject: string; html: string; text: string } {
  const { firstName, tier, magicLink, platformUrl, coachName } = opts;
  const info = (tier && TIER_INFO[tier]) || TIER_INFO.mission_performance;
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const subject = `🎉 Bienvenue dans ${info.label} — Nutriocus`;

  const stepConsult = info.hasConsult
    ? `

🗓 RÉSERVE TA PREMIÈRE CONSULTATION
Une fois ton questionnaire complété, choisis ton créneau pour notre premier appel :
${CALENDLY_URL}`
    : "";

  const text = `${greeting}

Bienvenue dans ${info.label} — j'ai hâte de t'accompagner dans ta nutrition de performance.

Voici tes 3 premières étapes pour bien démarrer :

📝 ÉTAPE 1 — CRÉE TON MOT DE PASSE & ACCÈDE À LA PLATEFORME
Clique sur ce lien pour définir ton mot de passe et te connecter pour la première fois :
${magicLink}

🩺 ÉTAPE 2 — REMPLIS LE QUESTIONNAIRE D'INTRODUCTION
Une fois connecté, rendez-vous dans "Mon profil" puis onglet "Questionnaire d'introduction".
C'est ce qui me permettra de préparer ta première consultation efficacement.
${stepConsult}

🗺 ÉTAPE 4 — SUIS TON PARCOURS GUIDÉ
La plateforme te propose un parcours structuré en 4 phases. Avance à ton rythme :
${platformUrl}/athlete/parcours

À très vite,
${coachName}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0; padding:0; background-color:#f4f4f2; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f2; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#0a0a0a; padding:28px 28px; color:#ffffff;">
                <div style="font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:#9a9a98; margin-bottom:6px;">Bienvenue chez Nutriocus</div>
                <div style="font-size:24px; font-weight:800; letter-spacing:-0.01em;">🎉 ${info.label}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 16px;">${greeting}</p>
                <p style="font-size:15px; color:#0a0a0a; line-height:1.55; margin:0 0 24px;">
                  Bienvenue dans <strong>${info.label}</strong> — j'ai hâte de t'accompagner
                  dans ta nutrition de performance. Voici tes premières étapes pour bien démarrer.
                </p>

                <!-- Step 1: Set password -->
                <div style="border-left:4px solid #FF4501; background:#fafaf8; border-radius:8px; padding:16px 18px; margin:0 0 16px;">
                  <div style="font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#FF4501; font-weight:800; margin-bottom:4px;">Étape 1</div>
                  <div style="font-size:16px; font-weight:800; color:#0a0a0a; margin-bottom:6px;">📝 Crée ton mot de passe & accède à la plateforme</div>
                  <p style="font-size:13px; color:#0a0a0a; line-height:1.5; margin:0 0 12px;">
                    Clique sur le bouton ci-dessous pour définir ton mot de passe et te connecter pour la première fois.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#FF4501; border-radius:8px;">
                        <a href="${magicLink}" style="display:inline-block; padding:12px 22px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px;">
                          Activer mon compte →
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Step 2: Questionnaire -->
                <div style="border-left:4px solid #0a0a0a; background:#fafaf8; border-radius:8px; padding:16px 18px; margin:0 0 16px;">
                  <div style="font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#0a0a0a; font-weight:800; margin-bottom:4px;">Étape 2</div>
                  <div style="font-size:16px; font-weight:800; color:#0a0a0a; margin-bottom:6px;">🩺 Remplis le questionnaire d'introduction</div>
                  <p style="font-size:13px; color:#0a0a0a; line-height:1.5; margin:0;">
                    Une fois connecté, va dans <strong>Mon profil</strong> → onglet <strong>Questionnaire d'introduction</strong>.
                    C'est ce qui me permettra de préparer ${info.hasConsult ? "ta première consultation" : "tes recommandations personnalisées"} efficacement.
                  </p>
                </div>

                ${
                  info.hasConsult
                    ? `
                <!-- Step 3: Book consultation -->
                <div style="border-left:4px solid #5f8c0a; background:#fafaf8; border-radius:8px; padding:16px 18px; margin:0 0 16px;">
                  <div style="font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#5f8c0a; font-weight:800; margin-bottom:4px;">Étape 3</div>
                  <div style="font-size:16px; font-weight:800; color:#0a0a0a; margin-bottom:6px;">🗓 Réserve ta première consultation</div>
                  <p style="font-size:13px; color:#0a0a0a; line-height:1.5; margin:0 0 12px;">
                    Une fois ton questionnaire complété, choisis ton créneau pour notre premier appel.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#5f8c0a; border-radius:8px;">
                        <a href="${CALENDLY_URL}" style="display:inline-block; padding:10px 18px; color:#ffffff; text-decoration:none; font-weight:700; font-size:13px;">
                          Réserver mon créneau →
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
                `
                    : ""
                }

                <!-- Step 4: Parcours -->
                <div style="border-left:4px solid #b36b00; background:#fafaf8; border-radius:8px; padding:16px 18px; margin:0 0 24px;">
                  <div style="font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#b36b00; font-weight:800; margin-bottom:4px;">${info.hasConsult ? "Étape 4" : "Étape 3"}</div>
                  <div style="font-size:16px; font-weight:800; color:#0a0a0a; margin-bottom:6px;">🗺 Suis ton parcours guidé</div>
                  <p style="font-size:13px; color:#0a0a0a; line-height:1.5; margin:0;">
                    La plateforme te propose un <strong>parcours structuré en 4 phases</strong> pour te guider pas-à-pas :
                    te connaître, te diagnostiquer, construire tes plans, piloter ta progression.
                    Tu peux y accéder à tout moment depuis ton tableau de bord.
                  </p>
                </div>

                <p style="font-size:14px; color:#0a0a0a; line-height:1.55; margin:0;">
                  À très vite,<br />
                  <strong>${coachName}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafaf8; padding:14px 28px; border-top:1px solid #e6e6e3; color:#9a9a98; font-size:11px;">
                Tu as une question ? Réponds simplement à ce mail.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

export async function sendWelcomeEmail(opts: {
  firstName?: string | null;
  email: string;
  tier: SubscriptionTier | null;
  magicLink: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: "RESEND_API_KEY missing" };

  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "noreply@nutriocus.com";
  const fromName = process.env.NOTIFY_FROM_NAME || "NUTRIOCUS";
  const coachName =
    process.env.NOTIFY_COACH_NAME ||
    "Florian Mouchel — Diététicien du sport, fondateur de Nutriocus";
  const platformUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com";

  const { subject, html, text } = buildWelcomeEmail({
    ...opts,
    platformUrl,
    coachName,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [opts.email],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: `Resend (${res.status}): ${errText}` };
  }
  return { ok: true };
}
