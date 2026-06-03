// src/lib/ia-coach/oracle-sim.ts
//
// Motor MONTE CARLO del Mundial 2026 (IA Coach Modo 4: "Oráculo").
//
// AUTOCONTENIDO: no toca red ni Anthropic. Simula el torneo completo miles de
// veces usando la fuerza de cada selección derivada de su ranking FIFA y agrega
// las probabilidades de llegar a cada ronda y de ser campeón.
//
// Reutiliza la MISMA estructura del bracket que el motor real:
//   - 12 grupos × 4, round-robin (6 partidos)
//   - clasifican 2 por grupo + 8 mejores terceros = 32
//   - emparejamiento R32: 1 vs 32, 2 vs 31, ... (idéntico a engine.propagate)
//   - eliminatoria directa hasta la final
//
// La simulación es DETERMINISTA (semilla fija) → la "verdad del oráculo" es
// estable y cacheable.

import fs from "node:fs";
import path from "node:path";
import { BRACKET_TEAMS, GROUPS, type BracketTeam } from "@/lib/bracket/teams";

export const ORACLE_SIM_VERSION = "v1";
const DEFAULT_ITERATIONS = 20000;
const SEED = 0x9e3779b1;

// Cuánto pesa la diferencia de "rating" en la probabilidad de ganar. Más alto =
// los favoritos ganan más a menudo. Calibrado para que el #1 sea claro favorito
// frente al #50 sin volver el torneo determinista.
const SPREAD = 0.85;

/* ─────────────── Fuerza por ranking FIFA ─────────────── */

let RANK_BY_ID: Record<string, number> | null = null;

function loadRanks(): Record<string, number> {
  if (RANK_BY_ID) return RANK_BY_ID;
  const map: Record<string, number> = {};
  try {
    const dir = path.join(process.cwd(), "data", "teams");
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as {
          iso3?: string;
          fifa_ranking?: { current?: number };
        };
        const id = (j.iso3 || "").toUpperCase();
        const r = j.fifa_ranking?.current;
        if (id && typeof r === "number" && r > 0) map[id] = r;
      } catch {
        /* ignora un archivo corrupto */
      }
    }
  } catch {
    /* sin data/teams → todos caen al ranking por defecto */
  }
  RANK_BY_ID = map;
  return map;
}

/** rating mayor = mejor. log(rank) comprime la escala (1 vs 4 importa más que 40 vs 43). */
function ratingOf(id: string, ranks: Record<string, number>): number {
  const r = ranks[id] ?? 75; // selección sin dato → cola del ranking
  return -Math.log(r);
}

/* ─────────────── RNG determinista (mulberry32) ─────────────── */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─────────────── Tipos ─────────────── */

export interface TeamOdds {
  id: string;
  name: string;
  rank: number;
  /** Probabilidades 0-1. */
  champion: number;
  finalist: number;
  semifinalist: number;
  quarterfinalist: number;
  knockout: number; // llega a R32 (top 32)
}

export interface OracleSimResult {
  version: string;
  iterations: number;
  /** Selecciones ordenadas por probabilidad de campeón (desc). */
  teams: TeamOdds[];
}

/* ─────────────── Núcleo de simulación ─────────────── */

interface GroupTeam {
  id: string;
  rating: number;
  pts: number;
  gf: number;
  ga: number;
}

const GROUP_PAIRS: Array<[number, number]> = [
  [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2],
];

/** Probabilidad logística de que A gane a B (sin empate). */
function pAWin(ra: number, rb: number): number {
  return 1 / (1 + Math.exp(-(ra - rb) * SPREAD));
}

