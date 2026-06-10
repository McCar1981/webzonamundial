// src/app/api/powerups/checkout/route.ts
// POST /api/powerups/checkout — crea la Stripe Checkout Session de un comodín.
//
// Body: { sku, prediction_id?, payload?, match_id?, trivia_session_id? }
//   · second_chance → prediction_id + payload (el nuevo pick)
//   · double_down   → match_id
//   · trivia_revive → trivia_session_id
//
// La elegibilidad se valida AQUÍ (para no cobrar a quien no puede usarlo) y se
// REVALIDA en el webhook al aplicar (la ventana pudo cerrarse mientras pagaba;
// en ese caso, refund automático). La moneda la fija el servidor según
// profiles.country, igual que el Founders Pass (anti-arbitraje).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, rateLimitByUser } from "@/lib/auth-helpers";
import { getStripe } from "@/lib/stripe/client";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/predictions/admin";
import { POWERUPS, isPowerupSku, powerupPrice } from "@/lib/powerups/catalog";
import {
  SECOND_CHANCE_TYPES,
  activeDoubleDown,
  attachStripeSession,
  createPendingPurchase,
  secondChanceUsed,
  secondChanceWindow,
} from "@/lib/powerups/store";
import { checkOpen, validatePredictionData } from "@/lib/predictions/rules";
import { getMatchMeta } from "@/lib/predictions/match-data";
import { getSession } from "@/lib/trivia/store";
import type { PredictionData, PredictionRow } from "@/lib/predictions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "zonamundial.app";
  const finalProto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : proto;
  return `${finalProto}://${host}`;
}

