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
