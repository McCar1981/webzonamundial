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
import { broadcastPush, type PushPayload } from "@/lib/push-notifications";
import { flagEmoji } from "@/lib/friendlies/flags";
import { teamInfo, favoritePhoto } from "@/lib/friendlies/teamInfo";
import { isFinishedStatus, isLiveStatus } from "@/lib/friendlies/types";
import type { LiveSnapshot, MatchEvent, MatchMeta, Pair } from "./types";

const PUSH_KIND = "tournament-key-events";
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
  const team = e.side === "home" ? meta.home.name : e.side === "away" ? meta.away.name : "";
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
  const next: MatchPushState = {
    status: snap.status,
    score: snap.score,
    seenEventIds: snap.events.map((e) => e.id),
    lineupsSent: prev.lineupsSent,
    startSent: prev.startSent,
    htSent: prev.htSent,
    ftSent: prev.ftSent,
  };

  let pushes = 0;
  const send = async (payload: Omit<PushPayload, "url" | "tag">) => {
    await broadcastPush({
      kind: PUSH_KIND,
      payload: { ...payload, url, tag, badge: "/icons/badge-72.png" },
    });
    pushes++;
  };

  // Alineaciones confirmadas (una sola vez, antes del saque).
  if (!prev.lineupsSent && lineupsConfirmed(snap)) {
    await send({
      title: `Alineaciones — ${vs}`,
      body: `XI confirmado. ${snap.homeLineup?.formation ?? ""} vs ${snap.awayLineup?.formation ?? ""}`.trim(),
      icon: PUSH_ICON,
      image: fallbackPhoto || undefined,
    });
    next.lineupsSent = true;
  }

  // Inicio del partido (excluye HT, que ya es "en juego" pausado).
  if (!prev.startSent && isLiveStatus(snap.status) && snap.status !== "HT") {
    await send({
      title: `¡Comienza! ${vs}`,
      body: `Partido del Mundial en juego.${meta.venue ? ` · ${meta.venue}` : ""}`,
      icon: PUSH_ICON,
      image: fallbackPhoto || undefined,
    });
    next.startSent = true;
  }

  // Eventos nuevos: goles y tarjetas rojas llevan imagen (los más compartibles).
  for (const e of snap.events) {
    if (seen.has(e.id)) continue;
    const label = eventLabel(e, meta, snap.score);
    if (!label) continue;
    await send({
      title: label.title,
      body: label.body,
      icon: PUSH_ICON,
      image: photoFor(e.side),
    });
  }

  // Descanso.
  if (!prev.htSent && snap.status === "HT") {
    await send({
      title: `Descanso — ${vs} ${scoreText(snap.score)}`,
      body: `Final de la primera parte.`,
      icon: PUSH_ICON,
    });
    next.htSent = true;
  }

  // Final.
  if (!prev.ftSent && isFinishedStatus(snap.status)) {
    const winner =
      (snap.score[0] ?? 0) > (snap.score[1] ?? 0)
        ? meta.home.name
        : (snap.score[1] ?? 0) > (snap.score[0] ?? 0)
        ? meta.away.name
        : null;
    await send({
      title: `Final — ${vs} ${scoreText(snap.score)}`,
      body: winner ? `Victoria de ${winner}.` : `Empate.`,
      icon: PUSH_ICON,
      image: fallbackPhoto || undefined,
    });
    next.ftSent = true;
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
