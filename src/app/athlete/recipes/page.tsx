"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { mockRecipes } from "@/lib/mock-data";
import { ChefHat, Clock, Flame, ExternalLink } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  avant_effort: { label: "Avant l'effort", color: "bg-green-500/20 text-green-400", icon: "🔋" },
  pendant_effort: { label: "Pendant l'effort", color: "bg-orange-500/20 text-orange-400", icon: "⚡" },
  recuperation: { label: "Récupération", color: "bg-blue-500/20 text-blue-400", icon: "🔄" },
  quotidien: { label: "Quotidien", color: "bg-purple-500/20 text-purple-400", icon: "🍽️" },
};

export default function RecipesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? mockRecipes
      : mockRecipes.filter((r) => r.category === filter);

  const selected = mockRecipes.find((r) => r.id === selectedRecipe);

  return (
    <div>
      <Topbar
        title="Recettes IA"
        subtitle="Recettes adaptées à chaque phase nutritionnelle"
      />

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
          }`}
        >
          Toutes ({mockRecipes.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, { label, icon }]) => {
          const count = mockRecipes.filter((r) => r.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              }`}
            >
              {icon} {label} ({count})
            </button>
          );
        })}
      </div>

      {/* GPT Chef */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-5 border-[var(--color-primary)]/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍🍳</span>
            <div>
              <p className="font-semibold text-sm">Chef NUTRIOCUS</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Besoin d'une recette personnalisée ? Dis-lui ta phase nutritionnelle et ce que tu as dans ton frigo.
              </p>
            </div>
          </div>
          <a href="#" className="btn-primary text-sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir le GPT
          </a>
        </div>
      </motion.div>

      {/* Grille recettes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filtered.map((recipe, i) => {
          const cat = CATEGORY_CONFIG[recipe.category];
          return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                onClick={() => setSelectedRecipe(recipe.id === selectedRecipe ? null : recipe.id)}
                className="card w-full text-left hover:border-[var(--color-primary)]/30 transition-all cursor-pointer group"
              >
                {/* Image placeholder */}
                <div className="w-full h-32 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center mb-3 text-4xl">
                  {cat?.icon}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge text-[10px] ${cat?.color}`}>
                    {cat?.label}
                  </span>
                </div>

                <h3 className="font-semibold font-display text-sm mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {recipe.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  {recipe.prep_time_min && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {recipe.prep_time_min} min
                    </span>
                  )}
                  {recipe.kcal && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {recipe.kcal} kcal
                    </span>
                  )}
                </div>

                {/* Macros */}
                <div className="flex gap-2 mt-2">
                  {recipe.carbs_g !== undefined && (
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-green-400">{recipe.carbs_g}g</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">Gluc</div>
                    </div>
                  )}
                  {recipe.protein_g !== undefined && (
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-blue-400">{recipe.protein_g}g</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">Prot</div>
                    </div>
                  )}
                  {recipe.fat_g !== undefined && (
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-amber-400">{recipe.fat_g}g</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">Lip</div>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Recipe detail */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{CATEGORY_CONFIG[selected.category]?.icon}</span>
            <div>
              <h2 className="font-bold font-display text-lg">{selected.title}</h2>
              <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
                {selected.prep_time_min && <span>{selected.prep_time_min} min</span>}
                {selected.kcal && <span>{selected.kcal} kcal</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Ingrédients
              </h4>
              <ul className="space-y-1">
                {selected.ingredients?.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                    <span>
                      <strong>{ing.quantity} {ing.unit}</strong> {ing.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Préparation
              </h4>
              <ol className="space-y-2">
                {selected.steps?.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {selected.tags && selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {selected.tags.map((tag) => (
                <span key={tag} className="badge bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
