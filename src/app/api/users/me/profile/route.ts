// src/app/api/users/me/profile/route.ts
//
// GET /api/users/me/profile
//
// Endpoint dedicado a la integración del equipo móvil. La app iOS/Android
// se loguea con Supabase (Apple/Google), obtiene un access_token JWT, y
// llama aquí para replicar el perfil del usuario (creado en web) a su
// Postgres B en el primer login móvil.
//
// Autenticación: header `Authorization: Bearer <supabase_jwt>`.
// El JWT se valida server-side llamando a auth.getUser() de Supabase,
// que verifica firma + caducidad + revocación contra Supabase Auth.
//
// Devuelve 200 con el perfil, 401 si el JWT es inválido/expirado,
// 404 si el user no tiene perfil todavía (no completó onboarding).
//
// Diseño:
// - CORS abierto (la app móvil llama desde cualquier origen).
// - Solo campos seguros del perfil (nada de secretos ni datos de pago).
// - Idempotente: la app puede llamar las veces que necesite.
// - Cacheado del lado cliente: la app debería cachear y refrescar solo
//   cuando se note que el user editó algo (pull-to-refresh, p.ej).
// - Documentación viva en docs/MOBILE-APP-AUTH-INTEGRATION.md sección 9.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// CORS: aceptar peticiones del backend móvil desde cualquier origen.
// Restricción real: el JWT tiene que ser válido. Sin JWT, 401.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS(): Promise<NextResponse> {
  // Preflight CORS.
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Extraer el JWT del header Authorization.
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return json({ error: "missing_token", message: "Authorization: Bearer <jwt> required" }, 401);
  }
  const accessToken = auth.slice(7).trim();
  if (!accessToken) {
    return json({ error: "empty_token" }, 401);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: "server_misconfigured" }, 500);
  }

  // 2. Crear un client de Supabase que usa el JWT del cliente.
  // Esto permite que auth.getUser() valide el token Y que las queries
  // posteriores respeten RLS si la tabla `profiles` las tuviera.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  // 3. Verificar el JWT y obtener el user.
  // auth.getUser() llama a Supabase Auth para validar firma + claims +
  // revocación. Si el token es inválido o caducado, devuelve error.
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userResult?.user) {
    return json({ error: "invalid_token", details: userError?.message ?? "no_user" }, 401);
  }

  const user = userResult.user;

  // 4. Leer el perfil de la tabla profiles.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, country, locale, birth_date, fav_team, fav_creator, onboarded_at, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return json({ error: "profile_lookup_failed", details: profileError.message }, 500);
  }

  if (!profile) {
    // El user existe en auth.users pero no tiene fila en profiles.
    // Significa que se registró y no completó onboarding. La app móvil
    // debería disparar su propio flujo de onboarding al ver este 404.
    return json(
      {
        error: "profile_not_found",
        user_id: user.id,
        email: user.email,
        hint: "User exists but has not completed onboarding. Start your own onboarding flow.",
      },
      404,
    );
  }

  // 5. Detectar proveedor de auth original (apple, google, email) para
  //    que la app pueda mostrar el icono apropiado en "Conectado con X".
  const identities = user.identities ?? [];
  const providers = identities.map((i) => i.provider).filter(Boolean);

  // 6. Devolver perfil + metadata útil al backend móvil.
  return json({
    id: profile.id,
    email: user.email ?? null,
    email_verified: user.email_confirmed_at != null,
    username: profile.username,
    avatar_url: profile.avatar_url,
    country: profile.country,
    locale: profile.locale,
    birth_date: profile.birth_date,
    fav_team: profile.fav_team,
    fav_creator: profile.fav_creator,
    onboarded_at: profile.onboarded_at,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    // Metadata adicional útil para la app
    providers,
    last_sign_in_at: user.last_sign_in_at ?? null,
  });
}
