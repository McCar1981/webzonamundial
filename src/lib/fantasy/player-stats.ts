// src/lib/fantasy/player-stats.ts
//
// Modelo de "ficha analítica" de un jugador (inspirado en el data-indices de
// FutbolFantasy, pero MEJORADO). En vez de meter un JSON gigante en el HTML,
// generamos los datos bajo demanda y de forma DETERMINISTA a partir del pool.
//
// Ventajas sobre la referencia:
//  - Los PRÓXIMOS/ÚLTIMOS partidos salen del CALENDARIO real del Mundial 2026
//    (rival, fecha, sede, jornada) en vez de un calendario de liga estático.
//  - Las eliminatorias se proyectan con el bracket determinista (tournament.ts).
//  - Cada partido trae sus 18 métricas Y los PUNTOS FANTASY que generan, así que
//    la estadística cruda es trazable hasta el punto (algo que la referencia no
//    hace: ellos muestran stats crudas y, por separado, puntos).

import { CALENDARIO, type Partido } from "@/data/calendario";
import { getTeamRun, STAGE_LABEL, type Stage } from "./tournament";
import { SELECCIONES } from "@/data/selecciones";
import type { FantasyPlayer } from "./types";

// ---- RNG determinista (FNV-1a + mulberry32), idéntico al del resto del módulo ----
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const SLUG_TO_SEL = new Map(SELECCIONES.map((s) => [s.slug, s]));

// ---- Tipos ----

/** Línea de estadística de un partido (subconjunto útil del set de la referencia). */
export interface MatchStatLine {
  minutos: number;
  goles: number;
  asistencias: number;
  tiros: number;
  tirosPuerta: number;
  pasesClave: number;
  pasesCompletados: number;
  regatesExito: number;
  tackles: number;
  despejes: number;
  faltasCometidas: number;
  amarillas: number;
  rojas: number;
  paradas: number; // solo POR
  golesEncajados: number; // solo POR/DEF (de su equipo)
}

/** Un partido del jugador en el torneo (real de grupos o proyectado de KO). */
export interface PlayerFixture {
  matchId: string;
  stage: Stage;
  stageLabel: string;
  jornada: number; // 1..3 en grupos · 0 en eliminatorias
  date: string; // ISO
  opponentSlug: string | null;
  opponentName: string;
  opponentFlag: string;
  home: boolean;
  venue: string | null;
  played: boolean; // la fecha ya pasó
  projected: boolean; // true en eliminatorias (rival aún por definir)
  /** Estadística (real si played, proyección determinista si futuro). */
  stats: MatchStatLine;
  /** Puntos fantasy que genera esa línea (mismo baremo que scoring.ts). */
  points: number;
}

export interface PlayerSeasonStats {
  fixtures: PlayerFixture[];
  played: PlayerFixture[];
  upcoming: PlayerFixture[];
  /** Agregados sobre los partidos disputados (o proyección si aún no hay). */
  totals: {
    partidos: number;
    puntos: number;
    media: number;
    goles: number;
    asistencias: number;
    tirosPuerta: number;
    pasesClave: number;
    regatesExito: number;
    tackles: number;
    paradas: number;
    amarillas: number;
    rojas: number;
  };
}

// ---- Construcción de fixtures ----

const KO_AFTER_GROUPS: { stage: Stage; jornada: number }[] = [
  { stage: "r32", jornada: 0 },
  { stage: "octavos", jornada: 0 },
  { stage: "cuartos", jornada: 0 },
  { stage: "semis", jornada: 0 },
  { stage: "final", jornada: 0 },
];

/** Partidos de grupos REALES de la selección, ordenados por fecha. */
function groupFixtures(slug: string): Partido[] {
  return CALENDARIO.filter((m) => m.homeSlug === slug || m.awaySlug === slug).sort(
    (a, b) => +new Date(a.fecha) - +new Date(b.fecha),
  );
}

/**
 * Genera una línea de estadística determinista para (jugador, partidoId),
 * escalada por su posición, forma y la dificultad del rival. Misma semilla ⇒
 * misma línea siempre.
 */
