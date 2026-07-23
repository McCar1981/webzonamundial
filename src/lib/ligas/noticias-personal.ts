// src/lib/ligas/noticias-personal.ts
//
// Noticias PERSONALIZADAS para Zona de Ligas. Prioridad del usuario:
//   1º  noticias de su(s) CLUB(es) elegido(s)
//   2º  noticias importantes de su(s) LIGA(s) elegida(s) (que no sean ya de club)
// Además marca las de FICHAJES/MERCADO (no hay categoría para ello: se detecta
// por palabras clave). Como las noticias no traen etiqueta estructurada de
// club/liga, el emparejamiento es por TEXTO (título + entradilla + tags), igual
// que ya hace la tarjeta "Mi club". Genérico: sirve para cualquier club/liga.

import { getAllPublicNoticias, readIngestStore } from "@/lib/noticias-store";
import { getCompetition } from "@/data/competitions";
import type { Noticia } from "@/data/noticias";

export interface NoticiaLite {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string | null;
  isTransfer: boolean;
  /** Timestamp ISO de entrada al sistema (para "hace X min" y badge NUEVO). */
  ts: string | null;
  /** Nombre del club seguido que menciona (para pintar su escudo), si aplica. */
  club: string | null;
}

/**
 * BREVE: titular flash de tu club/liga que AÚN no es artículo publicado. Sale
 * de los DRAFTS del ingest (GNews los trae cada hora; el crítico solo convierte
 * unos pocos en artículo completo). Solo se muestra en el widget personal —
 * nunca en /noticias ni en el sitemap — y enlaza a la FUENTE original con
 * atribución. Así el usuario ve la actualidad de SU club en minutos, sin
 * esperar al pipeline editorial.
 */
export interface Breve {
  title: string;
  source: string | null;
  url: string | null;
  ts: string; // ISO: ingestedAt (o date) — ordena y alimenta "hace X min"
  isTransfer: boolean;
  club: string | null;
}

