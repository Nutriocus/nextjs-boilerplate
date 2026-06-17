"use client";

import { Menu, X } from "lucide-react";

export function MobileTopbar({
  onToggle,
  isOpen,
  subtitle,
}: {
  onToggle: () => void;
  isOpen: boolean;
  subtitle?: string;
}) {
  return (
    <div className="mobile-topbar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/nutriocus-white.png" alt="NUTRIOCUS" style={{ height: 34, width: "auto" }} />

      {subtitle && (
        <div className="text-[10px] text-[#8a8a88] uppercase tracking-wider truncate mx-2 flex-1 text-center">
          {subtitle}
        </div>
      )}
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        className="rounded-lg p-2"
        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", color: "#fff" }}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
}
