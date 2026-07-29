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

  // Química por bloque del mismo club: recompensas SUBIDAS. Antes juntar tres
  // jugadores del mismo club daba +5 de coherencia = +1,25 puntos sobre 100,
  // así que la regla que más decide la nota era invisible y no compensaba
  // perseguirla. Ahora un bloque grande del mismo club se nota de verdad.
  for (const [, count] of selecciones) {
    if (count >= 5) coherencia += 15;
    else if (count >= 4) coherencia += 11;
    else if (count >= 3) coherencia += 8;
    else if (count >= 2) coherencia += 3;
  }

  for (const [, count] of years) {
    if (count >= 3) coherencia += 5;
    else if (count >= 2) coherencia += 3;
  }

  // Bonus por portero + defensa del mismo club
  const portero = equipo.find((j) => j.posicion === "GOL");
  if (portero) {
    const defensasMisma = equipo.filter(
      (j) => ["LD", "ZAG", "LE"].includes(j.posicion) && j.seleccion === portero.seleccion
    ).length;
    if (defensasMisma >= 2) coherencia += 6;
  }

  // Bonus por delantera completa del mismo club
  const delantera = equipo.filter((j) => ["CA", "PD", "PI", "EXT"].includes(j.posicion));
  if (delantera.length >= 2) {
    const primeraSel = delantera[0]?.seleccion;
    if (primeraSel && delantera.every((j) => j.seleccion === primeraSel)) {
      coherencia += 10;
    }
  }

  return Math.max(0, Math.min(100, coherencia));
}

// ─── Referencias de la liga ──────────────────────────────────────────────────
// La fuerza bruta no es comparable entre ligas: el mejor once de la FUTVE ronda
// 80 y el del catálogo europeo 93. Puntuar en bruto condenaba a las ligas
// pequeñas —justo donde está la mayoría de la audiencia— a no poder aspirar a
// las calificaciones altas. Se normaliza contra el techo y el suelo de TU liga,
// así "Leyenda" significa "armaste un once excelente para tu liga".
export interface ReferenciasLiga {
  /** Media de los 11 mejores del pool: el once soñado de esa liga. */
  techo: number;
  /** Mediana del pool: un once del montón. */
  suelo: number;
}

const REF_POR_DEFECTO: ReferenciasLiga = { suelo: 76, techo: 88 };

export function referenciasLiga(
  pool: { jugadores: { fuerza: number }[] }[]
): ReferenciasLiga {
  const fuerzas = pool.flatMap((p) => p.jugadores.map((j) => j.fuerza));
  if (fuerzas.length < 22) return REF_POR_DEFECTO;
  const orden = [...fuerzas].sort((a, b) => b - a);
  const sonado = orden.slice(0, 11).reduce((s, f) => s + f, 0) / 11;
  const suelo = orden[Math.floor(orden.length / 2)];
  // El once soñado exacto (los 11 mejores de la liga, cada uno en su posición)
  // es inalcanzable tirando el dado: exigirlo dejaba el techo real en ~80/100.
  // Se marca el 100 un poco antes, en el 82% del camino hacia ese ideal, para
  // que un draft excelente SÍ llegue arriba. Calibrado por simulación.
  const techo = suelo + (sonado - suelo) * 0.82;
  // Un margen mínimo evita divisiones absurdas en pools muy planos.
  return { suelo, techo: Math.max(techo, suelo + 6) };
}

function normalizar(v: number, ref: ReferenciasLiga): number {
  const rango = ref.techo - ref.suelo;
  if (rango <= 0) return 50;
  return Math.max(0, Math.min(100, ((v - ref.suelo) / rango) * 100));
}

const POS_DEF: DraftPosicion[] = ["GOL", "LD", "ZAG", "LE"];
const POS_ATA: DraftPosicion[] = ["CA", "PD", "PI", "EXT"];
const POS_MED: DraftPosicion[] = ["VOL", "MEI", "MCD"];

function mediaLinea(jugadores: JugadorSimple[], pos: DraftPosicion[]): number {
  const l = jugadores.filter((j) => pos.includes(j.posicion));
  if (l.length === 0) return 0;
  return l.reduce((s, j) => s + j.fuerza, 0) / l.length;
}

