// src/lib/modo-carrera/constants.ts
//
// Constantes de diseño del Modo Carrera: filosofías tácticas, ramas del árbol de
// habilidades, rangos de DT, títulos y misiones semilla. Sin dependencias de
// servidor; se puede importar desde cliente y servidor.

import type { Philosophy, SkillBranch } from "./types";

// ─── Filosofías tácticas (Pilar 1) ───────────────────────────────────────────
export interface PhilosophyDef {
  id: Philosophy;
  name: string;
  /** Frase corta de identidad para la carta DT. */
  tagline: string;
  /** Descripción de su efecto en el juego. */
  description: string;
  /** Color de acento de la carta. */
  accent: string;
  /** Rama del árbol que potencia de salida. */
  boosts: SkillBranch;
}

export const PHILOSOPHIES: PhilosophyDef[] = [
  {
    id: "ofensiva",
    name: "Ofensiva total",
    tagline: "El ataque es la mejor defensa",
    description: "Presión alta y vértigo. Más goles a favor, mayor riesgo atrás.",
    accent: "#ef4444",
    boosts: "ataque",
  },
  {
    id: "defensiva",
    name: "Muro defensivo",
    tagline: "Orden y solidez ante todo",
    description: "Bloque bajo y portería a cero. Menos goles en contra, ataque más lento.",
    accent: "#3b82f6",
    boosts: "defensa",
  },
  {
    id: "posesion",
    name: "Posesión",
    tagline: "El balón es nuestro",
    description: "Control del juego y circulación. Domina el ritmo, exige paciencia.",
    accent: "#22c55e",
    boosts: "mental",
  },
  {
    id: "contragolpe",
    name: "Contragolpe",
    tagline: "Golpear en el momento justo",
    description: "Defender y salir rápido. Letal en transición, depende de la pegada.",
    accent: "#f59e0b",
    boosts: "ataque",
  },
];

export function philosophyDef(id: Philosophy | null | undefined): PhilosophyDef | null {
  if (!id) return null;
  return PHILOSOPHIES.find((p) => p.id === id) ?? null;
}

// ─── Árbol de habilidades (Pilar 3) ──────────────────────────────────────────
export interface SkillBranchDef {
  id: SkillBranch;
  name: string;
  description: string;
  accent: string;
  /** Etiqueta de cada nivel 1..5. */
  levels: string[];
}

export const SKILL_BRANCHES: SkillBranchDef[] = [
  {
    id: "ataque",
    name: "Ataque",
    description: "Mejora la definición y la creación de ocasiones.",
    accent: "#ef4444",
    levels: ["Pegada", "Desborde", "Asociación", "Llegada", "Killer instinct"],
  },
  {
    id: "defensa",
    name: "Defensa",
    description: "Solidez, anticipación y juego aéreo.",
    accent: "#3b82f6",
    levels: ["Marca", "Coberturas", "Anticipación", "Bloque", "Candado"],
  },
  {
    id: "mental",
    name: "Mental",
    description: "Concentración, carácter y rendimiento en momentos clave.",
    accent: "#a855f7",
    levels: ["Foco", "Temple", "Liderazgo", "Sangre fría", "Mentalidad ganadora"],
  },
  {
    id: "gestion",
    name: "Gestión",
    description: "Manejo del vestuario, prensa y recursos.",
    accent: "#22c55e",
    levels: ["Diálogo", "Motivación", "Prensa", "Cantera", "Vestuario de oro"],
  },
];

export const MAX_SKILL_LEVEL = 5;

// ─── Rangos de DT por overall (Pilar 2) ──────────────────────────────────────
export interface RankDef {
  min: number;
  name: string;
  color: string;
}

export const DT_RANKS: RankDef[] = [
  { min: 0, name: "Amateur", color: "#a69a82" },
  { min: 60, name: "Profesional", color: "#22c55e" },
  { min: 70, name: "Élite", color: "#3b82f6" },
  { min: 80, name: "Estrella", color: "#a855f7" },
  { min: 88, name: "Leyenda", color: "#f59e0b" },
  { min: 95, name: "Inmortal", color: "#e8d48b" },
];

export function rankForOverall(overall: number): RankDef {
  let r = DT_RANKS[0];
  for (const def of DT_RANKS) if (overall >= def.min) r = def;
  return r;
}

// ─── Títulos / insignias (Pilar 5) ───────────────────────────────────────────
export interface TitleDef {
  id: string;
  name: string;
  description: string;
}

