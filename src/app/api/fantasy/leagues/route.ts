// src/app/api/fantasy/leagues/route.ts
//
// GET  /api/fantasy/leagues → ligas del usuario (con is_owner).
// POST /api/fantasy/leagues → crear liga ({ name }) o unirse ({ code }).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createLeague, joinLeague, myLeagues } from "@/lib/fantasy/leagues.server";
import { isPro } from "@/lib/pro/entitlement";
import { PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const leagues = await myLeagues(user.id);
  return NextResponse.json({ leagues });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { name?: string; code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  if (body.code) {
    const result = await joinLeague(user.id, body.code);
    // 404 solo cuando la liga no existe; el resto de rechazos son 409 (conflicto).
    if (!result.ok) {
      const status = result.error === "league_not_found" ? 404 : result.error === "invalid_code" ? 400 : 409;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }
  if (body.name && body.name.trim()) {
    // Crear ligas privadas es Pro; unirse con código (arriba) es libre — así
    // un Pro arrastra a sus amigos Free a su liga.
    if (!(await isPro(user.id, user.email))) {
      trackLimitHit("leagues_create");
      const payload: ProRequiredPayload = {
        error: "Crear ligas privadas es una función del plan Pro.",
        code: PRO_REQUIRED_CODE,
        feature: "leagues_create",
      };
      return NextResponse.json(payload, { status: 403 });
    }
    const result = await createLeague(user.id, body.name.trim());
    if (!result.ok) {
      const status = result.error === "too_many_leagues" ? 409 : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result, { status: 201 });
  }
  return NextResponse.json({ error: "bad_request", message: "Indica name (crear) o code (unirse)" }, { status: 400 });
}
