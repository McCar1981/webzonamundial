// src/app/api/ligas/mis-predicciones-club/route.ts
//
// GET /api/ligas/mis-predicciones-club?fixtures=123,456,789
// Devuelve el balance del usuario en los partidos DE UN CLUB concreto.
//
// La ficha del club es ISR (se cachea igual para todo el mundo), así que lo
// personal no puede renderizarse en el servidor: se pide desde el cliente.
// La lista de partidos la manda la propia página (los del club que estás
// viendo), y aquí solo se cruza con el historial del usuario — así no hace
// falta resolver qué equipos juega cada fixture, que costaría cuota de
// api-football por partido.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserLigaPredictions } from "@/lib/ligas/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authed: false }, noStore);

  const raw = new URL(req.url).searchParams.get("fixtures") ?? "";
  const ids = new Set(
    raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n > 0).slice(0, 60)
  );
  if (ids.size === 0) {
    return NextResponse.json({ authed: true, total: 0, aciertos: 0, fallos: 0, pendientes: 0 }, noStore);
  }

  // Historial amplio: el usuario puede haber predicho hace semanas.
  const historial = await getUserLigaPredictions(user.id, 300).catch(() => []);
  const propias = historial.filter((p) => ids.has(p.fixtureId));

  const aciertos = propias.filter((p) => p.status === "won").length;
  const fallos = propias.filter((p) => p.status === "lost").length;
  const pendientes = propias.filter((p) => p.status === "pending").length;

  return NextResponse.json(
    {
      authed: true,
      total: propias.length,
      aciertos,
      fallos,
      pendientes,
      // Partidos de este club que aún puedes predecir (los que no tienen pick).
      sinPredecir: [...ids].filter((id) => !propias.some((p) => p.fixtureId === id)).length,
    },
    noStore
  );
}
