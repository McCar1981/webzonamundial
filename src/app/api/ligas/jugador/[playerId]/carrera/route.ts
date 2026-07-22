// src/app/api/ligas/jugador/[playerId]/carrera/route.ts
//
// Carrera completa (histórico) de un jugador — BAJO DEMANDA. La ficha la pide
// solo cuando el usuario abre la sección "Carrera" (es cara: 1 llamada a
// api-football por temporada). getPlayerCareer la cachea 30 días en KV.

import { NextResponse } from "next/server";
import { getPlayerCareer } from "@/lib/ligas/player";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { playerId: string } }) {
  const id = Number(params.playerId);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const career = await getPlayerCareer(id);
  return NextResponse.json({ career: career ?? null }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
}
