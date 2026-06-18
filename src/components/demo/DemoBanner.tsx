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
        background: "linear-gradient(90deg, #f47216 0%, #ff8a3d 100%)",
        color: "#fff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <span>
        🎬 <span style={{ opacity: 0.95 }}>Mode démo — données fictives, navigation en lecture seule</span>
      </span>
      <a
        href={DEMO_CTA_URL}
        target="_blank"
        rel="noopener noreferrer"
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
        }}
      >
        Réserver mon accompagnement →
      </a>
    </div>
  );
}
