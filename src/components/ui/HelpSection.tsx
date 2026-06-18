"use client";

import React from "react";

// Reusable expandable help section with consistent Mission Performance styling.
// Use <HelpBlock> children to structure the content (Pourquoi / Comment).
export function HelpSection({
  title = "ℹ️ Comment ça marche ?",
  children,
  open = false,
}: {
  title?: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details
      className="card p-4 mb-4"
      style={{ borderLeft: "5px solid var(--color-primary)" }}
      open={open}
    >
      <summary
        className="font-extrabold cursor-pointer text-sm"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      >
        {title}
      </summary>
      <div className="text-sm leading-relaxed mt-3 space-y-3 text-[var(--color-text)]">
        {children}
      </div>
    </details>
  );
}

export function HelpBlock({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase font-bold mb-1.5"
        style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}
      >
        {icon} {title}
      </div>
      <div className="text-sm text-[var(--color-text)] space-y-1.5">{children}</div>
    </div>
  );
}
