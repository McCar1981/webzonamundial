// src/lib/match-reminders.ts
//
// Recordatorio PRE-PARTIDO (server-only). ~90 minutos antes del saque de cada
// partido del Mundial manda un push avisando del próximo encuentro y su hora de
// inicio. Lo dispara un cron cada pocos minutos (ver
// /api/cron/match-reminders): en cada pasada selecciona los partidos cuyo saque
// cae dentro de una ventana alrededor de los 90 min y, con dedup en KV, asegura
// que cada partido avisa UNA sola vez.
//
// Reutiliza la infra existente: etToDate() (matches en ET → Date absoluto),
// broadcastPush() con la categoría "predictions-reminder", y KV para el dedup.

import { kv } from "@vercel/kv";
import { MATCHES, type Match } from "@/data/matches";
import { etToDate, SOURCE_TZ } from "@/lib/bracket/match-time";
import { broadcastPush } from "@/lib/push-notifications";

/** Categoría de notificación (ya existe en notification-preferences). */
const CATEGORY = "predictions-reminder";

/** Antelación objetivo del aviso, en minutos antes del saque. */
export const LEAD_MINUTES = 90;

/**
 * Media-ventana de selección, en minutos. Con un cron cada ~10 min, ±8 min
 * cubre la cadencia sin solaparse de más; el dedup remata cualquier doble.
 */
export const WINDOW_MINUTES = 8;

/** TTL del marcador de dedup: suficiente para que el partido ya haya empezado. */
const DEDUP_TTL_SEC = 6 * 60 * 60;

/** Hora de saque "HH:MM" en ET, para el cuerpo del push (fuente única: ET). */
function kickoffEtLabel(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: SOURCE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Reserva el aviso de un partido. Devuelve true solo la primera vez (clave
 * nueva en KV); en pasadas posteriores devuelve false y no se reenvía. Ante un
 * fallo de KV degrada a false (mejor no avisar que duplicar/spamear).
 */
async function reserveReminder(matchId: number): Promise<boolean> {
  const key = `mc:match-reminder:${matchId}`;
  try {
    const ok = await kv.set(key, 1, { nx: true, ex: DEDUP_TTL_SEC });
    return ok === "OK";
  } catch {
    return false;
  }
}

export interface MatchReminderResult {
  checked: number;
  due: number;
  sent: number;
  skipped: number;
}

/**
 * Recorre los partidos, selecciona los que arrancan dentro de la ventana de
 * ~LEAD_MINUTES y manda un push por cada uno (dedup vía KV). Pensado para que
 * lo invoque el cron periódicamente.
 */
export async function runMatchReminders(now: Date = new Date()): Promise<MatchReminderResult> {
  const result: MatchReminderResult = { checked: 0, due: 0, sent: 0, skipped: 0 };
  const lowMs = (LEAD_MINUTES - WINDOW_MINUTES) * 60_000;
  const highMs = (LEAD_MINUTES + WINDOW_MINUTES) * 60_000;

  for (const m of MATCHES as Match[]) {
    const kickoff = etToDate(m.d, m.t);
    if (!kickoff) continue;
    result.checked += 1;

    const deltaMs = kickoff.getTime() - now.getTime();
    if (deltaMs < lowMs || deltaMs > highMs) continue;
    result.due += 1;

    if (!(await reserveReminder(m.i))) {
      result.skipped += 1;
      continue;
    }

    const hora = kickoffEtLabel(kickoff);
    await broadcastPush({
      kind: CATEGORY,
      payload: {
        title: `Falta poco: ${m.h} vs ${m.a}`,
        body: `Arranca a las ${hora} ET · ${m.p}. ${m.vn}, ${m.vc}.`,
        url: "/calendario",
        tag: `match-reminder-${m.i}`,
        pushId: `match-reminder-${m.i}`,
      },
    });
    result.sent += 1;
  }

  return result;
}
