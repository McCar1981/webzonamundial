// src/lib/bracket/match-time.ts
//
// Helpers para mostrar fecha+hora de cada partido en la zona horaria
// del usuario. Detección de TZ vía Intl (client-only, sin red, sin IP).
//
// CONVENCIÓN:
//   src/data/matches.ts guarda las horas en Eastern Time (ET) — fuente
//   oficial FIFA Match Schedule v17 (10/04/2026). En verano (jun-jul)
//   ET observa EDT (UTC−4). Esta fuente es ÚNICA: no necesitamos
//   mapping por sede, todas las horas están en una sola zona.
//
//   Para fechas que cruzan medianoche en ET (ej. partido a las "00:00"
//   del 12 de junio), el campo "d" del match indica el día EN LA SEDE
//   LOCAL, no en ET. Para evitar inconsistencias, asumimos siempre que
//   "d + t" es un instante en ET sin reinterpretar.

import { MATCHES, type Match } from "@/data/matches";
import { TEAM_BY_ID } from "./teams";
import type { BracketMatch, PhaseId } from "./types";

/** Zona horaria base de los datos de partidos. */
export const SOURCE_TZ = "America/New_York";

/* -------------------------------------------------------------------------- */
/* Cruce BracketMatch → Match (data)                                          */
/* -------------------------------------------------------------------------- */

const PHASE_MAP: Record<PhaseId, string> = {
  GROUP: "Fase de grupos",
  R32: "Dieciseisavos",
  R16: "Octavos de final",
  QF: "Cuartos de final",
  SF: "Semifinal",
  THIRD: "Tercer puesto",
  FINAL: "FINAL",
};

let _byPhase: Map<string, Match[]> | null = null;
function indexByPhase(): Map<string, Match[]> {
  if (_byPhase) return _byPhase;
  const m = new Map<string, Match[]>();
  for (const match of MATCHES) {
    const k = match.p;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(match);
  }
  for (const arr of m.values()) arr.sort((a, b) => a.i - b.i);
  _byPhase = m;
  return m;
}

/** Encuentra el Match de matches.ts correspondiente a un BracketMatch.
 *
 *  Para fase de grupos: matchea por IDs de equipo (más robusto, no depende
 *  del orden del array). Esto evita el bug de slotIdx donde el orden del
 *  bracket (pi=0..5) no coincide con el orden cronológico del Mundial real.
 *
 *  Para fases de eliminación (R32, R16, etc.) los equipos pueden ser TBD,
 *  así que caemos al fallback por phase + slotIdx.
 */
export function findMatchData(bracketMatch: BracketMatch): Match | null {
  // Match por equipos (robusto, cuando ya conocemos a y b)
  if (bracketMatch.a && bracketMatch.b) {
    const teamA = TEAM_BY_ID[bracketMatch.a];
    const teamB = TEAM_BY_ID[bracketMatch.b];
    if (teamA && teamB) {
      const isoA = teamA.iso;
      const isoB = teamB.iso;
      const found = MATCHES.find(
        (m) =>
          (m.hf === isoA && m.af === isoB) ||
          (m.hf === isoB && m.af === isoA),
      );
      if (found) return found;
    }
  }
  // Fallback por phase + slotIdx (para knockouts con equipos TBD)
  const idx = indexByPhase();
  const phaseLabel = PHASE_MAP[bracketMatch.phase];
  const arr = idx.get(phaseLabel);
  if (!arr || arr.length === 0) return null;
  const slot = bracketMatch.slotIdx;
  if (slot < 0 || slot >= arr.length) return null;
  return arr[slot];
}

/* -------------------------------------------------------------------------- */
/* Conversión ET → Date absoluto (UTC)                                        */
/* -------------------------------------------------------------------------- */

/** Construye un Date absoluto a partir de "YYYY-MM-DD" + "HH:MM" en ET.
 *
 *  JS no permite parsear con TZ arbitrario. Estrategia:
 *  1. Construye un timestamp ASUMIENDO que las componentes son UTC.
 *  2. Pregunta a Intl qué hora muestra ese timestamp en SOURCE_TZ.
 *  3. La diferencia entre lo que muestra y lo que QUEREMOS que muestre es
 *     el offset que hay que aplicar (en una sola pasada — el offset de TZ
 *     no depende del momento exacto en escalas de horas).
 */
