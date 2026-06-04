// src/lib/predictions/match-data.ts
//
// Puente entre el calendario real (src/data/matches.ts + selecciones) y las
// Predicciones: resuelve metadatos del partido, el multiplicador "Modo Underdog",
// los tiempos de cierre, y genera de forma DETERMINISTA los duelos y las líneas
// Over/Under "por IA" (sin llamadas externas, reproducibles).

import { MATCHES, type Match } from "@/data/matches";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { etToDate } from "@/lib/bracket/match-time";
import { getPlayerPool } from "@/lib/fantasy/players";
import type { FantasyPlayer } from "@/lib/fantasy/types";
import {
  CLOSE_MIN_FREE,
  CLOSE_MIN_PREMIUM,
  type Duel,
  type OverUnderLine,
} from "./types";

// ─── RNG determinista ────────────────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Lookup de partido / selección ───────────────────────────────────────────
const byFlag = new Map<string, Seleccion>(SELECCIONES.map((s) => [s.flagCode, s]));

export interface MatchMeta {
  match_id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_slug: string | null;
  away_slug: string | null;
  phase: string;
  group: string;
  venue: string;
  city: string;
  kickoff_at: string | null;   // ISO UTC
}

export function getMatch(matchId: string): Match | null {
  const id = parseInt(matchId, 10);
  if (Number.isNaN(id)) return null;
  return MATCHES.find((m) => m.i === id) ?? null;
}

export function getMatchMeta(matchId: string): MatchMeta | null {
  const m = getMatch(matchId);
  if (!m) return null;
  const kickoff = etToDate(m.d, m.t);
  return {
    match_id: String(m.i),
    home_team: m.h,
    away_team: m.a,
    home_flag: m.hf,
    away_flag: m.af,
    home_slug: byFlag.get(m.hf)?.slug ?? null,
    away_slug: byFlag.get(m.af)?.slug ?? null,
    phase: m.p,
    group: m.g,
    venue: m.vn,
    city: m.vc,
    kickoff_at: kickoff ? kickoff.toISOString() : null,
  };
}

// ─── Jornadas por día (para el bonus de jornada del Battle Pass) ─────────────
// Una "jornada" en el bucle de engagement = todos los partidos de fase de grupos
// que se juegan un mismo día. Predecirlos todos otorga el bonus de jornada.
export function matchesOnDate(dateKey: string): string[] {
  return MATCHES.filter((m) => m.p === "Fase de grupos" && m.d === dateKey).map((m) => String(m.i));
}

/** Fechas (YYYY-MM-DD) con partidos de fase de grupos, en orden de calendario. */
export function matchDays(): string[] {
  const set = new Set<string>();
  for (const m of MATCHES) if (m.p === "Fase de grupos") set.add(m.d);
  return [...set].sort();
}

// ─── Multiplicador "Modo Underdog" del partido ───────────────────────────────
// Mismo criterio que el Fantasy: a mayor diferencia de ranking FIFA, mayor
// multiplicador (el partido "desigual" es más difícil de predecir → vale más).
export function matchMultiplier(matchId: string): { multiplier: number; label: string; emoji: string } {
  const m = getMatch(matchId);
  if (!m) return { multiplier: 1, label: "Estelar", emoji: "🟢" };
  const a = byFlag.get(m.hf)?.rankingFIFA ?? 90;
  const b = byFlag.get(m.af)?.rankingFIFA ?? 90;
  const gap = Math.abs(a - b);
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante", emoji: "💎" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro", emoji: "🟡" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce", emoji: "🟠" };
  return { multiplier: 1.0, label: "Estelar", emoji: "🟢" };
}

// ─── Tiempos de cierre ───────────────────────────────────────────────────────
export function predictionsCloseAt(matchId: string, premium: boolean): Date | null {
  const meta = getMatchMeta(matchId);
  if (!meta?.kickoff_at) return null;
  const kickoff = new Date(meta.kickoff_at);
  const mins = premium ? CLOSE_MIN_PREMIUM : CLOSE_MIN_FREE;
  return new Date(kickoff.getTime() - mins * 60_000);
}

