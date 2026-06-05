// src/app/api/modo-carrera/leaderboard/route.ts
//
// GET /api/modo-carrera/leaderboard → ranking global de DTs por reputación.
// Lectura pública (usa el cliente admin que cruza usuarios); si algo falla,
// devuelve una lista vacía para que la UI degrade con elegancia.

import { NextResponse } from "next/server";
import { getCareerLeaderboard } from "@/lib/modo-carrera/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await getCareerLeaderboard(50);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}
