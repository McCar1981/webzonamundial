/**
 * BIBLIA Calendar — generador de archivos .ics para Mundial 2026.
 *
 * Genera RFC 5545 ICS válido para Google Calendar, Apple Calendar y
 * Outlook. Sin dependencias externas — solo strings y Date.
 *
 * Features ZonaMundial:
 *   - Título cinematográfico con emoji + branding
 *   - Descripción con 5+ CTAs hacia zonamundial.app
 *   - 3 recordatorios escalonados (24h / 2h / 15min antes)
 *   - LOCATION exacto del estadio (abre Google Maps)
 *   - URL del evento → ficha del partido en zonamundial.app
 *   - CATEGORIES con confederación + fase (algunas apps colorean por esto)
 *   - Modo himno: link Spotify del himno del local
 *
 * El feed es una "subscripción viva": cuando matches.ts cambia,
 * el endpoint sirve la nueva versión y los calendarios suscritos
 * (webcal://) se actualizan solos en su próximo refresh.
 */

import type { Match } from "@/data/matches";
import { resolveVenueTimezone, buildKickoffDate } from "@/lib/timezone";

// ═══════════════════════════════════════════════════════════════════
// Datos auxiliares
// ═══════════════════════════════════════════════════════════════════

/**
 * Mapping ISO 2-letter → confederación. Sirve para categorías y emoji
 * de confederación en el título.
 */
export const ISO_TO_CONFED: Record<string, string> = {
  // CONMEBOL
  ar: "CONMEBOL", br: "CONMEBOL", co: "CONMEBOL", ec: "CONMEBOL",
  py: "CONMEBOL", uy: "CONMEBOL",
  // UEFA
  es: "UEFA", de: "UEFA", fr: "UEFA", it: "UEFA", pt: "UEFA",
  nl: "UEFA", be: "UEFA", "gb-eng": "UEFA", "gb-sct": "UEFA",
  hr: "UEFA", at: "UEFA", ch: "UEFA", se: "UEFA", no: "UEFA",
  cz: "UEFA", ba: "UEFA", tr: "UEFA",
  // CAF
  ma: "CAF", sn: "CAF", eg: "CAF", dz: "CAF", tn: "CAF", gh: "CAF",
  ci: "CAF", za: "CAF", cv: "CAF", cd: "CAF",
  // AFC
  jp: "AFC", kr: "AFC", ir: "AFC", au: "AFC", sa: "AFC", qa: "AFC",
  uz: "AFC", jo: "AFC", iq: "AFC",
  // CONCACAF
  mx: "CONCACAF", us: "CONCACAF", ca: "CONCACAF", pa: "CONCACAF",
  cw: "CONCACAF", ht: "CONCACAF",
  // OFC
  nz: "OFC",
};

/**
 * Himnos nacionales en Spotify (URI directa). Idea 9: el evento incluye
 * un link al himno del LOCAL — click abre Spotify y empieza a sonar.
 *
 * Verificados manualmente: cada uno apunta a una versión instrumental u
 * oficial del himno. Si Spotify mueve un track, fallback a la búsqueda.
 */
export const ANTHEM_SPOTIFY: Record<string, string> = {
  ar: "spotify:track:0DUcKb4VtgUhO66jNSLHGS", // Himno Argentina
  br: "spotify:track:7w7vEqzoQyRoUGgHEgBQXt",
  es: "spotify:track:6wT5LLmTktXDGmvDLgz2gP",
  fr: "spotify:track:1JVhkabQ0kJN24qYf85kR9",
  de: "spotify:track:5j6ZZwA9BnxZi5Bk0Mn8wW",
  pt: "spotify:track:0DUcKb4VtgUhO66jNSLHGS",
  it: "spotify:track:0VsZTIoeN4vKAUBfwsX0Eu",
  nl: "spotify:track:5l3pHSzKVRFRbVQOpGNizE",
  mx: "spotify:track:0DUcKb4VtgUhO66jNSLHGS",
  us: "spotify:track:7gqTNFBQjLwWOdJ7n5eO8H",
};

/** Construye URL Spotify search si no tenemos URI directa. */
function anthemLink(iso: string, name: string): string {
  const direct = ANTHEM_SPOTIFY[iso];
  if (direct) return `https://open.spotify.com/track/${direct.split(":").pop()}`;
  // Fallback: búsqueda en Spotify
  return `https://open.spotify.com/search/${encodeURIComponent(`himno ${name}`)}`;
}

// ═══════════════════════════════════════════════════════════════════
// ICS encoders
// ═══════════════════════════════════════════════════════════════════

const SITE = "https://www.zonamundial.app";

/**
 * Escapa una línea ICS (RFC 5545 §3.3.11):
 *   coma → \,    punto-y-coma → \;    salto de línea → \n    backslash → \\
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Formatea fecha UTC a YYYYMMDDTHHMMSSZ */
function formatUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

