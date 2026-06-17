"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sport: string[] | null;
  level: string | null;
};

export function GlobalAthleteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [isCoach, setIsCoach] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Detect coach + load athletes once
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!coach) return;
      setIsCoach(true);
      const { data } = await supabase
        .from("athletes")
        .select("id, first_name, last_name, email, sport, level")
        .eq("coach_id", coach.id)
        .order("first_name");
      setAthletes((data as Athlete[]) || []);
    })();
  }, []);

  // Global keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    if (!isCoach) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCoach]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return athletes.slice(0, 8);
    return athletes
      .filter((a) => {
        const fields = [
          a.first_name,
          a.last_name,
          a.email,
          a.level || "",
          ...(a.sport || []),
        ];
        return fields.some((f) => f.toLowerCase().includes(q));
      })
      .slice(0, 12);
  }, [athletes, query]);

  if (!isCoach) return null;

  const onSelect = (a: Athlete) => {
    router.push(`/coach/athletes/${a.id}`);
    setOpen(false);
  };

  const onKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const a = filtered[highlight];
      if (a) onSelect(a);
    }
  };

  return (
    <>
      {/* Floating button (always visible for coach) */}
      <button
        onClick={() => setOpen(true)}
        title="Rechercher un athlète (⌘K)"
        className="fixed z-40 rounded-full shadow-lg flex items-center justify-center"
        style={{
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          background: "var(--color-primary)",
          color: "#fff",
          border: "none",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        🔍
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-xl overflow-hidden"
            style={{ background: "var(--color-surface)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <span className="text-lg pl-1">🔍</span>
              <input
                ref={inputRef}
                className="input"
                placeholder="Rechercher un athlète…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onKeyDownInput}
                style={{ border: "none", background: "transparent", flex: 1, fontSize: 16 }}
                autoComplete="off"
              />
              <span className="text-[10px] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                ESC
              </span>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
                  {query ? `Aucun athlète trouvé pour « ${query} »` : "Aucun athlète."}
                </div>
              ) : (
                filtered.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    onMouseEnter={() => setHighlight(i)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition"
                    style={{
                      background: i === highlight ? "var(--color-surface-2)" : "transparent",
                      borderLeft: i === highlight ? "3px solid var(--color-primary)" : "3px solid transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold shrink-0"
                      style={{ background: "var(--color-primary)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 12 }}
                    >
                      {a.first_name[0]}
                      {a.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {a.first_name} {a.last_name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] truncate">
                        {a.email}
                        {a.sport && a.sport.length > 0 && ` · ${a.sport.join(" / ")}`}
                        {a.level && ` · ${a.level}`}
                      </div>
                    </div>
                    {i === highlight && (
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">↵</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="text-[10px] text-[var(--color-text-muted)] px-3 py-2 flex justify-between"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <span>↑↓ pour naviguer · ↵ pour ouvrir</span>
              <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""} · ⌘K</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