// El estilo ahora depende de A QUIÉN fichas, no de cuántos huecos tiene la
// formación. Antes se calculaba con el número de jugadores por línea, que la
// formación fija de antemano: era una nota decidida en el menú de inicio, no
// en la partida. Ahora premia reforzar la línea que dice tu estilo.
export function aplicarBonusEstilo(
  jugadores: JugadorSimple[],
  estilo: Estilo,
  ref: ReferenciasLiga = REF_POR_DEFECTO
): number {
  const def = mediaLinea(jugadores, POS_DEF);
  const med = mediaLinea(jugadores, POS_MED);
  const ata = mediaLinea(jugadores, POS_ATA);

  switch (estilo) {
    case "defensivo":
      return Math.round(normalizar(def, ref));
    case "ofensivo":
      return Math.round(normalizar(ata, ref));
    case "equilibrado": {
      // Premia que las tres líneas estén parejas (sin puntos débiles).
      const lineas = [def, med, ata].filter((v) => v > 0);
      if (lineas.length === 0) return 0;
      const m = lineas.reduce((s, v) => s + v, 0) / lineas.length;
      const dispersion = Math.max(...lineas) - Math.min(...lineas);
      // Base por nivel medio, menos castigo por desequilibrio entre líneas.
      return Math.round(Math.max(0, normalizar(m, ref) - dispersion * 4));
    }
    default:
      return 0;
  }
}

// Umbrales de calificación. Con la fórmula anterior el máximo ALCANZABLE era
// ~82 (balance valía siempre 100 y el estilo aportaba 2 puntos), así que
// Platino (85) era casi imposible y Leyenda (95) directamente inalcanzable:
// cada partida cerraba prometiendo un nivel que no existía. Ahora la escala se
// recorre entera y está calibrada por simulación (ver scripts de calibración).
const UMBRALES = { leyenda: 78, platino: 66, oro: 52, plata: 34 } as const;

export function calcularResultado(
  equipo: JugadorSeleccionado[],
  estilo: Estilo,
  pool?: { jugadores: { fuerza: number }[] }[]
): DraftResultado {
  const jugadores = equipo.map((j) => ({
    posicion: j.posicion,
    fuerza: j.fuerza,
  }));

  const ref = pool && pool.length > 0 ? referenciasLiga(pool) : REF_POR_DEFECTO;

  const fuerza = promedioStats(equipo);
  const fuerzaNorm = Math.round(normalizar(fuerza, ref));
  const balance = calcularBalance(jugadores);
  const coherencia = calcularCoherencia(equipo);
  const bonusEstilo = aplicarBonusEstilo(jugadores, estilo, ref);

  // `balance` YA NO puntúa: con el once completo la formación se fuerza exacta,
  // así que valía 100 siempre y regalaba 30 puntos fijos a todo el mundo. Con
  // eso fuera, la nota depende de las once decisiones del jugador: a quién
  // fichas (fuerza relativa a tu liga), qué bloques armas (química) y si
  // refuerzas la línea que pide tu estilo.
  const puntaje = Math.min(
    100,
    Math.round(fuerzaNorm * 0.55 + coherencia * 0.35 + bonusEstilo * 0.10)
  );

  const calificacion =
    puntaje >= UMBRALES.leyenda
      ? "Leyenda"
      : puntaje >= UMBRALES.platino
      ? "Platino"
      : puntaje >= UMBRALES.oro
      ? "Oro"
      : puntaje >= UMBRALES.plata
      ? "Plata"
      : "Bronce";

  return { puntaje, calificacion, fuerza, fuerzaNorm, balance, coherencia, bonusEstilo };
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
  // Recalibrado (auditoría del Draft, jul-2026). Antes la partida MEDIANA
  // —Plata, ~60% de las partidas con la escala nueva— pagaba 5 monedas por
  // 4-5 minutos y ~30 toques, menos que un check-in de un solo toque (10-40).
  // El jugador hacía esa cuenta en dos días y dejaba de jugar. Ahora la mediana
  // ronda 20-30 (con el bonus de campaña), en línea con el resto de módulos.
  // Se sostiene por el tope de 5 partidas/día y por los sumideros del Draft
  // (re-tirada/ojeador/partida extra), que ahora sí drenan Fútcoins.
  switch (cal) {
    case "Leyenda":
      return 60;
    case "Platino":
      return 45;
    case "Oro":
      return 32;
    case "Plata":
      return 20;
    case "Bronce":
      return 10;
    default:
      return 0;
  }
}
