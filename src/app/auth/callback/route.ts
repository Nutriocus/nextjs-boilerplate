import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (!code) return NextResponse.redirect(`${appUrl}/auth/error?reason=no-code`);

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !session) {
    return NextResponse.redirect(`${appUrl}/auth/error?reason=no-session&err=${sessionError?.message ?? "unknown"}`);
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  if (coach) return NextResponse.redirect(`${appUrl}/coach`);

  const { data: athlete } = await supabase
    .from("athletes")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  if (athlete) return NextResponse.redirect(`${appUrl}/athlete/dashboard`);

  return NextResponse.redirect(`${appUrl}/auth/error?reason=no-role&uid=${session.user.id}&coach-err=${coachError?.message ?? "none"}`);
}
