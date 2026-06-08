// src/lib/micro/engine.ts
//
// Motor de GENERACIÓN de micro-predicciones. Corre dentro del poller del Match
// Center (cron match-center-poll), que ya descarga el LiveSnapshot real de
// api-football y hace el diff de eventos para el push. Aquí reusamos ese mismo
// snapshot para:
//   1. Detectar TRIGGERS reactivos nuevos (penalti confirmado, roja, gol anulado
//      por VAR, cambio ofensivo, gol → próximo goleador).
//   2. Detectar momentos TEMPORALES por minuto (15, 30, descanso, 60, 85).
//   3. Emitir la micro (createMicro, idempotente por evento) y mandar el push.
//
// Rate-control del spec: máx 1 micro cada 3 min y máx 12 por partido (90'). El
// guardado idempotente por trigger_event_id evita duplicar ante polls solapados.
//
// No lanza si el partido no está en juego. Degrada en silencio: si el push o la
// creación fallan, no rompe la pasada del poller (el push del partido es prioritario).

import type { LiveSnapshot, Side } from "@/lib/match-center/types";
import { broadcastPush } from "@/lib/push-notifications";
import { matchMultiplier } from "@/lib/predictions/match-data";
import {
  MICRO_CATALOG,
  type MicroKind,
  type ResolveContext,
} from "./micro";
import {
  createMicro,
  microExistsForEvent,
  temporalEmitted,
  microCountForMatch,
  lastMicroAt,
  type MicroRow,
} from "./store";
import { generateAiMicro, aiMicroEnabled } from "./ai-generator";

const PUSH_KIND = "tournament-key-events";
const PUSH_ICON = "/img/email/logo-zonamundial.png";

// Rate-control (spec).
const MIN_GAP_MS = 3 * 60_000; // máx 1 cada 3 min
const MAX_PER_MATCH = 12;       // máx 12 en 90'
const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

const GOAL_TYPES = new Set(["goal", "own_goal", "penalty_goal"]);

function sideLabel(snap: LiveSnapshot, side: Side): string {
  return side === "home" ? snap.meta.home.name : snap.meta.away.name;
}

interface Candidate {
  kind: MicroKind;
  triggerEventId?: string;     // reactivas: id del evento que la dispara
  question?: string;           // pregunta interpolada
  options?: { key: string; label: string }[];
  context?: ResolveContext;
  /** Para temporales: minuto a partir del cual es elegible. */
}

/**
 * Deriva las micros CANDIDATAS de un snapshot. No toca DB: solo decide qué se
 * podría emitir AHORA. El llamador filtra por rate-control e idempotencia.
 */
export function candidatesFromSnapshot(snap: LiveSnapshot): Candidate[] {
  const out: Candidate[] = [];
  const minute = snap.elapsed;

  // ── Reactivas (por evento) ──
  for (const e of snap.events) {
    // Penalti confirmado por VAR (antes del lanzamiento) o señalado.
    if (e.type === "var" && /penalty confirmed/i.test(e.detail ?? "")) {
      out.push({ kind: "penalty_outcome", triggerEventId: e.id });
    }
    // Gol anulado por VAR.
    if (e.type === "var" && /goal cancelled|disallow/i.test(e.detail ?? "")) {
      out.push({ kind: "var_goal_review", triggerEventId: e.id });
    }
    // Roja → ¿marca el equipo en inferioridad?
    if ((e.type === "red" || e.type === "second_yellow") && e.side !== "neutral") {
      const inferior = e.side as Side;
      out.push({
        kind: "red_card_response",
        triggerEventId: e.id,
        question: `Roja a ${sideLabel(snap, inferior)}. ¿Marcará en inferioridad antes del final?`,
        context: { side: inferior },
      });
    }
    // Cambio ofensivo → ¿el sustituto marca o asiste?
    if (e.type === "sub" && e.side !== "neutral" && e.playerIn) {
      out.push({
        kind: "scorer_sub_impact",
        triggerEventId: e.id,
        question: `Entra ${e.playerIn} (${sideLabel(snap, e.side as Side)}). ¿Marcará o asistirá?`,
        context: { side: e.side as Side, playerName: e.playerIn },
      });
    }
    // Gol → ¿quién marca el próximo? (disparador: cada gol).
    if (GOAL_TYPES.has(e.type)) {
      out.push({ kind: "next_scorer_side", triggerEventId: e.id });
    }
  }

  // ── Temporales (por minuto). Elegibles en una franja para no perderlas si el
  //    poll cae justo en el minuto exacto. La idempotencia (1 por kind/partido)
  //    evita repetirlas. ──
  const between = (lo: number, hi: number) => minute >= lo && minute <= hi;
  if (between(13, 20)) out.push({ kind: "goal_before_30" });
  if (between(28, 33)) out.push({ kind: "halftime_result", context: { scoreAtOpen: [snap.score[0] ?? 0, snap.score[1] ?? 0] } });
  if (snap.status === "HT") out.push({ kind: "first_second_half" });
  if (between(58, 63)) out.push({ kind: "more_goals_after_60" });
  if (between(83, 88)) out.push({ kind: "goal_in_stoppage" });

  return out;
}

