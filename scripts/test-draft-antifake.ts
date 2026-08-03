// Prueba que el recálculo autoritativo del Draft cierra el exploit del POST
// forjado y NO rompe una partida legítima.
//
// Reproduce la MISMA lógica que recalcularDesdeOnce() en
// src/app/api/draft/guardar/route.ts (validar el once contra el pool de la liga
// y recomputar con el motor real). Si esta prueba pasa, el POST manual con
// `puntaje: 100` y once basura ya no puede colarse al ranking.
//
// Uso: npx tsx scripts/test-draft-antifake.ts

import { poolForLeague } from "../src/lib/draft/plantillas-ligas";
import { calcularResultado } from "../src/lib/draft/simulacion";
import type { JugadorSeleccionado } from "../src/lib/draft/types";

const norm = (s: unknown) =>
  String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function indexar(pool: ReturnType<typeof poolForLeague>) {
  const idx = new Map<string, JugadorSeleccionado>();
  for (const p of pool) {
    for (const j of p.jugadores) {
      idx.set(`${norm(j.nombre)}|${norm(p.seleccion)}|${p.year}`, {
        ...j,
        seleccion: p.seleccion,
        year: p.year,
        bandera: p.bandera,
        logo: p.logo ?? null,
      });
    }
  }
  return idx;
}

/** Réplica exacta de recalcularDesdeOnce(). */
function recalcular(equipo: Array<Record<string, unknown>>, estilo: string, ligaSlug: string) {
  if (!Array.isArray(equipo) || equipo.length !== 11) return { estado: "sin_pool" as const };
  const pool = poolForLeague(ligaSlug);
  const idx = indexar(pool);
  const validado: JugadorSeleccionado[] = [];
  for (const e of equipo) {
    const hit = idx.get(`${norm(e.nombre)}|${norm(e.seleccion)}|${Number(e.year)}`);
    if (!hit) return { estado: "invalido" as const };
    validado.push(hit);
  }
  return { estado: "ok" as const, res: calcularResultado(validado, estilo as any, pool) };
}

let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? "  ok " : "  X  "}${msg}`);
  if (!cond) fallos++;
};

// ── Escenario 1: partida LEGÍTIMA. Tomo un once real del pool de LaLiga tal y
// como lo mandaría el cliente ({posicion,nombre,seleccion,year,fuerza}). Debe
// validar y devolver el MISMO puntaje que calcula el motor con la plantilla. ──
{
  const liga = "laliga";
  const pool = poolForLeague(liga);
  const plantilla = pool[0]; // un club real, 11 jugadores del mismo equipo
  const onceCliente = plantilla.jugadores.map((j) => ({
    posicion: j.posicion,
    nombre: j.nombre,
    seleccion: plantilla.seleccion,
    year: plantilla.year,
    fuerza: j.fuerza,
  }));
  const r = recalcular(onceCliente, "equilibrado", liga);
  ok(r.estado === "ok", `once legítimo de ${plantilla.seleccion} valida`);
  if (r.estado === "ok") {
    ok(r.res.puntaje > 0 && r.res.puntaje <= 100, `puntaje en rango (${r.res.puntaje})`);
  }
}

// ── Escenario 2: EXPLOIT. Once forjado: 11 nombres inventados, todos fuerza 99,
// pidiendo puntaje "Leyenda". Debe salir INVÁLIDO (no se encuentra en el pool)
// y por tanto la ruta lo rechaza con 400: nunca toca el ranking. ──
{
  const forjado = Array.from({ length: 11 }, (_, i) => ({
    posicion: "CA",
    nombre: `Tramposo ${i}`,
    seleccion: "Equipo Falso",
    year: 2026,
    fuerza: 99,
  }));
  const r = recalcular(forjado, "ofensivo", "laliga");
  ok(r.estado === "invalido", "once forjado (11 nombres falsos, fuerza 99) se rechaza");
}

// ── Escenario 3: EXPLOIT SUTIL. Nombres reales del pool pero con fuerza 99
// inflada por el cliente. La fuerza del cliente debe IGNORARSE: el puntaje sale
// de la fuerza REAL del pool, así que inflar no sube la nota. ──
{
  const liga = "laliga";
  const pool = poolForLeague(liga);
  const plantilla = pool[0];
  const honesto = plantilla.jugadores.map((j) => ({
    posicion: j.posicion, nombre: j.nombre, seleccion: plantilla.seleccion, year: plantilla.year, fuerza: j.fuerza,
  }));
  const inflado = plantilla.jugadores.map((j) => ({
    posicion: j.posicion, nombre: j.nombre, seleccion: plantilla.seleccion, year: plantilla.year, fuerza: 99,
  }));
  const rHonesto = recalcular(honesto, "equilibrado", liga);
  const rInflado = recalcular(inflado, "equilibrado", liga);
  const iguales =
    rHonesto.estado === "ok" && rInflado.estado === "ok" && rHonesto.res.puntaje === rInflado.res.puntaje;
  ok(iguales, "inflar la fuerza del cliente a 99 NO cambia el puntaje (se usa la del pool)");
}

console.log("");
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) fallida(s).`);
  process.exit(1);
}
console.log("Anti-falsificación del Draft: exploit cerrado y partida legítima intacta.");
