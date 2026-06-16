"use client";

import { useState, Suspense } from "react";
import { AthleteSidebar } from "@/components/athlete/AthleteSidebar";
import { MobileTopbar } from "@/components/layout/MobileTopbar";

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <MobileTopbar
        isOpen={open}
        onToggle={() => setOpen((o) => !o)}
        subtitle="Ultra Performance"
      />
      <AthleteSidebar
        mobileOpen={open}
        onCloseMobile={() => setOpen(false)}
      />
      <main className="lg:pl-[262px]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-[70px] lg:pt-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-muted)]">
          Chargement…
        </div>
      }
    >
      <Shell>{children}</Shell>
    </Suspense>
  );
}
