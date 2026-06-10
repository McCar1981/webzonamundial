// src/app/api/predictions/challenges/accept/route.ts
//
// POST {code} → aceptar un pique 1v1 con su código. Paga el escrow del rival
// y sella el duelo. Auth requerida.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { acceptChallenge } from "@/lib/predictions/challenges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_STATUS: Record<string, number> = {
  not_found: 404, own_challenge: 409, not_open: 409, closed: 409,
  no_winner_prediction: 409, insufficient_coins: 402,
};
const ERROR_MESSAGE: Record<string, string> = {
  not_found: "Ese código no existe",
  own_challenge: "No puedes aceptar tu propio pique",
  not_open: "Ese pique ya fue aceptado o cerrado",
  closed: "Las predicciones de ese partido ya cerraron",
  no_winner_prediction: "Haz primero tu predicción de Ganador en ese partido",
  insufficient_coins: "No te llegan los Fútcoins para esa apuesta",
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  if (!body.code || body.code.trim().length < 4) {
    return NextResponse.json({ error: "bad_request", message: "Código no válido" }, { status: 400 });
  }

  const res = await acceptChallenge(user.id, body.code);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error, message: ERROR_MESSAGE[res.error] ?? "No se pudo aceptar el pique" },
      { status: ERROR_STATUS[res.error] ?? 409 },
    );
  }
  return NextResponse.json(
    { ok: true, challenge: res.row },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
