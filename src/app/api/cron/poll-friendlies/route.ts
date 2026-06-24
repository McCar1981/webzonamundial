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
import { requireCron } from "@/lib/auth-helpers";
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
  actorSide,
  isFinishedStatus,
  isLiveStatus,
  type FriendlyEvent,
  type FriendlyFixture,
  type FriendlySnapshot,
  type FriendlyState,
  type Score,
} from "@/lib/friendlies/types";
import { broadcastPush, type PushPayload } from "@/lib/push-notifications";
import { recordHeartbeat } from "@/lib/ops/store";
import {
  countryImage,
  esName,
  favoriteAtmosphere,
  favoritePhoto,
  favoriteTeamPhoto,
  playerPhoto,
  stadiumPhoto,
  teamFlagEmoji,
  topValuePhoto,
  winnerTeamPhoto,
} from "@/lib/friendlies/teamInfo";

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

/** Escudo/bandera del equipo PROTAGONISTA del evento (icono del push). En un
 *  autogol el protagonista es el jugador del RIVAL del lado acreditado
 *  (actorSide), no el beneficiado, igual que el "(País)" y la foto. */
function eventIcon(e: FriendlyEvent, s: FriendlySnapshot): string {
  const side = actorSide(e);
  if (side === "home") return s.home.logo || PUSH_ICON;
  if (side === "away") return s.away.logo || PUSH_ICON;
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
// Opción 1: bucle interno sub-minuto. Cuando hay algún partido EN VIVO, el cron
// no hace una sola pasada por invocación: repite cada POLL_INTERVAL_MS hasta
// agotar el presupuesto. Así la latencia efectiva del push baja de ~1-4 min
// (drift/skips del cron de Vercel) a ~15s, y sobrevive a un disparo saltado.
const POLL_INTERVAL_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/** "🏴 Local vs 🏴 Visitante": nombres en español con la bandera de cada país. */
function vsText(homeEs: string, awayEs: string, homeFlag = "", awayFlag = ""): string {
  const h = homeFlag ? `${homeFlag} ${homeEs}` : homeEs;
  const a = awayFlag ? `${awayFlag} ${awayEs}` : awayEs;
  return `${h} vs ${a}`;
}

function scoreText(goals: Score): string {
  return `${goals[0] ?? 0}-${goals[1] ?? 0}`;
}

/** Marcador derivado de los EVENTOS hasta (e incluido) un evento dado.
 *  api-football sirve el agregado `goals` (endpoint /fixtures) y los eventos
 *  (endpoint /fixtures/events) por SEPARADO, y el agregado suele ir por detrás del
 *  evento de gol → el push salía "0-0" justo en el aviso de GOL. Contar los goles
 *  del propio stream de eventos mantiene el marcador coherente con el aviso.
 *  El AUTOGOL ya viene acreditado por api-football al lado que MARCA (e.side =
 *  beneficiado), así que suma igual que un gol normal: NO se invierte (antes
 *  salía 3-1 en vez de 4-0). */
function scoreUpTo(s: FriendlySnapshot, upto: FriendlyEvent): Score {
  let home = 0;
  let away = 0;
  for (const e of s.events) {
    if (e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal") {
      if (e.side === "home") home++;
      else if (e.side === "away") away++;
    }
    if (e.id === upto.id) break;
  }
  return [home, away];
}

function eventLabel(
  e: FriendlyEvent,
  s: FriendlySnapshot,
  homeEs: string,
  awayEs: string,
  homeFlag = "",
  awayFlag = "",
): {
  title: string;
  body: string;
  icon: string;
} | null {
  // "(País)" del evento = la selección del JUGADOR (en español). En un AUTOGOL el
  // jugador es del RIVAL del lado acreditado (actorSide), no del beneficiado:
  // antes salía "en propia de A. Nematov (Portugal)" cuando Nematov es uzbeko.
  const side = actorSide(e);
  const team = side === "home" ? homeEs : side === "away" ? awayEs : "";
  const player = e.player?.trim() || "";
  const min = `${e.minute}'${e.extra ? `+${e.extra}` : ""}`;
  const icon = eventIcon(e, s);
  const vs = vsText(homeEs, awayEs, homeFlag, awayFlag);
  // Marcador coherente con el evento (contado desde los propios eventos), no el
  // agregado `s.goals` que va por detrás y dejaba el GOL en "0-0".
  const score = scoreText(scoreUpTo(s, e));
  switch (e.type) {
    case "goal":
    case "penalty_goal": {
      const pen = e.type === "penalty_goal" ? " de penalti" : "";
      // Título con jugador y país; si no hay nombre, solo el país.
      const head = player ? `GOL de ${player} (${team})${pen}` : `GOL${pen} de ${team}`;
      return {
        title: head,
        body: `${min} · ${vs} ${score}${e.assist ? ` · asist. ${e.assist}` : ""}`,
        icon,
      };
    }
    case "own_goal":
      return {
        title: player ? `GOL en propia de ${player} (${team})` : `GOL en propia (${team})`,
        body: `${min} · ${vs} ${score}`,
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
        body: `${min} · ${vs} ${score}`,
        icon,
      };
    case "second_yellow":
      return {
        title: player
          ? `Tarjeta roja (doble amarilla) a ${player} (${team})`
          : `Tarjeta roja (doble amarilla) (${team})`,
        body: `${min} · ${vs} ${score}`,
        icon,
      };
    default:
      return null;
  }
}

async function push(payload: PushPayload): Promise<void> {
  await broadcastPush({ kind: PUSH_KIND, payload });
}

/** Foto destacada para resúmenes (descanso/final): la del autor del ÚLTIMO gol
 *  del partido. Así la imagen es dinámica y cuenta lo que pasó, en vez de mostrar
 *  siempre al favorito. null si no se resuelve (el llamador usa el respaldo). */
async function lastScorerPhoto(snap: FriendlySnapshot): Promise<string | null> {
  const goals = snap.events.filter(
    (e) => e.type === "goal" || e.type === "penalty_goal",
  );
  if (goals.length === 0) return null;
  const last = goals.reduce((a, b) =>
    b.minute + (b.extra ?? 0) / 100 >= a.minute + (a.extra ?? 0) / 100 ? b : a,
  );
  const teamName =
    last.side === "home" ? snap.home.name : last.side === "away" ? snap.away.name : "";
  const seed = `${snap.fixtureId}:${last.id}`;
  // Foto del goleador; si no se resuelve, imagen variada del país que marcó.
  const byPlayer = last.player ? await playerPhoto(teamName, last.player, seed) : null;
  return byPlayer || (await countryImage(teamName, seed));
}

/** Una pasada completa: descubre candidatos, los sondea y manda los push nuevos.
 *  Devuelve cuántos push mandó, qué fixtures tocó y cuántos siguen EN VIVO (para
 *  que el llamador decida si repetir el bucle interno). El estado vive en KV, así
 *  que repetir esta función es seguro e idempotente entre pasadas. */
async function runPass(
  startMs: number,
): Promise<{ pushes: number; touched: number[]; live: number }> {
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
  const liveCount = candidates.filter((f) => isLiveStatus(f.status)).length;

  let pushes = 0;
  const touched: number[] = [];

  for (const fix of candidates) {
    if (Date.now() - startMs > TIME_BUDGET_MS) break; // sigue en la próxima pasada

    const snap = await fetchFriendlySnapshot(fix.fixtureId);
    if (!snap) continue;

    // Nombres en español + banderas + foto que acompaña el partido (favorita) +
    // imagen de AMBIENTE para previas/resúmenes (selección/afición del favorito).
    const [homeEs, awayEs, homeFlag, awayFlag, matchPhoto, matchAtmosphere] =
      await Promise.all([
        esName(snap.home.name),
        esName(snap.away.name),
        teamFlagEmoji(snap.home.name),
        teamFlagEmoji(snap.away.name),
        favoritePhoto(snap.home.name, snap.away.name),
        favoriteAtmosphere(snap.home.name, snap.away.name, `ctx-${fix.fixtureId}`),
      ]);
    const vs = vsText(homeEs, awayEs, homeFlag, awayFlag);
    // Imagen de contexto (previa, alineaciones, inicio): ambiente del favorito,
    // con respaldo a la foto de la estrella.
    const contextImage = matchAtmosphere || matchPhoto || undefined;

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
    // "Como Google": UNA notificación por partido. Todos los avisos del mismo
    // amistoso comparten tag → el SO reemplaza el anterior en vez de apilar.
    // (El SW tiene renotify:true, así que cada novedad re-alerta.)
    const tag = `amistoso-${fix.fixtureId}`;

    // ALINEACIONES (antes del saque, una sola vez) → FOTO DEL EQUIPO FAVORITO.
    if (!prev.lineupsSent && snap.homeLineup && snap.awayLineup) {
      const lineupImage =
        (await favoriteTeamPhoto(snap.home.name, snap.away.name, `xi-${fix.fixtureId}`)) || contextImage;
      await push({
        title: `Alineaciones — ${vs}`,
        body: `XI confirmado. ${snap.homeLineup.formation ?? ""} vs ${snap.awayLineup.formation ?? ""}`.trim() + venueSuffix(snap),
        url,
        icon: snap.home.logo || PUSH_ICON,
        image: lineupImage,
        tag,
      });
      next.lineupsSent = true;
      pushes++;
    }

    // INICIO/PREVIA. (En HT no avisamos de "comienza": ya está en curso.)
    // → FOTO DEL JUGADOR MÁS IMPORTANTE (mayor valor de mercado).
    if (!prev.startSent && isLiveStatus(snap.status) && snap.status !== "HT") {
      const previaImage =
        (await topValuePhoto(snap.home.name, snap.away.name, `previa-${fix.fixtureId}`)) || contextImage;
      await push({
        title: `¡Comienza! ${vs}`,
        body: `Amistoso internacional en juego.${venueSuffix(snap)}`,
        url,
        icon: snap.home.logo || PUSH_ICON,
        image: previaImage,
        tag,
      });
      next.startSent = true;
      pushes++;
    }

    // Eventos nuevos (gol, roja, penalti fallado). Adjuntamos imagen: los goles
    // y las tarjetas rojas son los momentos más compartibles.
    for (const e of snap.events) {
      if (seen.has(e.id)) continue;
      const label = eventLabel(e, snap, homeEs, awayEs, homeFlag, awayFlag);
      if (!label) continue;
      // Foto del PROTAGONISTA del evento (goleador/expulsado), cruzando su
      // nombre con la convocatoria BIBLIA. En un AUTOGOL el protagonista es del
      // RIVAL del lado acreditado (actorSide): se busca en SU selección, no en la
      // beneficiada (si no, no se le encuentra). Respaldo: la foto del partido.
      const actorTeamSide = actorSide(e);
      const teamName =
        actorTeamSide === "home" ? snap.home.name : actorTeamSide === "away" ? snap.away.name : "";
      const actorPhoto = e.player ? await playerPhoto(teamName, e.player, e.id) : null;
      // Cadena: foto del jugador → imagen variada del país → foto del partido.
      const eventImage =
        actorPhoto || (await countryImage(teamName, e.id)) || matchPhoto || undefined;
      await push({
        title: label.title,
        body: label.body,
        url,
        icon: label.icon,
        image: eventImage,
        tag,
      });
      pushes++;
    }

    // DESCANSO (MEDIO TIEMPO) → FOTO DEL ESTADIO (si es sede del banco; los
    // amistosos suelen jugarse fuera de las sedes, así que normalmente cae al
    // autor del último gol / ambiente).
    if (!prev.htSent && snap.status === "HT") {
      const htImage =
        (snap.venue ? await stadiumPhoto(snap.venue, `ht-${fix.fixtureId}`) : null) ||
        (await lastScorerPhoto(snap)) ||
        contextImage;
      await push({
        title: `Descanso — ${vs} ${scoreText(snap.goals)}`,
        body: `Final de la primera parte.`,
        url,
        icon: PUSH_ICON,
        image: htImage,
        tag,
      });
      next.htSent = true;
      pushes++;
    }

    // FINAL → CELEBRACIÓN DEL EQUIPO GANADOR (su foto de equipo); empate → ambiente.
    if (!prev.ftSent && isFinishedStatus(snap.status)) {
      const winnerName =
        (snap.goals[0] ?? 0) > (snap.goals[1] ?? 0)
          ? snap.home.name
          : (snap.goals[1] ?? 0) > (snap.goals[0] ?? 0)
          ? snap.away.name
          : null;
      const winnerEs =
        winnerName === snap.home.name ? homeEs : winnerName === snap.away.name ? awayEs : null;
      const winnerLogo =
        winnerEs === homeEs ? snap.home.logo : winnerEs === awayEs ? snap.away.logo : null;
      const ftImage =
        (winnerName ? await winnerTeamPhoto(winnerName, `ft-${fix.fixtureId}`) : null) ||
        (await lastScorerPhoto(snap)) ||
        contextImage;
      await push({
        title: `Final — ${vs} ${scoreText(snap.goals)}`,
        body: winnerEs ? `Victoria de ${winnerEs}.` : `Empate en el amistoso.`,
        url,
        icon: winnerLogo || PUSH_ICON,
        image: ftImage,
        tag,
      });
      next.ftSent = true;
      pushes++;
    }

    await saveFriendlyState(fix.fixtureId, next);
    touched.push(fix.fixtureId);
  }

  return { pushes, touched, live: liveCount };
}

export async function GET(req: Request) {
  const startMs = Date.now();

  const denied = requireCron(req);
  if (denied) return denied;

  if (!apiFootballEnabled()) {
    return NextResponse.json(
      { error: "api_not_configured", message: "API_SPORTS_KEY requerida" },
      { status: 500 },
    );
  }

  // Bucle interno sub-minuto (Opción 1): mientras haya partido EN VIVO y quede
  // presupuesto, repetimos la pasada cada POLL_INTERVAL_MS. Si no hay nada en
  // vivo, una sola pasada (idéntico al comportamiento anterior).
  let totalPushes = 0;
  const touchedAll = new Set<number>();
  let passes = 0;

  for (;;) {
    const { pushes, touched, live } = await runPass(startMs);
    totalPushes += pushes;
    for (const id of touched) touchedAll.add(id);
    passes++;

    if (live === 0) break;
    // ¿Cabe otra pasada? Necesitamos el sleep + un margen para sondear.
    const budgetLeft = TIME_BUDGET_MS - (Date.now() - startMs);
    if (budgetLeft < POLL_INTERVAL_MS + 5_000) break;
    await sleep(POLL_INTERVAL_MS);
  }

  // Latido para el centro de control: confirma que el poll en vivo sigue corriendo.
  await recordHeartbeat("poll-friendlies", true, { passes, pushes: totalPushes });

  return NextResponse.json({
    ok: true,
    passes,
    polled: touchedAll.size,
    pushes: totalPushes,
    duration_ms: Date.now() - startMs,
  });
}
