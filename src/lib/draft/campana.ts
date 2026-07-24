// src/lib/draft/campana.ts
// "La Campaña": al terminar el draft, tu once juega un Mundial 2026 simulado.
//   - Fase de grupos: 3 partidos (todos contra todos en un grupo de 4).
//   - Eliminatorias del Mundial 2026 = 5 partidos: 16avos, octavos, cuartos,
//     semifinal y final.
// Los marcadores se simulan a partir de la fuerza (overall / ataque / defensa)
// de tu equipo frente a la de cada selección histórica rival.

import { DraftPosicion, DraftPlantilla } from "./types";
import { PLANTILLAS } from "./plantillas";

// Mismo reparto de líneas que el Marcador en vivo.
const ATA_POS: DraftPosicion[] = ["CA", "PD", "PI", "EXT", "MEI"];
const DEF_POS: DraftPosicion[] = ["GOL", "LD", "ZAG", "LE", "VOL", "MCD"];

export interface EquipoStats {
  overall: number;
  ataque: number;
  defensa: number;
}

interface JugadorSimple {
  posicion: DraftPosicion;
  fuerza: number;
}

function media(js: JugadorSimple[]): number {
  if (!js.length) return 0;
  return js.reduce((s, j) => s + j.fuerza, 0) / js.length;
}

export function calcularStats(jugadores: JugadorSimple[]): EquipoStats {
  const overall = media(jugadores);
  return {
    overall,
    ataque: media(jugadores.filter((j) => ATA_POS.includes(j.posicion))) || overall,
    defensa: media(jugadores.filter((j) => DEF_POS.includes(j.posicion))) || overall,
  };
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

// Goles esperados (xG) → muestreo Poisson.
function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function simularGoles(atacante: EquipoStats, defensor: EquipoStats): number {
  const xg = clamp(
    1.25 + (atacante.ataque - defensor.defensa) / 13 + (atacante.overall - defensor.overall) / 22,
    0.15,
    4.8
  );
  return poisson(xg);
}

// Tanda de penales (5 + muerte súbita), con leve ventaja por overall.
function tandaPenales(a: EquipoStats, b: EquipoStats): { f: number; c: number } {
  const pa = clamp(0.72 + (a.overall - b.overall) / 300, 0.55, 0.9);
  const pb = clamp(0.72 - (a.overall - b.overall) / 300, 0.55, 0.9);
  let f = 0;
  let c = 0;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < pa) f++;
    if (Math.random() < pb) c++;
  }
  while (f === c) {
    if (Math.random() < pa) f++;
    if (Math.random() < pb) c++;
  }
  return { f, c };
}

export type Fase = "Grupos" | "16avos" | "Octavos" | "Cuartos" | "Semifinal" | "Final";

const FASES_KO: Fase[] = ["16avos", "Octavos", "Cuartos", "Semifinal", "Final"];

export interface CampanaPartido {
  fase: Fase;
  rivalSeleccion: string;
  rivalYear: number;
  rivalBandera: string;
  gf: number;
  gc: number;
  penalesGf?: number;
  penalesGc?: number;
  resultado: "G" | "E" | "P"; // desde tu perspectiva
}

export interface Campana {
  seed: string;
  partidos: CampanaPartido[];
  clasificado: boolean;
  posicionGrupo: number; // 1-4
  campeon: boolean;
  outcome: string;
  resumen: { v: number; e: number; d: number; gf: number; gc: number };
}

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function elegirRivales(n: number, usados: Set<string>, pool: DraftPlantilla[]): DraftPlantilla[] {
  const disponibles = barajar(pool.filter((p) => !usados.has(p.id)));
  return disponibles.slice(0, n);
}

