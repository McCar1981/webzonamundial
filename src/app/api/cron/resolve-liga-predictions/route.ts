// src/app/api/cron/resolve-liga-predictions/route.ts
//
// Resuelve las predicciones de Zona de Ligas (1X2 y marcador exacto) y abona
// Fútcoins a los aciertos. Cada ~15 min: busca fixtures con predicciones
// pendientes ya jugadas, lee su resultado real de api-football, marca
// acierto/fallo y paga a los ganadores.
//
// DORMIDO Y SEGURO hasta aplicar la migración 2026-42: si la tabla no existe
// (Postgres 42P01) devuelve { skipped: "not_migrated" } sin ruido ni error.
// El mercado "exact" (migración 2026-44) también es fail-soft: se sondea la
// columna `market` una vez por run y, si no existe aún, el cron se comporta
// exactamente como antes (los updates del 1X2 no tocan filas exact de todos
// modos, porque su pick es NULL y eq/neq sobre NULL no casan).
//
// Coste: solo consulta api-football por los fixtures que TIENEN predicciones
// pendientes (tope por run), no por todo el calendario. No confía en simulación.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getFixtureDetail } from "@/lib/competitions/api";
import { grantCoins } from "@/lib/economy/wallet";
import { consumeBoost, BOOST_REWARD } from "@/lib/ligas/boost";
import { resolveTypedMarket, MARKET_REWARD, TYPED_MARKETS, type TypedMarket, type MarketData } from "@/lib/ligas/predict-markets";
import { notifyResolvedLigaFixtures, type ResolvedLigaFixtureMeta } from "@/lib/ligas/notify";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REWARD_COINS = 10;
const EXACT_REWARD = 40; // el marcador exacto es mucho más difícil que el 1X2
const REWARD_XP = 5;
const FINISHED = new Set(["FT", "AET", "PEN"]);
const SETTLE_AFTER_MIN = 150; // margen tras el saque antes de intentar resolver
const MAX_FIXTURES_PER_RUN = 40; // tope de llamadas api-football por ejecución

