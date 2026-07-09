// src/data/competitions.ts
//
// Catálogo de competiciones de "Zona de Ligas": la FUENTE ÚNICA DE VERDAD del
// pivote de ZonaMundial (del Mundial 2026 al fútbol de clubes todo el año). Todo
// lo que venga después (sync de fixtures, poller, pantallas de liga, selector de
// competición, juegos multi-liga) lee de aquí.
//
// Los `apiFootballId` están VALIDADOS en vivo contra api-football v3
// (api-sports.io) el 2026-07-02 con GET /leagues?search=. NO se han escrito a
// mano ni copiado de otro proveedor (apifootball.com usa ids distintos).
//
// LA TEMPORADA NO SE HARDCODEA. Al validar (2-jul, parón europeo) se vio que cada
// liga marca su temporada `current` en fechas distintas: Liga MX/LaLiga ya en
// 2026 mientras Bundesliga/Primeira seguían en 2025. La temporada vigente se
// resuelve dinámicamente por liga vía api-football (seasons[].current === true),
// nunca con una constante.
//
// Orden = prioridad de construcción LATAM-first (§8 del doc de dirección de
// diseño): la audiencia real es 80% MX/LATAM (Ecuador 50%). NO se arranca por la
// Premier.

export type CompetitionFormat =
  | "league" // liga regular, tabla única (LaLiga, Premier, Brasileirão…)
  | "split-playoff" // apertura/clausura o dos etapas + liguilla (Liga MX, Argentina, Colombia, Ecuador)
  | "conference-playoff" // conferencias + playoffs (MLS)
  | "groups-knockout" // fase de grupos + eliminatoria (copas CONMEBOL/CONCACAF, Mundial de Clubes)
  | "league-phase-knockout"; // fase liga (modelo suizo) + eliminatoria (UEFA)

export type CompetitionScope = "domestic" | "continental" | "intercontinental";
export type CompetitionRegion = "americas" | "europa" | "global";

export interface Competition {
  /** Segmento de URL público, p.ej. /ligas/liga-mx */
  slug: string;
  /** Nombre visible completo */
  name: string;
  /** Etiqueta corta para chips y espacios estrechos */
  short: string;
  /** ID de liga en api-football v3 (validado en vivo 2026-07-02) */
  apiFootballId: number;
  /** País (ligas nacionales) o confederación/ámbito (copas) */
  country: string;
  /** Código flagcdn (iso alpha-2, minúsculas) si es liga nacional; null en copas continentales */
  flag: string | null;
  scope: CompetitionScope;
  region: CompetitionRegion;
  format: CompetitionFormat;
  /** Ola de construcción: 1 = primera (MX/Ecuador/Libertadores/LaLiga) */
  wave: 1 | 2 | 3;
}

