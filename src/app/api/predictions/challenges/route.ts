// src/app/api/predictions/challenges/route.ts
//
// Piques 1v1: GET ?match_id=N → mis piques del partido (creados o aceptados).
//             POST {match_id, stake} → crear pique (escrow + código).
// Auth requerida. Aceptar va en /accept.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { createChallenge, myChallenges, CHALLENGE_STAKES } from "@/lib/predictions/challenges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_STATUS: Record<string, number> = {
  bad_stake: 400, match_not_found: 404, closed: 409, no_winner_prediction: 409,
  insufficient_coins: 402, conflict: 409,
};
const ERROR_MESSAGE: Record<string, string> = {
  bad_stake: "Apuesta no válida",
  match_not_found: "Partido no encontrado",
  closed: "Las predicciones de este partido ya cerraron",
  no_winner_prediction: "Haz primero tu predicción de Ganador",
  insufficient_coins: "No te llegan los Fútcoins para esa apuesta",
  conflict: "No se pudo crear el pique, reintenta",
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const matchId = new URL(req.url).searchParams.get("match_id") ?? "";
  if (!getMatchMeta(matchId)) return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  const rows = await myChallenges(user.id, matchId);
  return NextResponse.json(
    { challenges: rows, stakes: CHALLENGE_STAKES, me: user.id },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { match_id?: string; stake?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const res = await createChallenge(user.id, body.match_id ?? "", Number(body.stake));
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error, message: ERROR_MESSAGE[res.error] ?? "No se pudo crear el pique" },
      { status: ERROR_STATUS[res.error] ?? 409 },
    );
  }
  return NextResponse.json(
    { ok: true, challenge: res.row },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
