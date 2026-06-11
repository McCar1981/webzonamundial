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

// Los slots de prueba/amistosos usan ids >= 9000 para no chocar con el cuadro
// oficial (1..104).
const TEST_SLOT_MIN = 9000;

// Ids de partidos programados para el Match Center (datos reales). El selector
// los ordena por fecha de saque y AVANZA solo al siguiente cuando uno termina.
// Incluimos TODOS los partidos con equipos ya conocidos (toda la fase de grupos
// + cualquier amistoso de prueba con banderas reales). Los de eliminatorias
// arrancan con equipos "tbd" (W73, ganador de…) y se EXCLUYEN hasta que se
// rellenan en matches.ts conforme avanzan los clasificados — así el hero nunca
// muestra "W73 vs W75". Cuando un partido KO recibe sus dos banderas reales,
// entra automáticamente en la rotación.
export const PROGRAMMED_MATCH_IDS: number[] = MATCHES
  .filter((m) => m.hf !== "tbd" && m.af !== "tbd")
  .map((m) => m.i);

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
