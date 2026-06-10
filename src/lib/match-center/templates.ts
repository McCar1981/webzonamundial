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
      return `¡Gol en propia puerta! Desafortunado ${who(e)}, sube al marcador para ${team}. ${min}.`;
    case "penalty_miss":
      return `¡La falló! ${who(e)} desperdicia el penalti. Sigue todo igual. ${min}.`;
    case "yellow":
      return `Tarjeta amarilla para ${who(e)} de ${team}. ${e.detail || "Falta táctica"}. ${min}.`;
    case "second_yellow":
      return `¡Segunda amarilla! ${who(e)} se va a la ducha, ${team} con uno menos. ${min}.`;
    case "red":
      return `¡Roja directa! ${who(e)} deja a ${team} en inferioridad. ${min}.`;
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
      return `¡Paradón! El meta salva a su equipo ante ${team}. ${min}.`;
    case "offside":
      return `Fuera de juego de ${team}. Se anula la jugada. ${min}.`;
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
