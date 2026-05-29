// src/lib/fantasy/players.ts
//
// Pool de jugadores del Fantasy construido a partir de las convocatorias REALES
// del Mundial 2026 (src/data/fantasy-rosters.ts). Solo se incluyen las
// selecciones con lista oficial confirmada; las pendientes quedan fuera del pool
// hasta que publiquen su lista. Precios, puntos y forma son SIMULADOS de forma
// DETERMINISTA (misma semilla => mismos datos siempre) a partir del ranking FIFA
// de la selección. Calcula también el multiplicador "Modo Underdog"
// (Estelar/Bronce/Oro/Diamante) del próximo partido de cada selección.

import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { FANTASY_ROSTERS } from "@/data/fantasy-rosters";
import type { FantasyPlayer, FantasyPos, MatchTier, NextMatch } from "./types";

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
    const price = round1(
      clamp(
        4 + strength * 5.2 + POS_PREMIUM[pos] + topness * 1.6 + rating * 2.6 + (rng() - 0.4) * 1.2,
        3.8,
        14.5,
      ),
    );
    const totalPoints = Math.round(rating * 58 + rng() * 16);
    const goals = pos === "FWD" ? Math.round(rating * 5 + rng() * 2) : pos === "MID" ? Math.round(rating * 3 + rng()) : Math.round(rng() * (pos === "DEF" ? 1 : 0));
    const assists = Math.round(rating * (pos === "MID" ? 4 : pos === "FWD" ? 2 : 1) + rng());
    const cleanSheets = pos === "GK" || pos === "DEF" ? Math.round(rating * 2 + rng()) : 0;

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
      totalPoints,
      avgPoints: round1(totalPoints / 3),
      form: round1(clamp(rating * 8 + (rng() - 0.4) * 3, 1, 10)),
      ownership: round1(clamp((price / 15) * 38 + rating * 14 + (rng() - 0.5) * 12, 0.4, 88)),
      available: rng() > 0.05,
      real: true,
      stats: { goals, assists, minutes: 180 + Math.round(rng() * 90), cleanSheets },
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

// Selecciones con convocatoria real disponible (para mensajes informativos).
export const ROSTERED_SLUGS = new Set(Object.keys(FANTASY_ROSTERS));
export const ROSTERED_COUNT = ROSTERED_SLUGS.size;
