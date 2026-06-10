// src/lib/powerups/eligibility.ts
//
// Validación de un USO de comodín (server-only). La comparten:
//   · POST /api/powerups/use      — gastar 1 crédito del monedero (sin Stripe)
//   · POST /api/powerups/checkout — validar el "intent" que acompaña al pack
//     (el comodín que el usuario quería aplicar al comprar)
//
// Devuelve el contexto normalizado que viaja en la fila de powerup_purchases.
// Tipos planos (strict:false en el tsconfig del repo).

import { adminClient } from "@/lib/predictions/admin";
import { checkOpen, validatePredictionData } from "@/lib/predictions/rules";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getSession } from "@/lib/trivia/store";
import type { PredictionData, PredictionRow } from "@/lib/predictions/types";
import type { PowerupSku } from "./catalog";
import {
  SECOND_CHANCE_TYPES,
  activeDoubleDown,
  secondChanceUsed,
  secondChanceWindow,
} from "./store";

export interface UseRequestBody {
  sku?: string;
  prediction_id?: string;
  payload?: PredictionData;
  match_id?: string;
  trivia_session_id?: string;
}

export interface UseValidation {
  ok: boolean;
  error?: string;
  message?: string;
  /** Status HTTP sugerido para la respuesta de error. */
  httpStatus?: number;
  // Contexto normalizado (cuando ok):
  sku?: PowerupSku;
  matchId?: string | null;
  predictionId?: string | null;
  triviaSessionId?: string | null;
  payload?: PredictionData | null;
}

function bad(error: string, message: string, httpStatus: number): UseValidation {
  return { ok: false, error, message, httpStatus };
}

/** Valida que ESTE usuario puede aplicar ESTE comodín ahora mismo. */
export async function validatePowerupUse(userId: string, body: UseRequestBody): Promise<UseValidation> {
  const sku = body.sku;

  if (sku === "second_chance") {
    if (!body.prediction_id || !body.payload) {
      return bad("bad_request", "prediction_id y payload requeridos", 400);
    }
    const { data } = await adminClient()
      .from("predictions")
      .select("*")
      .eq("id", body.prediction_id)
      .maybeSingle();
    const row = data as PredictionRow | null;
    if (!row || row.user_id !== userId) return bad("not_found", "Predicción no encontrada", 404);
    if (row.resolved_at) return bad("already_resolved", "Esta predicción ya se resolvió", 409);
    if (row.secured_at) return bad("secured", "Ya aseguraste esta predicción", 409);
    if (!SECOND_CHANCE_TYPES.includes(row.prediction_type as (typeof SECOND_CHANCE_TYPES)[number])) {
      return bad("bad_type", "Este mercado no admite Segunda Oportunidad", 400);
    }
    // Si la ventana normal sigue abierta, que edite gratis (no se cobra un uso).
    if (checkOpen(row.match_id, row.prediction_type, false).open) {
      return bad("still_open", "Aún puedes editar gratis esta predicción", 409);
    }
    const win = await secondChanceWindow(row.match_id);
    if (!win.ok) return bad(win.error ?? "too_late", win.message ?? "Ventana cerrada", 409);
    if (await secondChanceUsed(userId, row.id)) {
      return bad("already_used", "Ya usaste tu Segunda Oportunidad en esta predicción", 409);
    }
    // Equidad p2p: con un pique 1v1 vivo en este partido el pick queda sellado.
    const { count: piques } = await adminClient()
      .from("prediction_challenges")
      .select("id", { count: "exact", head: true })
      .eq("match_id", row.match_id)
      .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
      .in("status", ["open", "accepted"]);
    if ((piques ?? 0) > 0) {
      return bad("challenge_active", "Tienes un pique 1v1 en este partido: el pick queda sellado", 409);
    }
    const v = validatePredictionData(row.prediction_type, body.payload, true, row.match_id);
    if (!v.ok) return bad(v.error ?? "invalid", v.message ?? "Pick inválido", 400);
    if (JSON.stringify(body.payload) === JSON.stringify(row.prediction_data)) {
      return bad("same_pick", "El nuevo pick es igual al actual", 400);
    }
    return {
      ok: true,
      sku: "second_chance",
      matchId: row.match_id,
      predictionId: row.id,
      triviaSessionId: null,
      payload: body.payload,
    };
  }

  if (sku === "double_down") {
    if (!body.match_id) return bad("bad_request", "match_id requerido", 400);
    if (!getMatchMeta(body.match_id)?.kickoff_at) return bad("match_not_found", "Partido no encontrado", 404);
    // Se activa a ciegas: solo mientras las predicciones siguen abiertas.
    if (!checkOpen(body.match_id, "winner", false).open) {
      return bad("closed", "Las predicciones de este partido ya cerraron", 409);
    }
    if (await activeDoubleDown(userId, body.match_id)) {
      return bad("already_active", "Ya tienes un Partido x2 en este partido", 409);
    }
    return { ok: true, sku: "double_down", matchId: body.match_id, predictionId: null, triviaSessionId: null, payload: null };
  }

  if (sku === "trivia_revive") {
    if (!body.trivia_session_id) return bad("bad_request", "trivia_session_id requerido", 400);
    const session = await getSession(body.trivia_session_id);
    if (!session) return bad("session_expired", "Tu partida expiró", 404);
    if (session.finished) return bad("finished", "La partida ya terminó", 409);
    if (session.mode !== "muerte-subita") return bad("bad_mode", "Salvarracha solo está en Muerte Súbita", 400);
    if (!session.gameOver) return bad("not_game_over", "Tu partida sigue viva", 409);
    if ((session.revives ?? 0) >= 1) return bad("revive_limit", "Solo un revive por partida", 409);
    return { ok: true, sku: "trivia_revive", matchId: null, predictionId: null, triviaSessionId: body.trivia_session_id, payload: null };
  }

  return bad("bad_sku", "Comodín desconocido", 400);
}
