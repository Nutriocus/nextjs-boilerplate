// =====================================================================
// CR generator — uses the official Anthropic SDK with streaming so long
// transcripts don't hit Vercel function timeouts (raw fetch + non-streaming
// caused silent empty drafts: insert succeeded then function died mid-call,
// the cr_html update never ran, draft stayed pending with no error).
// =====================================================================

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Tu es Florian Mouchel, diététicien du sport spécialisé dans les sports d'endurance (trail, ultra-trail, triathlon, cyclisme, course sur route), fondateur de Nutriocus. Tu accompagnes 250+ athlètes avec une approche nutritionnelle scientifique et bienveillante.

À partir de la transcription d'une consultation, tu produis un compte rendu structuré et exhaustif qui sera envoyé à l'athlète via la plateforme Nutriocus.

RÈGLES STRICTES :

1. **Sortie : HTML uniquement** (compatible TipTap : <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td>). Pas de <html>, <head>, <body>, <style>. Pas de markdown.

2. **Structure obligatoire** (adapte les sections selon la consultation, omets les sections non abordées) :
   - <h2>🎯 Synthèse</h2> — 2-3 phrases qui résument l'essentiel
   - <h2>📊 Bilan</h2> — retour sur la période écoulée (sensations, mesures, adaptations)
   - Sections thématiques en <h2> avec emoji selon les sujets abordés : 🦵 Blessures/douleurs, 💊 Supplémentation, 🥤 Tests de produits, 🏃‍♀️ Stratégie de course, 🍽 Pré-course, 🛌 Post-course / récupération, 🧠 Mental, etc.
   - <h2>✅ Actions à mener</h2> — checklist concrète (<ul> avec items actionnables)
   - <h2>📅 Prochaine consultation</h2> — date + heure si évoquées

3. **Ton** : tutoiement (Florian tutoie ses athlètes), professionnel mais chaleureux. Reprends le prénom de l'athlète une fois en intro et en clôture, mais évite les "comme tu sais" / "comme on a dit".

4. **Précision** : reprends les chiffres exacts mentionnés dans la consultation (grammes de glucides, ml d'hydratation, dosages, températures, distances, etc.). Quand un produit est validé/écarté, dis-le clairement avec la raison.

5. **Tableaux** : utilise <table> pour les comparatifs (validation de produits testés, inventaire course, ravitos, supplémentation). Les tableaux doivent avoir <thead><tr><th>...</th></tr></thead><tbody>...</tbody>.

6. **Liens** : si une URL de replay vidéo est fournie, intègre-la dans une section dédiée en HTML : <p>🎥 <strong>Replay :</strong> <a href="URL">Revoir la consultation</a></p>

7. **Concision intelligente** : ne reformule pas tout le verbatim. Garde ce qui a une valeur pour l'athlète (décisions, conseils, dosages, plan d'action). Élimine les hésitations, redites, off-topics.

8. **Signature** : termine TOUJOURS par un mot de motivation court (1 phrase) puis :
   <p>— <strong>Florian Mouchel</strong><br>Diététicien du sport, fondateur de Nutriocus</p>

9. **Titre OBLIGATOIRE** : le tout premier élément doit être un <h1> court et descriptif de la consultation (ex: "Préparation course 30 km — La Réunion" ou "Bilan suivi M+2 + ajustement supplémentation"). Ce titre sera réutilisé comme titre de la consultation dans la plateforme. Ne JAMAIS commencer par un <h2> ou un paragraphe.

EXEMPLE DE DÉBUT ATTENDU :
<h1>Préparation course 30 km — La Réunion</h1>
<h2>🎯 Synthèse</h2>
<p>Retour positif sur l'adaptation aux nouveaux apports...</p>`;

const USER_PROMPT_TEMPLATE = `Voici la transcription brute de ma consultation avec {{ATHLETE_NAME}}{{REPLAY_HINT}}.

Génère le compte rendu HTML en respectant scrupuleusement les règles du système. RAPPEL : commence par un <h1> avec un titre court et descriptif.

---
{{TRANSCRIPT}}
---`;

export type CrGenerationResult =
  | {
      ok: true;
      html: string;
      title: string;
      model: string;
      tokensInput: number;
      tokensOutput: number;
    }
  | { ok: false; error: string };

/**
 * Generate a structured CR from a raw consultation transcript.
 * Streams the response so long transcripts don't hit Vercel function timeouts.
 */
export async function generateCr(input: {
  athleteName: string;
  transcript: string;
  replayUrl?: string | null;
}): Promise<CrGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not configured" };

  const client = new Anthropic({ apiKey });

  const replayHint = input.replayUrl
    ? ` (URL du replay disponible : ${input.replayUrl})`
    : "";

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{{ATHLETE_NAME}}", input.athleteName)
    .replace("{{REPLAY_HINT}}", replayHint)
    .replace("{{TRANSCRIPT}}", input.transcript.slice(0, 200_000));

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const final = await stream.finalMessage();

    if (final.stop_reason === "refusal") {
      return { ok: false, error: "Claude a refusé la requête (raison de sécurité)" };
    }

    const html = final.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();

    if (!html) {
      return {
        ok: false,
        error: `Empty response from Claude (stop_reason=${final.stop_reason})`,
      };
    }

    if (final.stop_reason === "max_tokens") {
      console.warn(
        "[cr-generator] max_tokens reached — CR may be truncated. Output:",
        html.length,
        "chars",
      );
    }

    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
      : "Consultation de suivi";

    return {
      ok: true,
      html,
      title,
      model: MODEL,
      tokensInput: final.usage.input_tokens ?? 0,
      tokensOutput: final.usage.output_tokens ?? 0,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return { ok: false, error: `Claude API call failed: ${msg}` };
  }
}
