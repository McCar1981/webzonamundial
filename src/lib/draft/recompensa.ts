// src/lib/draft/recompensa.ts
// Cálculo único de la recompensa de una partida de Draft Mundial, para que el
// hook (que la acredita) y la pantalla de resultado (que la muestra) NUNCA se
// desincronicen. Combina:
//   · base por calificación (ya reducida a la mitad en simulacion.ts),
//   · bonus por avanzar en la campaña (campana.ts),
//   · penalización por quedar eliminado (campana.ts).
// El neto se acota a 0: una mala campaña recorta lo ganado, pero nunca resta
// del saldo que el usuario ya tenía.

import { DraftResultado } from "./types";
import { puntosPorCalificacion, monedasPorCalificacion } from "./simulacion";
import { Campana, calcularBonusCampana, penalizacionCampana, quedoEliminado } from "./campana";

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
): RecompensaDraft {
  const baseXp = puntosPorCalificacion(cal);
  const baseCoins = monedasPorCalificacion(cal);
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
