// src/lib/match-center/followers.ts
//
// "Seguir partido" (efecto pin de Google). Guarda qué endpoints de push siguen
// cada partido del Mundial, para mandarles la notificación FIJADA
// (requireInteraction) que se actualiza con el marcador y el minuto.
//
// Almacén: un SET de Redis por partido (`mc:followers:{matchId}`) con los
// endpoints de las suscripciones. Las claves de cifrado se buscan en
// push_subscriptions (Supabase) en el momento de enviar. Si KV no está
// configurado (dev local sin Upstash), degrada a "sin seguidores".

import { kv } from "@/lib/kv";

const PREFIX = "mc:followers:";
// TTL de seguridad: si nadie limpia el set (p.ej. el partido no llega a FT en
// la API), expira solo a los 2 días.
const TTL_SECONDS = 2 * 24 * 60 * 60;

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

function key(matchId: number): string {
  return `${PREFIX}${matchId}`;
}

/** Añade un endpoint a los seguidores de un partido. */
export async function followMatch(matchId: number, endpoint: string): Promise<void> {
  if (!isKvEnabled() || !endpoint) return;
  try {
    await kv.sadd(key(matchId), endpoint);
    await kv.expire(key(matchId), TTL_SECONDS);
  } catch (err) {
    console.error("[mc-followers] followMatch failed", (err as Error).message);
  }
}

/** Quita un endpoint de los seguidores de un partido. */
export async function unfollowMatch(matchId: number, endpoint: string): Promise<void> {
  if (!isKvEnabled() || !endpoint) return;
  try {
    await kv.srem(key(matchId), endpoint);
  } catch (err) {
    console.error("[mc-followers] unfollowMatch failed", (err as Error).message);
  }
}

/** Endpoints que siguen un partido (vacío si KV off o nadie lo sigue). */
export async function getFollowers(matchId: number): Promise<string[]> {
  if (!isKvEnabled()) return [];
  try {
    return (await kv.smembers(key(matchId))) ?? [];
  } catch {
    return [];
  }
}

/** ¿Este endpoint sigue el partido? */
export async function isFollowing(matchId: number, endpoint: string): Promise<boolean> {
  if (!isKvEnabled() || !endpoint) return false;
  try {
    return (await kv.sismember(key(matchId), endpoint)) === 1;
  } catch {
    return false;
  }
}

/** Limpia todos los seguidores de un partido (al terminar). */
export async function clearFollowers(matchId: number): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.del(key(matchId));
  } catch (err) {
    console.error("[mc-followers] clearFollowers failed", (err as Error).message);
  }
}
