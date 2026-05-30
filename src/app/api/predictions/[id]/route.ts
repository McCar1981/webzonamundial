// src/app/api/predictions/[id]/route.ts
//
// PATCH /api/v1/predictions/{id} → cambiar una predicción (solo Premium, 1/día).
// GET   /api/v1/predictions/{id} → leer una predicción propia.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import type { PredictionData } from "@/lib/predictions/types";
import { validatePredictionData, checkOpen } from "@/lib/predictions/rules";
import {
  isPremium,
  getPredictionById,
  changesUsedToday,
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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const premium = await isPremium(user.id);
  if (!premium) return NextResponse.json({ error: "premium_required", message: "Cambiar predicciones requiere Premium" }, { status: 403 });

  const row = await getPredictionById(params.id);
  if (!row || row.user_id !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.resolved_at || row.locked_at) {
    return NextResponse.json({ error: "prediction_locked", message: "Esta predicción ya está cerrada" }, { status: 403 });
  }

  // Ventana de cierre del tipo (premium).
  const open = checkOpen(row.match_id, row.prediction_type, true);
  if (!open.open) {
    return NextResponse.json({ error: "prediction_locked", message: open.message }, { status: 403 });
  }

  // Límite diario.
  const used = await changesUsedToday(user.id);
  if (used >= 1) {
    return NextResponse.json({ error: "daily_change_used", message: "Ya has usado tu cambio diario. Disponible mañana a las 00:00 UTC" }, { status: 429 });
  }

  let body: { prediction_data?: PredictionData };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.prediction_data) return NextResponse.json({ error: "bad_request", message: "prediction_data requerido" }, { status: 400 });

  const v = validatePredictionData(row.prediction_type, body.prediction_data, premium);
  if (!v.ok) return NextResponse.json(v, { status: v.error === "chain_limit_reached" ? 403 : 400 });

  const updated = await updatePredictionData(params.id, body.prediction_data);
  return NextResponse.json({
    id: updated.id,
    prediction_data: updated.prediction_data,
    changed_at: updated.changed_at,
    daily_changes_remaining: 0,
  });
}
