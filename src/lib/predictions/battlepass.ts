// src/lib/predictions/battlepass.ts
//
// Lógica PURA del Battle Pass de temporada (mejora E). Sin I/O ni Supabase.
//
// Modelo:
//   - Temporada = ventana rodante de 30 días anclada al inicio del torneo.
//   - El usuario llena una pista de TIER_COUNT niveles con XP de TEMPORADA
//     (distinto del XP de por vida; arranca a 0 cada temporada).
//   - Cada nivel tiene recompensa en el tramo gratis y en el premium (Founders).
//   - Bonus de jornada: predecir TODOS los partidos de un día da XP+monedas y
//     empuja a completar la jornada sin romper que un partido difícil valga más.

import { BOOST_IDS, type BoostId } from "./gamification";

// ─── Temporada ────────────────────────────────────────────────────────────────
/** Ancla: inicio del Mundial 2026 (UTC). Las temporadas se cuentan desde aquí. */
export const SEASON_ANCHOR_MS = Date.UTC(2026, 5, 11, 0, 0, 0); // 2026-06-11
export const SEASON_LENGTH_DAYS = 30;
const SEASON_LENGTH_MS = SEASON_LENGTH_DAYS * 86_400_000;

export interface SeasonInfo {
  key: string;        // "S0", "S1", ...
  index: number;
  start: string;      // ISO
  end: string;        // ISO (exclusivo)
  day_of_season: number;   // 1..30
  days_left: number;       // días completos restantes (incl. el actual)
}

/** Índice de temporada para un instante (>= 0; antes del ancla, temporada 0). */
function seasonIndex(now: Date): number {
  const diff = now.getTime() - SEASON_ANCHOR_MS;
  return diff <= 0 ? 0 : Math.floor(diff / SEASON_LENGTH_MS);
}

export function seasonKey(now = new Date()): string {
  return `S${seasonIndex(now)}`;
}

export function seasonInfo(now = new Date()): SeasonInfo {
  const index = seasonIndex(now);
  const startMs = SEASON_ANCHOR_MS + index * SEASON_LENGTH_MS;
  const endMs = startMs + SEASON_LENGTH_MS;
  const elapsedMs = Math.max(0, now.getTime() - startMs);
  const dayOfSeason = Math.min(SEASON_LENGTH_DAYS, Math.floor(elapsedMs / 86_400_000) + 1);
  const daysLeft = Math.max(0, Math.ceil((endMs - now.getTime()) / 86_400_000));
  return {
    key: `S${index}`,
    index,
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    day_of_season: dayOfSeason,
    days_left: daysLeft,
  };
}

// ─── Pista de niveles ───────────────────────────────────────────────────────
export const TIER_COUNT = 25;
export type Track = "free" | "premium";

/** XP que cuesta SUBIR al nivel `tier` (1..TIER_COUNT). Curva suave creciente. */
export function tierCost(tier: number): number {
  return 80 + (Math.max(1, tier) - 1) * 8; // 80, 88, 96, ...
}

/** XP de temporada acumulado para DESBLOQUEAR el nivel `tier`. */
export function tierThreshold(tier: number): number {
  let sum = 0;
  for (let k = 1; k <= tier; k++) sum += tierCost(k);
  return sum;
}

/** Nivel actual (0..TIER_COUNT) según el XP de temporada acumulado. */
export function tierForXp(seasonXp: number): number {
  let tier = 0;
  for (let k = 1; k <= TIER_COUNT; k++) {
    if (seasonXp >= tierThreshold(k)) tier = k;
    else break;
  }
  return tier;
}

export interface TierReward {
  coins: number;
  boost: BoostId | null;
  /** Recompensa destacada (hito) para resaltarla en la UI. */
  highlight: boolean;
}

/**
 * Recompensa determinista de un nivel y tramo. El tramo premium paga más y
 * entrega boosts con más frecuencia; los hitos (cada 5 niveles) destacan.
 */
export function tierReward(tier: number, track: Track): TierReward {
  const milestone = tier % 5 === 0;
  if (track === "free") {
    const coins = 15 + tier * 3;
    // Boost gratis en los hitos grandes.
    const boost = tier === 10 ? "shield" : tier === 20 ? "streak_freeze" : null;
    return { coins, boost, highlight: milestone };
  }
  // Premium: más monedas y un boost cada 4 niveles (rotando el catálogo).
  const coins = 40 + tier * 6 + (milestone ? 60 : 0);
  const boost = tier % 4 === 0 ? BOOST_IDS[(tier / 4 - 1) % BOOST_IDS.length] : null;
  return { coins, boost, highlight: milestone };
}

// ─── Bonus de jornada ─────────────────────────────────────────────────────────
/** Recompensa por predecir TODOS los partidos de un día (escala con el tamaño). */
export function jornadaBonus(matchCount: number): { xp: number; coins: number } {
  const n = Math.max(1, matchCount);
  return { xp: 30 + n * 15, coins: 20 + n * 10 };
}

// ─── Estado agregado (para la UI) ──────────────────────────────────────────────
export interface TierState {
  tier: number;
  threshold: number;
  unlocked: boolean;
  free: TierReward & { claimed: boolean };
  premium: TierReward & { claimed: boolean };
}

export interface BattlePassView {
  season: SeasonInfo;
  premium: boolean;
  season_xp: number;
  tier: number;
  tier_count: number;
  xp_into_tier: number;
  xp_for_tier: number;
  progress: number;          // 0..1 hacia el siguiente nivel
  tiers: TierState[];
}

/** Construye la vista de la pista combinando XP, premium y reclamos. */
export function buildBattlePassView(
  season: SeasonInfo,
  seasonXp: number,
  premium: boolean,
  claimed: Set<string>,       // claves "tier:track"
): BattlePassView {
  const tier = tierForXp(seasonXp);
  const base = tier > 0 ? tierThreshold(tier) : 0;
  const nextThreshold = tier < TIER_COUNT ? tierThreshold(tier + 1) : base;
  const xpForTier = Math.max(1, nextThreshold - base);
  const xpIntoTier = Math.min(xpForTier, seasonXp - base);

  const tiers: TierState[] = [];
  for (let k = 1; k <= TIER_COUNT; k++) {
    const free = tierReward(k, "free");
    const prem = tierReward(k, "premium");
    tiers.push({
      tier: k,
      threshold: tierThreshold(k),
      unlocked: tier >= k,
      free: { ...free, claimed: claimed.has(`${k}:free`) },
      premium: { ...prem, claimed: claimed.has(`${k}:premium`) },
    });
  }

  return {
    season,
    premium,
    season_xp: seasonXp,
    tier,
    tier_count: TIER_COUNT,
    xp_into_tier: tier < TIER_COUNT ? xpIntoTier : xpForTier,
    xp_for_tier: xpForTier,
    progress: tier < TIER_COUNT ? Math.min(1, xpIntoTier / xpForTier) : 1,
    tiers,
  };
}
