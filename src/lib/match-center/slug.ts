// src/lib/match-center/slug.ts
//
// Slugs "bonitos" de partido por nombres (p.ej. "espana-irak") y su resolución
// inversa a id. Módulo sin dependencias de servidor (solo datos), seguro para
// importar tanto en cliente como en servidor.

import { MATCHES } from "@/data/matches";

/** Normaliza un texto a slug url-safe: sin acentos, minúsculas, guiones. */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug por nombres de un partido (p.ej. "espana-irak"). null si no existe. */
export function matchSlug(matchId: number): string | null {
  const m = MATCHES.find((x) => x.i === matchId);
  if (!m) return null;
  return slugify(`${m.h}-${m.a}`);
}

/**
 * Resuelve el parámetro de ruta a un id de partido. Acepta el id numérico
 * (p.ej. "9001") o el slug por nombres (p.ej. "espana-irak"). null si no
 * corresponde a ningún partido conocido.
 */
export function resolveMatchId(param: string): number | null {
  if (/^\d+$/.test(param)) {
    const n = parseInt(param, 10);
    return MATCHES.some((x) => x.i === n) ? n : null;
  }
  const slug = slugify(param);
  const m = MATCHES.find((x) => slugify(`${x.h}-${x.a}`) === slug);
  return m ? m.i : null;
}
