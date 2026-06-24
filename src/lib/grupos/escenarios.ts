// src/lib/grupos/escenarios.ts
//
// Datos para la landing de "escenarios de la última jornada": por cada grupo,
// la clasificación viva, los partidos de la jornada 3 (la última), una insignia
// de CERTEZA por selección y los cruces de dieciseisavos a los que va el 1º/2º.
//
// CLAVE de veracidad: el orden de la tabla lo hace el motor FIFA real
// (standingsOrder). Las insignias se calculan de forma CONSERVADORA por PUNTOS
// (nunca afirman "clasificado" si un empate a puntos podría dejarlo fuera por
// diferencia de goles): under-claim seguro. El detalle fino lo resuelve el
// simulador interactivo del cliente (que reusa el mismo motor con los
// resultados que el usuario elija). Server-only por getLastSnapshotsBulk (KV).

import { MATCHES } from "@/data/matches";
import { getSeleccionesByGrupo } from "@/data/selecciones";
import { FINISHED_STATUSES, type LiveMap } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import { standingsOrder, type TeamMeta, type StandingRow } from "@/lib/grupos/standings";

export const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export type Certeza = "primero" | "clasificado" | "decide" | "fuera";

export interface FinalMatchView {
  i: number;
  hf: string; hn: string;
  af: string; an: string;
  fecha: string; // "YYYY-MM-DD" (día local de la sede)
  hora: string;  // ET
  sede: string;
  jugado: boolean;
}

export interface CruceDest {
  rival: string; // etiqueta legible del rival (slot)
  sede: string;
  fecha: string;
}

export interface RowView extends StandingRow {
  nombre: string;
}

export interface GroupScenario {
  letra: string;
  teams: TeamMeta[];
  /** LiveMap serializable acotado a los partidos de este grupo (forma {s,sc}). */
  live: LiveMap;
  /** Clasificación actual ordenada (motor FIFA real). */
  current: RowView[];
  finals: FinalMatchView[];
  badges: Record<string, Certeza>; // por flagCode
  decided: boolean;
  cruces: { primero: CruceDest | null; segundo: CruceDest | null };
}

// "1A" -> "1º del Grupo A"; "2C" -> "2º del Grupo C"; "3CEFHI" -> "Mejor 3º (C/E/F/H/I)"
export function slotLabel(code: string): string {
  if (/^1[A-L]$/.test(code)) return `1º del Grupo ${code.slice(1)}`;
  if (/^2[A-L]$/.test(code)) return `2º del Grupo ${code.slice(1)}`;
  if (/^3[A-L]+$/.test(code)) return `Mejor 3º (${code.slice(1).split("").join("/")})`;
  return code;
}

const DIECISEISAVOS = MATCHES.filter((m) => m.p === "Dieciseisavos");

/** Dónde juega el slot dado (p.ej. "1A") en dieciseisavos: rival, sede, fecha. */
function destinoDe(slot: string): CruceDest | null {
  const m = DIECISEISAVOS.find((x) => x.h === slot || x.a === slot);
  if (!m) return null;
  const rivalSlot = m.h === slot ? m.a : m.h;
  return { rival: slotLabel(rivalSlot), sede: `${m.vn} · ${m.vc}`, fecha: m.d };
}

const allOutcomes = [3, 1, 0] as const; // gana / empata / pierde (puntos del local)

/**
 * Insignia conservadora por puntos para una selección, enumerando los
 * resultados (G/E/P) de los partidos NO jugados de la última jornada.
 * - "primero": en TODOS los escenarios, nadie le iguala ni supera en puntos.
 * - "clasificado": en TODOS, como mucho 1 rival le iguala o supera (top-2 seguro).
 * - "fuera": en TODOS, al menos 2 rivales le superan en puntos (top-2 imposible).
 * - "decide": cualquier otro caso.
 * Nunca afirma de más: los empates a puntos cuentan en contra del equipo.
 */
