// src/app/api/fantasy/team/route.ts
//
// GET  /api/fantasy/team → equipo del usuario autenticado (null si aún no tiene).
// PUT  /api/fantasy/team → guarda el equipo del usuario ({ state }).
//
// Persistencia real del Fantasy: sustituye al localStorage cuando hay sesión.
// El localStorage sigue actuando como modo invitado y se sincroniza al iniciar.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTeam, saveTeam, recordGameweekScore, awardGameweekCoins, sweepPendingGameweekCoins, getFavCreator } from "@/lib/fantasy/store.server";
import { draftConflictsForTeam, syncDraftClaims } from "@/lib/fantasy/leagues.server";
import { scoreGameweekFromState } from "@/lib/fantasy/scoring.server";
import { isValidGameweek, gameweekLockedForFree } from "@/lib/fantasy/fixtures";
import { isFantasyLive } from "@/lib/fantasy/season";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { isPro } from "@/lib/pro/entitlement";
import { FREE_LIMITS, PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // favCreator permite marcar el equipo con el creador del registro: el cliente
  // lo aplica al crear el equipo (o lo backfillea si aún no lo tenía).
  const [team, favCreator] = await Promise.all([getTeam(user.id), getFavCreator(user.id)]);
  // Al abrir el juego, abona cualquier Fútcoin pendiente de una jornada ya cerrada
  // que se confirmó "pronto" (sus partidos acabaron antes que el cierre de ventana).
  // Idempotente; las monedas caen en la billetera aunque no se muestre toast aquí.
  await sweepPendingGameweekCoins(user.id).catch(() => {});
  return NextResponse.json({ team, favCreator });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { state?: FantasyTeamState; gameweekScore?: { gw: number; points: number; powerUp: string | null } };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const state = body.state;
  if (!state || !Array.isArray(state.slots)) {
    return NextResponse.json({ error: "bad_request", message: "state inválido" }, { status: 400 });
  }

  // ── Bloqueo del plan Free ──
  // La plantilla se congela 24h antes del primer partido de la jornada y
  // durante la jornada (Pro = sustituciones en vivo). Las escrituras que NO
  // tocan la alineación (confirmar puntos de jornada, metadatos) pasan igual.
  if (gameweekLockedForFree(state.gameweek, FREE_LIMITS.fantasy.lockHoursBeforeGameweek) &&
      !(await isPro(user.id, user.email))) {
    const current = await getTeam(user.id);
    const lineup = (s: FantasyTeamState) =>
      JSON.stringify({ slots: s.slots, captain: s.captainId, vice: s.viceId, formation: s.formation });
    const lineupChanged = !current || lineup(current) !== lineup(state);
    if (lineupChanged) {
      trackLimitHit("fantasy_lock");
      const payload: ProRequiredPayload = {
        error: `Tu plantilla está cerrada desde ${FREE_LIMITS.fantasy.lockHoursBeforeGameweek} h antes de la jornada. Con Pro haces sustituciones en vivo.`,
        code: PRO_REQUIRED_CODE,
        feature: "fantasy_lock",
        limit: FREE_LIMITS.fantasy.lockHoursBeforeGameweek,
      };
      return NextResponse.json(payload, { status: 403 });
    }
  }

  // ── Exclusividad en liga Draft ──
  // Si el usuario está en una liga Draft y su NUEVA alineación incluye jugadores
  // que pertenecen a otro miembro, se rechaza el guardado (409) diciendo cuáles
  // y de quién son. Solo se comprueba si la lista de jugadores cambió: los
  // guardados de metadatos/confirmación con la misma plantilla pasan siempre
  // (así un conflicto heredado al unirse no bloquea confirmar la jornada).
  const newIds = state.slots.map((s) => s.playerId).filter((id): id is string => Boolean(id));
  {
    const saved = await getTeam(user.id);
    const savedIds = new Set((saved?.slots ?? []).map((s) => s.playerId).filter(Boolean) as string[]);
    const lineupChanged = newIds.length !== savedIds.size || newIds.some((id) => !savedIds.has(id));
    if (lineupChanged) {
      const { league, conflicts } = await draftConflictsForTeam(user.id, newIds);
      if (conflicts.length) {
        return NextResponse.json({
          error: "draft_conflict",
          league,
          conflicts,
          message: `En tu liga Draft "${league}" esos jugadores ya tienen dueño.`,
        }, { status: 409 });
      }
    }
  }

  // ── Confirmación de jornada SERVER-AUTHORITATIVE ──
  // El ranking y las Fútcoins NO pueden depender de los puntos que diga el
  // cliente (forjar 200/jornada sería trivial). Recalculamos desde el equipo
  // GUARDADO (el que jugó, antes de avanzar) + datos reales, e ignoramos
  // body.gameweekScore.points por completo. Leemos `prev` ANTES de guardar el
  // estado avanzado para puntuar la alineación correcta.
  let reward = { coins: 0, xp: 0 };
  let gameweekPoints: number | null = null;
  let confirmed = false;
  if (body.gameweekScore && isValidGameweek(body.gameweekScore.gw) && isFantasyLive()) {
    const gw = body.gameweekScore.gw;
    const prev = await getTeam(user.id);
    // Solo se confirma la jornada vigente del usuario (evita replays y dobles cobros).
    if (prev && gw === prev.gameweek) {
      const sc = await scoreGameweekFromState(prev, gw);
      // Solo se registra al terminar TODOS los partidos del usuario (datos finales).
      if (sc.allFinished) {
        await recordGameweekScore(user.id, gw, sc.net, prev.powerUp ?? null);
        const award = await awardGameweekCoins(user.id, gw, sc.net);
        const pending = await sweepPendingGameweekCoins(user.id);
        reward = { coins: award.coins + pending.coins, xp: award.xp + pending.xp };
        gameweekPoints = sc.net;
        confirmed = true;
      }
    }
  }

  await saveTeam(user.id, state);
  // Liga Draft: tras guardar, sincroniza los claims (libera vendidos, reclama
  // nuevos). Si una carrera de guardados simultáneos dejó algún jugador en manos
  // de otro, se devuelve como aviso (el próximo cambio de alineación lo exigirá).
  const draftWarnings = await syncDraftClaims(user.id, newIds).catch(() => []);
  return NextResponse.json({ ok: true, confirmed, gameweekPoints, futcoins: reward.coins, xpAwarded: reward.xp, draftWarnings });
}
