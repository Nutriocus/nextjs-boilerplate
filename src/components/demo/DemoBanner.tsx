"use client";

import { DEMO_CTA_URL } from "@/lib/demo-context";

export function DemoBanner() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: "var(--color-primary)",
        color: "#fff",
        padding: "9px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: "0 2px 12px rgba(255, 69, 1, 0.25)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      <span>
        🎬{" "}
        <span style={{ opacity: 0.95 }}>
          Mode démo — aperçu en lecture seule
        </span>
      </span>
      <a
        href={DEMO_CTA_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-allow-demo="1"
        style={{
          background: "#0a0a0a",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          transition: "transform .15s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        📅 Réserver mon accompagnement →
      </a>
    </div>
  );
}
