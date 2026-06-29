// src/app/api/admin/fantasy/restore/route.ts
//
// Soporte: restaura/compensa el Fantasy de un usuario (víctima de un reinicio por
// error, etc.). Protegido como el resto del panel: cookie de admin (zm_admin, si
// ya entraste en /admin) o ADMIN_TOKEN (Bearer o ?token=). Usa service role para
// escribir la cuenta de OTRO usuario, que el cliente RLS no puede tocar.
//
// POST body:
//   { username: "castro2013",
//     autodraft?: true,                         // arma un equipo válido (respeta el cierre 3h)
//     setGameweekScore?: { gw: 1, points: 148 } // fija puntos de una jornada + recalcula total
//   }

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import {
  adminResolveUserId,
  adminGetTeam,
  adminSaveTeamState,
  adminSetGameweekScore,
} from "@/lib/fantasy/store.server";
import { autoDraft } from "@/lib/fantasy/coach";
import { defaultTeam } from "@/lib/fantasy/store";
import { isValidGameweek } from "@/lib/fantasy/fixtures";

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

  let body: {
    username?: string;
    autodraft?: boolean;
    setGameweekScore?: { gw: number; points: number };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  if (!username) return NextResponse.json({ error: "username requerido" }, { status: 400 });

  const userId = await adminResolveUserId(username);
  if (!userId) {
    return NextResponse.json({ error: `usuario '${username}' no encontrado` }, { status: 404 });
  }

  const result: Record<string, unknown> = { ok: true, username, userId };

  // 1) Auto-draft de un equipo VÁLIDO con los jugadores disponibles (el auto-draft
  //    ya excluye a los cerrados por el cierre de 3h, así que se puede guardar).
  if (body.autodraft) {
    const base = (await adminGetTeam(userId)) ?? defaultTeam();
    const { slots, captainId, viceId } = autoDraft(base.formation, base.gameweek);
    await adminSaveTeamState(userId, { ...base, slots, captainId, viceId });
    result.autodraft = { jugadores: slots.filter((s) => s.playerId).length, captainId, viceId };
  }

  // 2) Restaurar/compensar los puntos de una jornada (recalcula total_points).
  if (body.setGameweekScore && isValidGameweek(body.setGameweekScore.gw)) {
    const gw = body.setGameweekScore.gw;
    const points = Number(body.setGameweekScore.points);
    if (Number.isFinite(points)) {
      const total = await adminSetGameweekScore(userId, gw, points);
      result.setGameweekScore = { gw, points: Math.max(0, Math.round(points)), nuevoTotal: total };
    }
  }

  return NextResponse.json(result);
}
