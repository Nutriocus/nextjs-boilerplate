"use client";

import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const DEFAULT_PROFILE = {
  poids: 71,
  vo2max: 62,
  fcmax: 190,
};

const ZONES = [
  { z: "Z1 — Endurance basse", vo2: 0.55, fc: 0.65, fcc: "< 150", rer: 0.8 },
  { z: "Z2 — Endurance aéro", vo2: 0.7, fc: 0.75, fcc: "151–167", rer: 0.85 },
  { z: "Z3 — Tempo", vo2: 0.8, fc: 0.83, fcc: "167–176", rer: 0.9 },
  { z: "Z4 — Seuil", vo2: 0.9, fc: 0.9, fcc: "176–185", rer: 0.93 },
  { z: "Z5 — Soutenu", vo2: 0.95, fc: 0.95, fcc: "> 185", rer: 0.98 },
];

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function computeZones(p: { poids: number | string; vo2max: number | string }) {
  const vo2max = toNum(p.vo2max);
  const poids = toNum(p.poids);
  return ZONES.map((z) => {
    const cho = Math.max(0, Math.min(1, (z.rer - 0.7) / 0.3));
    const lip = 1 - cho;
    const vo2lmin = (vo2max * poids) / 1000 * z.vo2;
    const kcalmin = 5 * vo2lmin;
    return {
      ...z,
      cho,
      lip,
      vo2lmin,
      kcalmin,
      kcalh: kcalmin * 60,
      gchomin: (kcalmin * cho) / 4,
      glipmin: (kcalmin * lip) / 9,
    };
  });
}

export default function PhysiologyPage() {
  const [profile] = useAthleteData("profile", DEFAULT_PROFILE);
  const zones = computeZones(profile as typeof DEFAULT_PROFILE);

  const subData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    CHO: +z.gchomin.toFixed(2),
    Lipides: +z.glipmin.toFixed(2),
  }));
  const kcalData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    "kcal/h": Math.round(z.kcalh),
  }));
  const substratData = zones.map((z) => ({
    z: z.z.split(" — ")[0],
    "% CHO": Math.round(z.cho * 100),
    "% Lipides": Math.round(z.lip * 100),
  }));

  return (
    <div>
      <PageHeader
        kicker="Anticiper tes courses"
        title="Profil physiologique & énergétique"
        desc={`Zones calculées depuis ton profil (VO₂max ${profile.vo2max ?? "—"}, poids ${profile.poids ?? "—"} kg). %CHO = (RER−0,7)/0,3 · VO₂ = VO₂max×poids/1000×%VO₂max · kcal/min = 5×VO₂.`}
      />

      <div className="card mb-5 overflow-x-auto">
        <table className="table" style={{ minWidth: 840 }}>
          <thead>
            <tr>
              <th>Zone</th>
              <th>%VO₂max</th>
              <th>%FCmax</th>
              <th>FC cible</th>
              <th>RER</th>
              <th>%CHO</th>
              <th>%Lip</th>
              <th>VO₂ L/min</th>
              <th>kcal/min</th>
              <th>kcal/h</th>
              <th>g CHO/min</th>
              <th>g Lip/min</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z, i) => (
              <tr key={i} style={{ background: i % 2 ? "#fafaf8" : "#fff" }}>
                <td style={{ fontWeight: 700 }}>{z.z}</td>
                <td>{Math.round(z.vo2 * 100)}%</td>
                <td>{Math.round(z.fc * 100)}%</td>
                <td style={{ color: "var(--color-text-muted)" }}>{z.fcc}</td>
                <td>{z.rer}</td>
                <td style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                  {Math.round(z.cho * 100)}%
                </td>
                <td style={{ color: "var(--color-success)", fontWeight: 700 }}>
                  {Math.round(z.lip * 100)}%
                </td>
                <td>{z.vo2lmin.toFixed(2)}</td>
                <td>{z.kcalmin.toFixed(1)}</td>
                <td style={{ fontWeight: 700 }}>{Math.round(z.kcalh)}</td>
                <td style={{ color: "var(--color-primary)" }}>
                  {z.gchomin.toFixed(2)}
                </td>
                <td style={{ color: "var(--color-success)" }}>
                  {z.glipmin.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-extrabold mb-2 text-sm">
            Oxydation des substrats par zone (g/min)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="CHO" fill="var(--color-primary)" />
              <Bar dataKey="Lipides" fill="var(--color-dark)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="font-extrabold mb-2 text-sm">
            Dépense énergétique par zone (kcal/h)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={kcalData} margin={{ top: 5, right: 10, left: -6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
              <Tooltip />
              <Bar dataKey="kcal/h" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 lg:col-span-2">
          <div className="font-extrabold mb-2 text-sm">
            Répartition des substrats (% CHO vs % Lipides)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={substratData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="z" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="% CHO" stackId="1" stroke="var(--color-primary)" fill="var(--color-primary)" />
              <Area type="monotone" dataKey="% Lipides" stackId="1" stroke="var(--color-success)" fill="var(--color-accent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
