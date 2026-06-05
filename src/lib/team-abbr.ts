// src/lib/team-abbr.ts
//
// Deriva la abreviatura de 3 letras de una selección (estilo broadcast:
// "GER", "MEX", "ESP") a partir de su código ISO de bandera (flagcdn) o,
// como respaldo, de su nombre. Fuente única: BRACKET_TEAMS (que ya mapea
// iso → id FIFA de 3 letras para las 48 selecciones del Mundial 2026).
//
// Se usa para alimentar <FootballScoreboard>, que muestra abreviaturas
// cortas en vez de nombres largos en español.

import { BRACKET_TEAMS } from "@/lib/bracket/teams";

// iso (lowercase, p. ej. "de", "gb-eng") → abreviatura ("GER", "ENG").
const ISO_TO_ABBR: Record<string, string> = Object.fromEntries(
  BRACKET_TEAMS.map((t) => [t.iso.toLowerCase(), t.id]),
);

/** Quita acentos para el respaldo basado en nombre. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Devuelve la abreviatura de 3 letras de un equipo.
 * @param iso  Código ISO de bandera (p. ej. "mx", "de", "gb-eng"). Opcional.
 * @param name Nombre del equipo, usado como respaldo si no hay match por iso.
 */
export function teamAbbr(iso?: string | null, name?: string | null): string {
  if (iso) {
    const hit = ISO_TO_ABBR[iso.toLowerCase()];
    if (hit) return hit;
  }
  if (name) {
    const clean = stripAccents(name).replace(/[^A-Za-z]/g, "");
    if (clean) return clean.slice(0, 3).toUpperCase();
  }
  return iso ? iso.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() : "—";
}

/** URL de bandera flagcdn para un código ISO (PNG ancho 80). */
export function flagPng(iso: string, w = 80): string {
  return `https://flagcdn.com/w${w}/${iso}.png`;
}
