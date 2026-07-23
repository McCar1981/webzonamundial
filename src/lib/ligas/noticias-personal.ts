// src/lib/ligas/noticias-personal.ts
//
// Noticias PERSONALIZADAS para Zona de Ligas. Prioridad del usuario:
//   1º  noticias de su(s) CLUB(es) elegido(s)
//   2º  noticias importantes de su(s) LIGA(s) elegida(s) (que no sean ya de club)
// Además marca las de FICHAJES/MERCADO (no hay categoría para ello: se detecta
// por palabras clave). Como las noticias no traen etiqueta estructurada de
// club/liga, el emparejamiento es por TEXTO (título + entradilla + tags), igual
// que ya hace la tarjeta "Mi club". Genérico: sirve para cualquier club/liga.

import { getAllPublicNoticias } from "@/lib/noticias-store";
import { getCompetition } from "@/data/competitions";
import type { Noticia } from "@/data/noticias";

export interface NoticiaLite {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string | null;
  isTransfer: boolean;
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

const TRANSFER_RE = /fichaj|traspas|refuerz|\bcede\b|cesion|prestam|acuerdo|renov|firma|\bfichar|mercado de pases|se marcha|nuevo jugador|oficial:/i;
function isTransferNews(n: Noticia): boolean {
  return TRANSFER_RE.test(`${n.title} ${n.excerpt}`);
}

function toLite(n: Noticia): NoticiaLite {
  return { slug: n.slug, title: n.title, excerpt: n.excerpt, date: n.date, image: n.realImage ?? null, isTransfer: isTransferNews(n) };
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
}

/**
 * @param clubNames  nombres de los clubes seguidos por el usuario.
 * @param leagueSlugs slugs de las ligas elegidas (para nombre/short de match).
 */
export async function getPersonalNoticias(
  clubNames: string[],
  leagueSlugs: string[],
  perBucket = 8,
): Promise<PersonalNoticias> {
  let all: Noticia[];
  try {
    all = await getAllPublicNoticias();
  } catch {
    return { club: [], league: [] };
  }
  if (!all.length) return { club: [], league: [] };

  // Términos de liga: nombre corto + nombre (p.ej. "LaLiga", "Liga MX",
  // "Libertadores", "Champions"). Distintivos, precisos.
  const leagueTerms: string[] = [];
  for (const slug of leagueSlugs) {
    const aliases = LEAGUE_ALIASES[slug];
    if (aliases) {
      leagueTerms.push(...aliases);
      continue;
    }
    // Fallback para ligas sin alias curado: nombre corto + nombre completo.
    const c = getCompetition(slug);
    if (!c) continue;
    if (c.short) leagueTerms.push(c.short);
    if (c.name && c.name !== c.short) leagueTerms.push(c.name);
  }
  const clubs = clubNames.filter((n) => n && n.trim().length >= 4);

  const clubOut: Noticia[] = [];
  const leagueOut: Noticia[] = [];
  const usedClub = new Set<string>();

  for (const n of [...all].sort(byRecency)) {
    const hay = norm(`${n.title} ${n.excerpt} ${(n.tags || []).join(" ")}`);
    if (clubs.some((c) => mentions(hay, c))) {
      if (clubOut.length < perBucket) { clubOut.push(n); usedClub.add(n.slug); }
      continue;
    }
    if (leagueTerms.some((t) => mentions(hay, t)) && !usedClub.has(n.slug)) {
      if (leagueOut.length < perBucket) leagueOut.push(n);
    }
  }

  return { club: clubOut.map(toLite), league: leagueOut.map(toLite) };
}
