// src/lib/economy/earn.ts
//
// CATÁLOGO ÚNICO de la economía de ZonaMundial: define CUÁNTAS Fútcoins y cuánto
// XP otorga cada acción de cada módulo. Es el "documento de diseño" de la economía
// hecho código: si quieres reequilibrar la app, se toca aquí y NADA más.
//
// Reglas de diseño:
//  · Las Fútcoins son una sola moneda global (viven en profiles.coins).
//  · El XP es progresión global (profiles.xp) y alimenta el Battle Pass.
//  · Acertar/rendir paga más que participar, pero participar nunca paga 0.
//  · Los módulos cuya puntuación es CLIENTE-AUTORITATIVA (fantasy, modo carrera)
//    llevan TOPES para acotar el abuso; los servidor-autoritativos (predicciones,
//    micro, trivia con sesión validada) pueden escalar con el rendimiento real.
//
// La capa de persistencia es wallet.ts (grantCoins). Aquí solo hay números puros.

import { coinsForResolved, xpForResolved } from "@/lib/predictions/gamification";

export interface Reward {
  coins: number;
  xp: number;
}

// ─── Trivia ──────────────────────────────────────────────────────────────────
// Una sesión de trivia equivale a una "resolución": cuenta como acierto si el
// jugador acertó al menos la mitad de las preguntas. Reutiliza el motor base de
// predicciones para que la tasa sea coherente entre ambos juegos. (El abono se
// limita a una vez por modo y día en el propio /finish, así que puede escalar.)
export function triviaSessionReward(points: number, correct: number, answered: number): Reward {
  const success = answered > 0 && correct / answered >= 0.5;
  return {
    coins: coinsForResolved(points, success),
    xp: xpForResolved(points, success),
  };
}

// ─── Fantasy ───────────────────────────────────────────────────────────────────
// Recompensa por CONFIRMAR una jornada. La puntuación la calcula el cliente, así
// que va ACOTADA: una base por participar + un bonus topado por rendimiento. Se
// paga una sola vez por jornada (fantasy_coin_claims), y las jornadas son finitas.
export const FANTASY_GAMEWEEK_BASE_COINS = 20;
export function fantasyGameweekReward(points: number): Reward {
  const p = Math.max(0, points);
  return {
    coins: FANTASY_GAMEWEEK_BASE_COINS + Math.min(40, Math.round(p * 0.2)),
    xp: 15 + Math.min(60, Math.round(p * 0.4)),
  };
}

// ─── Modo Carrera ──────────────────────────────────────────────────────────────
// Recompensa por RECLAMAR una misión. El importe se deriva SIEMPRE de la plantilla
// del servidor (rewardXp/rewardReputation), nunca de números enviados por el
// cliente. Se paga una sola vez por misión (modo_carrera_mission_claims).
export function careerMissionReward(rewardXp: number, rewardReputation: number): Reward {
  const xp = Math.max(0, rewardXp);
  const rep = Math.max(0, rewardReputation);
  return {
    coins: Math.round(xp * 0.4 + rep),
    xp: Math.round(xp * 0.5),
  };
}
