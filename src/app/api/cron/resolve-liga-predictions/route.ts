// src/app/api/cron/resolve-liga-predictions/route.ts
//
// Resuelve las predicciones 1X2 de Zona de Ligas y abona Fútcoins a los aciertos.
// Cada ~15 min: busca fixtures con predicciones pendientes ya jugadas, lee su
// resultado real de api-football, marca acierto/fallo y paga a los ganadores.
//
// DORMIDO Y SEGURO hasta aplicar la migración 2026-42: si la tabla no existe
// (Postgres 42P01) devuelve { skipped: "not_migrated" } sin ruido ni error.
//
// Coste: solo consulta api-football por los fixtures que TIENEN predicciones
// pendientes (tope por run), no por todo el calendario. No confía en simulación.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getFixtureDetail } from "@/lib/competitions/api";
import { grantCoins } from "@/lib/economy/wallet";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REWARD_COINS = 10;
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

  const fixtureIds = [...new Set(pending.map((p) => p.fixture_id))].slice(0, MAX_FIXTURES_PER_RUN);
  let resolvedFixtures = 0;
  for (const fid of fixtureIds) {
    const d = await getFixtureDetail(fid);
    if (!d || !FINISHED.has(d.fixture.status)) continue; // aún no terminado (o feed caído): se reintenta
    const w = winnerOf(d.fixture.score.home, d.fixture.score.away);
    if (!w) continue;
    // Marca ganadoras y perdedoras (atómico por fila; solo toca las 'pending').
    await admin.from("liga_predictions").update({ status: "won", resolved_at: nowIso }).eq("fixture_id", fid).eq("status", "pending").eq("pick", w);
    await admin.from("liga_predictions").update({ status: "lost", resolved_at: nowIso }).eq("fixture_id", fid).eq("status", "pending").neq("pick", w);
    resolvedFixtures++;
  }

  // 2) Reparto de Fútcoins a las ganadoras no pagadas. Idempotente estilo repo:
  //    se reclama la fila (rewarded=true) de forma atómica ANTES de abonar; si el
  //    abono falla, se hace rollback (rewarded=false) para reintentar sin doble pago.
  let paid = 0;
  const { data: toReward } = await admin
    .from("liga_predictions")
    .select("id,user_id")
    .eq("status", "won")
    .eq("rewarded", false)
    .limit(300);
  for (const row of (toReward ?? []) as { id: string; user_id: string }[]) {
    const { data: claimed } = await admin
      .from("liga_predictions")
      .update({ rewarded: true })
      .eq("id", row.id)
      .eq("rewarded", false)
      .select("id")
      .maybeSingle();
    if (!claimed) continue; // otra ejecución ya lo reclamó
    try {
      await grantCoins(row.user_id, REWARD_COINS, REWARD_XP, { module: "otros" });
      paid++;
    } catch (err) {
      console.error("[resolve-liga] grant failed, rollback", row.id, err);
      await admin.from("liga_predictions").update({ rewarded: false }).eq("id", row.id);
    }
  }

  try {
    await recordHeartbeat("resolve-liga-predictions");
  } catch {
    // heartbeat best-effort
  }
  return NextResponse.json({ ok: true, resolvedFixtures, paid });
}
