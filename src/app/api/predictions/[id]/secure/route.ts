// src/app/api/predictions/[id]/secure/route.ts
//
// POST → "Asegurar ahora": vende una predicción que AHORA MISMO va ganando a
// cambio del 60% de sus puntos base, fijos y sin multiplicadores. Decisión
// irreversible, una sola vez por predicción.
//
// TODO el veredicto se recalcula server-side contra el snapshot real del
// Match Center (jamás se confía en el cliente): partido en juego (min 60-final),
// feed real, y la predicción tiene que ir ganando en este instante.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getLastSnapshot } from "@/lib/match-center/store";
import { snapshotStarted } from "@/lib/fantasy/scoring.live";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { scoreBase } from "@/lib/predictions/scoring";
import { composeResultFromSnapshot } from "@/lib/predictions/auto-result";
import type { PredictionRow } from "@/lib/predictions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ventana de la decisión: del minuto 60 al final del partido. */
const SECURE_FROM_MINUTE = 60;
/** Fracción de los puntos base que se cobra al asegurar. */
const SECURE_RATIO = 0.6;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = adminClient();
  const { data } = await admin
    .from("predictions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const row = data as PredictionRow | null;

  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.resolved_at) {
    return NextResponse.json({ error: "already_resolved" }, { status: 409 });
  }
  if (row.secured_at) {
    return NextResponse.json({ error: "already_secured" }, { status: 409 });
  }

  const meta = getMatchMeta(row.match_id);
  const matchNum = parseInt(row.match_id, 10);
  if (!meta?.kickoff_at || Number.isNaN(matchNum)) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  // Estado REAL del partido: solo caché del Match Center (feed api-football).
  const snap = await getLastSnapshot(matchNum);
  if (!snap || snap.mode !== "live" || !snapshotStarted(snap)) {
    return NextResponse.json({ error: "no_live_feed", message: "Sin feed en vivo del partido" }, { status: 409 });
  }
  if (["FT", "AET", "PEN"].includes(snap.status)) {
    return NextResponse.json({ error: "match_finished", message: "El partido ya terminó" }, { status: 409 });
  }
  if ((snap.elapsed ?? 0) < SECURE_FROM_MINUTE) {
    return NextResponse.json({ error: "too_early", message: `Se puede asegurar a partir del minuto ${SECURE_FROM_MINUTE}` }, { status: 409 });
  }

  // ¿De verdad va ganando AHORA? Mismo motor que la resolución oficial.
  const provisional = composeResultFromSnapshot(row.match_id, snap);
  const base = scoreBase(row.prediction_type, row.prediction_data, row.confidence_multiplier, provisional);
  if (base.voided || !base.correct || base.points <= 0) {
    return NextResponse.json({ error: "not_winning", message: "Ahora mismo esta predicción no va ganando" }, { status: 409 });
  }

  const securedPoints = Math.max(1, Math.round(base.points * SECURE_RATIO));

  // CAS: solo si sigue sin resolver y sin asegurar (carrera con el cron o doble clic).
  const { data: claimed } = await admin
    .from("predictions")
    .update({ secured_at: new Date().toISOString(), secured_points: securedPoints })
    .eq("id", row.id)
    .eq("user_id", user.id)
    .is("resolved_at", null)
    .is("secured_at", null)
    .select("id");

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: "conflict", message: "La predicción cambió de estado, recarga" }, { status: 409 });
  }

  return NextResponse.json(
    { ok: true, secured_points: securedPoints, minute: snap.elapsed ?? 0 },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
