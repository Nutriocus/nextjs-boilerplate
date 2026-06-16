"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function consultations_page() {
  return (
    <div>
      <PageHeader
        kicker="Mon accompagnement"
        title="Mes consultations"
        desc="Comptes rendus et replays de tes consultations."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
