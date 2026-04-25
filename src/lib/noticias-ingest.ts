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
 * The current implementation does steps 1-4 + 6 with a *stub* rewrite that
 * just composes excerpt from the source description (clearly marked as draft
 * and never auto-published until human review).
 */

import { createHash } from "node:crypto";
import { gnewsSearch, WORLD_CUP_QUERIES, isNonFootballArticle, type GNewsArticle } from "./gnews";
import { pickAuthorForArticle } from "@/data/noticias-authors";
import type { Noticia, NoticiaBlock, NoticiaCategory } from "@/data/noticias";

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
}

/** Convert a raw GNews article into a draft Noticia (stub rewrite). */
export function buildDraftFromGNews(article: GNewsArticle, seed = 0): DraftNoticia {
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
    realImage: article.image || undefined,
    imageCaption: article.title,
    imageSource: article.source.name,
    authorId: author.id,
    body,
    sourceUrl: article.url,
    sourceName: article.source.name,
    status: "draft",
    sourceUrlHash: hashUrl(article.url),
  };
}

/* ---------- Pipeline entry point ---------- */

export interface IngestResult {
  fetched: number;
  drafts: DraftNoticia[];
  duplicates: number;
  errors: string[];
}

export async function ingestNews(opts: {
  /** Already-known URL hashes (to skip duplicates) */
  knownHashes: Set<string>;
  /** Which queries to run (defaults to general) */
  queries?: (keyof typeof WORLD_CUP_QUERIES)[];
  /** Max articles per query (1-10 on free tier) */
  maxPerQuery?: number;
}): Promise<IngestResult> {
  const { knownHashes, queries = ["general"], maxPerQuery = 10 } = opts;
  const result: IngestResult = { fetched: 0, drafts: [], duplicates: 0, errors: [] };

  for (let q_i = 0; q_i < queries.length; q_i++) {
    const queryKey = queries[q_i];
    const q = WORLD_CUP_QUERIES[queryKey];
    try {
      const resp = await gnewsSearch({ q, lang: "es", max: maxPerQuery });
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
        knownHashes.add(hash);
        result.drafts.push(buildDraftFromGNews(a, i));
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