function statLineFor(p: FantasyPlayer, matchId: string, hard: boolean): MatchStatLine {
  const rng = mulberry32(hashStr(`${p.id}:${matchId}`));
  const skill = clamp(p.form / 10, 0.1, 1); // 0..1
  const diff = hard ? 0.78 : 1.12; // rival fuerte recorta producción

  const played = p.available && rng() > 0.08;
  if (!played) {
    return {
      minutos: 0, goles: 0, asistencias: 0, tiros: 0, tirosPuerta: 0, pasesClave: 0,
      pasesCompletados: 0, regatesExito: 0, tackles: 0, despejes: 0, faltasCometidas: 0,
      amarillas: 0, rojas: 0, paradas: 0, golesEncajados: 0,
    };
  }

  const minutos = rng() < 0.2 ? 25 + Math.floor(rng() * 34) : 70 + Math.floor(rng() * 21);
  const mf = minutos / 90;

  const goalRate = (p.pos === "FWD" ? 0.7 : p.pos === "MID" ? 0.45 : p.pos === "DEF" ? 0.14 : 0.01) * skill * diff;
  let goles = 0;
  for (let i = 0; i < 3; i++) if (rng() < goalRate) goles++;

  const assistRate = (p.pos === "MID" ? 0.55 : p.pos === "FWD" ? 0.4 : 0.2) * skill * diff;
  let asistencias = 0;
  for (let i = 0; i < 2; i++) if (rng() < assistRate) asistencias++;

  const tiros = Math.round((p.pos === "FWD" ? 3.2 : p.pos === "MID" ? 1.8 : 0.5) * skill * mf * (0.6 + rng()));
  const tirosPuerta = Math.min(tiros, Math.round(tiros * (0.35 + skill * 0.3 + rng() * 0.2)));
  const pasesClave = Math.round((p.pos === "MID" ? 2.4 : p.pos === "FWD" ? 1.4 : 0.7) * skill * mf * (0.5 + rng()));
  const pasesCompletados = Math.round((p.pos === "MID" ? 58 : p.pos === "DEF" ? 52 : 30) * (0.6 + skill * 0.4) * mf);
  const regatesExito = Math.round((p.pos === "FWD" ? 2.2 : p.pos === "MID" ? 1.6 : 0.4) * skill * mf * (0.4 + rng()));
  const tackles = Math.round((p.pos === "DEF" ? 2.6 : p.pos === "MID" ? 2.0 : 0.6) * (0.5 + rng()) * mf);
  const despejes = Math.round((p.pos === "DEF" ? 3.4 : p.pos === "GK" ? 1.2 : 0.5) * (0.5 + rng()) * mf);
  const faltasCometidas = Math.round((0.6 + (p.pos === "DEF" ? 0.8 : 0.4)) * rng() * 2);

  const amarillas = rng() < 0.16 ? 1 : 0;
  const rojas = rng() < 0.025 ? 1 : 0;

  // Portería (solo POR): paradas y goles encajados.
  const paradas = p.pos === "GK" ? Math.round((2 + rng() * 4) * (hard ? 1.3 : 0.8)) : 0;
  const golesEncajados = p.pos === "GK" || p.pos === "DEF" ? (rng() < (hard ? 0.6 : 0.35) ? Math.ceil(rng() * 2) : 0) : 0;

  return {
    minutos, goles, asistencias, tiros, tirosPuerta, pasesClave, pasesCompletados,
    regatesExito, tackles, despejes, faltasCometidas, amarillas, rojas, paradas, golesEncajados,
  };
}

/**
 * Línea a CERO para partidos ya DISPUTADOS: la simulación jamás se presenta como
 * resultado real. Las líneas reales por partido llegarán de api-football en una
 * fase posterior; hasta entonces, disputado sin ingesta = 0.
 */
function zeroLine(): MatchStatLine {
  return {
    minutos: 0, goles: 0, asistencias: 0, tiros: 0, tirosPuerta: 0, pasesClave: 0,
    pasesCompletados: 0, regatesExito: 0, tackles: 0, despejes: 0, faltasCometidas: 0,
    amarillas: 0, rojas: 0, paradas: 0, golesEncajados: 0,
  };
}

const GOAL_PTS: Record<FantasyPlayer["pos"], number> = { FWD: 5, MID: 6, DEF: 8, GK: 10 };

/** Puntos fantasy de una línea (mismo baremo que SCORING_TABLE de scoring.ts). */
function pointsFromStats(p: FantasyPlayer, s: MatchStatLine): number {
  if (s.minutos === 0) return 0;
  let pts = s.minutos >= 60 ? 2 : 1;
  pts += s.goles * GOAL_PTS[p.pos];
  if (s.goles >= 3) pts += 5; // hat-trick
  pts += s.asistencias * 3;
  if (s.tirosPuerta >= 3) pts += 1;
  if ((p.pos === "GK" || p.pos === "DEF") && s.minutos >= 60 && s.golesEncajados === 0) pts += p.pos === "GK" ? 5 : 4;
  if (p.pos === "GK") pts += Math.floor(s.paradas / 3); // +1 cada 3 paradas
  if (p.pos === "GK" && s.golesEncajados >= 2) pts -= 1;
  if (s.tackles + s.despejes >= 7) pts += 2;
  pts -= s.amarillas * 1;
  pts -= s.rojas * 3;
  return pts;
}

