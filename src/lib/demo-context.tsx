"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type DemoSnapshot = {
  athlete: { id: string; first_name: string; last_name: string };
  athleteData: Record<string, unknown>;
  coachData: Record<string, unknown>;
};

type DemoCtx = {
  ready: boolean;
  error: string | null;
  snapshot: DemoSnapshot | null;
};

const Ctx = createContext<DemoCtx | null>(null);

export const DEMO_CTA_URL =
  "https://calendly.com/nutriocus/appel-telephonique-suivi-du-sportif";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/demo/snapshot", { cache: "force-cache" });
        if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
        const json = (await res.json()) as DemoSnapshot;
        if (!mounted) return;
        setSnapshot(json);
        setReady(true);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Snapshot error");
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Ctx.Provider value={{ ready, error, snapshot }}>{children}</Ctx.Provider>
  );
}

export function useDemoCtx(): DemoCtx | null {
  return useContext(Ctx);
}

/** True when called from inside a <DemoProvider> subtree. */
export function useIsDemo(): boolean {
  return useContext(Ctx) !== null;
}