/**
 * Procesa un snapshot: emite las micros nuevas que pasen el rate-control y manda
 * su push. Devuelve cuántas emitió. Pensado para llamarse desde el poller tras
 * cachear el snapshot, igual que processMatchPush.
 */
export async function processMicroGeneration(snap: LiveSnapshot): Promise<number> {
  if (!IN_PLAY.has(snap.status)) return 0;

  const matchId = String(snap.matchId);
  const count = await microCountForMatch(matchId);
  if (count >= MAX_PER_MATCH) return 0;

  // Throttle: respeta el hueco mínimo desde la última micro del partido.
  const last = await lastMicroAt(matchId);
  if (last && Date.now() - last < MIN_GAP_MS) return 0;

  const mult = matchMultiplier(matchId).multiplier;
  const candidates = candidatesFromSnapshot(snap);

  let emitted = 0;
  for (const c of candidates) {
    // Una sola emisión por pasada (respeta el espaciado de 3 min).
    if (emitted > 0) break;

    // Idempotencia.
    if (c.triggerEventId) {
      if (await microExistsForEvent(matchId, c.triggerEventId)) continue;
    } else {
      if (await temporalEmitted(matchId, c.kind)) continue;
    }

    const created = await createMicro({
      matchId,
      kind: c.kind,
      openMinute: snap.elapsed,
      matchMultiplier: mult,
      question: c.question,
      options: c.options,
      context: c.context,
      triggerEventId: c.triggerEventId,
    });
    if (!created) continue;

    emitted++;
    try {
      await pushMicro(snap, created);
    } catch (err) {
      console.error("[micro-engine] push failed", created.id, (err as Error).message);
    }
  }

  // ── Categoría C (IA): si no salió nada determinista esta pasada y la IA está
  //    habilitada, Claude redacta UNA micro contextual atada a un predicado
  //    resoluble. Idempotente por minuto (triggerEventId sintético). ──
  if (emitted === 0 && aiMicroEnabled()) {
    try {
      const ai = await generateAiMicro(snap);
      if (ai && !(await microExistsForEvent(matchId, ai.triggerEventId))) {
        const created = await createMicro({
          matchId,
          kind: ai.kind,
          openMinute: snap.elapsed,
          matchMultiplier: mult,
          question: ai.question,
          options: ai.options,
          context: ai.context,
          triggerEventId: ai.triggerEventId,
          windowSeconds: ai.windowSeconds,
          basePoints: ai.basePoints,
        });
        if (created) {
          emitted++;
          await pushMicro(snap, created);
        }
      }
    } catch (err) {
      console.error("[micro-engine] ai generation failed", matchId, (err as Error).message);
    }
  }

  return emitted;
}

/** Push de aparición de la micro (deep-link al Match Center del partido). */
async function pushMicro(snap: LiveSnapshot, micro: MicroRow): Promise<void> {
  const def = MICRO_CATALOG[micro.kind as MicroKind];
  const emoji = micro.trigger_data?.emoji ?? def.emoji;
  const home = snap.meta.home.name;
  const away = snap.meta.away.name;
  await broadcastPush({
    kind: PUSH_KIND,
    payload: {
      title: `${emoji} Micro-predicción · ${home} vs ${away}`,
      body: `${micro.question} ¡Tienes ${micro.window_seconds}s!`,
      url: `/app/matchcenter/${snap.matchId}`,
      tag: `micro-${snap.matchId}`,
      icon: PUSH_ICON,
      badge: "/icons/badge-72.png",
    },
  });
}
