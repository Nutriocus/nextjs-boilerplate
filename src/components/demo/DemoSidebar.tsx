"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_CTA_URL } from "@/lib/demo-context";

const DEMO_NAV = [
  {
    grp: "",
    items: [
      { href: "/demo/dashboard", label: "Tableau de bord", ic: "◧" },
      { href: "/demo/calendar", label: "Calendrier", ic: "▦" },
      { href: "/demo/profile", label: "Mon profil", ic: "●" },
    ],
  },
  {
    grp: "Mon accompagnement",
    items: [
      { href: "/demo/academy", label: "Académie", ic: "▷", locked: true },
      { href: "/demo/consultations", label: "Mes consultations", ic: "◳" },
    ],
  },
  {
    grp: "1 · Où tu en es",
    items: [
      { href: "/demo/energy", label: "Carnet de bord énergie", ic: "▮" },
      { href: "/demo/composition", label: "Composition corporelle", ic: "▤" },
      { href: "/demo/sweat", label: "Taux de sudation", ic: "◓" },
    ],
  },
  {
    grp: "2 · Anticiper tes courses",
    items: [
      { href: "/demo/physiology", label: "Profil physiologique", ic: "◈" },
      { href: "/demo/energy-expenditure", label: "Dépenses en course", ic: "▲" },
      { href: "/demo/protocols", label: "Protocoles d'évaluation", ic: "◬" },
      { href: "/demo/race-strategy", label: "Stratégie de course", ic: "◎" },
      { href: "/demo/race-analysis", label: "Analyse post-course", ic: "◍" },
    ],
  },
  {
    grp: "3 · Structurer ton quotidien",
    items: [
      { href: "/demo/meal-plans", label: "Plans alimentaires", ic: "▦" },
      { href: "/demo/pre-race", label: "Avant la course", ic: "▣" },
      { href: "/demo/supplements", label: "Complémentation", ic: "◆" },
      { href: "/demo/season", label: "Planification saison", ic: "▭" },
    ],
  },
  {
    grp: "Nutrition à l'effort & outils",
    items: [
      { href: "/demo/products", label: "Produits de l'effort", ic: "⚡" },
      { href: "/demo/tolerance", label: "Tests de tolérance", ic: "◔" },
      { href: "/demo/recovery", label: "Récupération", ic: "◖" },
      { href: "/demo/ai-tools", label: "Outils IA", ic: "✦", locked: true },
    ],
  },
];

export function DemoSidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="px-2" style={{ marginBottom: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/nutriocus-white.png"
            alt="NUTRIOCUS"
            style={{ width: "55%", height: "auto", display: "block", maxWidth: "100%" }}
          />
        </div>
        <div className="px-2">
          <div
            style={{
              fontSize: 10,
              color: "#6a6a68",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              margin: "2px 0 4px 2px",
            }}
          >
            Mission Performance
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-primary)",
              fontWeight: 700,
              margin: "0 0 12px 2px",
            }}
          >
            🎬 Mode démo
          </div>
        </div>

        <div className="flex-1">
          {DEMO_NAV.map((section, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {section.grp && <div className="sidebar-group-label">{section.grp}</div>}
              {section.items.map((item) => {
                const active = pathname === item.href;
                const locked = (item as { locked?: boolean }).locked;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                  >
                    <div className={`sidebar-link ${active ? "active" : ""}`}>
                      <span style={{ width: 16, textAlign: "center", opacity: 0.9 }}>
                        {item.ic}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {locked && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "#3a3a36",
                            color: "#cf2e2e",
                            padding: "1px 5px",
                            borderRadius: 3,
                            fontWeight: 700,
                            letterSpacing: ".05em",
                          }}
                        >
                          🔒
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <a
            href={DEMO_CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-allow-demo="1"
          >
            <div
              className="sidebar-link w-full"
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 700,
                justifyContent: "center",
              }}
            >
              📅 Réserver
            </div>
          </a>
          <div
            style={{
              fontSize: 10,
              color: "#4a4a48",
              marginTop: 14,
              padding: "0 8px",
              lineHeight: 1.5,
            }}
          >
            Aperçu de l&apos;accompagnement
            <br />
            Mission Performance
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={() => onCloseMobile?.()}
      />
    </>
  );
}
