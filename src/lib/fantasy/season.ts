// src/lib/fantasy/season.ts
//
// Puerta temporal del Fantasy. Antes del pitido inicial del Mundial los usuarios
// pueden PREPARAR su equipo (mercado, alineación, coach, ligas), pero el modo
// "En Vivo" —que puntuará con los partidos reales— permanece bloqueado hasta la
// inauguración (11 jun 2026). La fecha coincide con TOURNAMENT.startDate.

/** Pitido inicial del Mundial 2026 (inauguración). */
export const FANTASY_KICKOFF = new Date("2026-06-11T12:00:00-05:00");

/** true si el torneo ya arrancó (el modo En Vivo trabaja con partidos reales). */
export function isFantasyLive(now: Date = new Date()): boolean {
  return now.getTime() >= FANTASY_KICKOFF.getTime();
}

/** Milisegundos restantes hasta el pitido inicial (0 si ya empezó). */
export function msUntilKickoff(now: Date = new Date()): number {
  return Math.max(0, FANTASY_KICKOFF.getTime() - now.getTime());
}

/** Desglose días/horas/minutos/segundos hasta el pitido inicial. */
export function countdownToKickoff(now: Date = new Date()): { d: number; h: number; m: number; s: number } {
  const diff = msUntilKickoff(now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}
