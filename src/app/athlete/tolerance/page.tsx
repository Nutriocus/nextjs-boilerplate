"use client";

import { useState, useMemo, useEffect } from "react";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Kpi, Empty, Field, Badge } from "@/components/ui/PageHeader";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import { PRODUCTS_CATALOG, Product } from "@/lib/products-catalog";

type Discipline = "Course" | "Trail" | "Cyclisme" | "Triathlon";
type Ressenti = "planifie" | "bien" | "limite" | "mal";
type TestType = "glucides" | "hydrique";

type ConstructorLine = {
  productKey: string; // "Manufacturer|Name"
  qty: number;
};

type Test = {
  id: string;
  date: string;
  discipline: Discipline;
  type: TestType;
  valeur: number | string;
  duree: string;
  ressenti: Ressenti;
  rpe: string;
  produits: string;
  notes: string;
  // Optional: kept when test was constructed via the calculator
  composition?: ConstructorLine[];
  ratio?: number; // weighted glucose:fructose ratio (the X in 1:X)
};

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const dateShort = (d: string) =>
  parseISO(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
const dateLong = (d: string) =>
  parseISO(d).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

const RESSENTI_INFO: Record<Ressenti, { label: string; variant: "green" | "orange" | "red" | "dark" }> = {
  planifie: { label: "Test planifié (à réaliser)", variant: "dark" },
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

function ratioValueFromString(r: string | undefined): number {
  if (!r) return 0;
  const parts = String(r).split(":");
  if (parts.length < 2) return 0;
  const x = parseFloat(parts[1].replace(",", "."));
  return isNaN(x) ? 0 : x;
}

// Recommended minimum glucose:fructose ratio per CHO/h target zone
function recommendedRatio(targetGH: number): { minRatio: number; label: string; tone: "soft" | "medium" | "hard" } {
  if (targetGH >= 110) return { minRatio: 0.8, label: "≥ 1:0,8", tone: "hard" };
  if (targetGH >= 100) return { minRatio: 0.65, label: "≥ 1:0,65", tone: "hard" };
  if (targetGH >= 90)  return { minRatio: 0.5,  label: "≥ 1:0,5",  tone: "medium" };
  if (targetGH >= 80)  return { minRatio: 0.4,  label: "≥ 1:0,4",  tone: "medium" };
  if (targetGH >= 70)  return { minRatio: 0.35, label: "≥ 1:0,35", tone: "soft" };
  if (targetGH >= 60)  return { minRatio: 0.2,  label: "≥ 1:0,2",  tone: "soft" };
  return { minRatio: 0, label: "1:0 minimum", tone: "soft" };
}

export default function TolerancePage() {
  const [tests, setTests, loaded] = useAthleteData<Test[]>("tol", []);
  const [profile] = useAthleteData<{
    cafeineValidee?: boolean;
    tolGlucCAP?: number | string;
    tolHydrCAP?: number | string;
    tolGlucCyc?: number | string;
    tolHydrCyc?: number | string;
  }>("profile", {});
  const [favorites] = useAthleteData<string[]>("fav", []);
  const [custom] = useAthleteData<Product[]>("custom", []);

  const allProducts = useMemo(() => [...PRODUCTS_CATALOG, ...custom], [custom]);
  // Indexed both by full key (t|m|n — unique) and legacy key (m|n — backward compat)
  const productByKey = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of allProducts) {
      m.set(p.t + "|" + p.m + "|" + p.n, p);
      // Legacy fallback (last writer wins on collision)
      if (!m.has(p.m + "|" + p.n)) m.set(p.m + "|" + p.n, p);
    }
    return m;
  }, [allProducts]);

  const favProducts = useMemo(() => {
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const k of favorites) {
      const p = productByKey.get(k);
      if (!p) continue;
      const uniqK = p.t + "|" + p.m + "|" + p.n;
      if (seen.has(uniqK)) continue;
      seen.add(uniqK);
      out.push(p);
    }
    return out;
  }, [favorites, productByKey]);

  const [tab, setTab] = useState<"journal" | "constructor">("journal");
  const [draft, setDraft] = useState<Test>(blank());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Constructor state
  const [conTarget, setConTarget] = useState("80");
  const [conDuration, setConDuration] = useState("60"); // min
  const [conLines, setConLines] = useState<ConstructorLine[]>([]);
  const [conPickKey, setConPickKey] = useState("");

  const update = (k: keyof Test, v: Test[keyof Test]) =>
    setDraft((d) => ({ ...d, [k]: v as never }));

  const startEdit = (t: Test) => {
    setDraft({ ...t });
    setEditingId(t.id);
    setOpen(true);
    setViewingId(null);
    setTab("journal");
  };
  const startNew = () => {
    setDraft(blank());
    setEditingId(null);
    setOpen(true);
  };
  const closeForm = () => {
    setOpen(false);
    setEditingId(null);
    setDraft(blank());
  };

  const save = () => {
    if (!draft.valeur) return;
    const cleaned: Test = { ...draft, valeur: toNum(draft.valeur) };
    setTests((p) => {
      if (editingId) {
        return p.map((t) => (t.id === editingId ? { ...cleaned, id: editingId } : t))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      return [...p, { ...cleaned, id: newId() }].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
    setDraft(blank());
    setOpen(false);
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce test ?")) return;
    setTests((p) => p.filter((t) => t.id !== id));
    if (viewingId === id) setViewingId(null);
  };

  const viewing = tests.find((t) => t.id === viewingId);

  useEffect(() => {
    if (!viewingId) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setViewingId(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [viewingId]);

  function maxFor(type: TestType, disc?: Discipline) {
    const filtered = tests.filter(
      (t) => t.type === type && t.ressenti === "bien" && (!disc || t.discipline === disc),
    );
    return filtered.length ? Math.max(...filtered.map((t) => toNum(t.valeur))) : null;
  }

  // ============= CONSTRUCTOR COMPUTATIONS =============
  const conComputed = useMemo(() => {
    let totG = 0, totS = 0, totC = 0, totHydr = 0;
    let weightedR = 0;
    for (const l of conLines) {
      const p = productByKey.get(l.productKey);
      if (!p) continue;
      const qty = l.qty || 1;
      totG += p.g * qty;
      totS += p.s * qty;
      totC += p.c * qty;
      // Hydration default by type
      if (p.t === "Boisson") totHydr += 500 * qty; else totHydr += 0;
      weightedR += p.g * qty * ratioValueFromString(p.r);
    }
    const dur = toNum(conDuration);
    const hours = dur > 0 ? dur / 60 : 1;
    return {
      totG, totS, totC, totHydr,
      ratio: totG > 0 ? weightedR / totG : 0,
      gH: totG / hours,
      sH: totS / hours,
      cH: totC / hours,
      hydrH: totHydr / hours,
    };
  }, [conLines, productByKey, conDuration]);

  const target = toNum(conTarget);
  const reco = recommendedRatio(target);
  const ratioOk = conComputed.ratio >= reco.minRatio;
  const targetReached = conComputed.gH >= target * 0.95 && conComputed.gH <= target * 1.10;

  // Save constructor as a planned test (athlete still has to execute it & report)
  const saveConstructorAsTest = () => {
    if (conLines.length === 0) return;
    const productsLabel = conLines
      .map((l) => productByKey.get(l.productKey))
      .filter(Boolean)
      .map((p) => `[${p!.t}] ${p!.m} · ${p!.n}`)
      .join(" + ");
    const t: Test = {
      id: newId(),
      date: today(),
      discipline: "Course",
      type: "glucides",
      valeur: Math.round(conComputed.gH),
      duree: conDuration + " min",
      ressenti: "planifie", // ⏳ pas encore réalisé
      rpe: "",
      produits: productsLabel,
      notes: `Test construit · ratio ⌀ 1:${conComputed.ratio.toFixed(2)} · ${conComputed.totG.toFixed(0)} g CHO sur ${conDuration} min`,
      composition: conLines,
      ratio: conComputed.ratio,
    };
    setTests((p) => [...p, t].sort((a, b) => (a.date < b.date ? 1 : -1)));
    setConLines([]);
    setTab("journal");
  };

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
        action={
          tab === "journal" && (
            <button onClick={open ? closeForm : startNew} className="btn-primary">
              {open ? "Fermer" : "+ Test"}
            </button>
          )
        }
      />

      <HelpSection title="ℹ️ Tests de tolérance — pourquoi et comment ?">
        <HelpBlock icon="🎯" title="Pourquoi">
          <p>
            La performance en endurance dépend de la <b>quantité de glucides absorbables
            à l&apos;heure</b> sans inconfort digestif. Ton intestin se <b>entraîne</b> :
            commencer à 40 g/h sans tester puis viser 100 g/h en course = trouble GI
            assuré. Les tests permettent d&apos;identifier <b>ton plafond actuel</b> et
            de le repousser progressivement.
          </p>
        </HelpBlock>
        <HelpBlock icon="📝" title="Comment faire un test">
          <ul className="list-disc pl-5 space-y-1">
            <li>Clique sur <b>+ Test</b> et choisis ta discipline (trail / route / vélo / triathlon)</li>
            <li>Définis la <b>cible</b> (g de glucides / h) et la durée (mini 1h, idéal 2h)</li>
            <li>Construis ton <b>test produit par produit</b> (gels, boissons, barres…) — la plateforme calcule le ratio glucose:fructose en temps réel</li>
            <li>Respecte les <b>ratios cibles</b> selon la zone : ≥1:0,4 entre 80-90 g/h, ≥1:0,5 entre 90-100, ≥1:0,8 au-dessus de 110</li>
            <li>Réalise le test à l&apos;entraînement (jamais en course), puis reviens noter
              le <b>RPE digestif</b> (0=parfait, 10=cata) et coche <b>bien toléré</b> ou non</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="🔬" title="Comment c'est utilisé ensuite">
          <ul className="list-disc pl-5 space-y-1">
            <li>Ton <b>niveau actuel</b> = la meilleure valeur bien tolérée par discipline</li>
            <li>Sert de <b>plafond</b> dans les plans de stratégie de course (on ne te prescrit pas plus que ce que tu tolères)</li>
            <li>Permet de planifier la <b>progression</b> (palier +10 g/h toutes les 2-3 semaines)</li>
          </ul>
        </HelpBlock>
      </HelpSection>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
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
          value={maxFor("glucides", "Cyclisme") ?? profile.tolGlucCyc ?? "—"}
          unit="g/h"
          color="var(--color-success)"
        />
        <Kpi
          label="Tol. hydrique — Cyclisme"
          value={maxFor("hydrique", "Cyclisme") ?? profile.tolHydrCyc ?? "—"}
          unit="ml/h"
          color="var(--color-success)"
        />
        <Kpi label="Caféine validée" value={profile.cafeineValidee ? "Oui" : "Non"} color="#8a8a88" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("journal")} className={tab === "journal" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          📋 Mes tests ({tests.length})
        </button>
        <button onClick={() => setTab("constructor")} className={tab === "constructor" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
          🧪 Constructeur de test
        </button>
      </div>

      {/* ============ TAB: JOURNAL ============ */}
      {tab === "journal" && (
        <>
          {open && (
            <div className="card p-4 mb-4" style={{ border: "2px solid var(--color-primary)" }}>
              <div className="font-extrabold mb-3">{editingId ? "✎ Modifier le test" : "+ Nouveau test"}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                <Field label="Date"><input type="date" className="input" value={draft.date} onChange={(e) => update("date", e.target.value)} /></Field>
                <Field label="Discipline">
                  <select className="input" value={draft.discipline} onChange={(e) => update("discipline", e.target.value as Discipline)}>
                    <option>Course</option><option>Trail</option><option>Cyclisme</option><option>Triathlon</option>
                  </select>
                </Field>
                <Field label="Type">
                  <select className="input" value={draft.type} onChange={(e) => update("type", e.target.value as TestType)}>
                    <option value="glucides">glucides</option>
                    <option value="hydrique">hydrique</option>
                  </select>
                </Field>
                <Field label={draft.type === "glucides" ? "Valeur (g/h)" : "Valeur (ml/h)"}>
                  <input className="input" value={draft.valeur} onChange={(e) => update("valeur", e.target.value)} />
                </Field>
                <Field label="Durée d'effort"><input className="input" value={draft.duree} onChange={(e) => update("duree", e.target.value)} /></Field>
                <Field label="Ressenti">
                  <select className="input" value={draft.ressenti} onChange={(e) => update("ressenti", e.target.value as Ressenti)}>
                    <option value="planifie">⏳ planifié (à tester)</option>
                    <option value="bien">✓ bien toléré</option>
                    <option value="limite">⚠ limite</option>
                    <option value="mal">✕ mal toléré</option>
                  </select>
                </Field>
                <Field label="RPE digestif /5"><input className="input" value={draft.rpe} onChange={(e) => update("rpe", e.target.value)} /></Field>
                <Field label="Produits utilisés"><input className="input" value={draft.produits} onChange={(e) => update("produits", e.target.value)} /></Field>
              </div>
              <Field label="Notes">
                <input className="input mt-2" value={draft.notes} onChange={(e) => update("notes", e.target.value)} />
              </Field>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={closeForm} className="btn-ghost">Annuler</button>
                <button onClick={save} className="btn-primary">{editingId ? "Enregistrer les modifications" : "Ajouter"}</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {tests.map((t) => {
              const info = RESSENTI_INFO[t.ressenti];
              const borderColor =
                info.variant === "green" ? "var(--color-success)" :
                info.variant === "orange" ? "var(--color-primary)" :
                info.variant === "red" ? "var(--color-danger)" :
                "var(--color-text-muted)";
              const isPlanned = t.ressenti === "planifie";
              return (
                <div
                  key={t.id}
                  onClick={() => setViewingId(t.id)}
                  className="card flex items-center gap-3 px-4 py-3 flex-wrap cursor-pointer hover:-translate-y-0.5 transition"
                  style={{
                    borderLeft: `5px ${isPlanned ? "dashed" : "solid"} ${borderColor}`,
                    background: isPlanned ? "var(--color-surface-2)" : undefined,
                  }}
                  title="Cliquer pour voir le détail"
                >
                  <div style={{ minWidth: 80, fontWeight: 700, fontSize: 13 }}>{dateShort(t.date)}</div>
                  <div style={{ minWidth: 70, color: "var(--color-text-muted)", fontSize: 12 }}>{t.discipline}</div>
                  <div className="font-display font-extrabold text-xl">
                    {String(t.valeur)}
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">
                      {t.type === "glucides" ? "g/h" : "ml/h"}
                    </span>
                  </div>
                  {t.ratio != null && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-2)" }}>
                      ratio 1:{t.ratio.toFixed(2)}
                    </span>
                  )}
                  {t.duree && <div className="text-xs text-[var(--color-text-muted)]">{t.duree}</div>}
                  <Badge variant={info.variant}>
                    {isPlanned && "⏳ "}{info.label}
                  </Badge>
                  {t.rpe && <div className="text-xs text-[var(--color-danger)]">RPE {t.rpe}/5</div>}
                  <div className="flex-1 text-xs text-[var(--color-text-muted)] italic" style={{ minWidth: 120 }}>
                    {t.produits} {t.notes}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                    style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 15 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {tests.length === 0 && <Empty>Aucun test enregistré.</Empty>}
          </div>
        </>
      )}

      {/* ============ TAB: CONSTRUCTOR ============ */}
      {tab === "constructor" && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Left: configuration */}
          <div className="card p-4">
            <div className="font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              🧪 Configure ton test
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mb-3">
              Définis ta cible et compose ton test à partir des produits du catalogue (tes favoris en haut).
            </div>
            <div className="flex flex-col gap-2.5">
              <Field label="Cible CHO (g/h)">
                <input className="input" value={conTarget} onChange={(e) => setConTarget(e.target.value)} />
              </Field>
              <Field label="Durée test (min)">
                <input className="input" value={conDuration} onChange={(e) => setConDuration(e.target.value)} />
              </Field>

              {/* Ratio reco */}
              <div
                className="rounded-lg p-3 text-xs"
                style={{
                  background: reco.tone === "hard" ? "rgba(207,46,46,0.10)" : reco.tone === "medium" ? "rgba(255,69,1,0.10)" : "rgba(95,140,10,0.10)",
                  color: reco.tone === "hard" ? "var(--color-danger)" : reco.tone === "medium" ? "var(--color-primary)" : "var(--color-success)",
                }}
              >
                <div className="font-bold text-[11px] uppercase mb-1" style={{ letterSpacing: ".06em" }}>
                  Ratio glucose:fructose recommandé
                </div>
                <div className="text-base font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                  {reco.label}
                </div>
                <div className="text-[10px] mt-1 opacity-80">
                  {target >= 100
                    ? "Au-delà de 100 g/h, le fructose est indispensable pour utiliser un 2ᵉ transporteur intestinal (GLUT5) sans saturer le SGLT1."
                    : target >= 80
                      ? "Entre 80-90 g/h, un ratio min 1:0,5 limite les troubles digestifs et améliore l'oxydation."
                      : "En dessous de 80 g/h, le ratio est moins critique. Choisis selon ta tolérance personnelle."}
                </div>
              </div>
            </div>
          </div>

          {/* Right: products + composition */}
          <div className="flex flex-col gap-4">
            {/* Picker */}
            <div className="card p-4">
              <div className="font-extrabold mb-2 text-sm">+ Ajouter un produit</div>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="input"
                  style={{ minWidth: 240, flex: 1 }}
                  value={conPickKey}
                  onChange={(e) => setConPickKey(e.target.value)}
                >
                  <option value="">— Choisis un produit —</option>
                  {favProducts.length > 0 && (
                    <optgroup label="⭐ Mes favoris">
                      {favProducts.map((p, i) => (
                        <option key={"f-" + i} value={p.m + "|" + p.n}>
                          [{p.t}] {p.m} · {p.n} — {p.g} g CHO · ratio {p.r}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Catalogue complet">
                    {allProducts.map((p, i) => (
                      <option key={"a-" + i} value={p.m + "|" + p.n}>
                        [{p.t}] {p.m} · {p.n} — {p.g} g CHO · ratio {p.r}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button
                  onClick={() => {
                    if (!conPickKey) return;
                    setConLines((prev) => [...prev, { productKey: conPickKey, qty: 1 }]);
                    setConPickKey("");
                  }}
                  className="btn-primary btn-sm"
                  disabled={!conPickKey}
                >
                  Ajouter
                </button>
              </div>
              {favProducts.length === 0 && (
                <div className="text-[10px] text-[var(--color-text-muted)] mt-2">
                  💡 Marque des produits en favoris dans le module &laquo; Produits de l&apos;effort &raquo; pour qu&apos;ils apparaissent en haut.
                </div>
              )}
            </div>

            {/* Composition list */}
            {conLines.length === 0 ? (
              <div className="card p-6 text-center text-sm text-[var(--color-text-muted)]">
                Aucun produit ajouté. Sélectionne tes produits ci-dessus pour construire ton test.
              </div>
            ) : (
              <>
                <div className="card overflow-auto">
                  <table className="table" style={{ minWidth: 520 }}>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Type</th>
                        <th>Ratio</th>
                        <th>CHO/u</th>
                        <th>Quantité</th>
                        <th>CHO total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {conLines.map((l, i) => {
                        const p = productByKey.get(l.productKey);
                        if (!p) return null;
                        const cho = p.g * l.qty;
                        return (
                          <tr key={i}>
                            <td>
                              <div className="font-bold text-sm">{p.n}</div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">{p.m}</div>
                            </td>
                            <td>{p.t}</td>
                            <td><b>{p.r}</b></td>
                            <td>{p.g} g</td>
                            <td>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="input"
                                style={{ width: 70 }}
                                value={l.qty}
                                onChange={(e) =>
                                  setConLines((prev) => prev.map((x, idx) => (idx === i ? { ...x, qty: toNum(e.target.value) } : x)))
                                }
                              />
                            </td>
                            <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{cho.toFixed(0)} g</td>
                            <td>
                              <button
                                onClick={() => setConLines((prev) => prev.filter((_, idx) => idx !== i))}
                                style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer" }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Synthèse */}
                <div className="card p-4">
                  <div className="font-extrabold mb-3 text-sm">📊 Synthèse du test</div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <Kpi label="Apport CHO" value={Math.round(conComputed.gH)} unit="g/h" color="var(--color-primary)" />
                    <Kpi label="Cible" value={target} unit="g/h" color="var(--color-dark)" note={targetReached ? "✓ atteint" : "à ajuster"} />
                    <Kpi
                      label="Ratio glu:fru"
                      value={`1:${conComputed.ratio.toFixed(2)}`}
                      color={ratioOk ? "var(--color-success)" : "var(--color-danger)"}
                      note={ratioOk ? "✓ conforme" : `min ${reco.label}`}
                    />
                    <Kpi label="Sodium" value={Math.round(conComputed.sH)} unit="mg/h" color="#8a8a88" />
                  </div>

                  {/* Warnings */}
                  <div className="space-y-2 text-sm">
                    {target >= 80 && !ratioOk && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(207,46,46,0.10)", color: "var(--color-danger)" }}>
                        🚨 <b>Ratio insuffisant ({conComputed.ratio.toFixed(2)})</b> pour une cible {target} g/h.
                        <br />
                        <span className="text-xs">
                          Recommandation : privilégier des produits avec un <b>ratio 1:0,8</b> (Maurten, SiS Beta Fuel, Nduranz, etc.)
                          ou compléter avec une source de fructose.
                        </span>
                      </div>
                    )}
                    {targetReached && ratioOk && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(95,140,10,0.10)", color: "var(--color-success)" }}>
                        ✅ <b>Test équilibré</b> — cible atteinte ({Math.round(conComputed.gH)} g/h) avec un ratio conforme.
                        Tu peux l&apos;enregistrer comme test à réaliser, puis renseigner le ressenti une fois testé en sortie.
                      </div>
                    )}
                    {!targetReached && conLines.length > 0 && (
                      <div className="p-3 rounded-lg text-xs" style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}>
                        ℹ Tu es à {Math.round(conComputed.gH)} g/h sur cible {target}.
                        {conComputed.gH < target * 0.95 && " Ajoute un produit ou augmente les quantités."}
                        {conComputed.gH > target * 1.10 && " Réduis les quantités."}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setConLines([])} className="btn-ghost btn-sm">Réinitialiser</button>
                    <button onClick={saveConstructorAsTest} className="btn-primary btn-sm" disabled={conLines.length === 0}>
                      ⏳ Enregistrer comme test planifié
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setViewingId(null)}
        >
          <div
            className="card w-full max-w-2xl overflow-hidden"
            style={{ background: "var(--color-surface)", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 flex justify-between items-center flex-wrap gap-2" style={{ background: "var(--color-dark)", color: "#fff" }}>
              <div>
                <div className="text-[10px] uppercase font-bold opacity-70" style={{ letterSpacing: ".1em" }}>
                  Détail du test
                </div>
                <div className="font-extrabold uppercase text-sm" style={{ fontFamily: "var(--font-display)" }}>
                  {dateLong(viewing.date)} · {viewing.discipline}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(viewing)} className="btn-primary btn-sm">✎ Modifier</button>
                <button onClick={() => remove(viewing.id)} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
                  Supprimer
                </button>
                <button onClick={() => setViewingId(null)} className="btn-ghost btn-sm" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>✕</button>
              </div>
            </div>

            <div className="px-5 py-3 flex items-baseline gap-3 flex-wrap" style={{ background: "rgba(255,69,1,0.06)", borderBottom: "1px solid var(--color-border)" }}>
              <span className="text-[10px] uppercase font-bold text-[var(--color-primary)]" style={{ letterSpacing: ".08em" }}>
                {viewing.type === "glucides" ? "Apport glucidique" : "Apport hydrique"}
              </span>
              <span className="font-extrabold text-3xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>
                {String(viewing.valeur)}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">
                {viewing.type === "glucides" ? "g/h" : "ml/h"}
              </span>
              <Badge variant={RESSENTI_INFO[viewing.ressenti].variant}>{RESSENTI_INFO[viewing.ressenti].label}</Badge>
              {viewing.ratio != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-2)" }}>
                  ratio 1:{viewing.ratio.toFixed(2)}
                </span>
              )}
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>Discipline</div>
                <div className="font-bold mt-0.5">{viewing.discipline}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>Type</div>
                <div className="font-bold mt-0.5">{viewing.type}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>Durée d&apos;effort</div>
                <div className="font-bold mt-0.5">{viewing.duree || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]" style={{ letterSpacing: ".06em" }}>RPE digestif</div>
                <div className="font-bold mt-0.5">{viewing.rpe ? viewing.rpe + " / 5" : "—"}</div>
              </div>
            </div>

            {viewing.produits && (
              <div className="px-5 pb-3">
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1" style={{ letterSpacing: ".06em" }}>Produits utilisés</div>
                <div className="rounded-lg p-3 text-sm" style={{ background: "var(--color-surface-2)" }}>{viewing.produits}</div>
              </div>
            )}

            {viewing.notes && (
              <div className="px-5 pb-4">
                <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1" style={{ letterSpacing: ".06em" }}>Notes</div>
                <div className="rounded-lg p-3 text-sm italic" style={{ background: "var(--color-surface-2)" }}>{viewing.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
