// World map — dotted grid land mask (stylized).
// Port literal de /tmp/design/zm-selecciones/project/worldmap-data.js

// Cada rect: [lonMin, lonMax, latMin, latMax]
const LAND: ReadonlyArray<readonly [number, number, number, number]> = [
  // ---- NORTH AMERICA ----
  [-125, -65, 30, 49],
  [-140, -65, 49, 68],
  [-160, -130, 55, 70],
  [-110, -86, 15, 32],
  [-92, -78, 8, 18],
  [-87, -79, 21, 23.5],
  [-79, -76, 18, 20],
  [-128, -114, 30, 42],
  [-95, -80, 25, 32],
  [-105, -80, 32, 49],
  // ---- GREENLAND ----
  [-55, -22, 60, 82],
  // ---- SOUTH AMERICA ----
  [-77, -35, -5, 12],
  [-78, -35, -22, -5],
  [-73, -55, -38, -22],
  [-75, -65, -55, -38],
  [-44, -34, -8, -1],
  // ---- EUROPE ----
  [-10, 30, 42, 60],
  [-10, 2, 50, 60],
  [5, 32, 55, 71],
  [20, 45, 40, 55],
  [-10, 4, 36, 44],
  [10, 20, 36, 42],
  [20, 28, 35, 42],
  // ---- AFRICA ----
  [-18, 38, 15, 35],
  [-18, 52, -10, 15],
  [12, 42, -35, -10],
  [40, 52, 8, 16],
  [44, 52, -26, -12],
  // ---- ASIA ----
  [30, 60, 12, 42],
  [30, 180, 50, 72],
  [55, 90, 30, 55],
  [65, 100, 8, 35],
  [95, 135, 5, 40],
  [98, 110, -5, 15],
  [130, 145, 32, 45],
  [125, 131, 33, 38],
  [95, 142, -10, 8],
  [120, 127, 5, 20],
  // ---- OCEANIA ----
  [113, 154, -39, -11],
  [165, 178, -47, -35],
  // ---- ANTARCTICA ----
  [-180, 180, -85, -65],
];

const OCEAN: ReadonlyArray<readonly [number, number, number, number]> = [
  [-65, -50, 55, 68],
  [-100, -90, 55, 65],
  [-90, -78, 15, 22],
  [10, 40, 40, 46],
  [50, 80, 40, 50],
  [110, 140, -5, 5],
  [40, 52, 12, 30],
];

function inRects(
  lon: number,
  lat: number,
  rects: ReadonlyArray<readonly [number, number, number, number]>,
): boolean {
  for (const [a, b, c, d] of rects) {
    if (lon >= a && lon <= b && lat >= c && lat <= d) return true;
  }
  return false;
}

export interface WorldDot {
  lon: number;
  lat: number;
}

// Sample at 4° resolution.
const STEP = 4;

export const WORLD_DOTS: WorldDot[] = (() => {
  const dots: WorldDot[] = [];
  for (let lat = 84; lat >= -84; lat -= STEP) {
    for (let lon = -176; lon <= 176; lon += STEP) {
      if (inRects(lon, lat, LAND) && !inRects(lon, lat, OCEAN)) {
        dots.push({ lon, lat });
      }
    }
  }
  return dots;
})();

export const WORLD_VB = { w: 1440, h: 720, step: STEP } as const;

export function projectEquirectangular(lon: number, lat: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * 1440,
    y: ((90 - lat) / 180) * 720,
  };
}
