"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAthleteData } from "@/lib/athlete-storage";
import { PageHeader, Empty, Field, Kpi } from "@/components/ui/PageHeader";
import { PrintReport, PrintH, PrintButton } from "@/components/ui/PrintReport";
import { HelpSection, HelpBlock } from "@/components/ui/HelpSection";
import {
  BLOOD_MARKERS,
  CATEGORY_META,
  STATUS_META,
  CONCLUSION_STATUS_META,
  evaluateMarker,
  generateConclusion,
  type BloodCategory,
  type MarkerDef,
} from "@/lib/blood-markers";

type BloodTest = {
  id: string;
  date: string;
  laboratoire?: string;
  prescripteur?: string;
  markers: Record<string, string | number>;
  notes?: string;
};

const newId = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const dateLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const blank = (): BloodTest => ({
  id: newId(),
  date: today(),
  laboratoire: "",
  prescripteur: "",
  markers: {},
  notes: "",
});

const CATEGORY_ORDER: BloodCategory[] = ["fer", "hormones", "vitamines", "lipides", "inflammation"];

function markersByCategory(): Record<BloodCategory, MarkerDef[]> {
  const out = {} as Record<BloodCategory, MarkerDef[]>;
  for (const m of BLOOD_MARKERS) {
    if (!out[m.category]) out[m.category] = [];
    out[m.category].push(m);
  }
  return out;
}

function countAlerts(test: BloodTest, sex?: "H" | "F"): number {
  let n = 0;
  for (const m of BLOOD_MARKERS) {
    const v = test.markers[m.key];
    const ev = evaluateMarker(m, v, sex);
    if (ev.status === "alertLow" || ev.status === "alertHigh") n += 1;
  }
  return n;
}

function countOptimal(test: BloodTest, sex?: "H" | "F"): number {
  let n = 0;
  for (const m of BLOOD_MARKERS) {
    const v = test.markers[m.key];
    const ev = evaluateMarker(m, v, sex);
    if (ev.status === "optimal") n += 1;
  }
  return n;
}

function countFilled(test: BloodTest): number {
  let n = 0;
  for (const m of BLOOD_MARKERS) {
    const v = test.markers[m.key];
    if (v !== "" && v !== undefined && v !== null) n += 1;
  }
  return n;
}

