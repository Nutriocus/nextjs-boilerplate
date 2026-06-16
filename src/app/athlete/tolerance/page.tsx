"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function tolerance_page() {
  return (
    <div>
      <PageHeader
        kicker="Nutrition à l'effort"
        title="Tests de tolérance digestive"
        desc="Tolérance glucides et hydrique."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
