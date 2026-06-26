"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Kpi } from "@/components/ui/PageHeader";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ============== TYPES ==============
type EventItem = { id?: string; date: string; name: string; sport?: string };
type Consultation = { id: string; date: string; type: string; coach?: string };
type MealPlan = {
  id: string;
  name: string;
  status?: "actif" | "archive";
  dateDebut?: string;
  dateFin?: string;
  objectif?: string;
};
type Suivi = { label?: string; dateDebut?: string; dateFin?: string };
type CalendlyBooking = { scheduled_at: string; event_name: string | null };

type CalendarItem = {
  date: string; // YYYY-MM-DD
  kind:
    | "race"
    | "consultation"
    | "consultation-booked"
    | "pre-race"
    | "plan-start"
    | "plan-end"
    | "suivi-start"
    | "suivi-end";
  title: string;
  subtitle?: string;
  href?: string;
  color: string;
  icon: string;
};

const KIND_COLORS: Record<CalendarItem["kind"], string> = {
  race: "var(--color-primary)",
  consultation: "var(--color-dark)",
  "consultation-booked": "var(--color-success)",
  "pre-race": "#e6a833",
  "plan-start": "var(--color-success)",
  "plan-end": "var(--color-success)",
  "suivi-start": "#2196f3",
  "suivi-end": "#2196f3",
};

const KIND_ICONS: Record<CalendarItem["kind"], string> = {
  race: "🏁",
  consultation: "📋",
  "consultation-booked": "📅",
  "pre-race": "🍽",
  "plan-start": "▶",
  "plan-end": "⏹",
  "suivi-start": "▶",
  "suivi-end": "⏹",
};

const KIND_LABELS: Record<CalendarItem["kind"], string> = {
  race: "Course",
  consultation: "Compte rendu",
  "consultation-booked": "Consultation programmée",
  "pre-race": "Préparation alimentaire",
  "plan-start": "Début plan",
  "plan-end": "Fin plan",
  "suivi-start": "Début suivi",
  "suivi-end": "Fin suivi",
};

// ============== HELPERS ==============
function toISODate(d: Date): string {
  // Build the YYYY-MM-DD string from LOCAL components.
  // (d.toISOString() converts to UTC and can shift by 1 day depending on tz.)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(s: string): Date {
  // Parse YYYY-MM-DD as a LOCAL date (avoids UTC shift).
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

function monthMatrix(year: number, month: number): string[][] {
  // Returns 6 weeks × 7 days array of YYYY-MM-DD
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - startDay);
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(toISODate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)));
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