// Los rivales de la campaña salen del POOL de la liga elegida (clubes), NO de las
// selecciones del Mundial. Por defecto (sin pool) cae a las selecciones históricas.
export function generarCampana(jugadores: JugadorSimple[], rivalPool: DraftPlantilla[] = PLANTILLAS): Campana {
  const pool = rivalPool.length > 0 ? rivalPool : PLANTILLAS;
  const mias = calcularStats(jugadores);
  const usados = new Set<string>();
  const partidos: CampanaPartido[] = [];
  let v = 0;
  let e = 0;
  let d = 0;
  let gf = 0;
  let gc = 0;

  // ---------- Fase de grupos: tú + 3 rivales, todos contra todos ----------
  const rivales = elegirRivales(3, usados, pool);
  rivales.forEach((r) => usados.add(r.id));
  const rivalStats = rivales.map((r) => calcularStats(r.jugadores));

  // Índice 0 = tu equipo.
  const equipos: EquipoStats[] = [mias, ...rivalStats];
  const tabla = equipos.map(() => ({ pts: 0, gf: 0, gc: 0 }));

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const gi = simularGoles(equipos[i], equipos[j]);
      const gj = simularGoles(equipos[j], equipos[i]);
      tabla[i].gf += gi;
      tabla[i].gc += gj;
      tabla[j].gf += gj;
      tabla[j].gc += gi;
      if (gi > gj) tabla[i].pts += 3;
      else if (gj > gi) tabla[j].pts += 3;
      else {
        tabla[i].pts += 1;
        tabla[j].pts += 1;
      }
      // Registrar solo tus partidos (i === 0).
      if (i === 0) {
        const r = rivales[j - 1];
        partidos.push({
          fase: "Grupos",
          rivalSeleccion: r.seleccion,
          rivalYear: r.year,
          rivalBandera: r.bandera,
          gf: gi,
          gc: gj,
          resultado: gi > gj ? "G" : gi < gj ? "P" : "E",
        });
        gf += gi;
        gc += gj;
        if (gi > gj) v++;
        else if (gi < gj) d++;
        else e++;
      }
    }
  }

  const orden = tabla
    .map((t, idx) => ({ idx, pts: t.pts, gd: t.gf - t.gc, gf: t.gf }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const posicionGrupo = orden.findIndex((o) => o.idx === 0) + 1;
  const clasificado = posicionGrupo <= 2;

  // ---------- Eliminatorias (solo si clasificas) ----------
  let campeon = false;
  let outcome = "";

  if (!clasificado) {
    outcome = "Eliminado en fase de grupos";
  } else {
    for (let r = 0; r < FASES_KO.length; r++) {
      const fase = FASES_KO[r];
      const rival = elegirRivales(1, usados, pool)[0] ?? pool[Math.floor(Math.random() * pool.length)];
      usados.add(rival.id);

      // Los rivales se hacen más duros según avanza el cuadro.
      const bonus = r * 1.6;
      const base = calcularStats(rival.jugadores);
      const rivalStat: EquipoStats = {
        overall: base.overall + bonus,
        ataque: base.ataque + bonus,
        defensa: base.defensa + bonus,
      };

      const mioG = simularGoles(mias, rivalStat);
      const rivG = simularGoles(rivalStat, mias);

      let pen: { f: number; c: number } | undefined;
      let gano: boolean;
      if (mioG === rivG) {
        pen = tandaPenales(mias, rivalStat);
        gano = pen.f > pen.c;
      } else {
        gano = mioG > rivG;
      }

      partidos.push({
        fase,
        rivalSeleccion: rival.seleccion,
        rivalYear: rival.year,
        rivalBandera: rival.bandera,
        gf: mioG,
        gc: rivG,
        penalesGf: pen?.f,
        penalesGc: pen?.c,
        resultado: gano ? "G" : "P",
      });
      gf += mioG;
      gc += rivG;
      if (gano) v++;
      else d++;

      if (!gano) {
        outcome = fase === "Final" ? "Subcampeón" : `Eliminado en ${fase}`;
        break;
      }
      if (fase === "Final") {
        campeon = true;
        outcome = "¡Campeón del torneo!";
      }
    }
  }

  const seed = (Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4))
    .slice(0, 6)
    .toUpperCase();

  return {
    seed,
    partidos,
    clasificado,
    posicionGrupo,
    campeon,
    outcome,
    resumen: { v, e, d, gf, gc },
  };
}

// Fútcoins extra según el desempeño en la campaña.
// Clasificado en grupos → +5 mín; Campeón → +30.
export function calcularBonusCampana(campana: Campana): number {
  if (!campana.clasificado) return 0;
  if (campana.campeon) return 30;
  const fasesKO: Fase[] = ["16avos", "Octavos", "Cuartos", "Semifinal", "Final"];
  const koPartidos = campana.partidos.filter((p) => fasesKO.includes(p.fase));
  if (koPartidos.length === 0) return 5;
  const lastFase = koPartidos[koPartidos.length - 1].fase;
  const faseIdx = fasesKO.indexOf(lastFase);
  return ([5, 7, 10, 15, 20] as const)[faseIdx] ?? 5;
}

// ¿Quedó eliminado? Verdadero salvo que sea campeón o subcampeón (perdió la
// Final). Llegar a la Final no penaliza; caer antes, sí.
export function quedoEliminado(campana: Campana): boolean {
  if (campana.campeon) return false;
  const llegoFinal = campana.partidos.some((p) => p.fase === "Final");
  return !llegoFinal;
}

// Penalización por quedar eliminado (decisión 12-jun: el Draft debe RESTAR
// puntos cuando tu once cae). Cuanto antes te eliminan, más caro:
//   · Fase de grupos → el castigo mayor.
//   · Rondas KO → menos castigo según avanzas; la Final (subcampeón) = 0.
// Se aplica a puntos XP y a monedas; el neto nunca baja de 0 (no drena la
// billetera, solo recorta lo ganado en esta partida).
export function penalizacionCampana(campana: Campana): { coins: number; xp: number } {
  if (!quedoEliminado(campana)) return { coins: 0, xp: 0 };
  if (!campana.clasificado) return { coins: 10, xp: 20 }; // eliminado en grupos
  const fasesKO: Fase[] = ["16avos", "Octavos", "Cuartos", "Semifinal", "Final"];
  const koPartidos = campana.partidos.filter((p) => fasesKO.includes(p.fase));
  const lastFase = koPartidos[koPartidos.length - 1]?.fase;
  const faseIdx = lastFase ? fasesKO.indexOf(lastFase) : 0;
  const coins = ([8, 6, 4, 2, 0] as const)[faseIdx] ?? 8;
  const xp = ([15, 10, 6, 3, 0] as const)[faseIdx] ?? 15;
  return { coins, xp };
}
