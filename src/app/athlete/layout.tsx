import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sidebar desktop */}
      <Sidebar role="athlete" />

      {/* Main content */}
      <main className="lg:pl-[212px] pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto p-5 lg:p-8">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <MobileNav />
    </div>
  );
}
