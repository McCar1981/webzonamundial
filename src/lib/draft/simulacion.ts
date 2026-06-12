// src/lib/draft/simulacion.ts
// Motor de simulación del Draft Mundial

import {
  DraftPosicion,
  DraftResultado,
  Estilo,
  JugadorSeleccionado,
} from "./types";

interface JugadorSimple {
  posicion: DraftPosicion;
  fuerza: number;
}

function promedioStats(jugadores: JugadorSimple[]): number {
  if (jugadores.length === 0) return 0;
  return Math.round(jugadores.reduce((s, j) => s + j.fuerza, 0) / jugadores.length);
}

function contarPorLinea(jugadores: JugadorSimple[]) {
  let def = 0;
  let med = 0;
  let ata = 0;
  for (const j of jugadores) {
    if (["GOL", "LD", "ZAG", "LE"].includes(j.posicion)) def++;
    else if (["VOL", "MEI", "MCD"].includes(j.posicion)) med++;
    else ata++;
  }
  return { def, med, ata };
}

export function calcularBalance(jugadores: JugadorSimple[]): number {
  const { def, med, ata } = contarPorLinea(jugadores);
  let balance = 100;

  // Penalizaciones por estructura
  const tienePortero = jugadores.some((j) => j.posicion === "GOL");
  if (!tienePortero) balance -= 30;

  const centrales = jugadores.filter((j) => j.posicion === "ZAG").length;
  if (centrales === 0) balance -= 20;

  const mediocentros = jugadores.filter((j) => ["VOL", "MEI", "MCD"].includes(j.posicion)).length;
  if (mediocentros === 0) balance -= 15;

  const delanteros = jugadores.filter((j) => ["CA", "PD", "PI", "EXT"].includes(j.posicion)).length;
  if (delanteros === 0) balance -= 15;

  // Penalización por desbalance extremo
  if (ata > 5) balance -= 10;
  if (def > 6) balance -= 10;
  if (med > 5) balance -= 5;

  return Math.max(0, Math.min(100, balance));
}

export function calcularCoherencia(equipo: JugadorSeleccionado[]): number {
  let coherencia = 50;

  // Bonus por selecciones repetidas
  const selecciones = new Map<string, number>();
  const years = new Map<number, number>();

  for (const j of equipo) {
    selecciones.set(j.seleccion, (selecciones.get(j.seleccion) || 0) + 1);
    years.set(j.year, (years.get(j.year) || 0) + 1);
  }

  for (const [, count] of selecciones) {
    if (count >= 3) coherencia += 5;
  }

  for (const [, count] of years) {
    if (count >= 2) coherencia += 3;
  }

  // Bonus por portero + defensa de misma selección
  const portero = equipo.find((j) => j.posicion === "GOL");
  if (portero) {
    const defensasMisma = equipo.filter(
      (j) => ["LD", "ZAG", "LE"].includes(j.posicion) && j.seleccion === portero.seleccion
    ).length;
    if (defensasMisma >= 2) coherencia += 2;
  }

  // Bonus por delantera completa de misma selección
  const delantera = equipo.filter((j) => ["CA", "PD", "PI", "EXT"].includes(j.posicion));
  if (delantera.length >= 2) {
    const primeraSel = delantera[0]?.seleccion;
    if (primeraSel && delantera.every((j) => j.seleccion === primeraSel)) {
      coherencia += 4;
    }
  }

  return Math.max(0, Math.min(100, coherencia));
}

export function aplicarBonusEstilo(
  jugadores: JugadorSimple[],
  estilo: Estilo
): number {
  const { def, med, ata } = contarPorLinea(jugadores);

  switch (estilo) {
    case "defensivo":
      return Math.min(20, def * 3);
    case "ofensivo":
      return Math.min(20, ata * 4);
    case "equilibrado":
      const ideal = Math.abs(def - 4) + Math.abs(med - 3) + Math.abs(ata - 3);
      return Math.max(0, 15 - ideal * 2);
    default:
      return 0;
  }
}

export function calcularResultado(
  equipo: JugadorSeleccionado[],
  estilo: Estilo
): DraftResultado {
  const jugadores = equipo.map((j) => ({
    posicion: j.posicion,
    fuerza: j.fuerza,
  }));

  const fuerza = promedioStats(equipo);
  const balance = calcularBalance(jugadores);
  const coherencia = calcularCoherencia(equipo);
  const bonusEstilo = aplicarBonusEstilo(jugadores, estilo);

  const puntaje = Math.min(
    100,
    Math.round(fuerza * 0.35 + balance * 0.30 + coherencia * 0.25 + bonusEstilo * 0.10)
  );

  const calificacion =
    puntaje >= 95
      ? "Leyenda"
      : puntaje >= 85
      ? "Platino"
      : puntaje >= 75
      ? "Oro"
      : puntaje >= 60
      ? "Plata"
      : "Bronce";

  return { puntaje, calificacion, fuerza, balance, coherencia, bonusEstilo };
}

export function getColorCalificacion(cal: DraftResultado["calificacion"]): string {
  switch (cal) {
    case "Leyenda":
      return "#FFD700";
    case "Platino":
      return "#E5E4E2";
    case "Oro":
      return "#D4AF37";
    case "Plata":
      return "#C0C0C0";
    case "Bronce":
      return "#CD7F32";
    default:
      return "#888";
  }
}

export function getEmojiCalificacion(cal: DraftResultado["calificacion"]): string {
  switch (cal) {
    case "Leyenda":
      return "👑";
    case "Platino":
      return "💎";
    case "Oro":
      return "🥇";
    case "Plata":
      return "🥈";
    case "Bronce":
      return "🥉";
    default:
      return "⭐";
  }
}

// Devuelve cuántos puntos faltaron para subir de nivel (solo si ≤ 10).
export function getNearMiss(puntaje: number): { faltaron: number; siguiente: string } | null {
  if (puntaje >= 95) return null;
  const siguiente = puntaje >= 85 ? "Leyenda" : puntaje >= 75 ? "Platino" : puntaje >= 60 ? "Oro" : "Plata";
  const umbral = puntaje >= 85 ? 95 : puntaje >= 75 ? 85 : puntaje >= 60 ? 75 : 60;
  const faltaron = umbral - puntaje;
  return faltaron <= 10 ? { faltaron, siguiente } : null;
}

// Recompensas REDUCIDAS A LA MITAD respecto al lanzamiento (decisión de
// economía 12-jun): el Draft daba demasiados puntos/monedas por partida.
// Junto con el tope de 5 partidas/día para Free, deja el grindeo bajo control.
export function puntosPorCalificacion(cal: DraftResultado["calificacion"]): number {
  switch (cal) {
    case "Leyenda":
      return 100;
    case "Platino":
      return 50;
    case "Oro":
      return 25;
    case "Plata":
      return 13;
    case "Bronce":
      return 5;
    default:
      return 0;
  }
}

export function monedasPorCalificacion(cal: DraftResultado["calificacion"]): number {
  switch (cal) {
    case "Leyenda":
      return 25;
    case "Platino":
      return 18;
    case "Oro":
      return 10;
    case "Plata":
      return 5;
    case "Bronce":
      return 3;
    default:
      return 0;
  }
}
