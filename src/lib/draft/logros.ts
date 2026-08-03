// src/lib/draft/logros.ts
// Sistema de logros/badges del Draft Mundial

import { DraftResultado, JugadorSeleccionado } from "./types";

const POS_DEFENSA = ["GOL", "LD", "ZAG", "LE"];

// Contexto opcional para condiciones que dependen de la liga. Hoy solo lo usa
// "La Muralla": su umbral de fuerza se normaliza al techo de la liga en vez de
// un 85 fijo (imposible en las ligas latinoamericanas).
export interface LogroCtx {
  muroUmbral: number;
}

export interface DraftLogro {
  id: string;
  icon: string;
  nombre: string;
  descripcion: string;
  condicion: (
    resultado: DraftResultado,
    equipo: JugadorSeleccionado[],
    modo: string,
    ctx: LogroCtx
  ) => boolean;
}

export const LOGROS: DraftLogro[] = [
  {
    id: "primer-draft",
    icon: "🥉",
    nombre: "Primer Draft",
    descripcion: "Completa tu primer equipo",
    condicion: () => true,
  },
  {
    id: "draft-experto",
    icon: "🥈",
    nombre: "Draft Experto",
    descripcion: "Consigue Oro o superior",
    condicion: (r) => ["Oro", "Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    id: "draft-maestro",
    icon: "🥇",
    nombre: "Draft Maestro",
    descripcion: "Consigue Platino o superior",
    condicion: (r) => ["Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    id: "leyenda-viva",
    icon: "👑",
    nombre: "Leyenda Viva",
    descripcion: "Consigue calificación Leyenda",
    condicion: (r) => r.calificacion === "Leyenda",
  },
  {
    id: "arquitecto",
    icon: "🌍",
    nombre: "Arquitecto",
    descripcion: "3+ jugadores del mismo club en un draft",
    condicion: (_, eq) => {
      const clubes = new Map<string, number>();
      eq.forEach((j) => clubes.set(j.seleccion, (clubes.get(j.seleccion) || 0) + 1));
      return Array.from(clubes.values()).some((c) => c >= 3);
    },
  },
  {
    id: "contra-el-tiempo",
    icon: "⏰",
    nombre: "Contra el Tiempo",
    descripcion: "Completa un draft en modo Contrarreloj",
    condicion: (_, __, modo) => modo === "contrarreloj",
  },
  {
    id: "de-memoria",
    icon: "🧠",
    nombre: "De Memoria",
    descripcion: "Consigue Oro+ en modo Almanaque",
    condicion: (r, __, modo) => modo === "almanaque" && ["Oro", "Platino", "Leyenda"].includes(r.calificacion),
  },
  {
    // Antes pedía "95+ en Balance", que con el once completo valía 100 siempre:
    // se regalaba en la primera partida. Ahora pide un bloque real del mismo
    // club, que es una decisión de verdad durante el draft.
    id: "equilibrista",
    icon: "⚖️",
    nombre: "Bloque de Club",
    descripcion: "Junta 4 jugadores del mismo club",
    condicion: (_, eq) => {
      const porClub = new Map<string, number>();
      for (const j of eq) porClub.set(j.seleccion, (porClub.get(j.seleccion) || 0) + 1);
      return [...porClub.values()].some((n) => n >= 4);
    },
  },
  {
    id: "historiador",
    icon: "📜",
    nombre: "Historiador",
    descripcion: "Usa jugadores de 5 o más clubes distintos",
    condicion: (_, eq) => new Set(eq.map((j) => j.seleccion)).size >= 5,
  },
  {
    id: "muralla",
    icon: "🛡️",
    nombre: "La Muralla",
    descripcion: "Tus 4+ defensores, todos entre los más fuertes de tu liga",
    // El umbral (muroUmbral) lo pone checkLogros normalizado a la liga: era un
    // 85 FIJO, imposible en LigaPro, Primera A, FUTVE y demás (sus XI icónicos
    // no llegan a 85). Ahora en ligas potentes sigue siendo 85 y en ligas más
    // flojas baja al techo de esa liga, así el logro es difícil pero alcanzable.
    condicion: (_, eq, __, ctx) => {
      const defs = eq.filter((j) => ["GOL", "LD", "ZAG", "LE"].includes(j.posicion));
      return defs.length >= 4 && defs.every((j) => j.fuerza >= ctx.muroUmbral);
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

// Umbral de "defensor de muralla" normalizado a la liga. Era un 85 FIJO,
// imposible en LigaPro, Liga MX o Primera A: sus XI icónicos no tienen 4
// defensas de 85+. Tampoco vale el techo del motor (media del once soñado),
// que lo inflan los delanteros y no refleja la defensa. El umbral es la fuerza
// del 6º mejor DEFENSA de la liga: así siempre hay al menos 6 defensas que
// califican —el logro es POSIBLE en toda liga— pero exige que tus 4 defensas
// estén entre la élite defensiva de esa liga (difícil, depende del dado).
function muroUmbralDeLiga(pool?: { jugadores: { posicion: string; fuerza: number }[] }[]): number {
  if (!pool || pool.length === 0) return 85;
  const fuerzasDef = pool
    .flatMap((p) => p.jugadores)
    .filter((j) => POS_DEFENSA.includes(j.posicion))
    .map((j) => j.fuerza)
    .sort((a, b) => b - a);
  if (fuerzasDef.length < 4) return 85;
  const idx = Math.min(5, fuerzasDef.length - 1); // 6º mejor (o el último si hay menos)
  return fuerzasDef[idx];
}

export function checkLogros(
  resultado: DraftResultado,
  equipo: JugadorSeleccionado[],
  modo: string,
  estadoActual: Record<string, boolean>,
  pool?: { jugadores: { posicion: string; fuerza: number }[] }[]
): DraftLogro[] {
  const ctx: LogroCtx = { muroUmbral: muroUmbralDeLiga(pool) };
  const nuevos: DraftLogro[] = [];
  for (const logro of LOGROS) {
    if (!estadoActual[logro.id] && logro.condicion(resultado, equipo, modo, ctx)) {
      nuevos.push(logro);
    }
  }
  return nuevos;
}