function buildItems(
  events: EventItem[],
  consultations: Consultation[],
  meals: MealPlan[],
  suivi: Suivi,
  bookings: CalendlyBooking[],
): CalendarItem[] {
  const items: CalendarItem[] = [];

  for (const b of bookings) {
    if (!b.scheduled_at) continue;
    const d = new Date(b.scheduled_at);
    const dateStr = toISODate(d);
    const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    items.push({
      date: dateStr,
      kind: "consultation-booked",
      title: `${timeStr} · ${b.event_name || "Consultation"}`,
      subtitle: "Réservation Calendly",
      href: "/athlete/consultations",
      color: KIND_COLORS["consultation-booked"],
      icon: KIND_ICONS["consultation-booked"],
    });
  }

  for (const e of events) {
    if (!e.date) continue;
    items.push({
      date: e.date,
      kind: "race",
      title: e.name || "Course",
      subtitle: e.sport,
      href: "/athlete/season",
      color: KIND_COLORS.race,
      icon: KIND_ICONS.race,
    });
    // Pre-race plan window: J-4 to J-J (5 days inclusive)
    for (let i = 4; i >= 1; i--) {
      items.push({
        date: addDays(e.date, -i),
        kind: "pre-race",
        title: `J-${i} · ${e.name || "Course"}`,
        subtitle: "Plan alimentaire pré-course",
        href: "/athlete/pre-race",
        color: KIND_COLORS["pre-race"],
        icon: KIND_ICONS["pre-race"],
      });
    }
  }

  for (const c of consultations) {
    if (!c.date) continue;
    items.push({
      date: c.date,
      kind: "consultation",
      title: c.type || "Consultation",
      subtitle: c.coach,
      href: "/athlete/consultations",
      color: KIND_COLORS.consultation,
      icon: KIND_ICONS.consultation,
    });
  }

  for (const m of meals) {
    if (m.status === "archive") continue;
    if (m.dateDebut) {
      items.push({
        date: m.dateDebut,
        kind: "plan-start",
        title: `Début · ${m.name}`,
        subtitle: m.objectif ? `Objectif : ${m.objectif}` : undefined,
        href: "/athlete/meal-plans",
        color: KIND_COLORS["plan-start"],
        icon: KIND_ICONS["plan-start"],
      });
    }
    if (m.dateFin) {
      items.push({
        date: m.dateFin,
        kind: "plan-end",
        title: `Fin · ${m.name}`,
        href: "/athlete/meal-plans",
        color: KIND_COLORS["plan-end"],
        icon: KIND_ICONS["plan-end"],
      });
    }
  }

  if (suivi.dateDebut) {
    items.push({
      date: suivi.dateDebut,
      kind: "suivi-start",
      title: `Début ${suivi.label || "Suivi"}`,
      href: "/athlete/dashboard",
      color: KIND_COLORS["suivi-start"],
      icon: KIND_ICONS["suivi-start"],
    });
  }
  if (suivi.dateFin) {
    items.push({
      date: suivi.dateFin,
      kind: "suivi-end",
      title: `Fin ${suivi.label || "Suivi"}`,
      href: "/athlete/dashboard",
      color: KIND_COLORS["suivi-end"],
      icon: KIND_ICONS["suivi-end"],
    });
  }

  return items;
}

