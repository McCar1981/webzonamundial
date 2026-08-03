// src/lib/draft/recompensa.ts
// Cálculo único de la recompensa de una partida de Draft Mundial, para que el
// hook (que la acredita) y la pantalla de resultado (que la muestra) NUNCA se
// desincronicen. Combina:
//   · base por calificación (ya reducida a la mitad en simulacion.ts),
//   · bonus por avanzar en la campaña (campana.ts),
//   · penalización por quedar eliminado (campana.ts).
// El neto se acota a 0: una mala campaña recorta lo ganado, pero nunca resta
// del saldo que el usuario ya tenía.

import { DraftResultado, Modo } from "./types";
import { puntosPorCalificacion, monedasPorCalificacion } from "./simulacion";
import { Campana, calcularBonusCampana, penalizacionCampana, quedoEliminado } from "./campana";

// Multiplicador de recompensa por MODO. Almanaque se juega "de memoria" (sin
// ver la fuerza): es el modo más difícil y antes pagaba EXACTAMENTE lo mismo
// que Clásico. Se define aquí, compartido por el cliente (que muestra/acredita)
// y el servidor (que acota las monedas), para que nunca discrepen.
export function multiplicadorModo(modo?: Modo | string | null): number {
  return modo === "almanaque" ? 1.4 : 1;
}

export interface RecompensaDraft {
  /** Puntos XP netos acreditados. */
  xp: number;
  /** Monedas netas acreditadas. */
  coins: number;
  baseXp: number;
  baseCoins: number;
  /** Monedas extra por desempeño en la campaña. */
  bonusCoins: number;
  /** Descuento de monedas por quedar eliminado. */
  penalCoins: number;
  /** Descuento de XP por quedar eliminado. */
  penalXp: number;
  eliminado: boolean;
}

export function calcularRecompensaDraft(
  cal: DraftResultado["calificacion"],
  campana: Campana | null,
  modo?: Modo | string | null,
): RecompensaDraft {
  const mult = multiplicadorModo(modo);
  const baseXp = Math.round(puntosPorCalificacion(cal) * mult);
  const baseCoins = Math.round(monedasPorCalificacion(cal) * mult);
  const bonusCoins = campana ? calcularBonusCampana(campana) : 0;
  const penal = campana ? penalizacionCampana(campana) : { coins: 0, xp: 0 };

  return {
    xp: Math.max(0, baseXp - penal.xp),
    coins: Math.max(0, baseCoins + bonusCoins - penal.coins),
    baseXp,
    baseCoins,
    bonusCoins,
    penalCoins: penal.coins,
    penalXp: penal.xp,
    eliminado: campana ? quedoEliminado(campana) : false,
  };
}
