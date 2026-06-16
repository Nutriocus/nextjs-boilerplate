"use client";

import { useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Field } from "@/components/ui/PageHeader";
import {
  PrintReport,
  PrintH,
  PrintButton,
  PrintKpi,
  PrintBox,
} from "@/components/ui/PrintReport";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function choPctFromRER(rer: number) {
  if (rer <= 0.7) return 0;
  if (rer >= 1) return 1;
  return Math.max(0, Math.min(1, (rer - 0.7) / 0.3));
}

export default function EnergyExpenditurePage() {
  const [profile] = useAthleteData<{ reservesGlucides?: number | string }>("profile", {});
  const [params, setParams] = useState({
    duree: 330,
    kcalMin: 13,
    coef: 1.2,
    rerMoyen: 0.88,
    cibleCHOh: 90,
  });

  const update = (k: keyof typeof params, v: number | string) =>
    setParams((p) => ({ ...p, [k]: v as never }));

  const dur = toNum(params.duree);
  const kcalMin = toNum(params.kcalMin);
  const coef = toNum(params.coef);
  const rer = toNum(params.rerMoyen);
  const cible = toNum(params.cibleCHOh);

  const totalKcal = dur * kcalMin * coef;
  const choPct = choPctFromRER(rer);
  const lipPct = 1 - choPct;
  const choKcal = totalKcal * choPct;
  const lipKcal = totalKcal * lipPct;
  const choG = choKcal / 4;
  const reserves = toNum(profile.reservesGlucides);
  const cibleH = cible / 60;
  const apportTot = cibleH * dur;
  const dispoTotale = apportTot + reserves;
  const netLossH = dur > 0 ? (choG / dur) * 60 - cible : 0;

  const heures = Math.ceil(dur / 60);
  const series: { h: number; stock: number }[] = [];
  let stock = reserves;
  for (let h = 0; h <= Math.max(heures, 1); h++) {
    series.push({ h, stock: Math.round(stock) });
    stock -= netLossH;
  }
  const hMur = netLossH > 0 ? (reserves - 300) / netLossH : null;

  return (
    <div>
      <div className="screen-only">
      <PageHeader
        kicker="Anticiper tes courses"
        title="Dépenses énergétiques en course"
        action={<PrintButton />}
        desc="Anticipe la dépense totale, la répartition des substrats et la déplétion du glycogène heure par heure selon ta cible d'apport en glucides."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="card p-4">
          <div className="font-extrabold mb-3">Paramètres</div>
          <div className="flex flex-col gap-2.5">
            <Field label="Durée de la course (min)"><input className="input" value={params.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
            <Field label="Dépense estimée (kcal/min)"><input className="input" value={params.kcalMin} onChange={(e) => update("kcalMin", e.target.value)} /></Field>
            <Field label="Coefficient correcteur C"><input className="input" value={params.coef} onChange={(e) => update("coef", e.target.value)} /></Field>
            <div className="text-xs text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface-2)] p-2 rounded-lg">
              Plat 1,0 · Vallonné 1,10–1,20 · Montagne &gt;1500m D+ 1,25–1,40 · +0,05 si &gt;25°C · −0,05 si &lt;10°C
            </div>
            <Field label="RER moyen estimé"><input className="input" value={params.rerMoyen} onChange={(e) => update("rerMoyen", e.target.value)} /></Field>
            <Field label="Cible apport glucides (g/h)"><input className="input" value={params.cibleCHOh} onChange={(e) => update("cibleCHOh", e.target.value)} /></Field>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Kpi label="Dépense totale" value={Math.round(totalKcal)} unit="kcal" color="var(--color-primary)" />
            <Kpi
              label="Énergie CHO"
              value={Math.round(choKcal)}
              unit="kcal"
              color="var(--color-dark)"
              note={`${Math.round(choPct * 100)}% · ${Math.round(choG)} g`}
            />
            <Kpi
              label="Énergie lipides"
              value={Math.round(lipKcal)}
              unit="kcal"
              color="var(--color-success)"
              note={`${Math.round(lipPct * 100)}%`}
            />
            <Kpi
              label="Glycogène net / h"
              value={netLossH > 0 ? "-" + Math.round(netLossH) : "≈0"}
              unit="g"
              color="var(--color-danger)"
              note={`apport ${cible} g/h`}
            />
          </div>

          <div className="card p-4 mb-4">
            <div className="flex justify-between mb-2 items-baseline flex-wrap gap-2">
              <div className="font-extrabold text-sm">
                Déplétion du glycogène (réserves {reserves || "—"} g · seuil du mur 300 g)
              </div>
              {hMur != null && hMur > 0 && hMur < heures && (
                <div className="text-xs text-[var(--color-danger)] font-bold">
                  ⚠ Seuil du mur (300 g) atteint vers {hMur.toFixed(1)} h
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={series} margin={{ top: 5, right: 10, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="h"
                  tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                  label={{ value: "heures", position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--color-text-muted)" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                <Tooltip />
                <ReferenceLine
                  y={300}
                  stroke="var(--color-danger)"
                  strokeDasharray="5 4"
                  label={{ value: "Mur 300 g", position: "insideTopRight", fontSize: 10, fill: "var(--color-danger)" }}
                />
                <Line type="monotone" dataKey="stock" name="Glycogène (g)" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <div className="flex gap-6 flex-wrap text-sm">
              <span>Apport exogène total : <b className="text-[var(--color-primary)]">{Math.round(apportTot)} g</b></span>
              <span>Disponibilité totale (réserves + apport) : <b className="text-[var(--color-success)]">{Math.round(dispoTotale)} g</b></span>
              <span>Dépense glucidique estimée : <b>{Math.round(choG)} g</b></span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-2">
              En dessous de <b className="text-[var(--color-danger)]">300 g</b>, la performance chute (mur) même si les réserves ne sont pas vides.
            </div>
          </div>
        </div>
      </div>
      </div>

      <PrintReport
        kicker="Anticiper tes courses"
        title="Dépenses en course"
        subtitle={`${params.duree} min · cible ${cible} g/h · réserves ${reserves} g`}
      >
        <PrintH>Synthèse énergétique</PrintH>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
          <PrintKpi label="Dépense totale" value={Math.round(totalKcal)} unit="kcal" />
          <PrintKpi
            label="Énergie CHO"
            value={Math.round(choKcal)}
            unit="kcal"
            sub={`${Math.round(choPct * 100)}% · ${Math.round(choG)} g`}
            accent="#FF4501"
          />
          <PrintKpi
            label="Énergie lipides"
            value={Math.round(lipKcal)}
            unit="kcal"
            sub={`${Math.round(lipPct * 100)}%`}
            accent="#5f8c0a"
          />
          <PrintKpi
            label="Glycogène net /h"
            value={netLossH > 0 ? "-" + Math.round(netLossH) : "≈0"}
            unit="g"
            accent="#cf2e2e"
          />
        </div>

        <PrintH>Déplétion du glycogène</PrintH>
        <PrintBox
          title={`Réserves ${reserves} g · seuil du mur 300 g${hMur != null && hMur > 0 ? ` · atteint ≈ ${hMur.toFixed(1)} h` : ""}`}
        >
          <LineChart width={690} height={220} data={series} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e3" />
            <XAxis
              dataKey="h"
              tick={{ fontSize: 10, fill: "#787876" }}
              label={{ value: "heures", position: "insideBottom", offset: -2, fontSize: 9, fill: "#787876" }}
            />
            <YAxis tick={{ fontSize: 10, fill: "#787876" }} />
            <ReferenceLine
              y={300}
              stroke="#cf2e2e"
              strokeDasharray="5 4"
              label={{ value: "Mur 300 g", position: "insideTopRight", fontSize: 10, fill: "#cf2e2e" }}
            />
            <Line dataKey="stock" name="Glycogène (g)" stroke="#FF4501" strokeWidth={3} dot={{ r: 2 }} isAnimationActive={false} />
          </LineChart>
        </PrintBox>
        <div style={{ fontSize: 11.5, color: "#787876", marginTop: 8 }}>
          En dessous de 300 g de glycogène, la performance chute (mur) même si les réserves ne sont pas vides.
        </div>
      </PrintReport>
    </div>
  );
}