function fmtLong(s: string) {
  return parseISO(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(s: string) {
  return parseISO(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ============== PAGE ==============
export default function CalendarPage() {
  const searchParams = useSearchParams();
  const athleteIdParam = searchParams?.get("athleteId") || undefined;
  const linkWithAthleteId = (href: string) =>
    athleteIdParam ? `${href}${href.includes("?") ? "&" : "?"}athleteId=${athleteIdParam}` : href;

  const [events, , loadedE] = useAthleteData<EventItem[]>("events", []);
  const [consultations, , loadedC] = useAthleteData<Consultation[]>("consultations", []);
  const [meals, , loadedM] = useAthleteData<MealPlan[]>("meal", []);
  const [suivi, , loadedS] = useAthleteData<Suivi>("suivi", {});
  const [bookings, setBookings] = useState<CalendlyBooking[]>([]);

  // Load Calendly bookings (scheduled consultations) for this athlete.
  // We pull future + recent past (last 60 days) so the calendar/agenda has
  // continuity even right after a meeting.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const query = supabase
        .from("athletes")
        .select("id");
      const { data: athlete } = athleteIdParam
        ? await query.eq("id", athleteIdParam).maybeSingle()
        : await query.eq("user_id", user.id).maybeSingle();
      if (!athlete) return;
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await supabase
        .from("calendly_bookings")
        .select("scheduled_at, event_name")
        .eq("athlete_id", athlete.id)
        .eq("status", "booked")
        .gte("scheduled_at", since.toISOString())
        .order("scheduled_at", { ascending: true });
      if (data) setBookings(data);
    })();
  }, [athleteIdParam]);

  const today = toISODate(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<CalendarItem["kind"], boolean>>({
    race: true,
    consultation: true,
    "consultation-booked": true,
    "pre-race": true,
    "plan-start": true,
    "plan-end": true,
    "suivi-start": true,
    "suivi-end": true,
  });

  const allItems = useMemo(
    () => buildItems(events, consultations, meals, suivi, bookings),
    [events, consultations, meals, suivi, bookings],
  );

  const items = useMemo(
    () => allItems.filter((it) => activeFilters[it.kind]),
    [allItems, activeFilters],
  );

  // Group by date
  const itemsByDate = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      if (!m.has(it.date)) m.set(it.date, []);
      m.get(it.date)!.push(it);
    }
    return m;
  }, [items]);

  // Upcoming + next race
  const upcoming = useMemo(
    () => items.filter((it) => it.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [items, today],
  );
  const nextRace = upcoming.find((it) => it.kind === "race");
  // Prefer a Calendly-booked consultation (real upcoming slot);
  // fall back to a CR whose date is still in the future.
  const nextConsult =
    upcoming.find((it) => it.kind === "consultation-booked") ||
    upcoming.find((it) => it.kind === "consultation");

  if (!loadedE || !loadedC || !loadedM || !loadedS) {
    return (
      <div>
        <PageHeader kicker="Vue d'ensemble" title="Calendrier" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  const weeks = monthMatrix(cursor.year, cursor.month);
  const prevMonth = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }));
  const nextMonth = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }));
  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(today);
  };

  const selectedItems = selectedDate ? itemsByDate.get(selectedDate) || [] : [];

  const racesUpcoming = upcoming.filter((i) => i.kind === "race");
  const consultsUpcoming = upcoming.filter(
    (i) => i.kind === "consultation" || i.kind === "consultation-booked",
  );

  const filterButton = (kind: CalendarItem["kind"], label: string) => (
    <button
      key={kind}
      onClick={() => setActiveFilters((f) => ({ ...f, [kind]: !f[kind] }))}
      className="btn-sm"
      style={{
        background: activeFilters[kind] ? KIND_COLORS[kind] : "transparent",
        color: activeFilters[kind] ? "#fff" : "var(--color-text-muted)",
        border: `1px solid ${activeFilters[kind] ? KIND_COLORS[kind] : "var(--color-border)"}`,
        padding: "4px 10px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      {KIND_ICONS[kind]} {label}
    </button>
  );

  return (
    <div>
      <PageHeader
        kicker="Vue d'ensemble"
        title="Calendrier"
        desc="Toutes les échéances importantes : courses, consultations, plans alimentaires, périodes pré-course (J-4 → Jour J)."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi
          label="Prochaine course"
          value={nextRace ? `J-${daysBetween(today, nextRace.date)}` : "—"}
          note={nextRace ? nextRace.title : "Aucune course prévue"}
          color="var(--color-primary)"
        />
        <Kpi
          label="Prochaine consultation"
          value={nextConsult ? `J-${daysBetween(today, nextConsult.date)}` : "—"}
          note={nextConsult ? fmtShort(nextConsult.date) : "—"}
          color="var(--color-dark)"
        />
        <Kpi label="Courses à venir" value={racesUpcoming.length} color="var(--color-primary)" />
        <Kpi label="Consultations à venir" value={consultsUpcoming.length} color="var(--color-dark)" />
      </div>

      {/* Filtres */}
      <div className="card p-3 mb-4">
        <div className="text-xs uppercase font-bold text-[var(--color-text-muted)] mb-2" style={{ letterSpacing: ".08em" }}>
          Filtres
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterButton("race", "Courses")}
          {filterButton("pre-race", "Pré-course (J-4 → J-1)")}
          {filterButton("consultation-booked", "Consultations programmées")}
          {filterButton("consultation", "Comptes rendus")}
          {filterButton("plan-start", "Début plan alim.")}
          {filterButton("plan-end", "Fin plan alim.")}
          {filterButton("suivi-start", "Début suivi")}
          {filterButton("suivi-end", "Fin suivi")}
        </div>
      </div>

      {/* Calendrier mensuel */}
      <div className="card overflow-hidden mb-5">
        <div className="bg-[var(--color-dark)] px-4 py-3 flex justify-between items-center flex-wrap gap-2" style={{ color: "#fff" }}>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>
              ◀
            </button>
            <div className="font-extrabold uppercase text-base" style={{ fontFamily: "var(--font-display)", minWidth: 180, textAlign: "center" }}>
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </div>
            <button onClick={nextMonth} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>
              ▶
            </button>
          </div>
          <button onClick={goToday} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>
            Aujourd&apos;hui
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[var(--color-text-muted)] py-2" style={{ background: "var(--color-surface-2)" }}>
          {DOW.map((d, i) => <div key={i}>{d}</div>)}
        </div>

        <div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7" style={{ borderTop: "1px solid var(--color-border)" }}>
              {week.map((d) => {
                const dayItems = itemsByDate.get(d) || [];
                const isCurrentMonth = parseISO(d).getMonth() === cursor.month;
                const isToday = d === today;
                const isSelected = d === selectedDate;
                const uniqueKinds = Array.from(new Set(dayItems.map((it) => it.kind)));
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d === selectedDate ? null : d)}
                    className="relative text-left"
                    style={{
                      minHeight: 78,
                      padding: 4,
                      background: isSelected ? "rgba(255,69,1,0.08)" : isToday ? "rgba(208,255,44,0.18)" : "#fff",
                      borderRight: "1px solid var(--color-border)",
                      opacity: isCurrentMonth ? 1 : 0.4,
                      cursor: "pointer",
                      transition: "background .15s",
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold" style={{ color: isToday ? "var(--color-primary)" : "var(--color-text)" }}>
                        {parseISO(d).getDate()}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[9px] font-bold rounded px-1" style={{ background: "var(--color-dark)", color: "#fff" }}>
                          {dayItems.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {uniqueKinds.slice(0, 4).map((k, i) => (
                        <span
                          key={i}
                          title={KIND_LABELS[k]}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: KIND_COLORS[k],
                            display: "inline-block",
                          }}
                        />
                      ))}
                    </div>
                    {dayItems.slice(0, 2).map((it, i) => (
                      <div
                        key={i}
                        className="text-[9px] truncate mt-0.5 rounded px-1"
                        style={{
                          background: it.color,
                          color: "#fff",
                          fontWeight: 600,
                        }}
                        title={it.title}
                      >
                        {it.title}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <div className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                        +{dayItems.length - 2} autre{dayItems.length - 2 > 1 ? "s" : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      {selectedDate && (
        <div className="card p-4 mb-5" style={{ borderLeft: "5px solid var(--color-primary)" }}>
          <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".08em" }}>
                {selectedDate === today ? "Aujourd'hui" : selectedDate < today ? "Passé" : "À venir"}
              </div>
              <div className="font-extrabold text-lg capitalize" style={{ fontFamily: "var(--font-display)" }}>
                {fmtLong(selectedDate)}
              </div>
            </div>
            <button onClick={() => setSelectedDate(null)} className="btn-ghost btn-xs">Fermer</button>
          </div>
          {selectedItems.length === 0 ? (
            <Empty>Aucun événement ce jour.</Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedItems.map((it, i) => (
                <Link
                  key={i}
                  href={it.href ? linkWithAthleteId(it.href) : "#"}
                  className="block rounded-lg p-3 hover:-translate-y-0.5 transition"
                  style={{ background: "var(--color-surface-2)", borderLeft: `4px solid ${it.color}` }}
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-sm font-bold">{it.icon} {it.title}</span>
                      {it.subtitle && <span className="text-xs text-[var(--color-text-muted)] ml-2">— {it.subtitle}</span>}
                    </div>
                    <span className="text-[10px] uppercase font-bold" style={{ color: it.color, letterSpacing: ".06em" }}>
                      {KIND_LABELS[it.kind]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste des 30 prochains jours */}
      <div className="card p-4">
        <div className="kicker mb-3">Prochains événements (30 jours)</div>
        {upcoming.length === 0 ? (
          <Empty>Aucun événement à venir.</Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming
              .filter((it) => daysBetween(today, it.date) <= 30)
              .map((it, i) => {
                const days = daysBetween(today, it.date);
                return (
                  <Link
                    key={i}
                    href={it.href ? linkWithAthleteId(it.href) : "#"}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)] transition"
                    style={{ borderLeft: `4px solid ${it.color}` }}
                  >
                    <div className="text-center" style={{ minWidth: 50 }}>
                      <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">
                        {days === 0 ? "Auj." : `J-${days}`}
                      </div>
                      <div className="text-xs">{fmtShort(it.date)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{it.icon} {it.title}</div>
                      {it.subtitle && (
                        <div className="text-xs text-[var(--color-text-muted)] truncate">{it.subtitle}</div>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-bold hidden sm:inline" style={{ color: it.color, letterSpacing: ".06em" }}>
                      {KIND_LABELS[it.kind]}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
