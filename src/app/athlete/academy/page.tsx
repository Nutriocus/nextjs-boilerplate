"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function academy_page() {
  return (
    <div>
      <PageHeader
        kicker="Académie Nutriocus"
        title="Académie"
        desc="Tes formations complètes et leurs vidéos."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
