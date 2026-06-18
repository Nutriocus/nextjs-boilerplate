"use client";

import { Suspense, useState, useEffect } from "react";
import { DemoProvider } from "@/lib/demo-context";
import { DemoSidebar } from "@/components/demo/DemoSidebar";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { MobileTopbar } from "@/components/layout/MobileTopbar";
import "@/styles/demo.css";

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const link = t.closest('a[target="_blank"]') as HTMLAnchorElement | null;
      if (link && link.dataset.allowDemo !== "1") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--color-background)]"
      data-demo="1"
      style={{ paddingTop: 44 }}
    >
      <DemoBanner />
      <MobileTopbar
        isOpen={open}
        onToggle={() => setOpen((o) => !o)}
        subtitle="Mission Performance — Démo"
      />
      <DemoSidebar mobileOpen={open} onCloseMobile={() => setOpen(false)} />
      <main className="lg:pl-[262px]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-[96px] lg:pt-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-[var(--color-text-muted)]">
            Chargement de la démo…
          </div>
        }
      >
        <Shell>{children}</Shell>
      </Suspense>
    </DemoProvider>
  );
}
