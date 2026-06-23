"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Badge } from "@/components/ui/PageHeader";

type SportKey = "trail" | "triathlon" | "cyclisme" | "route" | "autre";

type EventItem = {
  id: string;
  date: string;
  /** Optional end date for multi-day stage races (course à étapes). */
  endDate?: string;
  name: string;
  sport: SportKey;
  type: "objectif" | "test";
  phase: "Intersaison" | "Préparation" | "Compétition" | "Récupération";
  notes: string;
};

type Phase = {
  id: string;
  label: "Intersaison" | "Préparation" | "Compétition" | "Récupération";
  start: number;
  end: number;
};

const SPORTS: { k: SportKey; label: string; ic: string }[] = [
  { k: "trail", label: "Trail", ic: "⛰️" },
  { k: "triathlon", label: "Triathlon", ic: "🏊" },
  { k: "cyclisme", label: "Cyclisme", ic: "🚴" },
  { k: "route", label: "Course sur route", ic: "🏃" },
  { k: "autre", label: "Autre", ic: "🎯" },
];

const PHASE_COLORS: Record<string, string> = {
  Intersaison: "#787876",
  Préparation: "#0a0a0a",
  Compétition: "#FF4501",
  Récupération: "#5f8c0a",
};

const DEFAULT_PHASES: Phase[] = [
  { id: "p1", label: "Intersaison", start: 1, end: 4 },
  { id: "p2", label: "Préparation", start: 5, end: 18 },
  { id: "p3", label: "Compétition", start: 19, end: 30 },
  { id: "p4", label: "Récupération", start: 31, end: 34 },
  { id: "p5", label: "Préparation", start: 35, end: 48 },
];

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function daysFromToday(dateStr: string): number {
  return Math.ceil((+new Date(dateStr + "T00:00:00") - +new Date(today() + "T00:00:00")) / 86400000);
}
function daysBetween(a: string, b: string): number {
  // inclusive count (jour début + jour fin = 2)
  return Math.round((+new Date(b + "T00:00:00") - +new Date(a + "T00:00:00")) / 86400000) + 1;
}
const dateLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function SeasonPage() {
  const [events, setEvents, loaded] = useAthleteData<EventItem[]>("events", []);
  const [phases, setPhases, loadedP] = useAthleteData<Phase[]>("phases", DEFAULT_PHASES);
  const [seasonStart, setSeasonStart, loadedS] = useAthleteData<string>("seasonStart", "2025-11-03");

  const [draft, setDraft] = useState<EventItem>({
    id: "",
    date: "",
    name: "",
    sport: "trail",
    type: "objectif",
    phase: "Préparation",
    notes: "",
  });
  const [multiDay, setMultiDay] = useState(false);
  const [phaseDraft, setPhaseDraft] = useState<{ label: Phase["label"]; start: string; end: string }>({
    label: "Préparation",
    start: "",
    end: "",
  });

  function addEvent() {
    if (!draft.date || !draft.name) return;
    const sport = SPORTS.find((s) => s.label === draft.sport)?.k ?? draft.sport;
    // Strip endDate if multi-day not selected OR if endDate is empty/before start
    const validEnd = multiDay && draft.endDate && draft.endDate >= draft.date ? draft.endDate : undefined;
    setEvents((p) => [...p, { ...draft, id: newId(), sport: sport as SportKey, endDate: validEnd }]);
    setDraft({ id: "", date: "", name: "", sport: "trail", type: "objectif", phase: "Préparation", notes: "" });
    setMultiDay(false);
  }
  function removeEvent(id: string) {
    setEvents((p) => p.filter((e) => e.id !== id));
  }
  function addPhase() {
    if (!phaseDraft.start || !phaseDraft.end) return;
    setPhases((p) => [...p, { ...phaseDraft, id: newId(), start: toNum(phaseDraft.start), end: toNum(phaseDraft.end) }]);
    setPhaseDraft({ label: "Préparation", start: "", end: "" });
  }
  function removePhase(id: string) {
    setPhases((p) => p.filter((ph) => ph.id !== id));
  }

  function weekFromDate(d: string): number {
    return Math.floor((+new Date(d + "T00:00:00") - +new Date(seasonStart + "T00:00:00")) / 604800000) + 1;
  }

  const sortedEvents = [...events].sort((a, b) => (a.date < b.date ? -1 : 1));
  const upcoming = sortedEvents.filter((e) => daysFromToday(e.date) >= 0);
  const past = sortedEvents.filter((e) => daysFromToday(e.date) < 0).reverse();

  const totalWeeks = 53;
  const weekWidth = 26;
  const currentWeek = weekFromDate(today());

  if (!loaded || !loadedP || !loadedS) {
    return (
      <div>
        <PageHeader kicker="Structurer ton quotidien" title="Planification de la saison" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Structurer ton quotidien"
        title="Planification de la saison"
        desc="Vue d'ensemble de l'année : phases, semaines, objectifs et position actuelle d'un coup d'œil."
      />

      <div className="card p-4 mb-4 overflow-hidden">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
          <div className="font-extrabold">Frise chronologique</div>
          <Field label="Début de saison">
            <input
              type="date"
              className="input"
              style={{ width: 160 }}
              value={seasonStart}
              onChange={(e) => setSeasonStart(e.target.value)}
            />
          </Field>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative" style={{ width: totalWeeks * weekWidth, height: 150, minWidth: "100%" }}>
            {phases.map((p) => (
              <div
                key={p.id}
                title={p.label}
                className="absolute"
                style={{
                  left: (p.start - 1) * weekWidth,
                  top: 30,
                  width: (p.end - p.start + 1) * weekWidth,
                  height: 26,
                  background: PHASE_COLORS[p.label],
                  opacity: 0.22,
                  borderRadius: 5,
                }}
              />
            ))}
            {phases.map((p) => (
              <div
                key={p.id + "l"}
                className="absolute"
                style={{
                  left: (p.start - 1) * weekWidth + 4,
                  top: 33,
                  fontSize: 10,
                  fontWeight: 700,
                  color: PHASE_COLORS[p.label],
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: (p.end - p.start + 1) * weekWidth - 6,
                }}
              >
                {p.label}
              </div>
            ))}
            {Array.from({ length: totalWeeks }).map((_, w) => (
              <div key={w} className="absolute text-center" style={{ left: w * weekWidth, top: 62, width: weekWidth }}>
                {(w + 1) % 4 === 0 && (
                  <div className="text-[var(--color-text-muted)]" style={{ fontSize: 9 }}>
                    S{w + 1}
                  </div>
                )}
                <div className="h-1.5 w-px mx-auto mt-0.5 bg-[var(--color-border)]" />
              </div>
            ))}
            {currentWeek >= 1 && currentWeek <= totalWeeks && (
              <div
                className="absolute bg-[var(--color-primary)]"
                style={{ left: (currentWeek - 0.5) * weekWidth, top: 24, bottom: 30, width: 2 }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    left: -14,
                    fontSize: 9,
                    fontWeight: 800,
                    color: "var(--color-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Auj.
                </div>
              </div>
            )}
            {events.map((e) => {
              const w = weekFromDate(e.date);
              if (w < 1 || w > totalWeeks) return null;
              const isObj = e.type === "objectif";
              const wEnd = e.endDate ? weekFromDate(e.endDate) : w;
              const isMultiDay = !!e.endDate && wEnd > w;
              const bandWidth = isMultiDay ? (wEnd - w + 1) * weekWidth - 4 : 14;
              const left = isMultiDay ? (w - 1) * weekWidth + 2 : (w - 0.5) * weekWidth - 7;
              const dateLabel = isMultiDay && e.endDate
                ? `${e.name} — du ${dateLong(e.date)} au ${dateLong(e.endDate)}`
                : `${e.name} — ${dateLong(e.date)}`;
              return (
                <div
                  key={e.id}
                  title={dateLabel}
                  className="absolute"
                  style={{ left, top: 92 }}
                >
                  <div
                    style={{
                      width: bandWidth,
                      height: 14,
                      background: isObj ? "var(--color-primary)" : "var(--color-success)",
                      border: "2px solid #fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      borderRadius: isMultiDay ? 7 : "50%",
                    }}
                  />
                  <div
                    className="mt-1"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      transform: "rotate(35deg)",
                      transformOrigin: "left top",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name.slice(0, 16)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3.5 flex-wrap text-xs text-[var(--color-text-muted)] mt-2">
          {(["Intersaison", "Préparation", "Compétition", "Récupération"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span style={{ width: 11, height: 11, borderRadius: 3, background: PHASE_COLORS[p], opacity: 0.5 }} />
              {p}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--color-primary)" }} />
            Objectif
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--color-success)" }} />
            Test
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <div className="font-extrabold mb-3">Ajouter un objectif / test</div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={multiDay ? "Date début" : "Date"}>
              <input type="date" className="input" value={draft.date}
                     onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="Nom"><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Sport">
              <select className="input" value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value as SportKey })}>
                {SPORTS.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select className="input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as EventItem["type"] })}>
                <option value="objectif">objectif</option>
                <option value="test">test</option>
              </select>
            </Field>
          </div>

          {/* Multi-day toggle */}
          <div className="mt-2.5 p-2 rounded-lg" style={{ background: "var(--color-surface-2)", border: "1px dashed var(--color-border)" }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={multiDay}
                onChange={(e) => {
                  setMultiDay(e.target.checked);
                  if (!e.target.checked) setDraft({ ...draft, endDate: undefined });
                }}
                style={{ width: 16, height: 16 }}
              />
              <span className="text-sm">📅 Course à étapes / multi-jours</span>
            </label>
            {multiDay && (
              <div className="mt-2">
                <Field label="Date de fin">
                  <input
                    type="date"
                    className="input"
                    value={draft.endDate || ""}
                    min={draft.date || undefined}
                    onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                  />
                </Field>
                {draft.date && draft.endDate && draft.endDate >= draft.date && (
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Durée totale : <b>{daysBetween(draft.date, draft.endDate)} jours</b>
                  </div>
                )}
              </div>
            )}
          </div>

          <Field label="Notes"><input className="input mt-2.5" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
          <div className="flex justify-end mt-2.5">
            <button onClick={addEvent} className="btn-primary">Ajouter</button>
          </div>
        </div>

        <div className="card p-4">
          <div className="font-extrabold mb-3">Phases (semaines)</div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_70px_70px_auto] gap-2 items-end">
            <Field label="Phase">
              <select className="input" value={phaseDraft.label} onChange={(e) => setPhaseDraft({ ...phaseDraft, label: e.target.value as Phase["label"] })}>
                <option>Intersaison</option><option>Préparation</option><option>Compétition</option><option>Récupération</option>
              </select>
            </Field>
            <Field label="Sem. début"><input className="input" value={phaseDraft.start} onChange={(e) => setPhaseDraft({ ...phaseDraft, start: e.target.value })} /></Field>
            <Field label="Sem. fin"><input className="input" value={phaseDraft.end} onChange={(e) => setPhaseDraft({ ...phaseDraft, end: e.target.value })} /></Field>
            <button onClick={addPhase} className="btn-primary">+</button>
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {phases.sort((a, b) => a.start - b.start).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span style={{ width: 11, height: 11, borderRadius: 3, background: PHASE_COLORS[p.label] }} />
                <span className="flex-1">{p.label} · S{p.start}–S{p.end}</span>
                <button onClick={() => removePhase(p.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <>
          <div className="font-extrabold mb-2.5 mt-2">À venir</div>
          <div className="flex flex-col gap-2.5 mb-6">
            {upcoming.map((e) => {
              const d = daysFromToday(e.date);
              const isObj = e.type === "objectif";
              const sport = SPORTS.find((s) => s.k === e.sport) || SPORTS[4];
              const w = weekFromDate(e.date);
              return (
                <div
                  key={e.id}
                  className="card flex items-center gap-3.5 px-4 py-3 flex-wrap"
                  style={{ borderLeft: `5px solid ${isObj ? "var(--color-primary)" : "var(--color-success)"}` }}
                >
                  <div className="text-2xl">{sport.ic}</div>
                  <div className="flex-1" style={{ minWidth: 160 }}>
                    <div className="font-extrabold text-base flex items-center gap-2 flex-wrap">
                      {e.name}
                      <Badge variant={isObj ? "orange" : "green"}>{isObj ? "Objectif" : "Test"}</Badge>
                      <Badge variant="dark">S{w}</Badge>
                      {e.endDate && (
                        <Badge variant="dark">
                          📅 {daysBetween(e.date, e.endDate)} jours
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {sport.label} ·{" "}
                      {e.endDate
                        ? `Du ${dateLong(e.date)} au ${dateLong(e.endDate)}`
                        : dateLong(e.date)}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </div>
                  </div>
                  <div className="font-display font-extrabold text-2xl" style={{ color: isObj ? "var(--color-primary)" : "var(--color-success)" }}>
                    {d === 0 ? "J" : "J-" + d}
                  </div>
                  <button onClick={() => removeEvent(e.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <div className="font-extrabold text-[var(--color-text-muted)] mb-2.5 mt-2">Passés</div>
          <div className="flex flex-col gap-2.5 opacity-65">
            {past.map((e) => {
              const sport = SPORTS.find((s) => s.k === e.sport) || SPORTS[4];
              return (
                <div key={e.id} className="card flex items-center gap-3.5 px-4 py-3">
                  <div className="text-xl">{sport.ic}</div>
                  <div className="flex-1">
                    <div className="font-bold">{e.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {e.endDate
                        ? `Du ${dateLong(e.date)} au ${dateLong(e.endDate)} · ${daysBetween(e.date, e.endDate)} jours`
                        : dateLong(e.date)}
                    </div>
                  </div>
                  <button onClick={() => removeEvent(e.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {events.length === 0 && <Empty>Aucun événement planifié.</Empty>}
    </div>
  );
}
