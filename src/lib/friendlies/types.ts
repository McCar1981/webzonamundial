// src/lib/friendlies/types.ts
//
// Modelo de datos de los AMISTOSOS de selecciones (api-football, liga 10
// "Friendlies"). Independiente del Match Center del Mundial: aquí los partidos
// llegan en vivo desde la API y se identifican por su fixtureId real, no por el
// id interno 1..104.

export interface FriendlyTeam {
  id: number;
  name: string;
  logo: string; // URL del escudo/bandera que sirve api-football
  winner?: boolean | null;
}

/** Marcador como par [local, visitante]. null = aún sin dato. */
export type Score = [number | null, number | null];

export interface FriendlyFixture {
  fixtureId: number;
  /** ISO datetime del saque (UTC). */
  date: string;
  /** Estado api-football: NS, 1H, HT, 2H, ET, P, FT, AET, PEN, PST, CANC... */
  status: string;
  /** Minuto transcurrido (api-football "elapsed"), null si no aplica. */
  elapsed: number | null;
  league: { id: number; name: string; season: number };
  home: FriendlyTeam;
  away: FriendlyTeam;
  goals: Score;
  venue?: string;
  city?: string;
}

export type FriendlyEventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_miss"
  | "yellow"
  | "red"
  | "second_yellow"
  | "sub"
  | "var"
  | "other";

export interface FriendlyEvent {
  id: string; // estable: `${fixtureId}-${idx}`
  minute: number;
  extra?: number;
  type: FriendlyEventType;
  side: "home" | "away" | "neutral";
  player?: string;
  assist?: string;
  playerIn?: string;
  detail?: string;
}

export interface FriendlyLineupPlayer {
  num: number | null;
  pos: string | null;
  name: string | null;
}

export interface FriendlyLineup {
  formation: string | null;
  starters: FriendlyLineupPlayer[];
  coach?: string | null;
}

/** Snapshot completo de un amistoso para la vista de detalle. */
export interface FriendlySnapshot extends FriendlyFixture {
  events: FriendlyEvent[];
  homeLineup: FriendlyLineup | null;
  awayLineup: FriendlyLineup | null;
  updatedAt: number;
}

/** Estado persistido por fixture para detectar cambios entre polls del cron. */
export interface FriendlyState {
  status: string;
  goals: Score;
  seenEventIds: string[];
  lineupsSent: boolean;
  startSent: boolean;
  htSent: boolean;
  ftSent: boolean;
}

/** ¿El partido está en juego ahora mismo? */
export function isLiveStatus(status: string): boolean {
  return ["1H", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status);
}

/** ¿El partido ya terminó? */
export function isFinishedStatus(status: string): boolean {
  return ["FT", "AET", "PEN"].includes(status);
}
