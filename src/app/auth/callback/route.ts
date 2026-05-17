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

  // El proveedor (Google/Apple/Supabase) puede devolver un error en la URL
  // ANTES de llegar al exchange. Por ejemplo:
  //   ?error=access_denied&error_description=...
  //   ?error=provider+is+not+enabled
  //   ?error_code=otp_expired
  const providerError =
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    searchParams.get("error_code");
  if (providerError && !code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(providerError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Same-origin only — never honor an open-redirect.
  const safeNext = next.startsWith("/") ? next : "/";

  // Tras un login con éxito comprobamos onboarding. Lo hacemos siempre
  // (no solo cuando safeNext === "/") porque tras pedir "next=/app/xxx"
  // un usuario nuevo aún necesita completar perfil — pero respetamos el
  // destino guardándolo en el parámetro `next` del onboarding.
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
      const onboardingUrl = new URL(`${origin}/onboarding`);
      if (safeNext !== "/") {
        onboardingUrl.searchParams.set("next", safeNext);
      }
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