export const COMPETITIONS: Competition[] = [
  // ── OLA 1 — punta de lanza LATAM (México núcleo, Ecuador 50% del tráfico) ──
  { slug: "liga-mx", name: "Liga MX", short: "Liga MX", apiFootballId: 262, country: "México", flag: "mx", scope: "domestic", region: "americas", format: "split-playoff", wave: 1 },
  // Liga MX Femenil: la liga femenina más vista del mundo (20,5M espectadores Apertura 2025)
  // y sin plataforma seria de datos/juego que la cubra — hueco de mercado nº1.
  // IDs validados en vivo contra /leagues?search= el 2026-07-09.
  { slug: "liga-mx-femenil", name: "Liga MX Femenil", short: "Liga MX Fem", apiFootballId: 673, country: "México", flag: "mx", scope: "domestic", region: "americas", format: "split-playoff", wave: 1 },
  { slug: "liga-expansion-mx", name: "Liga de Expansión MX", short: "Expansión MX", apiFootballId: 263, country: "México", flag: "mx", scope: "domestic", region: "americas", format: "split-playoff", wave: 1 },
  { slug: "ligapro-ecuador", name: "LigaPro Serie A (Ecuador)", short: "LigaPro EC", apiFootballId: 242, country: "Ecuador", flag: "ec", scope: "domestic", region: "americas", format: "split-playoff", wave: 1 },
  { slug: "libertadores", name: "CONMEBOL Libertadores", short: "Libertadores", apiFootballId: 13, country: "CONMEBOL", flag: null, scope: "continental", region: "americas", format: "groups-knockout", wave: 1 },
  { slug: "laliga", name: "LaLiga", short: "LaLiga", apiFootballId: 140, country: "España", flag: "es", scope: "domestic", region: "europa", format: "league", wave: 1 },

  // ── OLA 2 — resto de Américas + copas CONMEBOL/CONCACAF ──
  { slug: "primera-a-colombia", name: "Primera A (Colombia)", short: "Primera A", apiFootballId: 239, country: "Colombia", flag: "co", scope: "domestic", region: "americas", format: "split-playoff", wave: 2 },
  { slug: "liga-argentina", name: "Liga Profesional (Argentina)", short: "Liga Arg.", apiFootballId: 128, country: "Argentina", flag: "ar", scope: "domestic", region: "americas", format: "split-playoff", wave: 2 },
  { slug: "brasileirao", name: "Brasileirão Serie A", short: "Brasileirão", apiFootballId: 71, country: "Brasil", flag: "br", scope: "domestic", region: "americas", format: "league", wave: 2 },
  { slug: "mls", name: "Major League Soccer", short: "MLS", apiFootballId: 253, country: "EE. UU. / Canadá", flag: "us", scope: "domestic", region: "americas", format: "conference-playoff", wave: 2 },
  { slug: "sudamericana", name: "CONMEBOL Sudamericana", short: "Sudamericana", apiFootballId: 11, country: "CONMEBOL", flag: null, scope: "continental", region: "americas", format: "groups-knockout", wave: 2 },
  { slug: "concacaf-champions", name: "CONCACAF Champions Cup", short: "Concacaf CL", apiFootballId: 16, country: "CONCACAF", flag: null, scope: "continental", region: "americas", format: "groups-knockout", wave: 2 },

  // ── OLA 3 — grandes de Europa + copas UEFA + Mundial de Clubes ──
  { slug: "premier-league", name: "Premier League", short: "Premier", apiFootballId: 39, country: "Inglaterra", flag: "gb-eng", scope: "domestic", region: "europa", format: "league", wave: 3 },
  { slug: "serie-a", name: "Serie A", short: "Serie A", apiFootballId: 135, country: "Italia", flag: "it", scope: "domestic", region: "europa", format: "league", wave: 3 },
  { slug: "bundesliga", name: "Bundesliga", short: "Bundesliga", apiFootballId: 78, country: "Alemania", flag: "de", scope: "domestic", region: "europa", format: "league", wave: 3 },
  { slug: "ligue-1", name: "Ligue 1", short: "Ligue 1", apiFootballId: 61, country: "Francia", flag: "fr", scope: "domestic", region: "europa", format: "league", wave: 3 },
  { slug: "primeira-liga", name: "Primeira Liga", short: "Primeira", apiFootballId: 94, country: "Portugal", flag: "pt", scope: "domestic", region: "europa", format: "league", wave: 3 },
  { slug: "champions-league", name: "UEFA Champions League", short: "Champions", apiFootballId: 2, country: "UEFA", flag: null, scope: "continental", region: "europa", format: "league-phase-knockout", wave: 3 },
  { slug: "europa-league", name: "UEFA Europa League", short: "Europa League", apiFootballId: 3, country: "UEFA", flag: null, scope: "continental", region: "europa", format: "league-phase-knockout", wave: 3 },
  { slug: "conference-league", name: "UEFA Conference League", short: "Conference", apiFootballId: 848, country: "UEFA", flag: null, scope: "continental", region: "europa", format: "league-phase-knockout", wave: 3 },
  { slug: "club-world-cup", name: "Mundial de Clubes FIFA", short: "Mundial Clubes", apiFootballId: 15, country: "FIFA", flag: null, scope: "intercontinental", region: "global", format: "groups-knockout", wave: 3 },
];

// ── Índices y selectores (todo derivado, sin duplicar la fuente) ─────────────

const BY_SLUG = new Map(COMPETITIONS.map((c) => [c.slug, c]));
const BY_API_ID = new Map(COMPETITIONS.map((c) => [c.apiFootballId, c]));

/** Competición por slug de URL, o null si no existe. */
export function getCompetition(slug: string): Competition | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Competición por id de api-football, o null. */
export function getCompetitionByApiId(apiFootballId: number): Competition | null {
  return BY_API_ID.get(apiFootballId) ?? null;
}

/** Competiciones de una ola de construcción, en orden de catálogo. */
export function competitionsByWave(wave: 1 | 2 | 3): Competition[] {
  return COMPETITIONS.filter((c) => c.wave === wave);
}

/** Todos los ids de api-football del catálogo (para el poller / sync multi-liga). */
export const ALL_COMPETITION_API_IDS: number[] = COMPETITIONS.map((c) => c.apiFootballId);

/** Ids de api-football de una ola (para activar la cobertura por fases). */
export function apiIdsForWave(wave: 1 | 2 | 3): number[] {
  return competitionsByWave(wave).map((c) => c.apiFootballId);
}
