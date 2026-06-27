// src/lib/match-center/knockout-resolve.ts
//
// Resuelve las etiquetas de slot del cuadro de eliminatorias ("1A", "2C",
// "3ABCDF", "W74") a la SELECCIÓN real, a partir de las clasificaciones VIVAS de
// grupo (que se construyen solas con los resultados terminados) y de los
// ganadores de las rondas KO ya jugadas. Todo es PROVISIONAL mientras un grupo
// no haya cerrado su última jornada: se marca `provisional: true` para avisarlo.
//
// 1X / 2X  → 1.º / 2.º del grupo X (exacto desde standings).
// 3<set>   → uno de los 8 mejores terceros, asignado a su slot por emparejamiento
//            bipartito válido (cada slot admite un tercero de un set de grupos).
// W##      → ganador del partido KO ## (cuando ya tiene resultado claro).

import { MATCHES } from "@/data/matches";
import { SELECCIONES } from "@/data/selecciones";
import { standingsOrder, type TeamMeta, type StandingRow } from "@/lib/grupos/standings";
import { FINISHED_STATUSES, type LiveMap } from "@/lib/calendario/live";

export interface ResolvedTeam {
  flagCode: string;
  nombre: string;
  provisional: boolean;
}

const GROUPS = "ABCDEFGHIJKL".split("");

// TeamMeta por grupo desde selecciones.ts (única fuente de selecciones).
const TEAMS_BY_GROUP: Record<string, TeamMeta[]> = (() => {
  const by: Record<string, TeamMeta[]> = {};
  for (const g of GROUPS) by[g] = [];
  for (const s of SELECCIONES) {
    if (by[s.grupo]) by[s.grupo].push({ flagCode: s.flagCode, nombre: s.nombre, rankingFIFA: s.rankingFIFA });
  }
  return by;
})();

const NOMBRE_BY_FLAG: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const s of SELECCIONES) m[s.flagCode] = s.nombre;
  return m;
})();

// Partidos de fase de grupos por grupo (para saber si el grupo ya cerró).
function groupAllFinished(group: string, live: LiveMap): boolean {
  const ms = MATCHES.filter((m) => m.g === group && m.p === "Fase de grupos");
  if (ms.length === 0) return false;
  return ms.every((m) => {
    const l = live[m.i];
    return !!l && FINISHED_STATUSES.has(l.s);
  });
}

function cmpRow(a: StandingRow, b: StandingRow): number {
  return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
}

/**
 * Construye el mapa etiqueta→selección real. `live` es el LiveMap de TODOS los
 * partidos (grupos + KO), keyed por matchId.
 */
