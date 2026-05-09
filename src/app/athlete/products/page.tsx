"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockEffortProducts } from "@/lib/mock-data";
import { getProductStatusBadge } from "@/lib/utils";
import { Package, Plus, ChevronUp, ChevronDown } from "lucide-react";

export default function ProductsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? mockEffortProducts
      : mockEffortProducts.filter((p) => p.status === filter);

  const counts = {
    all: mockEffortProducts.length,
    validated: mockEffortProducts.filter((p) => p.status === "validated").length,
    testing: mockEffortProducts.filter((p) => p.status === "testing").length,
    eliminated: mockEffortProducts.filter((p) => p.status === "eliminated").length,
    partial: mockEffortProducts.filter((p) => (p.status as string) === "partial").length,
  };

  return (
    <div>
      <Topbar
        title="Produits de l'effort"
        subtitle="Gestion et tolérance de vos produits nutritionnels"
        actions={
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
        }
      />

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key: "all", label: "Tous" },
          { key: "validated", label: "✅ Validés" },
          { key: "testing", label: "🔬 En test" },
          { key: "eliminated", label: "❌ Éliminés" },
          { key: "partial", label: "⚠️ Partiels" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}{" "}
            <span className="opacity-60 text-xs">
              ({counts[key as keyof typeof counts]})
            </span>
          </button>
        ))}
      </div>

      {/* Tableau produits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Glucides/unité</th>
                <th>Ratio Glu:Fru</th>
                <th>Caféine</th>
                <th>Sodium</th>
                <th>Tolérance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const badge = getProductStatusBadge(p.status);
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.notes && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-[200px] truncate">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] capitalize text-[10px]">
                        {p.type}
                      </span>
                    </td>
                    <td className="font-mono">{p.carbs_per_unit ?? "—"} g</td>
                    <td className="font-mono text-xs">{p.glucose_fructose_ratio || "—"}</td>
                    <td className="font-mono">{p.caffeine_mg > 0 ? `${p.caffeine_mg} mg` : "—"}</td>
                    <td className="font-mono">{p.sodium_mg > 0 ? `${p.sodium_mg} mg` : "—"}</td>
                    <td>
                      {p.tolerance_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(p.tolerance_score / 10) * 100}%`,
                                background:
                                  p.tolerance_score >= 7
                                    ? "#22c55e"
                                    : p.tolerance_score >= 5
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold">
                            {p.tolerance_score}/10
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`badge text-[10px] ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Note coach */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mt-5"
      >
        <div className="flex items-start gap-3">
          <Package className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">Guide d'entraînement intestinal</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Pour valider un produit, testez-le sur <strong>3 à 5 séances longues</strong> à intensité cible avant une course importante.
              Commencez par <strong>30–40 g de glucides/h</strong> et augmentez progressivement jusqu'à votre cible.
              Documentez chaque résultat ici pour optimiser votre protocole.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
