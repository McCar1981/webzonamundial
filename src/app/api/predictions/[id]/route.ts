// src/app/api/predictions/[id]/route.ts
//
// PATCH /api/v1/predictions/{id} → cambiar una predicción (solo Premium, 1/día).
// GET   /api/v1/predictions/{id} → leer una predicción propia.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import type { PredictionData, SocialData } from "@/lib/predictions/types";
import { validatePredictionData, checkOpen } from "@/lib/predictions/rules";
import {
  isPremium,
  getPredictionById,
  updatePredictionData,
} from "@/lib/predictions/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const row = await getPredictionById(params.id);
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(row);
}

// Editar una predicción. Libre para todos hasta 15 min antes del kickoff
// (la ventana la impone checkOpen); una vez bloqueada o resuelta, no se toca.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const row = await getPredictionById(params.id);
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.resolved_at || row.locked_at) {
    return NextResponse.json({ error: "prediction_locked", message: "Esta predicción ya está cerrada" }, { status: 403 });
  }

  const open = checkOpen(row.match_id, row.prediction_type, false);
  if (!open.open) {
    return NextResponse.json({ error: "prediction_locked", message: open.message }, { status: 403 });
  }

  let body: { prediction_data?: PredictionData; confidence_multiplier?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.prediction_data) return NextResponse.json({ error: "bad_request", message: "prediction_data requerido" }, { status: 400 });

  const premium = await isPremium(user.id);
  const v = validatePredictionData(row.prediction_type, body.prediction_data, premium);
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
