/**
 * GNews.io API client.
 *
 * Free tier: 100 requests/day, max 10 articles per request.
 * Docs: https://gnews.io/docs/v4
 */

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string; // ISO 8601
  source: {
    name: string;
    url: string;
  };
}

export interface GNewsSearchOptions {
  /** Search query (supports operators: AND, OR, NOT, quotes for exact match) */
  q: string;
  /** ISO 639-1 language code */
  lang?: "es" | "en" | "pt" | "fr" | "de" | "it";
  /** ISO 3166-1 alpha-2 country code */
  country?: string;
  /** Max articles (1-100; free tier returns at most 10) */
  max?: number;
  /** Sort: "publishedAt" (default) | "relevance" */
  sortBy?: "publishedAt" | "relevance";
  /** Date range filter: ISO 8601 timestamp */
  from?: string;
  to?: string;
  /** Restrict to specific source domain (e.g., "marca.com") */
  in?: string;
}

export interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

const ENDPOINT = "https://gnews.io/api/v4";

function getApiKey(): string {
  const key = process.env.GNEWS_API_KEY;
  if (!key) throw new Error("GNEWS_API_KEY missing in environment");
  return key;
}

/**
 * Search articles. Use this for keyword-based ingestion (Mundial 2026, FIFA, etc).
 */
