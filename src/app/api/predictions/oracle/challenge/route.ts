// src/app/api/predictions/oracle/challenge/route.ts
//
// POST {match_id} → sella el reto del usuario contra el Oráculo en un partido.
// Requisitos: predicción de Ganador propia ya enviada y predicciones aún
// abiertas. El pick del usuario se CONGELA aquí (editar la predicción después
// no cambia el reto). Un reto por usuario y partido.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, predictionsCloseAt } from "@/lib/predictions/match-data";
import { getMatchPredictions } from "@/lib/predictions/store";
import { adminClient } from "@/lib/predictions/admin";
import { getOraclePick } from "@/lib/predictions/oracle";
import type { WinnerData } from "@/lib/predictions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { match_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const matchId = body.match_id ?? "";
  const meta = getMatchMeta(matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const closeAt = predictionsCloseAt(matchId, true);
  if (closeAt && Date.now() >= closeAt.getTime()) {
    return NextResponse.json({ error: "closed", message: "Las predicciones de este partido ya cerraron" }, { status: 409 });
  }

  const rows = await getMatchPredictions(user.id, matchId);
  const winnerRow = rows.find((r) => r.prediction_type === "winner");
  if (!winnerRow) {
    return NextResponse.json({ error: "no_winner_prediction", message: "Haz primero tu predicción de Ganador" }, { status: 409 });
  }

  const pick = await getOraclePick(matchId);
  if (!pick) return NextResponse.json({ error: "oracle_unavailable" }, { status: 500 });

  const userPick = { result: (winnerRow.prediction_data as WinnerData).result };
  const { error } = await adminClient()
    .from("prediction_oracle_challenges")
    .insert({
      user_id: user.id,
      match_id: matchId,
      user_pick: userPick,
      oracle_pick: pick as unknown as object,
    });
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "already_challenged", message: "Ya retaste al Oráculo en este partido" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json(
    { ok: true, user_pick: userPick, oracle_pick: pick },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