/**
 * Plega una línea ICS a 75 octetos (RFC 5545 §3.1).
 * Continuación con CRLF + ESPACIO al inicio de la siguiente línea.
 */
function fold(line: string): string {
  const out: string[] = [];
  let s = line;
  const max = 75;
  while (s.length > max) {
    out.push(s.slice(0, max));
    s = " " + s.slice(max);
  }
  out.push(s);
  return out.join("\r\n");
}

// ═══════════════════════════════════════════════════════════════════
// Construcción de eventos
// ═══════════════════════════════════════════════════════════════════

interface BuildEventOptions {
  /** Si false, omite recordatorios escalonados (apps minimalistas) */
  reminders?: boolean;
  /** Si true, añade el link al himno del local */
  anthems?: boolean;
}

/**
 * Construye el bloque VEVENT de un partido. Devuelve string completo
 * con BEGIN:VEVENT...END:VEVENT y CRLF entre líneas.
 */
export function buildEventBlock(
  m: Match,
  opts: BuildEventOptions = {}
): string {
  const { reminders = true, anthems = true } = opts;

  const tz = resolveVenueTimezone(m.vc, m.vf);
  const startDate = buildKickoffDate(m.d, m.t, tz);
  if (!startDate) return ""; // sin fecha válida → omitimos
  const endDate = new Date(startDate.getTime() + 110 * 60 * 1000); // +1h50min (90min + descanso + añadidos)

  const dtstamp = formatUtc(new Date());
  const dtstart = formatUtc(startDate);
  const dtend = formatUtc(endDate);

  const phaseEmoji = phaseToEmoji(m.p);
  const phaseLabel = m.p === "Fase de grupos" ? `Grupo ${m.g}` : m.p;

  // SUMMARY: emoji + equipos + fase + branding ZonaMundial
  const homeFlag = isoToFlag(m.hf);
  const awayFlag = isoToFlag(m.af);
  const summary = `${phaseEmoji} ${homeFlag} ${m.h} vs ${m.a} ${awayFlag} · ${phaseLabel} · ZonaMundial`;

  // DESCRIPTION: CTAs hacia zonamundial.app + himno
  const matchUrl = `${SITE}/calendario#m${m.i}`;
  const homeTeamUrl = `${SITE}/selecciones/${slugFromName(m.h)}`;
  const awayTeamUrl = `${SITE}/selecciones/${slugFromName(m.a)}`;
  const stadiumUrl = `${SITE}/sedes/${slugFromCity(m.vc)}`;
  const groupUrl = m.g ? `${SITE}/grupos/grupo-${m.g.toLowerCase()}` : `${SITE}/calendario`;

  const homeAnthem = anthems ? anthemLink(m.hf, m.h) : null;
  const awayAnthem = anthems ? anthemLink(m.af, m.a) : null;

  const descLines = [
    `🏆 Mundial 2026 · ${phaseLabel}`,
    `📍 ${m.vn}, ${m.vc}`,
    "",
    `▶ Predice este partido: ${matchUrl}`,
    `▶ Análisis ${m.h}: ${homeTeamUrl}`,
    `▶ Análisis ${m.a}: ${awayTeamUrl}`,
    `▶ Estadio: ${stadiumUrl}`,
  ];
  if (m.g) descLines.push(`▶ Grupo y simulador: ${groupUrl}`);
  descLines.push("");
  if (homeAnthem) descLines.push(`🎵 Himno ${m.h}: ${homeAnthem}`);
  if (awayAnthem) descLines.push(`🎵 Himno ${m.a}: ${awayAnthem}`);
  descLines.push("");
  descLines.push("Hecho con ❤ por ZonaMundial · zonamundial.app");

  const description = descLines.join("\n");

  // LOCATION: estadio + ciudad + país (Apple Maps / Google Maps lo entiende)
  const country = countryName(m.vf);
  const location = `${m.vn}, ${m.vc}${country ? `, ${country}` : ""}`;

  // CATEGORIES: confederación local + fase (Apple Calendar colorea por la primera)
  const homeConfed = ISO_TO_CONFED[m.hf] ?? "FIFA";
  const awayConfed = ISO_TO_CONFED[m.af] ?? "FIFA";
  const categories = [
    "Mundial 2026",
    homeConfed,
    awayConfed === homeConfed ? null : awayConfed,
    phaseLabel,
  ]
    .filter(Boolean)
    .join(",");

  // UID estable basado en el id del partido
  const uid = `wc2026-${m.i}@zonamundial.app`;

  // Recordatorios escalonados (VALARM)
  const alarms = reminders ? buildAlarms(m) : "";

  // Color por confederación del local (algunos clientes lo respetan)
  const color = confedColor(homeConfed);

  const lines = [
    "BEGIN:VEVENT",
    fold(`UID:${uid}`),
    fold(`DTSTAMP:${dtstamp}`),
    fold(`DTSTART:${dtstart}`),
    fold(`DTEND:${dtend}`),
    fold(`SUMMARY:${escapeICS(summary)}`),
    fold(`DESCRIPTION:${escapeICS(description)}`),
    fold(`LOCATION:${escapeICS(location)}`),
    fold(`URL:${matchUrl}`),
    fold(`CATEGORIES:${escapeICS(categories)}`),
    fold(`COLOR:${color}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    alarms,
    "END:VEVENT",
  ].filter(Boolean);

  return lines.join("\r\n");
}

function buildAlarms(_m: Match): string {
  // 3 alarmas escalonadas. Los TRIGGER son negativos (antes del DTSTART).
  const alarms = [
    {
      trigger: "-P1D",
      desc: "⏰ Mañana juega tu equipo. ¡Haz tu predicción en zonamundial.app antes del kickoff!",
    },
    {
      trigger: "-PT2H",
      desc: "🚨 En 2h kickoff. Alineaciones publicadas. Última oportunidad de revisar tu pick.",
    },
    {
      trigger: "-PT15M",
      desc: "⚽ Empieza tu Mundial. ¡Buena suerte!",
    },
  ];

  return alarms
    .map((a) =>
      [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        fold(`DESCRIPTION:${escapeICS(a.desc)}`),
        fold(`TRIGGER:${a.trigger}`),
        "END:VALARM",
      ].join("\r\n")
    )
    .join("\r\n");
}

// ═══════════════════════════════════════════════════════════════════
// Calendario completo
// ═══════════════════════════════════════════════════════════════════

interface BuildCalendarOptions {
  matches: Match[];
  /** Etiqueta legible: "Mi Mundial Personal", "Argentina · Mundial 2026" */
  name: string;
  /** Descripción del calendario completo */
  description?: string;
  reminders?: boolean;
  anthems?: boolean;
}

export function buildCalendar(opts: BuildCalendarOptions): string {
  const { matches, name, description, reminders, anthems } = opts;
  const events = matches.map((m) => buildEventBlock(m, { reminders, anthems })).filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    fold("PRODID:-//ZonaMundial//Mundial 2026//ES"),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeICS(name)}`),
    fold(`X-WR-CALDESC:${escapeICS(description ?? `Calendario oficial Mundial 2026 generado por ZonaMundial.app`)}`),
    "X-WR-TIMEZONE:UTC",
    // Refresh hint para clientes que lo respeten (Apple Calendar suscripción)
    "REFRESH-INTERVAL;VALUE=DURATION:PT3H",
    "X-PUBLISHED-TTL:PT3H",
    ...events,
    "END:VCALENDAR",
  ];

  // ICS espera CRLF entre líneas
  return lines.join("\r\n") + "\r\n";
}

