/**
 * Multi-timezone helpers para Mundial 2026.
 *
 * Mundial 2026 se juega en 3 países, 4 husos horarios (Pacific, Mountain,
 * Central, Eastern) más zonas mexicanas. Cada partido tiene su hora local
 * del estadio. El visitante de la web está en su propio huso (España,
 * México, Argentina, etc.).
 *
 * Estrategia:
 *   1. JSON guarda kickoff_local (hora del estadio) + venue.country_iso
 *      + venue.timezone (IANA, ej. "America/New_York").
 *   2. Construimos un Date UTC con esa info.
 *   3. Renderizamos en CUALQUIER huso usando Intl.DateTimeFormat.
 *
 * Sin dependencias externas (no necesitamos moment/dayjs/luxon — Intl basta).
 */

/**
 * Mapa de IANA timezones según ciudad/sede del Mundial 2026.
 * Inferido del país + zona del estadio. Cubre las 16 sedes oficiales.
 */
export const VENUE_TIMEZONES: Record<string, string> = {
  // Estados Unidos (de oeste a este)
  "Seattle": "America/Los_Angeles",
  "Los Ángeles": "America/Los_Angeles",
  "Bay Area": "America/Los_Angeles",
  "San Francisco": "America/Los_Angeles",
  "Dallas": "America/Chicago",
  "Houston": "America/Chicago",
  "Kansas City": "America/Chicago",
  "Atlanta": "America/New_York",
  "Boston": "America/New_York",
  "Miami": "America/New_York",
  "Filadelfia": "America/New_York",
  "Nueva York/NJ": "America/New_York",
  "Nueva York": "America/New_York",

  // México
  "Ciudad de México": "America/Mexico_City",
  "Guadalajara": "America/Mexico_City",
  "Monterrey": "America/Monterrey",

  // Canadá
  "Toronto": "America/Toronto",
  "Vancouver": "America/Vancouver",
};

/**
 * Resuelve timezone IANA a partir de la ciudad. Si no se encuentra, usa
 * fallback del país.
 */
export function resolveVenueTimezone(
  city: string | undefined,
  countryIso: string | undefined
): string {
  if (city && VENUE_TIMEZONES[city]) return VENUE_TIMEZONES[city];

  // Fallback por país (zona más representativa)
  switch (countryIso?.toLowerCase()) {
    case "us":
      return "America/New_York"; // ET por defecto
    case "mx":
      return "America/Mexico_City";
    case "ca":
      return "America/Toronto";
    default:
      return "UTC";
  }
}

/**
 * Combina fecha local + hora local + timezone IANA y devuelve un Date
 * en UTC absoluto. Maneja correctamente DST (verano/invierno).
 *
 * @param localDate "2026-06-16" (YYYY-MM-DD)
 * @param localTime "12:00" (HH:mm) o "[POR CONFIRMAR]"
 * @param timezone "America/New_York"
 * @returns Date object o null si los datos son inválidos
 */
export function buildKickoffDate(
  localDate: string,
  localTime: string,
  timezone: string
): Date | null {
  if (!localDate || localDate.startsWith("[")) return null;
  if (!localTime || localTime.startsWith("[")) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return null;
  if (!/^\d{1,2}:\d{2}$/.test(localTime)) return null;

  // Convertimos "fecha local en timezone X" → Date UTC.
  // El truco es construir un Date como si fuera UTC y luego corregir
  // según el offset que tendría la zona en ese momento (DST aware).
  const [hh, mm] = localTime.split(":").map(Number);
  const naive = new Date(`${localDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`);

  // Calculamos offset real del timezone en esa fecha
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(naive);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  // shortOffset llega como "GMT-5", "GMT-4", "GMT+1", etc.
  const m = /GMT([+-]?)(\d{1,2})(?::?(\d{2}))?/.exec(offsetPart);
  if (!m) return naive;
  const sign = m[1] === "-" ? 1 : -1; // si la zona es GMT-5, restamos -5h al UTC para llegar a UTC, o sea sumamos 5h
  const offsetH = parseInt(m[2], 10);
  const offsetM = m[3] ? parseInt(m[3], 10) : 0;
  const offsetMs = sign * (offsetH * 60 + offsetM) * 60_000;

  return new Date(naive.getTime() + offsetMs);
}

/**
 * Detecta el timezone del navegador del usuario.
 * Server-side devuelve "UTC" (no hay window). Client lo cambia tras hidratar.
 */
export function detectViewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export interface FormattedKickoff {
  date: string; // "lun. 16 de jun"
  time: string; // "12:00"
  tzLabel: string; // "ET", "CET", "ART"...
  tzCity: string; // "Atlanta", "Madrid", "Buenos Aires"
}

/**
 * Formatea kickoff en una zona horaria determinada para mostrar al usuario.
 *
 * @param utc Date UTC absoluto del kickoff
 * @param timezone IANA timezone de presentación
 * @param locale Locale para nombres de día/mes (default es-ES)
 * @param tzCity Etiqueta humana de la ciudad (Atlanta, Madrid, Tokio…)
 */
export function formatKickoff(
  utc: Date,
  timezone: string,
  locale = "es-ES",
  tzCity?: string
): FormattedKickoff {
  const dateFmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tzFmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    timeZoneName: "short",
  });

  const tzParts = tzFmt.formatToParts(utc);
  const tzLabel = tzParts.find((p) => p.type === "timeZoneName")?.value ?? "";

  return {
    date: dateFmt.format(utc),
    time: timeFmt.format(utc),
    tzLabel,
    tzCity: tzCity ?? humanizeTz(timezone),
  };
}

/** Convierte "America/New_York" en "Nueva York", etc. */
export function humanizeTz(tz: string): string {
  const labels: Record<string, string> = {
    "America/New_York": "Nueva York",
    "America/Chicago": "Houston",
    "America/Los_Angeles": "Los Ángeles",
    "America/Mexico_City": "CDMX",
    "America/Monterrey": "Monterrey",
    "America/Toronto": "Toronto",
    "America/Vancouver": "Vancouver",
    "America/Argentina/Buenos_Aires": "Buenos Aires",
    "America/Sao_Paulo": "São Paulo",
    "America/Bogota": "Bogotá",
    "America/Lima": "Lima",
    "America/Santiago": "Santiago",
    "Europe/Madrid": "Madrid",
    "Europe/London": "Londres",
    "Europe/Paris": "París",
    "Europe/Berlin": "Berlín",
    "Asia/Tokyo": "Tokio",
    UTC: "UTC",
  };
  return labels[tz] ?? tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/**
 * Lista de zonas "destacadas" que la mayoría de usuarios querrá ver
 * además de la suya propia. Útil para mostrar tooltip con multi-huso.
 */
export const REFERENCE_TIMEZONES = [
  "Europe/Madrid",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/New_York",
] as const;
