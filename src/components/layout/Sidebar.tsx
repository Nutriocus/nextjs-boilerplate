"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Scale,
  Activity,
  Pill,
  UtensilsCrossed,
  ShoppingCart,
  Flag,
  Map,
  Calendar,
  Package,
  Flame,
  BookHeart,
  Droplets,
  FileText,
  FlaskConical,
  ChefHat,
  GraduationCap,
  Bot,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const athleteNav = [
  { href: "/athlete/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/athlete/questionnaire", icon: ClipboardList, label: "Questionnaire" },
  { divider: true, label: "Suivi" },
  { href: "/athlete/body", icon: Scale, label: "Corps & IRE" },
  { href: "/athlete/physiological", icon: Activity, label: "Profil physio" },
  { href: "/athlete/energy-log", icon: BookHeart, label: "Carnet d'énergie" },
  { href: "/athlete/sweat-rate", icon: Droplets, label: "Sudation" },
  { divider: true, label: "Nutrition" },
  { href: "/athlete/meal-plans", icon: UtensilsCrossed, label: "Plans alim." },
  { href: "/athlete/shopping", icon: ShoppingCart, label: "Courses" },
  { href: "/athlete/supplements", icon: Pill, label: "Compléments" },
  { href: "/athlete/products", icon: Package, label: "Produits effort" },
  { href: "/athlete/race-energy", icon: Flame, label: "Dépenses énergie" },
  { divider: true, label: "Course" },
  { href: "/athlete/roadmap", icon: Map, label: "Roadmap saison" },
  { href: "/athlete/race-strategy", icon: Flag, label: "Stratégies" },
  { href: "/athlete/planning", icon: Calendar, label: "Planning hebdo" },
  { href: "/athlete/race-reports", icon: FileText, label: "Comptes rendus" },
  { href: "/athlete/tests", icon: FlaskConical, label: "Tests effort" },
  { divider: true, label: "Outils" },
  { href: "/athlete/recipes", icon: ChefHat, label: "Recettes IA" },
  { href: "/athlete/formation", icon: GraduationCap, label: "Formation" },
  { href: "/athlete/gpts", icon: Bot, label: "Mes GPTs" },
];

interface SidebarProps {
  role?: "athlete" | "coach";
}

export function Sidebar({ role = "athlete" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const navItems = athleteNav;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b border-[var(--color-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/nutriocus-white.png" alt="NUTRIOCUS" style={{ height: 38, width: "auto" }} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, i) => {
          if ("divider" in item && item.divider) {
            return (
              <div
                key={`divider-${i}`}
                className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]/50"
              >
                {item.label}
              </div>
            );
          }

          const { href, icon: Icon, label } = item as {
            href: string;
            icon: React.ElementType;
            label: string;
          };
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link key={href} href={href}>
              <motion.div
                className={cn("sidebar-link", isActive && "active")}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.1 }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[13px]">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