export default function BloodTestsPage() {
  const [tests, setTests, loaded] = useAthleteData<BloodTest[]>("blood_tests", []);
  const [profile] = useAthleteData<{ sexe?: string }>("profile", {});
  const sex: "H" | "F" | undefined = profile.sexe === "Femme" ? "F" : profile.sexe === "Homme" ? "H" : undefined;

  const [editing, setEditing] = useState<BloodTest | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printTest, setPrintTest] = useState<BloodTest | null>(null);
  const [printPrescription, setPrintPrescription] = useState(false);
  const [tab, setTab] = useState<"list" | "trends">("list");

  const groups = useMemo(markersByCategory, []);

  const sorted = useMemo(
    () => [...tests].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [tests],
  );

  // Ascending order for time-series (oldest → newest)
  const sortedAsc = useMemo(
    () => [...tests].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [tests],
  );

  // Build per-marker series: only markers with ≥2 numeric data points
  const markerSeries = useMemo(() => {
    const out: Record<string, { date: string; value: number }[]> = {};
    for (const m of BLOOD_MARKERS) {
      const pts = sortedAsc
        .map((t) => {
          const raw = t.markers[m.key];
          if (raw === "" || raw === undefined || raw === null) return null;
          const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
          if (isNaN(n)) return null;
          return { date: t.date, value: n };
        })
        .filter((p): p is { date: string; value: number } => p !== null);
      if (pts.length >= 2) out[m.key] = pts;
    }
    return out;
  }, [sortedAsc]);

  const startCreate = () => {
    setEditing(blank());
    setEditingId(null);
  };
  const startEdit = (t: BloodTest) => {
    setEditing({ ...t, markers: { ...t.markers } });
    setEditingId(t.id);
    setViewingId(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditingId(null);
  };
  const save = () => {
    if (!editing) return;
    setTests((p) => {
      if (editingId) {
        return p.map((t) => (t.id === editingId ? { ...editing, id: editingId } : t));
      }
      return [...p, { ...editing, id: newId() }];
    });
    cancelEdit();
  };
  const remove = (id: string) => {
    if (!confirm("Supprimer ce bilan ?")) return;
    setTests((p) => p.filter((t) => t.id !== id));
    if (viewingId === id) setViewingId(null);
  };

  const updateMarker = (key: string, v: string) => {
    if (!editing) return;
    setEditing({ ...editing, markers: { ...editing.markers, [key]: v } });
  };

  const printDetail = (t: BloodTest) => {
    setPrintTest(t);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintTest(null), 1500);
    }, 200);
  };
  const printRx = () => {
    setPrintPrescription(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintPrescription(false), 1500);
    }, 200);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader kicker="Où tu en es" title="Bilans biologiques" />
        <Empty>Chargement…</Empty>
      </div>
    );
  }

  // ============================================================
  // EDITOR
  // ============================================================
  if (editing) {
    return (
      <div>
        <div className="screen-only">
          <PageHeader
            kicker="Où tu en es"
            title={editingId ? "Modifier un bilan" : "Nouveau bilan biologique"}
          />

          <div className="card p-4 mb-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <Field label="Date du prélèvement">
                <input type="date" className="input" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </Field>
              <Field label="Laboratoire (optionnel)">
                <input className="input" value={editing.laboratoire || ""} onChange={(e) => setEditing({ ...editing, laboratoire: e.target.value })} placeholder="ex. Biogroup" />
              </Field>
              <Field label="Médecin prescripteur (optionnel)">
                <input className="input" value={editing.prescripteur || ""} onChange={(e) => setEditing({ ...editing, prescripteur: e.target.value })} placeholder="ex. Dr Martin" />
              </Field>
            </div>
          </div>

          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="card p-4 mb-3.5" style={{ borderLeft: `5px solid ${CATEGORY_META[cat].color}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div style={{ fontSize: 20 }}>{CATEGORY_META[cat].icon}</div>
                <div className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
                  {CATEGORY_META[cat].label}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(groups[cat] ?? []).map((m) => {
                  const ev = evaluateMarker(m, editing.markers[m.key], sex);
                  const rng = ev.range;
                  return (
                    <div key={m.key} className="bg-[var(--color-surface-2)] rounded-lg p-3" style={{ border: "1px solid var(--color-border)" }}>
                      <div className="flex justify-between gap-2 mb-1">
                        <div className="font-bold text-sm">{m.label}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{m.unit}</div>
                      </div>
                      <input
                        className="input"
                        type="text"
                        inputMode="decimal"
                        value={editing.markers[m.key] ?? ""}
                        onChange={(e) => updateMarker(m.key, e.target.value)}
                        placeholder={`ex. ${rng.optimalMin ?? rng.normalMin}`}
                      />
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                        Norme : {rng.normalMin}-{rng.normalMax} {m.unit}
                        {rng.optimalMin !== undefined && rng.optimalMax !== undefined && (
                          <> · <b style={{ color: "var(--color-success)" }}>Optimal endurance : {rng.optimalMin}-{rng.optimalMax}</b></>
                        )}
                      </div>
                      {ev.status !== "missing" && (
                        <div
                          className="mt-1.5 text-[11px] font-bold rounded px-2 py-1 inline-block"
                          style={{ color: STATUS_META[ev.status].color, background: STATUS_META[ev.status].bg }}
                        >
                          {STATUS_META[ev.status].label}
                          {ev.alert && <> · {ev.alert}</>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="card p-4 mb-3.5">
            <Field label="Notes / contexte">
              <textarea
                className="input"
                style={{ minHeight: 80, resize: "vertical" }}
                value={editing.notes || ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                placeholder="Contexte de prise (à jeun, période d'affûtage, après une grosse charge…)"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 mb-4">
            <button onClick={cancelEdit} className="btn-ghost">Annuler</button>
            <button onClick={save} className="btn-primary">
              {editingId ? "Enregistrer les modifications" : "Enregistrer le bilan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // DETAIL VIEW (single test)
  // ============================================================
  const cur = sorted.find((t) => t.id === viewingId);
  if (cur) {
    const alerts = countAlerts(cur, sex);
    const optimal = countOptimal(cur, sex);
    const filled = countFilled(cur);

    return (
      <div>
        <div className="screen-only">
          <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
            <button onClick={() => setViewingId(null)} className="btn-ghost btn-sm">
              ← Tous les bilans
            </button>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => startEdit(cur)} className="btn-dark btn-sm">✏️ Modifier</button>
              <button onClick={() => printDetail(cur)} className="btn-dark btn-sm">📄 Exporter en PDF</button>
            </div>
          </div>

          <PageHeader
            kicker="Où tu en es"
            title={`Bilan du ${dateLong(cur.date)}`}
            desc={[cur.laboratoire, cur.prescripteur].filter(Boolean).join(" · ") || undefined}
          />

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Kpi label="Marqueurs renseignés" value={`${filled}/${BLOOD_MARKERS.length}`} color="var(--color-dark)" />
            <Kpi label="Dans l'optimal" value={optimal} note="endurance" color="var(--color-success)" />
            <Kpi label="Alertes" value={alerts} color={alerts > 0 ? "var(--color-danger)" : "var(--color-text-muted)"} />
          </div>

          {(() => {
            const cc = generateConclusion(cur.markers, sex);
            const meta = CONCLUSION_STATUS_META[cc.status];
            return (
              <div
                className="card p-4 mb-4"
                style={{ borderLeft: `5px solid ${meta.color}`, background: meta.bg }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <div
                    className="text-[10px] uppercase font-extrabold"
                    style={{ letterSpacing: ".08em", color: meta.color }}
                  >
                    Conclusion du bilan · {meta.label}
                  </div>
                </div>
                <div className="font-display font-extrabold text-base mb-3" style={{ letterSpacing: "-0.01em" }}>
                  {cc.summary}
                </div>

                {cc.patterns.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                      🔍 Patterns cliniques détectés
                    </div>
                    <ul className="space-y-1 text-sm">
                      {cc.patterns.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cc.alerts.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-danger)" }}>
                      ⚠️ Points d&apos;attention ({cc.alerts.length})
                    </div>
                    <ul className="space-y-1 text-sm">
                      {cc.alerts.map((a, i) => (
                        <li key={i}>
                          • <b>{a.label}</b> — {a.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cc.strengths.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-success)" }}>
                      ✅ Points forts ({cc.strengths.length})
                    </div>
                    <div className="text-sm">
                      {cc.strengths.join(" · ")}
                    </div>
                  </div>
                )}

                {cc.recommendations.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-1.5" style={{ letterSpacing: ".08em", color: "var(--color-primary)" }}>
                      💡 Recommandations
                    </div>
                    <ul className="space-y-1 text-sm">
                      {cc.recommendations.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-[10px] text-[var(--color-text-muted)] italic mt-3">
                  ⓘ Conclusion automatique générée à partir des seuils sportif endurance. Ne remplace pas l&apos;avis d&apos;un médecin ou diététicien.
                </div>
              </div>
            );
          })()}

          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="card p-4 mb-3" style={{ borderLeft: `5px solid ${CATEGORY_META[cat].color}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div style={{ fontSize: 20 }}>{CATEGORY_META[cat].icon}</div>
                <div className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
                  {CATEGORY_META[cat].label}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(groups[cat] ?? []).map((m) => {
                  const ev = evaluateMarker(m, cur.markers[m.key], sex);
                  const value = cur.markers[m.key];
                  return (
                    <div
                      key={m.key}
                      className="rounded-lg p-3"
                      style={{ background: STATUS_META[ev.status].bg, border: `1px solid ${STATUS_META[ev.status].color}33` }}
                    >
                      <div className="flex justify-between gap-2 items-baseline">
                        <div className="font-bold text-sm">{m.label}</div>
                        <div className="font-extrabold text-xl" style={{ color: STATUS_META[ev.status].color, fontFamily: "var(--font-display)" }}>
                          {value !== "" && value != null ? value : "—"}
                          {value !== "" && value != null && (
                            <span className="text-[11px] text-[var(--color-text-muted)] font-bold ml-1">{m.unit}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        Norme {ev.range.normalMin}-{ev.range.normalMax}
                        {ev.range.optimalMin !== undefined && ev.range.optimalMax !== undefined && (
                          <> · optimal {ev.range.optimalMin}-{ev.range.optimalMax}</>
                        )}
                      </div>
                      {ev.status !== "missing" && (
                        <div className="text-[11px] font-bold mt-1.5" style={{ color: STATUS_META[ev.status].color }}>
                          ● {STATUS_META[ev.status].label}
                          {ev.alert && <span className="font-normal text-[var(--color-text)] ml-1">— {ev.alert}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {cur.notes && (
            <div className="card p-4 mb-3.5">
              <div className="font-extrabold mb-1 text-sm">Notes / contexte</div>
              <div className="text-sm whitespace-pre-wrap">{cur.notes}</div>
            </div>
          )}
        </div>

        {printTest && (
          <PrintReport
            kicker="Où tu en es"
            title={`Bilan biologique du ${dateLong(printTest.date)}`}
            subtitle={[printTest.laboratoire, printTest.prescripteur].filter(Boolean).join(" · ")}
          >
            {(() => {
              const cc = generateConclusion(printTest.markers, sex);
              const meta = CONCLUSION_STATUS_META[cc.status];
              return (
                <div className="no-break" style={{ marginBottom: 16, borderLeft: `4px solid ${meta.color}`, background: meta.bg, padding: "12px 14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, color: meta.color, letterSpacing: ".08em", marginBottom: 4 }}>
                    Conclusion · {meta.label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{cc.summary}</div>
                  {cc.patterns.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#FF4501", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Patterns cliniques</div>
                      {cc.patterns.map((p, i) => <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>• {p}</div>)}
                    </div>
                  )}
                  {cc.alerts.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#cf2e2e", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Points d&apos;attention</div>
                      {cc.alerts.map((a, i) => <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>• <b>{a.label}</b> — {a.message}</div>)}
                    </div>
                  )}
                  {cc.recommendations.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#FF4501", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Recommandations</div>
                      {cc.recommendations.map((r, i) => <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>• {r}</div>)}
                    </div>
                  )}
                </div>
              );
            })()}

            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="no-break" style={{ marginBottom: 14 }}>
                <PrintH>{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</PrintH>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e6e6e3", background: "#fafaf8" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, width: "30%" }}>Marqueur</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 700, width: "16%" }}>Résultat</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, width: "18%" }}>Norme</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, width: "16%" }}>Optimal</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, width: "20%" }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groups[cat] ?? []).map((m) => {
                      const ev = evaluateMarker(m, printTest.markers[m.key], sex);
                      const value = printTest.markers[m.key];
                      return (
                        <tr key={m.key} style={{ borderBottom: "1px solid #f1f1ee" }}>
                          <td style={{ padding: "6px 8px" }}>{m.label}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>
                            {value !== "" && value != null ? `${value} ${m.unit}` : "—"}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#787876" }}>
                            {ev.range.normalMin}-{ev.range.normalMax}
                          </td>
                          <td style={{ padding: "6px 8px", color: "#5f8c0a" }}>
                            {ev.range.optimalMin !== undefined ? `${ev.range.optimalMin}-${ev.range.optimalMax}` : "—"}
                          </td>
                          <td style={{ padding: "6px 8px", color: STATUS_META[ev.status].color, fontWeight: 700 }}>
                            {STATUS_META[ev.status].label}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            {printTest.notes && (
              <div className="no-break" style={{ marginTop: 12 }}>
                <PrintH>Notes / contexte</PrintH>
                <div style={{ fontSize: 11, background: "#fafaf8", borderRadius: 8, padding: "10px 12px", borderLeft: "4px solid #FF4501", whiteSpace: "pre-wrap" }}>
                  {printTest.notes}
                </div>
              </div>
            )}
          </PrintReport>
        )}
      </div>
    );
  }

  // ============================================================
  // LIST VIEW
  // ============================================================
  return (
    <div>
      <div className="screen-only">
        <PageHeader
          kicker="Où tu en es"
          title="Bilans biologiques"
          action={
            <div className="flex gap-2 flex-wrap">
              <button onClick={printRx} className="btn-ghost">📄 Fiche médecin (à imprimer)</button>
              <button onClick={startCreate} className="btn-primary">+ Nouveau bilan</button>
            </div>
          }
          desc="Suivi des biomarqueurs clés (fer, hormones, vitamine D, inflammation) avec seuils calés pour le sportif d'endurance."
        />

        <HelpSection title="ℹ️ Bilans biologiques — pourquoi et comment ?">
          <HelpBlock icon="🎯" title="Pourquoi">
            <p>
              Chez les sportifs d&apos;endurance, la performance peut chuter sans signal évident :
              <b> carence en fer / ferritine, vitamine D, T3 basse, cortisol élevé, CRP qui s&apos;envole…</b>
              Sans bilan biologique, on optimise dans le noir. Le bilan permet de poser un état de référence
              et de détecter les leviers cachés de progression (ou les signaux précoces de surentraînement / RED-S).
            </p>
          </HelpBlock>
          <HelpBlock icon="📝" title="Comment faire">
            <ul className="list-disc pl-5 space-y-1">
              <li>Clique sur <b>📄 Fiche médecin</b> pour obtenir la liste à donner à ton médecin (prescription)</li>
              <li>Une fois ton bilan reçu, clique sur <b>+ Nouveau bilan</b> et saisis tes valeurs</li>
              <li>Les seuils sont <b>calés pour le sportif d&apos;endurance</b> (pas juste les normes labo) — alerte automatique en dehors</li>
              <li>Refais un bilan tous les <b>3-6 mois</b> pour suivre l&apos;évolution et adapter la stratégie</li>
            </ul>
          </HelpBlock>
        </HelpSection>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button onClick={() => setTab("list")} className={tab === "list" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            📋 Mes bilans ({sorted.length})
          </button>
          <button onClick={() => setTab("trends")} className={tab === "trends" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}>
            📈 Évolution dans le temps
          </button>
        </div>

        {tab === "list" && (sorted.length === 0 ? (
          <Empty>
            Aucun bilan enregistré. Commence par télécharger la <b>fiche médecin</b> pour la prescription,
            puis saisis les valeurs reçues du laboratoire.
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((t) => {
              const alerts = countAlerts(t, sex);
              const optimal = countOptimal(t, sex);
              const filled = countFilled(t);
              return (
                <div
                  key={t.id}
                  className="card overflow-hidden cursor-pointer"
                  onClick={() => setViewingId(t.id)}
                  style={{ transition: "transform .12s ease, box-shadow .12s ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ background: "var(--color-dark)", color: "#fff" }}>
                    <div>
                      <div className="font-display font-extrabold text-lg" style={{ letterSpacing: "-0.01em" }}>
                        Bilan du {dateLong(t.date)}
                      </div>
                      {(t.laboratoire || t.prescripteur) && (
                        <div className="text-xs text-[#bbb] mt-0.5">
                          {[t.laboratoire, t.prescripteur].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: "rgba(95,140,10,0.25)", color: "#9bd34a", letterSpacing: ".06em" }}>
                        {optimal} optimal
                      </span>
                      {alerts > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: "rgba(207,46,46,0.3)", color: "#ff8484", letterSpacing: ".06em" }}>
                          {alerts} alerte{alerts > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-[10px] text-[#bbb]">{filled}/{BLOOD_MARKERS.length} renseignés</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex justify-between items-center" style={{ background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)" }}>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      Cliquer pour ouvrir
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(t); }}
                        className="btn-ghost btn-xs"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                        style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 14 }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {tab === "trends" && (
          Object.keys(markerSeries).length === 0 ? (
            <Empty>
              Au moins <b>2 bilans</b> avec une valeur commune sont nécessaires pour afficher l&apos;évolution.
              Saisis un second bilan pour activer cette vue.
            </Empty>
          ) : (
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-3">
                Évolution des marqueurs disposant d&apos;au moins 2 mesures. La zone verte représente la
                cible <b>optimale endurance</b>, les pointillés rouges les seuils d&apos;alerte.
              </div>
              {CATEGORY_ORDER.map((cat) => {
                const markersInCat = (groups[cat] ?? []).filter((m) => markerSeries[m.key]);
                if (markersInCat.length === 0) return null;
                return (
                  <div key={cat} className="card p-4 mb-3" style={{ borderLeft: `5px solid ${CATEGORY_META[cat].color}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ fontSize: 18 }}>{CATEGORY_META[cat].icon}</div>
                      <div className="font-display font-extrabold text-base" style={{ letterSpacing: "-0.01em" }}>
                        {CATEGORY_META[cat].label}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {markersInCat.map((m) => {
                        const series = markerSeries[m.key];
                        const range = m.sexSpecific && sex
                          ? (m.ranges.find((r) => r.sex === sex) ?? m.ranges[0])
                          : m.ranges[0];
                        const first = series[0].value;
                        const last = series[series.length - 1].value;
                        const delta = last - first;
                        const pct = first !== 0 ? (delta / first) * 100 : 0;
                        const arrow = delta > 0.001 ? "↗" : delta < -0.001 ? "↘" : "→";
                        const lastEval = evaluateMarker(m, last, sex);
                        return (
                          <div key={m.key} className="rounded-lg p-3" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div className="flex justify-between items-baseline mb-1">
                              <div className="font-bold text-sm">{m.label}</div>
                              <div className="text-[10px] text-[var(--color-text-muted)]">{m.unit}</div>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                              <span className="font-extrabold text-xl" style={{ color: STATUS_META[lastEval.status].color, fontFamily: "var(--font-display)" }}>
                                {last}
                              </span>
                              <span className="text-[11px] font-bold" style={{ color: delta > 0 ? "var(--color-success)" : delta < 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                                {arrow} {delta > 0 ? "+" : ""}{delta.toFixed(2)} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                              </span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                · {series.length} mesure{series.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            <ResponsiveContainer width="100%" height={170}>
                              <LineChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                <CartesianGrid stroke="#e6e6e3" strokeDasharray="2 3" />
                                {range.optimalMin !== undefined && range.optimalMax !== undefined && (
                                  <ReferenceArea
                                    y1={range.optimalMin}
                                    y2={range.optimalMax}
                                    fill="rgba(95,140,10,0.14)"
                                    fillOpacity={1}
                                    stroke="none"
                                  />
                                )}
                                {range.alertBelow !== undefined && (
                                  <ReferenceLine y={range.alertBelow} stroke="#cf2e2e" strokeDasharray="3 3" />
                                )}
                                {range.alertAbove !== undefined && (
                                  <ReferenceLine y={range.alertAbove} stroke="#cf2e2e" strokeDasharray="3 3" />
                                )}
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10, fill: "#787876" }}
                                  tickFormatter={(d) => {
                                    const dt = new Date(d + "T00:00:00");
                                    return dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
                                  }}
                                />
                                <YAxis tick={{ fontSize: 10, fill: "#787876" }} />
                                <Tooltip
                                  formatter={(v: number) => [`${v} ${m.unit}`, m.label]}
                                  labelFormatter={(d) => dateLong(d as string)}
                                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="var(--color-primary)"
                                  strokeWidth={2.5}
                                  dot={{ r: 4, fill: "var(--color-primary)" }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* PDF — Fiche médecin pour prescription */}
      {printPrescription && (
        <PrintReport
          kicker="À donner au médecin"
          title="Bilan biologique initial — sportif d'endurance"
          subtitle="Liste des biomarqueurs à prescrire pour un suivi nutritionnel structuré"
        >
          <div style={{ fontSize: 11, background: "#fafaf8", borderRadius: 8, padding: "12px 14px", borderLeft: "4px solid #FF4501", marginBottom: 16 }}>
            <b>🔍 Pourquoi ce bilan ?</b>
            <br />
            Ce bilan a pour objectif de poser un état de référence précis avant le démarrage d&apos;un suivi
            nutritionnel structuré, dans le cadre de la pratique d&apos;un sport d&apos;endurance (course à
            pied, trail, triathlon, cyclisme, etc.). Il permet d&apos;évaluer le statut énergétique et
            micronutritionnel global, de dépister d&apos;éventuelles carences ou excès, de vérifier le bon
            fonctionnement hormonal, de repérer les signes précoces de surentraînement ou d&apos;inflammation,
            et de personnaliser les apports nutritionnels.
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#0a0a0a", color: "#fff" }}>
                <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 800, fontSize: 11 }}>Biomarqueur</th>
                <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 800, fontSize: 11 }}>Utilité spécifique chez le sportif d&apos;endurance</th>
              </tr>
            </thead>
            <tbody>
              {BLOOD_MARKERS.map((m, i) => (
                <tr key={m.key} style={{ background: i % 2 ? "#fafaf8" : "#fff", borderBottom: "1px solid #e6e6e3" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, width: "30%" }}>{m.label}</td>
                  <td style={{ padding: "8px 10px" }}>{m.utility}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, fontSize: 10.5, color: "#787876", textAlign: "right", fontStyle: "italic" }}>
            Florian Mouchel — Diététicien du sport · Fondateur de Nutriocus
          </div>
        </PrintReport>
      )}
    </div>
  );
}