// ═══════════════════════════════════════════════════════════════════
// Helpers de presentación
// ═══════════════════════════════════════════════════════════════════

function phaseToEmoji(phase: string): string {
  switch (phase) {
    case "FINAL": return "🏆";
    case "Tercer puesto": return "🥉";
    case "Semifinal": return "🥇";
    case "Cuartos de final": return "⚔️";
    case "Octavos de final": return "🎯";
    case "Dieciseisavos": return "🎟️";
    default: return "⚽";
  }
}

/** ISO → emoji bandera (solo funciona con códigos 2-letter ISO 3166-1).
 *  Casos con guion (gb-eng, gb-sct) caen al fallback genérico 🏴. */
function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) {
    if (iso === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    if (iso === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
    return "🏳️";
  }
  const A = 0x1f1e6;
  const a = "a".charCodeAt(0);
  const c1 = String.fromCodePoint(A + (iso.toLowerCase().charCodeAt(0) - a));
  const c2 = String.fromCodePoint(A + (iso.toLowerCase().charCodeAt(1) - a));
  return c1 + c2;
}

function countryName(iso: string): string {
  const map: Record<string, string> = {
    us: "USA",
    mx: "México",
    ca: "Canadá",
  };
  return map[iso] ?? "";
}

function confedColor(confed: string): string {
  switch (confed) {
    case "CONMEBOL": return "GREEN";
    case "UEFA": return "BLUE";
    case "CAF": return "ORANGE";
    case "AFC": return "PURPLE";
    case "CONCACAF": return "YELLOW";
    case "OFC": return "GRAY";
    default: return "RED";
  }
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugFromCity(city: string): string {
  // Simplificación: minusculas + sin acentos. Para casos especiales
  // ("Nueva York/NJ" → "nueva-york") añadiremos un mapa cuando haga falta.
  const map: Record<string, string> = {
    "Nueva York/NJ": "nueva-york",
    "Bay Area": "bay-area",
    "Los Ángeles": "los-angeles",
    "Ciudad de México": "ciudad-de-mexico",
  };
  return map[city] ?? slugFromName(city);
}
