"use client";

import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Field, Kpi } from "@/components/ui/PageHeader";
import { useState, useEffect } from "react";

type Profile = {
  sexe: string;
  discipline: string;
  taille: number | string;
  age: number | string;
  poids: number | string;
  fcmax: number | string;
  vo2max: number | string;
  sv1: number | string;
  sv2: number | string;
  rerSV1: number | string;
  rerSV2: number | string;
  vo2SV1: number | string;
  vo2SV2: number | string;
  masseMaigre: number | string;
  reservesGlucides: number | string;
  poidsObjectif: number | string;
  tolGlucCAP: number | string;
  tolHydrCAP: number | string;
  tolGlucCyc: number | string;
  tolHydrCyc: number | string;
  cafeineValidee: boolean;
  photo: string;
};

const DEFAULT: Profile = {
  sexe: "Homme",
  discipline: "Trail",
  taille: 1.82,
  age: 27,
  poids: 71,
  fcmax: 190,
  vo2max: 62,
  sv1: 167,
  sv2: 176,
  rerSV1: 0.85,
  rerSV2: 0.93,
  vo2SV1: 42,
  vo2SV2: 54,
  masseMaigre: 62,
  reservesGlucides: 850,
  poidsObjectif: 69.1,
  tolGlucCAP: 120,
  tolHydrCAP: 1000,
  tolGlucCyc: 120,
  tolHydrCyc: 1000,
  cafeineValidee: true,
  photo: "",
};

function toNum(v: number | string): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function metabolismeBase(p: Profile): number {
  const t = toNum(p.poids);
  const r = toNum(p.taille);
  const n = toNum(p.age);
  if (p.sexe === "Femme") return 9.74 * t + 172.9 * r - 4.737 * n + 667.051;
  return 13.707 * t + 492.3 * r - 6.673 * n + 77.607;
}

