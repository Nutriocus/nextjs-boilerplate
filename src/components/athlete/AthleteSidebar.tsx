"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const ATHLETE_NAV = [
  {
    grp: "",
    items: [
      { href: "/athlete/dashboard", label: "Tableau de bord", ic: "◧" },
      { href: "/athlete/profile", label: "Mon profil", ic: "●" },
    ],
  },
  {
    grp: "Mon accompagnement",
    items: [
      { href: "/athlete/academy", label: "Académie", ic: "▷" },
      { href: "/athlete/consultations", label: "Mes consultations", ic: "◳" },
    ],
  },
  {
    grp: "1 · Où tu en es",
    items: [
      { href: "/athlete/energy", label: "Carnet de bord énergie", ic: "▮" },
      { href: "/athlete/composition", label: "Composition corporelle", ic: "▤" },
      { href: "/athlete/sweat", label: "Taux de sudation", ic: "◓" },
    ],
  },
  {
    grp: "2 · Anticiper tes courses",
    items: [
      { href: "/athlete/physiology", label: "Profil physiologique", ic: "◈" },
      { href: "/athlete/energy-expenditure", label: "Dépenses en course", ic: "▲" },
      { href: "/athlete/protocols", label: "Protocoles d'évaluation", ic: "◬" },
      { href: "/athlete/race-strategy", label: "Stratégie de course", ic: "◎" },
      { href: "/athlete/race-analysis", label: "Analyse post-course", ic: "◍" },
    ],
  },
  {
    grp: "3 · Structurer ton quotidien",
    items: [
      { href: "/athlete/meal-plans", label: "Plans alimentaires", ic: "▦" },
      { href: "/athlete/pre-race", label: "Avant la course", ic: "▣" },
      { href: "/athlete/supplements", label: "Complémentation", ic: "◆" },
      { href: "/athlete/season", label: "Planification saison", ic: "▭" },
    ],
  },
  {
    grp: "Nutrition à l'effort & outils",
    items: [
      { href: "/athlete/products", label: "Produits de l'effort", ic: "⚡" },
      { href: "/athlete/tolerance", label: "Tests de tolérance", ic: "◔" },
      { href: "/athlete/recovery", label: "Récupération", ic: "◖" },
      { href: "/athlete/ai-tools", label: "Outils IA", ic: "✦" },
    ],
  },
];

export function AthleteSidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const athleteIdFromUrl = searchParams?.get("athleteId") || null;
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);

  // Detect if current user is a coach (so we can show "Retour coach" link)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsCoach(!!coach);
    })();
  }, []);

  // Fetch athlete name when navigating via ?athleteId
  useEffect(() => {
    if (!athleteIdFromUrl) {
      setAthleteName(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("athletes")
        .select("first_name, last_name")
        .eq("id", athleteIdFromUrl)
        .maybeSingle();
      if (data) setAthleteName(`${data.first_name} ${data.last_name}`);
    })();
  }, [athleteIdFromUrl]);

  const isCoachView = isCoach && !!athleteIdFromUrl;
  const athleteId = athleteIdFromUrl || undefined;

  // Append ?athleteId=... to all nav links when in coach view
  const buildHref = (href: string) =>
    isCoachView && athleteId ? `${href}?athleteId=${athleteId}` : href;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
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
              margin: "10px 0 4px 2px",
            }}
          >
            Ultra Performance
          </div>
          {isCoachView && athleteName && (
            <div
              style={{
                fontSize: 11,
                color: "var(--color-primary)",
                fontWeight: 700,
                margin: "0 0 6px 2px",
              }}
            >
              👁 Vue coach : {athleteName}
            </div>
          )}
          {isCoachView && (
            <Link href="/coach" onClick={() => onCloseMobile?.()}>
              <div
                className="sidebar-link"
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                <span style={{ width: 16, textAlign: "center" }}>⌂</span>
                Dashboard coach
              </div>
            </Link>
          )}
          {isCoachView && athleteId && (
            <Link href={`/coach/athletes/${athleteId}`} onClick={() => onCloseMobile?.()}>
              <div className="sidebar-link" style={{ marginBottom: 10 }}>
                <span style={{ width: 16, textAlign: "center" }}>📋</span>
                Fiche athlète
              </div>
            </Link>
          )}
          {!isCoachView && <div style={{ marginBottom: 16 }} />}
        </div>

        {/* Nav */}
        <div className="flex-1">
          {ATHLETE_NAV.map((section, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              {section.grp && (
                <div className="sidebar-group-label">{section.grp}</div>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={buildHref(item.href)}
                    onClick={() => onCloseMobile?.()}
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

        {/* Footer */}
        <div className="mt-auto pt-4">
          {isCoachView ? (
            <Link href="/coach/athletes" onClick={() => onCloseMobile?.()}>
              <div className="sidebar-link w-full" style={{ color: "#c9c9c5" }}>
                <span style={{ width: 16, textAlign: "center" }}>←</span>
                Liste de mes athlètes
              </div>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="sidebar-link w-full"
              style={{ color: "#cf2e2e" }}
            >
              <span style={{ width: 16, textAlign: "center" }}>⎋</span>
              Déconnexion
            </button>
          )}
          <div
            style={{
              fontSize: 10,
              color: "#4a4a48",
              marginTop: 14,
              padding: "0 8px",
              lineHeight: 1.5,
            }}
          >
            Données stockées dans Supabase
          </div>
        </div>
      </aside>

      {/* Backdrop on mobile */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "is-open" : ""}`}
        onClick={() => onCloseMobile?.()}
      />
    </>
  );
}
