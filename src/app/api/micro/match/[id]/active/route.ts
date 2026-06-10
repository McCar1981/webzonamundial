// GET /api/micro/match/[id]/active
//
// Micro-predicción ACTIVA ahora mismo en el partido. Es el endpoint que el
// navegador sondea (igual que /api/match-center/live/[id]) para mostrar la
// ventana en vivo con su timer. Incluye, si hay sesión, si el usuario ya
// respondió y su Cadena de Fuego actual.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getActiveMicro, latestClosedMicro, myMicroResponses, currentFireChain, latestResolvedResult } from "@/lib/micro/store";
import { fireTier } from "@/lib/micro/micro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const matchId = params.id;
  const micro = await getActiveMicro(matchId);

  // ?arrival=1 → primer sondeo tras cargar la página (típicamente al tocar el
  // push). Si la ventana ya venció, devolvemos la última micro cerrada para que
  // la UI explique "llegaste tarde" en vez de no mostrar nada. Solo en ese
  // primer sondeo: no encarece el polling continuo.
  const arrival = new URL(req.url).searchParams.get("arrival") === "1";
  const lastClosed = !micro && arrival ? await latestClosedMicro(matchId) : null;

  const user = await getCurrentUser();
  let alreadyResponded = false;
  let myOption: string | null = null;
  let chain = 0;
  let recentResult = null;
  if (user) {
    chain = await currentFireChain(user.id, matchId);
    recentResult = await latestResolvedResult(user.id, matchId);
    if (micro) {
      const mine = await myMicroResponses(user.id, matchId);
      const r = mine.find((x) => x.micro_id === micro.id);
      if (r) { alreadyResponded = true; myOption = r.selected_option; }
    }
  }
  const tier = fireTier(chain);

  return NextResponse.json({
    match_id: matchId,
    micro: micro
      ? {
          id: micro.id,
          kind: micro.kind,
          category: micro.category,
          emoji: micro.trigger_data?.emoji ?? "⚡",
          question: micro.question,
          options: micro.options,
          window_seconds: micro.window_seconds,
          base_points: micro.base_points,
          match_multiplier: micro.match_multiplier,
          activated_at: micro.activated_at,
          closes_at: micro.closes_at,
        }
      : null,
    last_closed: lastClosed
      ? {
          id: lastClosed.id,
          emoji: lastClosed.trigger_data?.emoji ?? "⚡",
          question: lastClosed.question,
          options: lastClosed.options,
          status: lastClosed.status,
          correct_option: lastClosed.correct_option,
          closes_at: lastClosed.closes_at,
        }
      : null,
    already_responded: alreadyResponded,
    my_option: myOption,
    fire_chain: { count: chain, multiplier: tier.multiplier, label: tier.label, emoji: tier.emoji },
    recent_result: recentResult,
  });
}
