"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field, Badge } from "@/components/ui/PageHeader";

type Test = {
  id: string;
  date: string;
  discipline: "Course" | "Trail" | "Cyclisme" | "Triathlon";
  type: "glucides" | "hydrique";
  valeur: number | string;
  duree: string;
  ressenti: "bien" | "limite" | "mal";
  rpe: string;
  produits: string;
  notes: string;
};

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const dateShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

const RESSENTI_INFO: Record<string, { label: string; variant: "green" | "orange" | "red" }> = {
  bien: { label: "Bien toléré", variant: "green" },
  limite: { label: "Limite", variant: "orange" },
  mal: { label: "Mal toléré", variant: "red" },
};

const blank = (): Test => ({
  id: newId(),
  date: today(),
  discipline: "Course",
  type: "glucides",
  valeur: "",
  duree: "",
  ressenti: "bien",
  rpe: "",
  produits: "",
  notes: "",
});

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function TolerancePage() {
  const [tests, setTests, loaded] = useAthleteData<Test[]>("tol", []);
  const [profile] = useAthleteData<{ cafeineValidee?: boolean; tolGlucCAP?: number | string; tolHydrCAP?: number | string }>(
    "profile",
    {},
  );
  const [draft, setDraft] = useState<Test>(blank());

  const update = (k: keyof Test, v: Test[keyof Test]) => setDraft((d) => ({ ...d, [k]: v as never }));

  const add = () => {
    if (!draft.valeur) return;
    setTests((p) =>
      [...p, { ...draft, id: newId(), valeur: toNum(draft.valeur) }].sort((a, b) => (a.date < b.date ? 1 : -1)),
    );
    setDraft(blank());
  };

  const remove = (id: string) => setTests((p) => p.filter((t) => t.id !== id));

  function maxFor(type: string, disc?: string) {
    const filtered = tests.filter(
      (t) => t.type === type && t.ressenti === "bien" && (!disc || t.discipline === disc),
    );
    return filtered.length ? Math.max(...filtered.map((t) => toNum(t.valeur))) : null;
  }

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Nutrition à l'effort" title="Tests de tolérance digestive" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Nutrition à l'effort"
        title="Tests de tolérance digestive"
        desc="Glucides (g/h) et hydrique (ml/h) par discipline, avec RPE digestif. Le niveau = la meilleure valeur bien tolérée."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi
          label="Tol. glucides — Course/Trail"
          value={maxFor("glucides", "Course") ?? maxFor("glucides", "Trail") ?? profile.tolGlucCAP ?? "—"}
          unit="g/h"
          color="var(--color-primary)"
        />
        <Kpi
          label="Tol. hydrique — Course/Trail"
          value={maxFor("hydrique", "Course") ?? maxFor("hydrique", "Trail") ?? profile.tolHydrCAP ?? "—"}
          unit="ml/h"
          color="var(--color-dark)"
        />
        <Kpi
          label="Tol. glucides — Cyclisme"
          value={maxFor("glucides", "Cyclisme") ?? "—"}
          unit="g/h"
          color="var(--color-success)"
        />
        <Kpi label="Caféine validée" value={profile.cafeineValidee ? "Oui" : "Non"} color="#8a8a88" />
      </div>

      <div className="card p-4 mb-4">
        <div className="font-extrabold mb-3">Nouveau test</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => update("date", e.target.value)} /></Field>
          <Field label="Discipline">
            <select className="input" value={draft.discipline} onChange={(e) => update("discipline", e.target.value as Test["discipline"])}>
              <option>Course</option><option>Trail</option><option>Cyclisme</option><option>Triathlon</option>
            </select>
          </Field>
          <Field label="Type">
            <select className="input" value={draft.type} onChange={(e) => update("type", e.target.value as Test["type"])}>
              <option value="glucides">glucides</option>
              <option value="hydrique">hydrique</option>
            </select>
          </Field>
          <Field label={draft.type === "glucides" ? "Valeur (g/h)" : "Valeur (ml/h)"}>
            <input className="input" value={draft.valeur} onChange={(e) => update("valeur", e.target.value)} />
          </Field>
          <Field label="Durée d'effort"><input className="input" value={draft.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
          <Field label="Ressenti">
            <select className="input" value={draft.ressenti} onChange={(e) => update("ressenti", e.target.value as Test["ressenti"])}>
              <option value="bien">bien</option>
              <option value="limite">limite</option>
              <option value="mal">mal</option>
            </select>
          </Field>
          <Field label="RPE digestif /5"><input className="input" value={draft.rpe} onChange={(e) => update("rpe", e.target.value)} /></Field>
          <Field label="Produits utilisés"><input className="input" value={draft.produits} onChange={(e) => update("produits", e.target.value)} /></Field>
        </div>
        <Field label="Notes">
          <input className="input mt-2" value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
        </Field>
        <div className="flex justify-end mt-3">
          <button onClick={add} className="btn-primary">Ajouter</button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {tests.map((t) => {
          const info = RESSENTI_INFO[t.ressenti];
          return (
            <div
              key={t.id}
              className="card flex items-center gap-3 px-4 py-3 flex-wrap"
              style={{ borderLeft: `5px solid ${info.variant === "green" ? "var(--color-success)" : info.variant === "orange" ? "var(--color-primary)" : "var(--color-danger)"}` }}
            >
              <div style={{ minWidth: 80, fontWeight: 700, fontSize: 13 }}>{dateShort(t.date)}</div>
              <div style={{ minWidth: 70, color: "var(--color-text-muted)", fontSize: 12 }}>{t.discipline}</div>
              <div className="font-display font-extrabold text-xl">
                {String(t.valeur)}
                <span className="text-xs text-[var(--color-text-muted)] ml-1">
                  {t.type === "glucides" ? "g/h" : "ml/h"}
                </span>
              </div>
              {t.duree && <div className="text-xs text-[var(--color-text-muted)]">{t.duree}</div>}
              <Badge variant={info.variant}>{info.label}</Badge>
              {t.rpe && <div className="text-xs text-[var(--color-danger)]">RPE {t.rpe}/5</div>}
              <div className="flex-1 text-xs text-[var(--color-text-muted)] italic" style={{ minWidth: 120 }}>
                {t.produits} {t.notes}
              </div>
              <button onClick={() => remove(t.id)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 15 }}>
                ✕
              </button>
            </div>
          );
        })}
        {tests.length === 0 && <Empty>Aucun test enregistré.</Empty>}
      </div>
    </div>
  );
}
