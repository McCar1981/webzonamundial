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
 * Queries cover the full FOOTBALL World Cup 2026 beat. GNews limits each
 * query to 200 chars, so we keep them short and rely on the post-fetch
 * filter (isNonFootballArticle) to drop non-football results.
 *
 * Each query: ≤200 chars, focused on a single topic + Mundial 2026 anchor.
 */
export const WORLD_CUP_QUERIES = {
  // Football + Mundial anchor (broad, default)
  general: '"Mundial 2026" AND (fútbol OR FIFA OR selección)',
  // Match-day, fixtures, lineups
  fixtures: '"Mundial 2026" AND (convocatoria OR calendario OR alineación OR partido)',
  // Injuries beat — flexibilizado: ya no requiere "Mundial 2026" en el texto.
  // Muchas noticias de lesiones de cracks (Neymar, Yamal, Mbappé...) no usan
  // ese tag pero implican impacto en el Mundial.
  injuries: '(lesión OR baja) AND (Neymar OR Vinicius OR Yamal OR Mbappé OR Cristiano OR Messi OR Bellingham OR Haaland OR Pedri OR Rodrygo OR Endrick OR "Julián Álvarez")',
  // Injuries genérico CON anchor mundial (red secundaria)
  injuries_wc: '"Mundial 2026" AND (lesión OR baja OR duda OR operación)',
  // Coach / DT / staff
  coaches: '"Mundial 2026" AND (seleccionador OR DT OR técnico OR coach OR Bielsa OR Scaloni OR Aguirre OR Ancelotti OR Tite)',
  // Player profiles + stars — ampliado
  stars: '(Messi OR Mbappé OR Vinicius OR Yamal OR Bellingham OR Cristiano OR Neymar OR Haaland) AND (selección OR "Mundial 2026" OR clasifica OR convocatoria)',
  // Convocatorias y plantillas (caliente en mayo-junio 2026)
  squad: '("lista de 26" OR convocatoria OR plantilla OR "26 jugadores" OR squad) AND "Mundial 2026"',
  // Venues + stadiums
  venues: '"Mundial 2026" AND (sede OR estadio OR MetLife OR Azteca OR Akron OR Guadalajara)',
  // Tickets / fan experience
  tickets: '"Mundial 2026" AND (entrada OR boleto OR ticket OR hotel)',
  // FIFA institutional
  fifa: '"FIFA" AND "Mundial 2026" AND (decisión OR anuncio OR reglamento)',
  // Eliminatorias / qualifiers (residual: ya hay todos clasificados)
  qualifiers: '"Mundial 2026" AND (eliminatoria OR clasificación OR qualifier OR repechaje)',
  // Historical context
  history: '"Copa del Mundo" AND fútbol AND (historia OR histórico OR retrospectiva)',
  // Argentina beat
  argentina: '(Argentina OR Albiceleste OR Scaloni OR Messi) AND ("Mundial 2026" OR convocatoria OR selección)',
  // Brazil beat
  brazil: '(Brasil OR Canarinha OR Ancelotti OR Neymar OR Vinicius) AND ("Mundial 2026" OR convocatoria)',
  // Spain beat
  spain: '(España OR "La Roja" OR "De la Fuente" OR Yamal OR Pedri) AND ("Mundial 2026" OR selección)',
  // Mexico beat (host country)
  mexico: '(México OR Tri OR Aguirre OR "Edson Álvarez") AND ("Mundial 2026" OR selección)',
  // USA beat (host country)
  usa: '"World Cup 2026" AND (USMNT OR "United States" OR Pulisic OR Pochettino)',
  // Portugal
  portugal: '(Portugal OR "Cristiano Ronaldo" OR Bernardo) AND ("Mundial 2026" OR selección)',
  // Francia
  france: '(Francia OR "Les Bleus" OR Mbappé OR Deschamps) AND ("Mundial 2026" OR convocatoria)',
  // Inglaterra
  england: '("England" OR Inglaterra OR Bellingham OR Kane OR Tuchel) AND "Mundial 2026"',

  // ── LIGAS DE CLUBES — pivote a fútbol de clubes todo el año ──
  // Estos beats NO anclan en "Mundial 2026": traen la actualidad de las ligas
  // que el usuario puede seguir (su club / su liga). Alimentan el feed
  // personalizado "Noticias de tu fútbol". El filtro isNonFootballArticle +
  // NON_FOOTBALL_BLOCK_LIST descarta resultados de otros deportes. Orden
  // pan-LATAM: mercado, Ecuador y CONMEBOL primero, México/España después.
  // Mercado de pases / fichajes (genérico, muy caliente en la ventana de verano)
  fichajes: 'fútbol AND (fichaje OR fichajes OR "mercado de pases" OR traspaso OR refuerzo OR cesión OR "acuerdo total")',
  // LigaPro Ecuador (≈50% de la audiencia)
  ligapro_ecuador: '(LigaPro OR "Liga Pro" OR "Barcelona SC" OR "Liga de Quito" OR "Independiente del Valle" OR Emelec OR "fútbol ecuatoriano") AND fútbol',
  // CONMEBOL de clubes: Libertadores + Sudamericana
  conmebol_clubes: '(Libertadores OR Sudamericana OR CONMEBOL) AND fútbol AND (partido OR fase OR clasifica OR eliminatoria OR fichaje OR gol)',
  // Liga MX
  liga_mx: '"Liga MX" AND (jornada OR liguilla OR clásico OR fichaje OR refuerzo OR gol OR América OR Chivas OR "Cruz Azul")',
  // LaLiga (España)
  laliga_clubes: 'LaLiga AND (Barcelona OR "Real Madrid" OR "Atlético" OR jornada OR fichaje OR refuerzo OR gol)',
  // Liga FUTVE (Venezuela)
  futve_venezuela: '("Liga FUTVE" OR "fútbol venezolano" OR "Deportivo Táchira" OR "Caracas FC" OR "Primera División de Venezuela") AND fútbol',
  // Resto de ligas seguibles (Américas + grandes de Europa), cobertura amplia
  ligas_top: '(Brasileirão OR "Liga Profesional Argentina" OR "Primera A" OR MLS OR "Premier League" OR "Champions League" OR "Serie A") AND fútbol AND (fichaje OR jornada OR gol OR partido)',
};

