import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use inside React Client Components.
 * Reads cookies from the browser via document.cookie under the hood.
 *
 * Mantenemos PKCE flow (default) para signInWithPassword y OAuth.
 * Para magic links de email cross-device usamos token_hash + verifyOtp
 * desde /auth/callback (ver src/app/auth/callback/route.ts), porque
 * PKCE requiere que el verifier esté en el mismo browser que inició
 * el flow — lo que rompe cuando el usuario abre el email en otro
 * device. Los templates de email enlazan a /auth/callback con
 * token_hash en vez de la ConfirmationURL nativa de Supabase.
 *
 * Public env vars (must be exposed to the browser, hence NEXT_PUBLIC_):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(url, anonKey);
}
