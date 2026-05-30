// src/lib/predictions/types.ts
//
// Modelo de datos del módulo de Predicciones (8 tipos). A diferencia del Fantasy
// (client-side), las Predicciones SÍ persisten en Supabase: una fila por
// (usuario, partido, tipo). Aquí viven los tipos compartidos entre el dominio
// (scoring/rules), la capa de datos (store) y la UI.

export type PredictionType =
  | "exact_score"
  | "winner"
  | "first_scorer"
  | "chain"
  | "duel"
  | "over_under"
  | "minute_drama"
  | "social";

export const PREDICTION_TYPES: PredictionType[] = [
  "exact_score",
  "winner",
  "first_scorer",
  "chain",
  "duel",
  "over_under",
  "minute_drama",
  "social",
];

// ─── Payloads por tipo (prediction_data) ─────────────────────────────────────
export interface ExactScoreData { home_goals: number; away_goals: number }
export type WinnerResult = "home" | "draw" | "away";
export interface WinnerData { result: WinnerResult }
export interface FirstScorerData { player_id: string | null; no_goals: boolean }

export type ChainEventType = "goal" | "card" | "halftime_score" | "winner";
export interface ChainStep {
  step: number;
  event_type: ChainEventType;
  event_data: {
    team?: "home" | "away";
    description?: string;
    home?: number;
    away?: number;
    result?: WinnerResult;
  };
}
export interface ChainData { chain: ChainStep[] }

export interface DuelData { duel_id: string; winner_player_id: string }

export type OverUnderCategory = "goals" | "corners" | "cards" | "shots_on_target";
export type OverUnderDifficulty = "easy" | "medium" | "hard";
export interface OverUnderData {
  category: OverUnderCategory;
  line: number;
  choice: "over" | "under";
  difficulty: OverUnderDifficulty;
}

export type DramaEvent = "first_goal" | "first_card" | "first_sub" | "last_goal";
export type MinuteRange =
  | "0-10" | "11-20" | "21-30" | "31-45"
  | "46-55" | "56-65" | "66-75" | "76-90" | "90+";
export interface MinuteDramaData {
  event: DramaEvent;
  minute_range?: MinuteRange;
  no_event?: boolean;
}

export interface SocialData {
  question_key: string;            // "winner", "exact_score", ...
  choice: string;                  // "home", "2-1", "<player_id>" ...
  community_pct_at_time: number;   // % de la opción mayoritaria al predecir
}

export type PredictionData =
  | ExactScoreData
  | WinnerData
  | FirstScorerData
  | ChainData
  | DuelData
  | OverUnderData
  | MinuteDramaData
  | SocialData;

export const MINUTE_RANGES: MinuteRange[] = [
  "0-10", "11-20", "21-30", "31-45", "46-55", "56-65", "66-75", "76-90", "90+",
];

// ─── Metadatos de cada tipo (UI + tabla de puntos) ───────────────────────────
export interface PredictionTypeMeta {
  type: PredictionType;
  label: string;
  emoji: string;
  color: string;          // color distintivo de la card
  blurb: string;          // descripción corta para la UI
  minPoints: number;
  maxPoints: number;
  difficulty: "Media" | "Alta" | "Muy alta" | "Variable";
}

export const TYPE_META: Record<PredictionType, PredictionTypeMeta> = {
  exact_score: { type: "exact_score", label: "Resultado Exacto", emoji: "⚽", color: "#22c55e", blurb: "El marcador final exacto. Fallar por 1 gol aún suma.", minPoints: 5, maxPoints: 25, difficulty: "Alta" },
  winner: { type: "winner", label: "Ganador con Confianza", emoji: "🏆", color: "#f59e0b", blurb: "¿Quién gana? Apuesta tu convicción ×1, ×2 o ×3.", minPoints: -15, maxPoints: 30, difficulty: "Variable" },
  first_scorer: { type: "first_scorer", label: "Primer Goleador", emoji: "⚡", color: "#ef4444", blurb: "Quién marca el primer gol del partido.", minPoints: 10, maxPoints: 30, difficulty: "Alta" },
  chain: { type: "chain", label: "Predicción Encadenada", emoji: "🔗", color: "#a855f7", blurb: "Escribe la historia del partido: eventos en orden.", minPoints: 3, maxPoints: 100, difficulty: "Muy alta" },
  duel: { type: "duel", label: "Duelo de Jugadores", emoji: "⚔️", color: "#38bdf8", blurb: "Quién rinde mejor en un duelo táctico real.", minPoints: 0, maxPoints: 25, difficulty: "Media" },
  over_under: { type: "over_under", label: "Over / Under IA", emoji: "📊", color: "#14b8a6", blurb: "Líneas ajustadas por IA. Cuanto más difícil, más puntos.", minPoints: 0, maxPoints: 20, difficulty: "Variable" },
  minute_drama: { type: "minute_drama", label: "Minuto del Drama", emoji: "⏱️", color: "#eab308", blurb: "¿En qué franja de 10' ocurre el evento clave?", minPoints: 0, maxPoints: 25, difficulty: "Alta" },
  social: { type: "social", label: "Modo Manada", emoji: "🐑", color: "#ec4899", blurb: "¿Vas con la mayoría o contra ella? Contrarian = más puntos.", minPoints: 0, maxPoints: 30, difficulty: "Variable" },
};

// Límites de cadena.
export const CHAIN_MIN_STEPS = 3;
export const CHAIN_MAX_STEPS_FREE = 3;
export const CHAIN_MAX_STEPS_PREMIUM = 7;

// Cierres (minutos antes del kickoff).
export const CLOSE_MIN_FREE = 30;
export const CLOSE_MIN_PREMIUM = 5;
export const CHAIN_CLOSE_MIN = 120;        // las cadenas cierran 2h antes
export const FIRST_SCORER_CLOSE_MIN = 90;  // primer goleador cierra con alineaciones

// ─── Filas de base de datos ──────────────────────────────────────────────────
export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  prediction_type: PredictionType;
  prediction_data: PredictionData;
  confidence_multiplier: number;
  is_contrarian: boolean;
  match_multiplier: number;
  points_before_multiplier: number | null;
  points_earned: number | null;
  is_correct: boolean | null;
  resolution_breakdown: string | null;
  changed_at: string | null;
  locked_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ─── Datos reales del partido (para resolución) ──────────────────────────────
export interface MatchEventReal {
  type: "goal" | "card";
  minute: number;
  player_id?: string;
  team: "home" | "away";
  card_type?: "yellow" | "red";
  assist_player_id?: string;
}
export interface MatchResultReal {
  score: { home: number; away: number };
  events: MatchEventReal[];
  stats: {
    corners: { home: number; away: number };
    cards: { home: number; away: number };
    shots_on_target: { home: number; away: number };
  };
  player_ratings: Record<string, number>;
  first_sub_minute?: number;
}

// ─── Duelos y líneas generadas (deterministas) ───────────────────────────────
export interface DuelPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
}
export interface Duel {
  duel_id: string;
  player_a: DuelPlayer;
  player_b: DuelPlayer;
  context: string;
  metric: string;
}

export interface OverUnderLine {
  category: OverUnderCategory;
  easy: { line: number; points: number };
  medium: { line: number; points: number };
  hard: { line: number; points: number };
}

// Bonus aplicables en resolución.
export interface ResolutionContext {
  matchMultiplier: number;   // Modo Underdog/Diamante
  isEarlyBird: boolean;      // creada 24h+ antes
  streakActive: boolean;     // racha 3+ → ×1.5 en la siguiente
}
