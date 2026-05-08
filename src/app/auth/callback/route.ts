import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // Détecter le rôle de l'utilisateur
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (coach) {
        return NextResponse.redirect(`${appUrl}/coach`);
      }

      const { data: athlete } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (athlete) {
        return NextResponse.redirect(`${appUrl}/athlete/dashboard`);
      }

      // Email non reconnu
      return NextResponse.redirect(`${appUrl}/auth/error`);
    }
  }

  return NextResponse.redirect(`${appUrl}/auth/error`);
}