export type WorldCupQueryKey = keyof typeof WORLD_CUP_QUERIES;

/**
 * Beats ordenados por prioridad editorial en la ventana pre-Mundial. La
 * rotación del cron se sesga hacia el principio de esta lista.
 *
 * Beats CALIENTES: convocatorias, lesiones, cracks y selecciones top devuelven
 * noticia con sustancia (datos, nombres, contexto) que el reescritor puede
 * convertir en piezas originales y profundas → pasan el crítico de calidad.
 *
 * Beats FRÍOS: sedes, entradas, historia y FIFA institucional tienden a
 * devolver relleno tangencial/de servicio (turismo, guías de streaming/trenes)
 * que el crítico rechaza. Se cubren solo de vez en cuando para no inundar el
 * feed de paja.
 */
export const HOT_QUERY_KEYS: WorldCupQueryKey[] = [
  // Ligas de clubes — beats primarios tras el Mundial 2026 (pivote todo el año).
  // Van al frente para que el feed personalizado "Noticias de tu fútbol"
  // (club + liga) tenga material desde el primer día. Orden pan-LATAM.
  "fichajes",
  "ligapro_ecuador",
  "conmebol_clubes",
  "liga_mx",
  "laliga_clubes",
  "ligas_top",
  "futve_venezuela",
  // Mundial 2026 — cobertura residual post-torneo (cracks, lesiones, análisis).
  "squad",
  "injuries",
  "injuries_wc",
  "stars",
  "fixtures",
  "coaches",
  "argentina",
  "brazil",
  "spain",
  "mexico",
  "usa",
  "portugal",
  "france",
  "england",
  "general",
];

export const COLD_QUERY_KEYS: WorldCupQueryKey[] = [
  "fifa",
  "qualifiers",
  "venues",
  "tickets",
  "history",
];

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
