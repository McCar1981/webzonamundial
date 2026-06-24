// src/lib/match-center/push.ts
//
// Push de eventos del MUNDIAL (partidos 1..104). Hasta ahora el cron
// match-center-poll solo cacheaba snapshots en KV; este módulo añade las
// notificaciones push del torneo, replicando la lógica ya probada de los
// amistosos pero sobre el modelo de datos del Match Center (LiveSnapshot).
//
// Categoría de suscripción: "tournament-key-events" (la misma que el usuario
// activa en sus preferencias de notificaciones).
//
// Diseño "como Google": UNA notificación por partido que se actualiza. Todos
// los avisos de un mismo partido comparten el tag `mc-${matchId}`, de modo que
// el sistema operativo reemplaza el anterior en vez de apilar 6-8 tarjetas.
// (El Service Worker tiene renotify:true, así que cada novedad re-alerta.)

import { kv } from "@/lib/kv";
import {
  broadcastPush,
  sendPushToEndpoints,
  type PushPayload,
} from "@/lib/push-notifications";
import { flagEmoji } from "@/lib/friendlies/flags";
import {
  teamInfo,
  favoritePhoto,
  favoriteAtmosphere,
  playerPhoto,
  countryImage,
  topValuePhoto,
  favoriteTeamPhoto,
  winnerTeamPhoto,
  favoriteFlagUrl,
} from "@/lib/friendlies/teamInfo";
import { isInPlay, isFinished, isAnomalousTerminal, ANOMALOUS_TERMINAL_LABEL } from "./status";
import { clearFollowers, getFollowers } from "./followers";
import { actorSide } from "./templates";
import type { LiveSnapshot, MatchEvent, MatchMeta, Pair } from "./types";

const PUSH_KIND = "tournament-key-events";
// Hitos de partido que van a TODA la base (canal "news" — hoy el único con
// audiencia real): alineaciones y resultado final. El minuto a minuto (inicio,
// goles, descanso) se queda en PUSH_KIND, para quien sigue el partido de cerca.
const WIDE_KIND = "news";
const PUSH_ICON = "/img/email/logo-zonamundial.png";

/** Estado persistido por partido para detectar novedades entre polls. */
export interface MatchPushState {
  status: string;
  score: Pair;
  seenEventIds: string[];
  lineupsSent: boolean;
  startSent: boolean;
  htSent: boolean;
  ftSent: boolean;
}

// Hash de Redis: campo = matchId, valor = MatchPushState. HSET por campo es
// atómico, así que polls solapados sobre partidos distintos no se pisan.
const STATE_KEY = "mc:pushstate:v1";

function isKvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

async function getState(matchId: number): Promise<MatchPushState | null> {
  if (!isKvEnabled()) return null;
  try {
    return (await kv.hget<MatchPushState>(STATE_KEY, String(matchId))) ?? null;
  } catch {
    return null;
  }
}

async function saveState(matchId: number, state: MatchPushState): Promise<void> {
  if (!isKvEnabled()) return;
  try {
    await kv.hset(STATE_KEY, { [String(matchId)]: state });
  } catch (err) {
    console.error("[mc-push] saveState failed", (err as Error).message);
  }
}

/** Deep-link directo a la ficha en vivo del partido. */
function matchUrl(matchId: number): string {
  return `/app/matchcenter/${matchId}`;
}

/** "🏴 Local vs 🏴 Visitante": nombres en español con la bandera de cada país. */
function vsText(meta: MatchMeta): string {
  const h = `${flagEmoji(meta.home.flag)} ${meta.home.name}`.trim();
  const a = `${flagEmoji(meta.away.flag)} ${meta.away.name}`.trim();
  return `${h} vs ${a}`;
}

function scoreText(score: Pair): string {
  return `${score[0] ?? 0}-${score[1] ?? 0}`;
}

