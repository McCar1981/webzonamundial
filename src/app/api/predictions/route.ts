// src/app/api/predictions/route.ts
//
// POST /api/v1/predictions  → crear una predicción (cualquiera de los 8 tipos).
// Auth requerida. Valida tipo, payload, ventana de cierre y unicidad.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import {
  PREDICTION_TYPES,
  TYPE_META,
  type PredictionData,
  type PredictionType,
  type SocialData,
} from "@/lib/predictions/types";
import { validatePredictionData, checkOpen, isEarlyBird } from "@/lib/predictions/rules";
import { getMatch, getMatchMeta, matchMultiplier, allMatchIdsOnDate } from "@/lib/predictions/match-data";
import { potentialPoints } from "@/lib/predictions/scoring";
import { findPrediction, createPrediction, countPredictionsForMatches } from "@/lib/predictions/store";
import { bumpChallengeProgress, claimJornadaIfComplete, extendStreakWindow } from "@/lib/predictions/gamification-store";
import { isPro } from "@/lib/pro/entitlement";
import { FREE_LIMITS, PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // FIX 2: rate-limit de escritura (30 creaciones/min). Mismo patrón que ia-coach.
  const rl = await rateLimitByUser(user.id, "pred:create", 30, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: {
    match_id?: string;
    prediction_type?: PredictionType;
    prediction_data?: PredictionData;
    confidence_multiplier?: number;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const { match_id, prediction_type, prediction_data } = body;
  if (!match_id || !prediction_type || !prediction_data) {
    return NextResponse.json({ error: "bad_request", message: "match_id, prediction_type y prediction_data son obligatorios" }, { status: 400 });
  }
  if (!PREDICTION_TYPES.includes(prediction_type)) {
    return NextResponse.json({ error: "invalid_prediction_data", message: "prediction_type desconocido", field: "prediction_type" }, { status: 400 });
  }

  const meta = getMatchMeta(match_id);
  if (!meta) return NextResponse.json({ error: "match_not_found", message: "Partido no encontrado" }, { status: 404 });

  // Pro = suscripción activa o Founder (sustituye al viejo profiles.is_premium).
  const premium = await isPro(user.id, user.email);

  // ── Límites del plan Free ──
  if (!premium) {
    // Solo "resultado exacto" en Free.
    if (!FREE_LIMITS.predictions.allowedTypes.includes(prediction_type)) {
      trackLimitHit("predictions_type");
      const payload: ProRequiredPayload = {
        error: "En el plan gratuito solo puedes predecir el resultado exacto. Los 8 tipos son del plan Pro.",
        code: PRO_REQUIRED_CODE,
        feature: "predictions_type",
      };
      return NextResponse.json(payload, { status: 403 });
    }
    // Máximo N predicciones por jornada (todos los partidos del mismo día).
    const match = getMatch(match_id);
    if (match) {
      const used = await countPredictionsForMatches(user.id, allMatchIdsOnDate(match.d));
      if (used >= FREE_LIMITS.predictions.maxPerJornada) {
        trackLimitHit("predictions_jornada");
        const payload: ProRequiredPayload = {
          error: `Has usado tus ${FREE_LIMITS.predictions.maxPerJornada} predicciones de esta jornada. Con Pro no hay límite.`,
          code: PRO_REQUIRED_CODE,
          feature: "predictions_jornada",
          limit: FREE_LIMITS.predictions.maxPerJornada,
        };
        return NextResponse.json(payload, { status: 403 });
      }
    }
  }

  // Validación del payload.
  // FIX 1: pasamos match_id para que rules.ts valide over_under/duel server-side.
  const v = validatePredictionData(prediction_type, prediction_data, premium, match_id);
  if (!v.ok) {
    const status = v.error === "chain_limit_reached" || v.error === "premium_required" ? 403 : 400;
    return NextResponse.json(v, { status });
  }

  // Ventana de cierre.
  const open = checkOpen(match_id, prediction_type, premium);
  if (!open.open) {
    return NextResponse.json({ error: "predictions_closed", message: open.message, closed_at: open.closesAt?.toISOString() ?? null }, { status: 403 });
  }

  // Unicidad por tipo.
  const existing = await findPrediction(user.id, match_id, prediction_type);
  if (existing) {
    return NextResponse.json({ error: "prediction_exists", message: `Ya tienes una predicción de tipo ${prediction_type} para este partido` }, { status: 409 });
  }

  // Confianza solo aplica a "winner"; contrarian solo a "social".
  const confidence = prediction_type === "winner"
    ? Math.max(1, Math.min(3, body.confidence_multiplier ?? 1))
    : 1;
  const isContrarian = prediction_type === "social"
    ? (prediction_data as SocialData).community_pct_at_time < 50
    : false;

  // Multiplicadores = beneficio Pro. En Free el partido vale ×1 (y la
  // resolución, además, no aplica racha/early-bird gracias a was_pro).
  const mult = premium
    ? matchMultiplier(match_id)
    : { multiplier: 1, label: "Estelar", emoji: "🟢" };

  const row = await createPrediction({
    userId: user.id,
    matchId: match_id,
    type: prediction_type,
    data: prediction_data,
    confidence,
    isContrarian,
    matchMult: mult.multiplier,
    wasPro: premium,
  });

  // Reto diario: avanza/paga la misión de hoy según esta predicción.
  await bumpChallengeProgress(user.id, {
    predictionType: prediction_type,
    isContrarian,
    confidence,
    matchMult: mult.multiplier,
    isEarlyBird: isEarlyBird(match_id, new Date()),
  }).catch(() => {});

  // Racha: predecir cuenta como engagement → renueva la cuenta atrás.
  await extendStreakWindow(user.id).catch(() => {});

  // Battle Pass: si esta predicción completa la jornada del día, paga el bonus.
  const matchDay = getMatch(match_id)?.d;
  if (matchDay) await claimJornadaIfComplete(user.id, matchDay).catch(() => {});

  const tm = TYPE_META[prediction_type];
  return NextResponse.json({
    id: row.id,
    match_id: row.match_id,
    prediction_type: row.prediction_type,
    prediction_data: row.prediction_data,
    confidence_multiplier: row.confidence_multiplier,
    is_contrarian: row.is_contrarian,
    match_multiplier: row.match_multiplier,
    match_tier: mult.label,
    status: "pending",
    points_potential: potentialPoints(tm.minPoints, tm.maxPoints, mult.multiplier),
    locked_at: row.locked_at,
    created_at: row.created_at,
  }, { status: 201 });
}
