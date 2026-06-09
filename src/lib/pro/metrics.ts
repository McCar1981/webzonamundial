// src/lib/pro/metrics.ts
//
// Métricas del funnel Pro (server-only, KV). Responden a la pregunta clave de
// la monetización: ¿cuánta gente CHOCA con cada límite Free y cuántos de esos
// acaban pagando? Con esto se ajustan los límites de limits.ts con datos.
//
// Layout KV (contadores por día UTC, TTL 90 días):
//   metrics:limithit:{day}:{feature}   — choques con un límite Free
//   metrics:pro:{event}:{day}          — checkout_started / checkout_completed / sub_canceled
//
// Todo es best-effort y fire-and-forget: una métrica perdida no puede romper
// ni retrasar una respuesta de juego.

import { kv } from "@vercel/kv";
import { utcDay } from "./quota";
import type { ProFeature } from "./limits";

const TTL_SECONDS = 90 * 24 * 60 * 60;

export type ProFunnelEvent = "checkout_started" | "checkout_completed" | "sub_canceled";

/** Registra que un usuario Free chocó con un límite. Nunca lanza. */
export function trackLimitHit(feature: ProFeature): void {
  const key = `metrics:limithit:${utcDay()}:${feature}`;
  void kv
    .incr(key)
    .then((n) => (n === 1 ? kv.expire(key, TTL_SECONDS) : undefined))
    .catch(() => {});
}

/** Registra un evento del funnel de pago. Nunca lanza. */
export function trackProEvent(event: ProFunnelEvent): void {
  const key = `metrics:pro:${event}:${utcDay()}`;
  void kv
    .incr(key)
    .then((n) => (n === 1 ? kv.expire(key, TTL_SECONDS) : undefined))
    .catch(() => {});
}

// ─── Lectura para el panel /admin/pro ────────────────────────────────────────

const ALL_FEATURES: ProFeature[] = [
  "predictions_type",
  "predictions_jornada",
  "fantasy_live",
  "fantasy_lock",
  "carrera_seasons",
  "carrera_cloud_save",
  "carrera_rival_report",
  "ia_coach_daily",
  "trivia_daily",
  "trivia_runs",
  "match_center_narration",
  "match_center_alerts",
  "bars_create",
  "leagues_create",
  "stats_advanced",
];

const FUNNEL_EVENTS: ProFunnelEvent[] = ["checkout_started", "checkout_completed", "sub_canceled"];

function lastDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    days.push(utcDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));
  }
  return days;
}

export interface ProMetricsSnapshot {
  days: string[]; // más reciente primero
  /** hits[feature][day] */
  limitHits: Record<string, Record<string, number>>;
  /** funnel[event][day] */
  funnel: Record<ProFunnelEvent, Record<string, number>>;
}

/** Lee los contadores de los últimos `n` días (para el panel admin). */
export async function readProMetrics(n = 14): Promise<ProMetricsSnapshot> {
  const days = lastDays(n);
  const limitKeys = ALL_FEATURES.flatMap((f) => days.map((d) => `metrics:limithit:${d}:${f}`));
  const funnelKeys = FUNNEL_EVENTS.flatMap((e) => days.map((d) => `metrics:pro:${e}:${d}`));

  let values: (number | null)[] = [];
  try {
    values = await kv.mget<(number | null)[]>(...limitKeys, ...funnelKeys);
  } catch {
    values = new Array(limitKeys.length + funnelKeys.length).fill(null);
  }

  const limitHits: Record<string, Record<string, number>> = {};
  ALL_FEATURES.forEach((f, fi) => {
    limitHits[f] = {};
    days.forEach((d, di) => {
      limitHits[f][d] = Number(values[fi * days.length + di] ?? 0);
    });
  });

  const funnel = {} as ProMetricsSnapshot["funnel"];
  FUNNEL_EVENTS.forEach((e, ei) => {
    funnel[e] = {};
    days.forEach((d, di) => {
      funnel[e][d] = Number(values[limitKeys.length + ei * days.length + di] ?? 0);
    });
  });

  return { days, limitHits, funnel };
}