export async function gnewsSearch(opts: GNewsSearchOptions): Promise<GNewsResponse> {
  const params = new URLSearchParams({
    q: opts.q,
    lang: opts.lang || "es",
    max: String(opts.max ?? 10),
    sortby: opts.sortBy || "publishedAt",
    apikey: getApiKey(),
  });
  if (opts.country) params.set("country", opts.country);
  if (opts.from) params.set("from", opts.from);
  if (opts.to) params.set("to", opts.to);
  if (opts.in) params.set("in", opts.in);

  const res = await fetch(`${ENDPOINT}/search?${params.toString()}`, {
    next: { revalidate: 0 }, // never cache server-side, the cron handles freshness
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GNews search failed (${res.status}): ${text}`);
  }
  return (await res.json()) as GNewsResponse;
}

/**
 * Top headlines (alternative endpoint, useful for the breaking ticker).
 */
export async function gnewsTopHeadlines(opts: {
  topic?: "world" | "nation" | "business" | "technology" | "entertainment" | "sports" | "science" | "health";
  lang?: string;
  country?: string;
  max?: number;
}): Promise<GNewsResponse> {
  const params = new URLSearchParams({
    lang: opts.lang || "es",
    max: String(opts.max ?? 10),
    apikey: getApiKey(),
  });
  if (opts.topic) params.set("topic", opts.topic);
  if (opts.country) params.set("country", opts.country);

  const res = await fetch(`${ENDPOINT}/top-headlines?${params.toString()}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GNews top-headlines failed (${res.status}): ${text}`);
  }
  return (await res.json()) as GNewsResponse;
}

/* ---------------------------------------------------------------- */
/* Pre-built queries for the World Cup beat                         */
/* ---------------------------------------------------------------- */

/**
 * Queries cover the full FOOTBALL World Cup 2026 beat — players, selecciones,
 * sedes, historia, fichajes, lesiones, partidos, polémicas. Each query is
 * narrowed with FIFA / fútbol terms to avoid catching results from other
 * "Copa del Mundo" sports (cycling, rugby, swimming, etc.) that share the
 * same noun in Spanish/English.
 *
 * Anchor pattern (used in every query):
 *   FOOTBALL_ANCHOR + AND + topic terms
 */
const FOOTBALL_ANCHOR =
  '("Mundial 2026" OR "Copa del Mundo 2026" OR "World Cup 2026") AND ' +
  '(fútbol OR futbol OR football OR FIFA OR selección OR seleccion OR ' +
  '"copa mundial" OR Mundial OR jugador OR partido OR estadio OR liga)';

export const WORLD_CUP_QUERIES = {
  // Anchor: any football-tagged World Cup 2026 article
  general: FOOTBALL_ANCHOR,
  // Match-day, fixtures, lineups
  fixtures: `${FOOTBALL_ANCHOR} AND (calendario OR fixture OR alineación OR convocatoria OR lista OR partido)`,
  // Injuries beat
  injuries: `${FOOTBALL_ANCHOR} AND (lesión OR baja OR operad OR injury OR ligamento)`,
  // Coach / DT / staff
  coaches: `${FOOTBALL_ANCHOR} AND (seleccionador OR DT OR técnico OR coach OR "cuerpo técnico")`,
  // Player profiles + stars
  stars: `${FOOTBALL_ANCHOR} AND (Messi OR Mbapp OR Vinicius OR Lamine OR Bellingham OR Yamal OR Kane OR Cristiano OR Neymar OR Haaland OR Pedri)`,
  // Venues + cities + stadiums (sedes)
  venues: `${FOOTBALL_ANCHOR} AND (sede OR estadio OR MetLife OR Azteca OR SoFi OR "ciudad anfitriona" OR "host city")`,
  // Tickets, hotels, fan experience
  tickets: `${FOOTBALL_ANCHOR} AND (entrada OR boleto OR ticket OR hotel OR fan OR aficionado)`,
  // Federations / FIFA institutional
  fifa: `"FIFA" AND ("Mundial 2026" OR "World Cup 2026") AND (fútbol OR futbol OR football) AND (decisión OR anuncio OR norma OR reglamento OR sanción)`,
  // Eliminatorias / qualifiers leading up to the World Cup
  qualifiers: `${FOOTBALL_ANCHOR} AND (eliminatoria OR clasificación OR qualifier OR repechaje)`,
  // Historical context (anniversaries, classics, retrospectives)
  history: `(fútbol OR futbol OR football OR FIFA OR selección) AND (historia OR histórico OR retrospectiva) AND ("Copa del Mundo" OR Mundial)`,
  // Argentina beat
  argentina: `${FOOTBALL_ANCHOR} AND (Argentina OR Albiceleste OR Scaloni OR Messi)`,
  // Brazil beat
  brazil: `${FOOTBALL_ANCHOR} AND (Brasil OR Brazil OR Canarinha OR Ancelotti)`,
  // Spain beat
  spain: `${FOOTBALL_ANCHOR} AND (España OR "La Roja" OR "De la Fuente" OR Lamine)`,
  // Mexico beat (host country)
  mexico: `${FOOTBALL_ANCHOR} AND (México OR Tri OR Aguirre OR Giménez OR "Hirving Lozano")`,
  // USA beat (host country)
  usa: `${FOOTBALL_ANCHOR} AND ("Estados Unidos" OR USMNT OR "Christian Pulisic")`,
};

export type WorldCupQueryKey = keyof typeof WORLD_CUP_QUERIES;

/**
 * Hard-blocked terms in titles or descriptions: if any appears, the article
 * is dropped before reaching the LLM, regardless of which query found it.
 * Catches "Copa del Mundo" articles about cycling, rugby, swimming etc.
 */
const NON_FOOTBALL_BLOCK_LIST = [
  // Cycling
  "ciclismo",
  "cycling",
  "ciclista",
  "uci",
  "tour de france",
  // Rugby
  "rugby",
  // Other ball sports
  "baloncesto",
  "basket",
  "voleibol",
  "volleyball",
  "balonmano",
  "handball",
  "hockey",
  "criquet",
  "cricket",
  // Athletics / pool / racket
  "atletismo",
  "natación",
  "swimming",
  "tenis",
  "tennis",
  "pádel",
  "padel",
  "golf",
  "esquí",
  "ski",
  "patinaje",
  "skating",
  "judo",
  "karate",
  "esgrima",
  "fencing",
  "halterofilia",
  "weightlifting",
  // Motor / racing
  "fórmula 1",
  "formula 1",
  "f1 ",
  "motogp",
  "nascar",
  // Other
  "ajedrez",
  "chess",
  "esports",
  "videojuegos",
];

/**
 * Returns true if the article is clearly NOT about football.
 * Used to filter GNews results before feeding them to the LLM.
 */
export function isNonFootballArticle(article: { title: string; description?: string }): boolean {
  const haystack = `${article.title} ${article.description || ""}`.toLowerCase();
  return NON_FOOTBALL_BLOCK_LIST.some((term) => haystack.includes(term));
}
