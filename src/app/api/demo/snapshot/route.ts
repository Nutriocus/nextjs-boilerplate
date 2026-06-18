import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 3600;

const DEMO_EMAIL = "nutriocus@gmail.com";

const ALLOWED_ORIGINS = [
  "https://nutriocus.com",
  "https://www.nutriocus.com",
  "https://plateforme.nutriocus.com",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://nutriocus.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: Request) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE env vars" },
        { status: 500, headers },
      );
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: athlete, error: athleteErr } = await admin
      .from("athletes")
      .select("id, coach_id, first_name, last_name")
      .eq("email", DEMO_EMAIL)
      .maybeSingle();

    if (athleteErr || !athlete) {
      return NextResponse.json(
        { error: `Demo athlete not found (${DEMO_EMAIL})` },
        { status: 404, headers },
      );
    }

    const [athleteRows, coachRows] = await Promise.all([
      admin.from("athlete_data").select("key, data").eq("athlete_id", athlete.id),
      athlete.coach_id
        ? admin.from("coach_data").select("key, data").eq("coach_id", athlete.coach_id)
        : Promise.resolve({ data: [] as { key: string; data: unknown }[] }),
    ]);

    const athleteMap: Record<string, unknown> = {};
    for (const row of athleteRows.data ?? []) athleteMap[row.key] = row.data;

    const coachMap: Record<string, unknown> = {};
    for (const row of (coachRows.data ?? []) as { key: string; data: unknown }[]) {
      // Strip academy videos from the demo (paid content gating).
      if (row.key === "academy_library" || row.key === "formation_library") continue;
      coachMap[row.key] = row.data;
    }

    return NextResponse.json(
      {
        athlete: {
          id: athlete.id,
          first_name: athlete.first_name,
          last_name: athlete.last_name,
        },
        athleteData: athleteMap,
        coachData: coachMap,
      },
      {
        status: 200,
        headers: {
          ...headers,
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
