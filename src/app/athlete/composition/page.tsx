"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function composition_page() {
  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Composition corporelle"
        desc="Suivi des masses et IRE pour ton poids de forme."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
