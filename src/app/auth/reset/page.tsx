"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Wait for Supabase to process the hash from the reset link
    const checkSession = async () => {
      await new Promise((r) => setTimeout(r, 500));
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        setError(
          "Lien invalide ou expiré. Demande un nouveau lien de réinitialisation."
        );
      }
    };
    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <div className="w-full max-w-md">
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6"
        >
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
            <h1
              className="font-extrabold uppercase mt-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "26px",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Nouveau mot de passe
            </h1>
            <div className="flex gap-1 mt-2">
              <div className="h-1 w-10 bg-[var(--color-primary)] rounded-full" />
              <div className="h-1 w-4 bg-[var(--color-accent)] rounded-full" />
            </div>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold font-display mb-2">
                Mot de passe défini !
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Redirection vers la page de connexion...
              </p>
            </div>
          ) : !ready && !error ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              Vérification du lien...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="input pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !ready || !password || !confirm}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enregistrement..." : "Définir le mot de passe"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
