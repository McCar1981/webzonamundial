// src/lib/grupos/standings.ts
//
// Clasificación de un grupo que se construye SOLA a medida que terminan los
// partidos. Sin datos inventados: el marcador viene del mismo snapshot durable
// del Match Center que alimenta /api/calendario/live (LiveMap keyed por m.i).
//
// Los partidos se leen de MATCHES (única fuente de fixtures, 1:1 con el Excel
// FIFA) filtrando la fase de grupos del grupo pedido. El join equipo↔resultado
// se hace por flagCode, que en MATCHES (hf/af) y en selecciones.ts coincide 1:1.
//
// Desempate (orden oficial FIFA): puntos → diferencia de goles → goles a favor;
// entre los que siguen empatados, mini-liga directa (puntos, DG, GF solo en los
// partidos entre ellos); y como último recurso, ranking FIFA y nombre. Mientras
// no se haya jugado nada todos quedan a cero y el orden cae al ranking FIFA,
// que es exactamente el comportamiento previo de la tabla.

import { MATCHES } from "@/data/matches";
import { FINISHED_STATUSES, IN_PLAY_STATUSES, type LiveMap } from "@/lib/calendario/live";

/** Una fila de la tabla, acumulada desde los partidos terminados. */
export interface StandingRow {
  flagCode: string;
  pj: number; // partidos jugados
  g: number;  // ganados
  e: number;  // empatados
  p: number;  // perdidos
  gf: number; // goles a favor
  ga: number; // goles en contra
  gd: number; // diferencia de goles
  pts: number;
}

/** Metadatos mínimos del equipo para ordenar y pintar. */
export interface TeamMeta {
  flagCode: string;
  nombre: string;
  rankingFIFA?: number;
}

function emptyRow(flagCode: string): StandingRow {
  return { flagCode, pj: 0, g: 0, e: 0, p: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
}

/** Partidos de FASE DE GRUPOS de un grupo (los de KO no cuentan para la tabla). */
function groupStageMatches(group: string) {
  return MATCHES.filter((m) => m.g === group && m.p === "Fase de grupos");
}

/**
 * Acumula la tabla del grupo a partir de los partidos TERMINADOS en `live`.
 * Devuelve una fila por flagCode (siempre las `flags` pedidas, aunque a cero) y
 * si se ha jugado al menos un partido del grupo.
 */
export function accumulateStandings(
  group: string,
  flags: string[],
  live: LiveMap,
): { rows: Map<string, StandingRow>; anyPlayed: boolean } {
  const rows = new Map<string, StandingRow>();
  for (const f of flags) rows.set(f, emptyRow(f));

  let anyPlayed = false;
  for (const m of groupStageMatches(group)) {
    const l = live[m.i];
    if (!l || !FINISHED_STATUSES.has(l.s)) continue;

    const home = rows.get(m.hf);
    const away = rows.get(m.af);
    if (!home || !away) continue; // equipo fuera de la lista pedida: ignorar

    const [hg, ag] = l.sc;
    anyPlayed = true;
    home.pj++; away.pj++;
    home.gf += hg; home.ga += ag;
    away.gf += ag; away.ga += hg;

    if (hg > ag) { home.g++; away.p++; home.pts += 3; }
    else if (hg < ag) { away.g++; home.p++; away.pts += 3; }
    else { home.e++; away.e++; home.pts++; away.pts++; }
  }

  for (const r of rows.values()) r.gd = r.gf - r.ga;
  return { rows, anyPlayed };
}

/** Compara dos equipos por los criterios GLOBALES: pts → DG → GF. */
function cmpOverall(a: StandingRow, b: StandingRow): number {
  return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
}

function equalOverall(a: StandingRow, b: StandingRow): boolean {
  return a.pts === b.pts && a.gd === b.gd && a.gf === b.gf;
}

/**
 * Mini-liga directa entre los equipos empatados: puntos, DG y GF contando solo
 * los partidos terminados jugados ENTRE ellos. Devuelve el subconjunto ordenado;
 * si tras la mini-liga sigue habiendo empate, cae a ranking FIFA y luego nombre.
 */
function resolveTie(bucket: TeamMeta[], group: string, live: LiveMap): TeamMeta[] {
  const inBucket = new Set(bucket.map((t) => t.flagCode));
  const h2h = new Map<string, StandingRow>();
  for (const t of bucket) h2h.set(t.flagCode, emptyRow(t.flagCode));

  for (const m of groupStageMatches(group)) {
    if (!inBucket.has(m.hf) || !inBucket.has(m.af)) continue;
    const l = live[m.i];
    if (!l || !FINISHED_STATUSES.has(l.s)) continue;
    const home = h2h.get(m.hf)!;
    const away = h2h.get(m.af)!;
    const [hg, ag] = l.sc;
    home.gf += hg; home.ga += ag;
    away.gf += ag; away.ga += hg;
    if (hg > ag) home.pts += 3;
    else if (hg < ag) away.pts += 3;
    else { home.pts++; away.pts++; }
  }
  for (const r of h2h.values()) r.gd = r.gf - r.ga;

  return [...bucket].sort((a, b) => {
    const ra = h2h.get(a.flagCode)!;
    const rb = h2h.get(b.flagCode)!;
    return (
      cmpOverall(ra, rb) ||
      (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999) ||
      a.nombre.localeCompare(b.nombre)
    );
  });
}

/**
 * Ordena los equipos del grupo según la clasificación viva. Resultado estable:
 * sin partidos jugados, el orden equivale al ranking FIFA (comportamiento
 * previo). Devuelve cada equipo con su fila acumulada ya adjunta.
 */
export function standingsOrder(
  group: string,
  teams: TeamMeta[],
  live: LiveMap,
): { ordered: Array<TeamMeta & { row: StandingRow }>; anyPlayed: boolean; anyLive: boolean } {
  const flags = teams.map((t) => t.flagCode);
  const { rows, anyPlayed } = accumulateStandings(group, flags, live);
  const anyLive = groupStageMatches(group).some((m) => {
    const l = live[m.i];
    return !!l && IN_PLAY_STATUSES.has(l.s);
  });

  // 1) Orden por criterios globales (pts, DG, GF).
  const byOverall = [...teams].sort((a, b) =>
    cmpOverall(rows.get(a.flagCode)!, rows.get(b.flagCode)!),
  );

  // 2) Resolver los bloques que siguen empatados con mini-liga + ranking + nombre.
  const ordered: TeamMeta[] = [];
  let i = 0;
  while (i < byOverall.length) {
    let j = i + 1;
    while (
      j < byOverall.length &&
      equalOverall(rows.get(byOverall[i].flagCode)!, rows.get(byOverall[j].flagCode)!)
    ) {
      j++;
    }
    const bucket = byOverall.slice(i, j);
    ordered.push(...(bucket.length === 1 ? bucket : resolveTie(bucket, group, live)));
    i = j;
  }

  return {
    ordered: ordered.map((t) => ({ ...t, row: rows.get(t.flagCode)! })),
    anyPlayed,
    anyLive,
  };
}
