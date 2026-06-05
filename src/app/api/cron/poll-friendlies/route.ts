// src/app/api/cron/poll-friendlies/route.ts
//
// Cron de polling de AMISTOSOS de selecciones (api-football liga 10). Corre cada
// minuto. En cada pasada:
//   1. Descubre los amistosos relevantes (en vivo ahora + los de hoy/mañana UTC).
//   2. Para los que merece la pena sondear (en juego, recién terminados o a punto
//      de empezar) trae el snapshot (fixture + eventos + alineaciones).
//   3. Compara con el estado guardado en KV (FriendlyState) y manda UN push por
//      cada novedad: alineaciones, inicio, gol, roja, penalti fallado, descanso
//      y final. Los flags/seenEventIds evitan duplicar el mismo aviso.
//
// Auth idéntico al resto de crones: Authorization: Bearer ${CRON_SECRET}
// o ?secret=XXX. Es idempotente: si no hay novedades, no manda nada.

import { NextResponse } from "next/server";
import {
  fetchFriendliesByDate,
  fetchFriendlySnapshot,
  fetchLiveFriendlies,
  apiFootballEnabled,
} from "@/lib/friendlies/api";
import {
  getFriendlyState,
  saveFriendlyState,
} from "@/lib/friendlies/store";
import {
  isFinishedStatus,
  isLiveStatus,
  type FriendlyEvent,
  type FriendlyFixture,
  type FriendlySnapshot,
  type FriendlyState,
  type Score,
} from "@/lib/friendlies/types";
import { broadcastPush, type PushPayload } from "@/lib/push-notifications";
import { esName, favoritePhoto } from "@/lib/friendlies/teamInfo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PUSH_KIND = "amistosos";
const PUSH_ICON = "/img/email/logo-zonamundial.png";
const PUSH_URL = "/amistosos";

/** Deep-link directo al detalle del partido (la página /amistosos lee ?match). */
function matchUrl(fixtureId: number): string {
  return `${PUSH_URL}?match=${fixtureId}`;
}

/** Escudo/bandera del equipo de un evento (para usar como icono del push). */
function eventIcon(e: FriendlyEvent, s: FriendlySnapshot): string {
  if (e.side === "home") return s.home.logo || PUSH_ICON;
  if (e.side === "away") return s.away.logo || PUSH_ICON;
  return PUSH_ICON;
}

/** Sufijo con la sede, si la API la provee, para enriquecer el cuerpo. */
function venueSuffix(s: FriendlySnapshot): string {
  const place = [s.venue, s.city].filter(Boolean).join(", ");
  return place ? ` · ${place}` : "";
}

// Cuánto antes del saque empezamos a sondear (para pillar las alineaciones).
const PREKICK_WINDOW_MS = 30 * 60_000;
// Cuánto después de terminar seguimos sondeando (para asegurar el push de final).
const POSTMATCH_WINDOW_MS = 10 * 60_000;
// Margen para responder dentro del maxDuration aunque haya muchos partidos.
const TIME_BUDGET_MS = 50_000;

