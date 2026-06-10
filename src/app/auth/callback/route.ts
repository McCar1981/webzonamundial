import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/*
  OAuth + magic-link callback handler.

  Soporta DOS modos según el parámetro recibido:

  1) PKCE OAuth (?code=xxx)
     Usado por Google y Apple Sign-In, donde el código requiere ser
     intercambiado por una sesión usando el "code verifier" guardado
     en el navegador del usuario (que inició el flow).
     Funciona porque OAuth se completa en el MISMO navegador.

  2) OTP magic-link (?token_hash=xxx&type=magiclink)
     Usado para emails de confirmación/login enviados por Supabase.
     verifyOtp NO necesita PKCE verifier — el token_hash es validable
     server-side directamente. Esto permite que el usuario abra el
     email en cualquier dispositivo/navegador y siga funcionando.

  IMPORTANTE: el template de email DEBE enlazar a este endpoint con
  token_hash en vez de usar la ConfirmationURL nativa de Supabase
  (que lleva ?code=... y rompe cross-device).

  Ejemplo de URL en el botón del email:
    {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/onboarding
*/

const OTP_TYPES: ReadonlyArray<EmailOtpType> = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return (OTP_TYPES as ReadonlyArray<string>).includes(raw)
    ? (raw as EmailOtpType)
    : null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
  const otpType = parseOtpType(searchParams.get("type"));
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
  if (providerError && !code && !tokenHash) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(providerError)}`,
    );
  }

  const supabase = createSupabaseServerClient();

  // --- Caso 1: token_hash → verifyOtp (cross-device, magic link) ---
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }
  // --- Caso 2: code → exchangeCodeForSession (PKCE OAuth) ---
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  }
  // --- Sin ninguno: error ---
  else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
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

  // Alta LIGERA desde una porra de bar: si el destino es la página de un bar
  // (/b/...), el usuario llegó por el QR del local y NO debe pasar por el
  // onboarding largo de ZM. Lo marcamos como onboarded automáticamente ("la
  // trampa": queda registrado en ZM, pero sin los pasos largos) y lo dejamos
  // continuar directo a la peña, donde se completa la unión.
  const isBarFlow = safeNext.startsWith("/b/");

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarded_at) {
      if (isBarFlow) {
        // upsert: si la fila de profiles aún no existe, update() afectaría
        // 0 filas en silencio y el usuario del bar quedaría sin marcar.
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, onboarded_at: new Date().toISOString() },
            { onConflict: "id" }
          );
      } else {
        const onboardingUrl = new URL(`${origin}/onboarding`);
        if (safeNext !== "/") {
          onboardingUrl.searchParams.set("next", safeNext);
        }
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
