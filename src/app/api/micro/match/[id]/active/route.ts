// GET /api/micro/match/[id]/active
//
// Micro-predicción ACTIVA ahora mismo en el partido. Es el endpoint que el
// navegador sondea (igual que /api/match-center/live/[id]) para mostrar la
// ventana en vivo con su timer. Incluye, si hay sesión, si el usuario ya
// respondió y su Cadena de Fuego actual.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getActiveMicro, myMicroResponses, currentFireChain } from "@/lib/micro/store";
import { fireTier } from "@/lib/micro/micro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const matchId = params.id;
  const micro = await getActiveMicro(matchId);

  const user = await getCurrentUser();
  let alreadyResponded = false;
  let myOption: string | null = null;
  let chain = 0;
  if (user) {
    chain = await currentFireChain(user.id, matchId);
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
    already_responded: alreadyResponded,
    my_option: myOption,
    fire_chain: { count: chain, multiplier: tier.multiplier, label: tier.label, emoji: tier.emoji },
  });
}
