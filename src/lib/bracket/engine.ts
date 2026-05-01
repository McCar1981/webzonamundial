// src/lib/bracket/engine.ts
// Motor puro del torneo (sin React). Funciones para construir estructura inicial,
// calcular standings de grupo, y propagar ganadores entre fases.

import { BRACKET_TEAMS, GROUPS, type BracketTeam } from "./teams";
import type { BracketMatch, BracketState, Pick, PhaseId } from "./types";

/** Round-robin pairs para 4 equipos (índices 0-3). */
const GROUP_PAIRS: Array<[number, number]> = [
  [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2],
];

/** Construye los 104 partidos del torneo con placeholders en knockouts. */
export function buildInitialMatches(): BracketMatch[] {
  const matches: BracketMatch[] = [];

  // Fase de grupos: 12 grupos × 6 partidos = 72
  GROUPS.forEach((g, gi) => {
    const teams = BRACKET_TEAMS.filter((t) => t.group === g);
    GROUP_PAIRS.forEach((pair, pi) => {
      matches.push({
        id: `G-${g}-${pi}`,
        phase: "GROUP",
        groupIdx: gi,
        a: teams[pair[0]].id,
        b: teams[pair[1]].id,
        slotIdx: gi * 6 + pi,
        slotTotal: 72,
      });
    });
  });

  // Knockout placeholders
  const ko: Array<[PhaseId, number]> = [
    ["R32", 16],
    ["R16", 8],
    ["QF", 4],
    ["SF", 2],
    ["THIRD", 1],
    ["FINAL", 1],
  ];
  ko.forEach(([phase, n]) => {
    for (let i = 0; i < n; i++) {
      matches.push({
        id: `${phase}-${i}`,
        phase,
        a: null,
        b: null,
        slotIdx: i,
        slotTotal: n,
      });
    }
  });

  return matches;
}

export interface GroupStanding {
  team: BracketTeam;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
}

