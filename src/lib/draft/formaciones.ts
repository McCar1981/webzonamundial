// src/lib/draft/formaciones.ts
// Configuración de las 9 formaciones tácticas

import { DraftPosicion, FormacionKey } from "./types";

export interface FormacionConfig {
  key: FormacionKey;
  label: string;
  posiciones: DraftPosicion[];
  descripcion: string;
}

export const FORMACIONES: FormacionConfig[] = [
  {
    key: "4-3-3",
    label: "4-3-3",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "LE", "VOL", "MEI", "MEI", "PD", "CA", "PI"],
    descripcion: "Equilibrado, pide extremos",
  },
  {
    key: "4-4-2",
    label: "4-4-2",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "LE", "VOL", "VOL", "MEI", "MEI", "CA", "CA"],
    descripcion: "Clásico, doble 9",
  },
  {
    key: "4-2-3-1",
    label: "4-2-3-1",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "LE", "MCD", "MCD", "MEI", "EXT", "EXT", "CA"],
    descripcion: "Moderno, mediapunta",
  },
  {
    key: "4-2-4",
    label: "4-2-4",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "LE", "VOL", "VOL", "PD", "PI", "CA", "CA"],
    descripcion: "Ofensivo puro",
  },
  {
    key: "3-5-2",
    label: "3-5-2",
    posiciones: ["GOL", "ZAG", "ZAG", "ZAG", "LD", "LE", "VOL", "MEI", "MEI", "CA", "CA"],
    descripcion: "Control, carrileros",
  },
  {
    key: "5-3-2",
    label: "5-3-2",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "ZAG", "LE", "VOL", "MEI", "MEI", "CA", "CA"],
    descripcion: "Defensivo sólido",
  },
  {
    key: "4-5-1",
    label: "4-5-1",
    posiciones: ["GOL", "LD", "ZAG", "ZAG", "LE", "MCD", "VOL", "MEI", "EXT", "EXT", "CA"],
    descripcion: "Contragolpe",
  },
  {
    key: "3-4-3",
    label: "3-4-3",
    posiciones: ["GOL", "ZAG", "ZAG", "ZAG", "VOL", "MEI", "MEI", "VOL", "PD", "CA", "PI"],
    descripcion: "Ofensivo, volantes",
  },
];

export function getFormacion(key: FormacionKey): FormacionConfig {
  const f = FORMACIONES.find((x) => x.key === key);
  if (!f) throw new Error(`Formación no encontrada: ${key}`);
  return f;
}

/** Cuántos jugadores DISTINTOS ofrece un pool para cada posición. Cuenta por
 *  nombre porque el draft no admite repetir jugador aunque salga en dos clubes. */
function ofertaPorPosicion(
  pool: { jugadores: { nombre: string; posicion: DraftPosicion }[] }[]
): Map<DraftPosicion, number> {
  const vistos = new Map<DraftPosicion, Set<string>>();
  for (const club of pool) {
    for (const j of club.jugadores) {
      const set = vistos.get(j.posicion) ?? new Set<string>();
      set.add(j.nombre.toLowerCase().trim());
      vistos.set(j.posicion, set);
    }
  }
  const out = new Map<DraftPosicion, number>();
  for (const [pos, set] of vistos) out.set(pos, set.size);
  return out;
}

/**
 * ¿Se puede COMPLETAR esta formación con los clubes de esta liga?
 *
 * Con pools cortos había combinaciones sin salida: la Primera A de Colombia
 * (3 clubes) tiene un único extremo puro en todo el catálogo, así que un
 * 4-2-3-1 (pide dos EXT) o un 4-5-1 dejaban la partida en un bucle infinito de
 * tiradas muertas — y en contrarreloj el auto-pick seguía tirando el dado solo,
 * quemando batería, sin forma de salir. Ahora la formación se deshabilita antes
 * de empezar y se explica por qué.
 */
export interface ViabilidadFormacion {
  posible: boolean;
  /** Explicación cuando no es posible (vacío si lo es). */
  motivo?: string;
  /** Posición que falta (vacío si es posible). */
  posicion?: DraftPosicion;
}

export function formacionPosible(
  pool: { jugadores: { nombre: string; posicion: DraftPosicion }[] }[],
  formacion: FormacionKey
): ViabilidadFormacion {
  const oferta = ofertaPorPosicion(pool);
  const demanda = new Map<DraftPosicion, number>();
  for (const pos of getFormacion(formacion).posiciones) {
    demanda.set(pos, (demanda.get(pos) ?? 0) + 1);
  }
  for (const [pos, necesita] of demanda) {
    const hay = oferta.get(pos) ?? 0;
    if (hay < necesita) {
      return {
        posible: false,
        posicion: pos,
        motivo: hay === 0
          ? `Tu liga no tiene ningún ${pos}`
          : `Tu liga solo tiene ${hay} ${pos} y hacen falta ${necesita}`,
      };
    }
  }
  return { posible: true };
}

export function posicionesCompatibles(
  posicionRequerida: DraftPosicion,
  posicionJugador: DraftPosicion
): boolean {
  if (posicionRequerida === posicionJugador) return true;

  // Mapa de compatibilidad de posiciones
  const compat: Record<DraftPosicion, DraftPosicion[]> = {
    GOL: [],
    LD: ["LE"],
    ZAG: ["MCD"],
    LE: ["LD"],
    VOL: ["MEI", "MCD"],
    MEI: ["VOL", "EXT"],
    EXT: ["MEI", "PD", "PI"],
    CA: ["PD", "PI"],
    PD: ["EXT", "PI", "CA"],
    PI: ["EXT", "PD", "CA"],
    MCD: ["VOL", "ZAG"],
  };

  return compat[posicionRequerida]?.includes(posicionJugador) ?? false;
}
