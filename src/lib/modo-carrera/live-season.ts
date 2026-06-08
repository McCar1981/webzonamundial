// src/lib/modo-carrera/live-season.ts
//
// TEMPORADA EN VIVO (feature estrella del Pase DT). Construye el calendario del
// torneo a partir de los partidos REALES de la selección del DT (matches.ts) en
// lugar de un sorteo ficticio: los 3 partidos de grupo son los reales (rival y
// hora de saque incluidos) y la eliminatoria se proyecta con rivales de
// dificultad creciente, cada ronda bloqueada hasta la fecha real de esa fase.
//
// El gancho emocional: tu carrera avanza al RITMO del Mundial real. No puedes
// disputar tu partido hasta que tu selección salta al campo en la vida real.
// Lógica pura (sin React ni servidor); la verificación premium es server-side.

import type { CareerState, SeasonState, SeasonMatch, TournamentStage } from "./types";
import { buildBoardObjective } from "./board";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { MATCHES } from "@/data/matches";
import { etToDate } from "@/lib/bracket/match-time";

const now = () => new Date().toISOString();

/** Mapa fase de carrera → cadena de fase real en matches.ts (para el gate horario). */
const KO_REAL_PHASE: Record<Exclude<TournamentStage, "amistoso" | "clasificacion" | "grupos" | "campeon" | "eliminado">, string> = {
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semifinal: "Semifinal",
  final: "FINAL",
};

function byFlag(code: string): Seleccion | undefined {
  return SELECCIONES.find((s) => s.flagCode === code);
}

/** Saque más temprano (ISO) de una fase real, o null si no hay datos. */
function phaseKickoff(realPhase: string): string | null {
  let earliest: number | null = null;
  for (const m of MATCHES) {
    if (m.p !== realPhase) continue;
    const d = etToDate(m.d, m.t);
    if (!d) continue;
    const t = d.getTime();
    if (earliest === null || t < earliest) earliest = t;
  }
  return earliest === null ? null : new Date(earliest).toISOString();
}

/**
 * ¿La selección tiene partidos reales de grupo en el calendario? Determina si se
 * puede ofrecer la Temporada en Vivo.
 */
export function hasLiveFixtures(nationSlug: string | null | undefined): boolean {
  const nat = SELECCIONES.find((s) => s.slug === nationSlug);
  if (!nat) return false;
  return MATCHES.some((m) => m.p === "Fase de grupos" && (m.hf === nat.flagCode || m.af === nat.flagCode));
}

/**
 * Construye la temporada en vivo de la selección del DT. Devuelve null si no hay
 * partidos reales (p. ej. una plaza de playoff sin definir).
 */
export function buildLiveSeason(c: CareerState): SeasonState | null {
  const nat = SELECCIONES.find((s) => s.slug === c.identity.nationSlug);
  if (!nat) return null;
  const season = c.progression.season;

  // ── Partidos de grupo REALES (rival + hora de saque) ──
  const real = MATCHES.filter((m) => m.p === "Fase de grupos" && (m.hf === nat.flagCode || m.af === nat.flagCode))
    .map((m) => {
      const kickoff = etToDate(m.d, m.t);
      const isHome = m.hf === nat.flagCode;
      const oppFlag = isHome ? m.af : m.hf;
      const opp = byFlag(oppFlag);
      return {
        oppSlug: opp?.slug ?? oppFlag,
        home: isHome,
        kickoffISO: kickoff ? kickoff.toISOString() : null,
        matchday: m.j,
        sortKey: kickoff ? kickoff.getTime() : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  if (real.length === 0) return null;

  const used = new Set<string>([nat.slug, ...real.map((r) => r.oppSlug)]);
  const fixtures: SeasonMatch[] = real.map((r, i) => ({
    id: `live-s${season}-grupos-${i}`,
    stage: "grupos",
    label: `Fase de grupos · J${r.matchday}`,
    opponentSlug: r.oppSlug,
    home: r.home,
    kickoffISO: r.kickoffISO,
    played: false,
    gf: null,
    ga: null,
    outcome: null,
  }));

  // ── Eliminatoria proyectada (rivales del top del ranking, dificultad creciente) ──
  const pool = [...SELECCIONES].filter((s) => s.slug !== nat.slug).sort((a, b) => (a.rankingFIFA ?? 99) - (b.rankingFIFA ?? 99));
  const pickFrom = (slice: Seleccion[]): string => {
    const cand = slice.filter((s) => !used.has(s.slug));
    const arr = cand.length ? cand : slice;
    const r = arr[Math.floor(Math.random() * arr.length)];
    used.add(r.slug);
    return r.slug;
  };

  const ko: { stage: Exclude<TournamentStage, "grupos" | "campeon" | "eliminado">; label: string; pool: Seleccion[]; home: boolean }[] = [
    { stage: "octavos", label: "Octavos de final", pool: pool.slice(0, 40), home: true },
    { stage: "cuartos", label: "Cuartos de final", pool: pool.slice(0, 24), home: false },
    { stage: "semifinal", label: "Semifinal", pool: pool.slice(0, 12), home: true },
    { stage: "final", label: "Final", pool: pool.slice(0, 6), home: false },
  ];

  for (const k of ko) {
    fixtures.push({
      id: `live-s${season}-${k.stage}`,
      stage: k.stage,
      label: k.label,
      opponentSlug: pickFrom(k.pool),
      home: k.home,
      kickoffISO: phaseKickoff(KO_REAL_PHASE[k.stage]),
      played: false,
      gf: null,
      ga: null,
      outcome: null,
    });
  }

  return { season, fixtures, cursor: 0, stage: "grupos", finished: false, live: true };
}

/**
 * Arranca una Temporada en Vivo: fija el objetivo adaptativo de la federación y
 * monta el calendario real. Devuelve null si la selección no tiene partidos.
 */
export function beginLiveSeason(c: CareerState): CareerState | null {
  const live = buildLiveSeason(c);
  if (!live) return null;
  return {
    ...c,
    board: { ...c.board, objective: buildBoardObjective(c), lastVerdict: "pendiente" },
    // Misiones de torneo (racha, etc.) son por Mundial: se reinician al arrancar.
    missions: c.missions.filter((m) => m.kind !== "torneo"),
    season: live,
    updatedAt: now(),
  };
}

/** Milisegundos hasta que el partido se desbloquea (0 si ya está disponible). */
export function liveLockMs(match: SeasonMatch, ref: number = Date.now()): number {
  if (!match.kickoffISO) return 0;
  const k = Date.parse(match.kickoffISO);
  if (!Number.isFinite(k)) return 0;
  return Math.max(0, k - ref);
}
