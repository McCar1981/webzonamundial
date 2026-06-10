// src/lib/calendario/time.ts
//
// Fuente única de verdad temporal del módulo Calendario.
//
// CONVENCIÓN DE DATOS (ver cabecera de src/data/matches.ts): el campo "t" de
// cada partido está en Eastern Time (ET). En junio-julio ET observa EDT
// (UTC-4). Cuatro partidos usan el apaño "23:59": son saques a las 00:00 ET
// del día siguiente codificados así para conservar el día de la sede; aquí se
// normalizan al instante real antes de cualquier conversión.
//
// Todo el módulo (página, móvil, modal, JSON-LD, feed ICS, embed) debe pasar
// por matchInstant() — nunca interpretar "d + t" a mano ni asumir que es hora
// local del estadio (ese malentendido produjo eventos ICS desplazados 1-3h).
//
// Sin dependencias: Intl basta y funciona igual en Node (SSR) y navegador.

import { MATCHES, type Match } from "@/data/matches";

/** Partidos REALES del Mundial. Excluye fixtures de prueba (j=99, p.ej. el
 *  amistoso 9002 que usa el Match Center): son 104, no deben contar ni
 *  listarse en ninguna superficie del calendario. */
export const WC_MATCHES: Match[] = MATCHES.filter((m) => m.j !== 99);

/** Zona horaria en la que matches.ts expresa el campo "t". */
export const SOURCE_TZ = "America/New_York";

/* ────────────────────────────────────────────────────────────────────────────
 * Conversión "fecha+hora en ET" → instante UTC absoluto (DST-aware vía Intl)
 * ──────────────────────────────────────────────────────────────────────────── */

function tzParts(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
  let h = get("hour");
  if (h === 24) h = 0;
  return { y: get("year"), mo: get("month"), da: get("day"), h, mi: get("minute") };
}

/** "YYYY-MM-DD" + "HH:MM" interpretados en SOURCE_TZ → Date UTC absoluto. */
export function etInstant(isoDate: string, isoTime: string): Date | null {
  const [y, mo, da] = isoDate.split("-").map((n) => parseInt(n, 10));
  const [h, mi] = isoTime.split(":").map((n) => parseInt(n, 10));
  if ([y, mo, da, h, mi].some((v) => Number.isNaN(v))) return null;

  // 1) Asume que las componentes son UTC. 2) Mira qué "hora de pared" muestra
  // Intl en SOURCE_TZ para ese instante. 3) La diferencia es el offset real
  // (DST incluido) y se corrige en una pasada.
  const asUTC = Date.UTC(y, mo - 1, da, h, mi, 0);
  const wall = tzParts(new Date(asUTC), SOURCE_TZ);
  const wallAsUTC = Date.UTC(wall.y, wall.mo - 1, wall.da, wall.h, wall.mi, 0);
  return new Date(asUTC - (wallAsUTC - asUTC));
}

/** Instante UTC real del saque de un partido. Normaliza el apaño "23:59"
 *  (= 00:00 ET del día siguiente) sumando el minuto que falta. */
export function matchInstant(m: Pick<Match, "d" | "t">): Date | null {
  const base = etInstant(m.d, m.t);
  if (!base) return null;
  return m.t === "23:59" ? new Date(base.getTime() + 60_000) : base;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Zona del usuario y formateo localizado
 * ──────────────────────────────────────────────────────────────────────────── */

/** TZ IANA del navegador; "UTC" como fallback (y en SSR). */
export function getUserTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const INTL_LOCALE: Record<string, string> = { es: "es-ES", en: "en-US" };

/** "21:00" — hora del saque en la zona indicada. */
export function fmtTime(instant: Date, tz: string): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  let h = get("hour");
  if (h === "24") h = "00";
  return `${h}:${get("minute")}`;
}

/** Clave de día "YYYY-MM-DD" del instante EN LA ZONA DEL USUARIO. Es la que
 *  decide bajo qué fecha se agrupa un partido (un sábado 22:00 de América es
 *  domingo de madrugada en Europa y debe listarse en el domingo del usuario). */
