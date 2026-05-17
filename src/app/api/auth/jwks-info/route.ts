// src/app/api/auth/jwks-info/route.ts
//
// GET /api/auth/jwks-info
//
// Documento de descubrimiento PÚBLICO para el equipo de la app móvil.
// Devuelve todos los datos que su backend necesita para verificar JWTs
// de Supabase: JWKS URL, issuer, audience, algoritmo, etc.
//
// Análogo simplificado del .well-known/openid-configuration que publica
// cualquier OIDC provider. No tiene secretos — todo es metadata pública.
//
// Pensado para que el equipo móvil pueda:
//   GET https://zonamundial.app/api/auth/jwks-info
//   → leer issuer/audience/jwks_url
//   → configurar su middleware de verificación de JWT
//   → no tener que pedirnos nada por chat ni mirar docs
//
// Cacheable. 1 hora en CDN.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export async function GET(): Promise<NextResponse> {
  if (!SUPABASE_URL) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "NEXT_PUBLIC_SUPABASE_URL not set" },
      { status: 500 },
    );
  }

  // Asegurar formato consistente del issuer (sin barra final, con /auth/v1).
  const issuer = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
  const jwksUrl = `${issuer}/keys`;

  const info = {
    // ── Metadata principal ──────────────────────────────────────────
    issuer,
    jwks_uri: jwksUrl,
    audience: "authenticated",
    token_signing_alg_values_supported: ["ES256"],

    // ── Endpoints relevantes para la integración móvil ──────────────
    endpoints: {
      // Endpoint para replicar el perfil al primer login móvil
      user_profile: "https://zonamundial.app/api/users/me/profile",
      // Endpoint S2S de Apple (informativo — Apple llama aquí solo, la
      // app móvil no debe llamarlo nunca, pero lo documentamos para que
      // sepan que existe).
      apple_s2s_notifications: "https://zonamundial.app/api/auth/apple/notifications",
      // Página de diagnóstico (estado de la config Auth en producción)
      auth_debug: "https://zonamundial.app/auth/debug",
    },

    // ── Providers OAuth disponibles ─────────────────────────────────
    providers: ["email", "google", "apple"],

    // ── Identificadores Apple ───────────────────────────────────────
    // Para que el equipo móvil sepa qué Bundle ID / Services ID usar
    // y qué pedirle a su Apple Developer team admin si hay duda.
    apple: {
      team_id: "K9SP9SUWV3",
      app_id_ios: "app.zonamundial.ios",
      services_id_web: "app.zonamundial.web",
      // Cuando el equipo iOS empiece, decirles que pidan a quien lleva
      // la web añadir este Bundle ID a Supabase Auth → Providers → Apple.
      additional_client_ids_pending: ["app.zonamundial.ios", "app.zonamundial.android"],
      sign_in_with_apple_capability: true,
      s2s_notifications_configured: true,
    },

    // ── Identificadores Google ──────────────────────────────────────
    // El Client ID de web es secreto-no-secreto (sale en el bundle JS
    // del browser), así que no lo publicamos aquí. Pero confirmamos
    // que el provider está habilitado.
    google: {
      provider_enabled: true,
      // El equipo móvil tiene que crear sus propios Client IDs para
      // iOS y Android en Google Cloud Console (mismo proyecto).
      mobile_client_ids_pending: ["ios", "android"],
    },

    // ── Versionado del documento ────────────────────────────────────
    version: "1.0",
    docs_url: "https://github.com/McCar1981/webzonamundial/blob/main/docs/MOBILE-APP-AUTH-INTEGRATION.md",
    contact: "gol@zonamundial.app",
    last_updated: "2026-05-17",
  };

  return NextResponse.json(info, {
    status: 200,
    headers: {
      // CDN cache 1 h. Si actualizamos providers, esperamos 1h o
      // hacemos purge manual.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      // Permitir CORS para que el backend móvil pueda leerlo desde
      // su CI / dashboards si lo quieren consumir programáticamente.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
