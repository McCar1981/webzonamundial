// src/lib/pro/limits.ts
//
// LA TABLA Free vs Pro en código. Única fuente de verdad de todos los límites
// del plan gratuito: cambiar un límite = cambiar una constante aquí.
//
// Este archivo es SERVER/CLIENT SAFE (solo constantes, sin process.env ni
// imports de servidor) para que la UI pueda importar los números y pintar
// copys exactos ("Te quedan 2 de 3 predicciones esta jornada") sin
// hardcodearlos en los componentes.
//
// El enforcement REAL ocurre siempre en las rutas API (server-side) usando
// isPro() de entitlement.ts + consumeDailyQuota() de quota.ts.

export const PRO_PRICE_DISPLAY = { monthly: "3 €/mes", yearly: "12 €/año" } as const;

export const FREE_LIMITS = {
  predictions: {
    /** Tipos "básicos": Free los juega en CUALQUIER partido de la jornada. */
    basicTypes: ["exact_score", "winner", "first_scorer"] as readonly string[],
    /** Tipos "avanzados": Free los juega SOLO en el partido destacado (1/jornada). */
    advancedTypes: ["chain", "duel", "over_under", "minute_drama", "social"] as readonly string[],
    /** Máximo de PARTIDOS distintos predecibles por jornada (no de predicciones). */
    maxMatchesPerJornada: 3,
    /** Partidos por jornada con acceso a los tipos avanzados (el "destacado"). */
    advancedMatchesPerJornada: 1,
    /** Multiplicadores (underdog, racha, early-bird) solo Pro. */
    multipliers: false,
  },
  fantasy: {
    /** Horas antes del kickoff de la jornada en que se congela la plantilla. */
    lockHoursBeforeGameweek: 24,
    /** Sustituciones con la jornada en juego. */
    liveSubs: false,
    /** Presupuesto extra (M€) sobre los 100M base. */
    budgetBonus: 0,
    /** Ver los puntos de la jornada en tiempo real. */
    livePoints: false,
  },
  carrera: {
    /** Temporadas que se pueden TERMINAR al día. */
    maxSeasonsPerDay: 3,
    /** Horas de espera para continuar al agotar las temporadas del día. */
    cooldownHours: 12,
    /** Guardado en la nube (Supabase); Free guarda solo en el dispositivo. */
    cloudSaves: false,
    /** Informe IA del rival antes de cada partido. */
    rivalReports: false,
    /** Opciones avanzadas del editor de tácticas. */
    advancedTactics: false,
  },
  iaCoach: {
    /** Consultas IA al día, total entre todos los modos. */
    dailyQueries: 1,
  },
  trivia: {
    /** Preguntas de la trivia DIARIA al día. */
    dailyQuestions: 5,
    /** Partidas al día de cada uno del resto de modos (relámpago, muerte súbita). */
    dailyRunsOtherModes: 1,
  },
  matchCenter: {
    /** Narración mejorada con IA (Free recibe la de plantilla). */
    aiNarration: false,
    /** Alertas push personalizadas por jugador/equipo. */
    customAlerts: false,
  },
  bars: {
    /** Crear bares propios (unirse es libre para todos). */
    canCreate: false,
  },
  leagues: {
    /** Crear ligas privadas (unirse con código es libre para todos). */
    canCreatePrivate: false,
  },
  stats: {
    /** xG, xA, mapas de calor, comparativas históricas. */
    advanced: false,
  },
  /** Publicidad visible. */
  ads: true,
} as const;

export const PRO_LIMITS = {
  predictions: {
    basicTypes: [
      "exact_score", "winner", "first_scorer", "chain",
      "duel", "over_under", "minute_drama", "social",
    ] as readonly string[],
    advancedTypes: [
      "exact_score", "winner", "first_scorer", "chain",
      "duel", "over_under", "minute_drama", "social",
    ] as readonly string[],
    maxMatchesPerJornada: Infinity,
    advancedMatchesPerJornada: Infinity,
    multipliers: true,
  },
  fantasy: {
    lockHoursBeforeGameweek: 0,
    liveSubs: true,
    budgetBonus: 5,
    livePoints: true,
  },
  carrera: {
    maxSeasonsPerDay: Infinity,
    cooldownHours: 0,
    cloudSaves: true,
    rivalReports: true,
    advancedTactics: true,
  },
  iaCoach: {
    dailyQueries: Infinity,
  },
  trivia: {
    dailyQuestions: Infinity,
    dailyRunsOtherModes: Infinity,
  },
  matchCenter: {
    aiNarration: true,
    customAlerts: true,
  },
  bars: {
    canCreate: true,
  },
  leagues: {
    canCreatePrivate: true,
  },
  stats: {
    advanced: true,
  },
  ads: false,
} as const;

export type PlanLimits = typeof FREE_LIMITS | typeof PRO_LIMITS;

/** Límites aplicables según el plan ya resuelto (isPro() es server-only). */
export function limitsFor(pro: boolean): PlanLimits {
  return pro ? PRO_LIMITS : FREE_LIMITS;
}

/**
 * Códigos de error que devuelven las rutas API al chocar con un límite Free.
 * El cliente los mapea al paywall contextual (<ProGate>): cada código lleva
 * su copy de upgrade.
 */
export const PRO_REQUIRED_CODE = "pro_required" as const;

export type ProFeature =
  | "predictions_type"
  | "predictions_jornada"
  | "fantasy_live"
  | "fantasy_lock"
  | "carrera_seasons"
  | "carrera_cloud_save"
  | "carrera_rival_report"
  | "ia_coach_daily"
  | "trivia_daily"
  | "trivia_runs"
  | "match_center_narration"
  | "match_center_alerts"
  | "bars_create"
  | "leagues_create"
  | "stats_advanced";

/** Respuesta estándar de un gate: la UI la convierte en paywall. */
export interface ProRequiredPayload {
  error: string;
  code: typeof PRO_REQUIRED_CODE;
  feature: ProFeature;
  /** Límite que se alcanzó (si aplica, p.ej. 3 predicciones/jornada). */
  limit?: number;
}
