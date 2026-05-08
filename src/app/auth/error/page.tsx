"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-9 h-9 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold font-display mb-2">
          Accès non autorisé
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Votre email n'est pas enregistré dans la plateforme. Contactez votre
          coach pour obtenir un accès.
        </p>
        <Link href="/" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
