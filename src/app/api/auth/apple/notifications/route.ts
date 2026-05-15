// src/app/api/auth/apple/notifications/route.ts
//
// POST /api/auth/apple/notifications
//
// Endpoint público que recibe las Server-to-Server Notifications de
// Sign In with Apple. Es REQUISITO para pasar revisión de App Store
// si la app usa "Iniciar sesión con Apple": Apple obliga a manejar
// `account-delete` y `consent-revoked` para limpiar la cuenta del
// usuario en nuestros sistemas.
//
// Configuración en Apple Developer Portal:
//   1. Certificates, IDs & Profiles → Identifiers → tu Services ID
//   2. Sign In with Apple → Configure → Server-to-Server Notification
//      Endpoint: https://zonamundial.app/api/auth/apple/notifications
//   3. Apple POSTea con Content-Type: application/json
//      Body: { "payload": "<JWT firmado>" }
//
// Variables de entorno necesarias en Vercel:
//   APPLE_CLIENT_ID   → Services ID (web) o Bundle ID (iOS).
//                       Ej: "app.zonamundial.web"
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  → para escribir en la tabla de
//                                auditoría y desactivar usuarios.
//
// Comportamiento:
//   - Verifica firma + iss + aud del JWT (jose, JWKS de Apple).
//   - Dedupla por `jti` (Apple reintenta hasta 24 h).
//   - Persiste el evento crudo en `apple_signin_events` (audit log).
//   - Aplica la acción correspondiente al usuario (best-effort):
//       account-delete  → soft-delete del user (auth + filas asociadas).
//       consent-revoked → invalida sesiones activas de ese user.
//       email-disabled  → marca email como no contactable.
//       email-enabled   → restaura email contactable.
//   - Devuelve siempre 200 al verificar correctamente, incluso si la
//     acción downstream falla (Apple deja de reintentar y nos
//     queda el evento en el audit log para procesar manualmente).
//   - Devuelve 400 si la firma es inválida (no es Apple legítimo).
//
// El handler NO bloquea esperando a Supabase mucho rato — Apple tolera
// hasta 10 s pero conviene responder < 3 s.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyAppleNotificationJwt,
  type AppleEventPayload,
} from "@/lib/apple/verify-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function adminSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Apple no envía signature en headers; firma viene EN el JWT.
// No requiere CSRF token (es un webhook externo, no un form del usuario).
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 },
    );
  }
  const payload = (body as { payload?: unknown })?.payload;
  if (typeof payload !== "string" || payload.length === 0) {
    return NextResponse.json(
      { error: "missing_payload" },
      { status: 400 },
    );
  }

  // 2. Verificar firma
  let verified;
  try {
    verified = await verifyAppleNotificationJwt(payload, APPLE_CLIENT_ID);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    // No exponemos detalles al caller (no es nuestro user, es Apple).
    // Log queda en server logs de Vercel.
    console.error("[apple-notifications] verify failed:", msg);
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 400 },
    );
  }

  const { event, jti } = verified;

  // 3. Audit log + acción downstream
  // Hacemos esto best-effort: si Supabase está caído, igual devolvemos
  // 200 para que Apple no reintente miles de veces. El evento queda en
  // los logs de Vercel para reprocesar manualmente.
  try {
    await persistAndProcess(jti, event);
  } catch (err) {
    console.error("[apple-notifications] downstream failed:", err);
  }

  // 4. ACK a Apple
  // 200 OK con cuerpo vacío. Apple solo mira el status code.
  return new NextResponse(null, { status: 200 });
}

// Acceso desde un browser GET → 405. Apple solo usa POST.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "method_not_allowed" },
    { status: 405 },
  );
}

// ------------------------------------------------------------------
// Persistencia + acciones por tipo de evento.
// ------------------------------------------------------------------

async function persistAndProcess(
  jti: string,
  event: AppleEventPayload,
): Promise<void> {
  const supabase = adminSupabase();
  if (!supabase) {
    console.warn("[apple-notifications] supabase admin not configured");
    return;
  }

  // 1. Insert en audit log con `jti` como PK → idempotente (los reintentos
  //    de Apple llegan con el mismo jti, así descartamos duplicados).
  const { error: insertErr } = await supabase
    .from("apple_signin_events")
    .insert({
      jti,
      event_type: event.type,
      apple_sub: event.sub,
      apple_email: event.email ?? null,
      is_private_email: event.is_private_email === "true",
      event_time: new Date(event.event_time * 1000).toISOString(),
      raw_event: event,
    });

  // Si el conflicto es por jti duplicado, no es error real → es un retry.
  if (insertErr && !isUniqueViolation(insertErr)) {
    throw insertErr;
  }
  if (insertErr && isUniqueViolation(insertErr)) {
    console.log(`[apple-notifications] duplicate jti=${jti}, skipping action`);
    return;
  }

  // 2. Aplicar acción según tipo de evento.
  //    Buscamos al user por su `apple_sub` (debe estar persistido al login).
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email")
    .eq("apple_sub", event.sub)
    .maybeSingle();

  if (userErr) {
    console.error("[apple-notifications] user lookup failed:", userErr);
    return;
  }

  if (!user) {
    console.warn(
      `[apple-notifications] no local user for apple_sub=${event.sub}, event=${event.type}`,
    );
    return;
  }

  switch (event.type) {
    case "account-delete": {
      // Borrado RGPD: marcamos al user como borrado y disparamos limpieza.
      // Usamos soft-delete + queue, no DELETE inmediato, para conservar
      // referencias en tablas relacionadas con FK (predicciones, etc.)
      // y poder cumplir con auditorías y la propia obligación legal de
      // confirmación al usuario.
      const { error } = await supabase
        .from("users")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_reason: "apple_account_delete",
          is_active: false,
        })
        .eq("id", user.id);
      if (error) console.error("[apple-notifications] soft-delete failed:", error);
      // También revocamos las sesiones de Supabase Auth si existen.
      try {
        await supabase.auth.admin.deleteUser(user.id);
      } catch (err) {
        console.error("[apple-notifications] auth.admin.deleteUser:", err);
      }
      break;
    }

    case "consent-revoked": {
      // El usuario quitó permisos a la app en su cuenta Apple.
      // Cerramos todas las sesiones (forzamos re-login si quiere volver).
      try {
        await supabase.auth.admin.signOut(user.id);
      } catch (err) {
        console.error("[apple-notifications] signOut:", err);
      }
      // Y marcamos el flag para mostrarle un mensaje informativo cuando
      // intente reentrar.
      const { error } = await supabase
        .from("users")
        .update({
          apple_consent_revoked_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) console.error("[apple-notifications] consent flag failed:", error);
      break;
    }

    case "email-disabled": {
      // Apple Relay desactivado → no podemos mandar email a esa dirección.
      const { error } = await supabase
        .from("users")
        .update({
          email_disabled: true,
          email_disabled_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) console.error("[apple-notifications] email-disabled:", error);
      break;
    }

    case "email-enabled": {
      const { error } = await supabase
        .from("users")
        .update({
          email_disabled: false,
          email_disabled_at: null,
        })
        .eq("id", user.id);
      if (error) console.error("[apple-notifications] email-enabled:", error);
      break;
    }
  }
}

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  // PostgreSQL: 23505 = unique_violation.
  // Supabase devuelve a veces el código en `code` y a veces solo el mensaje.
  return err?.code === "23505" ||
    /duplicate key|unique constraint/i.test(err?.message || "");
}
