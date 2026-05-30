// src/lib/predictions/rules.ts
//
// Validación de prediction_data por tipo + reglas de cierre y límites premium.
// Devuelve errores con la forma que esperan los contratos de la API
// ({ error, message, field }).

import {
  CHAIN_CLOSE_MIN,
  CHAIN_MAX_STEPS_FREE,
  CHAIN_MAX_STEPS_PREMIUM,
  CHAIN_MIN_STEPS,
  CLOSE_MIN_FREE,
  CLOSE_MIN_PREMIUM,
  FIRST_SCORER_CLOSE_MIN,
  MINUTE_RANGES,
  type ChainData,
  type ExactScoreData,
  type FirstScorerData,
  type MinuteDramaData,
  type OverUnderData,
  type PredictionData,
  type PredictionType,
  type SocialData,
  type WinnerData,
} from "./types";
import { getMatchMeta } from "./match-data";

export interface ValidationResult { ok: boolean; error?: string; message?: string; field?: string }

const ok: ValidationResult = { ok: true };
function err(error: string, message: string, field?: string): ValidationResult {
  return { ok: false, error, message, field };
}

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

export function validatePredictionData(
  type: PredictionType,
  data: PredictionData,
  premium: boolean,
): ValidationResult {
  switch (type) {
    case "exact_score": {
      const d = data as ExactScoreData;
      if (!isInt(d.home_goals) || d.home_goals < 0) return err("invalid_prediction_data", "home_goals debe ser >= 0", "prediction_data.home_goals");
      if (!isInt(d.away_goals) || d.away_goals < 0) return err("invalid_prediction_data", "away_goals debe ser >= 0", "prediction_data.away_goals");
      if (d.home_goals > 20 || d.away_goals > 20) return err("invalid_prediction_data", "Marcador fuera de rango", "prediction_data");
      return ok;
    }
    case "winner": {
      const d = data as WinnerData;
      if (!["home", "draw", "away"].includes(d.result)) return err("invalid_prediction_data", "result debe ser home|draw|away", "prediction_data.result");
      return ok;
    }
    case "first_scorer": {
      const d = data as FirstScorerData;
      if (d.no_goals === true) return ok;
      if (!d.player_id || typeof d.player_id !== "string") return err("invalid_prediction_data", "player_id requerido salvo no_goals=true", "prediction_data.player_id");
      return ok;
    }
    case "chain": {
      const d = data as ChainData;
      if (!Array.isArray(d.chain) || d.chain.length < CHAIN_MIN_STEPS) {
        return err("invalid_prediction_data", `La cadena necesita al menos ${CHAIN_MIN_STEPS} eslabones`, "prediction_data.chain");
      }
      const maxSteps = premium ? CHAIN_MAX_STEPS_PREMIUM : CHAIN_MAX_STEPS_FREE;
      if (d.chain.length > maxSteps) {
        return {
          ok: false,
          error: "chain_limit_reached",
          message: `Usuarios free pueden crear cadenas de máximo ${CHAIN_MAX_STEPS_FREE} eslabones. Hazte Premium para ${CHAIN_MAX_STEPS_PREMIUM}.`,
          field: "prediction_data.chain",
        };
      }
      for (const s of d.chain) {
        if (!["goal", "card", "halftime_score", "winner"].includes(s.event_type)) {
          return err("invalid_prediction_data", "event_type inválido en un eslabón", "prediction_data.chain");
        }
      }
      return ok;
    }
    case "duel": {
      const d = data as { duel_id?: string; winner_player_id?: string };
      if (!d.duel_id || !d.winner_player_id) return err("invalid_prediction_data", "duel_id y winner_player_id requeridos", "prediction_data");
      return ok;
    }
    case "over_under": {
      const d = data as OverUnderData;
      if (!["goals", "corners", "cards", "shots_on_target"].includes(d.category)) return err("invalid_prediction_data", "category inválida", "prediction_data.category");
      if (!["over", "under"].includes(d.choice)) return err("invalid_prediction_data", "choice debe ser over|under", "prediction_data.choice");
      if (!["easy", "medium", "hard"].includes(d.difficulty)) return err("invalid_prediction_data", "difficulty inválida", "prediction_data.difficulty");
      if (typeof d.line !== "number") return err("invalid_prediction_data", "line debe ser numérica", "prediction_data.line");
      return ok;
    }
    case "minute_drama": {
      const d = data as MinuteDramaData;
      if (!["first_goal", "first_card", "first_sub", "last_goal"].includes(d.event)) return err("invalid_prediction_data", "event inválido", "prediction_data.event");
      if (d.no_event === true) return ok;
      if (!d.minute_range || !MINUTE_RANGES.includes(d.minute_range)) return err("invalid_prediction_data", "minute_range inválido", "prediction_data.minute_range");
      return ok;
    }
    case "social": {
      const d = data as SocialData;
      if (!d.question_key || !d.choice) return err("invalid_prediction_data", "question_key y choice requeridos", "prediction_data");
      if (typeof d.community_pct_at_time !== "number") return err("invalid_prediction_data", "community_pct_at_time requerido", "prediction_data.community_pct_at_time");
      return ok;
    }
  }
}

// ─── Cierre por tipo ─────────────────────────────────────────────────────────
/** Minutos antes del kickoff en los que cierra ESTE tipo de predicción. */
export function closeMinutesFor(type: PredictionType, premium: boolean): number {
  if (type === "chain") return CHAIN_CLOSE_MIN;
  if (type === "first_scorer") return FIRST_SCORER_CLOSE_MIN;
  return premium ? CLOSE_MIN_PREMIUM : CLOSE_MIN_FREE;
}

export interface CloseCheck { open: boolean; closesAt: Date | null; message?: string }

/** ¿Sigue abierta la ventana para predecir este tipo en este partido? */
export function checkOpen(matchId: string, type: PredictionType, premium: boolean, now = new Date()): CloseCheck {
  const meta = getMatchMeta(matchId);
  if (!meta?.kickoff_at) return { open: false, closesAt: null, message: "Partido no encontrado o sin horario" };
  const kickoff = new Date(meta.kickoff_at);
  const closesAt = new Date(kickoff.getTime() - closeMinutesFor(type, premium) * 60_000);
  if (now.getTime() >= closesAt.getTime()) {
    const minsAgo = Math.round((now.getTime() - closesAt.getTime()) / 60_000);
    return { open: false, closesAt, message: `Las predicciones para este partido cerraron hace ${minsAgo} minutos` };
  }
  return { open: true, closesAt };
}

/** Early bird: creada 24h+ antes del kickoff. */
export function isEarlyBird(matchId: string, createdAt: Date): boolean {
  const meta = getMatchMeta(matchId);
  if (!meta?.kickoff_at) return false;
  const kickoff = new Date(meta.kickoff_at).getTime();
  return kickoff - createdAt.getTime() >= 24 * 60 * 60_000;
}
