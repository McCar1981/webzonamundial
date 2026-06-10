// src/app/api/predictions/oracle/route.ts
//
// GET ?match_id=N → estado del Oráculo para el usuario en un partido:
// pick sellado (REVELADO solo si el usuario ya envió su predicción de Ganador
// o si las predicciones están cerradas), su reto si existe, y el marcador
// global Humanos vs Oráculo. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta, predictionsCloseAt } from "@/lib/predictions/match-data";
import { getMatchPredictions } from "@/lib/predictions/store";
import { adminClient } from "@/lib/predictions/admin";
import { getOraclePick, getOracleScoreboard, type OracleChallengeRow } from "@/lib/predictions/oracle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const matchId = new URL(req.url).searchParams.get("match_id") ?? "";
  const meta = getMatchMeta(matchId);
  if (!meta) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  const rows = await getMatchPredictions(user.id, matchId);
  const hasWinner = rows.some((r) => r.prediction_type === "winner");
  const closeAt = predictionsCloseAt(matchId, true);
  const closed = !!closeAt && Date.now() >= closeAt.getTime();
  const revealed = hasWinner || closed;

  const { data } = await adminClient()
    .from("prediction_oracle_challenges")
    .select("*")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();
  const myChallenge = (data as OracleChallengeRow | null) ?? null;

  const [pick, scoreboard] = await Promise.all([
    revealed ? getOraclePick(matchId) : Promise.resolve(null),
    getOracleScoreboard(),
  ]);

  return NextResponse.json(
    {
      sealed: !revealed,
      can_challenge: revealed && hasWinner && !closed && !myChallenge,
      pick,
      my_challenge: myChallenge,
      scoreboard,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
