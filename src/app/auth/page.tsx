"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "athlete";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isCoach = role === "coach";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <div className="w-full max-w-md">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[var(--color-dark)] text-white">
              <span
                className="font-extrabold tracking-tight text-xs"
                style={{ fontFamily: "var(--font-display)" }}
              >
                NUTRIOCUS
                <span className="text-[var(--color-primary)]">.</span>
              </span>
            </div>
            <div className="kicker">Espace</div>
            <h1
              className="font-extrabold uppercase mt-1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "28px",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              {isCoach ? "Coach" : "Athlète"}
            </h1>
            <div className="flex gap-1 mt-2">
              <div className="h-1 w-10 bg-[var(--color-primary)] rounded-full" />
              <div className="h-1 w-4 bg-[var(--color-accent)] rounded-full" />
            </div>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold font-display mb-2">
                Lien envoyé !
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Vérifiez votre boîte mail{" "}
                <span className="text-[var(--color-text)] font-medium">
                  {email}
                </span>
                <br />
                et cliquez sur le lien de connexion.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-4">
                Le lien expire dans 10 minutes.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold font-display mb-1">
                  Connexion
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Entrez votre email pour recevoir un lien de connexion sécurisé
                  — aucun mot de passe requis.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="input pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Recevoir mon lien de connexion
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center">
                Seuls les emails enregistrés par votre coach ont accès.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
