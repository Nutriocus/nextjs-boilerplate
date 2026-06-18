"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  content: React.ReactNode;
  label?: React.ReactNode;
};

// Small "ⓘ" icon next to a label. On hover/click, shows a tooltip
// with explanatory content. Click outside / press ESC to close.
export function InfoTooltip({ content, label }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(e) => {
          // Don't close immediately if hovering into the tooltip
          const next = (e.relatedTarget as HTMLElement) || null;
          if (!ref.current?.contains(next)) {
            setTimeout(() => setOpen(false), 120);
          }
        }}
        title="Plus d'infos"
        aria-label="Plus d'infos"
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "50%",
          width: 16,
          height: 16,
          padding: 0,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--color-text-muted)",
          cursor: "help",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        i
      </button>
      {open && (
        <span
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 20,
            minWidth: 240,
            maxWidth: 320,
            background: "var(--color-dark)",
            color: "#fff",
            fontSize: 11.5,
            lineHeight: 1.5,
            padding: "10px 12px",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            fontWeight: 400,
            letterSpacing: 0,
            textTransform: "none",
            whiteSpace: "normal",
          }}
          onMouseLeave={() => setOpen(false)}
        >
          {content}
        </span>
      )}
    </span>
  );
}
