// scripts/calibrar-draft.ts
//
// Calibra la escala de puntuación del Draft de Ligas SIMULANDO partidas reales
// contra el motor de verdad (importa src/lib/draft, no una copia). Se usó para
// fijar los umbrales de UMBRALES en simulacion.ts.
//
//   npx tsx scripts/calibrar-draft.ts
//
// Estrategias simuladas, de peor a mejor jugador:
//   azar     — elige un jugador cualquiera de los que encajan
//   fuerte   — elige siempre al más fuerte que encaje
//   experto  — prioriza química (repetir club/año) y usa la fuerza para desempatar
//
// Lo que buscamos: que jugar bien SE NOTE (separación clara entre azar y
// experto) y que la escala se recorra entera (Leyenda existe pero es rara).

import { CLUB_PLANTILLAS, poolForLeague, DRAFT_LEAGUES } from "../src/lib/draft/plantillas-ligas";
import { layoutFormacion } from "../src/lib/draft/layout";
import { calcularResultado } from "../src/lib/draft/simulacion";
import type { DraftPlantilla, JugadorSeleccionado, FormacionKey, Estilo } from "../src/lib/draft/types";

type Estrategia = "azar" | "normal" | "fuerte" | "experto";

const FORMACIONES: FormacionKey[] = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "3-4-3", "4-2-4"];
const ESTILOS: Estilo[] = ["defensivo", "equilibrado", "ofensivo"];

function elegir<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const norm = (s: string) => s.toLowerCase().trim();

/** Juega una partida completa y devuelve el puntaje, o null si se atasca. */
function jugarPartida(pool: DraftPlantilla[], formacion: FormacionKey, estilo: Estilo, estrategia: Estrategia) {
  const slots = layoutFormacion(formacion);
  const equipo = new Map<number, JugadorSeleccionado>();
  const nombres = new Set<string>();

  let tiradas = 0;
  const MAX_TIRADAS = 400; // corte de seguridad: detecta formaciones imposibles

  while (equipo.size < slots.length && tiradas < MAX_TIRADAS) {
    tiradas++;
    const club = elegir(pool);

    // Candidatos: jugadores del club que encajan en alguna casilla libre.
    const libres = slots.filter((s) => !equipo.has(s.id));
    const candidatos: { slotId: number; jug: DraftPlantilla["jugadores"][number] }[] = [];
    for (const j of club.jugadores) {
      if (nombres.has(norm(j.nombre))) continue;
      const slot = libres.find((s) => s.pos === j.posicion);
      if (slot) candidatos.push({ slotId: slot.id, jug: j });
    }
    if (candidatos.length === 0) continue;

    let elegido = candidatos[0];
    if (estrategia === "azar") {
      elegido = elegir(candidatos);
    } else if (estrategia === "normal") {
      // Jugador de a pie: mira un par de opciones y se queda con la mejor.
      const a = elegir(candidatos), b = elegir(candidatos);
      elegido = b.jug.fuerza > a.jug.fuerza ? b : a;
    } else if (estrategia === "fuerte") {
      elegido = candidatos.reduce((a, b) => (b.jug.fuerza > a.jug.fuerza ? b : a));
    } else {
      // Experto: puntúa química (mismo club / mismo año ya en el equipo) y usa
      // la fuerza como desempate — que es justo lo que premia la fórmula.
      const actuales = [...equipo.values()];
      const score = (c: typeof candidatos[number]) => {
        const mismoClub = actuales.filter((x) => x.seleccion === club.seleccion).length;
        const mismoYear = actuales.filter((x) => x.year === club.year).length;
        return c.jug.fuerza + mismoClub * 9 + mismoYear * 4;
      };
      elegido = candidatos.reduce((a, b) => (score(b) > score(a) ? b : a));
    }

    nombres.add(norm(elegido.jug.nombre));
    equipo.set(elegido.slotId, {
      ...elegido.jug,
      seleccion: club.seleccion,
      year: club.year,
      bandera: club.bandera,
      logo: club.logo ?? null,
    });
  }

  if (equipo.size < slots.length) return null; // formación imposible en esta liga
  return calcularResultado([...equipo.values()], estilo, pool);
}

function percentil(arr: number[], p: number): number {
  const o = [...arr].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor((o.length * p) / 100))];
}

const PARTIDAS = 400;

console.log("=".repeat(78));
console.log("CALIBRACIÓN DEL DRAFT — puntajes por liga y estrategia");
console.log("=".repeat(78));

const ligas = DRAFT_LEAGUES.map((l) => l.slug);
const global: Record<Estrategia, number[]> = { azar: [], normal: [], fuerte: [], experto: [] };
const calificaciones: Record<string, Record<string, number>> = {};
const imposibles: string[] = [];

for (const liga of ligas) {
  const pool = poolForLeague(liga);
  const fila: string[] = [];
  for (const est of ["azar", "normal", "fuerte", "experto"] as Estrategia[]) {
    const puntajes: number[] = [];
    for (let i = 0; i < PARTIDAS; i++) {
      const formacion = elegir(FORMACIONES);
      const r = jugarPartida(pool, formacion, elegir(ESTILOS), est);
      if (!r) { imposibles.push(`${liga} / ${formacion}`); continue; }
      puntajes.push(r.puntaje);
      global[est].push(r.puntaje);
      (calificaciones[est] ||= {})[r.calificacion] = ((calificaciones[est] || {})[r.calificacion] || 0) + 1;
    }
    if (puntajes.length === 0) { fila.push(`${est}: —`); continue; }
    const media = puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
    fila.push(`${est}: med ${media.toFixed(1)} p90 ${percentil(puntajes, 90)} max ${Math.max(...puntajes)}`);
  }
  console.log(`\n${liga.padEnd(20)} (${pool.length} clubes)`);
  fila.forEach((f) => console.log("   " + f));
}

console.log("\n" + "=".repeat(78));
for (const est of ["azar", "normal", "fuerte", "experto"] as Estrategia[]) {
  const p = global[est];
  const media = p.reduce((a, b) => a + b, 0) / p.length;
  console.log(`${est.padEnd(9)} media ${media.toFixed(1)} | p50 ${percentil(p, 50)} | p90 ${percentil(p, 90)} | p99 ${percentil(p, 99)} | max ${Math.max(...p)}`);
}
const dif = global.experto.reduce((a, b) => a + b, 0) / global.experto.length - global.azar.reduce((a, b) => a + b, 0) / global.azar.length;
console.log(`\nSEPARACIÓN experto vs azar: ${dif.toFixed(1)} puntos  (antes era <1: jugar bien no se notaba)`);
// El reparto que importa es el del jugador NORMAL (el usuario típico) y el del
// EXPERTO (el techo al que se aspira).
for (const est of ["normal", "experto"] as Estrategia[]) {
  console.log(`\nReparto de calificaciones — jugador ${est.toUpperCase()}:`);
  const c = calificaciones[est] || {};
  const tot = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  for (const k of ["Leyenda", "Platino", "Oro", "Plata", "Bronce"]) {
    const n = c[k] || 0;
    console.log(`   ${k.padEnd(8)} ${String(n).padStart(4)}  ${((n / tot) * 100).toFixed(1)}%`);
  }
}
if (imposibles.length) {
  const uniq = [...new Set(imposibles)];
  console.log(`\n⚠️  COMBINACIONES SIN SALIDA (${uniq.length}): ${uniq.slice(0, 12).join(" · ")}`);
}
console.log(`Catálogo: ${CLUB_PLANTILLAS.length} clubes`);
