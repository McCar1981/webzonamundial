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
 * Ordena las posiciones de una LÍNEA de izquierda a derecha de forma realista,
 * para que el campo no salga reflejado: los laterales y extremos a su banda
 * (LE/PI a la izquierda, LD/PD a la derecha) y los centrales en medio. Si una
 * línea tiene dos extremos (EXT), se reparten uno a cada banda.
 */
function ordenarBanda(posiciones: DraftPosicion[]): DraftPosicion[] {
  const izq: DraftPosicion[] = [];
  const centro: DraftPosicion[] = [];
  const der: DraftPosicion[] = [];
  const nExt = posiciones.filter((p) => p === "EXT").length;
  let extTurno = 0;

  for (const p of posiciones) {
    if (p === "LE" || p === "PI") {
      izq.push(p);
    } else if (p === "LD" || p === "PD") {
      der.push(p);
    } else if (p === "EXT" && nExt >= 2) {
      // Dos (o más) extremos = bandas: alterna izquierda / derecha.
      (extTurno % 2 === 0 ? izq : der).push(p);
      extTurno++;
    } else {
      centro.push(p);
    }
  }

  return [...izq, ...centro, ...der];
}

/**
 * Devuelve las casillas de una formación con sus coordenadas. La primera
 * (portero) siempre va abajo-centro; el resto se reparte por líneas según los
 * dígitos de la clave, cada línea ordenada izquierda→derecha.
 */
export function layoutFormacion(key: FormacionKey): SlotLayout[] {
  const form = getFormacion(key);
  const posiciones = form.posiciones;
  const bandas = key.split("-").map(Number).filter((n) => Number.isFinite(n) && n > 0);

  const slots: SlotLayout[] = [{ id: 0, pos: posiciones[0], x: 50, y: Y_GK }];

  const fueraDelArco = posiciones.slice(1); // 10 jugadores de campo
  const nBandas = bandas.length;
  let cursor = 0;
  let id = 1;

  bandas.forEach((cuenta, b) => {
    const y = nBandas <= 1 ? 50 : Y_DEF - (b / (nBandas - 1)) * (Y_DEF - Y_ATT);
    const banda = ordenarBanda(fueraDelArco.slice(cursor, cursor + cuenta));
    for (let k = 0; k < banda.length; k++) {
      const x = banda.length === 1 ? 50 : X_MIN + (k / (banda.length - 1)) * (X_MAX - X_MIN);
      slots.push({ id: id++, pos: banda[k], x, y });
    }
    cursor += cuenta;
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