export function localDayKey(instant: Date, tz: string): string {
  // en-CA formatea YYYY-MM-DD de forma estable.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** "Sábado 13 de junio" / "Saturday, June 13" según locale. */
export function fmtDayLong(instant: Date, tz: string, locale: string): string {
  const raw = new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? locale, {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(instant);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** "13 jun" / "Jun 13". */
export function fmtDayShort(instant: Date, tz: string, locale: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? locale, {
    timeZone: tz,
    day: "numeric",
    month: "short",
  })
    .format(instant)
    .replace(/\./g, "");
}

/** Etiqueta humana corta de una TZ ("Madrid", "CDMX", "Buenos Aires"…). */
export function tzCityLabel(tz: string): string {
  const known: Record<string, string> = {
    "Europe/Madrid": "Madrid",
    "America/Mexico_City": "CDMX",
    "America/Monterrey": "Monterrey",
    "America/Argentina/Buenos_Aires": "Buenos Aires",
    "America/Bogota": "Bogotá",
    "America/Lima": "Lima",
    "America/Santiago": "Santiago",
    "America/New_York": "Nueva York",
    "America/Chicago": "Chicago",
    "America/Los_Angeles": "Los Ángeles",
    "Europe/London": "Londres",
    UTC: "UTC",
  };
  return known[tz] ?? tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Agrupación por día local + datos derivados del torneo
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DayGroup {
  /** "YYYY-MM-DD" en la zona del usuario. */
  key: string;
  /** Instante del primer partido del día (para formatear el encabezado). */
  instant: Date;
  matches: Match[];
}

/** Agrupa partidos por día local del usuario, ordenando días y partidos por
 *  instante real de saque (corrige el orden por id del array). */
export function groupByLocalDay(list: Match[], tz: string): DayGroup[] {
  const withInstant = list
    .map((m) => ({ m, at: matchInstant(m) }))
    .filter((x): x is { m: Match; at: Date } => x.at !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const { m, at } of withInstant) {
    const key = localDayKey(at, tz);
    let g = byKey.get(key);
    if (!g) {
      g = { key, instant: at, matches: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.matches.push(m);
  }
  return groups;
}

/** Partido inaugural (México vs Sudáfrica) e instante real del saque
 *  (15:00 ET = 19:00 UTC del 11-jun-2026). Target único del countdown. */
export const OPENING_MATCH: Match = WC_MATCHES[0];
export const OPENING_INSTANT: Date = matchInstant(OPENING_MATCH) ?? new Date("2026-06-11T19:00:00Z");

const FINAL_MATCH = WC_MATCHES[WC_MATCHES.length - 1];
export const FINAL_INSTANT: Date = matchInstant(FINAL_MATCH) ?? new Date("2026-07-19T19:00:00Z");

/** Días naturales del torneo (inauguración → final, ambos inclusive) = 39. */
export const TOURNAMENT_DAYS: number = (() => {
  const first = etInstant(WC_MATCHES[0].d, "12:00");
  const last = etInstant(FINAL_MATCH.d, "12:00");
  if (!first || !last) return 39;
  return Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1;
})();

/** Sedes reales del Mundial (16) — derivadas SOLO de partidos reales, para que
 *  ningún fixture de prueba cuele sedes fantasma en filtros y contadores. */
export const WC_VENUES = Array.from(
  new Map(
    WC_MATCHES.filter((m) => m.vn).map((m) => [m.vn, { name: m.vn, city: m.vc, flag: m.vf }])
  ).values()
).sort((a, b) => a.name.localeCompare(b.name));

/** Ventana post-saque tras la que un partido se considera acabado sin datos
 *  (misma constante que usa el featured del Match Center: cubre prórroga y
 *  penaltis). */
export const POSTMATCH_MS = 210 * 60_000;

/** Fase "vigente" para un momento dado: la del primer partido cuya ventana no
 *  ha expirado. Antes del torneo → fase de grupos; acabado el torneo → null
 *  (el llamador decide, p.ej. mostrar "Todas"). */
export function currentPhaseAt(nowMs: number): string | null {
  for (const m of WC_MATCHES) {
    const at = matchInstant(m);
    if (at && nowMs <= at.getTime() + POSTMATCH_MS) return m.p;
  }
  return null;
}
