// src/app/api/admin/fantasy/advance-all/route.ts
//
// Soporte: BARRIDO que desatasca de golpe a todos los usuarios que se quedaron en
// una jornada antigua (el avance manual por "Confirmar" dejaba a casi todos en la
// J1). Los lleva a la jornada VIGENTE arrastrando sus puntos ya registrados, sin
// recalcular nada (anti-retrovisor). Protegido como el resto del panel: cookie de
// admin (zm_admin) o ADMIN_TOKEN. El auto-avance por usuario (GET /api/fantasy/team)
// hace lo mismo de forma pasiva; esto es para resolverlo YA en masa.

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { adminAutoAdvanceAll } from "@/lib/fantasy/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookie && (await isValidAdminCookie(cookie))) return true;
  const token = process.env.ADMIN_TOKEN;
  if (token) {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const query = req.nextUrl.searchParams.get("token") || "";
    if ((bearer || query) === token) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await adminAutoAdvanceAll();
  return NextResponse.json({ ok: true, ...r });
}