// ─── Jugadores del partido ───────────────────────────────────────────────────
function playersOfSlug(slug: string | null): FantasyPlayer[] {
  if (!slug) return [];
  return getPlayerPool().filter((p) => p.teamSlug === slug);
}

/** Jugadores candidatos a primer goleador (atacantes/medios destacados). */
export function scorerCandidates(matchId: string): { id: string; name: string; team: string; pos: string }[] {
  const meta = getMatchMeta(matchId);
  if (!meta) return [];
  // Cualquier jugador de campo puede marcar el primer gol: incluimos todos
  // menos los porteros, ordenados por forma.
  const pick = (slug: string | null) =>
    playersOfSlug(slug)
      .filter((p) => p.pos !== "GK")
      .sort((a, b) => b.form - a.form)
      .map((p) => ({ id: p.id, name: p.name, team: p.teamName, pos: p.pos }));
  return [...pick(meta.home_slug), ...pick(meta.away_slug)];
}

// ─── Duelos generados (deterministas) ────────────────────────────────────────
export function generateDuels(matchId: string): Duel[] {
  const meta = getMatchMeta(matchId);
  if (!meta) return [];
  const home = playersOfSlug(meta.home_slug);
  const away = playersOfSlug(meta.away_slug);
  if (!home.length || !away.length) return [];

  const top = (arr: FantasyPlayer[], pos: FantasyPlayer["pos"]) =>
    arr.filter((p) => p.pos === pos).sort((a, b) => b.form - a.form)[0];

  const pairs: [FantasyPlayer | undefined, FantasyPlayer | undefined, string, string][] = [
    [top(home, "FWD"), top(away, "DEF"), "Delantero local vs central rival: pólvora contra muro", "match_rating"],
    [top(home, "MID"), top(away, "MID"), "Duelo en el centro del campo: quién manda el partido", "match_rating"],
    [top(away, "FWD"), top(home, "DEF"), "Delantero visitante vs zaga local", "match_rating"],
  ];

  const toDuelPlayer = (p: FantasyPlayer) => ({
    id: p.id, name: p.name, team: p.teamName, position: p.pos,
    stats: {
      goals: p.stats.goals, assists: p.stats.assists,
      form: Math.round(p.form * 10) / 10, avg_points: p.avgPoints,
    },
  });

  return pairs
    .filter(([a, b]) => a && b)
    .map(([a, b, context, metric]) => ({
      duel_id: `${a!.id}__${b!.id}`,
      player_a: toDuelPlayer(a!),
      player_b: toDuelPlayer(b!),
      context,
      metric,
    }));
}

// ─── Líneas Over/Under (deterministas, "ajustadas por IA") ───────────────────
export function generateOverUnderLines(matchId: string): OverUnderLine[] {
  const rng = mulberry32(hashStr(`ou:${matchId}`));
  const jitter = () => (rng() < 0.5 ? 0 : 1); // pequeño ajuste de línea por partido
  return [
    { category: "goals", easy: { line: 1.5, points: 8 }, medium: { line: 2.5, points: 12 }, hard: { line: 3.5 + jitter(), points: 20 } },
    { category: "corners", easy: { line: 7.5, points: 8 }, medium: { line: 9.5, points: 12 }, hard: { line: 11.5 + jitter(), points: 20 } },
    { category: "cards", easy: { line: 2.5, points: 8 }, medium: { line: 3.5, points: 12 }, hard: { line: 5.5, points: 20 } },
    { category: "shots_on_target", easy: { line: 4.5, points: 8 }, medium: { line: 6.5, points: 12 }, hard: { line: 8.5 + jitter(), points: 20 } },
  ];
}
