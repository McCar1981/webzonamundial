// src/app/api/predictions/leagues/route.ts
//
// GET  /api/predictions/leagues          → ligas del usuario.
// POST /api/predictions/leagues          → crear liga ({ name }) o unirse ({ code }).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createLeague, joinLeague, myLeagues } from "@/lib/predictions/gamification-store";
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
    if (!result.ok) return NextResponse.json(result, { status: 404 });
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
    const league = await createLeague(user.id, body.name.trim());
    return NextResponse.json({ ok: true, league }, { status: 201 });
  }
  return NextResponse.json({ error: "bad_request", message: "Indica name (crear) o code (unirse)" }, { status: 400 });
}
