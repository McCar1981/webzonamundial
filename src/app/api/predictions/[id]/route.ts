// src/app/api/predictions/[id]/route.ts
//
// PATCH /api/v1/predictions/{id} → cambiar una predicción (solo Premium, 1/día).
// GET   /api/v1/predictions/{id} → leer una predicción propia.

import { NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import type { PredictionData, SocialData } from "@/lib/predictions/types";
import { validatePredictionData, checkOpen } from "@/lib/predictions/rules";
import {
  getPredictionById,
  updatePredictionData,
  changesUsedToday,
} from "@/lib/predictions/store";
import { isPro } from "@/lib/pro/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const row = await getPredictionById(params.id);
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(row);
}

// Editar una predicción: solo Pro y máximo 1 cambio/día (FIX 3, según la
// cabecera del fichero). Además debe estar dentro de la ventana (checkOpen);
// una vez bloqueada o resuelta, no se toca.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // FIX 2: rate-limit de escritura (20 ediciones/min). Mismo patrón que ia-coach.
  const rl = await rateLimitByUser(user.id, "pred:edit", 20, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const row = await getPredictionById(params.id);
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.resolved_at || row.locked_at) {
    return NextResponse.json({ error: "prediction_locked", message: "Esta predicción ya está cerrada" }, { status: 403 });
  }

  // FIX 3 (NP-32): cerrar el abuso de ediciones ILIMITADAS. Antes el handler no
  // aplicaba ningún tope (changesUsedToday era código muerto). Aplicamos un tope
  // de 1 cambio/día PARA TODOS los usuarios.
  // Nota de producto: la cabecera original decía "solo Premium"; deliberadamente
  // NO introducimos aquí un paywall nuevo la víspera del lanzamiento (el front no
  // tiene flujo de paywall en edición y el usuario vería un error crudo). Si se
  // quiere monetizar la edición, hacerlo con un gate Pro ya soportado por la UI.
  const premium = await isPro(user.id, user.email);
  if ((await changesUsedToday(user.id)) >= 1) {
    return NextResponse.json(
      { error: "change_limit_reached", message: "Ya has usado tu cambio de hoy" },
      { status: 403 },
    );
  }

  const open = checkOpen(row.match_id, row.prediction_type, false);
  if (!open.open) {
    return NextResponse.json({ error: "prediction_locked", message: open.message }, { status: 403 });
  }

  let body: { prediction_data?: PredictionData; confidence_multiplier?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.prediction_data) return NextResponse.json({ error: "bad_request", message: "prediction_data requerido" }, { status: 400 });

  // FIX 1: pasamos el match_id de la fila para revalidar over_under/duel server-side.
  const v = validatePredictionData(row.prediction_type, body.prediction_data, premium, row.match_id);
  if (!v.ok) return NextResponse.json(v, { status: v.error === "chain_limit_reached" ? 403 : 400 });

  // Confianza solo aplica a "winner"; contrarian solo a "social".
  const confidence = row.prediction_type === "winner"
    ? Math.max(1, Math.min(3, body.confidence_multiplier ?? row.confidence_multiplier ?? 1))
    : 1;
  const isContrarian = row.prediction_type === "social"
    ? (body.prediction_data as SocialData).community_pct_at_time < 50
    : false;

  const updated = await updatePredictionData(params.id, row.prediction_type, body.prediction_data, confidence, isContrarian);
  return NextResponse.json({
    id: updated.id,
    prediction_data: updated.prediction_data,
    confidence_multiplier: updated.confidence_multiplier,
    is_contrarian: updated.is_contrarian,
    changed_at: updated.changed_at,
  });
}