function utcDate(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** ¿Conviene gastar llamadas a la API sondeando este fixture ahora mismo? */
function shouldPoll(fix: FriendlyFixture, now: number): boolean {
  if (isLiveStatus(fix.status)) return true;
  const kickoff = new Date(fix.date).getTime();
  if (Number.isNaN(kickoff)) return false;
  // Está a punto de empezar (ventana de alineaciones).
  if (fix.status === "NS" && kickoff - now <= PREKICK_WINDOW_MS && kickoff > now) {
    return true;
  }
  // Acaba de terminar: una pasada más para garantizar el push de final.
  if (isFinishedStatus(fix.status) && now - kickoff <= POSTMATCH_WINDOW_MS + 150 * 60_000) {
    return true;
  }
  return false;
}

/** "Local vs Visitante" con los nombres ya traducidos al español. */
function vsText(homeEs: string, awayEs: string): string {
  return `${homeEs} vs ${awayEs}`;
}

function scoreText(goals: Score): string {
  return `${goals[0] ?? 0}-${goals[1] ?? 0}`;
}

function eventLabel(
  e: FriendlyEvent,
  s: FriendlySnapshot,
  homeEs: string,
  awayEs: string,
): {
  title: string;
  body: string;
  icon: string;
} | null {
  // "country" del evento = la selección (en español). "player" = api-football.
  const team = e.side === "home" ? homeEs : e.side === "away" ? awayEs : "";
  const player = e.player?.trim() || "";
  const min = `${e.minute}'${e.extra ? `+${e.extra}` : ""}`;
  const icon = eventIcon(e, s);
  const vs = vsText(homeEs, awayEs);
  switch (e.type) {
    case "goal":
    case "penalty_goal": {
      const pen = e.type === "penalty_goal" ? " de penalti" : "";
      // Título con jugador y país; si no hay nombre, solo el país.
      const head = player ? `GOL de ${player} (${team})${pen}` : `GOL${pen} de ${team}`;
      return {
        title: head,
        body: `${min} · ${vs} ${scoreText(s.goals)}${e.assist ? ` · asist. ${e.assist}` : ""}`,
        icon,
      };
    }
    case "own_goal":
      return {
        title: player ? `GOL en propia de ${player} (${team})` : `GOL en propia (${team})`,
        body: `${min} · ${vs} ${scoreText(s.goals)}`,
        icon,
      };
    case "penalty_miss":
      return {
        title: player ? `Penalti fallado por ${player} (${team})` : `Penalti fallado (${team})`,
        body: `${min} · ${vs}`,
        icon,
      };
    case "red":
      return {
        title: player ? `Tarjeta roja a ${player} (${team})` : `Tarjeta roja (${team})`,
        body: `${min} · ${vs} ${scoreText(s.goals)}`,
        icon,
      };
    case "second_yellow":
      return {
        title: player
          ? `Tarjeta roja (doble amarilla) a ${player} (${team})`
          : `Tarjeta roja (doble amarilla) (${team})`,
        body: `${min} · ${vs} ${scoreText(s.goals)}`,
        icon,
      };
    default:
      return null;
  }
}

async function push(payload: PushPayload): Promise<void> {
  await broadcastPush({ kind: PUSH_KIND, payload });
}

export async function GET(req: Request) {
  const startMs = Date.now();

  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerOk = auth === `Bearer ${expected}`;
    const queryOk = new URL(req.url).searchParams.get("secret") === expected;
    if (!headerOk && !queryOk) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!apiFootballEnabled()) {
    return NextResponse.json(
      { error: "api_not_configured", message: "API_SPORTS_KEY requerida" },
      { status: 500 },
    );
  }

  const now = Date.now();

  // 1) Descubre candidatos: en vivo + agenda de hoy y mañana (UTC), sin duplicar.
  const [live, today, tomorrow] = await Promise.all([
    fetchLiveFriendlies(),
    fetchFriendliesByDate(utcDate(0)),
    fetchFriendliesByDate(utcDate(1)),
  ]);
  const byId = new Map<number, FriendlyFixture>();
  for (const f of [...live, ...today, ...tomorrow]) byId.set(f.fixtureId, f);

  const candidates = [...byId.values()].filter((f) => shouldPoll(f, now));

  let pushes = 0;
  const touched: number[] = [];

  for (const fix of candidates) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break; // sigue en la próxima pasada

    const snap = await fetchFriendlySnapshot(fix.fixtureId);
    if (!snap) continue;

    // Nombres en español + foto que acompaña el partido (selección favorita).
    const [homeEs, awayEs, matchPhoto] = await Promise.all([
      esName(snap.home.name),
      esName(snap.away.name),
      favoritePhoto(snap.home.name, snap.away.name),
    ]);
    const vs = vsText(homeEs, awayEs);

    const prev: FriendlyState =
      (await getFriendlyState(fix.fixtureId)) ?? {
        status: "",
        goals: [null, null],
        seenEventIds: [],
        lineupsSent: false,
        startSent: false,
        htSent: false,
        ftSent: false,
      };

    const seen = new Set(prev.seenEventIds);
    const next: FriendlyState = {
      status: snap.status,
      goals: snap.goals,
      seenEventIds: snap.events.map((e) => e.id),
      lineupsSent: prev.lineupsSent,
      startSent: prev.startSent,
      htSent: prev.htSent,
      ftSent: prev.ftSent,
    };

    const url = matchUrl(fix.fixtureId);

    // Alineaciones confirmadas (antes del saque, una sola vez).
    if (!prev.lineupsSent && snap.homeLineup && snap.awayLineup) {
      await push({
        title: `Alineaciones — ${vs}`,
        body: `XI confirmado. ${snap.homeLineup.formation ?? ""} vs ${snap.awayLineup.formation ?? ""}`.trim() + venueSuffix(snap),
        url,
        icon: snap.home.logo || PUSH_ICON,
        image: matchPhoto || snap.away.logo || undefined,
        tag: `amistoso-${fix.fixtureId}-lineups`,
      });
      next.lineupsSent = true;
      pushes++;
    }

    // Inicio del partido. (En HT no avisamos de "comienza": ya está en curso;
    // isLiveStatus incluye el descanso, así que lo excluimos aquí.)
    if (!prev.startSent && isLiveStatus(snap.status) && snap.status !== "HT") {
      await push({
        title: `¡Comienza! ${vs}`,
        body: `Amistoso internacional en juego.${venueSuffix(snap)}`,
        url,
        icon: snap.home.logo || PUSH_ICON,
        image: matchPhoto || snap.away.logo || undefined,
        tag: `amistoso-${fix.fixtureId}-start`,
      });
      next.startSent = true;
      pushes++;
    }

    // Eventos nuevos (gol, roja, penalti fallado).
    for (const e of snap.events) {
      if (seen.has(e.id)) continue;
      const label = eventLabel(e, snap, homeEs, awayEs);
      if (!label) continue;
      await push({
        title: label.title,
        body: label.body,
        url,
        icon: label.icon,
        tag: `amistoso-${fix.fixtureId}-ev-${e.id}`,
      });
      pushes++;
    }

    // Descanso.
    if (!prev.htSent && snap.status === "HT") {
      await push({
        title: `Descanso — ${vs} ${scoreText(snap.goals)}`,
        body: `Final de la primera parte.`,
        url,
        icon: PUSH_ICON,
        tag: `amistoso-${fix.fixtureId}-ht`,
      });
      next.htSent = true;
      pushes++;
    }

    // Final.
    if (!prev.ftSent && isFinishedStatus(snap.status)) {
      const winnerEs =
        (snap.goals[0] ?? 0) > (snap.goals[1] ?? 0)
          ? homeEs
          : (snap.goals[1] ?? 0) > (snap.goals[0] ?? 0)
          ? awayEs
          : null;
      const winnerLogo =
        winnerEs === homeEs ? snap.home.logo : winnerEs === awayEs ? snap.away.logo : null;
      await push({
        title: `Final — ${vs} ${scoreText(snap.goals)}`,
        body: winnerEs ? `Victoria de ${winnerEs}.` : `Empate en el amistoso.`,
        url,
        icon: winnerLogo || PUSH_ICON,
        image: matchPhoto || undefined,
        tag: `amistoso-${fix.fixtureId}-ft`,
      });
      next.ftSent = true;
      pushes++;
    }

    await saveFriendlyState(fix.fixtureId, next);
    touched.push(fix.fixtureId);
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    polled: touched.length,
    pushes,
    duration_ms: Date.now() - startMs,
  });
}
