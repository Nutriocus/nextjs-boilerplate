"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      // En flow "implicit", Supabase parse automatiquement le hash #access_token
      // grâce à detectSessionInUrl: true. On attend juste que la session soit prête.
      // Petit délai pour laisser Supabase traiter le hash.
      await new Promise((r) => setTimeout(r, 500));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.push(`/auth/error?reason=no-session&err=${error?.message ?? "no-session"}`);
        return;
      }

      // Force le passage par /auth/set-password : si le mot de passe n'a jamais
      // été défini, on demande à l'utilisateur d'en créer un avant d'accéder
      // au tableau de bord. La page set-password détecte automatiquement si
      // le mot de passe est déjà défini et redirige immédiatement vers la
      // bonne destination.
      router.push("/auth/set-password");
    }
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)]">Connexion en cours...</p>
      </div>
    </div>
  );
}
