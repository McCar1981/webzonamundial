// src/lib/match-center/status.ts
//
// Conjuntos ÚNICOS de estados de api-football usados por TODO el Match Center
// (store, featured, poller, push y cliente). Antes cada módulo redefinía sus
// propias listas y divergían: el cliente no contemplaba SUSP (un partido
// suspendido se pintaba como "previa" sin marcador) y el push nunca cerraba un
// partido CANC/ABD (seguía sondeándose y los seguidores se quedaban con el pin
// fijado para siempre). Centralizarlos aquí evita esas inconsistencias.
//
// Módulo SIN dependencias de servidor (solo Sets de strings): importable tanto
// desde el cliente como desde el servidor.
//
// Referencia de estados api-football (fixture.status.short):
//   NS  = no empezado          1H/2H = primera/segunda parte
//   HT  = descanso             ET    = prórroga       BT = descanso de prórroga
//   P   = tanda de penaltis    LIVE  = en juego (genérico)
//   INT = interrumpido         SUSP  = suspendido
//   FT  = final reglamentario  AET   = final tras prórroga   PEN = final por penaltis
//   CANC= cancelado            ABD   = abandonado    AWD = adjudicado (resultado de despacho)
//   WO  = walkover             PST   = aplazado      TBD = hora por confirmar

/** EN JUEGO: el partido está vivo o pausado pero NO ha terminado. Incluye el
 *  descanso (HT) y el de la prórroga (BT), la tanda (P) y las pausas que pueden
 *  reanudarse (INT/SUSP). El minuto puede avanzar, así que un snapshot cacheado
 *  con uno de estos estados se considera perecedero. */
export const IN_PLAY = new Set<string>([
  "1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP",
]);

/** TERMINADO con partido jugado hasta su desenlace deportivo: dispara la crónica
 *  editorial, el push de final y la liquidación de predicciones. */
export const FINISHED = new Set<string>(["FT", "AET", "PEN"]);

/** TERMINAL: el partido no recibirá más actualizaciones. Engloba los finales
 *  jugados (FINISHED) y los anómalos (cancelado, abandonado, adjudicado,
 *  walkover, aplazado). El poller y el cliente DETIENEN el sondeo en cualquiera
 *  de estos estados. */
export const TERMINAL = new Set<string>([
  "FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO", "PST",
]);

export function isInPlay(status: string): boolean {
  return IN_PLAY.has(status);
}

export function isFinished(status: string): boolean {
  return FINISHED.has(status);
}

export function isTerminal(status: string): boolean {
  return TERMINAL.has(status);
}

/** Terminal pero NO un final deportivo normal: cancelado/abandonado/adjudicado/
 *  walkover/aplazado. La UI lo rotula como aviso (no como "Final") y el push
 *  manda un cierre apropiado en vez de "¡Gana X!". */
export function isAnomalousTerminal(status: string): boolean {
  return TERMINAL.has(status) && !FINISHED.has(status);
}

/** Etiqueta en español de un estado terminal anómalo (para la UI y el push). */
export const ANOMALOUS_TERMINAL_LABEL: Record<string, string> = {
  CANC: "Cancelado",
  ABD: "Abandonado",
  AWD: "Resultado adjudicado",
  WO: "Walkover",
  PST: "Aplazado",
};