/** Calcula tabla de un grupo según los picks actuales. */
export function groupStandings(state: BracketState, groupIdx: number): GroupStanding[] {
  const teams = BRACKET_TEAMS.filter((t) => t.group === GROUPS[groupIdx]);
  const stats: Record<string, GroupStanding> = Object.fromEntries(
    teams.map((t) => [t.id, { team: t, pts: 0, gf: 0, ga: 0, gd: 0 }])
  );

  state.matches
    .filter((m) => m.phase === "GROUP" && m.groupIdx === groupIdx)
    .forEach((m) => {
      const p = state.picks[m.id];
      if (!p || !m.a || !m.b) return;
      const sa = p.scoreA;
      const sb = p.scoreB;
      stats[m.a].gf += sa;
      stats[m.a].ga += sb;
      stats[m.b].gf += sb;
      stats[m.b].ga += sa;
      if (sa > sb) stats[m.a].pts += 3;
      else if (sb > sa) stats[m.b].pts += 3;
      else {
        stats[m.a].pts += 1;
        stats[m.b].pts += 1;
      }
    });

  return Object.values(stats)
    .map((s) => ({ ...s, gd: s.gf - s.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

export function isGroupComplete(state: BracketState, groupIdx: number): boolean {
  return state.matches
    .filter((m) => m.phase === "GROUP" && m.groupIdx === groupIdx)
    .every((m) => state.picks[m.id]);
}

export function areAllGroupsComplete(state: BracketState): boolean {
  for (let g = 0; g < 12; g++) {
    if (!isGroupComplete(state, g)) return false;
  }
  return true;
}

/**
 * Propaga ganadores hacia la siguiente fase. Mutates state.matches en sitio para
 * ajustar a/b de los placeholders. Llamar después de cada pick confirmado.
 */
export function propagate(state: BracketState): void {
  // Fase de grupos completa → llenar R32 con top 2 + best 8 thirds
  if (areAllGroupsComplete(state)) {
    const advancing: BracketTeam[] = [];
    for (let g = 0; g < 12; g++) {
      const std = groupStandings(state, g);
      advancing.push(std[0].team, std[1].team);
    }
    // 8 mejores terceros
    const thirds: GroupStanding[] = [];
    for (let g = 0; g < 12; g++) thirds.push(groupStandings(state, g)[2]);
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    thirds.slice(0, 8).forEach((t) => advancing.push(t.team));
    // Emparejamiento simple: 1 vs 32, 2 vs 31, ...
    for (let i = 0; i < 16; i++) {
      const m = state.matches.find((mm) => mm.id === `R32-${i}`);
      if (m) {
        m.a = advancing[i]?.id ?? null;
        m.b = advancing[31 - i]?.id ?? null;
      }
    }
  }

  // Cada ronda subsecuente: ganador i, i+1 → siguiente ronda
  const chain: Array<[PhaseId, PhaseId]> = [
    ["R32", "R16"],
    ["R16", "QF"],
    ["QF", "SF"],
    ["SF", "FINAL"],
  ];
  chain.forEach(([from, to]) => {
    const fromMatches = state.matches.filter((m) => m.phase === from).sort((a, b) => a.slotIdx - b.slotIdx);
    const toMatches = state.matches.filter((m) => m.phase === to).sort((a, b) => a.slotIdx - b.slotIdx);
    toMatches.forEach((tm, i) => {
      const ma = fromMatches[i * 2];
      const mb = fromMatches[i * 2 + 1];
      const pa = ma ? state.picks[ma.id] : undefined;
      const pb = mb ? state.picks[mb.id] : undefined;
      tm.a = pa?.winner ?? null;
      tm.b = pb?.winner ?? null;
    });
  });

  // 3er puesto = perdedores de Semis
  const sf = state.matches.filter((m) => m.phase === "SF").sort((a, b) => a.slotIdx - b.slotIdx);
  const third = state.matches.find((m) => m.id === "THIRD-0");
  if (third) {
    const sf0 = sf[0] ? state.picks[sf[0].id] : undefined;
    const sf1 = sf[1] ? state.picks[sf[1].id] : undefined;
    third.a = sf0 && sf[0] ? (sf0.winner === sf[0].a ? sf[0].b : sf[0].a) : null;
    third.b = sf1 && sf[1] ? (sf1.winner === sf[1].a ? sf[1].b : sf[1].a) : null;
  }
}

/** Recalcula currentPhaseIdx según qué fases están completas. */
export function recalcPhaseIdx(state: BracketState): number {
  const phaseIds: PhaseId[] = ["GROUP", "R32", "R16", "QF", "SF", "FINAL"];
  let idx = 0;
  for (let i = 0; i < phaseIds.length; i++) {
    const ms = state.matches.filter((m) => m.phase === phaseIds[i]);
    if (ms.length === 0) continue;
    if (ms.every((m) => state.picks[m.id])) idx = Math.min(i + 1, phaseIds.length - 1);
    else break;
  }
  return idx;
}

/** Conveniencia: el campeón actual o null. */
export function getChampion(state: BracketState): string | null {
  const fp = state.picks["FINAL-0"];
  return fp?.winner ?? null;
}

/** Crea estado inicial vacío. */
export function createInitialState(): BracketState {
  return {
    matches: buildInitialMatches(),
    picks: {},
    history: [],
    currentPhaseIdx: 0,
    champion: null,
  };
}

/** Aplica un pick (no mutates input — devuelve nuevo state). */
export function applyPick(
  state: BracketState,
  matchId: string,
  pick: Omit<Pick, "matchId" | "ts">
): BracketState {
  const next: BracketState = {
    ...state,
    matches: state.matches.map((m) => ({ ...m })),
    picks: { ...state.picks },
    history: [...state.history, { ...state.picks }],
  };
  next.picks[matchId] = {
    matchId,
    winner: pick.winner,
    scoreA: pick.scoreA,
    scoreB: pick.scoreB,
    ts: Date.now(),
  };
  propagate(next);
  // Después de propagar, los a/b de fases siguientes pudieron cambiar:
  // si un partido ya tenía pick pero ahora cambian sus equipos, descartamos ese pick.
  for (const m of next.matches) {
    if (m.phase === "GROUP") continue;
    const p = next.picks[m.id];
    if (!p) continue;
    if (!m.a || !m.b || (p.winner !== m.a && p.winner !== m.b)) {
      delete next.picks[m.id];
    }
  }
  next.currentPhaseIdx = recalcPhaseIdx(next);
  next.champion = getChampion(next);
  return next;
}

/** Deshace último pick. */
export function undoPick(state: BracketState): BracketState {
  if (state.history.length === 0) return state;
  const prevPicks = state.history[state.history.length - 1];
  const next: BracketState = {
    ...state,
    matches: buildInitialMatches(),
    picks: { ...prevPicks },
    history: state.history.slice(0, -1),
    currentPhaseIdx: 0,
    champion: null,
  };
  propagate(next);
  next.currentPhaseIdx = recalcPhaseIdx(next);
  next.champion = getChampion(next);
  return next;
}

/** Reset total. */
export function resetState(): BracketState {
  return createInitialState();
}
