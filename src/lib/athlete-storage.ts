"use client";

import { supabase } from "./supabase";

// ============================================================
// Storage layer for athlete data — uses Supabase JSONB blobs
// ============================================================

let _currentAthleteId: string | null = null;
let _resolvingAthleteId: Promise<string | null> | null = null;

/**
 * Resolve the athlete id of the currently logged-in user.
 * If the user is a coach viewing another athlete's data,
 * pass `overrideId` explicitly.
 */
export async function getCurrentAthleteId(
  overrideId?: string,
): Promise<string | null> {
  if (overrideId) return overrideId;
  if (_currentAthleteId) return _currentAthleteId;
  if (_resolvingAthleteId) return _resolvingAthleteId;

  _resolvingAthleteId = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (athlete) {
      _currentAthleteId = athlete.id;
      return athlete.id;
    }
    return null;
  })();

  const id = await _resolvingAthleteId;
  _resolvingAthleteId = null;
  return id;
}

export function resetCurrentAthleteId() {
  _currentAthleteId = null;
  _resolvingAthleteId = null;
}

/**
 * Load a data blob by key.
 */
export async function loadData<T>(
  key: string,
  defaultValue: T,
  athleteId?: string,
): Promise<T> {
  const id = await getCurrentAthleteId(athleteId);
  if (!id) return defaultValue;

  const { data, error } = await supabase
    .from("athlete_data")
    .select("data")
    .eq("athlete_id", id)
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return defaultValue;
  return (data.data as T) ?? defaultValue;
}

/**
 * Save a data blob by key.
 */
export async function saveData<T>(
  key: string,
  value: T,
  athleteId?: string,
): Promise<boolean> {
  const id = await getCurrentAthleteId(athleteId);
  if (!id) return false;

  const { error } = await supabase
    .from("athlete_data")
    .upsert({ athlete_id: id, key, data: value as object });

  return !error;
}

/**
 * React hook: synced state backed by Supabase JSONB blob.
 * Loads initial value, persists on every change (debounced).
 */
import { useEffect, useRef, useState } from "react";

export function useAthleteData<T>(
  key: string,
  defaultValue: T,
  athleteId?: string,
): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadData<T>(key, defaultValue, athleteId);
      if (mounted) {
        skipNextSave.current = true;
        setValue(loaded);
        setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, athleteId]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveData(key, value, athleteId);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loaded, key, athleteId]);

  return [value, setValue, loaded];
}