export function etToDate(isoDate: string, isoTime: string): Date | null {
  const [y, mo, da] = isoDate.split("-").map((n) => parseInt(n, 10));
  const [h, mi] = isoTime.split(":").map((n) => parseInt(n, 10));
  if ([y, mo, da, h, mi].some((v) => Number.isNaN(v))) return null;

  // Asume primero que (y, mo, da, h, mi) son UTC.
  const asUTC = Date.UTC(y, mo - 1, da, h, mi, 0);
  // ¿Qué muestra Intl en la TZ source para ese instante UTC?
  const partsInTz = getTzParts(new Date(asUTC), SOURCE_TZ);
  // Reconstruye el "wall clock" que muestra Intl como UTC ms.
  const wallClockAsUTC = Date.UTC(
    partsInTz.y,
    partsInTz.mo - 1,
    partsInTz.da,
    partsInTz.h,
    partsInTz.mi,
    0,
  );
  // El offset de SOURCE_TZ respecto a UTC en ESE momento.
  // En ET en verano (EDT): wallClock = UTC - 4h → offset = -4h ms.
  const offsetMs = wallClockAsUTC - asUTC;
  // Para que el "wall clock en SOURCE_TZ" muestre (y,mo,da,h,mi), el
  // instante UTC real debe ser asUTC - offsetMs.
  return new Date(asUTC - offsetMs);
}

function getTzParts(d: Date, tz: string) {
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
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
  let h = get("hour");
  if (h === 24) h = 0;
  return {
    y: get("year"),
    mo: get("month"),
    da: get("day"),
    h,
    mi: get("minute"),
  };
}

/* -------------------------------------------------------------------------- */
/* User TZ detection                                                          */
/* -------------------------------------------------------------------------- */

/** Devuelve la TZ IANA del navegador del usuario, o "UTC" como fallback. */
export function getUserTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/* -------------------------------------------------------------------------- */
/* Formatter para UI                                                          */
/* -------------------------------------------------------------------------- */

export interface FormattedMatchTime {
  /** "Sáb 14 jun" */
  dateLine: string;
  /** "21:00" */
  timeLine: string;
  /** Texto auxiliar, por ej. "tu hora" o "hora local" */
  tzLabel: string;
  /** "MetLife Stadium · Nueva York/NJ" */
  venueLine: string;
  /** Hora en ET para referencia: "15:00 ET" */
  sourceTimeLine: string;
  /** TZ IANA detectada del usuario, para mostrar/log */
  userTz: string;
}

/** Llamar tras hidratación (client-only) para que userTz sea la del browser. */
export function formatMatchTime(
  bracketMatch: BracketMatch,
  userTz: string = getUserTimezone(),
): FormattedMatchTime | null {
  const m = findMatchData(bracketMatch);
  if (!m) return null;
  const absDate = etToDate(m.d, m.t);
  if (!absDate) return null;

  // Formato en la TZ del user
  const userParts = new Intl.DateTimeFormat("es-ES", {
    timeZone: userTz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(absDate);

  const getP = (t: string) =>
    userParts.find((p) => p.type === t)?.value || "";

  const weekdayRaw = getP("weekday").replace(".", "").toLowerCase();
  const weekday = weekdayRaw
    ? weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1)
    : "";
  const day = getP("day").replace(/^0/, "");
  const month = getP("month").replace(".", "").toLowerCase();
  const hour = getP("hour");
  const minute = getP("minute");

  const isInEt = userTz === SOURCE_TZ;

  return {
    dateLine: weekday ? `${weekday} ${day} ${month}` : `${day} ${month}`,
    timeLine: `${hour}:${minute}`,
    tzLabel: isInEt ? "hora ET" : "tu hora",
    venueLine: `${m.vn} · ${m.vc}`,
    sourceTimeLine: `${m.t} ET`,
    userTz,
  };
}
