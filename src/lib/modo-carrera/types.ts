// src/lib/modo-carrera/types.ts
//
// Modelo de datos del MODO CARRERA (estilo FIFA Career Mode). Todo el progreso
// del usuario vive en un único objeto CareerState que se guarda en localStorage
// (modo invitado) y se sincroniza a Supabase (tabla modo_carrera_saves) al
// iniciar sesión, exactamente igual que el FantasyTeamState del Fantasy.
//
// El estado agrupa los 7 PILARES del diseño:
//   1. Identidad DT       → identity
//   2. Progresión         → progression
//   3. Árbol de habilidades → skills
//   4. Misiones dinámicas → missions
//   5. Reputación         → reputation
//   6. Narrativa viva     → narrative
//   7. Legado DT          → legacy

// ─── Pilar 1: Identidad DT ───────────────────────────────────────────────────
/** Las 4 filosofías tácticas elegibles al crear el DT. */
export type Philosophy = "ofensiva" | "defensiva" | "posesion" | "contragolpe";

export interface DTIdentity {
  /** Nombre del director técnico (lo elige el usuario). */
  name: string;
  /** Filosofía táctica base (define bonus/penalizaciones). */
  philosophy: Philosophy | null;
  /** Slug de la selección adoptada (una de las 48 fichas BIBLIA). */
  nationSlug: string | null;
  /** Semilla del avatar/carta DT (determinista para colores y patrón). */
  avatarSeed: number;
  /** Marca temporal de creación del DT. */
  createdAt: string | null;
}

// ─── Pilar 2: Progresión ─────────────────────────────────────────────────────
export interface Progression {
  /** Valoración global del DT, 0-99 (estilo overall FIFA). */
  overall: number;
  /** Experiencia acumulada en el nivel actual. */
  xp: number;
  /** XP necesaria para subir de nivel (crece con el overall). */
  xpToNext: number;
  /** Moral del vestuario, 0-100 (afecta rendimiento). */
  morale: number;
  /** Temporada actual de la carrera. */
  season: number;
}

// ─── Pilar 3: Árbol de habilidades ───────────────────────────────────────────
/** Las 4 ramas del árbol; cada una sube de 0 a 5. */
export type SkillBranch = "ataque" | "defensa" | "mental" | "gestion";

export interface SkillTree {
  /** Nivel actual (0-5) por rama. */
  levels: Record<SkillBranch, number>;
  /** Puntos de habilidad disponibles para gastar. */
  points: number;
}

// ─── Pilar 4: Misiones dinámicas ─────────────────────────────────────────────
export type MissionKind = "diaria" | "semanal" | "torneo" | "flash";
export type MissionStatus = "activa" | "completada" | "fallida" | "reclamada";

export interface Mission {
  id: string;
  kind: MissionKind;
  title: string;
  description: string;
  /** Progreso 0..target. */
  progress: number;
  target: number;
  /** Recompensas al completar. */
  rewardXp: number;
  rewardReputation: number;
  status: MissionStatus;
  /** ISO de expiración (para diarias/flash). null = sin caducidad. */
  expiresAt: string | null;
}

// ─── Pilar 5: Reputación ─────────────────────────────────────────────────────
/** Los 6 stats de reputación que definen el perfil público del DT. */
export interface ReputationStats {
  prestigio: number;
  carisma: number;
  tactica: number;
  disciplina: number;
  mediatico: number;
  cantera: number;
}

export interface Rivalry {
  /** Slug o nombre del DT/selección rival. */
  rival: string;
  /** Intensidad de la rivalidad, 0-100. */
  intensity: number;
  wins: number;
  losses: number;
}

export interface Reputation {
  /** Reputación global agregada (se replica en la columna `reputation`). */
  total: number;
  stats: ReputationStats;
  rivalries: Rivalry[];
  /** Títulos/insignias desbloqueados (ids). */
  titles: string[];
}

// ─── Pilar 6: Narrativa viva ─────────────────────────────────────────────────
export type NarrativeKind = "briefing" | "titular" | "rueda_prensa" | "evento";

export interface NarrativeEntry {
  id: string;
  kind: NarrativeKind;
  /** Texto generado (Claude API) o plantilla. */
  body: string;
  /** ISO de creación. */
  createdAt: string;
  /** Si requiere decisión del usuario (rueda de prensa con opciones). */
  choices?: { id: string; label: string; effect: string }[];
  /** Opción elegida por el usuario, si aplica. */
  chosen?: string | null;
}

// ─── Pilar 7: Legado DT ──────────────────────────────────────────────────────
export interface Trophy {
  id: string;
  name: string;
  season: number;
  /** ISO de obtención. */
  wonAt: string;
}

export interface Legacy {
  trophies: Trophy[];
  /** Récords permanentes del perfil DT. */
  records: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    titlesWon: number;
  };
}

// ─── Lesiones (plantel) ──────────────────────────────────────────────────────
/** Un jugador lesionado de la selección del DT, con los partidos de baja restantes. */
export interface Injury {
  /** Nombre del jugador (de FANTASY_ROSTERS). */
  player: string;
  /** Posición (FWD/MID/DEF/GK), define si penaliza ataque o defensa. */
  pos: string;
  /** Partidos restantes de baja (se descuenta tras cada partido). */
  matchesOut: number;
}

