"use client";

import { PageHeader } from "@/components/ui/PageHeader";

const TOOLS = [
  {
    g: "Avant la course",
    name: "Diagnostic pré-course 360°",
    desc: "Analyse du profil athlète en fonction de la course visée.",
    url: "https://chatgpt.com/g/g-68fd31200980819184b22509cce50fe7-nutriocus-diagnostic-pre-course-360deg",
  },
  {
    g: "Avant la course",
    name: "Prédicteur — risque mécanique & énergétique",
    desc: "Détermine le moment où le corps dira stop, et comment l'éviter.",
    url: "https://chatgpt.com/g/g-68fcf2ddd4d88191afd7dd65dadce091-predicteur-nutriocus-preparation-de-course",
  },
  {
    g: "Avant la course",
    name: "Analyse du risque neuromusculaire",
    desc: "Anticipe le risque de crampes / désynchronisation locale.",
    url: "https://chatgpt.com/g/g-68fd0cb2da408191a4f10d43d6327dc1-analyse-du-risque-neuromusculaire-nutriocus",
  },
  {
    g: "Avant la course",
    name: "Analyse de la durabilité à l'effort",
    desc: "Évalue si tu peux tenir ton objectif jusqu'au bout.",
    url: "https://chatgpt.com/g/g-69b3eef645d4819191bf8cb8eb6b0890-analyse-de-la-durabilite-nutriocus",
  },
  {
    g: "Pendant / stratégie",
    name: "Stratégie de pacing trail",
    desc: "Définir sa stratégie de pacing en trail.",
    url: "https://chatgpt.com/g/g-69b52fc02f54819192145abea341ee0e-nutriocus-strategie-de-pacing-course-trail",
  },
  {
    g: "Après la course",
    name: "Analyse de ta course",
    desc: "Analyse post-course complète.",
    url: "https://chatgpt.com/g/g-68f786ada7b08191a9e0be41fd614f02-nutriocus-analyse-de-ta-course",
  },
  {
    g: "Quotidien",
    name: "Ton diététicien Nutriocus de poche",
    desc: "Ton diététicien Nutriocus disponible au quotidien.",
    url: "https://chatgpt.com/g/g-693fd73e063081919c01bef7714c6099-ton-dieteticien-nutriocus-de-poche",
  },
  {
    g: "Quotidien",
    name: "Chef Nutriocus — Recettes",
    desc: "Recettes sportives personnalisées.",
    url: "https://chatgpt.com/g/g-6930abd4034c81918918d43967e49536-chef-nutriocus-recettes-sportives-personnalisees",
  },
];

export default function AiToolsPage() {
  const groups = Array.from(new Set(TOOLS.map((t) => t.g)));
  return (
    <div>
      <PageHeader
        kicker="Écosystème Nutriocus"
        title="Outils IA"
        desc="Tes assistants GPT Nutriocus, organisés par moment d'usage."
      />
      {groups.map((g) => (
        <div key={g} className="mb-6">
          <div className="kicker mb-3">{g}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOOLS.filter((t) => t.g === g).map((t, i) => (
              <div
                key={i}
                className="card p-4"
                style={{ borderLeft: `5px solid var(--color-primary)` }}
              >
                <div className="font-extrabold text-sm mb-1">{t.name}</div>
                <div className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
                  {t.desc}
                </div>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-dark btn-sm inline-flex"
                >
                  Ouvrir le GPT ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
