// /api/match-center/follow
//
// "Seguir partido" (efecto pin de Google). El cliente, que ya tiene permiso de
// push y una suscripción activa, registra/quita su endpoint en el set de
// seguidores del partido. El cron del Match Center les mandará la notificación
// FIJADA que se actualiza con el marcador y el minuto.
//
//   POST  { matchId, follow: boolean, subscription }  → seguir/dejar de seguir
//   GET   ?matchId=&endpoint=                          → ¿lo sigue este browser?

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { resolveMatchId } from "@/lib/match-center/slug";
import {
  followMatch,
  unfollowMatch,
  isFollowing,
} from "@/lib/match-center/followers";
import { savePushSubscription, type BrowserSubscription } from "@/lib/push-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  matchId?: number | string;
  follow?: boolean;
  subscription?: BrowserSubscription;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const matchId =
    typeof body.matchId === "number"
      ? body.matchId
      : typeof body.matchId === "string"
      ? resolveMatchId(body.matchId)
      : null;
  if (matchId == null) {
    return NextResponse.json({ error: "invalid_match" }, { status: 400 });
  }

  const sub = body.subscription;
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.keys ||
    typeof sub.keys.p256dh !== "string" ||
    typeof sub.keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  // Garantiza que la suscripción está persistida (necesitamos sus claves para
  // enviarle el push fijado). UPSERT por endpoint; no toca kinds si ya existe
  // porque pasamos las suyas implícitas vía el flujo normal — aquí solo
  // aseguramos la fila con la categoría del torneo.
  await savePushSubscription({
    subscription: sub,
    userId: user.id,
    userAgent: request.headers.get("user-agent") ?? undefined,
    kinds: ["tournament-key-events"],
  });

  if (body.follow === false) {
    await unfollowMatch(matchId, sub.endpoint);
    return NextResponse.json({ ok: true, following: false });
  }

  await followMatch(matchId, sub.endpoint);
  return NextResponse.json({ ok: true, following: true });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const raw = sp.get("matchId");
  const endpoint = sp.get("endpoint") ?? "";
  const matchId = raw ? resolveMatchId(raw) : null;
  if (matchId == null || !endpoint) {
    return NextResponse.json({ ok: false, following: false });
  }
  const following = await isFollowing(matchId, endpoint);
  return NextResponse.json({ ok: true, following });
}
