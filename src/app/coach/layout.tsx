"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV = [
  {
    grp: "",
    items: [
      { href: "/coach", label: "Tableau de bord", ic: "◧" },
    ],
  },
  {
    grp: "Mes athlètes",
    items: [
      { href: "/coach/athletes", label: "Liste des athlètes", ic: "●" },
    ],
  },
];

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[var(--color-dark)]">
            <span
              className="font-extrabold tracking-tight text-xs"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NUTRIOCUS
              <span className="text-[var(--color-primary)]">.</span>
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#6a6a68",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              margin: "10px 0 20px 2px",
            }}
          >
            Ultra Performance · Coach
          </div>
        </div>

        {/* Nav */}
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
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`sidebar-link ${active ? "active" : ""}`}
                    >
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

        {/* Footer */}
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
            v2 · Ultra Performance
          </div>
        </div>
      </aside>

      <main className="lg:pl-[262px]">
        <div className="max-w-7xl mx-auto p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
