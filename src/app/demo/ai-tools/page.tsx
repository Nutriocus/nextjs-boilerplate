"use client";

import { DEMO_CTA_URL } from "@/lib/demo-context";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DemoAiToolsLocked() {
  return (
    <div>
      <PageHeader
        kicker="Nutrition à l'effort & outils"
        title="Outils IA Nutriocus"
        desc="Tes GPT spécialisés pour préparation de course, analyse, stratégie pacing, et plus."
      />

      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "48px 24px",
          borderLeft: "5px solid var(--color-primary)",
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}
        >
          Outils IA réservés aux athlètes Mission Performance
        </h2>
        <p
          style={{
            maxWidth: 580,
            margin: "0 auto 24px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
          }}
        >
          Les <b>GPT propriétaires Nutriocus</b> couvrent toute ta préparation :
          diététicien de poche, stratégie de pacing trail, analyse post-course,
          prédicteur de mur énergétique, analyse durabilité, risque neuromusculaire…
          <br />
          <br />
          C&apos;est un outil <b>exclusif</b> aux athlètes accompagnés en Mission
          Performance, intégré à ton suivi personnalisé.
        </p>

        <a
          href={DEMO_CTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-allow-demo="1"
          className="btn-primary"
          style={{ fontSize: 14, padding: "12px 24px" }}
        >
          📅 Réserver un appel pour rejoindre Mission Performance
        </a>

        <div
          style={{
            marginTop: 32,
            fontSize: 12,
            color: "var(--color-text-muted)",
          }}
        >
          Tu peux continuer à explorer tous les autres modules en mode démo.
        </div>
      </div>
    </div>
  );
}
