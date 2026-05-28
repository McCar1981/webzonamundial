// src/lib/match-center/formations.ts
//
// Plantillas de coordenadas para dibujar el once en la cancha. Cada jugador se
// define en el MEDIO CAMPO PROPIO normalizado: x 0..0.5 (0 = línea de fondo,
// portería; 0.5 = línea de medio campo), y 0..1 (0 = banda superior).
//
// El equipo local se dibuja tal cual (ataca hacia la derecha). El visitante se
// espeja en el render: x_render = 1 - x.

import type { LineupPlayer, TeamLineup } from "./types";

type RawPlayer = { num: number; pos: string; x: number; y: number };

const FORMATIONS: Record<string, RawPlayer[]> = {
  "4-3-3": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 2, pos: "DF", x: 0.18, y: 0.16 },
    { num: 4, pos: "DF", x: 0.16, y: 0.38 },
    { num: 5, pos: "DF", x: 0.16, y: 0.62 },
    { num: 3, pos: "DF", x: 0.18, y: 0.84 },
    { num: 6, pos: "MF", x: 0.3, y: 0.5 },
    { num: 8, pos: "MF", x: 0.33, y: 0.27 },
    { num: 10, pos: "MF", x: 0.33, y: 0.73 },
    { num: 7, pos: "FW", x: 0.46, y: 0.2 },
    { num: 9, pos: "FW", x: 0.48, y: 0.5 },
    { num: 11, pos: "FW", x: 0.46, y: 0.8 },
  ],
  "4-4-2": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 2, pos: "DF", x: 0.18, y: 0.16 },
    { num: 4, pos: "DF", x: 0.16, y: 0.38 },
    { num: 5, pos: "DF", x: 0.16, y: 0.62 },
    { num: 3, pos: "DF", x: 0.18, y: 0.84 },
    { num: 7, pos: "MF", x: 0.32, y: 0.16 },
    { num: 6, pos: "MF", x: 0.3, y: 0.38 },
    { num: 8, pos: "MF", x: 0.3, y: 0.62 },
    { num: 11, pos: "MF", x: 0.32, y: 0.84 },
    { num: 9, pos: "FW", x: 0.46, y: 0.38 },
    { num: 10, pos: "FW", x: 0.46, y: 0.62 },
  ],
  "4-2-3-1": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 2, pos: "DF", x: 0.18, y: 0.16 },
    { num: 4, pos: "DF", x: 0.16, y: 0.38 },
    { num: 5, pos: "DF", x: 0.16, y: 0.62 },
    { num: 3, pos: "DF", x: 0.18, y: 0.84 },
    { num: 6, pos: "MF", x: 0.28, y: 0.38 },
    { num: 8, pos: "MF", x: 0.28, y: 0.62 },
    { num: 7, pos: "MF", x: 0.4, y: 0.18 },
    { num: 10, pos: "MF", x: 0.42, y: 0.5 },
    { num: 11, pos: "MF", x: 0.4, y: 0.82 },
    { num: 9, pos: "FW", x: 0.48, y: 0.5 },
  ],
  "3-5-2": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 4, pos: "DF", x: 0.17, y: 0.28 },
    { num: 5, pos: "DF", x: 0.15, y: 0.5 },
    { num: 3, pos: "DF", x: 0.17, y: 0.72 },
    { num: 2, pos: "MF", x: 0.3, y: 0.1 },
    { num: 6, pos: "MF", x: 0.3, y: 0.34 },
    { num: 8, pos: "MF", x: 0.32, y: 0.5 },
    { num: 10, pos: "MF", x: 0.3, y: 0.66 },
    { num: 7, pos: "MF", x: 0.3, y: 0.9 },
    { num: 9, pos: "FW", x: 0.47, y: 0.38 },
    { num: 11, pos: "FW", x: 0.47, y: 0.62 },
  ],
  "3-4-3": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 4, pos: "DF", x: 0.17, y: 0.28 },
    { num: 5, pos: "DF", x: 0.15, y: 0.5 },
    { num: 3, pos: "DF", x: 0.17, y: 0.72 },
    { num: 2, pos: "MF", x: 0.31, y: 0.16 },
    { num: 6, pos: "MF", x: 0.29, y: 0.4 },
    { num: 8, pos: "MF", x: 0.29, y: 0.6 },
    { num: 7, pos: "MF", x: 0.31, y: 0.84 },
    { num: 11, pos: "FW", x: 0.46, y: 0.22 },
    { num: 9, pos: "FW", x: 0.48, y: 0.5 },
    { num: 10, pos: "FW", x: 0.46, y: 0.78 },
  ],
  "5-3-2": [
    { num: 1, pos: "GK", x: 0.05, y: 0.5 },
    { num: 2, pos: "DF", x: 0.2, y: 0.1 },
    { num: 4, pos: "DF", x: 0.16, y: 0.3 },
    { num: 5, pos: "DF", x: 0.14, y: 0.5 },
    { num: 6, pos: "DF", x: 0.16, y: 0.7 },
    { num: 3, pos: "DF", x: 0.2, y: 0.9 },
    { num: 8, pos: "MF", x: 0.32, y: 0.3 },
    { num: 10, pos: "MF", x: 0.34, y: 0.5 },
    { num: 7, pos: "MF", x: 0.32, y: 0.7 },
    { num: 9, pos: "FW", x: 0.47, y: 0.4 },
    { num: 11, pos: "FW", x: 0.47, y: 0.6 },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

export function buildLineup(formation: string): TeamLineup {
  const raw = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const starters: LineupPlayer[] = raw.map((p) => ({
    num: p.num,
    pos: p.pos,
    x: p.x,
    y: p.y,
  }));
  return { formation: FORMATIONS[formation] ? formation : "4-3-3", starters };
}
