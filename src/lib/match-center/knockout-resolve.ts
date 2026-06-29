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

/** Resultado de un partido KO con lo necesario para decidir el ganador. */
export interface KoResult {
  status: string;
  score: [number, number];
  /** Marcador de la tanda de penaltis si el partido se decidió así (status PEN). */
  penalty?: [number, number];
}

/**
 * Construye el mapa etiqueta→selección real. `live` es el LiveMap de TODOS los
 * partidos (grupos + KO), keyed por matchId, para las clasificaciones. `koResults`
 * trae el resultado completo de cada KO (incluida la tanda de penaltis) para
 * encadenar los ganadores W## correctamente.
 */
export function resolveKnockoutSlots(
  live: LiveMap,
  koResults: Record<number, KoResult> = {},
): Map<string, ResolvedTeam> {
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
  const thirds = GROUPS
    .filter((g) => played[g] && ordered[g][2])
    .map((g) => ({ group: g, row: ordered[g][2].row, team: ordered[g][2] }));
  // Ranking de terceros: pts → DG → GF y, como desempate determinístico, ranking
  // FIFA (la FIFA usa fair-play y sorteo, fuera de alcance; el ranking aproxima).
  thirds.sort(
    (a, b) => cmpRow(a.row, b.row) || (a.team.rankingFIFA ?? 999) - (b.team.rankingFIFA ?? 999),
  );
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
    // Siempre provisional: la selección clasificada es real, pero la asignación
    // tercero→llave es un emparejamiento válido, no la tabla oficial FIFA. Cuando
    // el cuadro sea oficial, matches.ts trae el equipo real y manda (provisional:false).
    out.set(slot.label, { flagCode: t.team.flagCode, nombre: t.team.nombre, provisional: true });
  });

  // 4) Ganadores Y PERDEDORES de rondas KO ya jugadas. Varias pasadas para
  //    propagar a través de rondas (un W/L puede depender de otro ya resuelto).
  //    Necesitamos los perdedores (L##) porque el partido por el TERCER PUESTO
  //    cruza a los perdedores de las semifinales (h:"L101" / a:"L102"). En KO no
  //    hay empate: FT/AET se deciden por marcador y PEN por la tanda.
  const koMatches = MATCHES.filter((m) => m.i < 9000 && m.p !== "Fase de grupos");
  for (let pass = 0; pass < 6; pass++) {
    let progressed = false;
    for (const m of koMatches) {
      if (out.has(`W${m.i}`)) continue;
      const res = koResults[m.i];
      if (!res || !FINISHED_STATUSES.has(res.status)) continue;
      const home = sideTeam(m.h, m.hf, out);
      const away = sideTeam(m.a, m.af, out);
      if (!home || !away) continue;
      const win = koWinner(res, home, away);
      if (!win) continue; // dato insuficiente (p. ej. PEN sin marcador de tanda)
      const lose = win.flagCode === home.flagCode ? away : home;
      out.set(`W${m.i}`, { flagCode: win.flagCode, nombre: win.nombre, provisional: false });
      out.set(`L${m.i}`, { flagCode: lose.flagCode, nombre: lose.nombre, provisional: false });
      progressed = true;
    }
    if (!progressed) break;
  }

  return out;
}

// Equipo de un lado de un partido KO. Si matches.ts ya trae el clasificado real
// (flag != "tbd", p. ej. los 16avos ya rellenos), se usa ESE; si no, se resuelve
// la etiqueta de slot ("W74", "1A"...) contra el mapa ya calculado. Sin esto, al
// rellenar matches.ts con los nombres reales, el encadenado dejaba de encontrar
// los equipos (buscaba "Sudáfrica" como clave de slot) y los ganadores no subían.
function sideTeam(label: string, flag: string, map: Map<string, ResolvedTeam>): ResolvedTeam | null {
  if (flag && flag !== "tbd") return { flagCode: flag, nombre: NOMBRE_BY_FLAG[flag] ?? label, provisional: false };
  return map.get(label) ?? null;
}

// Ganador de un partido KO terminado: PEN se decide por la tanda; FT/AET por el
// marcador (en KO no hay empate). Devuelve null si falta el dato para decidir.
function koWinner(res: KoResult, home: ResolvedTeam, away: ResolvedTeam): ResolvedTeam | null {
  if (res.status === "PEN") {
    const p = res.penalty;
    if (!p || p[0] === p[1]) return null;
    return p[0] > p[1] ? home : away;
  }
  const [hg, ag] = res.score;
  if (hg === ag) return null;
  return hg > ag ? home : away;
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
