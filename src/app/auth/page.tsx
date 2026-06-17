"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, AlertCircle, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "athlete";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mode, setMode] = useState<"login" | "reset" | "reset-sent">("login");

  const isCoach = role === "coach";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setError("Connexion impossible. Vérifie tes identifiants.");
      return;
    }

    // Look up role and redirect
    const userId = data.session.user.id;
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (coach) {
      router.push("/coach");
      return;
    }

    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (athlete) {
      router.push("/athlete/dashboard");
      return;
    }

    router.push("/auth/error?reason=no-role");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setMode("reset-sent");
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
          className="card p-6"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/nutriocus-orange.png" alt="NUTRIOCUS" style={{ height: 32, width: "auto", display: "block" }} />
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

          {mode === "reset-sent" ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold font-display mb-2">
                Lien envoyé !
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Un email de réinitialisation a été envoyé à{" "}
                <span className="text-[var(--color-text)] font-medium">
                  {email}
                </span>
                <br />
                Clique sur le lien pour définir un nouveau mot de passe.
              </p>
              <button
                onClick={() => {
                  setMode("login");
                  setInfo("");
                }}
                className="mt-6 text-sm text-[var(--color-primary)] font-bold hover:underline"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2
                  className="font-extrabold uppercase mb-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {mode === "login" ? "Connexion" : "Mot de passe oublié"}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {mode === "login"
                    ? "Entrez votre email et votre mot de passe."
                    : "Entrez votre email, vous recevrez un lien pour réinitialiser votre mot de passe."}
                </p>
              </div>

              <form
                onSubmit={mode === "login" ? handleLogin : handleResetPassword}
                className="space-y-4"
              >
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

                {mode === "login" && (
                  <div>
                    <label className="label">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="input pl-10"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {info && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {info}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || (mode === "login" && !password)}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Chargement..."
                    : mode === "login"
                    ? "Se connecter"
                    : "Envoyer le lien"}
                </button>

                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setError("");
                    }}
                    className="block mx-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
                  >
                    Mot de passe oublié ?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="block mx-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
                  >
                    ← Retour à la connexion
                  </button>
                )}
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
