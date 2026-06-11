// src/lib/pro/paywall-client.ts
//
// Lado CLIENTE del paywall contextual. Cuando una API devuelve el payload
// `pro_required` (ver limits.ts), el call-site llama a handleProRequired(json)
// y, si aplica, se abre el <PaywallModal> global (montado en el layout) con el
// copy específico del límite alcanzado. Así cada juego integra el paywall con
// UNA línea, sin montar su propio modal.
//
// Client-safe: sin imports de servidor.

import type { ProFeature } from "./limits";

export const PRO_PAYWALL_EVENT = "zm:pro-required";

export interface PaywallDetail {
  feature: ProFeature | "generic";
  /** Mensaje del servidor (ya viene humano desde el gate). */
  message?: string;
  limit?: number;
  /** Si el bloqueo es temporal (lockout Modo Carrera), cuándo reintenta. */
  retryAt?: string | null;
}

/** Copy por feature para el modal (título + qué desbloquea Pro). */
export const PAYWALL_COPY: Record<PaywallDetail["feature"], { title: string; perk: string }> = {
  predictions_type: {
    title: "Este partido ya no admite más tipos en Free",
    perk: "En Free juegas los 8 tipos en UN partido por jornada; en los demás, Marcador, Ganador y Primer Goleador. Con Pro, todos los tipos en todos los partidos y con multiplicadores.",
  },
  predictions_jornada: {
    title: "Has jugado tus partidos de la jornada",
    perk: "Con Pro predices todos los partidos de cada jornada, con multiplicadores de puntos.",
  },
  fantasy_live: {
    title: "Los puntos en vivo son Pro",
    perk: "Con Pro ves los puntos de tu equipo en tiempo real y haces sustituciones en vivo.",
  },
  fantasy_lock: {
    title: "Tu plantilla está cerrada",
    perk: "Con Pro cambias tu equipo hasta el último minuto y haces sustituciones en vivo.",
  },
  carrera_seasons: {
    title: "Has jugado tus temporadas de hoy",
    perk: "Con Pro las temporadas del Modo Carrera son ilimitadas: sigue tu dinastía sin esperas.",
  },
  carrera_cloud_save: {
    title: "El guardado en la nube es Pro",
    perk: "Con Pro tu carrera te sigue en todos tus dispositivos.",
  },
  carrera_rival_report: {
    title: "Los informes de rival son Pro",
    perk: "Con Pro la IA te prepara un informe del rival antes de cada partido.",
  },
  ia_coach_daily: {
    title: "Has usado tu consulta IA de hoy",
    perk: "Con Pro el IA Coach es ilimitado: Oracle, Live, Coach, Análisis y Debate.",
  },
  trivia_daily: {
    title: "Has jugado tus preguntas de hoy",
    perk: "Con Pro la trivia diaria no tiene límite y desbloqueas el contrarreloj infinito.",
  },
  trivia_runs: {
    title: "Ya jugaste tu partida diaria de este modo",
    perk: "Con Pro juegas Relámpago y Muerte Súbita todas las veces que quieras.",
  },
  match_center_narration: {
    title: "La narración avanzada es Pro",
    perk: "Con Pro el relato del partido lo escribe la IA, con alertas personalizadas.",
  },
  match_center_alerts: {
    title: "Las alertas personalizadas son Pro",
    perk: "Con Pro recibes avisos por jugador y equipo: goles, tarjetas, cambios.",
  },
  bars_create: {
    title: "Crear tu bar es una función Pro",
    perk: "Con Pro creas tu bar con cartel personalizado y QR para tu porra.",
  },
  leagues_create: {
    title: "Crear ligas privadas es Pro",
    perk: "Con Pro creas ligas privadas ilimitadas e invitas a tus amigos (unirse es gratis).",
  },
  stats_advanced: {
    title: "Las estadísticas avanzadas son Pro",
    perk: "Con Pro desbloqueas mapas de calor y comparativas históricas.",
  },
  generic: {
    title: "Esta función es del plan Pro",
    perk: "Desbloquea todo ZonaMundial sin límites desde 15 €/año.",
  },
};

/** Abre el paywall global con el detalle dado. */
export function openProPaywall(detail: PaywallDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PaywallDetail>(PRO_PAYWALL_EVENT, { detail }));
}

// ── Antirrepetición ──────────────────────────────────────────────────────────
// Cuándo se mostró el modal por última vez para cada feature. En sessionStorage
// para que un refresh no resetee la cuenta pero una visita nueva sí vuelva a
// mostrarlo. Fail-open: sin storage (modo privado) el modal se muestra normal.
const SHOWN_KEY = "zm:paywall-shown:";

function lastShownAt(feature: string): number {
  try {
    return Number(window.sessionStorage.getItem(SHOWN_KEY + feature)) || 0;
  } catch {
    return 0;
  }
}
function markShown(feature: string): void {
  try {
    window.sessionStorage.setItem(SHOWN_KEY + feature, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * Detecta el payload `pro_required` en una respuesta de error y abre el
 * paywall. Devuelve true si lo era (el call-site corta ahí su manejo de error).
 * Acepta tanto el payload estándar ({ code, feature }) como el formato de las
 * rutas de IA Coach ({ ok: false, error: "pro_required" }).
 *
 * `opts.throttleMs`: para llamadas AUTOMÁTICAS (p. ej. el autoguardado del
 * Fantasy, que se dispara con cada cambio del equipo): si el modal de esa
 * feature ya se mostró hace menos de ese tiempo, NO se reabre — repetirlo en
 * cada acción espanta al usuario. Sigue devolviendo true: el call-site decide
 * cómo informar de forma pasiva (banner, toast). Las llamadas explícitas del
 * usuario (botón de una función Pro) no pasan throttle y abren siempre.
 */
export function handleProRequired(
  json: unknown,
  fallbackFeature: PaywallDetail["feature"] = "generic",
  opts?: { throttleMs?: number },
): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  const isProRequired = o.code === "pro_required" || o.error === "pro_required";
  if (!isProRequired) return false;
  const feature = (typeof o.feature === "string" && o.feature in PAYWALL_COPY
    ? o.feature
    : fallbackFeature) as PaywallDetail["feature"];
  if (opts?.throttleMs && Date.now() - lastShownAt(feature) < opts.throttleMs) return true;
  markShown(feature);
  openProPaywall({
    feature,
    message: typeof o.error === "string" && o.error !== "pro_required" ? o.error : undefined,
    limit: typeof o.limit === "number" ? o.limit : undefined,
    retryAt: typeof o.retry_at === "string" ? o.retry_at : null,
  });
  return true;
}
