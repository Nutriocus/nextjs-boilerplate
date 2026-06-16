"use client";

import { PageHeader, Empty } from "@/components/ui/PageHeader";

export default function meal_plans_page() {
  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Plans alimentaires"
        desc="Tes plans par typologie de journée."
      />
      <div className="card p-10 text-center">
        <div className="text-[var(--color-text-muted)] text-sm">
          Module en cours d'intégration · Disponible prochainement.
        </div>
      </div>
    </div>
  );
}
