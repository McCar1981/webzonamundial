// src/app/api/modo-carrera/save/route.ts
//
// GET  /api/modo-carrera/save → partida del usuario autenticado (null si no tiene).
// PUT  /api/modo-carrera/save → guarda la partida del usuario ({ state }).
//
// Persistencia real del Modo Carrera: sustituye al localStorage cuando hay
// sesión. El localStorage sigue actuando como modo invitado y se sincroniza al
// iniciar sesión (igual que el Fantasy).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCareer, saveCareer, settleCareerMissionRewards } from "@/lib/modo-carrera/store.server";
import { allowSave, SAVE_WINDOW_SEC } from "@/lib/modo-carrera/save-rate-limit";
import { consumeSeasonQuota, isNewSeasonStart } from "@/lib/modo-carrera/season-quota";
import type { CareerState } from "@/lib/modo-carrera/types";
import { isPro } from "@/lib/pro/entitlement";
import { FREE_LIMITS, PRO_REQUIRED_CODE } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const career = await getCareer(user.id);
  return NextResponse.json({ career });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { state?: CareerState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const state = body.state;
  if (!state || typeof state !== "object" || !state.identity) {
    return NextResponse.json({ error: "bad_request", message: "state inválido" }, { status: 400 });
  }

  // Anti-abuso: 1 guardado por ventana de SAVE_WINDOW_SEC por usuario.
  if (!(await allowSave(user.id))) {
    return NextResponse.json(
      { error: "rate_limited", message: "Demasiados guardados seguidos." },
      { status: 429, headers: { "Retry-After": String(SAVE_WINDOW_SEC) } },
    );
  }

  // ── Cupo de temporadas del plan Free ──
  // Si este guardado arranca un torneo NUEVO, consume cupo: máx. N temporadas y
  // lockout de 12h al agotarlas. Pro = ilimitado. La detección es autoritativa
  // (isNewSeasonStart): no se fía solo del contador que manda el cliente, sino
  // de la identidad del sorteo y del progreso — re-rollear el torneo sin subir
  // progression.season también consume. El primer sync de una carrera local no
  // cuenta (no hay estado previo con el que comparar).
  const stored = await getCareer(user.id);
  if (isNewSeasonStart(stored, state) && !(await isPro(user.id, user.email))) {
    const q = await consumeSeasonQuota(user.id);
    if (!q.allowed) {
      trackLimitHit("carrera_seasons");
      return NextResponse.json(
        {
          error: `Has jugado tus ${FREE_LIMITS.carrera.maxSeasonsPerDay} temporadas. Continúa en unas horas o pásate a Pro para jugar sin límite.`,
          code: PRO_REQUIRED_CODE,
          feature: "carrera_seasons",
          limit: FREE_LIMITS.carrera.maxSeasonsPerDay,
          retry_at: q.retryAt,
        },
        { status: 403 },
      );
    }
  }

  await saveCareer(user.id, state);
  // Abona Fútcoins de las misiones recién reclamadas (idempotente por misión; el
  // importe se deriva de la plantilla del servidor, no de los números del cliente).
  const reward = await settleCareerMissionRewards(user.id, state);
  return NextResponse.json({ ok: true, futcoins: reward.coins, xpAwarded: reward.xp });
}
