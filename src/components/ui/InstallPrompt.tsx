"use client";

import { useEffect, useState } from "react";

// Minimal type for the beforeinstallprompt event (Chrome / Edge / Android)
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nutriocus_install_dismissed_until";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden until we know

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already in standalone (installed) → hide
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari uses navigator.standalone
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) {
      setDismissed(true);
      return;
    }

    // Respect a previous dismiss for 14 days
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && Date.now() < until) {
        setDismissed(true);
        return;
      }
    } catch { /* localStorage unavailable */ }

    setDismissed(false);

    // Android / Chromium / Edge: capture native install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari: no programmatic install — show a tip
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos && isSafari) {
      setShowIosTip(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    } catch { /* ignore */ }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
      setDismissed(true);
    }
  };

  if (dismissed) return null;
  if (!deferred && !showIosTip) return null;

  return (
    <div
      className="card p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
      style={{ borderLeft: "5px solid var(--color-primary)", background: "#fff7f3" }}
    >
      <div className="text-3xl shrink-0">📱</div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-sm uppercase" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
          Installe NUTRIOCUS sur ton appareil
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {deferred
            ? "Accède à ta plateforme en 1 clic depuis ton écran d'accueil, même en zone faible réseau."
            : "Sur iPhone/iPad : appuie sur le bouton Partager (carré + flèche), puis « Sur l'écran d'accueil »."}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {deferred && (
          <button onClick={install} className="btn-primary btn-sm">
            Installer
          </button>
        )}
        <button onClick={dismiss} className="btn-ghost btn-sm">
          Plus tard
        </button>
      </div>
    </div>
  );
}