export function resolveKnockoutSlots(live: LiveMap): Map<string, ResolvedTeam> {
  const out = new Map<string, ResolvedTeam>();

  // 1) Clasificaciones por grupo.
  const ordered: Record<string, Array<TeamMeta & { row: StandingRow }>> = {};
  const played: Record<string, boolean> = {};
  const decided: Record<string, boolean> = {};
  for (const g of GROUPS) {
    const r = standingsOrder(g, TEAMS_BY_GROUP[g], live);
    ordered[g] = r.ordered;
    played[g] = r.anyPlayed;
    decided[g] = groupAllFinished(g, live);
  }

  // 2) 1X / 2X — solo si el grupo ha jugado algo (si no, no inventamos cruce).
  for (const g of GROUPS) {
    if (!played[g]) continue;
    const prov = !decided[g];
    const first = ordered[g][0];
    const second = ordered[g][1];
    if (first) out.set(`1${g}`, { flagCode: first.flagCode, nombre: first.nombre, provisional: prov });
    if (second) out.set(`2${g}`, { flagCode: second.flagCode, nombre: second.nombre, provisional: prov });
  }

  // 3) Mejores terceros + asignación a sus slots.
  const allDecided = GROUPS.every((g) => decided[g]);
  const thirds = GROUPS
    .filter((g) => played[g] && ordered[g][2])
    .map((g) => ({ group: g, row: ordered[g][2].row, team: ordered[g][2] }));
  thirds.sort((a, b) => cmpRow(a.row, b.row));
  const qualifiers = thirds.slice(0, 8); // los 8 mejores terceros clasifican
  const qualifierGroups = qualifiers.map((t) => t.group);

  // Slots de tercero del cuadro (orden natural de matches.ts), cada uno con su
  // set de grupos admitidos (las letras tras el "3").
  const thirdSlots = [...new Set(
    MATCHES.filter((m) => m.i < 9000 && m.p !== "Fase de grupos")
      .flatMap((m) => [m.h, m.a])
      .filter((lbl) => /^3[A-L]+$/.test(lbl)),
  )].map((label) => ({ label, set: new Set(label.slice(1).split("")) }));

  // Emparejamiento bipartito (Kuhn): cada grupo clasificado → un slot que lo
  // admita. Procesar por ranking para un resultado estable y de calidad.
  const groupOfSlot: (string | null)[] = thirdSlots.map(() => null);
  const adj: Record<string, number[]> = {};
  for (const g of qualifierGroups) {
    adj[g] = thirdSlots.map((s, i) => (s.set.has(g) ? i : -1)).filter((i) => i >= 0);
  }
  function augment(g: string, seen: Set<number>): boolean {
    for (const s of adj[g] ?? []) {
      if (seen.has(s)) continue;
      seen.add(s);
      if (groupOfSlot[s] === null || augment(groupOfSlot[s]!, seen)) {
        groupOfSlot[s] = g;
        return true;
      }
    }
    return false;
  }
  for (const g of qualifierGroups) augment(g, new Set());

  thirdSlots.forEach((slot, i) => {
    const g = groupOfSlot[i];
    if (!g) return;
    const t = qualifiers.find((q) => q.group === g)!;
    out.set(slot.label, { flagCode: t.team.flagCode, nombre: t.team.nombre, provisional: !allDecided });
  });

  // 4) Ganadores de rondas KO ya jugadas (W##). Varias pasadas para propagar
  //    a través de rondas. Solo si hay un ganador claro (sin empate).
  const koMatches = MATCHES.filter((m) => m.i < 9000 && m.p !== "Fase de grupos");
  for (let pass = 0; pass < 6; pass++) {
    for (const m of koMatches) {
      const key = `W${m.i}`;
      if (out.has(key)) continue;
      const l = live[m.i];
      if (!l || !FINISHED_STATUSES.has(l.s)) continue;
      const home = resolveLabel(m.h, out);
      const away = resolveLabel(m.a, out);
      if (!home || !away) continue;
      const [hg, ag] = l.sc;
      if (hg === ag) continue; // penaltis no determinables desde el marcador base
      const win = hg > ag ? home : away;
      out.set(key, { flagCode: win.flagCode, nombre: win.nombre, provisional: false });
    }
  }

  return out;
}

// Resuelve una etiqueta concreta usando el mapa ya calculado (helper interno).
function resolveLabel(label: string, map: Map<string, ResolvedTeam>): ResolvedTeam | null {
  return map.get(label) ?? null;
}

/** Aplica el mapa a una etiqueta para la respuesta: equipo real o la etiqueta cruda. */
export function applyResolution(
  label: string,
  flag: string,
  map: Map<string, ResolvedTeam>,
): { name: string; flag: string | null; provisional: boolean } {
  // Si matches.ts ya trae el equipo real (flag != tbd), respetarlo.
  if (flag && flag !== "tbd") return { name: NOMBRE_BY_FLAG[flag] ?? label, flag, provisional: false };
  const r = map.get(label);
  if (r) return { name: r.nombre, flag: r.flagCode, provisional: r.provisional };
  return { name: label, flag: null, provisional: false };
}
