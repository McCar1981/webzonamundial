// src/app/api/cron/resolve-liga-fantasy/route.ts
//
// Puntúa los onces del Fantasy de Zona de Ligas y abona Fútcoins por rendimiento.
// Cada ~30 min: busca jornadas con onces pendientes, y cuando TODOS los partidos
// de la jornada han terminado, puntúa cada once con las estadísticas reales de
// api-football (motor scorePlayer) y paga coins = puntos (tope 60).
//
// DORMIDO Y SEGURO hasta aplicar la migración 2026-43: si la tabla no existe
// (Postgres 42P01) devuelve { skipped: "not_migrated" } sin ruido ni error.
//
// Anti-trampa (contrato de /api/ligas/fantasy): la posición de cada jugador se
// RE-DERIVA de la plantilla real (getTeamSquad, cacheada); un `pos` manipulado en
// el pick no infla puntos. El capitán vale x2.
//
// Coste: 1 request de fixtures por jornada pendiente (tope por run) y, solo al
// cerrarse la jornada, stats por partido + plantillas — ambas cacheadas 7 días en
// KV, así que cada partido/plantilla se paga una vez por temporada de cron.

import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { getCompetition } from "@/data/competitions";
import { getCompetitionFixtures } from "@/lib/competitions/api";
import { getTeamSquad, getFixturePlayerStats, scorePlayer, type Position, type PlayerMatchStats } from "@/lib/ligas/fantasy";
import type { SquadPick } from "@/lib/ligas/fantasy-store";
import { grantCoins } from "@/lib/economy/wallet";
import { recordHeartbeat } from "@/lib/ops/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COINS = 60; // mismo techo por jornada que el fantasy del Mundial
const REWARD_XP = 8;
const MAX_ROUNDS_PER_RUN = 6; // tope de jornadas evaluadas por ejecución
const FINISHED = new Set(["FT", "AET", "PEN"]);
// Estados terminales sin partido jugado: no bloquean el cierre de la jornada.
const DEAD = new Set(["PST", "CANC", "ABD", "AWD", "WO"]);

