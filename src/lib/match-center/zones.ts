// src/lib/match-center/zones.ts
//
// Máquina de estados de ZONAS del balón. Convierte un evento de partido en una
// posición plausible del balón en coordenadas normalizadas (0..1), garantizando
// que el balón NUNCA aparezca en el lado equivocado de la cancha.
//
// Convención del modelo de datos (igual que simulation.ts y Pitch.tsx):
//   - "home" ataca hacia x=1 (portería rival a la derecha).
//   - "away" ataca hacia x=0 (portería rival a la izquierda).
//   - La portería PROPIA de cada equipo está en su lado de salida.
//   - El componente Pitch aplica el `flip` de la 2ª mitad por su cuenta; aquí
//     siempre razonamos con la orientación de la 1ª mitad.
//
// Se usa en dos sitios:
//   1. apiFootball.ts → al mapear eventos REALES (que vienen sin coordenadas)
//      les asigna x/y, de modo que en un gol el balón viaja al área correcta.
//   2. MatchCenterLive (fallback) → si un evento llega sin x/y, deriva la zona.
//
// El motor de SIMULACIÓN ya genera coordenadas más ricas; esta máquina es la
// red de seguridad para el modo en vivo, donde la API no da posición de jugada.

import type { MatchEvent, MatchEventType } from "./types";

export type Side = "home" | "away" | "neutral";
export interface Zone {
  x: number;
  y: number;
}

// Hash determinista 0..1 a partir del id del evento, para que la coordenada y
// (y la variación dentro de la zona) no caiga siempre en el centro exacto. Así
// dos goles del mismo equipo no se pintan en el píxel idéntico.
function hash01(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

// Mapea un valor 0..1 a un rango [lo, hi].
function band(r: number, lo: number, hi: number): number {
  return lo + r * (hi - lo);
}

// Espejo en x según el lado atacante. `home` usa el rango tal cual (hacia x=1);
// `away` lo refleja (hacia x=0). Recibe un rango pensado para HOME atacando.
function mirrorX(side: Side, homeLo: number, homeHi: number, r: number): number {
  const v = band(r, homeLo, homeHi);
  return side === "away" ? 1 - v : v;
}

/**
 * Devuelve la zona (x,y normalizadas) donde colocar el balón para un evento.
 * `null` significa "no mover el balón" (p.ej. un cambio: la acción es en la
 * banda, no en el campo).
 */
export function zoneForEvent(
  type: MatchEventType,
  side: Side,
  id: string,
): Zone | null {
  const r = hash01(id);
  const r2 = hash01(id + ":y");
  // y vertical: centrado con dispersión; los penaltis/centros se tratan aparte.
  const yMid = band(r2, 0.34, 0.66);

  switch (type) {
    // --- Neutros: centro del campo, sin lado ---
    case "kickoff":
    case "half_time":
    case "full_time":
      return { x: 0.5, y: 0.5 };

    // VAR e injury: dejamos el balón donde estaba (no inventamos lado).
    case "var":
    case "injury":
      return null;

    // --- Goles y ocasiones claras: área rival, lado CORRECTO ---
    case "goal":
    case "own_goal":
      // Un autogol lo marca el rival en su propia portería: el balón acaba en
      // la portería del equipo `side`, es decir en SU lado (x bajo para home).
      if (type === "own_goal") {
        return { x: mirrorX(side, 0.04, 0.12, r), y: band(r2, 0.4, 0.6) };
      }
      return { x: mirrorX(side, 0.86, 0.95, r), y: band(r2, 0.38, 0.62) };
    case "penalty_goal":
    case "penalty_miss":
      // Punto de penalti del rival (~11 m): x fijo, y muy centrada.
      return { x: mirrorX(side, 0.87, 0.89, r), y: band(r2, 0.44, 0.56) };
    case "chance":
    case "shot_on":
      return { x: mirrorX(side, 0.78, 0.9, r), y: yMid };
    case "shot":
      return { x: mirrorX(side, 0.68, 0.82, r), y: yMid };

    // --- Córner: banderín del córner en el lado de ataque ---
    case "corner":
      return {
        x: side === "away" ? band(r, 0.02, 0.05) : band(r, 0.95, 0.98),
        y: r2 < 0.5 ? 0.05 : 0.95,
      };

    // --- Atajada: el portero de `side` despeja en SU propia área ---
    case "save":
      return { x: mirrorX(side, 0.05, 0.14, r), y: band(r2, 0.4, 0.6) };

    // --- Fuera de juego: línea de la defensa rival, último tercio ---
    case "offside":
      return { x: mirrorX(side, 0.6, 0.74, r), y: yMid };

    // --- Tarjetas: donde se cometió la falta; mediocampo con dispersión ---
    case "yellow":
    case "second_yellow":
    case "red":
      return { x: mirrorX(side, 0.4, 0.6, r), y: band(r2, 0.25, 0.75) };

    // --- Cambio: ocurre en la banda, el balón no se mueve ---
    case "sub":
      return null;

    default:
      return null;
  }
}

/**
 * Rellena x/y en eventos que no las traen (caso típico: feed en vivo de la API,
 * que no da posición de jugada). Respeta las coordenadas existentes si ya están.
 * Devuelve un NUEVO array; no muta los eventos originales.
 */
export function withBallZones(events: MatchEvent[]): MatchEvent[] {
  return events.map((e) => {
    if (typeof e.x === "number" && typeof e.y === "number") return e;
    const z = zoneForEvent(e.type, e.side, e.id);
    if (!z) return e;
    return { ...e, x: z.x, y: z.y };
  });
}
