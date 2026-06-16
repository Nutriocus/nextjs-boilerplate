"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function pre_race_page() {
  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Avant la course (J-4 → J)"
        desc="Cibles glucidiques et petit-déjeuners pré-course."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
