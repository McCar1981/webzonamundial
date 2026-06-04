// src/app/api/predictions/route.ts
//
// POST /api/v1/predictions  → crear una predicción (cualquiera de los 8 tipos).
// Auth requerida. Valida tipo, payload, ventana de cierre y unicidad.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  PREDICTION_TYPES,
  TYPE_META,
  type PredictionData,
  type PredictionType,
  type SocialData,
} from "@/lib/predictions/types";
import { validatePredictionData, checkOpen, isEarlyBird } from "@/lib/predictions/rules";
import { getMatch, getMatchMeta, matchMultiplier } from "@/lib/predictions/match-data";
import { potentialPoints } from "@/lib/predictions/scoring";
import { isPremium, findPrediction, createPrediction } from "@/lib/predictions/store";
import { bumpChallengeProgress, claimJornadaIfComplete, extendStreakWindow } from "@/lib/predictions/gamification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  const premium = await isPremium(user.id);

  // Validación del payload.
  const v = validatePredictionData(prediction_type, prediction_data, premium);
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

  const mult = matchMultiplier(match_id);

  const row = await createPrediction({
    userId: user.id,
    matchId: match_id,
    type: prediction_type,
    data: prediction_data,
    confidence,
    isContrarian,
    matchMult: mult.multiplier,
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