function computeBadges(
  teams: TeamMeta[],
  basePts: Map<string, number>,
  unfinishedFinals: Array<{ hf: string; af: string }>,
): Record<string, Certeza> {
  // Enumerar el producto cartesiano de resultados de los partidos no jugados.
  const combos: Array<Map<string, number>> = [];
  const n = unfinishedFinals.length;
  const total = Math.pow(3, n);
  for (let mask = 0; mask < Math.max(1, total); mask++) {
    const pts = new Map(basePts);
    let rem = mask;
    for (let k = 0; k < n; k++) {
      const o = allOutcomes[rem % 3];
      rem = Math.floor(rem / 3);
      const { hf, af } = unfinishedFinals[k];
      if (o === 3) pts.set(hf, (pts.get(hf) ?? 0) + 3);
      else if (o === 0) pts.set(af, (pts.get(af) ?? 0) + 3);
      else { pts.set(hf, (pts.get(hf) ?? 0) + 1); pts.set(af, (pts.get(af) ?? 0) + 1); }
    }
    combos.push(pts);
  }

  const out: Record<string, Certeza> = {};
  for (const t of teams) {
    let alwaysFirst = true; // nadie >= en ningún combo
    let alwaysTop2 = true;  // <=1 rival >= en cada combo
    let alwaysOut = true;   // >=2 rivales > en cada combo
    for (const pts of combos) {
      const my = pts.get(t.flagCode) ?? 0;
      let ge = 0; // rivales con pts >= los míos
      let gt = 0; // rivales con pts > los míos
      for (const o of teams) {
        if (o.flagCode === t.flagCode) continue;
        const op = pts.get(o.flagCode) ?? 0;
        if (op >= my) ge++;
        if (op > my) gt++;
      }
      if (ge > 0) alwaysFirst = false;
      if (ge > 1) alwaysTop2 = false;
      if (gt < 2) alwaysOut = false;
    }
    out[t.flagCode] = alwaysFirst ? "primero" : alwaysTop2 ? "clasificado" : alwaysOut ? "fuera" : "decide";
  }
  return out;
}

async function buildGroup(letra: string, liveAll: LiveMap): Promise<GroupScenario> {
  const sel = getSeleccionesByGrupo(letra);
  const teams: TeamMeta[] = sel.map((s) => ({ flagCode: s.flagCode, nombre: s.nombre, rankingFIFA: s.rankingFIFA }));

  const groupMatches = MATCHES.filter((m) => m.g === letra && m.p === "Fase de grupos");
  // LiveMap acotado a este grupo (serializable, forma {s,sc}).
  const live: LiveMap = {};
  for (const m of groupMatches) if (liveAll[m.i]) live[m.i] = liveAll[m.i];

  const { ordered } = standingsOrder(letra, teams, live);
  const current: RowView[] = ordered.map((o) => ({ ...o.row, nombre: o.nombre }));

  const finalsRaw = groupMatches.filter((m) => m.j === 3).sort((a, b) => a.i - b.i);
  const finals: FinalMatchView[] = finalsRaw.map((m) => ({
    i: m.i, hf: m.hf, hn: m.h, af: m.af, an: m.a,
    fecha: m.d, hora: m.t, sede: `${m.vn} · ${m.vc}`,
    jugado: !!live[m.i] && FINISHED_STATUSES.has(live[m.i].s),
  }));

  const decided = groupMatches.length > 0 && groupMatches.every((m) => !!live[m.i] && FINISHED_STATUSES.has(live[m.i].s));

  let badges: Record<string, Certeza>;
  if (decided) {
    // Grupo cerrado: posición real (con desempate FIFA ya aplicado).
    badges = {};
    ordered.forEach((o, idx) => {
      badges[o.flagCode] = idx === 0 ? "primero" : idx === 1 ? "clasificado" : "fuera";
    });
  } else {
    const basePts = new Map(current.map((r) => [r.flagCode, r.pts] as const));
    const unfinished = finalsRaw
      .filter((m) => !(live[m.i] && FINISHED_STATUSES.has(live[m.i].s)))
      .map((m) => ({ hf: m.hf, af: m.af }));
    badges = computeBadges(teams, basePts, unfinished);
  }

  return {
    letra, teams, live, current, finals, badges, decided,
    cruces: { primero: destinoDe(`1${letra}`), segundo: destinoDe(`2${letra}`) },
  };
}

export async function computeEscenarios(): Promise<GroupScenario[]> {
  const groupMatchIds = MATCHES.filter((m) => m.p === "Fase de grupos").map((m) => m.i);
  const snaps = await getLastSnapshotsBulk(groupMatchIds);
  // getLastSnapshotsBulk devuelve {status, score}; standings.ts consume {s, sc}.
  const liveAll: LiveMap = {};
  for (const id of groupMatchIds) {
    const snap = snaps[id];
    if (snap && snap.status) liveAll[id] = { s: snap.status, sc: (snap.score ?? [0, 0]) as [number, number] };
  }
  return Promise.all(GROUP_LETTERS.map((l) => buildGroup(l, liveAll)));
}
