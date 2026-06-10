// src/lib/fantasy/players.ts
//
// Pool de jugadores del Fantasy construido a partir de las convocatorias REALES
// del Mundial 2026 (src/data/fantasy-rosters.ts). Solo se incluyen las
// selecciones con lista oficial confirmada; las pendientes quedan fuera del pool
// hasta que publiquen su lista.
//
// Las ESTADÍSTICAS ACUMULADAS (puntos, goles, asistencias, minutos, porterías)
// arrancan EN CERO: el torneo no ha empezado y solo se rellenan con datos REALES
// de api-football vía `applyRealStats` (el cliente las baja de
// /api/fantasy/player-stats). Lo único estimado a priori es precio (Transfermarkt
// cuando existe), forma y probabilidad de titularidad, generados de forma
// DETERMINISTA (misma semilla => mismos datos para todos). Calcula también el
// multiplicador "Modo Underdog" del próximo partido de cada selección.

import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { FANTASY_ROSTERS } from "@/data/fantasy-rosters";
import { getMarketValue, priceFromMarketValue } from "@/data/fantasy-market-values";
import type { FantasyPlayer, FantasyPos, MatchTier, NextMatch, PlayerStatus } from "./types";

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

function teamColor(slug: string): string {
  const h = hashStr(slug) % 360;
  return `hsl(${h} 62% 52%)`;
}

/** 0.30 (modesta) .. 0.99 (potencia) según ranking FIFA. */
function strengthFromRank(rank: number | undefined): number {
  const r = rank ?? 90;
  return Math.max(0.3, Math.min(0.99, 1 - (r - 1) / 150));
}

const POS_ORDER: FantasyPos[] = ["GK", "DEF", "MID", "FWD"];
const POS_PREMIUM: Record<FantasyPos, number> = { GK: -0.4, DEF: 0, MID: 0.8, FWD: 1.6 };
// Cupos del once probable (base 4-3-3): los primeros de cada posición son titulares.
const XI_QUOTA: Record<FantasyPos, number> = { GK: 1, DEF: 4, MID: 3, FWD: 3 };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---- Multiplicador "Modo Underdog" ----
function tierFromGap(gap: number): MatchTier {
  if (gap >= 75) return { multiplier: 2.0, label: "Diamante", emoji: "💎", color: "#67e8f9" };
  if (gap >= 40) return { multiplier: 1.5, label: "Oro", emoji: "🟡", color: "#fbbf24" };
  if (gap >= 15) return { multiplier: 1.25, label: "Bronce", emoji: "🟠", color: "#fb923c" };
  return { multiplier: 1.0, label: "Estelar", emoji: "🟢", color: "#4ade80" };
}

/** Empareja selecciones dentro de su grupo para fijar el "próximo partido". */
function buildNextMatches(): Record<string, NextMatch> {
  const byGroup: Record<string, Seleccion[]> = {};
  for (const s of SELECCIONES) (byGroup[s.grupo] ||= []).push(s);
  const out: Record<string, NextMatch> = {};
  for (const list of Object.values(byGroup)) {
    for (let i = 0; i + 1 < list.length; i += 2) {
      const a = list[i];
      const b = list[i + 1];
      const gap = Math.abs((a.rankingFIFA ?? 90) - (b.rankingFIFA ?? 90));
      const tier = tierFromGap(gap);
      const diff = (me: Seleccion, op: Seleccion): NextMatch["difficulty"] => {
        const d = (op.rankingFIFA ?? 90) - (me.rankingFIFA ?? 90);
        return d < -12 ? "hard" : d > 12 ? "easy" : "medium";
      };
      out[a.slug] = { opponentCode: b.flagCode, opponentName: b.nombre, tier, difficulty: diff(a, b) };
      out[b.slug] = { opponentCode: a.flagCode, opponentName: a.nombre, tier, difficulty: diff(b, a) };
    }
  }
  return out;
}

