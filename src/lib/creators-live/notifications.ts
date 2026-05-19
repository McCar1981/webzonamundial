// src/lib/creators-live/notifications.ts
//
// Lógica de notificaciones push cuando un creator empieza a transmitir.
//
// Estrategia decidida con el user:
//  - Audiencia: todos los suscritos a category="creators", channel="push"
//  - Trigger: en cada poll, por cada creator live → check cooldown 4h
//    en KV. Si NO hay cooldown activo → enviar push + escribir cooldown.
//    Esto evita spam si Twitch API tiene un blip que cuente como offline
//    por unos segundos.
//  - Contenido: rich con thumbnail del stream.
//
// El cooldown se guarda en KV con key `creators:live:notified:<slug>`
// y TTL de 4h. Mientras viva esa key, no se manda otra notif del mismo
// creator.

import { kv } from "@vercel/kv";
import { broadcastPush } from "@/lib/push-notifications";
import type { LiveCreator } from "./store";

const COOLDOWN_SECONDS = 4 * 60 * 60; // 4h
const KV_PREFIX = "creators:live:notified:";

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/**
 * Comprueba si ya se notificó este creator dentro del cooldown.
 * Si KV está caído, retorna false (mejor mandar de más que de menos).
 */
async function hasRecentNotification(slug: string): Promise<boolean> {
  if (!isKvEnabled()) return false;
  try {
    const v = await kv.get<string>(`${KV_PREFIX}${slug}`);
    return v !== null && v !== undefined;
  } catch {
    return false;
  }
}

/**
 * Marca al creator como notificado durante las próximas 4h.
 */
async function setNotificationCooldown(slug: string): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.set(`${KV_PREFIX}${slug}`, new Date().toISOString(), {
      ex: COOLDOWN_SECONDS,
    });
  } catch (err) {
    console.error(
      "[creators-live] setNotificationCooldown failed:",
      (err as Error).message,
    );
  }
}

/**
 * Para cada creator que está live ahora mismo, manda una push notification
 * si NO está en cooldown.
 *
 * Retorna estadísticas de cuántas notifs se intentaron, enviaron, etc.
 */
export async function notifyLiveCreators(liveNow: LiveCreator[]): Promise<{
  candidates: number;
  notified: number;
  skipped: number;
  totalPushes: number;
  sentPushes: number;
}> {
  let notified = 0;
  let skipped = 0;
  let totalPushes = 0;
  let sentPushes = 0;

  for (const c of liveNow) {
    const recent = await hasRecentNotification(c.slug);
    if (recent) {
      skipped += 1;
      continue;
    }

    const title = `🔴 ${c.nombre} está en directo`;
    const body = c.title?.trim()
      ? c.title.slice(0, 140)
      : `Transmitiendo ${c.gameName || "ahora mismo"} en Twitch`;

    const result = await broadcastPush({
      kind: "creators",
      payload: {
        title,
        body,
        // Linkea a Twitch directo. Cuando exista /creadores/[slug] con
        // stream embebido, cambiar a c.perfilUrl.
        url: c.twitchUrl,
        // tag por creator → si por error se enviaran dos pushes seguidas
        // del mismo creator, el navegador reemplaza la primera.
        tag: `creator-live-${c.slug}`,
        icon: c.imagen,
        image: c.thumbnailUrl,
        pushId: `live-${c.slug}-${Date.now()}`,
      },
    });

    totalPushes += result.total;
    sentPushes += result.sent;
    notified += 1;

    // Marca el cooldown SOLO si al menos UN push se envió OK.
    // Si total=0 (nadie suscrito) o sent=0 (todos fallaron), reintenta
    // en el siguiente poll.
    if (result.sent > 0) {
      await setNotificationCooldown(c.slug);
    }

    console.log(
      `[creators-live] notif → ${c.slug}: total=${result.total} sent=${result.sent} gone=${result.gone} failed=${result.failed}`,
    );
  }

  return {
    candidates: liveNow.length,
    notified,
    skipped,
    totalPushes,
    sentPushes,
  };
}
