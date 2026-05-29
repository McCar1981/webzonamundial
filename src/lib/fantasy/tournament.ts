// src/lib/fantasy/tournament.ts
//
// Bracket DETERMINISTA del Mundial 2026 (48 selecciones, 12 grupos). Proyecta
// hasta qué ronda llega cada selección a partir de su ranking FIFA + un sorteo
// reproducible (misma semilla ⇒ mismo cuadro siempre). Sirve para la mecánica
// de "eliminación": fichar jugadores de selecciones que avanzan rinde más,
// porque disputan más partidos. Cuando lleguen los fixtures reales, esta
// proyección se sustituirá por los resultados oficiales.

import { SELECCIONES, type Seleccion } from "@/data/selecciones";

export type Stage = "grupos" | "r32" | "octavos" | "cuartos" | "semis" | "final" | "campeon";

export interface TeamRun {
  slug: string;
  stage: Stage; // hasta dónde llega (proyección)
  stageRound: number; // 0 grupos · 1 16avos · 2 octavos · 3 cuartos · 4 semis · 5 final · 6 campeón
}

// Ronda → etapa alcanzada (la ronda en la que cae es su mejor resultado).
const STAGE_BY_ROUND: Stage[] = ["grupos", "r32", "octavos", "cuartos", "semis", "final", "campeon"];

export const STAGE_LABEL: Record<Stage, string> = {
  grupos: "Fase de grupos",
  r32: "16avos de final",
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semis: "Semifinales",
  final: "Final",
  campeon: "Campeón",
};

export const STAGE_SHORT: Record<Stage, string> = {
  grupos: "Grupos",
  r32: "16avos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semis",
  final: "Final",
  campeon: "Campeón",
};

// ---- RNG determinista ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Fuerza base (0.25..0.99) según ranking FIFA + ruido determinista por slug. */
function powerOf(t: Seleccion): number {
  const base = clamp(1 - ((t.rankingFIFA ?? 90) - 1) / 150, 0.25, 0.99);
  const noise = mulberry32(hashStr("run:" + t.slug))() * 0.18;
  return base + noise;
}

let _runs: Map<string, TeamRun> | null = null;

function buildRuns(): Map<string, TeamRun> {
  const stageRound: Record<string, number> = {};

  // 1) Fase de grupos: 1.º y 2.º avanzan; los mejores 3.º completan los 32.
  const byGroup: Record<string, Seleccion[]> = {};
  for (const t of SELECCIONES) (byGroup[t.grupo] ||= []).push(t);

  const advancers: Seleccion[] = [];
  const thirds: Seleccion[] = [];
  for (const list of Object.values(byGroup)) {
    const ranked = [...list].sort((a, b) => powerOf(b) - powerOf(a));
    ranked.forEach((t, i) => {
      if (i < 2) advancers.push(t);
      else if (i === 2) thirds.push(t);
      else stageRound[t.slug] = 0; // eliminada en grupos
    });
  }
  // Mejores terceros hasta llegar a 32 clasificados.
  const slots = Math.max(0, 32 - advancers.length);
  const sortedThirds = [...thirds].sort((a, b) => powerOf(b) - powerOf(a));
  sortedThirds.forEach((t, i) => {
    if (i < slots) advancers.push(t);
    else stageRound[t.slug] = 0;
  });

  // 2) Eliminatorias: emparejamiento estable, gana el de mayor fuerza + sorteo.
  let alive = [...advancers].sort((a, b) => hashStr("seed:" + a.slug) - hashStr("seed:" + b.slug));
  let round = 1; // 1 = 16avos
  while (alive.length > 1) {
    const next: Seleccion[] = [];
    for (let i = 0; i + 1 < alive.length; i += 2) {
      const a = alive[i];
      const b = alive[i + 1];
      const roll = mulberry32(hashStr(`ko:${round}:${[a.slug, b.slug].sort().join(":")}`))();
      const pa = powerOf(a);
      const pb = powerOf(b);
      const winner = roll < pa / (pa + pb) ? a : b;
      const loser = winner === a ? b : a;
      stageRound[loser.slug] = round; // cae en esta ronda
      next.push(winner);
    }
    if (alive.length % 2 === 1) next.push(alive[alive.length - 1]); // bye (no debería ocurrir con 32)
    alive = next;
    round++;
  }
  if (alive.length === 1) stageRound[alive[0].slug] = 6; // campeón

  const runs = new Map<string, TeamRun>();
  for (const t of SELECCIONES) {
    const r = stageRound[t.slug] ?? 0;
    runs.set(t.slug, { slug: t.slug, stage: STAGE_BY_ROUND[r] ?? "grupos", stageRound: r });
  }
  return runs;
}

export function getTeamRuns(): Map<string, TeamRun> {
  if (!_runs) _runs = buildRuns();
  return _runs;
}

export function getTeamRun(slug: string): TeamRun | undefined {
  return getTeamRuns().get(slug);
}

/**
 * Factor de "longevidad" para valoración fantasy: una selección que avanza
 * disputa más partidos, así que sus jugadores valen algo más (0.9 grupos →
 * 1.18 campeón).
 */
export function longevityFactor(slug: string): number {
  const r = getTeamRun(slug)?.stageRound ?? 0;
  return 0.9 + r * 0.0467; // 0 → 0.90 … 6 → ~1.18
}
