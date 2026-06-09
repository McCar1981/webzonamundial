// src/app/api/modo-carrera/entitlement/route.ts
// GET /api/modo-carrera/entitlement
//
// Devuelve el estado de acceso del usuario al Modo Carrera premium para que el
// cliente pueda decidir qué mostrar (Temporada en Vivo desbloqueada vs embudo
// hacia el Pase DT). NO es el muro de seguridad: las features de coste real
// (api-football, IA) se vuelven a verificar server-side en sus propias rutas.
// Aquí solo informamos a la UI; falsearlo no concede nada.
//
//   { authed: boolean, paseDT: boolean, seasons: { remaining, retryAt } | null }
//
// `seasons` informa del cupo Free de temporadas (null si es Pro = ilimitado):
// la UI muestra "te quedan 2 hoy" o la cuenta atrás del lockout.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isPaseDT } from "@/lib/pasedt/entitlement";
import { peekSeasonQuota } from "@/lib/modo-carrera/season-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ authed: false, paseDT: false, seasons: null });
  }
  let paseDT = false;
  try {
    paseDT = await isPaseDT(user.email, user.id);
  } catch {
    // Degrada a sin acceso: nunca concedemos premium ante un fallo de KV.
    paseDT = false;
  }
  // Cupo de temporadas: solo aplica al plan Free.
  const seasons = paseDT ? null : await peekSeasonQuota(user.id);
  return NextResponse.json({ authed: true, paseDT, seasons });
}
