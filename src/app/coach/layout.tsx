"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MobileTopbar } from "@/components/layout/MobileTopbar";
import { GlobalAthleteSearch } from "@/components/coach/GlobalAthleteSearch";

const NAV = [
  {
    grp: "",
    items: [{ href: "/coach", label: "Tableau de bord", ic: "◧" }],
  },
  {
    grp: "Mes athlètes",
    items: [{ href: "/coach/athletes", label: "Liste des athlètes", ic: "●" }],
  },
];

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <MobileTopbar
        isOpen={open}
        onToggle={() => setOpen((o) => !o)}
        subtitle="Coach"
      />

      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div style={{ margin: "0 -14px 4px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/nutriocus-white.png" alt="NUTRIOCUS" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        <div className="px-2">
          <div
            style={{
              fontSize: 10,
              color: "#6a6a68",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              margin: "2px 0 20px 2px",
            }}
          >
            Mission Performance · Coach
          </div>
        </div>

        <div className="flex-1">
          {NAV.map((section, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {section.grp && (
                <div className="sidebar-group-label">{section.grp}</div>
              )}
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/coach" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <div className={`sidebar-link ${active ? "active" : ""}`}>
                      <span style={{ width: 16, textAlign: "center", opacity: 0.9 }}>
                        {item.ic}
                      </span>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full"
            style={{ color: "#cf2e2e" }}
          >
            <span style={{ width: 16, textAlign: "center" }}>⎋</span>
            Déconnexion
          </button>
          <div
            style={{
              fontSize: 10,
              color: "#4a4a48",
              marginTop: 14,
              padding: "0 8px",
              lineHeight: 1.5,
            }}
          >
            v2 · Mission Performance
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
      />

      <main className="lg:pl-[262px]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-[96px] lg:pt-8 pb-8">
          {children}
        </div>
      </main>

      <GlobalAthleteSearch />
    </div>
  );
}
