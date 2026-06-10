// src/lib/calendario/live.ts
//
// Tipos y constantes compartidos entre /api/calendario/live (servidor) y la
// UI del calendario (cliente) para pintar marcador y estado de cada partido.
// La fuente es el snapshot durable del Match Center (mc:last:) que el cron
// match-center-poll mantiene caliente; aquí solo se proyecta a un DTO mínimo.

/** Estado en vivo reducido de un partido, lo justo para la parrilla. */
export interface LiveLite {
  /** Status api-football: NS, 1H, HT, 2H, ET, BT, P, FT, AET, PEN… */
  s: string;
  /** Marcador [local, visitante]. */
  sc: [number, number];
  /** Minuto transcurrido. */
  el: number;
}

/** matchId → estado reducido. */
export type LiveMap = Record<number, LiveLite>;

export const IN_PLAY_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
export const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

/** true si el snapshot describe un partido en juego. */
export const isLive = (l: LiveLite | undefined): boolean => !!l && IN_PLAY_STATUSES.has(l.s);

/** true si el snapshot describe un partido terminado. */
export const isFinished = (l: LiveLite | undefined): boolean => !!l && FINISHED_STATUSES.has(l.s);
