"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// =====================================================================
// /auth/set-password — first-time password setup after invite or magiclink.
//
// Flow:
// 1. User clicks invitation link → land on /auth/callback (session created)
// 2. Callback redirects here
// 3. User chooses a password → updateUser({ password })
// 4. We mark user_metadata.password_set = true
// 5. Redirect to /coach or /athlete/parcours
//
// If user already has user_metadata.password_set === true (they came back
// later), we skip the form and redirect immediately.
// =====================================================================

export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth?reason=no-session");
        return;
      }
      setEmail(user.email ?? null);

      // If password already set on a previous visit → skip
      if (user.user_metadata?.password_set === true) {
        await routeToHome(user.id);
        return;
      }
      setLoadingSession(false);
    })();
  }, [router]);

  async function routeToHome(userId: string) {
    const { data: coach } = await supabase
      .from("coaches").select("id").eq("user_id", userId).maybeSingle();
    if (coach) { router.replace("/coach"); return; }
    const { data: athlete } = await supabase
      .from("athletes").select("id").eq("user_id", userId).maybeSingle();
    if (athlete) { router.replace("/athlete/parcours"); return; }
    router.replace("/auth/error?reason=no-role");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Ton mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const { data, error: updateErr } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }
    const uid = data.user?.id;
    if (uid) await routeToHome(uid);
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--color-text-muted)]">Préparation de ton compte…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
      <div
        className="w-full max-w-md card p-6 sm:p-8"
        style={{ borderTop: "5px solid var(--color-primary)" }}
      >
        <div className="text-center mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/nutriocus-white.png"
            alt="NUTRIOCUS"
            style={{ height: 38, width: "auto", display: "inline-block", filter: "brightness(0)" }}
          />
        </div>
        <div className="text-[10px] uppercase font-bold mb-1 text-center" style={{ letterSpacing: ".1em", color: "var(--color-primary)" }}>
          Bienvenue
        </div>
        <h1
          className="font-extrabold uppercase mb-2 text-center"
          style={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1.05 }}
        >
          Crée ton mot de passe
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-5 text-center">
          Choisis un mot de passe pour <b className="text-[var(--color-text)]">{email}</b>.
          Il te permettra de te connecter en autonomie aux prochaines visites.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase mb-1 block" style={{ letterSpacing: ".06em", color: "var(--color-text-muted)" }}>
              Mot de passe
            </label>
            <input
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase mb-1 block" style={{ letterSpacing: ".06em", color: "var(--color-text-muted)" }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              className="input w-full"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Retape ton mot de passe"
            />
          </div>

          {error && (
            <div
              className="text-xs p-2.5 rounded-lg"
              style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)", border: "1px solid rgba(207,46,46,0.40)" }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full"
            style={{ padding: "10px 18px" }}
          >
            {saving ? "Création…" : "Créer mon mot de passe et continuer →"}
          </button>
        </form>

        <p className="text-[11px] text-[var(--color-text-muted)] text-center mt-4">
          Ton mot de passe est stocké de manière sécurisée et chiffrée — Florian n&apos;y a pas accès.
        </p>
      </div>
    </div>
  );
}
