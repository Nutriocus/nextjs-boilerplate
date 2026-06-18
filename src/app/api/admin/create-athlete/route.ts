import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =====================================================================
// POST /api/admin/create-athlete
// Body: { first_name, last_name, email, sport?, level?, height_cm?, objective? }
//
// Auth: caller must be a logged-in coach (verified via Supabase auth cookie).
// Side effects:
//   1. Creates a Supabase auth user (random password)
//   2. Sends an invitation email so the athlete sets their own password
//   3. Creates the matching `athletes` row with coach_id auto-filled
// =====================================================================

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars (need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 },
      );
    }

    // --- 1. Verify caller is a coach ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const userToken = authHeader.slice(7);
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: coach } = await userClient
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!coach) {
      return NextResponse.json({ error: "Vous n'êtes pas coach" }, { status: 403 });
    }

    // --- 2. Parse body ---
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { first_name, last_name, email, sport, level, height_cm } = body as {
      first_name?: string;
      last_name?: string;
      email?: string;
      sport?: string[];
      level?: string;
      height_cm?: number;
    };
    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "Nom, prénom et email requis" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();

    // --- 3. Admin client (service_role) ---
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- 4. Create or fetch auth user + send invite ---
    const redirectTo =
      (process.env.NEXT_PUBLIC_SITE_URL || "https://plateforme.nutriocus.com") + "/auth/callback";

    let authUserId: string | null = null;

    // Try inviting (creates user + sends email)
    const inviteRes = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo,
      data: { first_name, last_name },
    });

    if (inviteRes.error) {
      // If already exists, fetch the user id manually
      if (/already/i.test(inviteRes.error.message)) {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (!existing) {
          return NextResponse.json(
            { error: "Utilisateur déjà existant mais introuvable. Vérifie dans Supabase." },
            { status: 500 },
          );
        }
        authUserId = existing.id;
      } else {
        return NextResponse.json({ error: inviteRes.error.message }, { status: 500 });
      }
    } else {
      authUserId = inviteRes.data.user?.id ?? null;
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Auth user id introuvable" }, { status: 500 });
    }

    // --- 5. Create athletes row (or update if exists with same email) ---
    const { data: existing } = await admin
      .from("athletes")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      const { error: upErr } = await admin
        .from("athletes")
        .update({
          user_id: authUserId,
          coach_id: coach.id,
          first_name,
          last_name,
          sport: sport || null,
          level: level || null,
          height_cm: height_cm || null,
          status: "active",
        })
        .eq("id", existing.id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, athleteId: existing.id, mode: "updated" });
    }

    const { data: created, error: insErr } = await admin
      .from("athletes")
      .insert({
        user_id: authUserId,
        coach_id: coach.id,
        first_name,
        last_name,
        email: cleanEmail,
        sport: sport || null,
        level: level || null,
        height_cm: height_cm || null,
        status: "active",
      })
      .select("id")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, athleteId: created.id, mode: "created" });
  } catch (e) {
    console.error("[create-athlete] unexpected error", e);
    return NextResponse.json({ error: (e as Error).message || "Erreur inconnue" }, { status: 500 });
  }
}
