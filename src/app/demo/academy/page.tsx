"use client";

import { DEMO_CTA_URL } from "@/lib/demo-context";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DemoAcademyLocked() {
  return (
    <div>
      <PageHeader
        kicker="Mon accompagnement"
        title="Académie Nutriocus"
        desc="Formations vidéo réservées aux athlètes accompagnés."
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
          Accès réservé aux athlètes Mission Performance
        </h2>
        <p
          style={{
            maxWidth: 560,
            margin: "0 auto 24px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
          }}
        >
          L&apos;Académie Nutriocus contient l&apos;ensemble des <b>formations vidéo
          exclusives</b> : nutrition à l&apos;effort, stratégies de course,
          récupération, optimisations spécifiques par discipline.
          <br />
          <br />
          C&apos;est l&apos;une des briques clés de l&apos;accompagnement Mission Performance,
          accessible <b>uniquement aux athlètes coachés</b>.
        </p>

        <a
          href={DEMO_CTA_URL}
          target="_blank"
          rel="noopener noreferrer"
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
