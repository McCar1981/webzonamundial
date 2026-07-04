// src/app/api/fantasy/team/route.ts
//
// GET  /api/fantasy/team → equipo del usuario autenticado (null si aún no tiene).
// PUT  /api/fantasy/team → guarda el equipo del usuario ({ state }).
//
// Persistencia real del Fantasy: sustituye al localStorage cuando hay sesión.
// El localStorage sigue actuando como modo invitado y se sincroniza al iniciar.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTeam, saveTeam, recordGameweekScore, awardGameweekCoins, sweepPendingGameweekCoins, autoAdvanceGameweeks, getFavCreator } from "@/lib/fantasy/store.server";
import { scoreGameweekFromState, recordProvisionalGameweek } from "@/lib/fantasy/scoring.server";
import { isValidGameweek, gameweekLockedForFree, gameweekFirstKickoff, playerMatchLocked, MATCH_LOCK_HOURS } from "@/lib/fantasy/fixtures";
import { isFantasyLive } from "@/lib/fantasy/season";
import { getPlayerById } from "@/lib/fantasy/players";
import { isEliminated } from "@/lib/fantasy/tournament";
import type { FantasyTeamState, GameweekLock, SquadSlot } from "@/lib/fantasy/types";
import { isPro } from "@/lib/pro/entitlement";
import { FREE_LIMITS, PRO_REQUIRED_CODE, type ProRequiredPayload } from "@/lib/pro/limits";
import { trackLimitHit } from "@/lib/pro/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Congela capitán/vice/power-up al primer saque de la jornada para impedir la
 * edición retroactiva (cambiar el capitán al goleador con el resultado ya visto).
 * Se fija desde el estado YA GUARDADO (`prev`), nunca del entrante, y es inmutable
 * una vez establecido para la jornada. Las sustituciones de jugadores no se tocan
 * (siguen contando: ese es el perk Pro). Devuelve el lock que debe quedar guardado.
 */
function computeGameweekLock(prev: FantasyTeamState | null, gw: number): GameweekLock | null {
  if (!isValidGameweek(gw) || !isFantasyLive()) {
    return prev?.gwLock && prev.gwLock.gw === gw ? prev.gwLock : null;
  }
  if (prev?.gwLock && prev.gwLock.gw === gw) return prev.gwLock; // inmutable una vez fijado
  const first = gameweekFirstKickoff(gw);
  if (!first || Date.now() < first.getTime()) return null; // la jornada aún no ha empezado
  if (!prev) return null; // sin estado previo no hay nada que congelar todavía
  return { gw, captainId: prev.captainId, viceId: prev.viceId, powerUp: prev.powerUp };
}

/**
 * Cierre por partido (3h): nombre del primer jugador CERRADO cuyo estado en
 * plantilla cambia entre `before` y `after` — entra, sale o se mueve entre
 * campo y banquillo (todo eso altera su puntuación). null si el guardado no
 * toca a ningún jugador cerrado. El orden del banquillo entre cerrados se
 * permite; entrar/salir del once, no.
 */
function lockedChangeBetween(before: SquadSlot[], after: SquadSlot[], gw: number): string | null {
  const statusOf = (slots: SquadSlot[]) => {
    const m = new Map<string, "field" | "bench">();
    for (const s of slots) if (s.playerId) m.set(s.playerId, s.bench ? "bench" : "field");
    return m;
  };
  const a = statusOf(before);
  const b = statusOf(after);
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    if ((a.get(id) ?? "out") === (b.get(id) ?? "out")) continue;
    const p = getPlayerById(id);
    if (p && playerMatchLocked(p.flag, gw)) return p.name;
  }
  return null;
}

/** Primer equipo (sin estado previo): nombre del primer jugador CERRADO que se
 * intenta alinear, o null. Evita el "retrovisor" de las altas nuevas a mitad de
 * jornada (fichar a quien ya jugó hoy sabiendo sus puntos). */