export function runOracleSim(iterations = DEFAULT_ITERATIONS): OracleSimResult {
  const ranks = loadRanks();
  const rng = mulberry32(SEED);

  // Equipos por grupo, con rating precalculado.
  const teamsByGroup: BracketTeam[][] = GROUPS.map((g) =>
    BRACKET_TEAMS.filter((t) => t.group === g),
  );
  const ratingById: Record<string, number> = {};
  for (const t of BRACKET_TEAMS) ratingById[t.id] = ratingOf(t.id, ranks);

  // Acumuladores.
  const acc: Record<string, Omit<TeamOdds, "name" | "rank">> = {};
  for (const t of BRACKET_TEAMS) {
    acc[t.id] = { id: t.id, champion: 0, finalist: 0, semifinalist: 0, quarterfinalist: 0, knockout: 0 };
  }

  for (let iter = 0; iter < iterations; iter++) {
    // ── Fase de grupos ──
    const thirds: GroupTeam[] = [];
    const advancing: string[] = []; // se llena en orden g0-1º, g0-2º, g1-1º, ...

    for (let gi = 0; gi < 12; gi++) {
      const teams = teamsByGroup[gi];
      const gt: GroupTeam[] = teams.map((t) => ({
        id: t.id,
        rating: ratingById[t.id],
        pts: 0,
        gf: 0,
        ga: 0,
      }));

      for (const [i, j] of GROUP_PAIRS) {
        const A = gt[i];
        const B = gt[j];
        const diff = A.rating - B.rating;
        const drawP = 0.27 * Math.exp(-Math.abs(diff) * 0.6);
        const aWin = (1 - drawP) * pAWin(A.rating, B.rating);
        const r = rng();
        let ga: number, gb: number;
        if (r < aWin) {
          ga = 1 + Math.floor(rng() * 3);
          gb = Math.floor(rng() * ga);
          A.pts += 3;
        } else if (r < aWin + (1 - drawP - aWin)) {
          gb = 1 + Math.floor(rng() * 3);
          ga = Math.floor(rng() * gb);
          B.pts += 3;
        } else {
          ga = gb = Math.floor(rng() * 3);
          A.pts += 1;
          B.pts += 1;
        }
        A.gf += ga; A.ga += gb;
        B.gf += gb; B.ga += ga;
      }

      gt.sort(
        (a, b) =>
          b.pts - a.pts ||
          (b.gf - b.ga) - (a.gf - a.ga) ||
          b.gf - a.gf ||
          b.rating - a.rating,
      );
      advancing.push(gt[0].id, gt[1].id);
      thirds.push(gt[2]);
      acc[gt[0].id].knockout++;
      acc[gt[1].id].knockout++;
    }

    // 8 mejores terceros.
    thirds.sort(
      (a, b) =>
        b.pts - a.pts ||
        (b.gf - b.ga) - (a.gf - a.ga) ||
        b.gf - a.gf ||
        b.rating - a.rating,
    );
    for (let k = 0; k < 8; k++) {
      advancing.push(thirds[k].id);
      acc[thirds[k].id].knockout++;
    }

    // ── R32: emparejamiento i vs 31-i → 16 ganadores (alcanzan octavos) ──
    let round: string[] = new Array(16);
    for (let i = 0; i < 16; i++) {
      round[i] = koWinner(advancing[i], advancing[31 - i], ratingById, rng);
    }

    // ── Octavos (R16): 16 ganadores → 8 que alcanzan cuartos ──
    round = reduceRound(round, ratingById, rng);
    for (const id of round) acc[id].quarterfinalist++;

    // ── QF (4) → semifinalistas ──
    round = reduceRound(round, ratingById, rng);
    for (const id of round) acc[id].semifinalist++;

    // ── SF (2) → finalistas ──
    round = reduceRound(round, ratingById, rng);
    for (const id of round) acc[id].finalist++;

    // ── FINAL → campeón ──
    const champion = koWinner(round[0], round[1], ratingById, rng);
    acc[champion].champion++;
  }

  const teams: TeamOdds[] = BRACKET_TEAMS.map((t) => {
    const a = acc[t.id];
    return {
      id: t.id,
      name: t.name,
      rank: ranks[t.id] ?? 75,
      champion: a.champion / iterations,
      finalist: a.finalist / iterations,
      semifinalist: a.semifinalist / iterations,
      quarterfinalist: a.quarterfinalist / iterations,
      knockout: a.knockout / iterations,
    };
  }).sort((x, y) => y.champion - x.champion);

  return { version: ORACLE_SIM_VERSION, iterations, teams };
}

/** Decide el ganador de un cruce de eliminatoria directa (sin empate). */
function koWinner(
  a: string,
  b: string,
  rating: Record<string, number>,
  rng: () => number,
): string {
  return rng() < pAWin(rating[a], rating[b]) ? a : b;
}

/** Toma una ronda de N ganadores y devuelve N/2 ganadores del cruce i, i+1. */
function reduceRound(
  prev: string[],
  rating: Record<string, number>,
  rng: () => number,
): string[] {
  const next: string[] = new Array(prev.length / 2);
  for (let i = 0; i < next.length; i++) {
    next[i] = koWinner(prev[i * 2], prev[i * 2 + 1], rating, rng);
  }
  return next;
}
