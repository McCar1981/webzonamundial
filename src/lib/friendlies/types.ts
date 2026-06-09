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
  referee?: string;
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
  // ID ESTABLE basado en el CONTENIDO del evento (minuto+extra+equipo+tipo+
  // jugador), no en su posición en la respuesta. Así, si api-football reordena o
  // intercala eventos entre polls, el id de un suceso ya visto no cambia y el
  // cron de push no lo vuelve a notificar. Sufijo `#n` solo si hay colisión exacta.
  id: string;
  minute: number;
  extra?: number;
  type: FriendlyEventType;
  side: "home" | "away" | "neutral";
  player?: string;
  /** id api-football del jugador, para la foto. */
  playerId?: number;
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
  substitutes: FriendlyLineupPlayer[];
  coach?: string | null;
}

/** Una fila de estadística comparada (posesión, tiros, faltas...). */
export interface FriendlyStat {
  label: string;
  home: number | string | null;
  away: number | string | null;
}

/** Snapshot completo de un amistoso para la vista de detalle. */
export interface FriendlySnapshot extends FriendlyFixture {
  events: FriendlyEvent[];
  homeLineup: FriendlyLineup | null;
  awayLineup: FriendlyLineup | null;
  stats: FriendlyStat[];
  updatedAt: number;
  /** true cuando la cobertura de eventos de api-football para este amistoso es
   *  PARCIAL: el marcador agregado tiene más goles de los que aparecen en la
   *  cronología. La UI lo usa para avisar de que faltan sucesos (limitación del
   *  proveedor de datos en la liga 10, no un fallo de la web). */
  eventsPartial?: boolean;
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

/** ¿El partido está en curso ahora mismo? Incluye el descanso (HT): el partido
 *  no ha terminado, solo está pausado, así que cuenta como "en vivo" para la
 *  lista, las etiquetas de estado y el resaltado. */
export function isLiveStatus(status: string): boolean {
  return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status);
}

/** ¿El partido ya terminó? */
export function isFinishedStatus(status: string): boolean {
  return ["FT", "AET", "PEN"].includes(status);
}
