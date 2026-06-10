// src/app/api/powerups/status/route.ts
// GET /api/powerups/status?pid=...      → estado de UNA compra (polling tras pagar)
// GET /api/powerups/status?match_id=... → comodines efectivos del usuario en un partido
//
// Solo lectura y siempre del propio usuario autenticado.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getPurchase } from "@/lib/powerups/store";
import { getSession } from "@/lib/trivia/store";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const pid = request.nextUrl.searchParams.get("pid");
  const matchId = request.nextUrl.searchParams.get("match_id");

  if (pid) {
    const purchase = await getPurchase(pid);
    if (!purchase || purchase.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // El revive aplicado devuelve la racha restaurada para rehidratar la UI.
    let trivia: { streak: number } | null = null;
    if (purchase.sku === "trivia_revive" && purchase.status === "applied" && purchase.trivia_session_id) {
      const session = await getSession(purchase.trivia_session_id);
      if (session) trivia = { streak: session.streak };
    }
    return NextResponse.json(
      { status: purchase.status, sku: purchase.sku, error: purchase.error, trivia },
      { headers: NO_STORE },
    );
  }

  if (matchId) {
    const supabase = createSupabaseServerClient();
    const [{ data }, { data: profile }] = await Promise.all([
      adminClient()
        .from("powerup_purchases")
        .select("sku,status,prediction_id")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .in("status", ["applied", "consumed"]),
      supabase.from("profiles").select("country").eq("id", user.id).maybeSingle(),
    ]);
    const rows = (data ?? []) as { sku: string; status: string; prediction_id: string | null }[];
    return NextResponse.json(
      {
        double_down: rows.some((r) => r.sku === "double_down"),
        second_chance_predictions: rows
          .filter((r) => r.sku === "second_chance" && r.prediction_id)
          .map((r) => r.prediction_id),
        // Para que la UI muestre el precio en la moneda que se cobrará.
        currency: currencyForCountry(profile?.country ?? null),
      },
      { headers: NO_STORE },
    );
  }

  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
