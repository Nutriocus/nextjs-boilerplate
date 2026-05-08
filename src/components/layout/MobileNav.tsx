"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  BookHeart,
  Map,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainItems = [
  { href: "/athlete/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/athlete/meal-plans", icon: UtensilsCrossed, label: "Plans" },
  { href: "/athlete/energy-log", icon: BookHeart, label: "Carnet" },
  { href: "/athlete/roadmap", icon: Map, label: "Roadmap" },
  { href: "/athlete/gpts", icon: MoreHorizontal, label: "Plus" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {mainItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href}>
            <div className={cn("bottom-nav-item", isActive && "active")}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