function firstLockedIn(slots: SquadSlot[], gw: number): string | null {
  for (const s of slots) {
    if (!s.playerId) continue;
    const p = getPlayerById(s.playerId);
    if (p && playerMatchLocked(p.flag, gw)) return p.name;
  }
  return null;
}

/**
 * ¿El guardado de un Free es una SUSTITUCIÓN EN VIVO (perk Pro) y no una
 * construcción/reparación del equipo? Solo cuenta como sustitución si un jugador
 * VIVO que YA estaba alineado sale o cambia de campo↔banquillo. Está PERMITIDO:
 * rellenar huecos vacíos (completar la plantilla) y quitar/reemplazar a jugadores
 * ELIMINADOS. El "retrovisor" lo sigue evitando el cierre por partido de 3h. Sin
 * esto, un Free sin equipo (o con el equipo lleno de eliminados) no podía ni
 * fichar durante la jornada. La capitanía/chip queda congelada por gwLock, así que
 * cambiarla no afecta a la puntuación y no hace falta bloquearla aquí.
 */
function freeInPlaySub(prev: FantasyTeamState, next: FantasyTeamState, gw: number): boolean {
  const statusOf = (slots: SquadSlot[]) => {
    const m = new Map<string, "field" | "bench">();
    for (const s of slots) if (s.playerId) m.set(s.playerId, s.bench ? "bench" : "field");
    return m;
  };
  const before = statusOf(prev.slots);
  const after = statusOf(next.slots);
  for (const [id, st] of before) {
    const p = getPlayerById(id);
    if (p && isEliminated(p.teamSlug, gw)) continue; // reemplazar eliminados: permitido
    if (after.get(id) !== st) return true; // un jugador VIVO salió o cambió de línea
  }
  return false;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // favCreator permite marcar el equipo con el creador del registro: el cliente
  // lo aplica al crear el equipo (o lo backfillea si aún no lo tenía).
  const [teamRaw, favCreator] = await Promise.all([getTeam(user.id), getFavCreator(user.id)]);
  // AUTO-AVANCE: si el usuario se quedó atascado en una jornada antigua (el
  // avance era manual y casi nadie confirmaba), lo lleva a la jornada VIGENTE del
  // torneo arrastrando los puntos ya registrados. Va PRIMERO para que todo lo de
  // abajo (provisional, monedas) opere sobre la jornada correcta. Best-effort.
  const team = teamRaw ? await autoAdvanceGameweeks(user.id, teamRaw).catch(() => teamRaw) : null;
  // Total PROVISIONAL en vivo: puntúa la jornada EN CURSO (ya avanzada) con datos
  // reales y la registra como provisional, para que el header, el ranking y las
  // ligas se muevan SIN esperar a confirmar la jornada entera. Va ANTES del
  // barrido de Fútcoins para que, si la jornada acaba de cerrar, las monedas se
  // abonen sobre el provisional ya registrado. Best-effort.
  const liveGameweek = team ? await recordProvisionalGameweek(user.id, team) : null;
  // Al abrir el juego, abona cualquier Fútcoin pendiente de una jornada ya cerrada
  // que se confirmó "pronto" (sus partidos acabaron antes que el cierre de ventana).
  // Idempotente; las monedas caen en la billetera aunque no se muestre toast aquí.
  await sweepPendingGameweekCoins(user.id).catch(() => {});
  return NextResponse.json({ team, favCreator, liveGameweek });
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

  // Leemos el equipo guardado UNA sola vez y lo reutilizamos para todo: bloqueo
  // Free, congelado de capitanía y confirmación server-authoritative.
  const prev = await getTeam(user.id);

  // ── Bloqueo del plan Free ──
  // La plantilla se congela 24h antes del primer partido de la jornada y
  // durante la jornada (Pro = sustituciones en vivo). Las escrituras que NO
  // tocan la alineación (confirmar puntos de jornada, metadatos) pasan igual.
  // El PRIMER equipo (sin estado previo) NO cuenta como cambio: un alta nueva a
  // mitad de jornada no es una sustitución en vivo, y bloquearla dejaba a los
  // registros de días de partido sin poder crear equipo. La equidad la pone el
  // cierre por partido de abajo (no pueden alinear a quien ya jugó).
  if (gameweekLockedForFree(state.gameweek, FREE_LIMITS.fantasy.lockHoursBeforeGameweek) &&
      !(await isPro(user.id, user.email))) {
    // Solo se bloquea una SUSTITUCIÓN EN VIVO de un jugador VIVO ya alineado (el
    // perk Pro). Construir el equipo (rellenar huecos) y reemplazar eliminados NO
    // se bloquea — el cierre por partido de abajo evita el retrovisor.
    const inPlaySub = prev ? freeInPlaySub(prev, state, state.gameweek) : false;
    if (inPlaySub) {
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

  // ── Cierre por partido (3h) — autoritativo para TODOS los planes ──
  // Un jugador queda cerrado desde MATCH_LOCK_HOURS antes del saque de SU
  // partido hasta confirmar la jornada: ni entra, ni sale, ni se mueve entre
  // campo y banquillo. Solo aplica a guardados de la MISMA jornada: al
  // confirmar (gw avanza) los slots pasan a ser la base de la siguiente, cuyos
  // partidos aún no llegaron. Cierra el hueco de las sustituciones en vivo Pro
  // (sacar a alguien tras verlo fallar / meterlo con la alineación filtrada).
  if ((!prev || state.gameweek === prev.gameweek) && isFantasyLive()) {
    // Con estado previo: solo los CAMBIOS de jugadores cerrados. Primer equipo
    // (sin previo): ningún jugador cerrado puede entrar — si no, un alta nueva
    // alinearía con retrovisor a quien ya jugó hoy y cobraría sus puntos.
    const lockedName = prev
      ? lockedChangeBetween(prev.slots, state.slots, state.gameweek)
      : firstLockedIn(state.slots, state.gameweek);
    if (lockedName) {
      return NextResponse.json(
        {
          error: `${lockedName} está cerrado: su partido empieza en menos de ${MATCH_LOCK_HOURS} h o ya se disputó. Podrás moverlo al confirmar la jornada.`,
          code: "MATCH_LOCKED",
        },
        { status: 409 },
      );
    }
  }

  // ── Congelado de capitán/vice/chip al primer saque (anti edición retroactiva) ──
  // Inmutable una vez fijado; derivado del estado guardado, no del entrante.
  state.gwLock = computeGameweekLock(prev, state.gameweek);

  // ── Confirmación de jornada SERVER-AUTHORITATIVE ──
  // El ranking y las Fútcoins NO pueden depender de los puntos que diga el
  // cliente (forjar 200/jornada sería trivial). Recalculamos desde el equipo
  // GUARDADO + datos reales, con el capitán/chip CONGELADO, e ignoramos
  // body.gameweekScore.points por completo.
  let reward = { coins: 0, xp: 0 };
  let gameweekPoints: number | null = null;
  let confirmed = false;
  if (body.gameweekScore && isValidGameweek(body.gameweekScore.gw) && isFantasyLive()) {
    const gw = body.gameweekScore.gw;
    // Solo se confirma la jornada vigente del usuario (evita replays y dobles cobros).
    if (prev && gw === prev.gameweek) {
      const sc = await scoreGameweekFromState({ ...prev, gwLock: state.gwLock }, gw);
      // Solo se registra al terminar TODOS los partidos del usuario (datos finales).
      if (sc.allFinished) {
        await recordGameweekScore(user.id, gw, sc.net, state.gwLock?.powerUp ?? prev.powerUp ?? null);
        const award = await awardGameweekCoins(user.id, gw, sc.net);
        const pending = await sweepPendingGameweekCoins(user.id);
        reward = { coins: award.coins + pending.coins, xp: award.xp + pending.xp };
        gameweekPoints = sc.net;
        confirmed = true;
      }
    }
  }

  await saveTeam(user.id, state);
  return NextResponse.json({ ok: true, confirmed, gameweekPoints, futcoins: reward.coins, xpAwarded: reward.xp });
}
