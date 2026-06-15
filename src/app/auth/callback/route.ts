import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { redeemSignupCode, normalizeSignupCode } from "@/lib/signup-codes/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  // Canje del CÓDIGO DE CAPTACIÓN (estrategia /registro-codigo). El código
  // llega por raw_user_meta_data.signup_code (magic link) o por el parámetro
  // `codigo` de `next` (OAuth Google/Apple). El canje es ATÓMICO e IDEMPOTENTE
  // (una fila por usuario): si ya lo canjeó, no vuelve a abonar Fútcoins.
  // Best-effort — un fallo aquí jamás bloquea el acceso del usuario.
  if (user) {
    try {
      const metaCode =
        (user.user_metadata as { signup_code?: string } | null)?.signup_code || "";
      let urlCode = "";
      const qIdx = next.indexOf("?");
      if (qIdx >= 0) {
        urlCode = new URLSearchParams(next.slice(qIdx + 1)).get("codigo") || "";
      }
      const code = normalizeSignupCode(metaCode || urlCode);
      if (code) await redeemSignupCode(user.id, code);
    } catch {
      // Silencioso: el canje no es crítico para iniciar sesión.
    }
  }

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
        await supabase
          .from("profiles")
          .update({ onboarded_at: new Date().toISOString() })
          .eq("id", user.id);
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