function norm(s: string): string {
  return ` ${(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
}
// Coincidencia por palabra completa (evita falsos positivos por subcadenas).
function mentions(haystack: string, term: string): boolean {
  const t = norm(term).trim();
  return t.length >= 4 && haystack.includes(` ${t} `);
}

// Alias de liga → términos DISTINTIVOS tal como aparecen en el texto de las
// noticias. Necesario porque el nombre/short del catálogo ("LigaPro EC",
// "Liga FUTVE", "Primera A") casi nunca aparece literal en los titulares: la
// prensa dice "LigaPro", "FutVe", "Primera A". Sin esto, el emparejamiento por
// liga fallaría para casi todas menos LaLiga/Liga MX. Términos ≥4 chars y sin
// falsos positivos evidentes (se evita "MLS" de 3 chars, "serie a" es ambiguo
// pero aceptable para quien sigue esa liga).
const LEAGUE_ALIASES: Record<string, string[]> = {
  "liga-mx": ["liga mx", "liga mexicana"],
  "liga-mx-femenil": ["liga mx femenil", "liga femenil"],
  "liga-expansion-mx": ["liga de expansion", "expansion mx"],
  laliga: ["laliga", "la liga"],
  libertadores: ["libertadores", "copa libertadores"],
  sudamericana: ["sudamericana", "copa sudamericana"],
  "ligapro-ecuador": ["ligapro", "liga pro", "futbol ecuatoriano", "serie a de ecuador"],
  "liga-futve": ["futve", "futbol venezolano", "primera division de venezuela"],
  "primera-a-colombia": ["primera a", "futbol colombiano", "liga betplay", "liga colombiana"],
  "liga-argentina": ["liga profesional", "futbol argentino", "liga argentina"],
  brasileirao: ["brasileirao", "futbol brasileno"],
  mls: ["major league soccer", "la mls"],
  "concacaf-champions": ["concacaf champions", "concachampions", "copa de campeones"],
  "premier-league": ["premier league"],
  "serie-a": ["serie a"],
  bundesliga: ["bundesliga"],
  "ligue-1": ["ligue 1"],
  "primeira-liga": ["primeira liga"],
  "champions-league": ["champions league", "liga de campeones"],
  "europa-league": ["europa league"],
  "conference-league": ["conference league"],
};

// ── Términos de búsqueda/match por CLUB ──
// api-football guarda "Carabobo FC" pero la prensa escribe "Carabobo". Se deriva
// un "core" sin sufijos societarios (FC, SC, CD…) para ganar recall, SALVO que el
// core sea ambiguo a escala mundial ("Barcelona SC" NO puede reducirse a
// "Barcelona": colaría al Barça en el feed del hincha ecuatoriano).
const GENERIC_CLUB_TOKENS = new Set(["fc", "cf", "sc", "sd", "cd", "ac", "ec", "cp", "fbc", "csd", "club"]);
const AMBIGUOUS_CORES = new Set([
  "barcelona", "real", "atletico", "nacional", "independiente", "liga",
  "universidad", "deportivo", "sporting", "racing", "america", "junior",
  "union", "everton", "arsenal", "libertad", "guarani", "river", "boca",
  // Venezuela (Liga FUTVE): cores que chocan con otra entidad futbolística.
  // "Portuguesa FC" → "la selección portuguesa"; "Zamora FC" → el Trofeo
  // Zamora de LaLiga; "Caracas FC" → la ciudad; "vinotinto" → la selección.
  "portuguesa", "zamora", "caracas", "vinotinto",
]);

/** Términos con los que un texto "menciona" al club: el nombre completo y, si es
 *  seguro, el core sin sufijos (p.ej. "Carabobo FC" → ["Carabobo FC","carabobo"]). */
export function clubMatchTerms(name: string): string[] {
  const full = name.trim();
  if (!full) return [];
  const normWords = norm(full).trim().split(" ").filter(Boolean);
  const core = normWords.filter((w) => !GENERIC_CLUB_TOKENS.has(w)).join(" ");
  const terms = [full];
  if (core && core !== normWords.join(" ") && core.length >= 5 && !AMBIGUOUS_CORES.has(core)) {
    terms.push(core);
  }
  return terms;
}

const TRANSFER_RE = /fichaj|traspas|refuerz|\bcede\b|cesion|prestam|acuerdo|renov|firma|\bfichar|mercado de pases|se marcha|nuevo jugador|oficial:/i;
function isTransferNews(n: Noticia): boolean {
  return TRANSFER_RE.test(`${n.title} ${n.excerpt}`);
}

function toLite(n: Noticia, club: string | null): NoticiaLite {
  return {
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    date: n.date,
    image: n.realImage ?? null,
    isTransfer: isTransferNews(n),
    ts: n.ingestedAt ?? null,
    club,
  };
}

// Orden: más reciente primero (fecha + ingestedAt como desempate).
function byRecency(a: Noticia, b: Noticia): number {
  const d = (b.date || "").localeCompare(a.date || "");
  if (d !== 0) return d;
  return (b.ingestedAt || "").localeCompare(a.ingestedAt || "");
}

export interface PersonalNoticias {
  club: NoticiaLite[];
  league: NoticiaLite[];
  /** Titulares flash (drafts frescos de tu club/liga), más recientes primero. */
  breves: Breve[];
}

/**
 * @param clubNames  nombres de los clubes seguidos por el usuario.
 * @param leagueSlugs slugs de las ligas elegidas (para nombre/short de match).
 */
/** Ventana de frescura de las breves: solo titulares de las últimas 48 h. */
const BREVE_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_BREVES = 10;

export async function getPersonalNoticias(
  clubNames: string[],
  leagueSlugs: string[],
  perBucket = 8,
): Promise<PersonalNoticias> {
  // Términos de liga: alias curados (como escribe la prensa) con fallback a
  // nombre corto + nombre del catálogo.
  const leagueTerms: string[] = [];
  for (const slug of leagueSlugs) {
    const aliases = LEAGUE_ALIASES[slug];
    if (aliases) {
      leagueTerms.push(...aliases);
      continue;
    }
    const c = getCompetition(slug);
    if (!c) continue;
    if (c.short) leagueTerms.push(c.short);
    if (c.name && c.name !== c.short) leagueTerms.push(c.name);
  }
  // Cada club matchea por su nombre completo Y su core de prensa (ver arriba).
  const clubTermPairs: { term: string; name: string }[] = [];
  for (const n of clubNames.filter((x) => x && x.trim().length >= 4)) {
    for (const t of clubMatchTerms(n)) clubTermPairs.push({ term: t, name: n });
  }
  const matchedClub = (hay: string): string | null =>
    clubTermPairs.find((p) => mentions(hay, p.term))?.name ?? null;

  // ── 1) Artículos PUBLICADOS (pipeline editorial completo) ──
  let all: Noticia[] = [];
  try {
    all = await getAllPublicNoticias();
  } catch {
    // fail-soft: seguimos con breves
  }

  const clubOut: NoticiaLite[] = [];
  const leagueOut: NoticiaLite[] = [];
  const usedSlugs = new Set<string>();

  for (const n of [...all].sort(byRecency)) {
    const hay = norm(`${n.title} ${n.excerpt} ${(n.tags || []).join(" ")}`);
    const club = matchedClub(hay);
    if (club) {
      if (clubOut.length < perBucket) { clubOut.push(toLite(n, club)); usedSlugs.add(n.slug); }
      continue;
    }
    if (leagueTerms.some((t) => mentions(hay, t))) {
      if (leagueOut.length < perBucket) { leagueOut.push(toLite(n, null)); usedSlugs.add(n.slug); }
    }
  }

  // ── 2) BREVES: drafts frescos (aún sin publicar) que mencionan tu club/liga ──
  // Publicación rápida: el ingest los trae cada hora; aquí salen en cuanto entran
  // al store, sin esperar reescritura + crítico + cupo diario. Solo en el widget
  // personal; enlazan a la fuente original.
  const breves: Breve[] = [];
  try {
    const store = await readIngestStore();
    const cutoff = Date.now() - BREVE_WINDOW_MS;
    for (const d of store.drafts) {
      if (d.status === "published") continue; // ya sale arriba como artículo
      if (usedSlugs.has(d.slug)) continue;
      const ts = d.ingestedAt ?? (d.date ? `${d.date}T00:00:00.000Z` : null);
      if (!ts) continue;
      const t = Date.parse(ts);
      if (!Number.isFinite(t) || t < cutoff) continue;
      const hay = norm(`${d.title} ${d.excerpt} ${(d.tags || []).join(" ")}`);
      const club = matchedClub(hay);
      const isLeague = !club && leagueTerms.some((x) => mentions(hay, x));
      if (!club && !isLeague) continue;
      breves.push({
        title: d.title,
        source: d.sourceName ?? null,
        // Solo http(s): el href va directo a un <a> — nada de esquemas raros
        // aunque la fuente viniera envenenada.
        url: d.sourceUrl && /^https?:\/\//i.test(d.sourceUrl) ? d.sourceUrl : null,
        ts,
        isTransfer: TRANSFER_RE.test(`${d.title} ${d.excerpt}`),
        club,
      });
    }
    // Más recientes primero; el club por delante de la liga a igual hora exacta
    // no hace falta: la frescura ES la prioridad en un ticker.
    breves.sort((a, b) => b.ts.localeCompare(a.ts));
    breves.length = Math.min(breves.length, MAX_BREVES);
  } catch {
    // fail-soft: sin breves
  }

  return { club: clubOut, league: leagueOut, breves };
}
