"use client";

import { supabase } from "./supabase";

// =====================================================================
// Storage layer for COACH-SHARED data (e.g. Academy library).
// Backed by a `coach_data` table (1 row per (coach_id, key)) with RLS
// that lets the coach read/write their own data and lets the coach's
// athletes READ that same data (so the shared library is visible to all).
// =====================================================================

let _resolved: { coachId: string | null } | null = null;
let _resolving: Promise<{ coachId: string | null }> | null = null;

/**
 * Resolves the coach_id for the current authenticated user — whether
 * they are themselves a coach (direct lookup), or an athlete (then we
 * use their `coach_id` foreign key).
 *
 * When the user is a coach viewing an athlete via ?athleteId=..., we
 * still want THEIR coach_id (not the athlete's coach), so we always
 * prefer the coach lookup first.
 */
export async function resolveCoachId(): Promise<string | null> {
  if (_resolved) return _resolved.coachId;
  if (_resolving) return (await _resolving).coachId;

  _resolving = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { coachId: null };

    // 1. Try as coach
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (coach) {
      return { coachId: coach.id };
    }

    // 2. Otherwise, look up via athlete
    const { data: athlete } = await supabase
      .from("athletes")
      .select("coach_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (athlete?.coach_id) {
      return { coachId: athlete.coach_id as string };
    }
    return { coachId: null };
  })();

  const v = await _resolving;
  _resolved = v;
  _resolving = null;
  return v.coachId;
}

export function resetCoachIdCache() {
  _resolved = null;
  _resolving = null;
}

export async function loadCoachData<T>(key: string, defaultValue: T): Promise<T> {
  const coachId = await resolveCoachId();
  if (!coachId) return defaultValue;

  const { data, error } = await supabase
    .from("coach_data")
    .select("data")
    .eq("coach_id", coachId)
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return defaultValue;
  return (data.data as T) ?? defaultValue;
}

export async function saveCoachData<T>(key: string, value: T): Promise<boolean> {
  const coachId = await resolveCoachId();
  if (!coachId) return false;

  const { error } = await supabase
    .from("coach_data")
    .upsert({ coach_id: coachId, key, data: value as object });

  return !error;
}

// ============== React hook ==============
import { useEffect, useRef, useState } from "react";

export function useCoachData<T>(
  key: string,
  defaultValue: T,
): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const next = await loadCoachData<T>(key, defaultValue);
      if (mounted) {
        skipNextSave.current = true;
        setValue(next);
        setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCoachData(key, value);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded, key]);

  return [value, setValue, loaded];
}
