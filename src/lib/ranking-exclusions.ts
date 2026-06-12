// Usuarios excluidos de TODOS los rankings/leaderboards.
//
// El propietario y el staff no compiten contra los usuarios: no aparecen en
// ningún ranking ni cuentan para la posición de los demás. Lista central para
// que todos los leaderboards (global, trivia, predicciones, fantasy, modo
// carrera, módulos) apliquen la misma exclusión.

export const RANKING_EXCLUDED_IDS: readonly string[] = [
  "341e0349-6eeb-488e-8dac-d5a2fbfc7ac5", // sprintmarkt (propietario)
];

const EXCLUDED_SET: ReadonlySet<string> = new Set(RANKING_EXCLUDED_IDS);

/** ¿Este usuario está excluido de los rankings? */
export function isRankingExcluded(userId: string | null | undefined): boolean {
  return !!userId && EXCLUDED_SET.has(userId);
}

/**
 * Cláusula para PostgREST: `(id1,id2,…)` para usar con
 * `.not("id" | "user_id", "in", excludedInClause())`. Así el `limit` se aplica
 * YA sin los excluidos (top completo, sin huecos). Devuelve null si la lista
 * está vacía (para no añadir un filtro inútil).
 */
export function excludedInClause(): string | null {
  if (RANKING_EXCLUDED_IDS.length === 0) return null;
  return `(${RANKING_EXCLUDED_IDS.join(",")})`;
}
