// src/app/api/ligas/predict/boost/route.ts
//
// POST /api/ligas/predict/boost { fixtureId }
// Activa el boost de una predicción propia ANTES del saque: cuesta BOOST_COST
// Fútcoins y, si aciertas, el premio sube a BOOST_REWARD (lo aplica el cron de
// resolución). Requiere tener ya una predicción en ese partido.
//
// Idempotencia/anti-doble-cobro: se RECLAMA el boost (SET NX) antes de cobrar; si
// el cobro falla, se libera (rollback). Verificaciones server-side (predicción
// existe, partido no empezado); nunca se confía en el cliente.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getFixtureDetailCached } from "@/lib/competitions/api";
import { spendCoins } from "@/lib/economy/wallet";
import { getUserPick } from "@/lib/ligas/predictions";
import { claimBoost, releaseBoost, BOOST_COST } from "@/lib/ligas/boost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_STARTED = new Set(["NS", "TBD"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { fixtureId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const id = Number(body.fixtureId);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // Debe existir una predicción propia en este partido.
  const pick = await getUserPick(user.id, id);
  if (!pick) return NextResponse.json({ error: "no_prediction" }, { status: 400 });

  // El partido no debe haber empezado.
  const detail = await getFixtureDetailCached(id);
  if (!detail) return NextResponse.json({ error: "fixture_not_found" }, { status: 404 });
  if (!NOT_STARTED.has(detail.fixture.status)) {
    return NextResponse.json({ error: "match_started" }, { status: 409 });
  }

  // Reclama el boost (atómico). Si ya estaba, no se cobra dos veces.
  const claimed = await claimBoost(user.id, id);
  if (!claimed) return NextResponse.json({ error: "already_boosted" }, { status: 409 });

  // Cobra los Fútcoins. Si no hay saldo, libera el boost (rollback).
  const spend = await spendCoins(user.id, BOOST_COST);
  if (!spend.ok) {
    await releaseBoost(user.id, id);
    return NextResponse.json({ error: "insufficient_coins", coins: spend.coins }, { status: 402 });
  }

  return NextResponse.json({ ok: true, coins: spend.coins });
}
