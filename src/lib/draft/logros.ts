// src/lib/draft/logros.ts
// Sistema de logros/badges del Draft Mundial

import { DraftResultado, JugadorSeleccionado } from "./types";

export interface DraftLogro {
  id: string;
  icon: string;
  nombre: string;
  descripcion: string;
  condicion: (resultado: DraftResultado, equipo: JugadorSeleccionado[], modo: string) => boolean;
}

export const LOGROS: DraftLogro[] = [
  {
    id: "primer-draft",
    icon: "🥉",
    nombre: "Primer Draft",
    descripcion: "Completá tu primer equipo",
    condicion: () => true,
  },
  {
    id: "draft-experto",
    icon: "🥈",
    nombre: "Draft Experto",
    descripcion: "Obtené Oro o superior",
    condicion: (r) => ["Oro", "Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    id: "draft-maestro",
    icon: "🥇",
    nombre: "Draft Maestro",
    descripcion: "Obtené Platino o superior",
    condicion: (r) => ["Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    id: "leyenda-viva",
    icon: "👑",
    nombre: "Leyenda Viva",
    descripcion: "Obtené calificación Leyenda",
    condicion: (r) => r.calificacion === "Leyenda",
  },
  {
    id: "arquitecto",
    icon: "🌍",
    nombre: "Arquitecto",
    descripcion: "3+ jugadores de la misma selección en un draft",
    condicion: (_, eq) => {
      const selecciones = new Map<string, number>();
      eq.forEach((j) => selecciones.set(j.seleccion, (selecciones.get(j.seleccion) || 0) + 1));
      return Array.from(selecciones.values()).some((c) => c >= 3);
    },
  },
  {
    id: "contra-el-tiempo",
    icon: "⏰",
    nombre: "Contra el Tiempo",
    descripcion: "Completá un draft en modo Contrarreloj",
    condicion: (_, __, modo) => modo === "contrarreloj",
  },
  {
    id: "de-memoria",
    icon: "🧠",
    nombre: "De Memoria",
    descripcion: "Obtené Oro+ en modo De Almanaque",
    condicion: (r, __, modo) => modo === "almanaque" && ["Oro", "Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    id: "equilibrista",
    icon: "⚖️",
    nombre: "Equilibrista",
    descripcion: "Obtené 95+ en Balance",
    condicion: (r) => r.balance >= 95,
  },
  {
    id: "historiador",
    icon: "📜",
    nombre: "Historiador",
    descripcion: "Usá jugadores de 5+ selecciones distintas",
    condicion: (_, eq) => new Set(eq.map((j) => j.seleccion)).size >= 5,
  },
  {
    id: "muralla",
    icon: "🛡️",
    nombre: "La Muralla",
    descripcion: "Todos los defensores con fuerza 85+",
    condicion: (_, eq) => {
      const defs = eq.filter((j) => ["GOL", "LD", "ZAG", "LE"].includes(j.posicion));
      return defs.length >= 4 && defs.every((j) => j.fuerza >= 85);
    },
  },
];

const STORAGE_KEY = "zm-draft-logros";

export function loadLogros(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLogros(logros: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logros));
}

export function checkLogros(
  resultado: DraftResultado,
  equipo: JugadorSeleccionado[],
  modo: string,
  estadoActual: Record<string, boolean>
): DraftLogro[] {
  const nuevos: DraftLogro[] = [];
  for (const logro of LOGROS) {
    if (!estadoActual[logro.id] && logro.condicion(resultado, equipo, modo)) {
      nuevos.push(logro);
    }
  }
  return nuevos;
}
