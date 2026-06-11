/**
 * News ingest pipeline (Fase 2).
 *
 * Flow:
 *   1. Pull headlines from GNews via configured queries
 *   2. Hash the source URL → drop duplicates that we already have
 *   3. Pick category by keyword + flags by detected country names
 *   4. Pick author with `pickAuthorForArticle` (Carlos / Gabriel only)
 *   5. (Future) call LLM to rewrite headline + body
 *   6. Append to data/noticias-ingested.json (PR-able diff)
 *
 * Los drafts pasan por el rewriter (LLM) y el crítico de calidad; los que
 * superan el corte se publican automáticamente. Cada pieza publicada conserva
 * sourceUrl/sourceName y muestra una nota de transparencia en ArticleView
 * (elaboración con apoyo de IA a partir de la fuente). Las imágenes del medio
 * original NUNCA se almacenan: política de copyright en noticias-image-policy.
 */

import { createHash } from "node:crypto";
import { gnewsSearch, WORLD_CUP_QUERIES, isNonFootballArticle, type GNewsArticle } from "./gnews";
import { allowedNoticiaImageOrUndefined } from "./noticias-image-policy";
import { pickAuthorForArticle } from "@/data/noticias-authors";
import type { Noticia, NoticiaBlock, NoticiaCategory } from "@/data/noticias";
import type { CriticVerdict } from "./noticias-critic";

/* ---------- Helpers ---------- */

const STOPWORDS = new Set([
  "el","la","los","las","de","del","y","o","u","en","a","al","un","una","unos","unas","por","para","con","sin","sobre","es","son","que","se","su","sus","lo","si","no","ya","muy","más","menos","mas","menos",
]);

export function makeSlug(title: string, maxLen = 70): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, maxLen).replace(/-$/, "");
}

export function hashUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

/** Heuristic category mapping from headline + content. */
export function classifyCategory(article: GNewsArticle): NoticiaCategory {
  const haystack = `${article.title} ${article.description}`.toLowerCase();
  if (/lesi[oó]n|baja|operad|recuperaci[oó]n|rotura/.test(haystack)) return "selecciones";
  if (/seleccion|convocator|llamado|nómina|nomina/.test(haystack)) return "selecciones";
  if (/sede|estadio|venue|ciudad/.test(haystack)) return "sedes";
  if (/análisis|analiza|tactica|t[áa]ctico|estrategia/.test(haystack)) return "analisis";
  if (/dato|estad[íi]stica|stats|n[úu]mero|r[eé]cord|history|historia/.test(haystack)) return "datos";
  if (/historia|hist[óo]rico|1986|1994|2002|2010|leyenda/.test(haystack)) return "historia";
  return "selecciones"; // safe default
}

/** Detect ISO country flags from headline (very rough mapping). */
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  ar: ["argentina","albiceleste","messi","mbap","scaloni"],
  br: ["brasil","brazil","canarinha","neymar","rodrygo","vinicius"],
  es: ["españa","spain","la roja","lamine","yamal","de la fuente"],
  fr: ["francia","france","bleus","mbapp","griezmann","zidane"],
  uk: ["inglaterra","england","three lions","bellingham","kane","saka"],
  pt: ["portugal","cristiano","ronaldo","cr7","jota"],
  mx: ["méxico","mexico","tri","aguirre","gimenez"],
  us: ["estados unidos","united states","usa","u.s.","weah","pulisic"],
  de: ["alemania","germany","mannschaft","kimmich","musiala"],
  it: ["italia","italy","azzurri","spalletti","retegui"],
  ma: ["marruecos","morocco","atlas","hakim"],
  jp: ["japón","japan","samurái","mitoma","kubo"],
};

export function detectFlags(article: GNewsArticle): string[] {
  const haystack = `${article.title} ${article.description}`.toLowerCase();
  const flags: string[] = [];
  for (const [iso, kws] of Object.entries(COUNTRY_KEYWORDS)) {
    if (kws.some((k) => haystack.includes(k))) flags.push(iso);
  }
  return flags.slice(0, 3);
}