/** Devuelve la ficha analítica completa de un jugador. */
export function getPlayerSeasonStats(p: FantasyPlayer, now: Date = new Date()): PlayerSeasonStats {
  const run = getTeamRun(p.teamSlug);
  const reach = run?.stageRound ?? 0; // 0 grupos · 1 r32 … 5 final
  const fixtures: PlayerFixture[] = [];

  // 1) Grupos (calendario real). Los futuros llevan línea PROYECTADA (ayuda de
  // draft); los ya disputados van a CERO hasta que exista la ingesta real por
  // partido — nunca se enseña simulación como si fuera resultado.
  for (const m of groupFixtures(p.teamSlug)) {
    const home = m.homeSlug === p.teamSlug;
    const oppSlug = home ? m.awaySlug : m.homeSlug;
    const opp = SLUG_TO_SEL.get(oppSlug);
    const hard = (opp?.rankingFIFA ?? 90) < (SLUG_TO_SEL.get(p.teamSlug)?.rankingFIFA ?? 90) - 12;
    const isPlayed = +new Date(m.fecha) < +now;
    const stats = isPlayed ? zeroLine() : statLineFor(p, m.id, hard);
    fixtures.push({
      matchId: m.id,
      stage: "grupos",
      stageLabel: STAGE_LABEL.grupos,
      jornada: m.jornada,
      date: m.fecha,
      opponentSlug: oppSlug,
      opponentName: opp?.nombre ?? oppSlug,
      opponentFlag: opp?.flagCode ?? "un",
      home,
      venue: m.ciudad,
      played: isPlayed,
      projected: !isPlayed,
      stats,
      points: isPlayed ? 0 : pointsFromStats(p, stats),
    });
  }

  // 2) Eliminatorias proyectadas según hasta dónde llega su selección.
  const lastGroup = fixtures[fixtures.length - 1];
  let koDate = lastGroup ? +new Date(lastGroup.date) : +new Date("2026-06-24T19:00:00Z");
  for (let i = 0; i < reach && i < KO_AFTER_GROUPS.length; i++) {
    const { stage } = KO_AFTER_GROUPS[i];
    koDate += 4 * 86_400_000; // ~4 días entre rondas
    const matchId = `${p.teamSlug}-ko${i + 1}`;
    const isPlayed = koDate < +now;
    const stats = isPlayed ? zeroLine() : statLineFor(p, matchId, true); // KO siempre exigente
    fixtures.push({
      matchId,
      stage,
      stageLabel: STAGE_LABEL[stage],
      jornada: 0,
      date: new Date(koDate).toISOString(),
      opponentSlug: null,
      opponentName: "Por definir",
      opponentFlag: "un",
      home: false,
      venue: null,
      played: isPlayed,
      projected: true,
      stats,
      points: isPlayed ? 0 : pointsFromStats(p, stats),
    });
  }

  const played = fixtures.filter((f) => f.played);
  const upcoming = fixtures.filter((f) => !f.played);

  // Agregados: si ya hay partidos jugados, sobre ellos; si no, proyección total.
  const base = played.length > 0 ? played : fixtures;
  const sum = (sel: (f: PlayerFixture) => number) => base.reduce((a, f) => a + sel(f), 0);
  const partidos = base.length;
  const puntos = sum((f) => f.points);

  return {
    fixtures,
    played,
    upcoming,
    totals: {
      partidos,
      puntos,
      media: partidos ? Math.round((puntos / partidos) * 10) / 10 : 0,
      goles: sum((f) => f.stats.goles),
      asistencias: sum((f) => f.stats.asistencias),
      tirosPuerta: sum((f) => f.stats.tirosPuerta),
      pasesClave: sum((f) => f.stats.pasesClave),
      regatesExito: sum((f) => f.stats.regatesExito),
      tackles: sum((f) => f.stats.tackles),
      paradas: sum((f) => f.stats.paradas),
      amarillas: sum((f) => f.stats.amarillas),
      rojas: sum((f) => f.stats.rojas),
    },
  };
}