/** Marcador derivado de los EVENTOS hasta (e incluido) un evento dado.
 *  El agregado `goals` del fixture suele ir POR DETRÁS del evento de gol (el
 *  push salía "GOL ... 0-0" en amistosos hasta que se corrigió así, ver
 *  poll-friendlies). Además, con 2 goles en la misma pasada cada aviso muestra
 *  su marcador, no el final de ambos. El AUTOGOL ya viene acreditado por
 *  api-football al lado que MARCA (e.side = beneficiado), así que suma igual que
 *  un gol normal: NO se invierte (antes salía 3-1 en vez de 4-0). */
function scoreUpTo(snap: LiveSnapshot, upto: MatchEvent): Pair {
  let home = 0;
  let away = 0;
  for (const e of snap.events) {
    if (e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal") {
      if (e.side === "home") home++;
      else if (e.side === "away") away++;
    }
    if (e.id === upto.id) break;
  }
  return [home, away];
}

/** ¿La API ya publicó alineaciones reales? (el adaptador rellena un 4-3-3 por
 *  defecto sin nombres; solo contamos como confirmadas si traen nombres). */
function lineupsConfirmed(snap: LiveSnapshot): boolean {
  const hasNames = (l: LiveSnapshot["homeLineup"]) =>
    !!l && l.starters.some((p) => !!p.name);
  return hasNames(snap.homeLineup) && hasNames(snap.awayLineup);
}

interface EventLabel {
  title: string;
  body: string;
}

/** Construye título+cuerpo de un evento. Goles y tarjetas rojas SIEMPRE
 *  incluyen jugador + país (lo que pidió Carlos). Amarillas → null (no se
 *  notifican, igual que Google, para no saturar). */
function eventLabel(e: MatchEvent, meta: MatchMeta, score: Pair): EventLabel | null {
  // El paréntesis "(País)" identifica al JUGADOR del evento. En un AUTOGOL el
  // jugador es del RIVAL del lado acreditado (actorSide), no del beneficiado:
  // antes salía "en propia de A. Nematov (Portugal)" cuando Nematov es uzbeko.
  const side = actorSide(e);
  const team = side === "home" ? meta.home.name : side === "away" ? meta.away.name : "";
  const player = e.player?.trim() || "";
  const min = `${e.minute}'${e.extra ? `+${e.extra}` : ""}`;
  const vs = vsText(meta);
  switch (e.type) {
    case "goal":
    case "penalty_goal": {
      const pen = e.type === "penalty_goal" ? " de penalti" : "";
      return {
        title: player ? `GOL de ${player} (${team})${pen}` : `GOL${pen} de ${team}`,
        body: `${min} · ${vs} ${scoreText(score)}${e.assist ? ` · asist. ${e.assist}` : ""}`,
      };
    }
    case "own_goal":
      return {
        title: player ? `GOL en propia de ${player} (${team})` : `GOL en propia (${team})`,
        body: `${min} · ${vs} ${scoreText(score)}`,
      };
    case "penalty_miss":
      return {
        title: player ? `Penalti fallado por ${player} (${team})` : `Penalti fallado (${team})`,
        body: `${min} · ${vs}`,
      };
    case "red":
      return {
        title: player ? `Tarjeta roja a ${player} (${team})` : `Tarjeta roja (${team})`,
        body: `${min} · ${vs} ${scoreText(score)}`,
      };
    case "second_yellow":
      return {
        title: player
          ? `Tarjeta roja (doble amarilla) a ${player} (${team})`
          : `Tarjeta roja (doble amarilla) (${team})`,
        body: `${min} · ${vs} ${scoreText(score)}`,
      };
    default:
      return null;
  }
}

/**
 * Compara el snapshot del Mundial con el estado guardado y manda UN push por
 * cada novedad (alineaciones, inicio, gol, roja, penalti fallado, descanso,
 * final). Devuelve cuántos pushes envió. Idempotente: si no hay novedades,
 * no manda nada y no escribe estado.
 */