function compressImage(file: File, max: number, cb: (data: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new window.Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > max) {
          h = (h * max) / w;
          w = max;
        }
      } else if (h > max) {
        w = (w * max) / h;
        h = max;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      try {
        cb(c.toDataURL("image/jpeg", 0.82));
      } catch {
        cb(reader.result as string);
      }
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

export default function ProfilePage() {
  const [profile, setProfile, loaded] = useAthleteData<Profile>("profile", DEFAULT);
  const [local, setLocal] = useState<Profile>(DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) setLocal(profile);
  }, [loaded, profile]);

  const update = (k: keyof Profile, v: Profile[keyof Profile]) =>
    setLocal((p) => ({ ...p, [k]: v }));

  if (!loaded)
    return (
      <div>
        <PageHeader kicker="Profil athlète" title="Mon profil" />
        <div className="card p-10 text-center text-[var(--color-text-muted)]">
          Chargement…
        </div>
      </div>
    );

  const onSave = () => {
    const cleaned: Profile = { ...local };
    [
      "taille",
      "age",
      "poids",
      "fcmax",
      "vo2max",
      "sv1",
      "sv2",
      "rerSV1",
      "rerSV2",
      "vo2SV1",
      "vo2SV2",
      "masseMaigre",
      "reservesGlucides",
      "poidsObjectif",
      "tolGlucCAP",
      "tolHydrCAP",
      "tolGlucCyc",
      "tolHydrCyc",
    ].forEach((k) => {
      (cleaned as unknown as Record<string, number>)[k] = toNum(
        local[k as keyof Profile] as number,
      );
    });
    setProfile(cleaned);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader
        kicker="Profil athlète"
        title="Mon profil"
        desc="Ces variables alimentent tous les calculs : métabolisme de base, profil physiologique, dépenses en course, score de disponibilité énergétique."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="card p-5">
          <div className="font-extrabold mb-3">Données générales</div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-[74px] h-[74px] rounded-full overflow-hidden bg-[var(--color-surface-2)] flex items-center justify-center flex-shrink-0"
              style={{ border: "2px solid var(--color-border)" }}
            >
              {local.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={local.photo} alt="profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-[var(--color-text-muted)]">👤</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="btn-dark btn-sm cursor-pointer">
                Importer une photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    compressImage(f, 320, (d) => {
                      setLocal((p) => ({ ...p, photo: d }));
                      setProfile((p) => ({ ...p, photo: d }));
                    });
                  }}
                />
              </label>
              {local.photo && (
                <button
                  onClick={() => {
                    setLocal((p) => ({ ...p, photo: "" }));
                    setProfile((p) => ({ ...p, photo: "" }));
                  }}
                  className="text-xs text-[var(--color-danger)] text-left p-0"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  Retirer la photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Sexe">
              <select className="input" value={local.sexe} onChange={(e) => update("sexe", e.target.value)}>
                <option>Homme</option>
                <option>Femme</option>
              </select>
            </Field>
            <Field label="Discipline">
              <select className="input" value={local.discipline} onChange={(e) => update("discipline", e.target.value)}>
                <option>Trail</option>
                <option>Course</option>
                <option>Cyclisme</option>
                <option>Triathlon</option>
                <option>Natation</option>
              </select>
            </Field>
            <Field label="Taille (m)"><input className="input" value={local.taille} onChange={(e) => update("taille", e.target.value)} /></Field>
            <Field label="Âge (ans)"><input className="input" value={local.age} onChange={(e) => update("age", e.target.value)} /></Field>
            <Field label="Poids (kg)"><input className="input" value={local.poids} onChange={(e) => update("poids", e.target.value)} /></Field>
            <Field label="Poids objectif (kg)"><input className="input" value={local.poidsObjectif} onChange={(e) => update("poidsObjectif", e.target.value)} /></Field>
            <Field label="Masse maigre (kg)"><input className="input" value={local.masseMaigre} onChange={(e) => update("masseMaigre", e.target.value)} /></Field>
            <Field label="Réserves glucides (g)"><input className="input" value={local.reservesGlucides} onChange={(e) => update("reservesGlucides", e.target.value)} /></Field>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-extrabold mb-3">Données physiologiques</div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="FCmax (bpm)"><input className="input" value={local.fcmax} onChange={(e) => update("fcmax", e.target.value)} /></Field>
            <Field label="VO₂max (ml/kg/min)"><input className="input" value={local.vo2max} onChange={(e) => update("vo2max", e.target.value)} /></Field>
            <Field label="SV1 (bpm)"><input className="input" value={local.sv1} onChange={(e) => update("sv1", e.target.value)} /></Field>
            <Field label="SV2 (bpm)"><input className="input" value={local.sv2} onChange={(e) => update("sv2", e.target.value)} /></Field>
            <Field label="RER à SV1"><input className="input" value={local.rerSV1} onChange={(e) => update("rerSV1", e.target.value)} /></Field>
            <Field label="RER à SV2"><input className="input" value={local.rerSV2} onChange={(e) => update("rerSV2", e.target.value)} /></Field>
            <Field label="VO₂ à SV1"><input className="input" value={local.vo2SV1} onChange={(e) => update("vo2SV1", e.target.value)} /></Field>
            <Field label="VO₂ à SV2"><input className="input" value={local.vo2SV2} onChange={(e) => update("vo2SV2", e.target.value)} /></Field>
          </div>

          <div className="mt-4">
            <Kpi
              label="Métabolisme de base estimé"
              value={Math.round(metabolismeBase(local))}
              unit="kcal"
              color="var(--color-primary)"
            />
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="font-extrabold mb-3">Tolérances de référence & caféine</div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          <Field label="Tol. glucides CAP/Trail (g/h)"><input className="input" value={local.tolGlucCAP} onChange={(e) => update("tolGlucCAP", e.target.value)} /></Field>
          <Field label="Tol. hydrique CAP/Trail (ml/h)"><input className="input" value={local.tolHydrCAP} onChange={(e) => update("tolHydrCAP", e.target.value)} /></Field>
          <Field label="Tol. glucides cyclisme (g/h)"><input className="input" value={local.tolGlucCyc} onChange={(e) => update("tolGlucCyc", e.target.value)} /></Field>
          <Field label="Tol. hydrique cyclisme (ml/h)"><input className="input" value={local.tolHydrCyc} onChange={(e) => update("tolHydrCyc", e.target.value)} /></Field>
          <Field label="Caféine validée">
            <select className="input" value={local.cafeineValidee ? "Oui" : "Non"} onChange={(e) => update("cafeineValidee", e.target.value === "Oui")}>
              <option>Oui</option>
              <option>Non</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3 items-center mt-4">
        {saved && <span className="text-[var(--color-success)] text-sm font-semibold">✓ Enregistré</span>}
        <button onClick={onSave} className="btn-primary">Enregistrer le profil</button>
      </div>
    </div>
  );
}
