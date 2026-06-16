"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader, Empty } from "@/components/ui/PageHeader";

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: string[] | null;
  level: string | null;
  height_cm: number | null;
  status: string | null;
};

export default function CoachAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!coach) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, email, sport, level, height_cm, status")
        .eq("coach_id", coach.id)
        .order("first_name");
      setAthletes((data as Athlete[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        kicker="Espace coach"
        title="Mes athlètes"
        desc={`${athletes.length} athlète${athletes.length > 1 ? "s" : ""} actif${athletes.length > 1 ? "s" : ""}`}
      />

      {loading ? (
        <div className="card p-10 text-center text-[var(--color-text-muted)]">Chargement…</div>
      ) : athletes.length === 0 ? (
        <Empty>
          Aucun athlète. Crée-en un dans Supabase ou via le formulaire d&apos;ajout (à venir).
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map((a) => (
            <Link key={a.id} href={`/coach/athletes/${a.id}`}>
              <div
                className="card p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md group"
                style={{ borderTop: `3px solid var(--color-primary)` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white"
                    style={{ background: "var(--color-primary)", fontFamily: "var(--font-display)" }}
                  >
                    {a.first_name[0]}
                    {a.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-extrabold uppercase truncate"
                      style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "-0.01em" }}
                    >
                      {a.first_name} {a.last_name}
                    </h3>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{a.email}</div>
                  </div>
                </div>

                {a.sport && a.sport.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {a.sport.map((s) => (
                      <span key={s} className="badge badge-orange">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="badge badge-green">{a.status || "active"}</span>
                  <span className="text-[var(--color-primary)] font-bold">Voir →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
