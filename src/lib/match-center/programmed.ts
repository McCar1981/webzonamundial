// src/lib/match-center/programmed.ts
//
// Fuente ÚNICA de los partidos configurados para el Match Center con DATOS
// REALES (solo-reales: nunca simulan). REGLA FIJA del banner del hero:
//   1. Se muestran TODOS los partidos programados aquí, en orden cronológico.
//   2. Cuando uno termina, el banner pasa AUTOMÁTICAMENTE al siguiente programado.
//   3. Si no queda ninguno por jugar, cae al PRIMER partido del Mundial.
//
// Módulo sin dependencias de servidor (solo datos): seguro en cliente y servidor.

import { MATCHES } from "@/data/matches";

// Ids de partidos programados para el Match Center (datos reales). El selector
// los ordena por fecha de saque, así que el orden de esta lista es indiferente.
export const PROGRAMMED_MATCH_IDS: number[] = [9002];

// Los slots de prueba/amistosos usan ids >= 9000 para no chocar con el cuadro
// oficial (1..104).
const TEST_SLOT_MIN = 9000;

/**
 * Primer partido del Mundial (fallback final): el de fecha de saque más
 * temprana de la competición real (excluye los slots de prueba, id >= 9000).
 */
export function firstWorldCupMatchId(): number {
  const real = MATCHES.filter((m) => m.i < TEST_SLOT_MIN);
  if (real.length === 0) return MATCHES[0]?.i ?? 1;
  const sorted = [...real].sort((a, b) =>
    `${a.d}T${a.t}`.localeCompare(`${b.d}T${b.t}`),
  );
  return sorted[0].i;
}
