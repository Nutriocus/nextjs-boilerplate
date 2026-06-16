"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function energy_page() {
  return (
    <div>
      <PageHeader
        kicker="Comprendre où tu en es"
        title="Carnet de bord de l'énergie"
        desc="Score de disponibilité énergétique, sommeil, fatigue."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
