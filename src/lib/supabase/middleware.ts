import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase auth session on every request.
 *
 * Run this from the root middleware so cookies stay fresh across SSR
 * and the user doesn't get logged out mid-session.
 */
export async function updateSupabaseSession(request: NextRequest) {
  // Reenviamos el pathname al layout raíz (Server Component), que lo lee con
  // headers().get("x-pathname") para NO emitir el cargador de AdSense en /app/**
  // (donde vive el iframe de apuestas 1xBet). Debe viajar como cabecera de
  // PETICIÓN, así que clonamos request.headers y lo forwardeamos vía
  // NextResponse.next({ request: { headers } }). NOTA: en App Router middleware
  // request.headers es inmutable; por eso se clona en cada NextResponse.next.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env not configured, no-op so the rest of the site keeps working.
  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Re-clonamos para que las cookies de sesión refrescadas se reenvíen,
        // conservando x-pathname.
        const nextHeaders = new Headers(request.headers);
        nextHeaders.set("x-pathname", request.nextUrl.pathname);
        response = NextResponse.next({ request: { headers: nextHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do NOT remove this getUser() call. It's what triggers the
  // session refresh + cookie write that the rest of SSR depends on.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Devolvemos también el user para que el middleware pueda decidir
  // redirecciones basadas EXCLUSIVAMENTE en el estado de sesión (nunca por
  // user-agent), evitando cualquier patrón de cloaking ante Googlebot.
  return { response, user };
}