/* ---------- Builder ---------- */

export interface DraftNoticia extends Omit<Noticia, "id" | "body"> {
  /** Draft is never auto-published; it must go through review */
  status: "draft" | "review" | "published";
  body: NoticiaBlock[];
  sourceUrlHash: string;
  /** Timestamp ISO de cuándo entró al sistema. Se usa como tiebreaker
   *  cuando dos noticias comparten `date` (es común con GNews porque trunca
   *  a YYYY-MM-DD). Las más recientes deben aparecer arriba. */
  ingestedAt?: string;
  /** Veredicto del crítico de calidad (Fase 1). Se guarda para auditoría
   *  y para poder re-evaluar/limpiar drafts existentes. */
  critic?: CriticVerdict;
  /** Marca de recuperación histórica (backfill). Cuando es true, el draft
   *  proviene de una ventana de fechas pasada y su `ingestedAt` se fijó a la
   *  fecha REAL de publicación del medio (no "ahora"). Las fases de reescritura
   *  NO deben refrescar su ingestedAt, para que la pieza aparezca en su día
   *  real en el feed y no todas hoy. */
  backfilled?: boolean;
}

/**
 * Convert a raw GNews article into a draft Noticia (stub rewrite).
 *
 * `ingestedAtOverride` permite el backfill histórico: fija `ingestedAt` a la
 * fecha real del medio (publishedAt) en vez de "ahora", para que la pieza se
 * ordene por su día real en el feed.
 */
export function buildDraftFromGNews(
  article: GNewsArticle,
  seed = 0,
  ingestedAtOverride?: string,
): DraftNoticia {
  const cat = classifyCategory(article);
  const flags = detectFlags(article);
  const author = pickAuthorForArticle({ cat, flags, seed });
  const slug = makeSlug(article.title);
  const date = article.publishedAt.slice(0, 10);

  const excerpt = article.description?.slice(0, 280) || article.title;
  const body: NoticiaBlock[] = [
    { type: "p", text: article.description || article.title },
  ];
  if (article.content) {
    // GNews returns content truncated; split by newlines if any
    const paragraphs = article.content
      .replace(/\[\+\d+\s*chars\]$/, "")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    paragraphs.forEach((p) => body.push({ type: "p", text: p }));
  }
  body.push({
    type: "callout",
    title: "Fuente",
    text: `Información publicada originalmente por ${article.source.name}. Reescrita y editada por la redacción de ZonaMundial.`,
  });

  return {
    slug,
    title: article.title,
    excerpt,
    cat,
    date,
    updatedAt: date,
    readTime: Math.max(2, Math.round(body.length * 1.2)),
    flags,
    tags: [],
    featured: false,
    // Política de copyright: la imagen del medio (article.image) es material
    // con derechos servido desde su CDN — no se almacena. Solo pasaría una
    // URL de fuente licenciada (ver noticias-image-policy), que GNews no da.
    realImage: allowedNoticiaImageOrUndefined(article.image),
    imageCaption: allowedNoticiaImageOrUndefined(article.image) ? article.title : undefined,
    imageSource: allowedNoticiaImageOrUndefined(article.image) ? article.source.name : undefined,
    authorId: author.id,
    body,
    sourceUrl: article.url,
    sourceName: article.source.name,
    status: "draft",
    sourceUrlHash: hashUrl(article.url),
    ingestedAt: ingestedAtOverride ?? new Date().toISOString(),
    ...(ingestedAtOverride ? { backfilled: true } : {}),
  };
}

/* ---------- Pipeline entry point ---------- */

export interface IngestResult {
  fetched: number;
  drafts: DraftNoticia[];
  duplicates: number;
  errors: string[];
}

