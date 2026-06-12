// src/lib/draft/layout.ts
// Convierte una formación en CASILLAS con coordenadas en el campo.
//
// El minijuego antes guardaba un jugador POR TIPO de posición, así que un
// 4-3-3 (con 2 ZAG y 2 MEI) se colapsaba y el campo dibujaba 3 atrás. Ahora
// cada formación se expande a sus casillas reales y cada casilla recibe su
// coordenada, leyendo la propia clave ("4-3-3" → líneas [4,3,3]).
//
// Las posiciones en formaciones.ts están ORDENADAS por línea (portero, defensa,
// medios, ataque), así que asignar las casillas en orden a las líneas de la
// clave produce la estructura correcta en TODAS las formaciones.

import { DraftPosicion, FormacionKey } from "./types";
import { getFormacion } from "./formaciones";

export interface SlotLayout {
  /** Índice estable de la casilla (0 = portero). */
  id: number;
  /** Posición requerida en esta casilla. */
  pos: DraftPosicion;
  /** Coordenadas en % sobre el campo (viewBox lógico 0–100). */
  x: number;
  y: number;
}

// Bandas verticales: portería abajo (y alto), ataque arriba (y bajo).
const Y_DEF = 73;   // línea defensiva
const Y_ATT = 19;   // línea más adelantada
const Y_GK = 92;    // portero
const X_MIN = 13;   // margen lateral para la dispersión horizontal
const X_MAX = 87;

/**
 * Devuelve las casillas de una formación con sus coordenadas. La primera
 * (portero) siempre va abajo-centro; el resto se reparte por líneas según los
 * dígitos de la clave.
 */
export function layoutFormacion(key: FormacionKey): SlotLayout[] {
  const form = getFormacion(key);
  const posiciones = form.posiciones;
  const bandas = key.split("-").map(Number).filter((n) => Number.isFinite(n) && n > 0);

  const slots: SlotLayout[] = [{ id: 0, pos: posiciones[0], x: 50, y: Y_GK }];

  const fueraDelArco = posiciones.slice(1); // 10 jugadores de campo
  const nBandas = bandas.length;
  let idx = 0;

  bandas.forEach((cuenta, b) => {
    const y = nBandas <= 1 ? 50 : Y_DEF - (b / (nBandas - 1)) * (Y_DEF - Y_ATT);
    for (let k = 0; k < cuenta; k++) {
      const x = cuenta === 1 ? 50 : X_MIN + (k / (cuenta - 1)) * (X_MAX - X_MIN);
      const pos = fueraDelArco[idx];
      if (pos) slots.push({ id: idx + 1, pos, x, y });
      idx++;
    }
  });

  return slots;
}

// Abreviatura corta por posición (etiqueta de la casilla y del fantasma).
export function posicionAbbr(pos: DraftPosicion): string {
  const map: Record<DraftPosicion, string> = {
    GOL: "POR", LD: "LD", ZAG: "CT", LE: "LI",
    VOL: "VOL", MEI: "MED", MCD: "MCD",
    EXT: "EXT", CA: "DC", PD: "ED", PI: "EI",
  };
  return map[pos] || pos;
}
