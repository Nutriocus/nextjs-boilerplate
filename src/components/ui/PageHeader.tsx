"use client";

import React from "react";

export function PageHeader({
  kicker,
  title,
  desc,
  action,
}: {
  kicker: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <div className="kicker">{kicker}</div>
          <h1
            className="font-extrabold uppercase mt-1 text-2xl sm:text-3xl lg:text-[34px]"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          <div className="flex gap-1 mt-2">
            <div className="h-1 w-16 bg-[var(--color-primary)] rounded-full" />
            <div className="h-1 w-6 bg-[var(--color-accent)] rounded-full" />
          </div>
        </div>
        {action}
      </div>
      {desc && (
        <p className="text-[var(--color-text-muted)] mt-3 text-sm max-w-2xl leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}

export function Kpi({
  label,
  value,
  unit,
  color = "var(--color-primary)",
  note,
  warn,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  note?: string;
  warn?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        borderTop: `3px solid ${warn ? "var(--color-danger)" : color}`,
        ...(warn ? { background: "#fcebe8" } : {}),
      }}
    >
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        style={{ color: warn ? "var(--color-danger)" : color }}
      >
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {note && (
        <div
          className="stat-note"
          style={warn ? { color: "var(--color-danger)" } : {}}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-10 text-center text-[var(--color-text-muted)] text-sm">
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "dark",
}: {
  children: React.ReactNode;
  variant?: "dark" | "orange" | "green" | "red" | "neon";
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-xs font-semibold"
        style={{ color: "var(--color-text)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
