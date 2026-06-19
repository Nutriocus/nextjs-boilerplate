// =====================================================================
// Meal-plan PDF parser — extracts positioned text (x/y) via pdfjs-dist
// and reconstructs the 2-column layout used by Nutriocus / Karim plans.
// Works client-side only (uses pdfjs Web Worker via CDN).
// =====================================================================

export type MealItem = { name: string; qty: string; tip: string };
export type MealSection = { title: string; items: MealItem[] };
export type ParsedMealPlan = {
  name: string;
  kcal: string | number;
  prot: string | number;
  lip: string | number;
  gluc: string | number;
  sections: MealSection[];
};

interface PositionedItem {
  str: string;
  x: number;
  y: number;        // top-down (0 = top of page)
  width: number;
}

const SECTION_KEYWORDS: { regex: RegExp; title: string }[] = [
  { regex: /^PETIT[\s-]*D[EÉ]J/i,            title: "Petit déjeuner" },
  { regex: /^D[EÉ]JEUNER/i,                  title: "Déjeuner" },
  { regex: /^COLLATION/i,                     title: "Collation" },
  { regex: /^ENTRA[ÎI]NEMENT/i,               title: "Entraînement" },
  { regex: /^D[IÎ]NER/i,                      title: "Dîner" },
  { regex: /^SOUPER/i,                        title: "Souper" },
  { regex: /^SUPPL[ÉE]MENT|^COMPL[EÉ]MENT/i,  title: "Compléments" },
];

const ENERGY_REGEX = /^VALEURS\s*ENERG|^VALEURS\s*[ÉE]NERG/i;

async function extractPositionedItems(
  file: File,
): Promise<{ items: PositionedItem[]; pageWidth: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  // Use CDN-hosted worker matching the installed version.
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;

  const items: PositionedItem[] = [];
  let pageWidth = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    if (viewport.width > pageWidth) pageWidth = viewport.width;

    const content = await page.getTextContent();
    for (const raw of content.items) {
      const item = raw as { str?: string; transform?: number[]; width?: number };
      if (!item.str || !item.str.trim()) continue;
      if (!item.transform) continue;
      const x = item.transform[4];
      const yFromBottom = item.transform[5];
      const y = viewport.height - yFromBottom; // flip → top-down
      items.push({
        str: item.str.trim(),
        x,
        y,
        width: item.width ?? 0,
      });
    }
  }
  return { items, pageWidth };
}

/** Group items into rows by y coordinate (with tolerance for slight drift). */
function groupRows(items: PositionedItem[], yTolerance = 3): PositionedItem[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PositionedItem[][] = [];
  let cur: PositionedItem[] = [sorted[0]];
  let curY = sorted[0].y;
  for (let i = 1; i < sorted.length; i++) {
    const it = sorted[i];
    if (Math.abs(it.y - curY) <= yTolerance) {
      cur.push(it);
      // Drift-track: keep a running average so slow downward drift doesn't split
      curY = (curY + it.y) / 2;
    } else {
      rows.push(cur);
      cur = [it];
      curY = it.y;
    }
  }
  rows.push(cur);
  // sort each row left → right
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));
  return rows;
}

function rowText(row: PositionedItem[]): string {
  return row.map((r) => r.str).join(" ").replace(/\s+/g, " ").trim();
}

/** Split a single row into left/right text by the page midline. */
function splitRowByColumn(
  row: PositionedItem[],
  midline: number,
): { left: string; right: string; hasRight: boolean } {
  const leftItems = row.filter((i) => i.x < midline);
  const rightItems = row.filter((i) => i.x >= midline);
  return {
    left: leftItems.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim(),
    right: rightItems.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim(),
    hasRight: rightItems.length > 0,
  };
}

export async function parseMealPlanPdf(file: File): Promise<ParsedMealPlan | null> {
  const { items, pageWidth } = await extractPositionedItems(file);
  if (items.length === 0) return null;

  const rows = groupRows(items, 3);
  if (rows.length === 0) return null;

  // Heuristic midline: use the actual page width / 2 (assumes 2 balanced columns).
  // The Karim/Nutriocus template prints col1 in left half, col2 in right half.
  const midline = pageWidth / 2;

  const planName = rowText(rows[0]);
  const sections: MealSection[] = [];
  let current: MealSection | null = null;
  let energy = { kcal: "" as string | number, prot: "" as string | number, lip: "" as string | number, gluc: "" as string | number };

  let i = 1;
  while (i < rows.length) {
    const row = rows[i];
    const txt = rowText(row);

    // Energy values block — collect remainder & regex out the numbers
    if (ENERGY_REGEX.test(txt)) {
      const remainder = rows.slice(i + 1).map(rowText).join(" ") + " " + txt;
      const mK = remainder.match(/Kcal\s*=\s*(\d+)/i);
      const mP = remainder.match(/Prot[ée]ines?\s*=\s*([\d-]+)/i);
      const mL = remainder.match(/Lipides?\s*=\s*([\d-]+)/i);
      const mG = remainder.match(/Glucides?\s*=\s*([\d-]+)/i);
      if (mK) energy.kcal = parseInt(mK[1], 10);
      if (mP) energy.prot = mP[1];
      if (mL) energy.lip = mL[1];
      if (mG) energy.gluc = mG[1];
      break;
    }

    // Section header — usually the full-width row matching a keyword
    const sec = SECTION_KEYWORDS.find((s) => s.regex.test(txt));
    if (sec) {
      current = { title: sec.title, items: [] };
      sections.push(current);
      i += 1;
      continue;
    }

    if (!current) {
      i += 1;
      continue;
    }

    // Triplet rows: names | qtys | tips
    const nameRow = row;
    const qtyRow = rows[i + 1] ?? [];
    const tipRow = rows[i + 2] ?? [];

    const names = splitRowByColumn(nameRow, midline);
    const qtys = splitRowByColumn(qtyRow, midline);
    const tips = splitRowByColumn(tipRow, midline);

    const isTwoCol = names.hasRight || qtys.hasRight;

    if (isTwoCol) {
      if (names.left || qtys.left || tips.left) {
        current.items.push({ name: names.left, qty: qtys.left, tip: tips.left });
      }
      if (names.right || qtys.right || tips.right) {
        current.items.push({ name: names.right, qty: qtys.right, tip: tips.right });
      }
    } else {
      current.items.push({
        name: names.left || rowText(nameRow),
        qty: qtys.left || rowText(qtyRow),
        tip: tips.left || rowText(tipRow),
      });
    }

    i += 3;
  }

  if (sections.length === 0) return null;

  return {
    name: planName || "Plan importé",
    kcal: energy.kcal,
    prot: energy.prot,
    lip: energy.lip,
    gluc: energy.gluc,
    sections,
  };
}
