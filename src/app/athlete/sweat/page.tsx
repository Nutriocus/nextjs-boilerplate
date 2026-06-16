"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function sweat_page() {
  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Taux de sudation"
        desc="Mesure tes pertes hydriques par séance."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
