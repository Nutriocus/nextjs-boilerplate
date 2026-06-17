"use client";

// Parse a Nutriocus race plan PDF into a structured RacePlan.
// Tolerant to small layout drifts; targets the format used in coach exports.

export type ParsedRacePlan = {
  name: string;
  km: string;
  dplus: string;
  objectif: string;
  choPerH: string;
  hydratationPerH: string;
  avantCourse: string[];
  segments: {
    nom: string;
    km: string;
    heure: string;
    temps: string;
    contenu: string[];
  }[];
};

const newId = () => Math.random().toString(36).slice(2, 9);

// Extract text from PDF using pdfjs-dist. Groups text items per line using Y position.
async function extractPdfLines(file: File): Promise<string[]> {
  // Dynamic import keeps pdfjs out of the SSR bundle.
  const pdfjs = await import("pdfjs-dist");

  // Try to load the worker from CDN. If that fails (CDN blocked, version
  // mismatch, CORS), fall back to processing on the main thread so the
  // import still works.
  let useWorker = true;
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  } catch {
    useWorker = false;
  }

  const data = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
  } catch (firstErr) {
    // Retry with worker disabled — slower but works without external worker.
    console.warn("[parse-race-plan-pdf] worker load failed, retrying without worker", firstErr);
    useWorker = false;
    pdf = await pdfjs.getDocument({
      data,
      disableWorker: true,
      isEvalSupported: false,
    } as Parameters<typeof pdfjs.getDocument>[0]).promise;
  }

  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Group items by Y position (rounded to nearest 2px to absorb small jitter).
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const it of content.items as { str: string; transform: number[] }[]) {
      if (!it.str || !it.transform) continue;
      const x = it.transform[4];
      const y = Math.round(it.transform[5] / 2) * 2;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, str: it.str });
    }
    const ys = Array.from(rows.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const items = rows.get(y)!.sort((a, b) => a.x - b.x);
      const line = items.map((i) => i.str).join("").trim();
      if (line) allLines.push(line);
    }
  }

  console.log(`[parse-race-plan-pdf] extracted ${allLines.length} lines (worker=${useWorker})`);
  console.log("[parse-race-plan-pdf] first 30 lines:\n" + allLines.slice(0, 30).map((l, i) => `${i + 1}. ${l}`).join("\n"));
  return allLines;
}

