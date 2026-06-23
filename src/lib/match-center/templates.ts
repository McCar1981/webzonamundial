// src/lib/match-center/templates.ts
//
// Narración por PLANTILLA de eventos del Match Center. Módulo SIN dependencias
// de servidor (ni SDK de Anthropic ni KV): importable también desde el cliente,
// que la usa como respaldo cuando el feed aún no trae frase para un evento
// (p.ej. hitos de estado o actividad derivada de stats generados en cliente).
// El narrador IA (narrator.ts) la reexporta y la usa como base.

import type { MatchEvent, MatchMeta } from "./types";

export function teamName(meta: MatchMeta, side: MatchEvent["side"]): string {
  if (side === "home") return meta.home.name;
  if (side === "away") return meta.away.name;
  return "";
}

function who(e: MatchEvent): string {
  return e.player ? e.player : "el equipo";
}

/** Lado RIVAL (contrario). El "neutral" se mantiene. */
export function rivalSide(side: MatchEvent["side"]): MatchEvent["side"] {
  if (side === "home") return "away";
  if (side === "away") return "home";
  return "neutral";
}

/** Lado que SE BENEFICIA del evento (suma en el marcador). api-football acredita
 *  TODO gol —incluido el AUTOGOL— al lado que MARCA: en un autogol el evento ya
 *  viene con team = equipo beneficiado (el rival del jugador), con player = el
 *  jugador que la manda a su puerta. Por eso el beneficiario coincide SIEMPRE con
 *  e.side; NO hay que invertir (verificado contra el feed real, fixture 1489404
 *  Portugal–Uzbekistán: el autogol de A. Nematov llega con team=Portugal). */
export function beneficiarySide(e: MatchEvent): MatchEvent["side"] {
  return e.side;
}

/** Lado del EQUIPO DEL JUGADOR del evento. Coincide con e.side salvo en el
 *  AUTOGOL: ahí el jugador pertenece al RIVAL del lado acreditado (e.side es el
 *  beneficiado), así que es el lado contrario. Útil para etiquetar al actor
 *  (foto, "(País)", estadística del jugador) sin atribuirle el gol al equipo
 *  equivocado. */
export function actorSide(e: MatchEvent): MatchEvent["side"] {
  return e.type === "own_goal" ? rivalSide(e.side) : e.side;
}

// Expulsión = roja directa o segunda amarilla. Para narrar la situación
// numérica REAL (no asumir que el rival "tiene un hombre más" cuando ya iba con
// expulsados), contamos los jugadores en el campo por lado DESPUÉS de cada
// expulsión, recorriendo los eventos en orden cronológico.
const RED_TYPES = new Set<MatchEvent["type"]>(["red", "second_yellow"]);

/** Mapa eventId -> jugadores en el campo {home, away} tras esa expulsión. */
export function playersOnPitchByEvent(
  events: MatchEvent[],
): Record<string, { home: number; away: number }> {
  const ordered = [...events].sort(
    (a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0),
  );
  let home = 11;
  let away = 11;
  const out: Record<string, { home: number; away: number }> = {};
  for (const e of ordered) {
    if (!RED_TYPES.has(e.type)) continue;
    if (e.side === "home") home = Math.max(0, home - 1);
    else if (e.side === "away") away = Math.max(0, away - 1);
    else continue;
    out[e.id] = { home, away };
  }
  return out;
}

/** Frase neutra de la situación numérica tras una expulsión. */
export function numericalSituation(
  meta: MatchMeta,
  home: number,
  away: number,
): string {
  if (home === away) return `Quedan ${home} contra ${away}: igualdad numérica`;
  const moreName = home > away ? meta.home.name : meta.away.name;
  const lessName = home > away ? meta.away.name : meta.home.name;
  const hi = Math.max(home, away);
  const lo = Math.min(home, away);
  const diff = hi - lo;
  return `${moreName} con ${hi}, ${lessName} con ${lo}: ${moreName} en superioridad${diff > 1 ? ` de ${diff}` : ""}`;
}

/** Narración por plantilla. Siempre devuelve algo. */
export function templateNarration(e: MatchEvent, meta: MatchMeta): string {
  const team = teamName(meta, e.side);
  // "Minuto 76" y no "'76": el TTS lee el número pelado sin contexto y en
  // pantalla también se aprecia mejor (petición de Carlos viendo el directo).
  const min = `Minuto ${e.minute}`;
  switch (e.type) {
    case "kickoff":
      // El hito de reanudación usa detail para distinguir la 2ª parte.
      if (e.detail && /segunda/i.test(e.detail)) {
        return `¡Arranca la segunda parte! Se reanuda ${meta.home.name}–${meta.away.name}.`;
      }
      return `¡Rueda el balón! Arranca ${meta.home.name} contra ${meta.away.name}.`;
    case "goal":
      return `¡GOOOOL de ${team}! ${who(e)} la manda al fondo${e.assist ? `, tras asistencia de ${e.assist}` : ""}. ${min}.`;
    case "penalty_goal":
      return `¡GOL de penalti! ${who(e)} no perdona desde los once metros para ${team}. ${min}.`;
    case "own_goal":
      // El autogol sube al marcador del RIVAL del jugador, no de su equipo.
      return `¡Gol en propia puerta! Desafortunado ${who(e)}, sube al marcador para ${teamName(meta, beneficiarySide(e)) || "el rival"}. ${min}.`;
    case "penalty_miss":
      return `¡La falló! ${who(e)} desperdicia el penalti. Sigue todo igual. ${min}.`;
    case "yellow":
      return `Tarjeta amarilla para ${who(e)} de ${team}. ${e.detail || "Falta táctica"}. ${min}.`;
    case "second_yellow":
      return `¡Segunda amarilla! ${who(e)} se marcha y ${team} se queda con uno menos. ${min}.`;
    case "red":
      return `¡Tarjeta roja directa! ${who(e)} deja a ${team} con uno menos. ${min}.`;
    case "sub":
      return `Cambio en ${team}: entra ${e.playerIn || "un refresco"} por ${who(e)}. ${min}.`;
    case "var":
      return `El árbitro va al VAR... revisión en marcha. ${min}.`;
    case "corner":
      return `Saque de esquina para ${team}. Oportunidad de peligro. ${min}.`;
    case "shot_on":
      return `¡Remate de ${team}! Obliga a intervenir al portero. ${min}.`;
    case "shot":
      return `Disparo de ${team}, se va desviado por poco. ${min}.`;
    case "save":
      return `¡Paradón de ${team}! El meta evita el gol. ${min}.`;
    case "offside":
      return `Fuera de juego de ${team}. Se anula la jugada. ${min}.`;
    case "foul":
      return e.detail
        ? `${e.detail} de ${team}. ${min}.`
        : `Falta de ${team}. ${min}.`;
    case "injury":
      return `Atención médica sobre el césped para ${who(e)}. ${min}.`;
    case "chance":
      return `¡Qué ocasión de ${team}! Estuvo cerquísima. ${min}.`;
    case "half_time":
      return `Final del primer tiempo. ${meta.home.name} y ${meta.away.name} se van al descanso.`;
    case "full_time":
      return `¡Final del partido! Se acabó${meta.venue ? ` en ${meta.venue}` : ""}.`;
    default:
      return `${team} ${min}.`;
  }
}