function buildTeamPlayers(team: Seleccion, next: NextMatch): FantasyPlayer[] {
  const roster = FANTASY_ROSTERS[team.slug];
  if (!roster || roster.length === 0) return [];

  const rng = mulberry32(hashStr(team.slug));
  const strength = strengthFromRank(team.rankingFIFA);
  const color = teamColor(team.slug);

  // Contadores por posición para calcular el "topness" (los primeros listados de
  // cada posición tienden a ser titulares => ligero plus de valoración/precio).
  const posCount: Record<FantasyPos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const rp of roster) posCount[rp.pos]++;
  const posSeen: Record<FantasyPos, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  // Orden estable: por posición (GK, DEF, MID, FWD) respetando el orden de lista.
  const ordered = [...roster].sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));

  return ordered.map((rp, idx) => {
    const pos = rp.pos;
    const within = posSeen[pos]++;
    const topness = posCount[pos] > 1 ? 1 - within / posCount[pos] : 1;

    const rating = clamp(strength * 0.6 + topness * 0.18 + rng() * 0.22, 0.05, 1);
    // Precio fantasy. Si hay VALOR DE MERCADO real (Transfermarkt) se deriva de
    // él (curva logarítmica → 2.5–16.0M). Si no, precio SIMULADO determinista:
    // base baja + más peso al jugador (rating/topness) que a la fuerza del equipo
    // => existen enablers baratos (~4M) y las estrellas destacan (~15M). En ambos
    // casos un 11 válido entra en los €100M, pero más ajustado que antes.
    const marketValue = getMarketValue(team.slug, rp.name);
    const simPrice = round1(
      clamp(
        3.0 + strength * 3.6 + POS_PREMIUM[pos] + topness * 1.8 + rating * 3.6 + (rng() - 0.45) * 1.1,
        2.5,
        16.0,
      ),
    );
    const price = marketValue != null ? priceFromMarketValue(marketValue) : simPrice;

    // Estado físico/disciplinario (simulado, determinista).
    const sRoll = rng();
    const status: PlayerStatus = sRoll < 0.035 ? "lesionado" : sRoll < 0.06 ? "sancionado" : sRoll < 0.14 ? "duda" : "apto";
    const out = status === "lesionado" || status === "sancionado";
    const available = !out;

    // Probabilidad de titularidad y once probable (cupos por posición).
    const quota = XI_QUOTA[pos];
    const isXI = within < quota && available;
    let startProb: number;
    if (out) {
      startProb = 0;
    } else if (within < quota) {
      // Titular: del más fijo (~97%) al menos fijo del once (~58%).
      startProb = Math.round(clamp(72 + ((quota - 1 - within) / quota) * 22 + (rng() - 0.5) * 6, 58, 97));
    } else {
      const depth = within - quota; // 0,1,2…
      startProb = Math.round(clamp(52 - depth * 13 + (rng() - 0.5) * 8, 4, 58));
    }
    if (status === "duda") startProb = Math.round(startProb * 0.7);

    const form = round1(clamp(rating * 8 + (rng() - 0.4) * 3, 1, 10));
    const ownership = round1(clamp((price / 16) * 38 + rating * 14 + (rng() - 0.5) * 12, 0.4, 88));

    return {
      id: `${team.slug}-p${idx}`,
      name: rp.name,
      club: rp.club,
      teamSlug: team.slug,
      teamName: team.nombre,
      flag: team.flagCode,
      color,
      pos,
      price,
      marketValue,
      // El precio NO se mueve (mercado estático en el torneo): sin flechas falsas.
      priceTrend: "flat",
      priceDelta: 0,
      // Acumulados REALES del torneo: a cero hasta que applyRealStats los rellene.
      totalPoints: 0,
      avgPoints: 0,
      form,
      ownership,
      available,
      startProb,
      xiProbable: isXI,
      status,
      real: true,
      stats: { goals: 0, assists: 0, minutes: 0, cleanSheets: 0 },
      next,
    } satisfies FantasyPlayer;
  });
}

let _pool: FantasyPlayer[] | null = null;
let _byId: Map<string, FantasyPlayer> | null = null;

export function getPlayerPool(): FantasyPlayer[] {
  if (_pool) return _pool;
  const next = buildNextMatches();
  const all: FantasyPlayer[] = [];
  for (const team of SELECCIONES) {
    // Solo selecciones con convocatoria real confirmada entran al pool.
    if (!FANTASY_ROSTERS[team.slug]) continue;
    const nm = next[team.slug] ?? {
      opponentCode: "un",
      opponentName: "Por definir",
      tier: tierFromGap(0),
      difficulty: "medium" as const,
    };
    all.push(...buildTeamPlayers(team, nm));
  }
  _pool = all;
  _byId = new Map(all.map((p) => [p.id, p]));
  return all;
}

export function getPlayerById(id: string): FantasyPlayer | undefined {
  if (!_byId) getPlayerPool();
  return _byId!.get(id);
}

export function getPlayersByIds(ids: (string | null)[]): (FantasyPlayer | null)[] {
  return ids.map((id) => (id ? getPlayerById(id) ?? null : null));
}

// ── Estadísticas REALES del torneo (api-football) ────────────────────────────

/** Acumulado real de torneo de un jugador (lo agrega el servidor por partido). */
export interface RealPlayerAgg {
  pts: number; // puntos fantasy (base × multiplicador del partido)
  played: number; // partidos disputados
  goals: number;
  assists: number;
  minutes: number;
  cleanSheets: number;
}

/**
 * Vuelca el acumulado REAL sobre el pool (que arranca a 0). Muta los objetos del
 * pool en sitio, así TODAS las vistas (Mercado, ficha, equipo, coach) ven los
 * datos reales sin re-plumbing. Devuelve cuántos jugadores recibieron datos.
 */
export function applyRealStats(stats: Record<string, RealPlayerAgg>): number {
  const pool = getPlayerPool();
  let applied = 0;
  for (const p of pool) {
    const r = stats[p.id];
    if (!r) continue;
    p.totalPoints = r.pts;
    p.avgPoints = r.played > 0 ? round1(r.pts / r.played) : 0;
    p.stats = { goals: r.goals, assists: r.assists, minutes: r.minutes, cleanSheets: r.cleanSheets };
    applied++;
  }
  return applied;
}

// Selecciones con convocatoria real disponible (para mensajes informativos).
export const ROSTERED_SLUGS = new Set(Object.keys(FANTASY_ROSTERS));
export const ROSTERED_COUNT = ROSTERED_SLUGS.size;