// Split a content line that has multiple items glued together (e.g.
// "Sur le ravitaillement =2 gobelets d'eau1 gel Nutripure (1H52)Flasque 1 = 90g …").
function splitContentLine(text: string): string[] {
  const markers: RegExp[] = [
    /(?=Flasque\s+\d)/g,
    /(?=Gel\s+[A-ZÉÈÀ])/g,
    /(?=Pâte de fruit)/g,
    /(?=Pate de fruit)/g,
    /(?=Sur le ravitaillement)/g,
    /(?<=\D)(?=\d+\s+gobelet)/g,
    /(?<=\D)(?=\d+\s+gel\s)/g,
    /(?<=\D)(?=\d+\s+gélule)/g,
    /(?<=\D)(?=\d+\s+gel\s)/g,
    /(?=Prendre\s)/g,
    /(?=Prise de\s)/g,
    /(?=\d+H\d+\s+avant\s)/g,
    /(?=\d+\s+minutes?\s+avant\s)/g,
    /(?=\d+\s+heures?\s+avant\s)/g,
  ];
  let s = text;
  for (const m of markers) s = s.replace(m, "\n");
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// Parse a segment header line.
// Examples:
//   "DEPART DE LA COURSE - 5H30"
//   "BOUT DU MONDE - RAVITAILLEMENT 1 - KM 14,9 - 1H52 - 8H22"
//   "MALAUCÈNE - ARRIVEE - 86,1 KM - 10H40 - 17H10"
type SegHeader = { nom: string; km: string; heure: string; temps: string };
function tryParseSegmentHeader(line: string): SegHeader | null {
  if (!/(RAVITAILLEMENT|DEPART|ARRIVEE|ARRIVÉE)/i.test(line)) return null;
  const parts = line.split(/\s+-\s+/);
  const nameParts: string[] = [];
  let km = "";
  const times: string[] = [];
  for (const p of parts) {
    const trimmed = p.trim();
    if (/^KM\s+[\d,\.]+$/i.test(trimmed)) {
      km = trimmed.replace(/^KM\s+/i, "").replace(",", ".");
    } else if (/^[\d,\.]+\s*KM$/i.test(trimmed)) {
      km = trimmed.replace(/\s*KM$/i, "").replace(",", ".");
    } else if (/^\d{1,2}H\d{2}$/i.test(trimmed)) {
      times.push(trimmed.toUpperCase());
    } else {
      nameParts.push(trimmed);
    }
  }
  // One time = clock time (heure). Two times = elapsed (temps) then clock (heure).
  let temps = "";
  let heure = "";
  if (times.length === 1) {
    heure = times[0];
  } else if (times.length >= 2) {
    temps = times[0];
    heure = times[1];
  }
  return { nom: nameParts.join(" - "), km, heure, temps };
}

// Pull a number out of strings like "89 grammes" or "730 ml".
function extractFirstNumber(s: string): string {
  const m = s.match(/(\d+(?:[\.,]\d+)?)/);
  return m ? m[1].replace(",", ".") : "";
}

// Parse the cumulative summary that often sits at the bottom of the last page
// (e.g. "Hydratation =...4 flasques: 45g Boisson...").
function isSummaryHeader(line: string): boolean {
  return /^(Hydratation|Solide|Total)\s*[:=]/i.test(line) || /^Hydratation\s*$/i.test(line);
}

export function parseRacePlanLines(lines: string[]): ParsedRacePlan | null {
  const plan: ParsedRacePlan = {
    name: "",
    km: "",
    dplus: "",
    objectif: "",
    choPerH: "",
    hydratationPerH: "",
    avantCourse: [],
    segments: [],
  };

  let mode: "idle" | "avant" | "segment" | "summary" = "idle";
  let current: ParsedRacePlan["segments"][number] | null = null;

  // Title: usually the first non-trivial line of the document.
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.length < 6) continue;
    if (/^(COURSE|OBJECTIF|GLUCIDES|HYDRATATION|AVANT)\b/i.test(line)) break;
    plan.name = line;
    break;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Skip the bottom cumulative summary (useful info but doesn't fit our model)
    if (isSummaryHeader(line)) {
      mode = "summary";
      continue;
    }
    if (mode === "summary") continue;

    // Headers — case-insensitive, tolerant to spacing.
    if (/COURSE\s+[\d,\.]+\s*KM/i.test(line) && !plan.km) {
      const m = line.match(/([\d,\.]+)\s*KM\s*[-–]\s*([\d,\.]+)\s*m?\s*D\+/i);
      if (m) {
        plan.km = m[1].replace(",", ".");
        plan.dplus = m[2].replace(",", ".");
      } else {
        const km = line.match(/([\d,\.]+)\s*KM/i);
        if (km) plan.km = km[1].replace(",", ".");
        const dp = line.match(/([\d,\.]+)\s*m?\s*D\+/i);
        if (dp) plan.dplus = dp[1].replace(",", ".");
      }
      if (line === plan.name) continue;
      continue;
    }
    if (/^OBJECTIF\b/i.test(line)) {
      plan.objectif = line.replace(/^OBJECTIF\s*[:=]?\s*/i, "").trim();
      continue;
    }
    if (/^GLUCIDES\b/i.test(line)) {
      plan.choPerH = extractFirstNumber(line);
      continue;
    }
    if (/^HYDRATATION\b/i.test(line)) {
      plan.hydratationPerH = extractFirstNumber(line);
      continue;
    }
    if (/^AVANT\s+LA\s+COURSE/i.test(line)) {
      mode = "avant";
      continue;
    }
    if (/^TEMPS\s+ESTIME/i.test(line)) {
      if (current) {
        const val = line.replace(/^TEMPS\s+ESTIME\s*[:=]?\s*/i, "").trim();
        if (!current.temps) current.temps = val;
      }
      continue;
    }

    // Try to parse as segment header
    const seg = tryParseSegmentHeader(line);
    if (seg) {
      current = {
        nom: seg.nom,
        km: seg.km,
        heure: seg.heure,
        temps: seg.temps,
        contenu: [],
      };
      plan.segments.push(current);
      mode = "segment";
      continue;
    }

    // Skip the title line itself if it appears again
    if (line === plan.name) continue;

    // Content
    if (mode === "avant") {
      splitContentLine(line).forEach((l) => plan.avantCourse.push(l));
    } else if (mode === "segment" && current) {
      splitContentLine(line).forEach((l) => current!.contenu.push(l));
    }
  }

  if (!plan.name && plan.segments.length > 0) plan.name = "Plan importé";
  if (!plan.name) return null;
  if (plan.segments.length === 0 && plan.avantCourse.length === 0) return null;

  return plan;
}

export async function parseRacePlanFromPdfFile(
  file: File,
): Promise<{ plan: ParsedRacePlan | null; rawLines: string[] }> {
  const lines = await extractPdfLines(file);
  const plan = parseRacePlanLines(lines);
  return { plan, rawLines: lines };
}

export function parsedToRacePlan<T extends ParsedRacePlan>(parsed: T) {
  return { id: newId(), ...parsed };
}
