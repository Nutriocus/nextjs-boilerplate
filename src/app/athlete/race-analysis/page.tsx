"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function race_analysis_page() {
  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Analyse post-course"
        desc="Tes bilans de course."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
