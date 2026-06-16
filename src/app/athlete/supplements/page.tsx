"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function supplements_page() {
  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Complémentation"
        desc="Plan annuel de suppléments."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
