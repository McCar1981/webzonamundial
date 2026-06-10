// src/app/api/powerups/status/route.ts
// GET /api/powerups/status?pid=...      → estado de UNA compra (polling tras pagar)
// GET /api/powerups/status?match_id=... → comodines efectivos del usuario en un partido
// GET /api/powerups/status?wallet=1     → solo saldo del monedero de usos
//
// Solo lectura y siempre del propio usuario autenticado.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getCredits, getPurchase, type PackIntentPayload } from "@/lib/powerups/store";
import { getSession } from "@/lib/trivia/store";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

async function userCurrency(userId: string): Promise<"eur" | "usd"> {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", userId)
    .maybeSingle();
  return currencyForCountry(profile?.country ?? null);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const pid = request.nextUrl.searchParams.get("pid");
  const matchId = request.nextUrl.searchParams.get("match_id");
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (pid) {
    const purchase = await getPurchase(pid);
    if (!purchase || purchase.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // Para revives (uso directo o intent de un pack): estado real de la sesión,
    // para que el cliente sepa cuándo reanudar la partida y con qué racha.
    let trivia: { streak: number; revived: boolean } | null = null;
    const intentSku =
      purchase.sku === "pack3" ? (purchase.payload as PackIntentPayload | null)?.intent_sku : purchase.sku;
    if (intentSku === "trivia_revive" && purchase.trivia_session_id && purchase.status === "applied") {
      const session = await getSession(purchase.trivia_session_id);
      if (session) trivia = { streak: session.streak, revived: session.gameOver !== true };
    }
    return NextResponse.json(
      {
        status: purchase.status,
        sku: purchase.sku,
        error: purchase.error,
        trivia,
        credits: await getCredits(user.id),
      },
      { headers: NO_STORE },
    );
  }

  if (matchId) {
    const [{ data }, currency, credits] = await Promise.all([
      adminClient()
        .from("powerup_purchases")
        .select("sku,status,prediction_id")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .in("status", ["applied", "consumed"]),
      userCurrency(user.id),
      getCredits(user.id),
    ]);
    const rows = (data ?? []) as { sku: string; status: string; prediction_id: string | null }[];
    return NextResponse.json(
      {
        double_down: rows.some((r) => r.sku === "double_down"),
        second_chance_predictions: rows
          .filter((r) => r.sku === "second_chance" && r.prediction_id)
          .map((r) => r.prediction_id),
        // Para que la UI muestre el precio en la moneda que se cobrará.
        currency,
        credits,
      },
      { headers: NO_STORE },
    );
  }

  if (wallet) {
    const [currency, credits] = await Promise.all([userCurrency(user.id), getCredits(user.id)]);
    return NextResponse.json({ credits, currency }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
