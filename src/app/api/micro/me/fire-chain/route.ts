// GET /api/micro/me/fire-chain?match_id=ID
//
// Cadena de Fuego actual del usuario en un partido (para el badge en vivo).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { currentFireChain } from "@/lib/micro/store";
import { fireTier } from "@/lib/micro/micro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const matchId = new URL(req.url).searchParams.get("match_id");
  if (!matchId) return NextResponse.json({ error: "missing_match_id" }, { status: 400 });

  const chain = await currentFireChain(user.id, matchId);
  const tier = fireTier(chain);
  return NextResponse.json({
    match_id: matchId,
    fire_chain: { count: chain, multiplier: tier.multiplier, label: tier.label, emoji: tier.emoji },
  });
}