export const TITLES: TitleDef[] = [
  { id: "debut", name: "Debut en el banquillo", description: "Dirige tu primer partido." },
  { id: "invicto", name: "Invicto", description: "Pasa una fase de grupos sin perder." },
  { id: "remontada", name: "Rey de la remontada", description: "Gana tras ir perdiendo." },
  { id: "campeon", name: "Campeón del Mundo", description: "Levanta la copa." },
  { id: "dinastia", name: "Dinastía", description: "Gana dos torneos seguidos." },
  // ── Hitos de carrera de largo plazo (varias temporadas) ──
  { id: "veterano", name: "Veterano del banquillo", description: "Dirige 50 partidos." },
  { id: "centenario", name: "Centenario", description: "Dirige 100 partidos." },
  { id: "centurion", name: "Centurión", description: "Acumula 50 victorias." },
  { id: "goleador", name: "Goleador histórico", description: "Tu equipo marca 100 goles." },
  { id: "bicampeon", name: "Bicampeón del Mundo", description: "Gana dos Mundiales." },
  { id: "tricampeon", name: "Hegemonía mundial", description: "Gana tres Mundiales." },
  { id: "leyenda_banquillo", name: "Leyenda del banquillo", description: "Alcanza el rango Leyenda (overall 88)." },
];

// ─── Curva de XP / overall (Pilar 2) ─────────────────────────────────────────
/**
 * XP necesaria para el siguiente nivel según el overall actual.
 *
 * Regla mental sencilla para el jugador: GANAR PARTIDOS SUBE TU NIVEL.
 * Un partido reparte ~130-170 XP (victoria), así que al principio subes de
 * nivel cada ~3 victorias y la barra se mueve de forma visible. La curva es
 * cuadrática suave: cada nivel cuesta un poco más, de modo que llegar a la
 * élite (90+) sigue siendo un logro de largo plazo, pero NO invisible.
 *
 * Ej.: overall 50 ≈ 460 XP (~3 victorias) · 70 ≈ 845 · 90 ≈ 1356 · 99 ≈ 1628.
 *
 * (Antes: 150 + 12·overall + 0.6·overall² → 2250 XP al nivel 50. Eso hacía que
 * ni ganando el Mundial entero subieras un solo nivel: nadie entendía la barra.)
 */
export function xpRequired(overall: number): number {
  return Math.round(60 + overall * overall * 0.16);
}

/** Nivel inicial del DT (overall de partida). La curva de XP arranca aquí. */
export const START_OVERALL = 50;

/**
 * XP TOTAL acumulada necesaria para alcanzar `overall` desde el nivel inicial.
 * Inversa de `xpRequired`: el servidor deriva el overall autoritativo del ranking
 * a partir de la XP total, y los saves antiguos (sin `xpTotal`) lo reconstruyen
 * con esta función. `cumulativeXpForOverall(START_OVERALL) === 0`.
 */
export function cumulativeXpForOverall(overall: number): number {
  let total = 0;
  for (let k = START_OVERALL; k < overall; k++) total += xpRequired(k);
  return total;
}

// ─── Misiones semilla (Pilar 4) ──────────────────────────────────────────────
// Plantillas base; el motor de misiones (fase posterior) generará instancias
// con fechas e ids concretos. Aquí solo el catálogo de referencia.
export interface MissionTemplate {
  key: string;
  kind: "diaria" | "semanal" | "torneo" | "flash";
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardReputation: number;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  { key: "entreno_diario", kind: "diaria", title: "Sesión de entrenamiento", description: "Completa el entrenamiento del día.", target: 1, rewardXp: 30, rewardReputation: 2 },
  { key: "victoria_semanal", kind: "semanal", title: "Sumar de a tres", description: "Gana un partido esta semana.", target: 1, rewardXp: 120, rewardReputation: 10 },
  { key: "racha_torneo", kind: "torneo", title: "Racha imparable", description: "Encadena 3 victorias en el torneo.", target: 3, rewardXp: 300, rewardReputation: 25 },
  { key: "porteria_cero", kind: "flash", title: "Portería a cero", description: "Termina un partido sin recibir goles.", target: 1, rewardXp: 80, rewardReputation: 8 },
];

// Clave de localStorage para el modo invitado.
export const CAREER_STORAGE_KEY = "zm_modo_carrera_v1";
export const CAREER_SCHEMA_VERSION = 1;
