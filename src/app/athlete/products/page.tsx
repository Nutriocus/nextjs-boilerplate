"use client";

import { useMemo, useState } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Badge } from "@/components/ui/PageHeader";
import { PRODUCTS_CATALOG, Product } from "@/lib/products-catalog";

const TYPES = ["Tous", "Boisson", "Gel", "Barre", "Compote", "Gommes", "Gaufre"];
const TYPE_COLORS: Record<string, string> = {
  Boisson: "var(--color-dark)",
  Gel: "var(--color-primary)",
  Barre: "var(--color-success)",
  Compote: "#787876",
  Gommes: "#b36b00",
  Gaufre: "var(--color-danger)",
};

function toNum(v: unknown): number {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export default function ProductsPage() {
  const [favorites, setFavorites, loadedF] = useAthleteData<string[]>("fav", []);
  const [custom, setCustom, loadedC] = useAthleteData<Product[]>("custom", []);

  const all = useMemo(() => [...PRODUCTS_CATALOG, ...custom], [custom]);
  const brands = useMemo(() => ["Toutes", ...Array.from(new Set(all.map((p) => p.m))).sort()], [all]);

  const [filterType, setFilterType] = useState("Tous");
  const [filterBrand, setFilterBrand] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ t: "Gel" as Product["t"], m: "", n: "", g: "", s: "", c: "", b: "", r: "1:0.5" });

  // New favorite key includes type to disambiguate products with same brand+name
  // (e.g. "Apurna Longue Distance" exists in both Boisson and Gel).
  // Backward compat: still recognize old "m|n" format as a fallback.
  const key = (p: Product) => p.t + "|" + p.m + "|" + p.n;
  const legacyKey = (p: Product) => p.m + "|" + p.n;
  const isFav = (p: Product) => favorites.includes(key(p)) || favorites.includes(legacyKey(p));
  const toggleFav = (p: Product) => {
    const k = key(p);
    const lk = legacyKey(p);
    setFavorites((prev) => {
      if (prev.includes(k) || prev.includes(lk)) {
        // Remove both old and new format
        return prev.filter((x) => x !== k && x !== lk);
      }
      return [...prev, k];
    });
  };

  const filtered = all.filter(
    (p) =>
      (filterType === "Tous" || p.t === filterType) &&
      (filterBrand === "Toutes" || p.m === filterBrand) &&
      (!onlyFav || isFav(p)) &&
      (search === "" || (p.n + " " + p.m).toLowerCase().includes(search.toLowerCase())),
  );

  // List of favorited products (deduplicated, in athlete's order)
  const favProducts = useMemo(() => {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of all) {
      if (!isFav(p)) continue;
      const k = p.t + "|" + p.m + "|" + p.n;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, favorites]);

  const addCustom = () => {
    if (!draft.n || !draft.m) return;
    setCustom((p) => [
      ...p,
      {
        ...draft,
        g: toNum(draft.g),
        s: toNum(draft.s),
        c: toNum(draft.c),
        b: toNum(draft.b),
        com: "Produit personnalisé",
        l: "",
        custom: true,
      },
    ]);
    setDraft({ t: "Gel", m: "", n: "", g: "", s: "", c: "", b: "", r: "1:0.5" });
    setAddOpen(false);
  };

  const removeCustom = (p: Product) => setCustom((prev) => prev.filter((x) => !(x.m === p.m && x.n === p.n)));

  if (!loadedF || !loadedC) {
    return (
      <div>
        <PageHeader kicker="Nutrition à l'effort" title="Produits de l'effort" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Nutrition à l'effort"
        title="Produits de l'effort"
        action={<button onClick={() => setAddOpen((o) => !o)} className="btn-primary">+ Mon produit</button>}
        desc="94 produits référencés (glucides, sodium, caféine, BCAA, ratio glucose:fructose), filtrables et en favoris."
      />

      {addOpen && (
        <div className="card p-4 mb-4" style={{ border: `2px solid var(--color-primary)` }}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <Field label="Catégorie">
              <select className="input" value={draft.t} onChange={(e) => setDraft({ ...draft, t: e.target.value as Product["t"] })}>
                {TYPES.slice(1).map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Marque"><input className="input" value={draft.m} onChange={(e) => setDraft({ ...draft, m: e.target.value })} /></Field>
            <Field label="Nom"><input className="input" value={draft.n} onChange={(e) => setDraft({ ...draft, n: e.target.value })} /></Field>
            <Field label="Glucides (g)"><input className="input" value={draft.g} onChange={(e) => setDraft({ ...draft, g: e.target.value })} /></Field>
            <Field label="Sodium (mg)"><input className="input" value={draft.s} onChange={(e) => setDraft({ ...draft, s: e.target.value })} /></Field>
            <Field label="Caféine (mg)"><input className="input" value={draft.c} onChange={(e) => setDraft({ ...draft, c: e.target.value })} /></Field>
            <Field label="BCAA (mg)"><input className="input" value={draft.b} onChange={(e) => setDraft({ ...draft, b: e.target.value })} /></Field>
            <Field label="Ratio (1:x)"><input className="input" value={draft.r} onChange={(e) => setDraft({ ...draft, r: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAddOpen(false)} className="btn-ghost">Annuler</button>
            <button onClick={addCustom} className="btn-primary">Ajouter</button>
          </div>
        </div>
      )}

      {/* Favorites highlight section */}
      {favProducts.length > 0 && (
        <div className="card p-4 mb-4" style={{ borderLeft: "5px solid var(--color-primary)", background: "rgba(255,69,1,0.04)" }}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--color-primary)]" style={{ letterSpacing: ".08em" }}>
                ⭐ Mes produits favoris
              </div>
              <div className="font-extrabold text-base" style={{ fontFamily: "var(--font-display)" }}>
                {favProducts.length} produit{favProducts.length > 1 ? "s" : ""} utilisé{favProducts.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              Disponibles en priorité dans le constructeur de tests et le calculateur de stratégie.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {favProducts.map((p, i) => (
              <button
                key={p.t + "-" + p.m + "-" + p.n + "-" + i}
                onClick={() => toggleFav(p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:shadow-sm transition"
                style={{ border: `1px solid var(--color-border)`, borderLeft: `3px solid ${TYPE_COLORS[p.t] || "var(--color-dark)"}` }}
                title="Retirer des favoris"
              >
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>
                  {p.t}
                </span>
                <span className="text-sm font-bold">{p.m} · {p.n}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{p.g}g · {p.r}</span>
                <span className="text-[var(--color-primary)] ml-1">★</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card p-3 mb-4">
        <div className="flex gap-1.5 flex-wrap mb-3">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={filterType === t ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          <input
            className="input flex-1"
            style={{ minWidth: 160 }}
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" style={{ maxWidth: 180 }} value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
            {brands.map((b) => <option key={b}>{b}</option>)}
          </select>
          <button onClick={() => setOnlyFav((f) => !f)} className={onlyFav ? "btn-neon btn-sm" : "btn-ghost btn-sm"}>
            ★ Favoris
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">{filtered.length} produits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p, i) => {
          const fav = isFav(p);
          return (
            <div
              key={p.m + "-" + p.n + "-" + i}
              className="card p-3.5"
              style={{ borderTop: `3px solid ${TYPE_COLORS[p.t] || "var(--color-dark)"}` }}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <Badge variant={p.t === "Gel" ? "orange" : p.t === "Boisson" ? "dark" : p.t === "Barre" ? "green" : "dark"}>{p.t}</Badge>
                  <div className="font-extrabold text-sm mt-1.5">{p.n}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {p.m}{p.custom ? " · perso" : ""}
                  </div>
                </div>
                <button
                  onClick={() => toggleFav(p)}
                  style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: fav ? "var(--color-primary)" : "#ccc" }}
                >
                  {fav ? "★" : "☆"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                <div className="bg-[var(--color-surface-2)] rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-[var(--color-text-muted)]">GLUCIDES</div>
                  <div className="font-extrabold text-[var(--color-primary)]">{p.g} g</div>
                </div>
                <div className="bg-[var(--color-surface-2)] rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-[var(--color-text-muted)]">RATIO G:F</div>
                  <div className="font-extrabold">{p.r || "—"}</div>
                </div>
                <div className="bg-[var(--color-surface-2)] rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-[var(--color-text-muted)]">SODIUM</div>
                  <div className="font-extrabold">{p.s} mg</div>
                </div>
                <div className="bg-[var(--color-surface-2)] rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-[var(--color-text-muted)]">CAFÉINE</div>
                  <div className="font-extrabold">{p.c} mg</div>
                </div>
              </div>
              {p.b > 0 && <div className="text-[11px] text-[var(--color-text-muted)] mt-1.5">BCAA : {p.b} mg</div>}
              {p.com && <div className="text-[11px] text-[#555] mt-2 leading-relaxed">{p.com}</div>}
              <div className="flex justify-between items-center mt-2">
                {p.l && String(p.l).startsWith("http") ? (
                  <a href={p.l} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] font-bold">
                    Voir ↗
                  </a>
                ) : <span />}
                {p.custom && (
                  <button onClick={() => removeCustom(p)} style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 13 }}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