/**
 * Genera una "huella" del título para detectar artículos que cuentan la
 * MISMA noticia con redacción distinta (diferentes medios suelen titular
 * casi igual: "Portugal convoca a Cristiano para el Mundial 2026" vs
 * "Cristiano Ronaldo en la convocatoria de Portugal").
 *
 * Estrategia: normaliza (lowercase, sin tildes, sin signos), descarta stop-
 * words muy comunes y devuelve un set ordenado de tokens significativos
 * concatenados. Comparte huella ⇒ misma noticia.
 */
const STOP_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
  "a", "en", "por", "para", "con", "sin", "sobre", "tras", "ante", "bajo",
  "y", "o", "u", "e", "ni", "que", "se", "su", "sus", "lo", "le", "les",
  "es", "son", "ser", "fue", "fueron", "ha", "han", "hay", "como", "mas",
  "ya", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "the", "of", "to", "and", "in", "for", "on", "at", "with",
]);

export function titleFingerprint(title: string): string {
  if (!title) return "";
  const cleaned = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ") // strip punctuation/quotes
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned
    .split(" ")
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
    .sort();
  // Reduce a max 8 tokens — suficiente firma sin ser frágil a una sola palabra
  return Array.from(new Set(tokens)).slice(0, 8).join("|");
}

export async function ingestNews(opts: {
  /** Already-known URL hashes (to skip duplicates) */
  knownHashes: Set<string>;
  /** Already-known title fingerprints (to skip same-story-different-source) */
  knownFingerprints?: Set<string>;
  /** Which queries to run (defaults to general) */
  queries?: (keyof typeof WORLD_CUP_QUERIES)[];
  /** Max articles per query (1-10 on free tier) */
  maxPerQuery?: number;
  /** Ventana de fechas (ISO 8601). Para backfill histórico. GNews Free cubre
   *  hasta 30 días atrás. */
  from?: string;
  to?: string;
  /** Si true, `ingestedAt` de cada draft = publishedAt REAL del medio (no
   *  "ahora"). Se usa en backfill para que la pieza caiga en su día real. */
  useRealDateAsIngestedAt?: boolean;
}): Promise<IngestResult> {
  const {
    knownHashes,
    knownFingerprints = new Set<string>(),
    queries = ["general"],
    maxPerQuery = 10,
    from,
    to,
    useRealDateAsIngestedAt = false,
  } = opts;
  const result: IngestResult = { fetched: 0, drafts: [], duplicates: 0, errors: [] };

  for (let q_i = 0; q_i < queries.length; q_i++) {
    const queryKey = queries[q_i];
    const q = WORLD_CUP_QUERIES[queryKey];
    try {
      const resp = await gnewsSearch({ q, lang: "es", max: maxPerQuery, from, to });
      result.fetched += resp.articles.length;
      resp.articles.forEach((a, i) => {
        // Drop non-football "Copa del Mundo" articles (cycling, rugby, etc.)
        if (isNonFootballArticle(a)) {
          result.duplicates += 1; // count as filtered out
          return;
        }
        // Drop articles without a usable image — UX policy: every published
        // article needs a hero image.
        if (!a.image) {
          return;
        }
        const hash = hashUrl(a.url);
        if (knownHashes.has(hash)) {
          result.duplicates += 1;
          return;
        }
        // Dedup por título (misma noticia, distinta fuente).
        const fp = titleFingerprint(a.title);
        if (fp && knownFingerprints.has(fp)) {
          result.duplicates += 1;
          return;
        }
        knownHashes.add(hash);
        if (fp) knownFingerprints.add(fp);
        result.drafts.push(
          buildDraftFromGNews(a, i, useRealDateAsIngestedAt ? a.publishedAt : undefined),
        );
      });
    } catch (err) {
      result.errors.push(`[${queryKey}] ${(err as Error).message}`);
    }
    // Throttle between queries to avoid GNews rate limit (free tier ~1/sec)
    if (q_i < queries.length - 1) {
      await new Promise((r) => setTimeout(r, 1100));
    }
  }
  return result;
}