interface Body {
  sku?: string;
  prediction_id?: string;
  payload?: PredictionData;
  match_id?: string;
  trivia_session_id?: string;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "no_session", message: "Inicia sesión para comprar comodines" }, { status: 401 });
  }

  const rl = await rateLimitByUser(user.id, "powerups:checkout", 10, 60);
  if (rl.limited) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.sku || !isPowerupSku(body.sku)) {
    return NextResponse.json({ error: "bad_sku" }, { status: 400 });
  }
  const sku = body.sku;
  const def = POWERUPS[sku];

  // ── Elegibilidad por SKU (contexto que viajará en la fila pending) ─────────
  let matchId: string | null = null;
  let predictionId: string | null = null;
  let triviaSessionId: string | null = null;
  let payload: PredictionData | null = null;
  // Vuelta tras el pago: predicciones → la página del juego; trivia → su pestaña.
  let backPath = "/app/predicciones/jugar";

  if (sku === "second_chance") {
    if (!body.prediction_id || !body.payload) {
      return NextResponse.json({ error: "bad_request", message: "prediction_id y payload requeridos" }, { status: 400 });
    }
    const { data } = await adminClient()
      .from("predictions")
      .select("*")
      .eq("id", body.prediction_id)
      .maybeSingle();
    const row = data as PredictionRow | null;
    if (!row || row.user_id !== user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (row.resolved_at) return NextResponse.json({ error: "already_resolved", message: "Esta predicción ya se resolvió" }, { status: 409 });
    if (row.secured_at) return NextResponse.json({ error: "secured", message: "Ya aseguraste esta predicción" }, { status: 409 });
    if (!SECOND_CHANCE_TYPES.includes(row.prediction_type as (typeof SECOND_CHANCE_TYPES)[number])) {
      return NextResponse.json({ error: "bad_type", message: "Este mercado no admite Segunda Oportunidad" }, { status: 400 });
    }
    // Si la ventana normal sigue abierta, que edite gratis (no le cobramos).
    if (checkOpen(row.match_id, row.prediction_type, false).open) {
      return NextResponse.json({ error: "still_open", message: "Aún puedes editar gratis esta predicción" }, { status: 409 });
    }
    const win = await secondChanceWindow(row.match_id);
    if (!win.ok) return NextResponse.json({ error: win.error, message: win.message }, { status: 409 });

    if (await secondChanceUsed(user.id, row.id)) {
      return NextResponse.json({ error: "already_used", message: "Ya usaste tu Segunda Oportunidad en esta predicción" }, { status: 409 });
    }
    // Equidad p2p: con un pique 1v1 vivo en este partido no se cambia el pick.
    const { count: piques } = await adminClient()
      .from("prediction_challenges")
      .select("id", { count: "exact", head: true })
      .eq("match_id", row.match_id)
      .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in("status", ["open", "accepted"]);
    if ((piques ?? 0) > 0) {
      return NextResponse.json({ error: "challenge_active", message: "Tienes un pique 1v1 en este partido: el pick queda sellado" }, { status: 409 });
    }
    const v = validatePredictionData(row.prediction_type, body.payload, true, row.match_id);
    if (!v.ok) return NextResponse.json(v, { status: 400 });
    if (JSON.stringify(body.payload) === JSON.stringify(row.prediction_data)) {
      return NextResponse.json({ error: "same_pick", message: "El nuevo pick es igual al actual" }, { status: 400 });
    }
    matchId = row.match_id;
    predictionId = row.id;
    payload = body.payload;
  } else if (sku === "double_down") {
    if (!body.match_id) return NextResponse.json({ error: "bad_request", message: "match_id requerido" }, { status: 400 });
    if (!getMatchMeta(body.match_id)?.kickoff_at) {
      return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    }
    // Se compra a ciegas: solo mientras las predicciones siguen abiertas.
    if (!checkOpen(body.match_id, "winner", false).open) {
      return NextResponse.json({ error: "closed", message: "Las predicciones de este partido ya cerraron" }, { status: 409 });
    }
    if (await activeDoubleDown(user.id, body.match_id)) {
      return NextResponse.json({ error: "already_active", message: "Ya tienes un Partido x2 en este partido" }, { status: 409 });
    }
    matchId = body.match_id;
  } else {
    // trivia_revive
    if (!body.trivia_session_id) {
      return NextResponse.json({ error: "bad_request", message: "trivia_session_id requerido" }, { status: 400 });
    }
    const session = await getSession(body.trivia_session_id);
    if (!session) return NextResponse.json({ error: "session_expired", message: "Tu partida expiró" }, { status: 404 });
    if (session.finished) return NextResponse.json({ error: "finished", message: "La partida ya terminó" }, { status: 409 });
    if (session.mode !== "muerte-subita") {
      return NextResponse.json({ error: "bad_mode", message: "Salvarracha solo está en Muerte Súbita" }, { status: 400 });
    }
    if (!session.gameOver) return NextResponse.json({ error: "not_game_over", message: "Tu partida sigue viva" }, { status: 409 });
    if ((session.revives ?? 0) >= 1) {
      return NextResponse.json({ error: "revive_limit", message: "Solo un revive por partida" }, { status: 409 });
    }
    triviaSessionId = body.trivia_session_id;
    backPath = "/trivia";
  }

  // ── Moneda por país del perfil (misma política que el Founders Pass) ───────
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();
  const currency = currencyForCountry(profile?.country ?? null);
  const price = powerupPrice(sku, currency);
  const origin = getOrigin(request);

  try {
    const purchase = await createPendingPurchase({
      userId: user.id,
      sku,
      amount: price.amount,
      currency,
      matchId,
      predictionId,
      triviaSessionId,
      payload,
    });

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      customer_email: user.email,
      // Compra impulsiva atada al estado del partido/partida: la sesión caduca
      // a los 30 min (mínimo de Stripe) para acotar los pagos tardíos.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: price.amount,
            product_data: {
              name: `${def.emoji} ${def.name} · ZonaMundial`,
              description: def.description,
            },
          },
        },
      ],
      metadata: {
        product: "powerup",
        purchase_id: purchase.id,
        sku,
        user_id: user.id,
        email: user.email,
      },
      payment_intent_data: {
        metadata: { product: "powerup", purchase_id: purchase.id, sku },
        receipt_email: user.email,
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/pago/comodin?pid=${purchase.id}&back=${encodeURIComponent(backPath)}`,
      cancel_url: `${origin}${backPath}?powerup=cancel`,
      allow_promotion_codes: false,
      locale: currency === "usd" ? "es-419" : "es",
    });

    await attachStripeSession(purchase.id, checkoutSession.id);
    return NextResponse.json({ url: checkoutSession.url, purchase_id: purchase.id });
  } catch (err) {
    const e = err as Error & { type?: string; code?: string };
    console.error("[powerups checkout] failed", {
      message: e.message, type: e.type, code: e.code, sku, userEmail: user.email,
    });
    return NextResponse.json(
      { error: "checkout_failed", message: "No pudimos iniciar el pago. Inténtalo de nuevo en un momento." },
      { status: 500 },
    );
  }
}
