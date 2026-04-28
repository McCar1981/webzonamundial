import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
  OAuth + magic-link callback handler.

  Supabase redirects users here after they click the magic-link email or
  complete the Google/Apple OAuth flow. We exchange the `code` for a
  session and bounce them to `next` (or "/").
*/

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Same-origin only — never honor an open-redirect.
  const safeNext = next.startsWith("/") ? next : "/";

  // Si el usuario aún no completó onboarding y no pidió un destino
  // específico (ej. checkout, liga concreta), llévalo al wizard.
  // Si pidió un destino, respétalo — vuelve al onboarding después
  // desde el menú si quiere.
  if (safeNext === "/") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarded_at) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
