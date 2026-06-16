"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function season_page() {
  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Planification de la saison"
        desc="Frise chronologique, phases et objectifs."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