export async function processMatchPush(snap: LiveSnapshot): Promise<number> {
  const meta = snap.meta;
  const matchId = meta.id;
  const vs = vsText(meta);
  const url = matchUrl(matchId);
  // UNA notificación por partido: tag estable → se actualiza, no se apila.
  const tag = `mc-${matchId}`;

  // Foto de acción: estrella del equipo implicado; si no, la del favorito.
  const [homeInfo, awayInfo] = await Promise.all([
    teamInfo(meta.home.name),
    teamInfo(meta.away.name),
  ]);
  const fallbackPhoto = await favoritePhoto(meta.home.name, meta.away.name);
  const photoFor = (side: MatchEvent["side"]): string | undefined => {
    const p = side === "home" ? homeInfo?.photo : side === "away" ? awayInfo?.photo : null;
    return p || fallbackPhoto || undefined;
  };
  // Imagen de CONTEXTO (previa, alineaciones, inicio, descanso, final): ambiente
  // del favorito (selección/afición), con respaldo a la foto de la estrella.
  const atmosphere = await favoriteAtmosphere(meta.home.name, meta.away.name, `ctx-${matchId}`);
  const contextImage = atmosphere || fallbackPhoto || undefined;

  const prev: MatchPushState =
    (await getState(matchId)) ?? {
      status: "",
      score: [0, 0],
      seenEventIds: [],
      lineupsSent: false,
      startSent: false,
      htSent: false,
      ftSent: false,
    };

  const seen = new Set(prev.seenEventIds);
  // UNIÓN previos ∪ actuales (la lista nunca encoge durante el partido):
  // api-football a veces devuelve `events` vacío/parcial de forma transitoria;
  // si reemplazáramos la lista, la siguiente pasada re-notificaría TODOS los
  // goles del partido en ráfaga.
  const unionIds = new Set(prev.seenEventIds);
  for (const e of snap.events) unionIds.add(e.id);
  const next: MatchPushState = {
    status: snap.status,
    score: snap.score,
    seenEventIds: [...unionIds],
    lineupsSent: prev.lineupsSent,
    startSent: prev.startSent,
    htSent: prev.htSent,
    ftSent: prev.ftSent,
  };

  // Seguidores del partido (efecto "pin" de Google): reciben la MISMA tarjeta
  // pero fijada (requireInteraction). Se envía DESPUÉS del broadcast normal, con
  // el mismo tag, así que en su dispositivo gana la versión fijada.
  const followers = await getFollowers(matchId);

  let pushes = 0;
  let sentThisPass = false;
  const send = async (
    payload: Omit<PushPayload, "url" | "tag">,
    opts: { pin?: boolean; kind?: string } = {},
  ) => {
    const common = { ...payload, url, tag, badge: "/icons/badge-72.png" };
    await broadcastPush({ kind: opts.kind ?? PUSH_KIND, payload: common });
    if (followers.length > 0) {
      await sendPushToEndpoints({
        endpoints: followers,
        payload: { ...common, requireInteraction: opts.pin !== false },
      });
    }
    pushes++;
    sentThisPass = true;
  };

  // ALINEACIONES (una sola vez, antes del saque) → FOTO DEL EQUIPO FAVORITO.
  if (!prev.lineupsSent && lineupsConfirmed(snap)) {
    // Solo foto de EQUIPO (camiseta nacional, horizontal). Si no hay, SIN imagen:
    // no caemos a contextImage (retrato de jugador, a veces de club/vertical).
    const lineupImage =
      (await favoriteTeamPhoto(meta.home.name, meta.away.name, `xi-${matchId}`)) || undefined;
    const forms =
      snap.homeLineup?.formation && snap.awayLineup?.formation
        ? `${snap.homeLineup.formation} vs ${snap.awayLineup.formation}. `
        : "";
    await send(
      {
        title: `📋 Alineaciones · ${vs}`,
        body: `¡Onces confirmados! ${forms}A punto de empezar.`,
        icon: PUSH_ICON,
        image: lineupImage,
      },
      { kind: WIDE_KIND },
    );
    next.lineupsSent = true;
  }

  // INICIO/PREVIA del partido (excluye HT) → FOTO DEL JUGADOR MÁS IMPORTANTE
  // (mayor valor de mercado de las dos selecciones).
  if (!prev.startSent && isInPlay(snap.status) && snap.status !== "HT") {
    const previaImage =
      (await topValuePhoto(meta.home.name, meta.away.name, `previa-${matchId}`)) || contextImage;
    await send({
      title: `¡Comienza! ${vs}`,
      body: `Partido del Mundial en juego.${meta.venue ? ` · ${meta.venue}` : ""}`,
      icon: PUSH_ICON,
      image: previaImage,
    });
    next.startSent = true;
  }

  // RECTIFICACIÓN VAR: si el marcador RETROCEDE respecto al estado guardado, un
  // gol fue anulado (api-football retira el evento del gol y baja el agregado,
  // por eso no llega como un evento nuevo). Avisamos UNA vez con el marcador
  // corregido y el mismo tag (la tarjeta del partido se actualiza). No se repite
  // porque al guardar el estado `next.score` ya pasa a ser el corregido.
  const goalAnnulled =
    (snap.score[0] ?? 0) < (prev.score[0] ?? 0) || (snap.score[1] ?? 0) < (prev.score[1] ?? 0);
  if (goalAnnulled) {
    await send({
      title: `Gol anulado por el VAR · ${vs}`,
      body: `El VAR corrige el marcador: ${scoreText(snap.score)}.`,
      icon: PUSH_ICON,
      image: contextImage,
    });
  }

  // Eventos nuevos: goles y tarjetas rojas llevan imagen (los más compartibles).
  for (const e of snap.events) {
    if (seen.has(e.id)) continue;
    // Marcador ACUMULADO hasta este evento (no el agregado del fixture, que va
    // por detrás del evento y producía avisos "GOL ... 0-0").
    const label = eventLabel(e, meta, scoreUpTo(snap, e));
    if (!label) continue;
    // Foto del PROTAGONISTA (goleador/expulsado) cruzando su nombre con la
    // convocatoria BIBLIA; respaldo: estrella del equipo / favorito. En un
    // AUTOGOL el protagonista es del RIVAL del lado acreditado (actorSide): se
    // busca en SU selección, no en la beneficiada (si no, no se le encuentra y
    // caía a una estrella aleatoria del equipo equivocado).
    const actorTeamSide = actorSide(e);
    const teamName =
      actorTeamSide === "home" ? meta.home.name : actorTeamSide === "away" ? meta.away.name : "";
    const actorPhoto = e.player ? await playerPhoto(teamName, e.player, e.id) : null;
    // Cadena: foto del jugador → imagen variada del país → estrella/favorito.
    const eventImage =
      actorPhoto || (await countryImage(teamName, e.id)) || photoFor(actorTeamSide);
    await send({
      title: label.title,
      body: label.body,
      icon: PUSH_ICON,
      image: eventImage,
    });
  }

  // DESCANSO (MEDIO TIEMPO) → foto de EQUIPO del favorito o su BANDERA. NUNCA el
  // banco de estadios (salían techos/cubiertas irreconocibles, p.ej. el del BC
  // Place) ni retratos de jugador (a veces de club/verticales).
  if (!prev.htSent && snap.status === "HT") {
    const htImage =
      (await favoriteTeamPhoto(meta.home.name, meta.away.name, `ht-${matchId}`)) ||
      (await favoriteFlagUrl(meta.home.name, meta.away.name)) ||
      undefined;
    await send({
      title: `Descanso — ${vs} ${scoreText(snap.score)}`,
      body: `Final de la primera parte.`,
      icon: PUSH_ICON,
      image: htImage,
    });
    next.htSent = true;
  }

  // FINAL → CELEBRACIÓN DEL EQUIPO GANADOR (su foto de equipo); empate → ambiente.
  if (!prev.ftSent && isFinished(snap.status)) {
    // Ganador: por penaltis (status PEN) lo decide la TANDA, no el marcador de
    // los 120' (que está empatado). En FT/AET, el marcador.
    const pen = snap.penalty;
    let winner: string | null;
    let penText = ""; // sufijo "(4-2 pen)" cuando se decidió en los once metros
    let body: string;
    if (snap.status === "PEN" && pen) {
      winner =
        (pen[0] ?? 0) > (pen[1] ?? 0)
          ? meta.home.name
          : (pen[1] ?? 0) > (pen[0] ?? 0)
          ? meta.away.name
          : null;
      penText = ` (${pen[0] ?? 0}-${pen[1] ?? 0} pen)`;
      body = winner ? `Victoria de ${winner} en los penaltis.` : "Definido en la tanda de penaltis.";
    } else {
      winner =
        (snap.score[0] ?? 0) > (snap.score[1] ?? 0)
          ? meta.home.name
          : (snap.score[1] ?? 0) > (snap.score[0] ?? 0)
          ? meta.away.name
          : null;
      body = winner ? `¡Gana ${winner}! 🎉` : "¡Empate! Reparto de puntos.";
    }
    // Solo foto de EQUIPO del GANADOR (celebración, camiseta nacional, horizontal).
    // Si no hay, SIN imagen: NO caemos al retrato del goleador ni al ambiente
    // (pueden ser de club, verticales o de aficionados). "¡Gana Francia!" mostraba
    // a un jugador con camiseta del AC Milan; mejor el aviso limpio sin foto.
    const ftImage =
      (winner ? await winnerTeamPhoto(winner, `ft-${matchId}`) : null) || undefined;
    // El final NO se fija (pin: false): así el seguidor puede descartarlo.
    await send(
      {
        title: `🏁 Final · ${vs} ${scoreText(snap.score)}${penText}`,
        body,
        icon: PUSH_ICON,
        image: ftImage,
      },
      { pin: false, kind: WIDE_KIND },
    );
    next.ftSent = true;
    // El partido acabó: libera el set de seguidores (limpia KV y permite que el
    // pin desaparezca; no habrá más actualizaciones).
    await clearFollowers(matchId);
  }

  // CIERRE por estado TERMINAL ANÓMALO (cancelado, abandonado, adjudicado,
  // walkover, aplazado): el partido NO continuará. Antes el push usaba solo
  // isFinishedStatus (FT/AET/PEN) y estos estados nunca cerraban: el partido se
  // seguía sondeando y los seguidores quedaban con el pin fijado para siempre.
  // Mandamos un aviso apropiado y liberamos a los seguidores.
  if (!prev.ftSent && isAnomalousTerminal(snap.status)) {
    const label = ANOMALOUS_TERMINAL_LABEL[snap.status] ?? "Partido finalizado";
    await send(
      {
        title: `${label} · ${vs}`,
        body:
          snap.status === "PST"
            ? "El partido se ha aplazado."
            : `El partido ha quedado ${label.toLowerCase()}.`,
        icon: PUSH_ICON,
        image: contextImage,
      },
      { pin: false, kind: WIDE_KIND },
    );
    next.ftSent = true;
    await clearFollowers(matchId);
  }

  // "Tick" de minuto para los seguidores: si el partido está en juego y no hubo
  // ningún aviso en esta pasada, refrescamos su tarjeta FIJADA con el marcador y
  // el minuto actuales, SIN sonido (silent) para no molestar. Así el pin imita
  // al de Google mostrando el tiempo de juego al día. (Solo a seguidores; el
  // broadcast normal no recibe ticks.)
  if (
    !sentThisPass &&
    followers.length > 0 &&
    isInPlay(snap.status) &&
    snap.status !== "HT"
  ) {
    const homeLine = `${flagEmoji(meta.home.flag)} ${meta.home.name}`.trim();
    const awayLine = `${flagEmoji(meta.away.flag)} ${meta.away.name}`.trim();
    await sendPushToEndpoints({
      endpoints: followers,
      payload: {
        title: `${homeLine} ${scoreText(snap.score)} ${awayLine}`,
        body: `🔴 EN VIVO · ${snap.elapsed}'${meta.venue ? ` · ${meta.venue}` : ""}`,
        url,
        tag,
        badge: "/icons/badge-72.png",
        icon: PUSH_ICON,
        requireInteraction: true,
        silent: true,
      },
    });
  }

  // Solo escribimos estado si hubo algún push o cambió el estado base, para no
  // hacer writes inútiles en cada pasada del cron.
  if (
    pushes > 0 ||
    prev.status !== next.status ||
    prev.score[0] !== next.score[0] ||
    prev.score[1] !== next.score[1] ||
    prev.seenEventIds.length !== next.seenEventIds.length
  ) {
    await saveState(matchId, next);
  }

  return pushes;
}
