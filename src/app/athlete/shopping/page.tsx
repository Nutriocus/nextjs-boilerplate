"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { ShoppingCart, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

const mockShoppingList = {
  id: "sl-1",
  title: "Liste de courses — Phase base Mai",
  phase: "base",
  updated_at: new Date().toISOString(),
  items: [
    { id: 1, name: "Flocons d'avoine", quantity: "1", unit: "kg", category: "Glucides", checked: false },
    { id: 2, name: "Riz blanc japonais", quantity: "2", unit: "kg", category: "Glucides", checked: true },
    { id: 3, name: "Patates douces", quantity: "1.5", unit: "kg", category: "Glucides", checked: false },
    { id: 4, name: "Pain complet (levain)", quantity: "2", unit: "miches", category: "Glucides", checked: false },
    { id: 5, name: "Pâtes complètes", quantity: "2", unit: "paquets", category: "Glucides", checked: true },
    { id: 6, name: "Blanc de poulet", quantity: "1.5", unit: "kg", category: "Protéines", checked: false },
    { id: 7, name: "Saumon fumé", quantity: "200", unit: "g", category: "Protéines", checked: false },
    { id: 8, name: "Œufs bio", quantity: "18", unit: "unités", category: "Protéines", checked: true },
    { id: 9, name: "Fromage blanc 0%", quantity: "4", unit: "pots", category: "Protéines", checked: false },
    { id: 10, name: "Thon en boîte (huile d'olive)", quantity: "4", unit: "boîtes", category: "Protéines", checked: false },
    { id: 11, name: "Épinards frais", quantity: "500", unit: "g", category: "Légumes & Fruits", checked: false },
    { id: 12, name: "Courgettes", quantity: "4", unit: "pièces", category: "Légumes & Fruits", checked: true },
    { id: 13, name: "Bananes", quantity: "2", unit: "régimes", category: "Légumes & Fruits", checked: false },
    { id: 14, name: "Myrtilles (surgelées)", quantity: "500", unit: "g", category: "Légumes & Fruits", checked: false },
    { id: 15, name: "SiS Beta Fuel Gel", quantity: "6", unit: "gels", category: "Ravitaillement course", checked: false },
    { id: 16, name: "Maurten Drink Mix 160", quantity: "4", unit: "sachets", category: "Ravitaillement course", checked: false },
    { id: 17, name: "Magnésium bisglycinate", quantity: "1", unit: "boîte", category: "Compléments", checked: true },
    { id: 18, name: "Vitamine D3 2000UI", quantity: "1", unit: "flacon", category: "Compléments", checked: false },
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  "Glucides": "🌾",
  "Protéines": "🥩",
  "Légumes & Fruits": "🥦",
  "Ravitaillement course": "⚡",
  "Compléments": "💊",
};

export default function ShoppingPage() {
  const [items, setItems] = useState(mockShoppingList.items);

  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const total = items.length;
  const checked = items.filter((i) => i.checked).length;

  return (
    <div>
      <Topbar
        title="Liste de courses"
        subtitle={`${checked}/${total} articles cochés`}
      />

      {/* Header liste */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold font-display">{mockShoppingList.title}</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Mise à jour {formatDate(mockShoppingList.updated_at)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-display text-[var(--color-primary)]">
              {Math.round((checked / total) * 100)}%
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">complété</div>
          </div>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(checked / total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Catégories */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, categoryItems], catIndex) => {
          const checkedCount = categoryItems.filter((i) => i.checked).length;
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.07 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold font-display text-sm flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] || "🛒"}</span>
                  {category}
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {checkedCount}/{categoryItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all text-left hover:bg-[var(--color-surface-2)] ${
                      item.checked ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.checked
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`flex-1 text-sm ${item.checked ? "line-through text-[var(--color-text-muted)]" : ""}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
