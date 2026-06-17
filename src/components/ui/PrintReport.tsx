"use client";

import React from "react";

const PRINT_COLOR = {
  ink: "#0a0a0a",
  orange: "#FF4501",
  neon: "#d0ff2c",
  green: "#5f8c0a",
  red: "#cf2e2e",
  mut: "#787876",
  line: "#e6e6e3",
  soft: "#fafaf8",
};

export const printColor = PRINT_COLOR;

/**
 * Button that triggers window.print(). Page must contain a <PrintReport>
 * block with content that should be in the PDF.
 */
export function PrintButton({
  label = "Exporter en PDF",
  variant = "dark",
}: {
  label?: string;
  variant?: "dark" | "primary" | "ghost";
}) {
  return (
    <button
      onClick={() => window.print()}
      className={`btn-${variant} btn-sm screen-only`}
      type="button"
    >
      {label}
    </button>
  );
}

/**
 * A self-contained printable page (A4). Only visible during print.
 * Renders a NUTRIOCUS Mission Performance themed header.
 */
export function PrintReport({
  kicker = "Mission Performance",
  title,
  subtitle,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-only">
      <div
        className="print-page"
        style={{
          fontFamily: "var(--font-display)",
          color: PRINT_COLOR.ink,
          width: "100%",
          maxWidth: 744,
          margin: "0 auto",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: PRINT_COLOR.ink,
            borderRadius: 16,
            padding: "24px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <div>
            <div
              style={{
                color: PRINT_COLOR.orange,
                fontWeight: 800,
                fontSize: 10.5,
                letterSpacing: ".2em",
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 27,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                lineHeight: 1.04,
                marginTop: 6,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ color: "#b9b9b6", fontSize: 12.5, marginTop: 6 }}>
                {subtitle}
              </div>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/nutriocus-orange.png" alt="NUTRIOCUS" style={{ height: 120, width: "auto" }} />
        </div>

        {/* Decorative bars */}
        <div style={{ display: "flex", gap: 4, margin: "8px 0 2px" }}>
          <div
            style={{ height: 4, width: 60, background: PRINT_COLOR.orange, borderRadius: 4 }}
          />
          <div
            style={{ height: 4, width: 24, background: PRINT_COLOR.neon, borderRadius: 4 }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "4px 2px" }}>{children}</div>

        {/* Footer */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 10,
            borderTop: `2px solid ${PRINT_COLOR.ink}`,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: PRINT_COLOR.mut,
          }}
        >
          <span style={{ fontWeight: 800, color: PRINT_COLOR.ink }}>
            NUTRIOCUS
            <span style={{ color: PRINT_COLOR.orange }}>.</span> Mission Performance
          </span>
          <span>
            Édité le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Print section header (orange vertical bar + uppercase text).
 */
export function PrintH({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="no-break"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "20px 0 12px",
      }}
    >
      <span
        style={{ width: 6, height: 18, background: PRINT_COLOR.orange, borderRadius: 3 }}
      />
      <span
        style={{
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: PRINT_COLOR.line }} />
    </div>
  );
}

/**
 * Print KPI card.
 */
export function PrintKpi({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${PRINT_COLOR.line}`,
        borderRadius: 11,
        padding: "11px 13px",
        borderTop: `3px solid ${accent || PRINT_COLOR.orange}`,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: PRINT_COLOR.mut,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 21,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}
      >
        {value !== "" && value != null ? value : "—"}
        {unit && (
          <span style={{ fontSize: 11, color: PRINT_COLOR.mut, fontWeight: 600 }}>
            {" "}
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: PRINT_COLOR.orange, fontWeight: 700 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * Print boxed content with header.
 */
export function PrintBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="no-break"
      style={{
        border: `1px solid ${PRINT_COLOR.line}`,
        borderRadius: 12,
        padding: "12px 14px 6px",
        marginTop: 10,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
