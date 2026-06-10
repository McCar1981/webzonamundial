// src/lib/stories/generator.ts
//
// MOTOR AUTOMÁTICO de Stories del sistema.
//
// Funciones PURAS que traducen el estado de un partido (LiveSnapshot del Match
// Center) en Stories del sistema (previa, gol, resumen diario). NO escribe nada
// ni lee otras tablas: recibe el snapshot ya resuelto y devuelve los inputs.
//
// Regla de ámbito: Stories SOLO LEE del Match Center. Aquí ni siquiera tocamos
// el Match Center; el snapshot llega como argumento (lo resuelve la capa que
// dispara el motor, en modo solo-lectura).
//
// Cada Story lleva un `gen_key` en template_data para deduplicar: el motor corre
// cada minuto, pero una misma previa/gol no debe re-emitirse en cada pasada.

import type { LiveSnapshot, MatchEvent } from "@/lib/match-center/types";
import type { CreateSystemStoryInput } from "./store";

// Estados de api-football que cuentan como "partido en curso".
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
// Estados de partido terminado (resultado final conocido).
export const FINAL_STATUSES = new Set(["FT", "AET", "PEN"]);
// Tipos de evento que cuentan como gol.
const GOAL_TYPES = new Set(["goal", "own_goal", "penalty_goal"]);

// ─── Claves de deduplicación ────────────────────────────────────────────────
export function genKeyPreMatch(matchId: number): string {
  return `previa:${matchId}`;
}
export function genKeyGoal(matchId: number, eventId: string): string {
  return `gol:${matchId}:${eventId}`;
}
export function genKeyHalfTime(matchId: number): string {
  return `descanso:${matchId}`;
}
export function genKeyFullTime(matchId: number): string {
  return `final:${matchId}`;
}
export function genKeyDaily(dateStr: string): string {
  return `diario:${dateStr}`;
}

// ─── Constructores de Story (puros) ─────────────────────────────────────────

/** Previa: encuesta "¿Quién gana?" con las dos selecciones del partido. */
export function preMatchStory(snap: LiveSnapshot): CreateSystemStoryInput {
  const home = snap.meta.home.name;
  const away = snap.meta.away.name;
  const matchId = snap.matchId;
  return {
    type: "system",
    overlayText: `⚽ ${home} vs ${away} — hoy ${snap.meta.time}`,
    widgets: [
      {
        kind: "poll",
        id: `poll-previa-${matchId}`,
        question: "¿Quién gana?",
        options: [
          { key: "home", label: home },
          { key: "draw", label: "Empate" },
          { key: "away", label: away },
        ],
      },
    ],
    relatedMatchId: String(matchId),
    templateData: { gen_key: genKeyPreMatch(matchId), auto: true },
  };
}

/** Gol: micro-reto SÍ/NO "¿Habrá más goles?" tras marcar un equipo. */
export function goalStory(snap: LiveSnapshot, ev: MatchEvent): CreateSystemStoryInput {
  const matchId = snap.matchId;
  const scorer = ev.player ? ` de ${ev.player}` : "";
  const score = `${snap.score[0]}-${snap.score[1]}`;
  const teamName = ev.side === "home" ? snap.meta.home.name : snap.meta.away.name;
  // goals_at: total de goles cuando se emite la Story. El resolutor compara
  // contra el total FINAL para corregir el micro-reto "¿Habrá más goles?".
  const goalsAt = snap.score[0] + snap.score[1];
  return {
    type: "system",
    overlayText: `⚽ GOOOL${scorer} (min ${ev.minute}) — ${teamName} · ${score}`,
    widgets: [
      {
        kind: "micro_challenge",
        id: `mc-gol-${matchId}-${ev.id}`,
        question: "¿Habrá más goles?",
      },
    ],
    relatedMatchId: String(matchId),
    templateData: { gen_key: genKeyGoal(matchId, ev.id), auto: true, goals_at: goalsAt },
  };
}

/** Descanso: marcador real al descanso + encuesta sobre la segunda parte. */
export function halfTimeStory(snap: LiveSnapshot): CreateSystemStoryInput {
  const matchId = snap.matchId;
  const home = snap.meta.home.name;
  const away = snap.meta.away.name;
  const score = `${snap.score[0]}-${snap.score[1]}`;
  return {
    type: "system",
    overlayText: `⏸️ Descanso — ${home} ${score} ${away}`,
    widgets: [
      {
        kind: "poll",
        id: `poll-descanso-${matchId}`,
        question: "¿Quién gana la 2ª parte?",
        options: [
          { key: "home", label: home },
          { key: "draw", label: "Empate" },
          { key: "away", label: away },
        ],
      },
    ],
    relatedMatchId: String(matchId),
    templateData: { gen_key: genKeyHalfTime(matchId), auto: true },
  };
}

/** Final: resultado real del partido + CTA al Match Center. */
export function fullTimeStory(snap: LiveSnapshot): CreateSystemStoryInput {
  const matchId = snap.matchId;
  const home = snap.meta.home.name;
  const away = snap.meta.away.name;
  const score = `${snap.score[0]}-${snap.score[1]}`;
  return {
    type: "system",
    overlayText: `🏁 Final — ${home} ${score} ${away}`,
    widgets: [
      {
        kind: "cta",
        id: `cta-final-${matchId}`,
        label: "Ver el partido completo",
        href: `/app/matchcenter/${matchId}`,
      },
    ],
    relatedMatchId: String(matchId),
    templateData: { gen_key: genKeyFullTime(matchId), auto: true },
  };
}

/** Resumen diario: CTA a los partidos del día. */
export function dailyStory(dateStr: string, matchCount: number): CreateSystemStoryInput {
  return {
    type: "system",
    overlayText: `☀️ Buenos días, DT. Hoy hay ${matchCount} ${matchCount === 1 ? "partido" : "partidos"}.`,
    widgets: [{ kind: "cta", id: `cta-diario-${dateStr}`, label: "Ver partidos del día", href: "/app/matchcenter" }],
    templateData: { gen_key: genKeyDaily(dateStr), auto: true },
  };
}

// ─── Decisión por snapshot ──────────────────────────────────────────────────
// Dado un snapshot y las claves ya emitidas, devuelve las Stories nuevas a crear.
// - NS (no empezado) → previa (una sola vez por partido).
// - En vivo → una Story por cada gol nuevo; al descanso (HT), Story de descanso.
// - Terminado (FT/AET/PEN) → Story de resultado final (una sola vez).
// Todo sale del snapshot REAL del Match Center: nada inventado.
export function storiesForSnapshot(
  snap: LiveSnapshot,
  existingKeys: Set<string>
): CreateSystemStoryInput[] {
  const out: CreateSystemStoryInput[] = [];

  if (snap.status === "NS") {
    const key = genKeyPreMatch(snap.matchId);
    if (!existingKeys.has(key)) out.push(preMatchStory(snap));
    return out;
  }

  if (LIVE_STATUSES.has(snap.status)) {
    if (snap.status === "HT") {
      const key = genKeyHalfTime(snap.matchId);
      if (!existingKeys.has(key)) out.push(halfTimeStory(snap));
    }
    for (const ev of snap.events) {
      if (!GOAL_TYPES.has(ev.type)) continue;
      const key = genKeyGoal(snap.matchId, ev.id);
      if (existingKeys.has(key)) continue;
      out.push(goalStory(snap, ev));
    }
    return out;
  }

  if (FINAL_STATUSES.has(snap.status)) {
    const key = genKeyFullTime(snap.matchId);
    if (!existingKeys.has(key)) out.push(fullTimeStory(snap));
  }

  return out;
}
