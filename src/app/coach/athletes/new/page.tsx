"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader, Field } from "@/components/ui/PageHeader";

const SPORTS = ["trail", "course", "cyclisme", "triathlon", "natation"] as const;
const LEVELS = [
  { value: "loisir", label: "Loisir" },
  { value: "amateur_confirme", label: "Amateur confirmé" },
  { value: "semi_elite", label: "Semi-élite" },
  { value: "elite", label: "Élite" },
];

export default function NewAthletePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    sport: [] as string[],
    level: "",
    height_cm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleSport = (s: string) => {
    setForm((p) => ({
      ...p,
      sport: p.sport.includes(s) ? p.sport.filter((x) => x !== s) : [...p.sport, s],
    }));
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError("Le prénom, le nom et l'email sont obligatoires.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Email invalide.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Tu n'es pas connecté.");
        return;
      }
      const res = await fetch("/api/admin/create-athlete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(),
          sport: form.sport.length > 0 ? form.sport : null,
          level: form.level || null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Erreur inconnue");
        return;
      }
      setSuccess(
        json.mode === "created"
          ? `✅ Athlète créé. Un email d'invitation a été envoyé à ${form.email} avec un lien pour définir son mot de passe.`
          : `✅ Athlète mis à jour (existait déjà sous le même email).`,
      );
      setTimeout(() => router.push(`/coach/athletes/${json.athleteId}`), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/coach/athletes" className="btn-ghost btn-sm mb-3 inline-flex">
        ← Mes athlètes
      </Link>

      <PageHeader
        kicker="Espace coach"
        title="Ajouter un athlète"
        desc="Crée le compte de ton athlète et envoie-lui automatiquement une invitation par email."
      />

      <div className="card p-5 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Prénom *">
            <input
              className="input"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="Marie"
              autoFocus
            />
          </Field>
          <Field label="Nom *">
            <input
              className="input"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="Dupont"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Email *">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="marie.dupont@email.com"
            />
          </Field>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            L&apos;athlète recevra un mail pour définir son mot de passe.
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-bold mb-1.5">Sport(s)</div>
          <div className="flex flex-wrap gap-1.5">
            {SPORTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSport(s)}
                className={form.sport.includes(s) ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="Niveau">
            <select
              className="input"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="">—</option>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Taille (cm)">
            <input
              className="input"
              value={form.height_cm}
              onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
              placeholder="175"
              inputMode="numeric"
            />
          </Field>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "rgba(95,140,10,0.12)", color: "var(--color-success)" }}>
            {success}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <Link href="/coach/athletes" className="btn-ghost">Annuler</Link>
          <button onClick={submit} disabled={loading} className="btn-primary">
            {loading ? "Création…" : "✉ Créer & envoyer l'invitation"}
          </button>
        </div>
      </div>

      <div className="card p-4 mt-4 max-w-2xl text-xs text-[var(--color-text-muted)]" style={{ borderLeft: "3px solid var(--color-primary)" }}>
        <div className="font-bold text-[var(--color-text)] mb-1">Ce qui se passe ensuite</div>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>L&apos;athlète reçoit un email d&apos;invitation NUTRIOCUS</li>
          <li>Il clique sur le lien et définit son mot de passe</li>
          <li>Il atterrit sur son tableau de bord avec une checklist d&apos;onboarding</li>
          <li>Tu vois automatiquement son compte dans <b>Mes athlètes</b></li>
          <li>Tu peux commencer à remplir son profil dès maintenant si tu as déjà ses infos</li>
        </ol>
      </div>
    </div>
  );
}
