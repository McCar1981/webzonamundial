// src/lib/trivia/types.ts
//
// Modelo de datos de la Trivia (Fase 1 web). Sin tiempo real, sin WebSocket.
// Las preguntas se generan a diario con Claude (cron) y se guardan en KV,
// igual que el pipeline de noticias.

export type TriviaCategory =
  | "historia"
  | "selecciones"
  | "sedes"
  | "datos"
  | "reglas"
  | "actualidad";

export type TriviaDifficulty = "facil" | "media" | "dificil" | "experta";

export type TriviaMode = "diaria" | "relampago" | "muerte-subita";

export interface TriviaQuestion {
  id: string;
  question: string;
  /** Exactamente 4 opciones. */
  options: string[];
  /** Índice 0-3 de la opción correcta. */
  correctIndex: number;
  category: TriviaCategory;
  difficulty: TriviaDifficulty;
  /** Explicación breve que se muestra tras responder (didáctico + retención). */
  explanation?: string;
}

/** Conjunto de preguntas generado para un día concreto (YYYY-MM-DD). */
export interface DailyTriviaSet {
  date: string;
  generatedAt: string;
  questions: TriviaQuestion[];
}

/** Puntos base por dificultad (spec: facil 5, media 10, dificil 15, experta 25). */
export const BASE_POINTS: Record<TriviaDifficulty, number> = {
  facil: 5,
  media: 10,
  dificil: 15,
  experta: 25,
};

/** Multiplicador de racha acumulada dentro de una sesión. */
export function streakMultiplier(streak: number): number {
  if (streak >= 20) return 3.0;
  if (streak >= 15) return 2.5;
  if (streak >= 10) return 2.0;
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

/** Multiplicador por rapidez (Modo Relámpago). ventana de 9s por pregunta. */
export function speedMultiplier(responseMs: number): number {
  if (responseMs <= 3000) return 2.0;
  if (responseMs <= 6000) return 1.5;
  return 1.0;
}

/** Bonus por horario (sobre el total de la sesión). */
export type DailyBonus = "early_bird" | "night_owl" | "perfect_day" | null;

export function timeBonusMultiplier(date: Date): { mult: number; bonus: DailyBonus } {
  const h = date.getHours();
  if (h < 9) return { mult: 1.5, bonus: "early_bird" };
  if (h >= 23) return { mult: 1.25, bonus: "night_owl" };
  return { mult: 1.0, bonus: null };
}

export type LeaderboardPeriod = "global" | "diaria";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
}

/** Estadísticas acumuladas de un usuario. */
export interface TriviaUserStats {
  userId: string;
  name: string;
  totalPoints: number;
  gamesPlayed: number;
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  bestSpeedScore: number;
  bestSurvival: number; // récord Muerte Súbita
  lastPlayed: string | null;
}

export interface SessionResult {
  mode: TriviaMode;
  date: string; // YYYY-MM-DD
  answered: number;
  correct: number;
  points: number;
  bestStreak: number;
  /** Modo Relámpago: tiempo medio de respuesta en ms. */
  avgResponseMs?: number;
  /** Muerte Súbita: cuántas seguidas aguantó. */
  survival?: number;
}

/** Estado de una partida en curso, guardado en servidor (anti-trampa).
 *  El cliente nunca recibe las respuestas correctas hasta haber contestado. */
export interface ServerSession {
  id: string;
  mode: TriviaMode;
  date: string;
  /** Preguntas de la partida CON su respuesta (solo en servidor). */
  questions: TriviaQuestion[];
  /** ids de preguntas ya contestadas (no se pueden repetir). */
  answered: string[];
  correct: number;
  points: number;
  streak: number;
  bestStreak: number;
  responseMsSum: number;
  finished: boolean;
  startedAt: string;
}
