// src/lib/match-center/types.ts
//
// Modelo de datos único del Match Center. Tanto el motor de simulación como el
// adaptador real de api-football producen estas estructuras, de modo que la UI
// consume SIEMPRE la misma forma sin importar la fuente.

export type Side = "home" | "away";

export type MatchEventType =
  | "kickoff"
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_miss"
  | "yellow"
  | "red"
  | "second_yellow"
  | "sub"
  | "var"
  | "corner"
  | "shot"
  | "shot_on"
  | "save"
  | "offside"
  | "injury"
  | "chance"
  | "half_time"
  | "full_time";

export interface MatchEvent {
  id: string;
  /** Segundos de juego desde el saque inicial (0..). */
  t: number;
  /** Minuto a mostrar (1..90+). */
  minute: number;
  /** Minuto añadido si aplica (45+extra, 90+extra). */
  extra?: number;
  type: MatchEventType;
  side: Side | "neutral";
  /** Jugador implicado (nombre real en vivo, o "#9" en simulación). */
  player?: string;
  /** Asistente (en goles). */
  assist?: string;
  /** Jugador que entra (en cambios). */
  playerIn?: string;
  /** Texto descriptivo corto: "Penalti", "Falta dura", etc. */
  detail?: string;
  /** Coordenadas normalizadas 0..1 del campo para animar el balón.
   *  x: 0 = línea de fondo izquierda, 1 = derecha. y: 0 = arriba, 1 = abajo. */
  x?: number;
  y?: number;
}

export interface LineupPlayer {
  num: number;
  pos: string; // GK | DF | MF | FW
  name?: string;
  /** Posición normalizada en MEDIO CAMPO PROPIO: x 0..0.5 (0 = portería), y 0..1. */
  x: number;
  y: number;
}

/** Jugador del banquillo (sin coordenadas: no se pinta en el campo). */
export interface BenchPlayer {
  num: number;
  pos: string; // GK | DF | MF | FW
  name?: string;
}

export interface TeamLineup {
  formation: string; // "4-3-3"
  starters: LineupPlayer[];
  /** Suplentes reales de api-football (si la API los publicó). */
  substitutes?: BenchPlayer[];
  /** Seleccionador (api-football lineups[].coach.name). */
  coach?: string;
}

/** Pares [home, away]. */
export type Pair = [number, number];

export interface LiveStats {
  possession: Pair; // %
  shots: Pair;
  shotsOn: Pair;
  passes: Pair;
  fouls: Pair;
  corners: Pair;
  saves: Pair;
  yellow: Pair;
  red: Pair;
  xg: Pair;
}

export interface MatchTeamMeta {
  name: string;
  flag: string; // código flagcdn (mx, gb-sct, ...)
  color: string;
  id: string; // ISO3 si se conoce
}

export interface MatchMeta {
  id: number;
  home: MatchTeamMeta;
  away: MatchTeamMeta;
  venue: string;
  city: string;
  date: string;
  time: string;
  phase: string; // "Fase de grupos", "Octavos", ...
  group: string;
}

export interface StatKeyframe {
  t: number; // segundos de juego
  stats: LiveStats;
}

/** Guion completo de un partido simulado: determinista a partir de la semilla. */
export interface MatchScript {
  mode: "sim";
  matchId: number;
  seed: number;
  /** Duración total en segundos incluyendo añadido (p.ej. 95*60). */
  durationSeconds: number;
  /** Velocidad de reproducción sugerida (1 = tiempo real, >1 = acelerado). */
  speed: number;
  events: MatchEvent[];
  /** eventId -> texto de locución. */
  narration: Record<string, string>;
  finalScore: Pair;
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
  statKeyframes: StatKeyframe[];
  meta: MatchMeta;
}

/** Estado puntual de un partido real (api-football). La UI lo refresca por polling. */
export interface LiveSnapshot {
  mode: "live";
  matchId: number;
  /** "NS" | "1H" | "HT" | "2H" | "ET" | "P" | "FT" | ... (status api-football). */
  status: string;
  /** Minuto transcurrido (api-football "elapsed"). */
  elapsed: number;
  /** ISO datetime del saque (api-football "fixture.date"), si se conoce. */
  kickoff?: string;
  /** Nombre del árbitro, si la API lo provee. */
  referee?: string;
  score: Pair;
  events: MatchEvent[];
  /** eventId -> texto de locución (rellenado por el narrador IA). */
  narration: Record<string, string>;
  stats: LiveStats;
  homeLineup: TeamLineup | null;
  awayLineup: TeamLineup | null;
  meta: MatchMeta;
  updatedAt: number;
}

export type MatchFeed = MatchScript | LiveSnapshot;

export const EMPTY_STATS: LiveStats = {
  possession: [50, 50],
  shots: [0, 0],
  shotsOn: [0, 0],
  passes: [0, 0],
  fouls: [0, 0],
  corners: [0, 0],
  saves: [0, 0],
  yellow: [0, 0],
  red: [0, 0],
  xg: [0, 0],
};
