"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SubscriptionCard } from "@/components/athlete/SubscriptionCard";

export default function SubscriptionPage() {
  return (
    <div>
      <PageHeader
        kicker="Compte & facturation"
        title="Mon abonnement"
        desc="Gère ton plan, ta carte bancaire, télécharge tes factures ou annule à tout moment."
      />
      <SubscriptionCard />
    </div>
  );
}