export async function GET(req: Request) {
  const denied = requireCron(req);
  if (denied) return denied;

  const admin = adminClient();
  const nowIso = new Date().toISOString();

  // 1) Jornadas (competición + ronda) con onces pendientes.
  let pendingRows: { competition_slug: string; round: string }[];
  try {
    const { data, error } = await admin
      .from("liga_fantasy_picks")
      .select("competition_slug,round")
      .eq("status", "pending")
      .limit(500);
    if (error) throw error;
    pendingRows = (data ?? []) as { competition_slug: string; round: string }[];
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") {
      return NextResponse.json({ ok: true, skipped: "not_migrated" });
    }
    console.error("[resolve-liga-fantasy] pending query failed", err);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const pairs = [...new Map(pendingRows.map((r) => [`${r.competition_slug}|${r.round}`, r])).values()]
    .slice(0, MAX_ROUNDS_PER_RUN);

  let scoredPicks = 0;
  let voidedPicks = 0;
  for (const { competition_slug: slug, round } of pairs) {
    const comp = getCompetition(slug);
    if (!comp) continue; // slug desconocido (no debería pasar: el POST lo valida)

    const fixtures = await getCompetitionFixtures(comp.apiFootballId, { round });
    if (!fixtures.length) continue; // feed caído o ronda rara: se reintenta

    // La jornada solo se puntúa cuando TODOS sus partidos son terminales.
    const allSettled = fixtures.every((f) => FINISHED.has(f.status) || DEAD.has(f.status));
    if (!allSettled) continue;

    const played = fixtures.filter((f) => FINISHED.has(f.status));
    if (!played.length) {
      // Jornada entera suspendida/cancelada: onces anulados, sin premio.
      const { data: voided } = await admin
        .from("liga_fantasy_picks")
        .update({ status: "void", points: 0, rewarded: true, scored_at: nowIso })
        .eq("competition_slug", slug)
        .eq("round", round)
        .eq("status", "pending")
        .select("id");
      voidedPicks += (voided ?? []).length;
      continue;
    }
    // Un terminado sin marcador es un hueco del feed: reintentar más tarde.
    if (played.some((f) => f.score.home == null || f.score.away == null)) continue;

    // 2) Datos de la jornada: stats por jugador + goles encajados por equipo.
    const statsByPlayer = new Map<number, PlayerMatchStats>();
    const concededByTeam = new Map<number, number>();
    let statsMissing = false;
    // Se ACUMULA por jugador y por equipo en vez de sobrescribir: en las
    // eliminatorias a ida y vuelta (Libertadores, Sudamericana, Champions) una
    // misma ronda tiene DOS partidos del mismo equipo, y el segundo pisaba al
    // primero en el Map. Solo contaba un encuentro, así que los puntos —y las
    // Fútcoins— salían por debajo de lo real.
    for (const f of played) {
      concededByTeam.set(f.home.id, (concededByTeam.get(f.home.id) ?? 0) + (f.score.away ?? 0));
      concededByTeam.set(f.away.id, (concededByTeam.get(f.away.id) ?? 0) + (f.score.home ?? 0));
      const rows = await getFixturePlayerStats(f.fixtureId);
      if (!rows.length) { statsMissing = true; break; }
      for (const s of rows) {
        const prev = statsByPlayer.get(s.playerId);
        if (!prev) {
          statsByPlayer.set(s.playerId, { ...s });
          continue;
        }
        statsByPlayer.set(s.playerId, {
          ...prev,
          minutes: prev.minutes + s.minutes,
          goals: prev.goals + s.goals,
          assists: prev.assists + s.assists,
          yellow: prev.yellow + s.yellow,
          red: prev.red + s.red,
          // La nota se promedia entre los partidos que la traen (no se suma).
          rating:
            prev.rating != null && s.rating != null
              ? (prev.rating + s.rating) / 2
              : prev.rating ?? s.rating,
        });
      }
    }
    if (statsMissing) continue; // stats aún no publicadas: se reintenta

    // 3) Posición real desde las plantillas (cacheadas). Si no hay ninguna
    //    plantilla disponible, se reintenta en la próxima ejecución.
    const teamIds = [...new Set(played.flatMap((f) => [f.home.id, f.away.id]))];
    const squads = await Promise.all(teamIds.map((id) => getTeamSquad(id)));
    const posByPlayer = new Map<number, Position>();
    for (const squad of squads) for (const p of squad) posByPlayer.set(p.id, p.position);
    if (!posByPlayer.size) continue;

    // 4) Puntuar cada once pendiente de la jornada.
    const { data: picks } = await admin
      .from("liga_fantasy_picks")
      .select("id,players,captain_id")
      .eq("competition_slug", slug)
      .eq("round", round)
      .eq("status", "pending")
      .limit(500);
    for (const pick of (picks ?? []) as { id: string; players: SquadPick[]; captain_id: number | null }[]) {
      let total = 0;
      for (const pl of pick.players ?? []) {
        const s = statsByPlayer.get(pl.id);
        if (!s) continue; // no jugó esta jornada
        const pos = posByPlayer.get(pl.id) ?? pl.pos; // plantilla manda; fallback al pick
        let pts = scorePlayer(s, pos, concededByTeam.get(s.teamId) ?? 0);
        if (pick.captain_id === pl.id) pts *= 2;
        total += pts;
      }
      const { data: updated } = await admin
        .from("liga_fantasy_picks")
        .update({ status: "scored", points: total, scored_at: nowIso })
        .eq("id", pick.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (updated) scoredPicks++;
    }
  }

  // 5) Abono de Fútcoins (coins = puntos, tope 60). Idempotente estilo repo: se
  //    reclama la fila (rewarded=true) ANTES de abonar; si el abono falla se hace
  //    rollback para reintentar sin doble pago. Puntuaciones sin premio (<= 0) se
  //    cierran en bloque sin tocar la billetera.
  await admin
    .from("liga_fantasy_picks")
    .update({ rewarded: true })
    .eq("status", "scored")
    .eq("rewarded", false)
    .lte("points", 0);

  let paid = 0;
  const { data: toReward } = await admin
    .from("liga_fantasy_picks")
    .select("id,user_id,points")
    .eq("status", "scored")
    .eq("rewarded", false)
    .gt("points", 0)
    .limit(300);
  for (const row of (toReward ?? []) as { id: string; user_id: string; points: number }[]) {
    const { data: claimed } = await admin
      .from("liga_fantasy_picks")
      .update({ rewarded: true })
      .eq("id", row.id)
      .eq("rewarded", false)
      .select("id")
      .maybeSingle();
    if (!claimed) continue; // otra ejecución ya lo reclamó
    const coins = Math.min(row.points, MAX_COINS);
    try {
      await grantCoins(row.user_id, coins, REWARD_XP, { module: "fantasy" });
      paid++;
    } catch (err) {
      console.error("[resolve-liga-fantasy] grant failed, rollback", row.id, err);
      await admin.from("liga_fantasy_picks").update({ rewarded: false }).eq("id", row.id);
    }
  }

  try {
    await recordHeartbeat("resolve-liga-fantasy");
  } catch {
    // heartbeat best-effort
  }
  return NextResponse.json({ ok: true, rounds: pairs.length, scoredPicks, voidedPicks, paid });
}
