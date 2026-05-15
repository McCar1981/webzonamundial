// src/lib/apple/verify-notification.ts
//
// Verifica el JWT firmado que envía Apple en las Server-to-Server
// Notifications de Sign In with Apple.
//
// Spec oficial:
//   https://developer.apple.com/documentation/sign_in_with_apple/processing_changes_for_sign_in_with_apple_accounts
//
// Apple POSTea a este endpoint un body JSON con la forma:
//   { "payload": "<JWS compact JWT>" }
//
// El JWT viene firmado con ES256 / RS256 usando una de las claves
// publicadas en https://appleid.apple.com/auth/keys (JWKS).
// El JWT contiene claims estándar (iss, aud, iat, jti) + un objeto
// `events` (string JSON o objeto, según versión) con el tipo y datos
// del evento.
//
// Tipos de evento que envía Apple:
//   - "email-disabled"  → el usuario desactivó el relay de email
//   - "email-enabled"   → reactivado
//   - "consent-revoked" → revocó el acceso a la app (logout forzado)
//   - "account-delete"  → borró su Apple ID (debes eliminar la cuenta)
//
// Debemos responder 200 OK rápido (Apple reintenta hasta 24 h en caso
// de fallo). Toda la lógica pesada va a un job/colega async; aquí solo
// verificamos firma y loggeamos.

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Endpoint oficial de JWKS de Apple (público, sin auth).
// jose cachea las claves en memoria durante 10 min por defecto.
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

const APPLE_ISSUER = "https://appleid.apple.com";

/** Tipos exactos de evento que envía Apple (literales). */
export type AppleEventType =
  | "email-disabled"
  | "email-enabled"
  | "consent-revoked"
  | "account-delete";

/** Estructura del objeto `events` dentro del JWT verificado. */
export interface AppleEventPayload {
  type: AppleEventType;
  /** Apple user id estable (sub del token original de login). */
  sub: string;
  /** Email anónimo de Apple Relay (solo en email-* events). */
  email?: string;
  /** Si el email es del relay anónimo de Apple ("hide my email"). */
  is_private_email?: "true" | "false";
  /** Timestamp UNIX del evento original. */
  event_time: number;
}

/** Resultado de verificar el JWT. */
export interface VerifiedAppleNotification {
  /** Datos del evento ya parseados y tipados. */
  event: AppleEventPayload;
  /** ID único del JWT (jti) — útil para deduplicar reintentos de Apple. */
  jti: string;
  /** Claims raw del JWT por si se necesitan logs/auditoría completos. */
  rawClaims: JWTPayload;
}

/**
 * Verifica la firma de un JWT de Apple y devuelve el payload tipado.
 *
 * Lanza si:
 *   - La firma es inválida o expiró
 *   - `iss` no es Apple
 *   - `aud` no coincide con APPLE_CLIENT_ID (Services ID o Bundle ID)
 *   - El payload no tiene la forma esperada
 */
export async function verifyAppleNotificationJwt(
  jwt: string,
  audience: string,
): Promise<VerifiedAppleNotification> {
  if (!jwt || typeof jwt !== "string") {
    throw new Error("APPLE_NOTIF_INVALID_INPUT: missing JWT payload");
  }
  if (!audience) {
    throw new Error("APPLE_NOTIF_NO_AUDIENCE: APPLE_CLIENT_ID env not set");
  }

  // jose valida: firma (vía JWKS), iss, aud, exp, nbf, iat automáticamente.
  const { payload } = await jwtVerify(jwt, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
    // Apple no incluye exp en algunos eventos, pero `iat` siempre.
    // No forzamos exp aquí; la verificación principal es la firma.
    maxTokenAge: "30 days",
  });

  // Apple anida el evento en `events` como objeto o como string JSON,
  // según versión del feature. Manejamos ambos.
  const rawEvents = (payload as JWTPayload & { events?: unknown }).events;
  let event: AppleEventPayload | null = null;

  if (typeof rawEvents === "string") {
    try {
      event = JSON.parse(rawEvents) as AppleEventPayload;
    } catch {
      throw new Error("APPLE_NOTIF_INVALID_EVENTS_JSON");
    }
  } else if (rawEvents && typeof rawEvents === "object") {
    event = rawEvents as AppleEventPayload;
  } else {
    throw new Error("APPLE_NOTIF_MISSING_EVENTS_CLAIM");
  }

  if (!event || typeof event.type !== "string" || typeof event.sub !== "string") {
    throw new Error("APPLE_NOTIF_MALFORMED_EVENT");
  }

  const KNOWN: AppleEventType[] = [
    "email-disabled",
    "email-enabled",
    "consent-revoked",
    "account-delete",
  ];
  if (!KNOWN.includes(event.type)) {
    throw new Error(`APPLE_NOTIF_UNKNOWN_EVENT_TYPE: ${event.type}`);
  }

  const jti = typeof payload.jti === "string" ? payload.jti : "";
  if (!jti) {
    throw new Error("APPLE_NOTIF_MISSING_JTI");
  }

  return { event, jti, rawClaims: payload };
}
