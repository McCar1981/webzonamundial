"use client";

// src/components/analytics/AuthEventTracker.tsx
//
// Emite los eventos GA4 de AUTENTICACIÓN del embudo registro → pago:
//   - sign_up  → cuando un usuario completa el ALTA (email magic-link o OAuth).
//   - login    → cuando un usuario ya existente vuelve a entrar.
//
// ¿Por qué un listener de sesión y no el botón de registro?
//   El registro por email NO usa signUp con contraseña: usa magic link
//   (signInWithOtp) → el usuario sale al correo y vuelve por /auth/callback.
//   El registro con Google/Apple también redirige fuera y vuelve por el mismo
//   callback. En AMBOS casos no hay un punto inline donde disparar el evento:
//   la cuenta se confirma en el callback (server) y la sesión se materializa
//   en el cliente. Por eso enganchamos onAuthStateChange: es el único sitio
//   que ve los dos caminos converger.
//
// Alta nueva vs. login recurrente (heurística created_at):
//   Supabase pone user.created_at en el momento en que la cuenta se crea
//   (verificación del magic link / primer OAuth). Si ese instante está dentro
//   de la ventana respecto a ahora → es un ALTA (sign_up); si no, es un LOGIN.
//
// SIGNED_IN vs INITIAL_SESSION:
//   Según la versión de supabase-js, tras el redirect del callback la sesión
//   recién creada puede emitirse como SIGNED_IN (mismo cliente) o como
//   INITIAL_SESSION (cliente nuevo que lee la cookie en la carga siguiente).
//   Atendemos ambos para no perder ninguna alta; los guards evitan duplicados.
//
// Consent Mode v2: trackEvent pasa por window.gtag, que respeta el estado de
// consentimiento configurado en layout.tsx. NO lo saltamos.

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackEvent, setGaUserId } from "@/lib/analytics/track-event";

// Margen para considerar "alta nueva". El brief sugiere ~10 s, pero el viaje
// magic-link/OAuth → verifyOtp → redirect → hidratación + el sesgo de reloj
// entre Supabase (created_at) y el navegador pueden superar 10 s. 60 s sigue
// separando con holgura un alta (segundos de antigüedad) de un login
// recurrente (minutos/horas/días), y el guard once-per-uid blinda contra
// cualquier doble disparo.
const SIGNUP_WINDOW_MS = 60_000;

const SIGNUP_GUARD_PREFIX = "zm_signup_tracked:"; // localStorage (una vez por uid, para siempre)
const LOGIN_GUARD_PREFIX = "zm_login_tracked:"; // sessionStorage (una vez por sesión de navegador)

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string): void {
  try {
    storage?.setItem(key, "1");
  } catch {
    /* modo incógnito / storage lleno: no pasa nada, peor caso un evento extra */
  }
}

/** provider de Supabase → method de GA4. */
function methodFromProvider(provider: string | undefined): string {
  if (provider === "google") return "google";
  if (provider === "apple") return "apple";
  // email magic-link (y cualquier otro) → "email".
  return "email";
}

export default function AuthEventTracker() {
  useEffect(() => {
    const supabase = (() => {
      try {
        return createSupabaseBrowserClient();
      } catch {
        return null;
      }
    })();
    if (!supabase) return;

    const ls = typeof window !== "undefined" ? window.localStorage : undefined;
    const ss = typeof window !== "undefined" ? window.sessionStorage : undefined;

    function handleSession(session: { user?: { id?: string; created_at?: string; app_metadata?: { provider?: string } } } | null) {
      try {
        const user = session?.user;
        if (!user?.id) return;
        const uid = user.id;
        const method = methodFromProvider(user.app_metadata?.provider);

        // Cose esta sesión (la 2.ª, tras el magic-link/OAuth) con la visita
        // original del mismo usuario en GA4, para que la conversión se atribuya
        // a la ola que la originó (hoy queda huérfana y se infravalora).
        setGaUserId(uid);

        const createdMs = user.created_at ? new Date(user.created_at).getTime() : NaN;
        const isNewUser =
          Number.isFinite(createdMs) && Date.now() - createdMs < SIGNUP_WINDOW_MS;

        if (isNewUser) {
          // Alta nueva: exactamente una vez por uid (para siempre en este navegador).
          if (safeGet(ls, SIGNUP_GUARD_PREFIX + uid)) return;
          trackEvent("sign_up", { method });
          safeSet(ls, SIGNUP_GUARD_PREFIX + uid);
          // Marcamos también el guard de login para no contar además un login
          // del mismo usuario en esta misma sesión.
          safeSet(ss, LOGIN_GUARD_PREFIX + uid);
        } else {
          // Login recurrente: como mucho una vez por sesión de navegador, para
          // no spamear en cada recarga / refresco de token.
          if (safeGet(ss, LOGIN_GUARD_PREFIX + uid)) return;
          trackEvent("login", { method });
          safeSet(ss, LOGIN_GUARD_PREFIX + uid);
        }
      } catch {
        /* la analítica nunca debe romper la app */
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Solo nos interesan los eventos que materializan una sesión de entrada.
      // TOKEN_REFRESHED / SIGNED_OUT / USER_UPDATED no son altas ni logins.
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        handleSession(session);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
