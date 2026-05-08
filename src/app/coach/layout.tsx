import Link from "next/link";
import { Zap, Users, LayoutDashboard, LogOut } from "lucide-react";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sidebar coach */}
      <aside className="sidebar">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--color-border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold font-display text-sm tracking-tight">NUTRIOCUS</span>
            <div className="text-[10px] text-[var(--color-primary)]">Espace Coach</div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {[
            { href: "/coach", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/coach/athletes", icon: Users, label: "Mes athlètes" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className="sidebar-link">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[13px]">{label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--color-border)]">
          <Link href="/">
            <div className="sidebar-link w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">Déconnexion</span>
            </div>
          </Link>
        </div>
      </aside>

      <main className="lg:pl-[212px]">
        <div className="max-w-7xl mx-auto p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