function winnerOf(home: number | null, away: number | null): "home" | "draw" | "away" | null {
  if (home == null || away == null) return null;
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const admin = adminClient();
  const nowIso = new Date().toISOString();
  const cutoff = new Date(Date.now() - SETTLE_AFTER_MIN * 60_000).toISOString();

  // 1) Fixtures con predicciones pendientes cuyo saque fue hace rato.
  let pending: { fixture_id: number }[];
  try {
    const { data, error } = await admin
      .from("liga_predictions")
      .select("fixture_id")
      .eq("status", "pending")
      .lt("kickoff", cutoff)
      .limit(600);
    if (error) throw error;
    pending = (data ?? []) as { fixture_id: number }[];
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") {
      return NextResponse.json({ ok: true, skipped: "not_migrated" });
    }
    console.error("[resolve-liga] pending query failed", err);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  // Sonda de la migración 2026-44: ¿existe ya la columna `market`?
  const probe = await admin.from("liga_predictions").select("market").limit(1);
  const hasExact = !probe.error;
  // Sonda de la migración 2026-47: ¿existe la columna `data` (mercados tipados)?
  const typedProbe = await admin.from("liga_predictions").select("data").limit(1);
  const hasTyped = !typedProbe.error;
  const hasMarket = hasExact || hasTyped;

  const fixtureIds = [...new Set(pending.map((p) => p.fixture_id))].slice(0, MAX_FIXTURES_PER_RUN);
  let resolvedFixtures = 0;
  // Fixtures resueltos en ESTA pasada (para el push de payoff al final).
  const resolvedMeta = new Map<number, ResolvedLigaFixtureMeta>();
  for (const fid of fixtureIds) {
    const d = await getFixtureDetail(fid);
    if (!d || !FINISHED.has(d.fixture.status)) continue; // aún no terminado (o feed caído): se reintenta
    const w = winnerOf(d.fixture.score.home, d.fixture.score.away);
    if (!w) continue;
    // 1X2: marca ganadoras y perdedoras (atómico por fila; solo toca las 'pending').
    // Las filas del mercado exact tienen pick NULL: eq/neq sobre NULL no casan, así
    // que estos dos updates no las tocan ni antes ni después de la migración.
    await admin.from("liga_predictions").update({ status: "won", resolved_at: nowIso }).eq("fixture_id", fid).eq("status", "pending").eq("pick", w);
    await admin.from("liga_predictions").update({ status: "lost", resolved_at: nowIso }).eq("fixture_id", fid).eq("status", "pending").neq("pick", w);
    // Marcador exacto: acierta solo el resultado clavado (goles de api-football; en
    // partidos con prórroga cuenta el marcador tras la prórroga, sin penaltis — el
    // mismo criterio que winnerOf usa para el 1X2).
    if (hasExact) {
      const h = d.fixture.score.home as number;
      const a = d.fixture.score.away as number;
      await admin.from("liga_predictions").update({ status: "won", resolved_at: nowIso })
        .eq("fixture_id", fid).eq("status", "pending").eq("market", "exact")
        .eq("score_home", h).eq("score_away", a);
      await admin.from("liga_predictions").update({ status: "lost", resolved_at: nowIso })
        .eq("fixture_id", fid).eq("status", "pending").eq("market", "exact")
        .or(`score_home.neq.${h},score_away.neq.${a}`);
    }
    // Mercados tipados (2026-47): se resuelven en JS por fila con el detalle real
    // del partido. void (null) si no se puede determinar (p.ej. sin timeline de
    // goles) → no paga, pero tampoco falla mal.
    if (hasTyped) {
      const { data: typedRows } = await admin
        .from("liga_predictions")
        .select("id,market,data")
        .eq("fixture_id", fid)
        .eq("status", "pending")
        .in("market", TYPED_MARKETS as unknown as string[]);
      for (const tr of (typedRows ?? []) as unknown as { id: string; market: TypedMarket; data: MarketData }[]) {
        const verdict = resolveTypedMarket(tr.market, tr.data, d);
        const status = verdict === null ? "void" : verdict ? "won" : "lost";
        await admin.from("liga_predictions").update({ status, resolved_at: nowIso }).eq("id", tr.id).eq("status", "pending");
      }
    }
    resolvedMeta.set(fid, { label: `${d.fixture.home.name} ${d.fixture.score.home ?? 0}-${d.fixture.score.away ?? 0} ${d.fixture.away.name}` });
    resolvedFixtures++;
  }

  // 2) Reparto de Fútcoins a las ganadoras no pagadas. Idempotente estilo repo:
  //    se reclama la fila (rewarded=true) de forma atómica ANTES de abonar; si el
  //    abono falla, se hace rollback (rewarded=false) para reintentar sin doble pago.
  let paid = 0;
  // Lo realmente abonado en esta pasada ("uid:fixtureId" -> coins), para que el
  // push de payoff diga la cifra exacta (10, 30 con boost o 40 por exacto).
  const paidCoins = new Map<string, number>();
  type RewardRow = { id: string; user_id: string; fixture_id: number; market?: string | null };
  const { data: toReward } = await admin
    .from("liga_predictions")
    .select(hasMarket ? "id,user_id,fixture_id,market" : "id,user_id,fixture_id")
    .eq("status", "won")
    .eq("rewarded", false)
    .limit(300);
  for (const row of (toReward ?? []) as unknown as RewardRow[]) {
    const { data: claimed } = await admin
      .from("liga_predictions")
      .update({ rewarded: true })
      .eq("id", row.id)
      .eq("rewarded", false)
      .select("id")
      .maybeSingle();
    if (!claimed) continue; // otra ejecución ya lo reclamó
    let coins: number;
    if (row.market === "exact") {
      coins = EXACT_REWARD; // el boost aplica solo al 1X2 (aquí no se consume)
    } else if (row.market && row.market in MARKET_REWARD) {
      // Mercados tipados (2026-47): recompensa fija por mercado, sin boost.
      coins = MARKET_REWARD[row.market as TypedMarket];
    } else {
      // 1X2. Boost: si el usuario pagó por amplificar este partido, premio mayor.
      const boosted = await consumeBoost(row.user_id, row.fixture_id);
      coins = boosted ? BOOST_REWARD : REWARD_COINS;
    }
    try {
      await grantCoins(row.user_id, coins, REWARD_XP, { module: "otros" });
      paid++;
      const k = `${row.user_id}:${row.fixture_id}`;
      paidCoins.set(k, (paidCoins.get(k) ?? 0) + coins);
    } catch (err) {
      console.error("[resolve-liga] grant failed, rollback", row.id, err);
      await admin.from("liga_predictions").update({ rewarded: false }).eq("id", row.id);
    }
  }

  // 3) Push de payoff (aislado: un fallo aquí jamás toca resolución ni pagos).
  let notifyStats: Awaited<ReturnType<typeof notifyResolvedLigaFixtures>> | null = null;
  try {
    notifyStats = await notifyResolvedLigaFixtures(resolvedMeta, paidCoins);
  } catch (err) {
    console.error("[resolve-liga] notify failed (ignorado)", err);
  }

  try {
    await recordHeartbeat("resolve-liga-predictions");
  } catch {
    // heartbeat best-effort
  }
  return NextResponse.json({ ok: true, resolvedFixtures, paid, notify: notifyStats });
}
