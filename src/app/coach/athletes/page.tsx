"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadData } from "@/lib/athlete-storage";
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

type Profile = { poids?: number | string; photo?: string };
type EventItem = { id?: string; date: string; name: string };
type Consultation = { id: string; date: string; type?: string };
type Suivi = { label?: string; dateDebut?: string; dateFin?: string };

type AthleteCard = {
  athlete: Athlete;
  photo: string | null;
  poids: number | null;
  suiviProgress: number | null;
  suiviDaysLeft: number | null;
  suiviLabel: string | null;
  nextRace: { name: string; date: string; days: number } | null;
  nextConsult: { date: string; days: number } | null;
};

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmtShort(s: string) {
  return parseISO(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function CoachAthletesPage() {
  const [cards, setCards] = useState<AthleteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const today = toLocalISODate(new Date());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

      const list = (data as Athlete[]) || [];

      // Fetch per-athlete summary in parallel
      const enriched = await Promise.all(
        list.map(async (a): Promise<AthleteCard> => {
          const [profile, events, consultations, suivi] = await Promise.all([
            loadData<Profile>("profile", {}, a.id),
            loadData<EventItem[]>("events", [], a.id),
            loadData<Consultation[]>("consultations", [], a.id),
            loadData<Suivi>("suivi", {}, a.id),
          ]);

          const futureRaces = events
            .filter((e) => e.date && e.date >= today)
            .sort((x, y) => x.date.localeCompare(y.date));
          const nextRace = futureRaces[0]
            ? { name: futureRaces[0].name, date: futureRaces[0].date, days: daysBetween(today, futureRaces[0].date) }
            : null;

          const futureConsults = consultations
            .filter((c) => c.date && c.date >= today)
            .sort((x, y) => x.date.localeCompare(y.date));
          const nextConsult = futureConsults[0]
            ? { date: futureConsults[0].date, days: daysBetween(today, futureConsults[0].date) }
            : null;

          let suiviProgress: number | null = null;
          let suiviDaysLeft: number | null = null;
          if (suivi.dateDebut && suivi.dateFin) {
            const total = parseISO(suivi.dateFin).getTime() - parseISO(suivi.dateDebut).getTime();
            const elapsed = Date.now() - parseISO(suivi.dateDebut).getTime();
            suiviProgress = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0;
            suiviDaysLeft = Math.max(0, Math.ceil((parseISO(suivi.dateFin).getTime() - Date.now()) / 86400000));
          }

          return {
            athlete: a,
            photo: profile?.photo || null,
            poids: profile?.poids != null ? toNum(profile.poids) : null,
            suiviProgress,
            suiviDaysLeft,
            suiviLabel: suivi.label || null,
            nextRace,
            nextConsult,
          };
        }),
      );
      setCards(enriched);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => {
      const a = c.athlete;
      const fields = [
        a.first_name,
        a.last_name,
        a.email,
        a.level || "",
        ...(a.sport || []),
        c.nextRace?.name || "",
        c.suiviLabel || "",
      ];
      return fields.some((f) => f.toLowerCase().includes(q));
    });
  }, [cards, query]);

  return (
    <div>
      <PageHeader
        kicker="Espace coach"
        title="Mes athlètes"
        desc={`${cards.length} athlète${cards.length > 1 ? "s" : ""} · ${filtered.length === cards.length ? "tous affichés" : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}`}
        action={<Link href="/coach/athletes/new" className="btn-primary">+ Nouvel athlète</Link>}
      />

      {/* Search */}
      <div className="card p-3 mb-4 flex items-center gap-2">
        <span className="text-[var(--color-text-muted)] text-lg pl-1">🔍</span>
        <input
          className="input"
          placeholder="Rechercher par nom, email, sport, niveau, course à venir…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ border: "none", background: "transparent", flex: 1 }}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => setQuery("")} className="btn-ghost btn-xs">✕</button>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-[var(--color-text-muted)]">Chargement…</div>
      ) : cards.length === 0 ? (
        <Empty>
          Aucun athlète. Crée-en un dans Supabase ou via le formulaire d&apos;ajout (à venir).
        </Empty>
      ) : filtered.length === 0 ? (
        <Empty>Aucun résultat pour « {query} ».</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const a = c.athlete;
            return (
              <Link key={a.id} href={`/coach/athletes/${a.id}`}>
                <div
                  className="card p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md h-full flex flex-col"
                  style={{ borderTop: `3px solid var(--color-primary)` }}
                >
                  {/* Header: photo + name */}
                  <div className="flex items-center gap-3 mb-3">
                    {c.photo ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid var(--color-border)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white shrink-0"
                        style={{ background: "var(--color-primary)", fontFamily: "var(--font-display)", fontSize: 18 }}
                      >
                        {a.first_name[0]}
                        {a.last_name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-extrabold uppercase truncate"
                        style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "-0.01em" }}
                      >
                        {a.first_name} {a.last_name}
                      </h3>
                      <div className="text-xs text-[var(--color-text-muted)] truncate">{a.email}</div>
                      {a.sport && a.sport.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.sport.map((s) => (
                            <span key={s} className="badge badge-orange" style={{ fontSize: 9 }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {c.suiviProgress != null && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1" style={{ letterSpacing: ".06em" }}>
                        <span>{c.suiviLabel || "Suivi"}</span>
                        <span style={{ color: "var(--color-success)" }}>{c.suiviProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <div
                          style={{
                            width: c.suiviProgress + "%",
                            height: "100%",
                            background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                            transition: "width .3s",
                          }}
                        />
                      </div>
                      {c.suiviDaysLeft != null && (
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                          {c.suiviDaysLeft} j restants
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next events */}
                  <div className="space-y-1.5 text-xs flex-1">
                    {c.nextRace && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em", minWidth: 60 }}>
                          🏁 Course
                        </span>
                        <span className="truncate font-semibold text-[var(--color-primary)]" title={c.nextRace.name}>
                          {c.nextRace.name}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0">
                          J-{c.nextRace.days}
                        </span>
                      </div>
                    )}
                    {c.nextConsult && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em", minWidth: 60 }}>
                          📋 Consult.
                        </span>
                        <span className="truncate text-[var(--color-dark)]">
                          {fmtShort(c.nextConsult.date)}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0">
                          J-{c.nextConsult.days}
                        </span>
                      </div>
                    )}
                    {!c.nextRace && !c.nextConsult && (
                      <div className="text-[var(--color-text-muted)] italic">Aucun événement à venir</div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-[var(--color-border)]">
                    <span className="badge badge-green">{a.status || "active"}</span>
                    <span className="text-[var(--color-primary)] font-bold">Voir →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
