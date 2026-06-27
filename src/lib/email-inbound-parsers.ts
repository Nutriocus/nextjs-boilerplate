// =====================================================================
// Inbound email parsers — extract athlete identity, transcript, and
// replay URL from Sembly (forwarded) or Gemini emails.
//
// Both formats are heuristic: we look for known anchors and fall back
// to "give the whole body to Claude" if we can't be sure.
// =====================================================================

export type ParsedInboundEmail = {
  source: "sembly" | "gemini" | "unknown";
  athleteNameCandidates: string[];   // ranked, best first
  emailCandidates: string[];         // ranked, best first
  transcript: string;                // text fed to Claude
  replayUrl: string | null;
};

const STOP_NAMES = new Set([
  "florian mouchel",
  "florian mouchel (nutriocus)",
  "nutriocus",
  "diététicien nutritionniste",
  "diététicien du sport",
]);

function isStopName(s: string): boolean {
  return STOP_NAMES.has(s.trim().toLowerCase());
}

function uniqueOrdered<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x)) { seen.add(x); out.push(x); }
  }
  return out;
}

// ---------------------------------------------------------------------
// Gemini parser
// Sender: gemini-notes@google.com
// Subject: "Notes : "Prénom Nom et NUTRIOCUS 👨‍⚕️ Diététicien Nutritionniste" DD mois YYYY"
// Body: includes "Invité <email>" line, structured sections.
// ---------------------------------------------------------------------

function parseGemini(opts: { subject: string; bodyText: string; from: string }): ParsedInboundEmail {
  const { subject, bodyText } = opts;

  // Name from subject: between "Notes :" and "et NUTRIOCUS"
  const subjectMatch = subject.match(/Notes\s*:\s*["']?(.+?)\s+et\s+NUTRIOCUS/i);
  const nameFromSubject = subjectMatch?.[1]?.trim();

  // Names from "Invité" line in body
  const inviteLine = bodyText.match(/Invit[ée]s?\s+([^\n]+)/i)?.[1] ?? "";
  const inviteNames = inviteLine
    .split(/[,;]| et |Florian/)
    .map((s) => s.trim())
    .filter((s) => s && !isStopName(s) && !/@/.test(s));

  // Email from "Invité" line (e.g. "joh.guillo@gmail.com")
  const emailMatches = Array.from(bodyText.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)).map(
    (m) => m[0].toLowerCase(),
  );
  const athleteEmails = emailMatches.filter(
    (e) => !e.endsWith("@google.com") && !e.includes("nutriocus"),
  );

  const candidates: string[] = [];
  if (nameFromSubject && !isStopName(nameFromSubject)) candidates.push(nameFromSubject);
  candidates.push(...inviteNames);

  // For Gemini, the body already contains a great structured summary —
  // we pass the whole bodyText to Claude (after trimming UI boilerplate).
  const transcript = bodyText
    .replace(/Pi[èe]ces jointes[\s\S]+?Enregistrements de r[ée]unions/i, "")
    .replace(/Nous vous conseillons d'examiner les notes[\s\S]*$/i, "")
    .replace(/Que pensez-vous de la qualit[ée][\s\S]*$/i, "")
    .trim();

  // Replay URL: Gemini puts a Google Drive / Meet link in the body.
  const replayUrl = bodyText.match(/https?:\/\/(?:drive|docs|meet)\.google\.com\/[^\s)>"']+/i)?.[0] ?? null;

  return {
    source: "gemini",
    athleteNameCandidates: uniqueOrdered(candidates),
    emailCandidates: uniqueOrdered(athleteEmails),
    transcript,
    replayUrl,
  };
}

// ---------------------------------------------------------------------
// Sembly parser (forwarded via Gmail automation)
// The body is the raw verbatim transcript with speaker lines like:
//   "Florian MOUCHEL (NUTRIOCUS) 00:00:00"
//   "Prénom Nom 00:00:18"
// The athlete name is whoever speaks that ISN'T "Florian MOUCHEL".
// ---------------------------------------------------------------------

function parseSembly(opts: { subject: string; bodyText: string }): ParsedInboundEmail {
  const { bodyText } = opts;

  // Match lines that look like "Some Name 00:12:34" — speaker headers.
  // Capture the part before the timestamp.
  const speakerLines = Array.from(
    bodyText.matchAll(/^([A-ZÀ-Ÿ][\w\s().\-'À-ÿ]{1,80}?)\s+\d{1,2}:\d{2}:\d{2}\s*$/gm),
  ).map((m) => m[1].trim());

  // Speakers other than Florian = athlete (typically just one)
  const athleteSpeakers = speakerLines.filter((s) => !isStopName(s));

  // Count occurrences to rank
  const counts = new Map<string, number>();
  for (const s of athleteSpeakers) counts.set(s, (counts.get(s) || 0) + 1);
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);

  // Email candidates anywhere in body (rare in Sembly transcripts)
  const emailCandidates = Array.from(bodyText.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g))
    .map((m) => m[0].toLowerCase())
    .filter((e) => !e.includes("nutriocus") && !e.endsWith("@google.com"));

  // No replay URL in raw Sembly transcripts
  return {
    source: "sembly",
    athleteNameCandidates: uniqueOrdered(ranked),
    emailCandidates: uniqueOrdered(emailCandidates),
    transcript: bodyText.trim(),
    replayUrl: null,
  };
}

// ---------------------------------------------------------------------
// Entry point — sniff source from `from` header + body shape.
// ---------------------------------------------------------------------

export function parseInboundEmail(opts: {
  from: string;
  subject: string;
  bodyText: string;
}): ParsedInboundEmail {
  const fromLower = opts.from.toLowerCase();

  if (fromLower.includes("gemini-notes@google.com") || /Notes\s*:\s*".+et NUTRIOCUS/i.test(opts.subject)) {
    return parseGemini(opts);
  }

  // Default: treat as Sembly (forwarded) transcript
  return parseSembly(opts);
}
