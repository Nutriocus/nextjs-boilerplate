"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function race_strategy_page() {
  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Stratégie de course"
        desc="Plans de course détaillés et calculateur produits."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