/**
 * Una sanción por tarjetas (roja directa o acumulación de amarillas). Reutiliza
 * la forma de Injury: el jugador no está disponible los `matchesOut` partidos.
 */
export type SuspensionReason = "roja" | "amarillas";
export interface Suspension {
  player: string;
  pos: string;
  matchesOut: number;
  /** Motivo de la sanción (para el relato). */
  reason: SuspensionReason;
}

/** Estado del plantel: lesiones, sanciones y capitán designado. */
export interface SquadState {
  injuries: Injury[];
  /** Sanciones por tarjetas activas (mismo efecto de baja que una lesión). */
  suspensions?: Suspension[];
  /** Nombre del capitán designado por el DT (bonus de moral/liderazgo). */
  captain?: string | null;
}

// ─── Motor de temporada (bucle de juego) ─────────────────────────────────────
/** Resultado de un partido desde la óptica del DT. */
export type MatchOutcome = "V" | "E" | "D";

/** Fases del torneo (Mundial) que dirige el DT en una temporada. */
export type TournamentStage =
  | "grupos"
  | "octavos"
  | "cuartos"
  | "semifinal"
  | "final"
  | "campeon"
  | "eliminado";

/** Un partido del calendario de la temporada. */
export interface SeasonMatch {
  id: string;
  /** Fase a la que pertenece el partido. */
  stage: TournamentStage;
  /** Etiqueta legible ("Fase de grupos · J1", "Final"...). */
  label: string;
  /** Slug de la selección rival (ficha BIBLIA). */
  opponentSlug: string;
  /** ¿Se juega como local? (afecta levemente la simulación). */
  home: boolean;
  /**
   * Solo en Temporada en Vivo: instante real del saque (ISO). El partido no se
   * puede disputar hasta que llegue esa hora. null/ausente = sin bloqueo horario.
   */
  kickoffISO?: string | null;
  played: boolean;
  /** Goles a favor/en contra (null hasta que se juega). */
  gf: number | null;
  ga: number | null;
  outcome: MatchOutcome | null;
}

/** Estado de la temporada/torneo en curso. */
export interface SeasonState {
  /** Número de temporada (espejo de progression.season al crearse). */
  season: number;
  /** Calendario completo del torneo. */
  fixtures: SeasonMatch[];
  /** Índice del próximo partido a disputar. */
  cursor: number;
  /** Fase actual o estado terminal (campeon/eliminado). */
  stage: TournamentStage;
  /** El torneo terminó (campeón o eliminado). */
  finished: boolean;
  /**
   * Temporada en Vivo (Pase DT): el calendario sigue los partidos REALES de la
   * selección y cada encuentro se desbloquea a la hora real del saque.
   */
  live?: boolean;
}

// ─── Junta / Federación (presión y objetivos, estilo FIFA) ───────────────────
/** Fase mínima que la federación exige alcanzar esta temporada. */
export type BoardDemand = "octavos" | "cuartos" | "semifinal" | "final" | "campeon";

/** Veredicto de la federación al cerrar la temporada. */
export type BoardVerdict = "pendiente" | "superado" | "cumplido" | "fallido";

export interface BoardState {
  /** Objetivo mínimo de la temporada (se fija al arrancar el torneo). */
  objective: BoardDemand;
  /** Confianza de la federación, 0-100. Por debajo de 25 el puesto peligra. */
  confidence: number;
  /** Resultado de la última evaluación de temporada. */
  lastVerdict: BoardVerdict;
}

// ─── Racha diaria (enganche de retorno) ──────────────────────────────────────
/** Racha de días consecutivos en los que el DT reclama su recompensa diaria. */
export interface StreakState {
  /** Días consecutivos en la racha actual. */
  current: number;
  /** Mejor racha histórica alcanzada. */
  best: number;
  /** Fecha (YYYY-MM-DD, hora local) del último reclamo. null = nunca. */
  lastClaim: string | null;
}

// ─── Estado raíz de la carrera ───────────────────────────────────────────────
export interface CareerState {
  /** Versión del esquema, para migraciones futuras del JSON. */
  version: number;
  identity: DTIdentity;
  progression: Progression;
  skills: SkillTree;
  missions: Mission[];
  reputation: Reputation;
  narrative: NarrativeEntry[];
  legacy: Legacy;
  /** Junta/federación: objetivo de temporada y confianza en el DT. */
  board: BoardState;
  /** Racha diaria de retorno (recompensa por entrar cada día). */
  streak: StreakState;
  /** Torneo en curso (motor de temporada). null = aún no iniciado. */
  season: SeasonState | null;
  /** Plantel: lesiones activas. Opcional para compatibilidad con saves antiguos. */
  squad?: SquadState;
  /** Marca de última actualización local. */
  updatedAt: string;
}

/** Entrada del ranking global de DTs (cruza usuarios). */
export interface CareerRankEntry {
  position: number;
  user_id: string;
  dt_name: string;
  nation_slug: string | null;
  display_name: string;
  avatar_url: string | null;
  overall: number;
  reputation: number;
  rank: string;
}

/** Pestañas del Hub jugable (orden de navegación). */
export type CareerTab =
  | "hub"
  | "temporada"
  | "habilidades"
  | "misiones"
  | "reputacion"
  | "narrativa"
  | "legado"
  | "ranking";
