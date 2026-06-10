// scripts/generate-calendario.mjs
//
// Regenera src/data/calendario.ts (fase de grupos) desde src/data/matches.ts,
// la ÚNICA fuente de verdad de fixtures (1:1 con el Excel oficial FIFA).
//
// Por qué existe: calendario.ts se escribió a mano y divergió de matches.ts
// (emparejamientos, fechas y sedes distintas — p.ej. decía México vs Corea del
// Sur como inaugural cuando el oficial es México vs Sudáfrica). Cualquier
// cambio de fixtures se hace en matches.ts y se corre:
//
//   node scripts/generate-calendario.mjs
//
// Conversión horaria: matches.ts guarda "t" en Eastern Time (EDT, -04:00 en
// junio/julio 2026); calendario.ts expone "fecha" en ISO UTC.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const matchesSrc = readFileSync(join(root, "src/data/matches.ts"), "utf8");
const seleccionesSrc = readFileSync(join(root, "src/data/selecciones.ts"), "utf8");

// flagCode → slug desde el registro de selecciones.
const flagToSlug = new Map();
for (const m of seleccionesSrc.matchAll(/slug:\s*'([^']+)'[^}]*?flagCode:\s*'([^']+)'/g)) {
  flagToSlug.set(m[2], m[1]);
}
if (flagToSlug.size < 48) {
  throw new Error(`selecciones.ts: esperaba ≥48 selecciones con flagCode, hay ${flagToSlug.size}`);
}

// Cada entrada de MATCHES es un objeto JSON puro en su propia línea.
const matches = [...matchesSrc.matchAll(/^\s*(\{\s*"i":.*\})\s*,?\s*$/gm)].map((m) => JSON.parse(m[1]));
if (matches.length < 100) {
  throw new Error(`matches.ts: esperaba ≥100 partidos, parseé ${matches.length}`);
}

const groupStage = matches.filter((m) => m.p === "Fase de grupos");
const missing = new Set();
for (const m of groupStage) {
  if (!flagToSlug.has(m.hf)) missing.add(m.hf);
  if (!flagToSlug.has(m.af)) missing.add(m.af);
}
if (missing.size) {
  throw new Error(`flagCodes sin slug en selecciones.ts: ${[...missing].join(", ")}`);
}

// ISO UTC desde fecha+hora ET. EDT = UTC-4 durante todo el torneo.
const toUtcIso = (d, t) => new Date(`${d}T${t}:00-04:00`).toISOString().replace(".000Z", "Z");

// Agrupar por grupo, ordenar por jornada y kickoff, e id secuencial A1..A6.
const byGroup = new Map();
for (const m of groupStage) {
  if (!byGroup.has(m.g)) byGroup.set(m.g, []);
  byGroup.get(m.g).push(m);
}
const groups = [...byGroup.keys()].sort();
const lines = [];
for (const g of groups) {
  const ms = byGroup.get(g).sort((a, b) => a.j - b.j || toUtcIso(a.d, a.t).localeCompare(toUtcIso(b.d, b.t)) || a.i - b.i);
  const slugs = [...new Set(ms.flatMap((m) => [flagToSlug.get(m.hf), flagToSlug.get(m.af)]))];
  lines.push(`  // =============================================`);
  lines.push(`  // GRUPO ${g}: ${slugs.join(", ")}`);
  lines.push(`  // =============================================`);
  let n = 0;
  let lastJ = 0;
  for (const m of ms) {
    n += 1;
    if (m.j !== lastJ) {
      lastJ = m.j;
      const day = new Date(toUtcIso(m.d, m.t));
      lines.push(`  // Jornada ${m.j}`);
    }
    lines.push(
      `  { id: "${g}${n}", grupo: "${g}", jornada: ${m.j}, fecha: "${toUtcIso(m.d, m.t)}", estadio: ${JSON.stringify(m.vn)}, ciudad: ${JSON.stringify(m.vc)}, homeSlug: "${flagToSlug.get(m.hf)}", awaySlug: "${flagToSlug.get(m.af)}" },`,
    );
  }
  lines.push("");
}

const out = `// src/data/calendario.ts
//
// ⚠️ ARCHIVO GENERADO — NO EDITAR A MANO.
// Fuente de verdad: src/data/matches.ts (1:1 con el Excel oficial FIFA).
// Regenerar con:  node scripts/generate-calendario.mjs
//
// "fecha" está en ISO 8601 UTC (matches.ts guarda hora ET; aquí ya convertida).

export interface Partido {
  id: string;
  grupo: string;
  jornada: number;
  fecha: string; // ISO 8601 UTC
  estadio: string;
  ciudad: string;
  homeSlug: string;
  awaySlug: string;
}

export const CALENDARIO: Partido[] = [
${lines.join("\n")}];

/** Devuelve todos los partidos de un grupo, ordenados por jornada. */
export function getPartidosByGrupo(grupo: string): Partido[] {
  return CALENDARIO.filter((p) => p.grupo === grupo).sort(
    (a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha),
  );
}

/** Partidos de un grupo en una jornada concreta. */
export function getPartidosByJornada(grupo: string, jornada: number): Partido[] {
  return CALENDARIO.filter((p) => p.grupo === grupo && p.jornada === jornada);
}

/** Devuelve todos los partidos de una fecha concreta (formato "YYYY-MM-DD"). */
export function getPartidosByFecha(fecha: string): Partido[] {
  return CALENDARIO.filter((p) => p.fecha.startsWith(fecha));
}

/** Devuelve todos los partidos en los que participa una selección (por slug). */
export function getPartidosByEquipo(slug: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.homeSlug === slug || p.awaySlug === slug,
  );
}

export function getPartidosByEstadio(estadio: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.estadio.toLowerCase().includes(estadio.toLowerCase()),
  );
}

export function getPartidosByCiudad(ciudad: string): Partido[] {
  return CALENDARIO.filter(
    (p) => p.ciudad.toLowerCase().includes(ciudad.toLowerCase()),
  );
}
`;

writeFileSync(join(root, "src/data/calendario.ts"), out);
console.log(`OK: ${groupStage.length} partidos de grupos → src/data/calendario.ts (${groups.length} grupos)`);
