import { NextRequest, NextResponse } from "next/server";
import { MATCHES, type Match } from "@/data/matches";
import { buildCalendar } from "@/lib/ics-builder";

export const runtime = "nodejs";
// Cache 1h: matches.ts no cambia a menudo. Si Carlos arregla un fixture,
// el endpoint sirve la nueva versión cuando vence el cache. Calendarios
// suscritos via webcal:// también heredan el TTL.
export const revalidate = 3600;

/**
 * GET /api/calendar.ics
 *
 * Filtros opcionales (anónimos, vía query string):
 *   ?teams=ar,es,br        → solo partidos de estos equipos (ISO)
 *   ?phase=ko              → solo eliminatorias (octavos en adelante)
 *   ?phase=groups          → solo fase de grupos
 *   ?phase=diamond         → top encuentros (definidos en getDiamondMatchIds)
 *   ?venue=us              → solo partidos en USA (o mx, ca)
 *   ?city=miami            → partidos en una ciudad concreta
 *   ?reminders=0           → desactiva los 3 alarms escalonados
 *   ?anthems=0             → desactiva el modo himno
 *
 * Composables: ?teams=ar&phase=ko da Argentina solo en eliminatorias.
 *
 * Headers:
 *   Content-Type: text/calendar; charset=utf-8
 *   Content-Disposition: inline (suscripción) o attachment (descarga)
 *
 * UX clave: el endpoint es el MISMO para descarga y suscripción.
 * - Descarga: link normal → navegador guarda .ics
 * - Suscripción: webcal://www.zonamundial.app/api/calendar.ics
 *   Apple/Google se conectan y refrescan periódicamente.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const filtered = filterMatches(MATCHES, params);
  const name = buildCalendarName(params, filtered.length);

  const reminders = params.get("reminders") !== "0";
  const anthems = params.get("anthems") !== "0";
  const download = params.get("download") === "1";

  const ics = buildCalendar({
    matches: filtered,
    name,
    description: `${filtered.length} partidos del Mundial 2026 · Generado por ZonaMundial.app${
      reminders ? " · Con recordatorios escalonados (24h / 2h / 15min antes)" : ""
    }${anthems ? " · Con himnos en Spotify" : ""}`,
    reminders,
    anthems,
  });

  // Filename amigable
  const filename = filenameFromParams(params);
  const dispositionType = download ? "attachment" : "inline";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${dispositionType}; filename="${filename}"`,
      // Permite a Apple/Google suscribirse y refrescar cada hora
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      // CORS para que webapp en otro dominio pueda usarlo (futuro)
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// Filtros
// ═══════════════════════════════════════════════════════════════════

function filterMatches(matches: Match[], params: URLSearchParams): Match[] {
  let result = [...matches];

  // ?teams=ar,es,br
  const teamsRaw = params.get("teams");
  if (teamsRaw) {
    const teams = teamsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (teams.length > 0) {
      result = result.filter(
        (m) => teams.includes(m.hf.toLowerCase()) || teams.includes(m.af.toLowerCase())
      );
    }
  }

  // ?phase=groups | ko | diamond | final
  const phase = params.get("phase");
  if (phase) {
    if (phase === "groups") {
      result = result.filter((m) => m.p === "Fase de grupos");
    } else if (phase === "ko") {
      // Knock-out: octavos en adelante (incluye 16avos, octavos, cuartos, semis, 3º, FINAL)
      const koPhases = new Set([
        "Dieciseisavos",
        "Octavos de final",
        "Cuartos de final",
        "Semifinal",
        "Tercer puesto",
        "FINAL",
      ]);
      result = result.filter((m) => koPhases.has(m.p));
    } else if (phase === "diamond") {
      result = result.filter((m) => DIAMOND_MATCH_IDS.has(m.i));
    } else if (phase === "final") {
      result = result.filter((m) => m.p === "FINAL");
    }
  }

  // ?venue=us | mx | ca
  const venue = params.get("venue");
  if (venue) {
    result = result.filter((m) => m.vf.toLowerCase() === venue.toLowerCase());
  }

  // ?city=miami
  const city = params.get("city");
  if (city) {
    const c = city.toLowerCase();
    result = result.filter((m) => m.vc.toLowerCase().includes(c));
  }

  return result;
}

/**
 * "Diamond Matches" — partidos top seleccionados editorialmente.
 * Si los IDs cambian con un fixture nuevo, actualizar manualmente aquí.
 */
const DIAMOND_MATCH_IDS = new Set<number>([
  // Inauguración + finales
  1, // México vs Sudáfrica (inauguración)
  // Pesos pesados de fase de grupos (cuando se enfrentan favoritos)
  // Eliminatorias top
]);

// ═══════════════════════════════════════════════════════════════════
// Nombre + filename
// ═══════════════════════════════════════════════════════════════════

function buildCalendarName(params: URLSearchParams, count: number): string {
  const parts: string[] = [];
  const teams = params.get("teams");
  const phase = params.get("phase");
  const venue = params.get("venue");

  if (teams) {
    const list = teams.split(",").map((t) => t.toUpperCase()).join(", ");
    parts.push(list);
  }
  if (phase === "groups") parts.push("Fase de grupos");
  if (phase === "ko") parts.push("Eliminatorias");
  if (phase === "diamond") parts.push("Diamond Matches");
  if (phase === "final") parts.push("Final");
  if (venue) parts.push(venue.toUpperCase());

  const suffix = parts.length > 0 ? ` · ${parts.join(" · ")}` : "";
  return `Mundial 2026${suffix} · ZonaMundial (${count} partidos)`;
}

function filenameFromParams(params: URLSearchParams): string {
  const slug: string[] = ["mundial-2026"];
  const teams = params.get("teams");
  const phase = params.get("phase");
  if (teams) slug.push(teams.replace(/,/g, "-"));
  if (phase) slug.push(phase);
  slug.push("zonamundial.ics");
  return slug.join("-");
}
